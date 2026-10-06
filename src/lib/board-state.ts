import type { Color, Piece, Square } from './chess-types';

export type Board = (Piece | null)[]; // length 64, index 0 = a8, index 63 = h1

export function createInitialBoard(): Board {
  return [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    ...Array(8).fill(null),
    ...Array(8).fill(null),
    ...Array(8).fill(null),
    ...Array(8).fill(null),
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' },
  ];
}

export function getPiece(board: Board, square: Square): Piece | null {
  return board[square];
}

export function setPiece(board: Board, square: Square, piece: Piece | null): void {
  board[square] = piece;
}

export function cloneBoard(board: Board): Board {
  return board.map((p) => (p ? { ...p } : null));
}

export function findKing(board: Board, color: Color): Square | -1 {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.type === 'king' && p.color === color) return i;
  }
  return -1;
}

export function opponent(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}