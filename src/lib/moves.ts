import type { Color, Piece, PieceType, Square } from './chess-types';
import type { Board } from './board-state';

// ---------- coordinate helpers ----------
function sqRank(sq: number) { return Math.floor(sq / 8); }
function sqFile(sq: number) { return sq % 8; }
function makeSq(rank: number, file: number) { return rank * 8 + file; }
function isInBounds(r: number, f: number) { return r >= 0 && r < 8 && f >= 0 && f < 8; }

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

export interface GameState {
  board: Board;
  turn: Color;
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
  epSquare: number | null; // en passant target square, or null
  halfmoveClock: number;
  fullmoveNumber: number;
}

export function cloneBoard(board: Board): Board {
  return board.map((p) => (p ? { ...p } : null));
}

export function createInitialState(): GameState {
  const board: Board = new Array(64).fill(null);
  const setup = (row: number[], rank: number) =>
    row.forEach((code, f) => {
      if (code) board[makeSq(rank, f)] = codeToPiece(code);
    });
  // white pieces: positive, black: negative
  // 1=wr,2=wn,3=wb,4=wq,5=wk,6=wp
  // -1=br,-2=bn,-3=bb,-4=bq,-5=bk,-6=bp
  setup([-1,-2,-3,-4,-5,-3,-2,-1], 0); // rank 0 (8th rank)
  setup([-6,-6,-6,-6,-6,-6,-6,-6], 1); // rank 1 (7th rank)
  setup([6,6,6,6,6,6,6,6], 6); // rank 6 (2nd rank)
  setup([1,2,3,4,5,3,2,1], 7); // rank 7 (1st rank)
  return { board, turn: 'white', whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true, epSquare: null, halfmoveClock: 0, fullmoveNumber: 1 };
}

// Piece codes: negative = black, positive = white
// 1=wr,2=wn,3=wb,4=wq,5=wk,6=wp
// -1=br,-2=bn,-3=bb,-4=bq,-5=bk,-6=bp
function codeToPiece(code: number): Piece {
  const color: Color = code > 0 ? 'white' : 'black';
  const pieceTypeMap: Record<number, PieceType> = { 1: 'rook', 2: 'knight', 3: 'bishop', 4: 'queen', 5: 'king', 6: 'pawn', [-1]: 'rook', [-2]: 'knight', [-3]: 'bishop', [-4]: 'queen', [-5]: 'king', [-6]: 'pawn' };
  const t = pieceTypeMap[Math.abs(code)];
  if (!t) throw new Error(`Unknown piece code: ${code}`);
  return { type: t, color };
}

function isEnemy(a: Piece | null, b: Color) { return a !== null && a.color !== b; }
function isAlly(a: Piece | null, b: Color) { return a !== null && a.color === b; }

function rookDirs() { return [[0,1],[0,-1],[1,0],[-1,0]]; }
function bishopDirs() { return [[1,1],[1,-1],[-1,1],[-1,-1]]; }
function knightJumps() { return [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]; }

function addSlide(sq: Square, dirs: number[][], board: Board, color: Color, moves: Move[], captureOnly: boolean = false) {
  for (const [dr, df] of dirs) {
    let r = sqRank(sq) + dr, f = sqFile(sq) + df;
    while (isInBounds(r, f)) {
      const s = makeSq(r, f), p = board[s];
      if (isAlly(p, color)) break;
      if (!captureOnly || p !== null) {
        moves.push({ from: sq, to: s });
      }
      if (p !== null) break; // stop after first piece (capture or block)
      r += dr; f += df;
    }
  }
}

function addJumps(sq: Square, jumps: number[][], board: Board, color: Color, moves: Move[]) {
  for (const [dr, df] of jumps) {
    const r = sqRank(sq) + dr, f = sqFile(sq) + df;
    if (!isInBounds(r, f)) continue;
    const s = makeSq(r, f), p = board[s];
    if (isAlly(p, color)) continue;
    moves.push({ from: sq, to: s });
  }
}

