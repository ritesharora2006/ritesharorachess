'use client';

import React from 'react';
import styles from './Game.module.css';

interface GameControlsProps {
  statusMessage: string;
  statusKind: 'normal' | 'check' | 'end';
  canUndo: boolean;
  canResign: boolean;
  canNewGame: boolean;
  canDraw?: boolean;
  onNewGame: () => void;
  onUndo: () => void;
  onFlipBoard: () => void;
  onResign: () => void;
  onOfferDraw?: () => void;
  onToggleFullscreen?: () => void;
}

export default function GameControls({
  statusMessage,
  statusKind,
  canUndo,
  canResign,
  canNewGame,
  canDraw = false,
  onNewGame,
  onUndo,
  onFlipBoard,
  onResign,
  onOfferDraw,
  onToggleFullscreen,
}: GameControlsProps) {
  return (
    <div className={styles.controlsPanel}>
      <div
        className={`${styles.statusText} ${
          statusKind === 'check' ? styles.statusCheck : statusKind === 'end' ? styles.statusEnd : ''
        }`}
        role="status"
        aria-live="polite"
      >
        {statusKind === 'check' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        )}
        {statusKind === 'end' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2m12 6h2a2 2 0 002-2V5a2 2 0 00-2-2h-2M6 3h12v7a6 6 0 01-12 0V3zM9 21h6m-3-6v6" />
          </svg>
        )}
        <span>{statusMessage}</span>
      </div>

      <div className={styles.controlsGrid}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onNewGame}
          disabled={!canNewGame}
          title="Start a new game"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Game
        </button>

        <button
          type="button"
          className={styles.controlBtn}
          onClick={onUndo}
          disabled={!canUndo}
          title="Take back previous move"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
          Undo Move
        </button>

        <button
          type="button"
          className={styles.controlBtn}
          onClick={onFlipBoard}
          title="Flip board orientation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Flip Board
        </button>

        {onOfferDraw ? (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={onOfferDraw}
            disabled={!canDraw}
            title="Offer a draw to opponent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7h8m-8 5h8m-8 5h5" />
            </svg>
            Offer Draw
          </button>
        ) : onToggleFullscreen ? (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={onToggleFullscreen}
            title="Toggle fullscreen mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
            Fullscreen
          </button>
        ) : null}

        <button
          type="button"
          className={`${styles.controlBtn} ${styles.controlDanger}`}
          onClick={onResign}
          disabled={!canResign}
          title="Resign this game"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
          </svg>
          Resign
        </button>
      </div>
    </div>
  );
}

