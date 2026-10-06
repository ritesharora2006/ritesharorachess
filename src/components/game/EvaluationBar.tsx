'use client';

import React from 'react';
import styles from './EvaluationBar.module.css';

interface EvaluationBarProps {
  scoreCentipawns: number; // positive = white advantage, negative = black advantage
  boardFlipped?: boolean;
}

export default function EvaluationBar({ scoreCentipawns, boardFlipped = false }: EvaluationBarProps) {
  // Clamp centipawns to reasonable visual bounds (-800 to +800)
  const clampedCp = Math.max(-800, Math.min(800, scoreCentipawns));
  
  // Smooth sigmoid-style visual percentage (50% is dead even)
  const rawWhitePct = 50 + (clampedCp / 800) * 45;
  const whiteHeightPct = Math.max(5, Math.min(95, rawWhitePct));
  
  // If board is flipped, Black is at bottom
  const fillHeight = boardFlipped ? 100 - whiteHeightPct : whiteHeightPct;
  const isWhiteAdvantage = scoreCentipawns >= 0;

  // Format display score (e.g. +1.4 or -0.8)
  const formattedScore =
    Math.abs(scoreCentipawns) >= 10000
      ? isWhiteAdvantage ? '+M' : '-M'
      : `${scoreCentipawns > 0 ? '+' : ''}${(scoreCentipawns / 100).toFixed(1)}`;

  return (
    <div
      className={styles.evalBarWrap}
      role="progressbar"
      aria-label={`Position evaluation: ${formattedScore}`}
      aria-valuenow={scoreCentipawns}
    >
      {/* Background (Black side) */}
      <div className={styles.blackFill} />

      {/* Dynamic Foreground (White side) */}
      <div
        className={styles.whiteFill}
        style={{ height: `${fillHeight}%` }}
      />

      {/* Central Equity Threshold */}
      <div className={styles.centerDivider} />

      {/* Dynamic Advantage Score Tag */}
      <div
        className={`${styles.scoreTag} ${
          isWhiteAdvantage
            ? boardFlipped ? styles.scoreBlackAdvantage : styles.scoreWhiteAdvantage
            : boardFlipped ? styles.scoreWhiteAdvantage : styles.scoreBlackAdvantage
        }`}
      >
        {formattedScore}
      </div>
    </div>
  );
}

