import type { Move, GameState } from './moves';
import type { PieceType } from './chess-types';
import { squareToAlgebraic } from './chess-types';
import { getAllLegalMoves, applyMove, isKingInCheck, isCheckmate } from './moves';

const PIECE_NOTATION: Record<PieceType, string> = {
  pawn: '',
  knight: 'N',
  bishop: 'B',
  rook: 'R',
  queen: 'Q',
  king: 'K',
};

/**
 * Convert a move to standard algebraic notation (e.g., "e4", "Nf3", "O-O", "Qxe5+", "exd8=Q#")
 */
export function moveToAlgebraic(state: GameState, move: Move): string {
  const piece = state.board[move.from];
  if (!piece) return '';

  let notation = '';

  // Castling
  if (piece.type === 'king' && Math.abs(move.to - move.from) === 2) {
    notation = move.to > move.from ? 'O-O' : 'O-O-O';
  } else {
    const fromSq = squareToAlgebraic(move.from);
    const toSq = squareToAlgebraic(move.to);
    const target = state.board[move.to];
    const isEnPassant = piece.type === 'pawn' && move.to === state.epSquare && !target;
    const isCapture = Boolean(target) || isEnPassant;

    if (piece.type === 'pawn') {
      if (isCapture) {
        notation = `${fromSq[0]}x${toSq}`;
      } else {
        notation = toSq;
      }
      if (move.promotion) {
        notation += `=${PIECE_NOTATION[move.promotion] || 'Q'}`;
      }
    } else {
      notation = PIECE_NOTATION[piece.type];

      // Disambiguation: find other friendly pieces of the same type that can also legally move to move.to
      const allMoves = getAllLegalMoves(state);
      const samePieceMoves = allMoves.filter((m) => {
        if (m.from === move.from || m.to !== move.to) return false;
        const p = state.board[m.from];
        return p && p.type === piece.type && p.color === piece.color;
      });

      if (samePieceMoves.length > 0) {
        const moveFile = move.from % 8;
        const moveRank = Math.floor(move.from / 8);
        const sameFile = samePieceMoves.some((m) => m.from % 8 === moveFile);
        const sameRank = samePieceMoves.some((m) => Math.floor(m.from / 8) === moveRank);

        if (!sameFile) {
          notation += fromSq[0];
        } else if (!sameRank) {
          notation += fromSq[1];
        } else {
          notation += fromSq;
        }
      }

      if (isCapture) {
        notation += 'x';
      }
      notation += toSq;
    }
  }

  // Check or Checkmate suffix
  try {
    const nextState = applyMove(state, move);
    if (isCheckmate(nextState)) {
      notation += '#';
    } else if (isKingInCheck(nextState.board, nextState.turn)) {
      notation += '+';
    }
  } catch {
    // In case of any state evaluation edge cases, fall back without suffix
  }

  return notation;
}

/**
 * Format move history for display
 */
export function formatMoveHistory(
  moves: Move[],
  gameStates: GameState[]
): Array<{ moveNum: number; white: string; black: string }> {
  const result: Array<{ moveNum: number; white: string; black: string }> = [];

  for (let i = 0; i < moves.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];

    const whiteMoveStr = whiteMove && gameStates[i] ? moveToAlgebraic(gameStates[i], whiteMove) : '';
    const blackMoveStr = blackMove && gameStates[i + 1] ? moveToAlgebraic(gameStates[i + 1], blackMove) : '';

    result.push({
      moveNum,
      white: whiteMoveStr,
      black: blackMoveStr,
    });
  }

  return result;
}

/**
 * Generate standard PGN string for export
 */
export function generatePgn(
  moves: Move[],
  gameStates: GameState[],
  metadata?: { white?: string; black?: string; event?: string; result?: string }
): string {
  const headers = [
    `[Event "${metadata?.event || 'Ritesh Chess Championship'}"]`,
    `[Site "Ritesh Chess Global Arena"]`,
    `[Date "${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}"]`,
    `[Round "1"]`,
    `[White "${metadata?.white || 'White'}"]`,
    `[Black "${metadata?.black || 'Black'}"]`,
    `[Result "${metadata?.result || '*'}"]`,
  ];
  const history = formatMoveHistory(moves, gameStates);
  const movesStr = history
    .map((h) => `${h.moveNum}. ${h.white}${h.black ? ` ${h.black}` : ''}`)
    .join(' ');

  return `${headers.join('\n')}\n\n${movesStr} ${metadata?.result || '*'}`.trim();
}
