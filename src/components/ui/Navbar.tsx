'use client';

import React from 'react';
import styles from './Navbar.module.css';

interface NavbarProps {
  onHome?: () => void;
  leftSlot?: React.ReactNode;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onSettings?: () => void;
  onOpenPuzzles?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenProfile?: () => void;
  onOpenLearn?: () => void;
  playerName?: string;
}

export default function Navbar({
  onHome,
  leftSlot,
  soundEnabled,
  onToggleSound,
  onSettings,
  onOpenPuzzles,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenLearn,
  playerName = 'Ritesh',
}: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <div
        className={styles.brand}
        onClick={onHome}
        role={onHome ? 'button' : undefined}
        tabIndex={onHome ? 0 : undefined}
        onKeyDown={(e) => {
          if (onHome && (e.key === 'Enter' || e.key === ' ')) onHome();
        }}
      >
        <span className={styles.logo} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-1.1 0-2 .9-2 2 0 .5.2 1 .5 1.3C8.6 6 7.5 7.5 7.5 9.5c0 1 .4 1.9 1 2.6-2.2.8-4 2.8-4.5 5.4V19h16v-1.5c-.5-2.6-2.3-4.6-4.5-5.4.6-.7 1-1.6 1-2.6 0-2-1.1-3.5-3-4.2.3-.3.5-.8.5-1.3 0-1.1-.9-2-2-2zm-6.5 18v1.5c0 .8.7 1.5 1.5 1.5h10c.8 0 1.5-.7 1.5-1.5V20h-13z" />
          </svg>
        </span>
        <div className={styles.titleGroup}>
          <span className={styles.title}>RITESH CHESS</span>
          <span className={styles.subtitle}>CHAMPIONSHIP ARENA</span>
        </div>
      </div>

      <nav className={styles.links} aria-label="Main navigation">
        <button
          type="button"
          className={`${styles.link} ${styles.active}`}
          onClick={onHome}
        >
          Play
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={onOpenPuzzles}
        >
          Puzzles
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={onOpenLeaderboard}
        >
          Leaderboard
        </button>
        {onOpenLearn && (
          <button
            type="button"
            className={styles.link}
            onClick={onOpenLearn}
          >
            Learn
          </button>
        )}
      </nav>

      <div className={styles.controls}>
        {leftSlot}
        {onToggleSound && (
          <button
            className="icon-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        )}
        {onSettings && (
          <button className="icon-btn" onClick={onSettings} title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
        <div
          className={styles.profile}
          title="View Grandmaster Profile"
          role="button"
          tabIndex={0}
          onClick={onOpenProfile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpenProfile?.();
          }}
          style={{ cursor: onOpenProfile ? 'pointer' : 'default' }}
        >
          <span className={styles.avatar} aria-hidden="true">
            {playerName.charAt(0).toUpperCase()}
          </span>
          <span className={styles.profileInfo}>
            <span className={styles.profileName}>{playerName}</span>
            <span className={styles.profileRating}>⚡ 1450</span>
          </span>
        </div>
      </div>
    </header>
  );
}
