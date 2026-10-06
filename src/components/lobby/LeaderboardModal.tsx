'use client';

import React, { useState } from 'react';
import styles from './LeaderboardModal.module.css';

interface LeaderboardEntry {
  rank: number;
  name: string;
  title?: string;
  rating: number;
  winRate: number;
  streak: number;
  flag: string;
  isSelf?: boolean;
}

const LEADERBOARD_DATA: Record<'rapid' | 'blitz' | 'bullet' | 'puzzles', LeaderboardEntry[]> = {
  rapid: [
    { rank: 1, name: 'Magnus C.', title: 'GM', rating: 2835, winRate: 78, streak: 12, flag: '🇳🇴' },
    { rank: 2, name: 'Hikaru N.', title: 'GM', rating: 2818, winRate: 75, streak: 9, flag: '🇺🇸' },
    { rank: 3, name: 'Gukesh D.', title: 'GM', rating: 2794, winRate: 72, streak: 7, flag: '🇮🇳' },
    { rank: 4, name: 'Alireza F.', title: 'GM', rating: 2780, winRate: 71, streak: 5, flag: '🇫🇷' },
    { rank: 5, name: 'Nodirbek A.', title: 'GM', rating: 2772, winRate: 69, streak: 4, flag: '🇺🇿' },
    { rank: 6, name: 'Pragg R.', title: 'GM', rating: 2768, winRate: 68, streak: 6, flag: '🇮🇳' },
    { rank: 7, name: 'Fabiano C.', title: 'GM', rating: 2765, winRate: 67, streak: 3, flag: '🇺🇸' },
    { rank: 142, name: 'Ritesh (You)', rating: 1450, winRate: 68, streak: 4, flag: '🇮🇳', isSelf: true },
  ],
  blitz: [
    { rank: 1, name: 'Hikaru N.', title: 'GM', rating: 2885, winRate: 82, streak: 15, flag: '🇺🇸' },
    { rank: 2, name: 'Magnus C.', title: 'GM', rating: 2872, winRate: 80, streak: 11, flag: '🇳🇴' },
    { rank: 3, name: 'Alireza F.', title: 'GM', rating: 2820, winRate: 74, streak: 8, flag: '🇫🇷' },
    { rank: 4, name: 'Daniel N.', title: 'GM', rating: 2804, winRate: 73, streak: 6, flag: '🇺🇸' },
    { rank: 5, name: 'Nihal S.', title: 'GM', rating: 2788, winRate: 71, streak: 7, flag: '🇮🇳' },
    { rank: 189, name: 'Ritesh (You)', rating: 1398, winRate: 64, streak: 3, flag: '🇮🇳', isSelf: true },
  ],
  bullet: [
    { rank: 1, name: 'Daniel N.', title: 'GM', rating: 2920, winRate: 85, streak: 18, flag: '🇺🇸' },
    { rank: 2, name: 'Hikaru N.', title: 'GM', rating: 2914, winRate: 84, streak: 14, flag: '🇺🇸' },
    { rank: 3, name: 'Magnus C.', title: 'GM', rating: 2890, winRate: 81, streak: 10, flag: '🇳🇴' },
    { rank: 4, name: 'Andrew T.', title: 'GM', rating: 2845, winRate: 76, streak: 8, flag: '🇺🇸' },
    { rank: 215, name: 'Ritesh (You)', rating: 1360, winRate: 61, streak: 2, flag: '🇮🇳', isSelf: true },
  ],
  puzzles: [
    { rank: 1, name: 'Ray R.', title: 'GM', rating: 3650, winRate: 98, streak: 45, flag: '🇺🇸' },
    { rank: 2, name: 'Vidit G.', title: 'GM', rating: 3590, winRate: 97, streak: 38, flag: '🇮🇳' },
    { rank: 3, name: 'Wesley S.', title: 'GM', rating: 3540, winRate: 96, streak: 32, flag: '🇺🇸' },
    { rank: 4, name: 'Anish G.', title: 'GM', rating: 3510, winRate: 95, streak: 29, flag: '🇳🇱' },
    { rank: 88, name: 'Ritesh (You)', rating: 1620, winRate: 88, streak: 8, flag: '🇮🇳', isSelf: true },
  ],
};

interface LeaderboardModalProps {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [activeCategory, setActiveCategory] = useState<'rapid' | 'blitz' | 'bullet' | 'puzzles'>('rapid');
  const list = LEADERBOARD_DATA[activeCategory];

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Global Leaderboard">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.badge}>
              <span className={styles.badgeDot} />
              FIDE RATED DIVISION
            </span>
            <h2 className={styles.title}>Global Leaderboards</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Time Control Categories */}
        <div className={styles.tabs} role="tablist">
          {(['rapid', 'blitz', 'bullet', 'puzzles'] as const).map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`${styles.tabBtn} ${activeCategory === cat ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'rapid' ? '⏱ Rapid' : cat === 'blitz' ? '⚡ Blitz' : cat === 'bullet' ? '🚀 Bullet' : '🧩 Puzzles'}
            </button>
          ))}
        </div>

        {/* Player Ranks List */}
        <div className={styles.list} role="list">
          {list.map((player) => {
            const isTop1 = player.rank === 1;
            const isTop2 = player.rank === 2;
            const isTop3 = player.rank === 3;
            const rankClass = isTop1 ? styles.rankTop1 : isTop2 ? styles.rankTop2 : isTop3 ? styles.rankTop3 : '';

            return (
              <div
                key={player.rank}
                className={`${styles.item} ${player.isSelf ? styles.itemSelf : ''}`}
                role="listitem"
              >
                <div className={`${styles.rankBadge} ${rankClass}`}>
                  {isTop1 ? '🥇 1' : isTop2 ? '🥈 2' : isTop3 ? '🥉 3' : `#${player.rank}`}
                </div>

                <div className={styles.playerInfo}>
                  <div className={styles.avatar}>
                    {player.name.charAt(0)}
                  </div>
                  <div className={styles.names}>
                    <span>{player.flag}</span>
                    {player.title && <span className={styles.titleTag}>{player.title}</span>}
                    <span className={styles.playerName}>{player.name}</span>
                  </div>
                </div>

                <div className={styles.statsMeta}>
                  <span title="Win rate">{player.winRate}% win</span>
                  <span title="Win streak">🔥 {player.streak}</span>
                </div>

                <div className={styles.rating}>
                  {player.rating.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerText}>Rankings update in real-time following authoritative match results.</span>
          <button className="btn" onClick={onClose}>
            Back to Arena
          </button>
        </div>
      </div>
    </div>
  );
}

