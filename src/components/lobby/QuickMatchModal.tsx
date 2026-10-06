'use client';

import React, { useState, useEffect } from 'react';
import styles from './QuickMatchModal.module.css';

export type TimeControlId = 'bullet' | 'blitz' | 'rapid';

interface QuickMatchModalProps {
  onClose: () => void;
  isSearching: boolean;
  onStartSearch: (timeControl: TimeControlId) => void;
  onCancelSearch: () => void;
}

export default function QuickMatchModal({
  onClose,
  isSearching,
  onStartSearch,
  onCancelSearch,
}: QuickMatchModalProps) {
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlId>('blitz');
  const [searchSeconds, setSearchSeconds] = useState(0);

  useEffect(() => {
    if (!isSearching) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      setSearchSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [isSearching]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className={styles.badge}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brass-burnished, #c29b48)' }} />
              LIVE ARENA • GLOBAL COMPETITIVE QUEUE
            </span>
            <h2 className={styles.title}>1-Click Instant Matchmaking</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {!isSearching ? (
            <>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--boxwood-subtle, #9e978a)' }}>
                Select your tournament time control to enter the live queue:
              </p>

              <div className={styles.timeControlGrid}>
                <button
                  type="button"
                  className={`${styles.timeCard} ${selectedTimeControl === 'bullet' ? styles.timeCardSelected : ''}`}
                  onClick={() => setSelectedTimeControl('bullet')}
                >
                  <span className={styles.timeIcon}>⚡</span>
                  <span className={styles.timeTitle}>1 min</span>
                  <span className={styles.timeSub}>Bullet</span>
                </button>

                <button
                  type="button"
                  className={`${styles.timeCard} ${selectedTimeControl === 'blitz' ? styles.timeCardSelected : ''}`}
                  onClick={() => setSelectedTimeControl('blitz')}
                >
                  <span className={styles.timeIcon}>🔥</span>
                  <span className={styles.timeTitle}>3 min</span>
                  <span className={styles.timeSub}>Blitz</span>
                </button>

                <button
                  type="button"
                  className={`${styles.timeCard} ${selectedTimeControl === 'rapid' ? styles.timeCardSelected : ''}`}
                  onClick={() => setSelectedTimeControl('rapid')}
                >
                  <span className={styles.timeIcon}>⏱</span>
                  <span className={styles.timeTitle}>10 min</span>
                  <span className={styles.timeSub}>Rapid</span>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.searchingBox}>
              <div className={styles.radarPulse}>♞</div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--boxwood-pure, #ede4d3)' }}>
                  Searching for {selectedTimeControl.toUpperCase()} Opponent...
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--boxwood-subtle, #9e978a)' }}>
                  Pairing with active tournament players
                </span>
              </div>
              <span className={styles.queueTimer}>{formatTimer(searchSeconds)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {!isSearching ? (
            <>
              <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.primaryBtn}`}
                onClick={() => onStartSearch(selectedTimeControl)}
              >
                ⚔ Find Opponent Now
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.secondaryBtn}`}
              onClick={onCancelSearch}
            >
              Cancel Matchmaking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