export function getPseudoLegalMoves(state: GameState, sq: Square): Move[] {
  const { board, turn } = state;
  const piece = board[sq];
  if (!piece || piece.color !== turn) return [];
  const r = sqRank(sq), f = sqFile(sq), moves: Move[] = [];

  switch (piece.type) {
    case 'pawn': {
      const dir = turn === 'white' ? -1 : 1;
      const startRank = turn === 'white' ? 6 : 1;

      const oneStep = r + dir;
      const oneStepSq = makeSq(oneStep, f);
      if (isInBounds(oneStep, f) && !board[oneStepSq]) {
        if (oneStep === 0 || oneStep === 7) {
          for (const t of ['queen', 'rook', 'bishop', 'knight'] as PieceType[]) {
            moves.push({ from: sq, to: oneStepSq, promotion: t });
          }
        } else {
          moves.push({ from: sq, to: oneStepSq });
        }

        const twoStep = r + dir * 2;
        if (r === startRank && isInBounds(twoStep, f) && !board[makeSq(twoStep, f)]) {
          moves.push({ from: sq, to: makeSq(twoStep, f) });
        }
      }

      for (const df of [-1, 1]) {
        const r2 = r + dir, f2 = f + df;
        if (!isInBounds(r2, f2)) continue;
        const s = makeSq(r2, f2);
        const p = board[s];

        if (isEnemy(p, turn)) {
          if (r2 === 0 || r2 === 7) {
            for (const t of ['queen', 'rook', 'bishop', 'knight'] as PieceType[]) {
              moves.push({ from: sq, to: s, promotion: t });
            }
          } else {
            moves.push({ from: sq, to: s });
          }
        }

        if (s === state.epSquare) {
          const capturedPawnSq = s + (turn === 'white' ? 8 : -8);
          if (isEnemy(board[capturedPawnSq], turn)) {
            moves.push({ from: sq, to: s });
          }
        }
      }
      break;
    }
    case 'rook': addSlide(sq, rookDirs(), board, turn, moves); break;
    case 'bishop': addSlide(sq, bishopDirs(), board, turn, moves); break;
    case 'queen': addSlide(sq, [...rookDirs(), ...bishopDirs()], board, turn, moves); break;
    case 'knight': addJumps(sq, knightJumps(), board, turn, moves); break;
    case 'king': {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      addJumps(sq, dirs, board, turn, moves);
      // Castling
      if (turn === 'white' && sq === 60 && !isKingInCheck(board, 'white')) {
        // Kingside (e1 to g1): rook at h1 (63)
        if (state.whiteKingside && board[63]?.type === 'rook' && board[63]?.color === 'white' && !board[61] && !board[62]) {
          // Check if king passes through or ends up in check
          const b1 = cloneBoard(board);
          b1[60] = null; b1[61] = { type: 'king', color: 'white' };
          if (!isKingInCheck(b1, 'white')) {
            const b2 = cloneBoard(board);
            b2[60] = null; b2[62] = { type: 'king', color: 'white' };
            if (!isKingInCheck(b2, 'white')) {
              moves.push({ from: 60, to: 62 });
            }
          }
        }
        // Queenside (e1 to c1): rook at a1 (56)
        if (state.whiteQueenside && board[56]?.type === 'rook' && board[56]?.color === 'white' && !board[59] && !board[58] && !board[57]) {
          const b1 = cloneBoard(board);
          b1[60] = null; b1[59] = { type: 'king', color: 'white' };
          if (!isKingInCheck(b1, 'white')) {
            const b2 = cloneBoard(board);
            b2[60] = null; b2[58] = { type: 'king', color: 'white' };
            if (!isKingInCheck(b2, 'white')) {
              moves.push({ from: 60, to: 58 });
            }
          }
        }
      }
      if (turn === 'black' && sq === 4 && !isKingInCheck(board, 'black')) {
        // Kingside (e8 to g8): rook at h8 (7)
        if (state.blackKingside && board[7]?.type === 'rook' && board[7]?.color === 'black' && !board[5] && !board[6]) {
          const b1 = cloneBoard(board);
          b1[4] = null; b1[5] = { type: 'king', color: 'black' };
          if (!isKingInCheck(b1, 'black')) {
            const b2 = cloneBoard(board);
            b2[4] = null; b2[6] = { type: 'king', color: 'black' };
            if (!isKingInCheck(b2, 'black')) {
              moves.push({ from: 4, to: 6 });
            }
          }
        }
        // Queenside (e8 to c8): rook at a8 (0)
        if (state.blackQueenside && board[0]?.type === 'rook' && board[0]?.color === 'black' && !board[3] && !board[2] && !board[1]) {
          const b1 = cloneBoard(board);
          b1[4] = null; b1[3] = { type: 'king', color: 'black' };
          if (!isKingInCheck(b1, 'black')) {
            const b2 = cloneBoard(board);
            b2[4] = null; b2[2] = { type: 'king', color: 'black' };
            if (!isKingInCheck(b2, 'black')) {
              moves.push({ from: 4, to: 2 });
            }
          }
        }
      }
      break;
    }
  }
  return moves;
}

