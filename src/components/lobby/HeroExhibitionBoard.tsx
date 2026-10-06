'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './HeroExhibitionBoard.module.css';
import ChessPieceSvg from '@/components/game/ChessPieceSvg';
import { EXHIBITION_GAMES, precomputeGameStates } from '@/lib/exhibition-games';
import { algebraicToSquare } from '@/lib/chess-types';
import { isKingInCheck } from '@/lib/moves';
import { findKing } from '@/lib/board-state';

export default function HeroExhibitionBoard() {
  const [selectedGameId, setSelectedGameId] = useState<string>(EXHIBITION_GAMES[0].id);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const activeGame = useMemo(() => {
    return EXHIBITION_GAMES.find((g) => g.id === selectedGameId) || EXHIBITION_GAMES[0];
  }, [selectedGameId]);

  const gameStates = useMemo(() => {
    return precomputeGameStates(activeGame);
  }, [activeGame]);

  const totalPlies = activeGame.moves.length;

  // Handle Game Selection Switch
  const handleSelectGame = (id: string) => {
    setSelectedGameId(id);
    setCurrentPly(0);
    setIsPlaying(true);
  };

  // Autoplay Controller Loop
  useEffect(() => {
    if (!isPlaying) return;

    // Slower pause at the end of the game before auto-restarting
    const delay = currentPly >= totalPlies ? 3600 : 1750;

    const timer = setTimeout(() => {
      setCurrentPly((prev) => {
        if (prev >= totalPlies) {
          return 0; // Seamless loop back to starting position
        }
        return prev + 1;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentPly, totalPlies]);

  // Subtle, controlled 3D tilt tracking cursor
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const rect = wrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    rafRef.current = requestAnimationFrame(() => {
      if (!wrapperRef.current) return;
      const tiltX = -percentY * 4.5;
      const tiltY = percentX * 4.5;
      wrapperRef.current.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      wrapperRef.current.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
      wrapperRef.current.style.setProperty('--glare-x', `${((x / rect.width) * 100).toFixed(1)}%`);
      wrapperRef.current.style.setProperty('--glare-y', `${((y / rect.height) * 100).toFixed(1)}%`);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!wrapperRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      if (!wrapperRef.current) return;
      wrapperRef.current.style.setProperty('--tilt-x', '0deg');
      wrapperRef.current.style.setProperty('--tilt-y', '0deg');
    });
  }, []);

  // Scrubbing on the progress bar track
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetPly = Math.round(pct * totalPlies);
    setCurrentPly(targetPly);
  };

  // Compute Active Move & Highlighted Squares
  const currentMove = currentPly > 0 ? activeGame.moves[currentPly - 1] : null;
  const originSq = currentMove ? algebraicToSquare(currentMove.from) : null;
  const destSq = currentMove ? algebraicToSquare(currentMove.to) : null;

  const currentState = gameStates[currentPly] || gameStates[0];
  const board = currentState.board;

  // King check beacon calculation
  const isCheck = isKingInCheck(currentState.board, currentState.turn);
  const kingSq = isCheck ? findKing(currentState.board, currentState.turn) : -1;

  // Exact coordinates for dynamic tracer SVG
  const tracerCoords = useMemo(() => {
    if (originSq === null || destSq === null) return null;
    return {
      x1: (originSq % 8) * 100 + 50,
      y1: Math.floor(originSq / 8) * 100 + 50,
      x2: (destSq % 8) * 100 + 50,
      y2: Math.floor(destSq / 8) * 100 + 50,
    };
  }, [originSq, destSq]);

  return (
    <div className={styles.exhibitionWrap}>
      {/* Masterpiece Game Switcher Tabs */}
      <div className={styles.tabsHeader} role="tablist" aria-label="Exhibition Masterpieces">
        {EXHIBITION_GAMES.map((game) => {
          const isActive = game.id === activeGame.id;
          return (
            <button
              key={game.id}
              role="tab"
              aria-selected={isActive}
              className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              onClick={() => handleSelectGame(game.id)}
            >
              {game.shortName}
            </button>
          );
        })}
      </div>

      {/* 3D Tilting Chessboard */}
      <div
        ref={wrapperRef}
        className={styles.boardTiltWrapper}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={styles.boardFrame}
          role="region"
          aria-label={`${activeGame.name} Exhibition Board`}
        >
          {/* Subtle Brass Inlaid Corner Brackets */}
          <span className={`${styles.cornerBracket} ${styles.cornerTL}`} aria-hidden="true" />
          <span className={`${styles.cornerBracket} ${styles.cornerTR}`} aria-hidden="true" />
          <span className={`${styles.cornerBracket} ${styles.cornerBL}`} aria-hidden="true" />
          <span className={`${styles.cornerBracket} ${styles.cornerBR}`} aria-hidden="true" />

          {/* Glare Sheen Overlay */}
          <div className={styles.boardGlare} aria-hidden="true" />

          <div className={styles.boardInner}>
            {/* Rank Coordinates 8 down to 1 */}
            <div className={styles.rankCoords} aria-hidden="true">
              {['8', '7', '6', '5', '4', '3', '2', '1'].map((r) => (
                <span key={r}>{r}</span>
              ))}
            </div>

            {/* 8x8 Chessboard Grid */}
            <div className={styles.boardGrid}>
              {board.map((piece, index) => {
                const rank = Math.floor(index / 8);
                const file = index % 8;
                const isLight = (rank + file) % 2 === 0;

                const isOrigin = originSq === index;
                const isDest = destSq === index;
                const isThreatenedKing = kingSq === index;

                return (
                  <div
                    key={index}
                    className={`
                      ${styles.square}
                      ${isLight ? styles.squareLight : styles.squareDark}
                      ${isOrigin ? styles.squareHighlightOrigin : ''}
                      ${isDest ? styles.squareHighlightDest : ''}
                      ${isThreatenedKing ? styles.squareKingCheck : ''}
                    `}
                  >
                    {/* Destination Square Wavefront Glow */}
                    {isDest && (
                      <span
                        key={`wave-${currentPly}`}
                        className={styles.wavefrontPulse}
                        aria-hidden="true"
                      />
                    )}

                    {/* Pieces */}
                    {piece && (
                      <div
                        className={`${styles.pieceContainer} ${isDest ? styles.pieceSettle : ''}`}
                      >
                        <ChessPieceSvg
                          type={piece.type}
                          color={piece.color}
                          className={styles.pieceSvg}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dynamic Golden Hairline Tracer Vector */}
              {tracerCoords && (
                <svg
                  key={`tracer-${currentPly}`}
                  className={styles.tracerSvg}
                  viewBox="0 0 800 800"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="exhibitionTracerGold" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#7A602B" stopOpacity="0.3" />
                      <stop offset="70%" stopColor="#C29B48" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#EDE4D3" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>
                  <line
                    x1={tracerCoords.x1}
                    y1={tracerCoords.y1}
                    x2={tracerCoords.x2}
                    y2={tracerCoords.y2}
                    className={styles.tracerPath}
                    stroke="url(#exhibitionTracerGold)"
                  />
                </svg>
              )}
            </div>

            {/* File Coordinates a to h */}
            <div className={styles.fileCoords} aria-hidden="true">
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Playback Toolbar Controls */}
      <div className={styles.playbackToolbar} aria-label="Exhibition Playback Controls">
        <div className={styles.transportControls}>
          <button
            type="button"
            className={styles.transportBtn}
            onClick={() => setCurrentPly(0)}
            disabled={currentPly === 0}
            title="Beginning"
            aria-label="Jump to beginning"
          >
            |◀
          </button>
          <button
            type="button"
            className={styles.transportBtn}
            onClick={() => setCurrentPly((p) => Math.max(0, p - 1))}
            disabled={currentPly === 0}
            title="Previous Move"
            aria-label="Previous Move"
          >
            ◀
          </button>
          <button
            type="button"
            className={`${styles.playPauseBtn} ${isPlaying ? styles.playPauseActive : ''}`}
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pause Exhibition' : 'Play Exhibition'}
            aria-label={isPlaying ? 'Pause Exhibition' : 'Play Exhibition'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            className={styles.transportBtn}
            onClick={() => setCurrentPly((p) => Math.min(totalPlies, p + 1))}
            disabled={currentPly >= totalPlies}
            title="Next Move"
            aria-label="Next Move"
          >
            ▶
          </button>
          <button
            type="button"
            className={styles.transportBtn}
            onClick={() => setCurrentPly(totalPlies)}
            disabled={currentPly >= totalPlies}
            title="Final Move"
            aria-label="Jump to final move"
          >
            ▶|
          </button>
        </div>

        {/* Progress Track */}
        <div className={styles.progressWrap}>
          <div
            className={styles.progressBar}
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={currentPly}
            aria-valuemin={0}
            aria-valuemax={totalPlies}
            title={`Move ${currentPly} of ${totalPlies}`}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${(currentPly / (totalPlies || 1)) * 100}%` }}
            />
          </div>
          <span className={styles.plyCounter}>
            {currentPly}/{totalPlies}
          </span>
        </div>
      </div>

      {/* Production Tournament Match Plaque & Commentary */}
      <div className={styles.plaqueContainer}>
        <div className={styles.plaqueTopRow}>
          <div className={styles.gameMeta}>
            <span className={styles.gameMetaIcon} aria-hidden="true">♛</span>
            <span className={styles.gameMetaTitle}>{activeGame.white} vs {activeGame.black}</span>
            <span className={styles.gameMetaYear}>({activeGame.year})</span>
          </div>
        </div>

        <div className={styles.moveRow}>
          <div className={styles.notationBadge}>
            <span>{currentMove ? currentMove.san : 'Start'}</span>
            {currentMove?.badge && (
              <span
                className={`
                  ${styles.badgeTag}
                  ${currentMove.badge === 'Brilliant' ? styles.badgeBrilliant : ''}
                  ${currentMove.badge === 'Sacrifice' ? styles.badgeSacrifice : ''}
                  ${currentMove.badge === 'Checkmate' ? styles.badgeCheckmate : ''}
                  ${currentMove.badge === 'Great Move' ? styles.badgeGreatMove : ''}
                  ${currentMove.badge === 'Book' ? styles.badgeBook : ''}
                `}
              >
                {currentMove.badge}
              </span>
            )}
          </div>
          <span className={styles.evalTag}>{currentMove ? currentMove.eval : '0.00'}</span>
        </div>

        <p className={styles.commentaryText}>
          {currentMove
            ? currentMove.comment
            : `${activeGame.opening} • Select a game above or press Play to study this immortal masterpiece.`}
        </p>
      </div>
    </div>
  );
}
