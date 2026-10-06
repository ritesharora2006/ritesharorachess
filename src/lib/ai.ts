import type { Move, GameState } from './moves';
import type { Board } from './board-state';
import { getAllLegalMoves, applyMove, isCheckmate, isStalemate } from './moves';
import { toStandardFEN, uciToLegalMove, stockfishEngine } from './stockfish-engine';
import { getBookMove } from './opening-book';

// Piece values (centipawns) for fallback heuristic
const PIECE_VALUES = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 };

// Positional piece-square tables (white perspective, black inverted)
const PAWN_TABLE = [
   0,   0,   0,   0,   0,   0,   0,   0,
  50,  50,  50,  50,  50,  50,  50,  50,
  10,  10,  20,  30,  30,  20,  10,  10,
   5,   5,  10,  25,  25,  10,   5,   5,
   0,   0,   0,  20,  20,   0,   0,   0,
   5,  -5,-10,   0,   0,-10,  -5,   5,
   5,  10,  10,-20,-20,  10,  10,   5,
   0,   0,   0,   0,   0,   0,   0,   0
];

const KNIGHT_TABLE = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE = [
  20, 30, 10,  0,  0, 10, 30, 20,
  20, 20,  0,  0,  0,  0, 20, 20,
 -10,-20,-20,-20,-20,-20,-20,-10,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30
];

const PIECE_TABLES = {
  pawn: PAWN_TABLE,
  knight: KNIGHT_TABLE,
  bishop: BISHOP_TABLE,
  rook: ROOK_TABLE,
  queen: QUEEN_TABLE,
  king: KING_TABLE,
};

function countPieces(board: Board): number {
  let count = 0;
  for (let i = 0; i < 64; i++) {
    if (board[i]) count++;
  }
  return count;
}

export function evaluateBoard(state: GameState): number {
  const { board } = state;
  let score = 0;

  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (!piece) continue;

    const value = PIECE_VALUES[piece.type];
    const table = PIECE_TABLES[piece.type];
    const r = Math.floor(sq / 8);
    const f = sq % 8;
    const tableIdx = piece.color === 'white' ? r * 8 + f : (7 - r) * 8 + f;
    const posScore = table[tableIdx] ?? 0;

    const pieceScore = value + posScore * 0.15;
    score += piece.color === 'white' ? pieceScore : -pieceScore;
  }

  const gamePhase = countPieces(state.board) / 32;
  const phaseWeight = 0.3 + gamePhase * 0.2;

  return score * phaseWeight;
}

function fallbackMinimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): { score: number; move?: Move } {
  if (isCheckmate(state)) {
    return { score: state.turn === 'white' ? -100000 - depth : 100000 + depth };
  }
  if (isStalemate(state)) {
    return { score: 0 };
  }
  if (depth === 0) {
    return { score: evaluateBoard(state) };
  }

  const moves = getAllLegalMoves(state);
  if (moves.length === 0) {
    return { score: evaluateBoard(state) };
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove: Move | undefined;

    for (const move of moves) {
      const newState = applyMove(state, move);
      const { score } = fallbackMinimax(newState, depth - 1, alpha, beta, false);
      if (score > maxEval) {
        maxEval = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove: Move | undefined;

    for (const move of moves) {
      const newState = applyMove(state, move);
      const { score } = fallbackMinimax(newState, depth - 1, alpha, beta, true);
      if (score < minEval) {
        minEval = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

/**
 * Cancel any ongoing engine move computation immediately.
 */
export function cancelAIMove(): void {
  stockfishEngine.cancelSearch();
}

/**
 * Get AI move asynchronously using:
 * 1. Grandmaster opening book (< 25ms response for common opening book positions)
 * 2. Dedicated Stockfish Web Worker (pure background calculation, zero UI blocking)
 * 3. Bounded minimax fallback (capped at depth 3 to prevent UI stalls)
 */
export async function getAIMove(
  state: GameState,
  difficulty: number = 3,
  signal?: AbortSignal
): Promise<Move | null> {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;

  if (signal?.aborted) return null;

  const fen = toStandardFEN(state);

  // 1. Opening Book Check
  const bookMoveUci = getBookMove(fen);
  if (bookMoveUci) {
    const bookMove = uciToLegalMove(state, bookMoveUci);
    if (bookMove) {
      // Natural humanized thinking pause for opening book
      const openingDelay = difficulty === 1 ? 200 : difficulty === 3 ? 350 : 500;
      await new Promise((resolve) => setTimeout(resolve, openingDelay));
      if (signal?.aborted) return null;
      return bookMove;
    }
  }

  // 2. Stockfish Web Worker Search
  if (stockfishEngine.isSupported()) {
    try {
      const config =
        difficulty <= 1
          ? { skillLevel: 2, maxDepth: 5, movetimeMs: 250 }
          : difficulty <= 3
            ? { skillLevel: 10, maxDepth: 10, movetimeMs: 600 }
            : { skillLevel: 20, maxDepth: 16, movetimeMs: 1400 };

      const uciMove = await stockfishEngine.search(fen, config, signal);
      if (signal?.aborted) return null;

      if (uciMove) {
        const legalMove = uciToLegalMove(state, uciMove);
        if (legalMove) {
          return legalMove;
        }
      }
    } catch (err) {
      console.warn('Stockfish engine error, using fallback:', err);
    }
  }

  if (signal?.aborted) return null;

  // 3. Ultra-fast Bounded Minimax Fallback
  const maximizing = state.turn === 'white';
  const fallbackDepth = difficulty <= 1 ? 1 : 2; // depth 1 or 2 is instant (<10ms)
  const { move } = fallbackMinimax(state, fallbackDepth, -Infinity, Infinity, maximizing);

  return move ?? legalMoves[0];
}
