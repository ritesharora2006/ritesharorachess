'use client';

import React from 'react';
import styles from './HeroOverturnedPieces.module.css';
import ChessPieceSvg from '@/components/game/ChessPieceSvg';
import type { PieceType, PieceColor } from '@/lib/chess-types';

interface OverturnedPiece {
  id: number;
  type: PieceType;
  color: PieceColor;
  material: 'ghostGold' | 'ghostSilver';
  layer: 'layerBack' | 'layerMid' | 'layerFront';
  x: string;
  targetY: string;
  scale: number;
  opacity: number;
  blurAmt?: string;
  rotZLand: number;
}

// 5 exact pieces matching the layout, positions, and proportions from the image
const OVERTURNED_PIECES: OverturnedPiece[] = [
  // 1. Right Circled Golden Knight Emblem (Snout down near board)
  {
    id: 1,
    type: 'knight',
    color: 'black',
    material: 'ghostGold',
    layer: 'layerFront',
    x: '56%',
    targetY: '270px',
    scale: 1.05,
    opacity: 0.88,
    rotZLand: 195,
  },
  // 2. Bottom-Left Circled Pawn (Above 1,450 stats card)
  {
    id: 2,
    type: 'pawn',
    color: 'white',
    material: 'ghostGold',
    layer: 'layerFront',
    x: '2%',
    targetY: '290px',
    scale: 0.85,
    opacity: 0.85,
    rotZLand: 11,
  },
  // 3. Top Circled Knight/Piece (Behind "EVERY")
  {
    id: 3,
    type: 'bishop',
    color: 'white',
    material: 'ghostSilver',
    layer: 'layerMid',
    x: '50%',
    targetY: '75px',
    scale: 0.92,
    opacity: 0.55,
    rotZLand: 84,
  },
  // 4. Static Rook (Deep background, completely unchanged)
  {
    id: 4,
    type: 'rook',
    color: 'black',
    material: 'ghostSilver',
    layer: 'layerBack',
    x: '8%',
    targetY: '30px',
    scale: 0.85,
    opacity: 0.22,
    blurAmt: '3.5px',
    rotZLand: 92,
  },
  // 5. Static King (Behind board, completely unchanged)
  {
    id: 5,
    type: 'king',
    color: 'black',
    material: 'ghostSilver',
    layer: 'layerBack',
    x: '86%',
    targetY: '175px',
    scale: 1.15,
    opacity: 0.2,
    blurAmt: '3px',
    rotZLand: 65,
  },
];

export default function HeroOverturnedPieces() {
  return (
    <div className={styles.stage} aria-hidden="true">
      {OVERTURNED_PIECES.map((piece) => {
        const styleVars = {
          '--x-pos': piece.x,
          '--target-y': piece.targetY,
          '--scale': piece.scale,
          '--target-opacity': piece.opacity,
          '--blur-amt': piece.blurAmt || '0px',
          '--rot-z-land': `${piece.rotZLand}deg`,
        } as React.CSSProperties;

        let animationClass = styles.staticPiece;
        if (piece.id === 3) {
          animationClass = styles.topKnight;
        } else if (piece.id === 2) {
          animationClass = styles.bottomPawn;
        } else if (piece.id === 1) {
          animationClass = styles.goldenKnight;
        }

        return (
          <div
            key={piece.id}
            className={`
              ${styles.pieceSlot}
              ${styles[piece.layer]}
              ${animationClass}
            `}
            style={styleVars}
          >
            <div className={styles.shadow} />
            {piece.id === 1 ? (
              <div className={styles.emblemShimmerContainer}>
                <div className={`${styles.pieceSvg} ${styles[piece.material]}`}>
                  <ChessPieceSvg type={piece.type} color={piece.color} />
                </div>
                <div className={styles.emblemShimmerBeam} aria-hidden="true" />
              </div>
            ) : (
              <div className={`${styles.pieceSvg} ${styles[piece.material]}`}>
                <ChessPieceSvg type={piece.type} color={piece.color} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
