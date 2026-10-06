'use client';

import React, { useState, useCallback } from 'react';
import type { Square } from '@/lib/chess-types';
import type { GameState } from '@/lib/moves';
import ChessPieceSvg from './ChessPieceSvg';
import styles from './Game.module.css';

interface ChessBoardProps {
  gameState: GameState;
  boardFlipped: boolean;
  selectedSquare: Square | null;
  highlightedSquares: Set<Square>;
  lastMove: { from: Square; to: Square } | null;
  status: string;
  onSquareClick: (sq: Square) => void;
  rankLabels: string[];
  fileLabels: string[];
  theme: { light: string; dark: string; move: string; lastMove: string; selected: string };
}

export default function ChessBoard({
  gameState,
  boardFlipped,
  selectedSquare,
  highlightedSquares,
  lastMove,
  status,
  onSquareClick,
  theme,
}: ChessBoardProps) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const [draggedSq, setDraggedSq] = useState<Square | null>(null);
  const [dragOverSq, setDragOverSq] = useState<Square | null>(null);

  // Drag & Drop Handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, sq: Square) => {
      const piece = gameState.board[sq];
      if (!piece) return;

      // Select square so highlightedSquares are populated
      onSquareClick(sq);
      setDraggedSq(sq);
      e.dataTransfer.setData('text/plain', String(sq));
      e.dataTransfer.effectAllowed = 'move';

      // Slight transparent drag image effect
      if (e.currentTarget) {
        e.currentTarget.style.opacity = '0.7';
      }
    },
    [gameState.board, onSquareClick]
  );

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedSq(null);
    setDragOverSq(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, sq: Square) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSq(sq);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSq(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetSq: Square) => {
      e.preventDefault();
      setDragOverSq(null);
      const fromSqStr = e.dataTransfer.getData('text/plain');
      const fromSq = fromSqStr ? (parseInt(fromSqStr, 10) as Square) : draggedSq;
      setDraggedSq(null);

      if (fromSq !== null && fromSq !== targetSq) {
        // Execute move onto target square
        onSquareClick(targetSq);
      }
    },
    [draggedSq, onSquareClick]
  );

  // Calculate Last Move Vector Coordinates for SVG Overlay
  const getSquareCenter = (sq: Square) => {
    const visualIndex = boardFlipped ? 63 - sq : sq;
    const col = visualIndex % 8;
    const row = Math.floor(visualIndex / 8);
    // 0 to 100% scale
    return {
      x: (col + 0.5) * 12.5,
      y: (row + 0.5) * 12.5,
    };
  };

  const lastMoveVector =
    lastMove && lastMove.from !== undefined && lastMove.to !== undefined
      ? {
          from: getSquareCenter(lastMove.from),
          to: getSquareCenter(lastMove.to),
        }
      : null;

  return (
    <div className={styles.boardWrap}>
      {/* Outer Tournament Timber Bezel */}
      <div className={styles.boardBezel}>
        <div className={styles.board} role="grid" aria-label="Professional Tournament Chess Board">
          {/* SVG Vector Layer for Last Move Directional Ray */}
          {lastMoveVector && (
            <svg
              className={styles.moveVectorOverlay}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="lastMoveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(212, 175, 55, 0.25)" />
                  <stop offset="100%" stopColor="rgba(212, 175, 55, 0.75)" />
                </linearGradient>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="6"
                  refX="4"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 6 3, 0 6" fill="rgba(212, 175, 55, 0.85)" />
                </marker>
              </defs>

              {/* Directional connecting vector */}
              <line
                x1={lastMoveVector.from.x}
                y1={lastMoveVector.from.y}
                x2={lastMoveVector.to.x}
                y2={lastMoveVector.to.y}
                stroke="url(#lastMoveGradient)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="2 1.5"
              />
            </svg>
          )}

          {Array.from({ length: 64 }, (_, idx) => {
            const sq: Square = boardFlipped ? 63 - idx : idx;
            const rank = Math.floor(sq / 8);
            const file = sq % 8;
            const isLight = (rank + file) % 2 === 1;
            const piece = gameState.board[sq];
            const isSelected = selectedSquare === sq;
            const isHighlighted = highlightedSquares.has(sq);
            const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const inCheck = status === 'check' && piece?.type === 'king' && piece.color === gameState.turn;
            const isTargetedByDrag = dragOverSq === sq;

            // Embedded coordinates on the outer perimeter squares
            const showRankCoord = boardFlipped ? file === 7 : file === 0;
            const rankCoordText = ranks[rank];
            const showFileCoord = boardFlipped ? rank === 0 : rank === 7;
            const fileCoordText = files[file];

            const coordColorClass = isLight ? styles.coordOnLight : styles.coordOnDark;

            const squareClasses = [
              styles.square,
              isLight ? styles.squareLight : styles.squareDark,
              isSelected && styles.squareSelected,
              isLastMoveSquare && !isSelected && styles.squareLastMove,
              inCheck && styles.squareCheck,
              isTargetedByDrag && styles.squareDragOver,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={sq}
                className={squareClasses}
                style={
                  {
                    '--board-light': theme.light,
                    '--board-dark': theme.dark,
                    '--board-move': theme.move,
                    '--board-last-move': theme.lastMove,
                    '--board-selected': theme.selected,
                  } as React.CSSProperties
                }
                role="gridcell"
                aria-label={`Square ${files[file]}${ranks[rank]}`}
                onClick={() => onSquareClick(sq)}
                onDragOver={(e) => handleDragOver(e, sq)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, sq)}
              >
                {/* Embedded Rank Coordinate (left edge) */}
                {showRankCoord && (
                  <span className={`${styles.coordRank} ${coordColorClass}`} aria-hidden="true">
                    {rankCoordText}
                  </span>
                )}

                {/* Embedded File Coordinate (bottom edge) */}
                {showFileCoord && (
                  <span className={`${styles.coordFile} ${coordColorClass}`} aria-hidden="true">
                    {fileCoordText}
                  </span>
                )}

                {/* Quiet Legal Move Dot */}
                {isHighlighted && !piece && (
                  <div className={styles.moveDot} aria-hidden="true">
                    <span className={styles.moveDotInner} />
                  </div>
                )}

                {/* Capture Legal Move Ring */}
                {isHighlighted && piece && (
                  <div className={styles.captureRing} aria-hidden="true">
                    <span className={styles.captureReticle} />
                  </div>
                )}

                {/* Check Warning Halo for King */}
                {inCheck && <div className={styles.checkBeaconRing} aria-hidden="true" />}

                {/* Piece with Drag-and-Drop Capability & Elevation Physics */}
                {piece && (
                  <div
                    className={`${styles.piece} ${isSelected ? styles.pieceSelected : ''}`}
                    draggable={piece.color === gameState.turn}
                    onDragStart={(e) => handleDragStart(e, sq)}
                    onDragEnd={handleDragEnd}
                  >
                    <ChessPieceSvg type={piece.type} color={piece.color} className={styles.pieceSvg} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
