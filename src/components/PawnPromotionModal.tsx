'use client';

import styles from './PawnPromotionModal.module.css';
import type { PieceType } from '@/lib/chess-types';

interface PawnPromotionModalProps {
  color: 'white' | 'black';
  onSelect: (piece: PieceType) => void;
}

const PROMOTION_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

const PIECE_SYMBOLS: Record<string, string> = {
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
};

export default function PawnPromotionModal({
  color,
  onSelect,
}: PawnPromotionModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Pawn Promotion</h2>
        <p className={styles.subtitle}>Choose a piece to promote to:</p>
        
        <div className={styles.piecesGrid}>
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece}
              className={styles.pieceButton}
              onClick={() => onSelect(piece)}
              title={piece.toUpperCase()}
            >
              <span className={styles.pieceSymbol}>
                {PIECE_SYMBOLS[`${color}-${piece}`]}
              </span>
              <span className={styles.pieceName}>
                {piece.charAt(0).toUpperCase() + piece.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
