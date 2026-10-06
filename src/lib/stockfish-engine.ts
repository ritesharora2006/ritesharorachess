import type { GameState, Move } from './moves';
import { getAllLegalMoves } from './moves';
import type { PieceType, Square } from './chess-types';
import { squareToAlgebraic, algebraicToSquare } from './chess-types';

/**
 * Standard FEN generator conforming strictly to FEN / UCI specification.
 */
export function toStandardFEN(state: GameState): string {
  const rows: string[] = [];

  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    let rowStr = '';

    for (let f = 0; f < 8; f++) {
      const piece = state.board[r * 8 + f];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const char = piece.type === 'knight' ? 'N' : piece.type[0].toUpperCase();
        rowStr += piece.color === 'white' ? char : char.toLowerCase();
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    rows.push(rowStr);
  }

  const piecePlacement = rows.join('/');
  const activeColor = state.turn === 'white' ? 'w' : 'b';

  // Strict castling availability check:
  // King and corresponding rook must be in original starting squares
  let castling = '';
  if (
    state.whiteKingside &&
    state.board[60]?.type === 'king' &&
    state.board[60]?.color === 'white' &&
    state.board[63]?.type === 'rook' &&
    state.board[63]?.color === 'white'
  ) {
    castling += 'K';
  }
  if (
    state.whiteQueenside &&
    state.board[60]?.type === 'king' &&
    state.board[60]?.color === 'white' &&
    state.board[56]?.type === 'rook' &&
    state.board[56]?.color === 'white'
  ) {
    castling += 'Q';
  }
  if (
    state.blackKingside &&
    state.board[4]?.type === 'king' &&
    state.board[4]?.color === 'black' &&
    state.board[7]?.type === 'rook' &&
    state.board[7]?.color === 'black'
  ) {
    castling += 'k';
  }
  if (
    state.blackQueenside &&
    state.board[4]?.type === 'king' &&
    state.board[4]?.color === 'black' &&
    state.board[0]?.type === 'rook' &&
    state.board[0]?.color === 'black'
  ) {
    castling += 'q';
  }
  if (castling === '') {
    castling = '-';
  }

  const ep = state.epSquare !== null ? squareToAlgebraic(state.epSquare) : '-';
  const halfmove = state.halfmoveClock ?? 0;
  const fullmove = state.fullmoveNumber ?? 1;

  return `${piecePlacement} ${activeColor} ${castling} ${ep} ${halfmove} ${fullmove}`;
}

/**
 * Converts UCI move string (e.g. e2e4, e7e8q) to structured Move object.
 */
export function parseUciMove(uci: string): { from: Square; to: Square; promotion?: PieceType } | null {
  if (!uci || uci.length < 4 || uci === '(none)') return null;

  const fromSq = algebraicToSquare(uci.slice(0, 2));
  const toSq = algebraicToSquare(uci.slice(2, 4));

  if (fromSq === null || toSq === null) return null;

  let promotion: PieceType | undefined;
  if (uci.length >= 5) {
    const pChar = uci[4].toLowerCase();
    switch (pChar) {
      case 'q':
        promotion = 'queen';
        break;
      case 'r':
        promotion = 'rook';
        break;
      case 'b':
        promotion = 'bishop';
        break;
      case 'n':
        promotion = 'knight';
        break;
    }
  }

  return { from: fromSq, to: toSq, promotion };
}

/**
 * Maps a UCI move string (e.g. "e7e5", "e8g8", "e7e8q") to a verified legal Move in the given GameState.
 */
export function uciToLegalMove(state: GameState, uci: string): Move | null {
  const parsed = parseUciMove(uci);
  if (!parsed) return null;

  const legalMoves = getAllLegalMoves(state);
  const found = legalMoves.find(
    (m) =>
      m.from === parsed.from &&
      m.to === parsed.to &&
      (!m.promotion || !parsed.promotion || m.promotion === parsed.promotion)
  );

  return found ?? null;
}

export interface EngineSearchOptions {
  skillLevel: number;
  maxDepth: number;
  movetimeMs: number;
}

export interface PositionEvaluation {
  bestMove: string | null;
  scoreCp: number; // in centipawns from the perspective of the side to move
  mate?: number;
}

class StockfishManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private isReady = false;
  private currentRequestId = 0;
  private currentResolve: ((move: string | null) => void) | null = null;
  private currentEvalResolve: ((res: PositionEvaluation) => void) | null = null;
  private lastScoreCp = 0;
  private lastMate: number | undefined = undefined;
  private safetyTimer: NodeJS.Timeout | null = null;
  private hasWasmFailed = false;

  constructor() {
    // Lazily initialized in browser
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Worker !== 'undefined';
  }

  private initWorker(): boolean {
    if (!this.isSupported()) return false;
    if (this.worker) return true;

    try {
      const wasmSupported =
        !this.hasWasmFailed &&
        typeof WebAssembly === 'object' &&
        typeof WebAssembly.validate === 'function';

      const scriptPath = wasmSupported
        ? '/engine/stockfish.wasm.js'
        : '/engine/stockfish.js';

      this.worker = new Worker(scriptPath);

      this.worker.onerror = (err) => {
        console.warn('Stockfish worker error, falling back to JS build:', err);
        this.cleanup();
        if (wasmSupported && !this.hasWasmFailed) {
          this.hasWasmFailed = true;
          this.initWorker();
        }
      };

      this.worker.onmessage = (event: MessageEvent) => {
        this.handleMessage(String(event.data || ''));
      };

      // Initialize UCI
      this.worker.postMessage('uci');
      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn('Failed to initialize Stockfish Web Worker:', e);
      this.cleanup();
      return false;
    }
  }

  private handleMessage(line: string) {
    const trimmed = line.trim();

    if (trimmed === 'uciok') {
      if (this.worker) {
        this.worker.postMessage('setoption name Hash value 32');
        this.worker.postMessage('isready');
      }
    } else if (trimmed === 'readyok') {
      this.isReady = true;
    } else if (trimmed.startsWith('info ') && trimmed.includes('score ')) {
      const matchCp = trimmed.match(/score cp (-?\d+)/);
      if (matchCp) {
        this.lastScoreCp = parseInt(matchCp[1], 10);
        this.lastMate = undefined;
      }
      const matchMate = trimmed.match(/score mate (-?\d+)/);
      if (matchMate) {
        this.lastMate = parseInt(matchMate[1], 10);
        this.lastScoreCp = this.lastMate > 0 ? 10000 : -10000;
      }
    } else if (trimmed.startsWith('bestmove')) {
      if (this.safetyTimer) {
        clearTimeout(this.safetyTimer);
        this.safetyTimer = null;
      }

      const parts = trimmed.split(/\s+/);
      const move = parts[1] && parts[1] !== '(none)' ? parts[1] : null;

      if (this.currentEvalResolve) {
        const resolve = this.currentEvalResolve;
        this.currentEvalResolve = null;
        resolve({
          bestMove: move,
          scoreCp: this.lastScoreCp,
          mate: this.lastMate,
        });
      }

      if (this.currentResolve) {
        const resolve = this.currentResolve;
        this.currentResolve = null;
        resolve(move);
      }
    }
  }

  public cancelSearch() {
    this.currentRequestId++;
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    if (this.worker) {
      try {
        this.worker.postMessage('stop');
      } catch {}
    }

    if (this.currentEvalResolve) {
      const resolve = this.currentEvalResolve;
      this.currentEvalResolve = null;
      resolve({ bestMove: null, scoreCp: 0 });
    }

    if (this.currentResolve) {
      const resolve = this.currentResolve;
      this.currentResolve = null;
      resolve(null);
    }
  }

  public async evaluate(
    fen: string,
    depth: number = 10,
    movetimeMs: number = 250,
    signal?: AbortSignal
  ): Promise<PositionEvaluation> {
    if (!this.initWorker() || !this.worker) {
      return { bestMove: null, scoreCp: 0 };
    }

    this.cancelSearch();
    const requestId = ++this.currentRequestId;
    this.lastScoreCp = 0;
    this.lastMate = undefined;

    if (signal?.aborted) {
      return { bestMove: null, scoreCp: 0 };
    }

    return new Promise<PositionEvaluation>((resolve) => {
      const onAbort = () => {
        if (this.currentRequestId === requestId) {
          this.cancelSearch();
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      this.currentEvalResolve = (res) => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        if (this.currentRequestId === requestId) {
          resolve(res);
        } else {
          resolve({ bestMove: null, scoreCp: 0 });
        }
      };

      try {
        this.worker!.postMessage('setoption name Skill Level value 20');
        this.worker!.postMessage(`position fen ${fen}`);
        this.worker!.postMessage(`go depth ${depth} movetime ${movetimeMs}`);

        this.safetyTimer = setTimeout(() => {
          if (this.currentRequestId === requestId && this.worker) {
            try {
              this.worker.postMessage('stop');
            } catch {}
          }
        }, movetimeMs + 350);
      } catch (e) {
        console.warn('Error evaluating FEN with Stockfish:', e);
        this.cancelSearch();
      }
    });
  }

  public async search(
    fen: string,
    options: EngineSearchOptions,
    signal?: AbortSignal
  ): Promise<string | null> {
    if (!this.initWorker() || !this.worker) {
      return null;
    }

    // Cancel any previous search cleanly
    this.cancelSearch();

    const requestId = ++this.currentRequestId;

    if (signal?.aborted) {
      return null;
    }

    return new Promise<string | null>((resolve) => {
      const onAbort = () => {
        if (this.currentRequestId === requestId) {
          this.cancelSearch();
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      this.currentResolve = (move) => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        if (this.currentRequestId === requestId) {
          resolve(move);
        } else {
          resolve(null);
        }
      };

      try {
        this.worker!.postMessage(`setoption name Skill Level value ${options.skillLevel}`);
        this.worker!.postMessage(`position fen ${fen}`);
        this.worker!.postMessage(`go movetime ${options.movetimeMs} depth ${options.maxDepth}`);

        // Safety timeout in case engine takes slightly longer than movetime
        this.safetyTimer = setTimeout(() => {
          if (this.currentRequestId === requestId && this.worker) {
            try {
              this.worker.postMessage('stop');
            } catch {}
          }
        }, options.movetimeMs + 300);
      } catch (e) {
        console.warn('Error posting message to Stockfish worker:', e);
        this.cancelSearch();
      }
    });
  }

  public cleanup() {
    this.cancelSearch();
    if (this.worker) {
      try {
        this.worker.postMessage('quit');
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
    this.isInitialized = false;
    this.isReady = false;
  }
}

export const stockfishEngine = new StockfishManager();
