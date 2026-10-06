export type Color = 'white' | 'black';
export type PieceColor = Color;

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = number; // 0-63, where 0 = a8, 63 = h1 (0-based, rank*8 + file)

export const FILES = 'abcdefgh';
export const RANKS = '87654321';

export function squareToAlgebraic(square: Square): string {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return `${FILES[file]}${RANKS[rank]}`;
}

export function algebraicToSquare(alg: string): Square | null {
  if (alg.length !== 2) return null;
  const file = FILES.indexOf(alg[0]);
  const rank = RANKS.indexOf(alg[1]);
  if (file === -1 || rank === -1) return null;
  return rank * 8 + file;
}

export function isValidSquare(sq: Square): boolean {
  return sq >= 0 && sq < 64;
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';