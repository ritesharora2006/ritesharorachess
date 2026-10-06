'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import styles from './GameLobby.module.css';
import { playerNameStore } from '@/lib/playerName';
import Navbar from '@/components/ui/Navbar';
import JoinRoomModal from './JoinRoomModal';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import { DEFAULT_BOARD_THEME, BOARD_THEME_STORAGE_KEY, type BoardThemeId } from '@/lib/boardThemes';
import { type AtmosphereThemeId } from '@/lib/atmosphere-themes';
import HeroExhibitionBoard from './HeroExhibitionBoard';
import HeroOverturnedPieces from './HeroOverturnedPieces';
import ChessPieceSvg from '@/components/game/ChessPieceSvg';
import PuzzleModal from '@/components/puzzles/PuzzleModal';
import BotSelectModal from './BotSelectModal';
import QuickMatchModal, { type TimeControlId } from './QuickMatchModal';
import LeaderboardModal from './LeaderboardModal';
import type { BotPersona } from '@/lib/bot-personas';

function useAnimatedCount(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      const frame = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(frame);
    }

    let startTime: number | null = null;
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(ease * target));

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [target, duration]);

  return value;
}

interface GameLobbyProps {
  onSelectMode: (mode: 'local' | 'friend' | 'create' | 'ai', difficulty?: number) => void;
  onJoinWithCode: (roomId: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
  onQuickMatch?: (timeControl: TimeControlId) => void;
  isSearchingMatch?: boolean;
  onCancelQuickMatch?: () => void;
  onSelectBotPersona?: (bot: BotPersona) => void;
  isLoading?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  boardTheme?: BoardThemeId;
  onBoardTheme?: (theme: BoardThemeId) => void;
  atmosphereTheme?: AtmosphereThemeId;
  onAtmosphereTheme?: (theme: AtmosphereThemeId) => void;
  onReplayIntro?: () => void;
}

export default function GameLobby({
  onSelectMode,
  onJoinWithCode,
  onQuickMatch,
  isSearchingMatch = false,
  onCancelQuickMatch,
  onSelectBotPersona,
  isLoading = false,
  soundEnabled = true,
  onToggleSound,
  boardTheme: boardThemeProp = DEFAULT_BOARD_THEME,
  onBoardTheme,
  atmosphereTheme = 'grandmaster-hall',
  onAtmosphereTheme,
  onReplayIntro,
}: GameLobbyProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [showBotModal, setShowBotModal] = useState(false);
  const [showQuickMatchModal, setShowQuickMatchModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<number>(3);
  const [localBoardTheme, setLocalBoardTheme] = useState<BoardThemeId>(boardThemeProp);
  const boardTheme = onBoardTheme ? boardThemeProp : localBoardTheme;

  const handleBoardTheme = (theme: BoardThemeId) => {
    setLocalBoardTheme(theme);
    onBoardTheme?.(theme);
    localStorage.setItem(BOARD_THEME_STORAGE_KEY, theme);
  };

  const playerName = useSyncExternalStore(
    playerNameStore.subscribe,
    playerNameStore.get,
    playerNameStore.getServerSnapshot
  );
  const [tempPlayerName, setTempPlayerName] = useState('Ritesh');

  const animatedRating = useAnimatedCount(1450, 900);
  const animatedGames = useAnimatedCount(12, 600);
  const animatedWinRate = useAnimatedCount(68, 800);
  const animatedPlayers = useAnimatedCount(2481, 1000);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  const handleSaveName = (newName: string) => {
    playerNameStore.set(newName.trim() || 'Ritesh');
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
    <div className={styles.lobby}>
      <Navbar
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onSettings={() => {
          setTempPlayerName(playerName);
          setShowSettings(true);
        }}
        onOpenPuzzles={() => setShowPuzzleModal(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenProfile={() => setShowProfile(true)}
        playerName={playerName}
      />

      <main className={styles.main}>
        {/* Tournament Hero */}
        <section className={styles.hero}>
          <HeroOverturnedPieces />

          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true" />
              CHAMPIONSHIP HALL • FIDE STANDARD
            </span>
            <h1 className={styles.heroTitle} aria-label="PRECISION IN EVERY POSITION.">
              <span className={styles.titleWord} style={{ animationDelay: '650ms' }}>PRECISION</span>{' '}
              <span className={styles.titleWord} style={{ animationDelay: '800ms' }}>IN</span>{' '}
              <span className={styles.titleWord} style={{ animationDelay: '920ms' }}>EVERY</span>{' '}
              <span className={`${styles.titleWord} ${styles.heroAccent}`} style={{ animationDelay: '1080ms' }}>POSITION.</span>
            </h1>
            <p className={styles.heroSub}>
              Compete under tournament clocks, analyze with master Stockfish evaluation, and climb the official division standings.
            </p>

            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{animatedRating.toLocaleString()}</span>
                <span className={styles.statLabel}>Rapid Rating</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.statItem}>
                <span className={styles.statValue}>{animatedGames}</span>
                <span className={styles.statLabel}>Games This Week</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.statItem}>
                <span className={styles.statValue}>{animatedWinRate}%</span>
                <span className={styles.statLabel}>Win Rate</span>
              </div>
            </div>
          </div>

          <div className={styles.boardPreviewWrap}>
            <HeroExhibitionBoard />
          </div>
        </section>

        {/* Quick-Access Tournament Modules */}
        <div className={styles.dashboardStrip}>
          <div
            className={styles.stripModule}
            role="button"
            tabIndex={0}
            onClick={() => setShowPuzzleModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.stripIconWrap} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 11a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H6a2 2 0 0 1-2-2v-2z" />
              </svg>
            </div>
            <div className={styles.stripBody}>
              <span className={styles.stripLabel}>DAILY PUZZLE</span>
              <strong className={styles.stripTitle}>Find the Winning Fork</strong>
              <small className={styles.stripSub}>Tactical rating 1,120 • ♞ Knight fork</small>
            </div>
            <span className={styles.stripArrow} aria-hidden="true">→</span>
          </div>

          <div
            className={styles.stripModule}
            role="button"
            tabIndex={0}
            onClick={() => setShowQuickMatchModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.stripIconWrap} aria-hidden="true">
              <span className={styles.stripLiveDot} />
            </div>
            <div className={styles.stripBody}>
              <span className={styles.stripLabel}>LIVE ARENA</span>
              <strong className={styles.stripTitle}>{animatedPlayers.toLocaleString()} Players Online</strong>
              <small className={styles.stripSub}>Average match queue &lt; 3s</small>
            </div>
            <span className={styles.stripArrow} aria-hidden="true">→</span>
          </div>

          <div
            className={styles.stripModule}
            role="button"
            tabIndex={0}
            onClick={() => setShowLeaderboard(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.stripIconWrap} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m12 6h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M6 3h12v7a6 6 0 0 1-12 0V3zM9 21h6m-3-6v6" />
              </svg>
            </div>
            <div className={styles.stripBody}>
              <span className={styles.stripLabel}>LEADERBOARD</span>
              <strong className={styles.stripTitle}>Grandmaster Division</strong>
              <small className={styles.stripSub}>Top 100 players this season</small>
            </div>
            <span className={styles.stripArrow} aria-hidden="true">→</span>
          </div>
        </div>

        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>SELECT GAME MODE</h2>
          <span className={styles.sectionSub}>CHOOSE YOUR ARENA</span>
        </div>

        {/* Main Play Options */}
        <div className={styles.grid}>
          {/* 1 — Featured: Play vs Computer */}
          <section
            className={`${styles.card} ${styles.featured}`}
            onMouseMove={handleCardMouseMove}
          >
            <span className={styles.featuredTag}>
              <span className={styles.featuredTagDot} aria-hidden="true" />
              STOCKFISH 17
            </span>
            <div className={styles.cardHead}>
              <span className={`${styles.icon} ${styles.aiIcon}`} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
                </svg>
                <span className={styles.enginePulseGlow} />
              </span>
              <span className={styles.badge}>AI ENGINE</span>
            </div>
            <h3 className={styles.cardTitle}>PLAY COMPUTER</h3>
            <p className={styles.cardDesc}>
              Practice against an intelligent chess engine with instant tactical responses and adaptive evaluation.
            </p>

            <fieldset className={styles.difficulty}>
              <legend className={styles.difficultyLabel}>ENGINE DIFFICULTY</legend>
              <div className={styles.difficultyRow} role="radiogroup" aria-label="Engine difficulty">
                {([1, 3, 5] as const).map((level, i) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={aiDifficulty === level}
                    className={`${styles.difficultyBtn} ${aiDifficulty === level ? styles.difficultyActive : ''}`}
                    onClick={() => setAiDifficulty(level)}
                  >
                    {['Easy', 'Medium', 'Hard'][i]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.difficultyBtn}
                onClick={() => setShowBotModal(true)}
                style={{
                  width: '100%',
                  marginTop: '0.65rem',
                  padding: '0.45rem',
                  background: 'rgba(194, 155, 72, 0.08)',
                  border: '1px solid var(--brass-rule)',
                  color: 'var(--brass-burnished)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                ⚔ CHOOSE BOT PERSONA (NOAH, ARYA, TAL, MAGNUS)
              </button>
            </fieldset>

            <button
              className={styles.ctaPrimary}
              onClick={() => onSelectMode('ai', aiDifficulty)}
              disabled={isLoading}
            >
              <span className={styles.ctaPieceNod} aria-hidden="true">
                <ChessPieceSvg type="pawn" color="black" className={styles.ctaPieceSvg} />
              </span>
              {isLoading ? 'STARTING…' : 'START ENGINE MATCH'}
              <span aria-hidden="true">→</span>
            </button>
          </section>

          {/* 2 — Local 2 Player */}
          <section
            className={styles.card}
            onMouseMove={handleCardMouseMove}
          >
            <div className={styles.cardHead}>
              <span className={`${styles.icon} ${styles.friendIcon}`} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="8" r="3.2" className={styles.duelAvatarLeft} />
                  <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
                  <circle cx="17" cy="9" r="2.5" className={styles.duelAvatarRight} />
                  <path d="M15.5 15.2c2.8.3 5 2.2 5 4.8" />
                </svg>
              </span>
              <span className={styles.badge}>SAME DEVICE</span>
            </div>
            <h3 className={styles.cardTitle}>PLAY A FRIEND</h3>
            <p className={styles.cardDesc}>
              Play head-to-head with a friend on the same screen, with tournament clocks, timers, and notation history.
            </p>
            <button className={styles.cta} onClick={() => onSelectMode('local')} disabled={isLoading}>
              START LOCAL GAME <span aria-hidden="true">→</span>
            </button>
          </section>

          {/* 3 — Create Online Game */}
          <section
            className={styles.card}
            onMouseMove={handleCardMouseMove}
          >
            <div className={styles.cardHead}>
              <span className={`${styles.icon} ${styles.linkIcon}`} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                  <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                </svg>
                <span className={styles.beaconRing} />
              </span>
              <span className={styles.badge}>PRIVATE ROOM</span>
            </div>
            <h3 className={styles.cardTitle}>ONLINE CHESS</h3>
            <p className={styles.cardDesc}>
              Create a private room, generate an instant code, and invite a friend anywhere in real-time.
            </p>
            <button className={styles.cta} onClick={() => onSelectMode('create')} disabled={isLoading}>
              CREATE PRIVATE ROOM <span aria-hidden="true">→</span>
            </button>
          </section>

          {/* 4 — Join Online Game */}
          <section
            className={styles.card}
            onMouseMove={handleCardMouseMove}
          >
            <div className={styles.cardHead}>
              <span className={`${styles.icon} ${styles.joinIcon}`} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
              </span>
              <span className={styles.badge}>ENTER CODE</span>
            </div>
            <h3 className={styles.cardTitle}>JOIN A LIVE GAME</h3>
            <p className={styles.cardDesc}>Have a room code? Drop it in and jump straight into a live match.</p>

            <form
              className={styles.joinForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleJoin();
              }}
            >
              <div className={styles.joinInputWrap}>
                <input
                  className={styles.joinInput}
                  type="text"
                  placeholder="ROOM CODE (E.G. X7K9PQ)"
                  value={roomCode}
                  maxLength={10}
                  aria-label="Room code"
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                />
                <span className={styles.inputLaserLine} aria-hidden="true" />
              </div>
              {joinError && (
                <p className={styles.joinError} role="alert">
                  ⚠️ {joinError}
                </p>
              )}
              <button type="submit" className={styles.cta} disabled={!roomCode.trim() || isLoading || isJoining}>
                {isJoining ? 'CONNECTING…' : 'JOIN MATCH'} <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
        </div>
      </main>

      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} />}
      {showSettings && (
        <SettingsModal
          tempName={tempPlayerName}
          onTempName={setTempPlayerName}
          onSave={() => {
            handleSaveName(tempPlayerName);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          boardTheme={boardTheme}
          onBoardTheme={handleBoardTheme}
          atmosphereTheme={atmosphereTheme}
          onAtmosphereTheme={onAtmosphereTheme}
          onReplayIntro={onReplayIntro}
        />
      )}
      {showProfile && <ProfileModal playerName={playerName} onClose={() => setShowProfile(false)} />}
      {showPuzzleModal && <PuzzleModal onClose={() => setShowPuzzleModal(false)} />}
      {showBotModal && (
        <BotSelectModal
          onClose={() => setShowBotModal(false)}
          onSelectBot={(bot) => {
            if (onSelectBotPersona) {
              onSelectBotPersona(bot);
            } else {
              onSelectMode('ai', bot.skillLevel);
            }
          }}
        />
      )}
      {showQuickMatchModal && (
        <QuickMatchModal
          onClose={() => setShowQuickMatchModal(false)}
          isSearching={Boolean(isSearchingMatch)}
          onStartSearch={(tc) => onQuickMatch?.(tc)}
          onCancelSearch={() => onCancelQuickMatch?.()}
        />
      )}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
