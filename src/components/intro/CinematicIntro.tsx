'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import ChessPieceSvg from '@/components/game/ChessPieceSvg';
import { playSound } from '@/lib/sound-effects';
import styles from './CinematicIntro.module.css';

interface CinematicIntroProps {
  onComplete: () => void;
  soundEnabled?: boolean;
}

export default function CinematicIntro({ onComplete, soundEnabled = true }: CinematicIntroProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [moveStep, setMoveStep] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 6;
    }
    return 0;
  });
  const hasFinishedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingVoiceRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsDismissing(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  // Keyboard shortcut listener (ESC, Space, Enter to skip immediately)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleComplete]);

  // Attempt to play welcome voice with autoplay fallback
  const startVoice = useCallback(() => {
    if (!soundEnabled || hasFinishedRef.current || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.95;

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAudioBlocked(false);
          isPlayingVoiceRef.current = true;
        })
        .catch((err) => {
          // Browser autoplay restriction engaged: require user interaction
          console.log('[CinematicIntro] Browser autoplay blocked audio, waiting for user gesture', err);
          setAudioBlocked(true);
        });
    }
  }, [soundEnabled]);

  // Listen for any user gesture (click/tap/key) to unlock audio if blocked
  useEffect(() => {
    if (!audioBlocked) return;

    const handleGesture = () => {
      if (!hasFinishedRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.95;
        audioRef.current.play().then(() => {
          setAudioBlocked(false);
          isPlayingVoiceRef.current = true;
        }).catch(() => {});
      }
    };

    window.addEventListener('pointerdown', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, [audioBlocked]);

  // Choreographed Opening Sequence (Ruy Lopez / Spanish Opening)
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const timer = setTimeout(handleComplete, 2200);
      return () => clearTimeout(timer);
    }

    const timers: NodeJS.Timeout[] = [];

    // Cinematic Welcome Voice: begins at 350ms as board materializes
    timers.push(
      setTimeout(() => {
        if (!hasFinishedRef.current) {
          startVoice();
        }
      }, 350)
    );

    // Move 1: 1. e4 (0.8s)
    timers.push(
      setTimeout(() => {
        setMoveStep(1);
        try { playSound('move', 'wood'); } catch {}
      }, 800)
    );

    // Move 2: 1... e5 (1.5s)
    timers.push(
      setTimeout(() => {
        setMoveStep(2);
        try { playSound('move', 'wood'); } catch {}
      }, 1500)
    );

    // Move 3: 2. Nf3 (2.2s)
    timers.push(
      setTimeout(() => {
        setMoveStep(3);
        try { playSound('move', 'wood'); } catch {}
      }, 2200)
    );

    // Move 4: 2... Nc6 (2.8s)
    timers.push(
      setTimeout(() => {
        setMoveStep(4);
        try { playSound('move', 'wood'); } catch {}
      }, 2800)
    );

    // Move 5: 3. Bb5 (3.4s) — The Ruy Lopez strike!
    timers.push(
      setTimeout(() => {
        setMoveStep(5);
        try { playSound('check', 'wood'); } catch {}
      }, 3400)
    );

    // Act III: Hero Climax & Title Reveal (4.0s)
    timers.push(
      setTimeout(() => {
        setMoveStep(6);
        try { playSound('castle', 'wood'); } catch {}
      }, 4000)
    );

    // Auto-complete: ensures complete phrasing of voice line
    timers.push(
      setTimeout(() => {
        if (isPlayingVoiceRef.current && audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
          // If the voice is still finishing its final syllables, let it finish gracefully
          audioRef.current.addEventListener('ended', () => handleComplete(), { once: true });
          // Safety fallback timeout
          setTimeout(handleComplete, 1200);
        } else {
          handleComplete();
        }
      }, 5300)
    );

    const audioEl = audioRef.current;
    return () => {
      timers.forEach(clearTimeout);
      if (audioEl) {
        audioEl.pause();
      }
    };
  }, [handleComplete, soundEnabled, startVoice]);

  const handleStageClick = () => {
    if (audioBlocked) {
      startVoice();
    }
  };

  return (
    <aside
      className={`${styles.introStage} ${isDismissing ? styles.stageDismissing : ''}`}
      aria-label="Cinematic Opening Animation"
      role="region"
      onClick={handleStageClick}
    >
      {/* Hidden Audio Asset for Cinematic Welcome Voice */}
      <audio
        ref={audioRef}
        src="/audio/welcome-voice.mp3"
        preload="auto"
        playsInline
        onEnded={() => {
          isPlayingVoiceRef.current = false;
        }}
      />

      {/* Browser Autoplay Fallback Unlock Badge */}
      {audioBlocked && (
        <button
          type="button"
          className={styles.unmuteBadge}
          onClick={(e) => {
            e.stopPropagation();
            startVoice();
          }}
          aria-label="Click to enable cinematic welcome voice"
        >
          <span className={styles.unmuteIcon}>🔊</span>
          <span>CLICK ANYWHERE FOR SOUND</span>
        </button>
      )}

      {/* Volumetric Atmosphere & Studio Spotlights */}
      <div className={styles.atmosphere} />
      <div className={styles.spotlightBeam} />
      <div className={styles.lensStreak} />
      
      {/* Subtle Floating Ambient Motes / Dust Particles */}
      <div className={styles.dustParticles} aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className={styles.dustParticle}
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animationDelay: `${(i * 0.4).toFixed(1)}s`,
              animationDuration: `${3.5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* 3D Camera Rig & Perspective Arena */}
      <div className={styles.cameraContainer}>
        {/* Isometric 3D Board Presentation */}
        <div className={styles.isometricBoardWrap} aria-hidden="true">
          <div className={styles.boardGlowUnderlay} />
          
          <div className={styles.isometricBoard}>
            {/* 64 Squares Matrix */}
            <div className={styles.boardGrid}>
              {Array.from({ length: 64 }).map((_, idx) => {
                const r = Math.floor(idx / 8);
                const f = idx % 8;
                const isLight = (r + f) % 2 === 1;
                // Highlight critical opening squares (e4=36, e5=28, f3=45, c6=18, b5=25)
                const isE4 = idx === 36;
                const isE5 = idx === 28;
                const isF3 = idx === 45;
                const isC6 = idx === 18;
                const isB5 = idx === 25;
                const isTactical = isE4 || isE5 || isF3 || isC6 || isB5;

                return (
                  <div
                    key={idx}
                    className={`${styles.isoSquare} ${isLight ? styles.isoLight : styles.isoDark} ${
                      isTactical ? styles.isoTacticalSquare : ''
                    }`}
                  >
                    {isE4 && moveStep >= 1 && <span className={styles.pulseNode} />}
                    {isE5 && moveStep >= 2 && <span className={styles.pulseNode} />}
                    {isF3 && moveStep >= 3 && <span className={styles.pulseNode} />}
                    {isC6 && moveStep >= 4 && <span className={styles.pulseNode} />}
                    {isB5 && moveStep >= 5 && <span className={styles.pulseNodeGold} />}
                  </div>
                );
              })}
            </div>

            {/* Strategic Laser Attack Vectors (Visualizing Grandmaster Calculation) */}
            <svg className={styles.vectorRaysOverlay} viewBox="0 0 400 400">
              <defs>
                <linearGradient id="goldLaser" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="rgba(212, 175, 55, 0.1)" />
                  <stop offset="100%" stopColor="rgba(212, 175, 55, 0.9)" />
                </linearGradient>
                <linearGradient id="cyanLaser" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0.9)" />
                </linearGradient>
              </defs>

              {/* 1. e4 trajectory */}
              {moveStep >= 1 && (
                <line x1="225" y1="325" x2="225" y2="225" className={styles.laserLine} stroke="url(#goldLaser)" />
              )}
              {/* 1... e5 trajectory */}
              {moveStep >= 2 && (
                <line x1="225" y1="75" x2="225" y2="175" className={styles.laserLine} stroke="url(#cyanLaser)" />
              )}
              {/* 2. Nf3 knight arc */}
              {moveStep >= 3 && (
                <path d="M 325 375 Q 300 290 275 275" className={styles.laserCurve} stroke="url(#goldLaser)" fill="none" />
              )}
              {/* 3. Bb5 bishop slash targeting black knight */}
              {moveStep >= 5 && (
                <line x1="275" y1="375" x2="75" y2="175" className={styles.laserSlash} stroke="url(#goldLaser)" />
              )}
            </svg>

            {/* Physical Pieces In Motion */}
            <div className={styles.animatedPiecesLayer}>
              {/* White Pawn moving to e4 */}
              <div className={`${styles.pieceActor} ${styles.pawnE4} ${moveStep >= 1 ? styles.pawnE4Moved : ''}`}>
                <ChessPieceSvg type="pawn" color="white" />
              </div>

              {/* Black Pawn responding to e5 */}
              <div className={`${styles.pieceActor} ${styles.pawnE5} ${moveStep >= 2 ? styles.pawnE5Moved : ''}`}>
                <ChessPieceSvg type="pawn" color="black" />
              </div>

              {/* White Knight leaping to f3 */}
              <div className={`${styles.pieceActor} ${styles.knightF3} ${moveStep >= 3 ? styles.knightF3Moved : ''}`}>
                <ChessPieceSvg type="knight" color="white" />
              </div>

              {/* Black Knight defending at c6 */}
              <div className={`${styles.pieceActor} ${styles.knightC6} ${moveStep >= 4 ? styles.knightC6Moved : ''}`}>
                <ChessPieceSvg type="knight" color="black" />
              </div>

              {/* White Bishop attacking at b5 (Spanish) */}
              <div className={`${styles.pieceActor} ${styles.bishopB5} ${moveStep >= 5 ? styles.bishopB5Moved : ''}`}>
                <ChessPieceSvg type="bishop" color="white" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Notation HUD Tracker */}
        <div className={styles.notationHud}>
          <div className={styles.hudBadge}>
            <span className={styles.hudDot} />
            <span>RUY LOPEZ · SPANISH OPENING</span>
          </div>
          <div className={styles.hudMoves}>
            <span className={`${styles.hudMove} ${moveStep >= 1 ? styles.hudMoveActive : ''}`}>1. e4</span>
            <span className={`${styles.hudMove} ${moveStep >= 2 ? styles.hudMoveActive : ''}`}>e5</span>
            <span className={`${styles.hudMove} ${moveStep >= 3 ? styles.hudMoveActive : ''}`}>2. Nf3</span>
            <span className={`${styles.hudMove} ${moveStep >= 4 ? styles.hudMoveActive : ''}`}>Nc6</span>
            <span className={`${styles.hudMove} ${moveStep >= 5 ? styles.hudMoveActive : ''}`}>3. Bb5!</span>
          </div>
        </div>

        {/* Monolithic Grandmaster Hero King Silhouette */}
        <div className={`${styles.heroKing} ${moveStep >= 5 ? styles.heroKingVisible : ''}`} aria-hidden="true">
          <ChessPieceSvg type="king" color="white" />
        </div>

        {/* Center Axis Shockwave Pulse */}
        {moveStep >= 5 && (
          <div className={styles.shockwaveOrigin} aria-hidden="true">
            <div className={styles.shockwaveRing} />
          </div>
        )}

        {/* Monolithic Title Reveal (Act III) */}
        <div className={`${styles.titleCore} ${moveStep >= 6 ? styles.titleCoreVisible : ''}`}>
          <div className={styles.broadcastBadge}>
            <span className={styles.badgeGlowDot} />
            <span>CHAMPIONSHIP ARENA · GRANDMASTER SERIES</span>
          </div>

          <h1 className={styles.titleText}>
            RITESH{' '}
            <span className={styles.goldWord}>
              CHESS
              <span className={styles.specularSweep} aria-hidden="true">
                CHESS
              </span>
            </span>
          </h1>

          <div className={styles.tagline}>
            INTELLIGENCE &middot; STRATEGY &middot; PRECISION PLAY
          </div>

          <div className={styles.telemetrySpecs}>
            <span>FIDE STANDARD</span>
            <span className={styles.telemetryDivider}>•</span>
            <span>STOCKFISH 17 CORE</span>
            <span className={styles.telemetryDivider}>•</span>
            <span>REAL-TIME MULTIPLAYER</span>
          </div>
        </div>
      </div>

      {/* Intro Timeline Progress Bar & Skip Controls */}
      <div className={styles.bottomControls}>
        <div className={styles.progressBarWrap}>
          <div className={styles.progressBarFill} />
        </div>

        <button
          type="button"
          className={styles.skipButton}
          onClick={handleComplete}
          title="Skip intro animation"
        >
          <span>ENTER ARENA</span>
          <kbd className={styles.skipKbd}>ESC</kbd>
        </button>
      </div>
    </aside>
  );
}