function findKing(board: Board, color: Color): number {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p?.type === 'king' && p.color === color) return i;
  }
  return -1;
}

function isSquareAttacked(board: Board, sq: number, byColor: Color): boolean {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.color !== byColor) continue;
    const r = sqRank(i), f = sqFile(i);
    switch (p.type) {
      case 'pawn': {
        const dir = byColor === 'white' ? -1 : 1;
        const r2 = sqRank(sq), f2 = sqFile(sq);
        if (r2 === r + dir && (f2 === f - 1 || f2 === f + 1)) return true;
        break;
      }
      case 'knight':
        for (const [dr, df] of knightJumps()) {
          const nr = r + dr, nf = f + df;
          if (isInBounds(nr, nf) && makeSq(nr, nf) === sq) return true;
        }
        break;
      case 'bishop':
        for (const [dr, df] of bishopDirs()) {
          let nr = r + dr, nf = f + df;
          while (isInBounds(nr, nf)) {
            const s = makeSq(nr, nf);
            if (s === sq) return true;
            if (board[s]) break;
            nr += dr; nf += df;
          }
        }
        break;
      case 'rook':
        for (const [dr, df] of rookDirs()) {
          let nr = r + dr, nf = f + df;
          while (isInBounds(nr, nf)) {
            const s = makeSq(nr, nf);
            if (s === sq) return true;
            if (board[s]) break;
            nr += dr; nf += df;
          }
        }
        break;
      case 'queen':
        for (const [dr, df] of [...rookDirs(), ...bishopDirs()]) {
          let nr = r + dr, nf = f + df;
          while (isInBounds(nr, nf)) {
            const s = makeSq(nr, nf);
            if (s === sq) return true;
            if (board[s]) break;
            nr += dr; nf += df;
          }
        }
        break;
      case 'king': {
        for (const [dr, df] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
          const nr = r + dr, nf = f + df;
          if (isInBounds(nr, nf) && makeSq(nr, nf) === sq) return true;
        }
        break;
      }
    }
  }
  return false;
}

export function isKingInCheck(board: Board, color: Color): boolean {
  const kingSq = findKing(board, color);
  if (kingSq === -1) return false;
  return isSquareAttacked(board, kingSq, color === 'white' ? 'black' : 'white');
}

export function getLegalMovesForSquare(state: GameState, sq: Square): Move[] {
  return getPseudoLegalMoves(state, sq).filter((m) => {
    const nb = applyMoveRaw(state.board, m, state.epSquare);
    return !isKingInCheck(nb, state.turn);
  });
}

export function getAllLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let sq = 0; sq < 64; sq++) {
    if (state.board[sq]?.color === state.turn) {
      moves.push(...getLegalMovesForSquare(state, sq));
    }
  }
  return moves;
}

