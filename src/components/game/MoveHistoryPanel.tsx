'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './Game.module.css';

export interface MovePair {
  moveNum: number;
  white: string;
  black?: string;
}

interface MoveHistoryPanelProps {
  moveHistory: MovePair[];
  lastMoveIndex: number;
  totalMoves: number;
  onSelectMoveIndex?: (idx: number) => void;
  onFirstMove?: () => void;
  onPrevMove?: () => void;
  onNextMove?: () => void;
  onLastMove?: () => void;
  onFlipBoard?: () => void;
  onCopyPgn?: () => void;
  onCopyFen?: () => void;
}

export default function MoveHistoryPanel({
  moveHistory,
  lastMoveIndex,
  totalMoves,
  onSelectMoveIndex,
  onFirstMove,
  onPrevMove,
  onNextMove,
  onLastMove,
  onFlipBoard,
  onCopyPgn,
  onCopyFen,
}: MoveHistoryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Auto-scroll to the bottom on new moves
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory.length, lastMoveIndex]);

  const handleCopy = (type: 'pgn' | 'fen') => {
    if (type === 'pgn' && onCopyPgn) {
      onCopyPgn();
      setCopyFeedback('PGN Copied!');
    } else if (type === 'fen' && onCopyFen) {
      onCopyFen();
      setCopyFeedback('FEN Copied!');
    }
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <section className={styles.panel} aria-label="Move history & Score sheet">
      <header className={styles.panelHead}>
        <div className={styles.panelHeadLeft}>
          <h2 className={styles.panelTitle}>Official Score Sheet</h2>
          <span className={styles.panelCount}>{totalMoves} {totalMoves === 1 ? 'ply' : 'plies'}</span>
        </div>

        {copyFeedback && (
          <span className={styles.copyToast} role="status">
            ✓ {copyFeedback}
          </span>
        )}
      </header>

      {moveHistory.length === 0 ? (
        <p className={styles.emptyHistory}>Awaiting opening move... Score sheet will record all tournament plies.</p>
      ) : (
        <div className={styles.historyScroll} ref={scrollRef} role="list">
          {moveHistory.map((pair) => {
            const whiteIdx = pair.moveNum * 2 - 2;
            const blackIdx = pair.moveNum * 2 - 1;

            return (
              <div key={pair.moveNum} className={styles.movePair} role="listitem">
                <span className={styles.moveNumber}>{pair.moveNum}.</span>

                <button
                  type="button"
                  className={`${styles.moveBtn} ${styles.moveWhite} ${whiteIdx === lastMoveIndex ? styles.moveLatest : ''}`}
                  onClick={() => onSelectMoveIndex?.(whiteIdx)}
                  aria-label={`Move ${pair.moveNum} white: ${pair.white}`}
                >
                  {pair.white}
                </button>

                {pair.black ? (
                  <button
                    type="button"
                    className={`${styles.moveBtn} ${styles.moveBlack} ${blackIdx === lastMoveIndex ? styles.moveLatest : ''}`}
                    onClick={() => onSelectMoveIndex?.(blackIdx)}
                    aria-label={`Move ${pair.moveNum} black: ${pair.black}`}
                  >
                    {pair.black}
                  </button>
                ) : (
                  <span className={styles.movePlaceholder} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Controller Bar (Scrubber) */}
      <footer className={styles.historyControls}>
        <div className={styles.scrubberGroup}>
          <button
            type="button"
            className={styles.scrubBtn}
            onClick={onFirstMove}
            disabled={totalMoves === 0 || lastMoveIndex <= -1}
            title="First move (Start)"
          >
            |◀
          </button>
          <button
            type="button"
            className={styles.scrubBtn}
            onClick={onPrevMove}
            disabled={totalMoves === 0 || lastMoveIndex <= -1}
            title="Previous move"
          >
            ◀
          </button>
          <button
            type="button"
            className={styles.scrubBtn}
            onClick={onNextMove}
            disabled={totalMoves === 0 || lastMoveIndex >= totalMoves - 1}
            title="Next move"
          >
            ▶
          </button>
          <button
            type="button"
            className={styles.scrubBtn}
            onClick={onLastMove}
            disabled={totalMoves === 0 || lastMoveIndex >= totalMoves - 1}
            title="Latest move (Live)"
          >
            ▶|
          </button>
          {onFlipBoard && (
            <button
              type="button"
              className={styles.scrubBtn}
              onClick={onFlipBoard}
              title="Flip board orientation"
            >
              ⇄
            </button>
          )}
        </div>

        <div className={styles.copyActionsGroup}>
          {onCopyPgn && (
            <button
              type="button"
              className={styles.metaActionBtn}
              onClick={() => handleCopy('pgn')}
              title="Copy PGN notation to clipboard"
            >
              PGN
            </button>
          )}
          {onCopyFen && (
            <button
              type="button"
              className={styles.metaActionBtn}
              onClick={() => handleCopy('fen')}
              title="Copy current FEN string to clipboard"
            >
              FEN
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
