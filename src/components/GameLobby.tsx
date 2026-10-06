'use client';

import { useState, useSyncExternalStore } from 'react';
import styles from './GameLobby.module.css';
import { playerNameStore } from '@/lib/playerName';

interface GameLobbyProps {
  onSelectMode: (mode: 'local' | 'friend' | 'create' | 'ai', difficulty?: number) => void;
  onJoinWithCode: (roomId: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function GameLobby({
  onSelectMode,
  onJoinWithCode,
  isLoading = false,
  soundEnabled = true,
  onToggleSound,
}: GameLobbyProps) {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [roomCode, setRoomCode] = useState('');
  const playerName = useSyncExternalStore(
    playerNameStore.subscribe,
    playerNameStore.get,
    playerNameStore.getServerSnapshot
  );
  const [tempPlayerName, setTempPlayerName] = useState('Ritesh');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<number>(3);

  const handleSaveName = (newName: string) => {
    const trimmed = newName.trim() || 'Ritesh';
    playerNameStore.set(trimmed);
  };

  const handleJoin = async () => {
    const trimmedCode = roomCode.trim().toUpperCase();
    const trimmedName = playerName.trim() || 'Ritesh';

    if (!trimmedCode) {
      setJoinError('Please enter a room code.');
      return;
    }

    setJoinError(null);
    setIsJoining(true);

    try {
      const result = await onJoinWithCode(trimmedCode, trimmedName);
      if (!result.success) {
        setJoinError(result.error || 'Failed to join game room.');
      }
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Error connecting to server.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.lobbyWrapper}>
      {/* Top Header Bar */}
      <header className="platform-header">
        <div className="brand-section">
          <span className="brand-logo">♛</span>
          <div className="brand-title-group">
            <h1 className="brand-title">RITESH CHESS</h1>
            <span className="brand-subtitle">CHESS ARENA</span>
          </div>
        </div>

        {/* Right side controls: 🔊 | ⚙️ | 👤 Profile */}
        <div className="header-controls">
          <button
            className="icon-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              setTempPlayerName(playerName);
              setShowSettingsModal(true);
            }}
            title="Settings"
          >
            ⚙️
          </button>

          <div
            className="profile-badge"
            onClick={() => setShowProfileModal(true)}
            style={{ cursor: 'pointer' }}
            title="View Player Profile"
          >
            <div className="profile-avatar">{playerName.charAt(0).toUpperCase()}</div>
            <div className="profile-info">
              <span className="profile-name">{playerName}</span>
              <span className="profile-rating">⚡ 1450</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.lobbyContainer}>
        {/* Hero Area */}
        <section className={styles.heroSection}>
          <span className={styles.heroBadge}>MASTER PLATFORM</span>
          <h2 className={styles.mainTitle}>
            CHOOSE YOUR <span className={styles.brandHighlight}>GAME MODE</span>
          </h2>
          <p className={styles.subTitle}>
            Experience master-class chess across intelligent AI, local head-to-head, and real-time online multiplayer.
          </p>
        </section>

        {/* 4 Interactive Game Cards */}
        <div className={styles.modesGrid}>
          {/* Card 1: Play vs AI */}
          <div className={styles.modeCard}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>🤖</div>
                <span className={styles.modeBadge}>AI ENGINE</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>PLAY VS COMPUTER</h3>
                <p className={styles.cardDesc}>
                  Practice against an intelligent chess engine with instant tactical responses.
                </p>
              </div>

              <div className={styles.difficultyGroup}>
                <span className={styles.difficultyLabel}>ENGINE DIFFICULTY</span>
                <div className={styles.difficultyButtons}>
                  <button
                    className={`${styles.difficultyBtn} ${aiDifficulty === 1 ? styles.active : ''}`}
                    onClick={() => setAiDifficulty(1)}
                  >
                    Easy
                  </button>
                  <button
                    className={`${styles.difficultyBtn} ${aiDifficulty === 3 ? styles.active : ''}`}
                    onClick={() => setAiDifficulty(3)}
                  >
                    Medium
                  </button>
                  <button
                    className={`${styles.difficultyBtn} ${aiDifficulty === 5 ? styles.active : ''}`}
                    onClick={() => setAiDifficulty(5)}
                  >
                    Hard
                  </button>
                </div>
              </div>
            </div>

