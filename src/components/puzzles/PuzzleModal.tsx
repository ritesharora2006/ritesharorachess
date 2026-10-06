'use client';

import React, { useState, useCallback } from 'react';
import styles from './PuzzleModal.module.css';
import { CHESS_PUZZLES, type ChessPuzzle } from '@/lib/puzzle-database';
import {
  fenToGameState,
  applyMove,
  getLegalMovesForSquare,
  type GameState,
  type Move,
} from '@/lib/moves';
import { squareToAlgebraic, type Square } from '@/lib/chess-types';
import ChessBoard from '@/components/game/ChessBoard';
import { getBoardTheme, DEFAULT_BOARD_THEME } from '@/lib/boardThemes';

interface PuzzleModalProps {
  onClose: () => void;
  initialPuzzleId?: string;
}

export default function PuzzleModal({ onClose, initialPuzzleId }: PuzzleModalProps) {
  const [puzzleIndex, setPuzzleIndex] = useState(() => {
    if (!initialPuzzleId) return 0;
    const idx = CHESS_PUZZLES.findIndex((p) => p.id === initialPuzzleId);
    return idx >= 0 ? idx : 0;
  });

  const puzzle: ChessPuzzle = CHESS_PUZZLES[puzzleIndex];

  const [gameState, setGameState] = useState<GameState>(() => fenToGameState(puzzle.fen));
  const [stepIndex, setStepIndex] = useState(0);
  const [statusKind, setStatusKind] = useState<'neutral' | 'success' | 'wrong'>('neutral');
  const [statusMessage, setStatusMessage] = useState<string>('Your turn — find the winning move.');
  const [showHint, setShowHint] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<Square>>(new Set());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  const loadPuzzle = (newIndex: number) => {
    const nextPuzzle = CHESS_PUZZLES[newIndex];
    setPuzzleIndex(newIndex);
    setGameState(fenToGameState(nextPuzzle.fen));
    setStepIndex(0);
    setStatusKind('neutral');
    setStatusMessage('Your turn — find the winning move.');
    setShowHint(false);
    setSelectedSquare(null);
    setHighlightedSquares(new Set());
    setLastMove(null);
    setIsSolved(false);
  };

  const handleNextPuzzle = () => {
    loadPuzzle((puzzleIndex + 1) % CHESS_PUZZLES.length);
  };

  const handleSquareClick = useCallback(
    (sq: Square) => {
      if (isSolved) return;

      const piece = gameState.board[sq];

      // If already selected, clicking another legal target applies the move
      if (selectedSquare !== null) {
        if (selectedSquare === sq) {
          setSelectedSquare(null);
          setHighlightedSquares(new Set());
          return;
        }

        const legalMoves = getLegalMovesForSquare(gameState, selectedSquare);
        const chosen = legalMoves.find((m) => m.to === sq);

        if (chosen) {
          const fromAlg = squareToAlgebraic(chosen.from);
          const toAlg = squareToAlgebraic(chosen.to);
          const uciMove = `${fromAlg}${toAlg}${chosen.promotion ? chosen.promotion[0] : ''}`.toLowerCase();
          const expectedUci = puzzle.solutionUci[stepIndex]?.toLowerCase();

          if (uciMove === expectedUci) {
            // Correct move
            const nextState = applyMove(gameState, chosen);
            setGameState(nextState);
            setLastMove({ from: chosen.from, to: chosen.to });
            setSelectedSquare(null);
            setHighlightedSquares(new Set());

            const nextStep = stepIndex + 1;
            if (nextStep >= puzzle.solutionUci.length) {
              // Puzzle completed!
              setIsSolved(true);
              setStatusKind('success');
              setStatusMessage('✓ Puzzle Solved! Superb tactical calculation.');
            } else {
              // Opponent automated response
              setStepIndex(nextStep);
              setStatusKind('success');
              setStatusMessage('Best move! Watching opponent reply...');

              const opponentUci = puzzle.solutionUci[nextStep];
              setTimeout(() => {
                const oppFromStr = opponentUci.slice(0, 2);
                const oppToStr = opponentUci.slice(2, 4);
                // Calculate opponent's square from algebraic
                const fileFrom = oppFromStr.charCodeAt(0) - 97;
                const rankFrom = 8 - parseInt(oppFromStr[1], 10);
                const sqFrom = rankFrom * 8 + fileFrom;

                const fileTo = oppToStr.charCodeAt(0) - 97;
                const rankTo = 8 - parseInt(oppToStr[1], 10);
                const sqTo = rankTo * 8 + fileTo;

                const oppMove: Move = { from: sqFrom, to: sqTo };
                const afterOppState = applyMove(nextState, oppMove);
                setGameState(afterOppState);
                setLastMove({ from: sqFrom, to: sqTo });
                setStepIndex(nextStep + 1);

                if (nextStep + 1 >= puzzle.solutionUci.length) {
                  setIsSolved(true);
                  setStatusKind('success');
                  setStatusMessage('✓ Puzzle Solved! Superb tactical calculation.');
                } else {
                  setStatusKind('neutral');
                  setStatusMessage('Keep going — find the follow-up move.');
                }
              }, 450);
            }
          } else {
            // Incorrect move
            setStatusKind('wrong');
            setStatusMessage('✕ Incorrect move. That is not the critical line, try again!');
            setSelectedSquare(null);
            setHighlightedSquares(new Set());
          }
          return;
        }
      }

      // Selecting piece
      if (piece && piece.color === puzzle.playerColor) {
        setSelectedSquare(sq);
        const legal = getLegalMovesForSquare(gameState, sq);
        setHighlightedSquares(new Set(legal.map((m) => m.to)));
      } else {
        setSelectedSquare(null);
        setHighlightedSquares(new Set());
      }
    },
    [gameState, selectedSquare, stepIndex, puzzle, isSolved]
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brass-burnished, #c29b48)' }} />
              TACTICAL EXERCISE • {puzzle.theme.toUpperCase().replace('_', ' ')} • RATING {puzzle.rating}
            </span>
            <h2 className={styles.title}>{puzzle.title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close puzzle">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Chessboard */}
          <div className={styles.boardContainer}>
            <ChessBoard
              gameState={gameState}
              boardFlipped={puzzle.playerColor === 'black'}
              selectedSquare={selectedSquare}
              highlightedSquares={highlightedSquares}
              lastMove={lastMove}
              status="playing"
              onSquareClick={handleSquareClick}
              rankLabels={['8', '7', '6', '5', '4', '3', '2', '1']}
              fileLabels={['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']}
              theme={getBoardTheme(DEFAULT_BOARD_THEME)}
            />
          </div>

          {/* Side Content */}
          <div className={styles.sideContent}>
            {/* Status Card */}
            <div
              className={`
                ${styles.statusCard}
                ${statusKind === 'success' ? styles.statusSuccess : ''}
                ${statusKind === 'wrong' ? styles.statusWrong : ''}
                ${statusKind === 'neutral' ? styles.statusNeutral : ''}
              `}
            >
              <span>{statusMessage}</span>
            </div>

            {/* Prompt & Citation */}
            <div className={styles.promptCard}>
              <p className={styles.promptText}>{puzzle.prompt}</p>

              {showHint && (
                <div className={styles.hintBox}>
                  <strong>Hint:</strong> {puzzle.hint}
                </div>
              )}

              <span className={styles.citation}>Historical source: {puzzle.sourceGame}</span>
            </div>

            {/* Actions */}
            <div className={styles.footerActions}>
              {!isSolved ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondaryBtn}`}
                  onClick={() => setShowHint((prev) => !prev)}
                >
                  💡 {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.primaryBtn}`}
                  onClick={handleNextPuzzle}
                >
                  Next Puzzle →
                </button>
              )}

              <button
                type="button"
                className={`${styles.btn} ${styles.secondaryBtn}`}
                onClick={handleNextPuzzle}
              >
                Skip / Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
