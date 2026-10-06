'use client';

import React, { useMemo } from 'react';
import ChessPieceSvg from './ChessPieceSvg';
import type { PieceType } from '@/lib/chess-types';
import styles from './Game.module.css';

export interface PlayerCardProps {
  name: string;
  rating: string;
  color: 'white' | 'black';
  time: number;
  active: boolean;
  /** Pieces this player has captured */
  captured: { type: string; symbol: string }[];
  materialLead: number | null;
  formatTime: (seconds: number) => string;
}

const PIECE_PRIORITY: Record<string, number> = {
  queen: 1,
  rook: 2,
  bishop: 3,
  knight: 4,
  pawn: 5,
};

export default function PlayerCard({
  name,
  rating,
  color,
  time,
  active,
  captured,
  materialLead,
  formatTime,
}: PlayerCardProps) {
  const capturedPieceColor = color === 'white' ? 'black' : 'white';

  const isWarning = time < 30 && time >= 10;
  const isCritical = time < 10 && time > 0;

  // Group captured pieces by type sorted by standard chess hierarchy
  const groupedCaptures = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of captured) {
      counts[c.type] = (counts[c.type] || 0) + 1;
    }

    return Object.entries(counts)
      .sort(([a], [b]) => (PIECE_PRIORITY[a] || 99) - (PIECE_PRIORITY[b] || 99))
      .map(([type, count]) => ({ type: type as PieceType, count }));
  }, [captured]);

  const clockClasses = [
    styles.clock,
    active && styles.clockActive,
    isWarning && styles.clockWarning,
    isCritical && styles.clockCritical,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.playerCard} ${active && time >= 0 ? styles.playerCardActive : ''}`}>
      <div className={styles.playerDetails}>
        <div
          className={`${styles.playerAvatar} ${color === 'white' ? styles.avatarWhite : styles.avatarBlack}`}
          aria-hidden="true"
        >
          <ChessPieceSvg type="king" color={color} className={styles.pieceSvg} />
          <span className={styles.onlineBadge} title="Player online & connected" />
        </div>

        <div className={styles.playerMeta}>
          <div className={styles.playerNameRow}>
            <span className={styles.playerName}>{name}</span>
            <span className={styles.playerRating}>⚡ {rating}</span>
          </div>

          <div className={styles.capturedBox}>
            <div className={styles.capturedList} aria-label={`Captured pieces by ${name}`}>
              {groupedCaptures.map(({ type, count }) => (
                <span key={type} className={styles.capturedItem} title={`Captured ${count} ${type}(s)`}>
                  <ChessPieceSvg
                    type={type}
                    color={capturedPieceColor}
                    className={styles.capturedSvg}
                  />
                  {count > 1 && <span className={styles.captureCountBadge}>×{count}</span>}
                </span>
              ))}
            </div>

            {materialLead !== null && materialLead > 0 && (
              <span className={styles.materialLead} title={`Material advantage +${materialLead}`}>
                +{materialLead}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={clockClasses}
        role="timer"
        aria-live="polite"
        aria-label={`${name}'s remaining clock: ${formatTime(time)}`}
      >
        {active && <span className={styles.clockPulseBeacon} aria-hidden="true" />}
        {formatTime(time)}
      </div>
    </div>
  );
}
