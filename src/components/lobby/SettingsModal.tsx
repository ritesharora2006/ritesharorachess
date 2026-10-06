'use client';

import React, { useState } from 'react';
import styles from './Modals.module.css';
import { BOARD_THEMES, type BoardThemeId } from '@/lib/boardThemes';
import { ATMOSPHERE_THEMES, type AtmosphereThemeId } from '@/lib/atmosphere-themes';

interface SettingsModalProps {
  tempName: string;
  onTempName: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  boardTheme: BoardThemeId;
  onBoardTheme: (theme: BoardThemeId) => void;
  atmosphereTheme?: AtmosphereThemeId;
  onAtmosphereTheme?: (theme: AtmosphereThemeId) => void;
  onReplayIntro?: () => void;
}

export default function SettingsModal({
  tempName,
  onTempName,
  onSave,
  onClose,
  soundEnabled = true,
  onToggleSound,
  boardTheme,
  onBoardTheme,
  atmosphereTheme = 'grandmaster-hall',
  onAtmosphereTheme,
  onReplayIntro,
}: SettingsModalProps) {
  const [appearanceTab, setAppearanceTab] = useState<'atmosphere' | 'board'>('atmosphere');

  return (
    <div className="modalOverlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Settings">
      <div className={`${styles.content} ${styles.settingsContent}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Arena Settings</h3>
        <p className={styles.sub}>Customize your personal championship atmosphere and preferences</p>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="settings-name">
            Player Name
          </label>
          <input
            id="settings-name"
            className={styles.input}
            type="text"
            value={tempName}
            onChange={(e) => onTempName(e.target.value)}
          />
        </div>

        <div className={styles.rowGroup}>
          <span className={styles.labelInline}>Sound & Voice Audio</span>
          <button type="button" className={styles.secondaryBtn} onClick={onToggleSound}>
            {soundEnabled ? '🔊 Enabled' : '🔇 Muted'}
          </button>
        </div>

        {onReplayIntro && (
          <div className={styles.rowGroup}>
            <span className={styles.labelInline}>Opening Sequence</span>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                onClose();
                onReplayIntro();
              }}
            >
              🎬 Replay Cinematic Intro
            </button>
          </div>
        )}

        {/* Appearance & Theming Section */}
        <div className={styles.themeSection}>
          <span className={styles.label}>Visual Appearance</span>

          {/* Sub-tabs: Atmosphere vs Board */}
          <div className={styles.appearanceTabs} role="tablist" aria-label="Appearance Options">
            <button
              type="button"
              role="tab"
              aria-selected={appearanceTab === 'atmosphere'}
              className={`${styles.appearanceTab} ${appearanceTab === 'atmosphere' ? styles.appearanceTabActive : ''}`}
              onClick={() => setAppearanceTab('atmosphere')}
            >
              🌌 Atmosphere Environment ({ATMOSPHERE_THEMES.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={appearanceTab === 'board'}
              className={`${styles.appearanceTab} ${appearanceTab === 'board' ? styles.appearanceTabActive : ''}`}
              onClick={() => setAppearanceTab('board')}
            >
              ♟️ Chessboard Squares ({BOARD_THEMES.length})
            </button>
          </div>

          {/* Atmosphere Theme Grid */}
          {appearanceTab === 'atmosphere' && onAtmosphereTheme && (
            <div className={styles.atmosphereGrid}>
              {ATMOSPHERE_THEMES.map((theme) => {
                const isActive = atmosphereTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`${styles.atmosphereCard} ${isActive ? styles.atmosphereCardActive : ''}`}
                    onClick={() => onAtmosphereTheme(theme.id)}
                    aria-pressed={isActive}
                    aria-label={`Select ${theme.name} atmosphere`}
                  >
                    <div className={styles.atmosphereHeader}>
                      <div className={styles.atmosphereTitleGroup}>
                        <span className={styles.atmosphereIcon} aria-hidden="true">{theme.icon}</span>
                        <span className={styles.atmosphereName}>{theme.name}</span>
                      </div>
                      {isActive && <span className={styles.themeCheck} aria-hidden="true">✓</span>}
                    </div>

                    <div
                      className={styles.atmospherePreview}
                      style={{ background: theme.previewGradient }}
                      aria-hidden="true"
                    />

                    <p className={styles.atmosphereDesc}>{theme.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Board Squares Theme Grid */}
          {appearanceTab === 'board' && (
            <div className={styles.themeGrid}>
              {BOARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`${styles.themeOption} ${boardTheme === theme.id ? styles.themeOptionActive : ''}`}
                  onClick={() => onBoardTheme(theme.id)}
                  aria-pressed={boardTheme === theme.id}
                  aria-label={`Use ${theme.label} board theme`}
                >
                  <span
                    className={styles.themePreview}
                    style={{ '--theme-light': theme.light, '--theme-dark': theme.dark } as React.CSSProperties}
                  >
                    {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
                  </span>
                  <span className={styles.themeOptionName}>{theme.icon} {theme.label}</span>
                  {boardTheme === theme.id && <span className={styles.themeCheck} aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.buttons}>
          <button type="button" className={styles.primaryBtn} onClick={onSave}>
            Save & Apply
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
