'use client';

import React, { useState } from 'react';
import styles from './BotSelectModal.module.css';
import { BOT_PERSONAS, type BotPersona } from '@/lib/bot-personas';

interface BotSelectModalProps {
  onClose: () => void;
  onSelectBot: (bot: BotPersona) => void;
  selectedBotId?: string;
}

export default function BotSelectModal({
  onClose,
  onSelectBot,
  selectedBotId = 'bot-tal',
}: BotSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string>(selectedBotId);

  const handleStart = () => {
    const found = BOT_PERSONAS.find((b) => b.id === selectedId) || BOT_PERSONAS[2];
    onSelectBot(found);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className={styles.badge}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brass-burnished, #c29b48)' }} />
              ENGINE OPPONENTS • ARCHIVAL BOT ROSTER
            </span>
            <h2 className={styles.title}>Select Computer Opponent</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Bot Grid */}
        <div className={styles.botGrid}>
          {BOT_PERSONAS.map((bot) => {
            const isSelected = selectedId === bot.id;
            return (
              <button
                key={bot.id}
                type="button"
                className={`${styles.botCard} ${isSelected ? styles.botCardSelected : ''}`}
                onClick={() => setSelectedId(bot.id)}
              >
                <div className={styles.avatarWrap} style={{ color: bot.accentColor }}>
                  {bot.avatarChar}
                </div>

                <div className={styles.botMeta}>
                  <div className={styles.botHeader}>
                    <span className={styles.botName}>{bot.name}</span>
                    <span className={styles.botBadge}>{bot.badge}</span>
                  </div>
                  <span className={styles.botBio}>{bot.bio}</span>
                </div>

                <div className={styles.botRatingCol}>
                  <span className={styles.ratingNumber}>{bot.rating}</span>
                  <span className={styles.ratingLabel}>ELO Rating</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={`${styles.btn} ${styles.secondaryBtn}`} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`${styles.btn} ${styles.primaryBtn}`} onClick={handleStart}>
            ⚔ Challenge Opponent
          </button>
        </div>
      </div>
    </div>
  );
}