export function applyMoveRaw(board: Board, move: Move, epSquare: number | null = null): Board {
  const nb = cloneBoard(board);
  const { from, to, promotion } = move;
  const piece = nb[from];
  if (!piece) return nb;
  nb[from] = null;
  nb[to] = promotion ? { type: promotion, color: piece.color } : { ...piece };

  // En passant capture
  if (piece.type === 'pawn' && to === epSquare) {
    const captureSquare = to + (piece.color === 'white' ? 8 : -8);
    nb[captureSquare] = null;
  }

  // Castling rook move
  if (piece.type === 'king' && Math.abs(to - from) === 2) {
    if (to === 62) { nb[61] = nb[63]; nb[63] = null; }
    if (to === 58) { nb[59] = nb[56]; nb[56] = null; }
    if (to === 6) { nb[5] = nb[7]; nb[7] = null; }
    if (to === 2) { nb[3] = nb[0]; nb[0] = null; }
  }

  return nb;
}

export function applyMove(state: GameState, move: Move): GameState {
  const nb = cloneBoard(state.board);
  const { from, to, promotion } = move;
  const piece = nb[from]!;
  const isCapture = state.board[to] !== null || (piece.type === 'pawn' && to === state.epSquare);

  nb[from] = null;
  nb[to] = promotion ? { type: promotion, color: piece.color } : { ...piece };

  // En passant capture
  if (piece.type === 'pawn' && to === state.epSquare) {
    const captureSquare = to + (piece.color === 'white' ? 8 : -8);
    nb[captureSquare] = null;
  }

  // Castling rook move
  if (piece.type === 'king' && Math.abs(to - from) === 2) {
    if (to === 62) { // white kingside (e1 to g1): h1 rook to f1
      nb[61] = nb[63]; nb[63] = null;
    }
    if (to === 58) { // white queenside (e1 to c1): a1 rook to d1
      nb[59] = nb[56]; nb[56] = null;
    }
    if (to === 6) { // black kingside (e8 to g8): h8 rook to f8
      nb[5] = nb[7]; nb[7] = null;
    }
    if (to === 2) { // black queenside (e8 to c8): a8 rook to d8
      nb[3] = nb[0]; nb[0] = null;
    }
  }

  const next = state.turn === 'white' ? 'black' : 'white';
  const ep = piece.type === 'pawn' && Math.abs(to - from) === 16
    ? to + (piece.color === 'white' ? 8 : -8) : null;

  // Update castling rights
  const whiteKingside = state.whiteKingside && !(piece.type === 'king' && piece.color === 'white') && !(piece.type === 'rook' && piece.color === 'white' && from === 63) && !(state.board[to]?.type === 'rook' && state.board[to]?.color === 'white' && to === 63);
  const whiteQueenside = state.whiteQueenside && !(piece.type === 'king' && piece.color === 'white') && !(piece.type === 'rook' && piece.color === 'white' && from === 56) && !(state.board[to]?.type === 'rook' && state.board[to]?.color === 'white' && to === 56);
  const blackKingside = state.blackKingside && !(piece.type === 'king' && piece.color === 'black') && !(piece.type === 'rook' && piece.color === 'black' && from === 7) && !(state.board[to]?.type === 'rook' && state.board[to]?.color === 'black' && to === 7);
  const blackQueenside = state.blackQueenside && !(piece.type === 'king' && piece.color === 'black') && !(piece.type === 'rook' && piece.color === 'black' && from === 0) && !(state.board[to]?.type === 'rook' && state.board[to]?.color === 'black' && to === 0);

  return {
    board: nb,
    turn: next,
    whiteKingside,
    whiteQueenside,
    blackKingside,
    blackQueenside,
    epSquare: ep,
    halfmoveClock: piece.type === 'pawn' || isCapture ? 0 : state.halfmoveClock + 1,
    fullmoveNumber: state.turn === 'black' ? state.fullmoveNumber + 1 : state.fullmoveNumber,
  };
}