            <button
              className={styles.ctaBtn}
              onClick={() => onSelectMode('ai', aiDifficulty)}
              disabled={isLoading || isJoining}
              style={{ marginTop: '1.5rem' }}
            >
              PLAY VS COMPUTER →
            </button>
          </div>

          {/* Card 2: Local 2-Player */}
          <div className={styles.modeCard}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>👥</div>
                <span className={styles.modeBadge}>SAME DEVICE</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>LOCAL 2-PLAYER</h3>
                <p className={styles.cardDesc}>
                  Play head-to-head with a friend on the same screen with move timers and history.
                </p>
              </div>
            </div>

            <button
              className={styles.ctaBtn}
              onClick={() => onSelectMode('local')}
              disabled={isLoading || isJoining}
            >
              START LOCAL GAME →
            </button>
          </div>

          {/* Card 3: Create Online Game */}
          <div className={styles.modeCard}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>🔗</div>
                <span className={styles.modeBadge}>PRIVATE ROOM · REAL-TIME</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>CREATE ONLINE GAME</h3>
                <p className={styles.cardDesc}>
                  Create a private room and invite a friend using an instant 6-digit code or link.
                </p>
              </div>
            </div>

            <button
              className={styles.ctaBtn}
              onClick={() => onSelectMode('create')}
              disabled={isLoading || isJoining}
            >
              CREATE ROOM →
            </button>
          </div>

          {/* Card 4: Join Game */}
          <div className={styles.modeCard}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>🎯</div>
                <span className={styles.modeBadge}>ENTER CODE</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>JOIN GAME</h3>
                <p className={styles.cardDesc}>
                  Have a room code? Enter it below and jump directly into a live online match.
                </p>
              </div>
            </div>

            <button
              className={styles.ctaBtn}
              onClick={() => {
                setShowJoinForm(true);
                setJoinError(null);
              }}
              disabled={isLoading || isJoining}
            >
              JOIN ROOM →
            </button>
          </div>
        </div>

        {/* Join Game Modal Overlay */}
        {showJoinForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Join Online Match</h3>
              <p className={styles.modalSub}>Enter your room code to connect instantly</p>

              {joinError && (
                <div className={styles.errorBox}>
                  ⚠️ {joinError}
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Your Name</label>
                <input
                  type="text"
                  placeholder="Your Name (e.g. Ritesh)"
                  value={playerName}
                  onChange={(e) => handleSaveName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Room Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit Code (e.g. X7K9PQ)"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  maxLength={10}
                  className={styles.input}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin();
                  }}
                />
              </div>

              <div className={styles.formButtons}>
                <button
                  onClick={handleJoin}
                  disabled={!roomCode.trim() || isLoading || isJoining}
                  className={styles.modalPrimaryBtn}
                >
                  {isJoining || isLoading ? 'Connecting...' : 'JOIN ROOM →'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinError(null);
                  }}
                  className={styles.modalSecondaryBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>⚙️ Settings</h3>
              <p className={styles.modalSub}>Customize your platform experience</p>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Player Name</label>
                <input
                  type="text"
                  value={tempPlayerName}
                  onChange={(e) => setTempPlayerName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.inputLabel} style={{ margin: 0 }}>Sound Effects</span>
                <button
                  className={styles.modalSecondaryBtn}
                  style={{ flex: 'none', padding: '0.4rem 1rem' }}
                  onClick={onToggleSound}
                >
                  {soundEnabled ? '🔊 Enabled' : '🔇 Muted'}
                </button>
              </div>

              <div className={styles.inputGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span className={styles.inputLabel} style={{ margin: 0 }}>Theme</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                  Emerald & Gold Dark Glass
                </span>
              </div>

              <div className={styles.formButtons} style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => {
                    handleSaveName(tempPlayerName);
                    setShowSettingsModal(false);
                  }}
                  className={styles.modalPrimaryBtn}
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={styles.modalSecondaryBtn}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Profile Modal */}
        {showProfileModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-gold) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#050608',
                    margin: '0 auto 0.8rem auto',
                    boxShadow: '0 0 20px rgba(217, 169, 40, 0.4)',
                  }}
                >
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <h3 className={styles.modalTitle} style={{ margin: 0 }}>{playerName}</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>⚡ 1450 ELO</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.6rem',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>12</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Played</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>8</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Won</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>67%</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Win Rate</span>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className={styles.modalPrimaryBtn}
                style={{ width: '100%' }}
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
