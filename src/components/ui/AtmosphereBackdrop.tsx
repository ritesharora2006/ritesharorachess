'use client';

import React, { useMemo } from 'react';
import styles from './AtmosphereBackdrop.module.css';
import { type AtmosphereThemeId, getAtmosphereTheme } from '@/lib/atmosphere-themes';

interface AtmosphereBackdropProps {
  theme?: AtmosphereThemeId;
}

const THEME_CLASS_MAP: Record<AtmosphereThemeId, string> = {
  'grandmaster-hall': styles.themeGrandmasterHall,
  'royal-midnight': styles.themeRoyalMidnight,
  'golden-chess': styles.themeGoldenChess,
  'emerald-strategy': styles.themeEmeraldStrategy,
  'obsidian': styles.themeObsidian,
  'cosmic-chess': styles.themeCosmicChess,
  'classic-tournament': styles.themeClassicTournament,
};

export default function AtmosphereBackdrop({ theme = 'grandmaster-hall' }: AtmosphereBackdropProps) {
  const currentTheme = useMemo(() => getAtmosphereTheme(theme), [theme]);
  const themeClass = THEME_CLASS_MAP[theme] || styles.themeGrandmasterHall;

  // Statically determinable positions for lightweight floating motes
  const motes = useMemo(() => {
    if (currentTheme.moteType === 'none') return [];
    const count = currentTheme.moteType === 'stars' ? 24 : 14;
    return Array.from({ length: count }, (_, i) => {
      const left = `${(i * 19.3 + 7) % 94}%`;
      const top = `${(i * 23.7 + 11) % 88}%`;
      const size = `${(i % 3) * 1.5 + 2}px`;
      const delay = `${(i * 0.45).toFixed(2)}s`;
      const duration = `${5.5 + (i % 4)}s`;
      return { id: i, left, top, size, delay, duration };
    });
  }, [currentTheme.moteType]);

  return (
    <div
      className={`${styles.atmosphereContainer} ${themeClass}`}
      aria-hidden="true"
      data-testid="atmosphere-backdrop"
      suppressHydrationWarning
    >
      {/* Layer 1: Ambient Base Gradient */}
      <div className={styles.baseGradient} />

      {/* Layer 2: Overhead Spotlight */}
      <div className={styles.spotlightBeam} />

      {/* Layer 3: Strategic Geometric Coordinate Rays */}
      <svg className={styles.tacticalRays} viewBox="0 0 1200 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Subtle diagonal calculation paths */}
        <line x1="0" y1="0" x2="1200" y2="800" stroke="url(#rayGrad)" strokeWidth="0.8" strokeDasharray="6 12" />
        <line x1="1200" y1="0" x2="0" y2="800" stroke="url(#rayGrad)" strokeWidth="0.8" strokeDasharray="6 12" />
        <circle cx="600" cy="400" r="280" stroke="url(#rayGrad)" strokeWidth="0.6" fill="none" strokeDasharray="4 8" />
      </svg>

      {/* Layer 4: Thematic Floating Atmospheric Motes */}
      {motes.length > 0 && (
        <div className={styles.motesWrap}>
          {motes.map((m) => (
            <span
              key={m.id}
              className={styles.mote}
              style={{
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                animationDelay: m.delay,
                animationDuration: m.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 5: Film Vignette */}
      <div className={styles.vignette} />
    </div>
  );
}

