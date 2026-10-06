'use client';

import styles from './Modals.module.css';

interface JoinRoomModalProps {
  onClose: () => void;
}

export default function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  return (
    <div className="modalOverlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Join online match">
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Join Online Match</h3>
        <p className={styles.sub}>Enter your room code to connect instantly</p>
        <p className={styles.note}>Room-code joining is handled from the lobby card.</p>
        <button className={styles.secondaryBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
