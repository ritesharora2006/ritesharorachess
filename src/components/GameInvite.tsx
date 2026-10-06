'use client';

import { useState } from 'react';
import styles from './GameInvite.module.css';

interface GameInviteProps {
  roomId: string;
  playerName: string;
  onCopyLink: () => void;
  waitingForOpponent: boolean;
  onCancel?: () => void;
}

export default function GameInvite({
  roomId,
  playerName,
  onCopyLink,
  waitingForOpponent,
  onCancel,
}: GameInviteProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const formattedCode = roomId.length === 6 ? `${roomId.substring(0, 3)}-${roomId.substring(3)}` : roomId;
  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/game/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    onCopyLink();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <span className={styles.badge}>CREATE PRIVATE GAME</span>
        <h2 className={styles.title}>Your Room Code</h2>
        <p className={styles.subtitle}>Share this code or link with your opponent to play live</p>

        <div className={styles.codeSection}>
          <span className={styles.codeLabel}>ROOM CODE</span>
          <div className={styles.codeBox}>{formattedCode}</div>

          <div className={styles.buttonRow}>
            <button
              onClick={handleCopyCode}
              className={`${styles.actionBtn} ${copiedCode ? styles.copied : ''}`}
            >
              {copiedCode ? '✓ CODE COPIED' : 'COPY CODE'}
            </button>
            <button
              onClick={handleCopyLink}
              className={`${styles.actionBtn} ${copiedLink ? styles.copied : ''}`}
            >
              {copiedLink ? '✓ LINK COPIED' : 'COPY LINK'}
            </button>
          </div>

          <div className={styles.linkContainer}>
            <input
              type="text"
              value={inviteLink}
              readOnly
              className={styles.linkInput}
            />
          </div>
        </div>

        <div className={styles.playerInfo}>
          Playing as: <span className={styles.playerName}>{playerName} (White)</span>
        </div>

        {waitingForOpponent && (
          <div className={styles.waitingSection}>
            <div className={styles.pulseDots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
            <p className={styles.waitingText}>Waiting for player to join...</p>
            <p className={styles.hintText}>Match starts automatically when Player 2 connects</p>

            {onCancel && (
              <button onClick={onCancel} className={styles.cancelBtn}>
                CANCEL GAME
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