export function isCheckmate(state: GameState): boolean {
  return isKingInCheck(state.board, state.turn) && getAllLegalMoves(state).length === 0;
}

export function isStalemate(state: GameState): boolean {
  return !isKingInCheck(state.board, state.turn) && getAllLegalMoves(state).length === 0;
}

export function isFiveMoveRule(state: GameState): boolean {
  return state.halfmoveClock >= 100;
}

export function isThreefoldRepetition(state: GameState, history: string[] = []): boolean {
  const fen = getFEN(state);
  const positions = history.filter((f) => f === fen);
  return positions.length >= 2;
}

function getFEN(state: GameState): string {
  const pieceRow = (rank: number) =>
    boardRank(state.board, 8 - rank).map((p) => (p ? pieceCode(p) : '-')).join('');
  const boardFEN = [8, 7, 6, 5, 4, 3, 2, 1].map(pieceRow).join('/');
  const activeColor = state.turn;
  const castling = [
    state.whiteKingside ? 'K' : '-',
    state.whiteQueenside ? 'Q' : '-',
    state.blackKingside ? 'k' : '-',
    state.blackQueenside ? 'q' : '-',
  ].join('');
  const ep = state.epSquare !== null ? `${String.fromCharCode(97 + sqFile(state.epSquare))}${8 - sqRank(state.epSquare)}` : '-';
  return `${boardFEN} ${activeColor} ${castling} ${ep} ${state.halfmoveClock} ${state.fullmoveNumber}`;
}

function pieceCode(p: Piece | null): string {
  if (!p) return '-';
  const codeMap: Record<PieceType, number> = { pawn: 6, knight: 2, bishop: 3, rook: 1, queen: 4, king: 5 };
  const absCode = codeMap[p.type];
  return p.color === 'white' ? String(absCode) : String(-absCode);
}

function boardRank(board: Board, rank: number): (Piece | null)[] {
  const start = (rank - 1) * 8;
  return Array.from({ length: 8 }, (_, i) => board[start + i] ?? null);
}

// unicode pieces
export const PIECE_SYMBOLS: Record<string, string> = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖',
  'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜',
  'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};

export function pieceSymbol(piece: Piece | null): string {
  if (!piece) return '';
  return PIECE_SYMBOLS[`${piece.color}-${piece.type}`] ?? '';
}

export function fenToGameState(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  const rows = parts[0].split('/');
  const board: Board = new Array(64).fill(null);

  for (let r = 0; r < 8; r++) {
    const row = rows[r] || '';
    let f = 0;
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      if (char >= '1' && char <= '8') {
        f += parseInt(char, 10);
      } else {
        const isWhite = char === char.toUpperCase();
        const color: Color = isWhite ? 'white' : 'black';
        const lower = char.toLowerCase();
        let type: PieceType = 'pawn';
        if (lower === 'n') type = 'knight';
        else if (lower === 'b') type = 'bishop';
        else if (lower === 'r') type = 'rook';
        else if (lower === 'q') type = 'queen';
        else if (lower === 'k') type = 'king';

        if (f < 8) {
          board[r * 8 + f] = { type, color };
          f++;
        }
      }
    }
  }

  const turn: Color = parts[1] === 'b' ? 'black' : 'white';
  const castling = parts[2] || '-';
  const epStr = parts[3] || '-';

  let epSquare: number | null = null;
  if (epStr !== '-' && epStr.length === 2) {
    const file = epStr.charCodeAt(0) - 97;
    const rank = 8 - parseInt(epStr[1], 10);
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      epSquare = rank * 8 + file;
    }
  }

  return {
    board,
    turn,
    whiteKingside: castling.includes('K'),
    whiteQueenside: castling.includes('Q'),
    blackKingside: castling.includes('k'),
    blackQueenside: castling.includes('q'),
    epSquare,
    halfmoveClock: parts[4] ? parseInt(parts[4], 10) : 0,
    fullmoveNumber: parts[5] ? parseInt(parts[5], 10) : 1,
  };
}