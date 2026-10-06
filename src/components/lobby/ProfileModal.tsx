'use client';

import React, { useState } from 'react';
import styles from './Modals.module.css';

interface ProfileModalProps {
  playerName: string;
  onClose: () => void;
}

export default function ProfileModal({ playerName, onClose }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'badges'>('overview');

  const matchHistory = [
    { id: '1', opponent: 'Stockfish 17 (Med)', result: 'win', ratingChange: '+15', time: '10 min ago', mode: 'Engine' },
    { id: '2', opponent: 'Aryan_K (1420)', result: 'win', ratingChange: '+12', time: '2 hours ago', mode: 'Rapid' },
    { id: '3', opponent: 'Grandmaster_Tal', result: 'loss', ratingChange: '-8', time: 'Yesterday', mode: 'Blitz' },
    { id: '4', opponent: 'Vikram_S (1485)', result: 'draw', ratingChange: '+1', time: '2 days ago', mode: 'Rapid' },
  ];

  const badges = [
    { icon: '⚔️', name: 'Tactical Striker', desc: 'Solved 25+ chess puzzles with >90% accuracy' },
    { icon: '⚡', name: 'Bullet Maestro', desc: 'Played 10 matches under 3-minute time control' },
    { icon: '🛡️', name: 'Endgame Virtuoso', desc: 'Successfully promoted in 5 consecutive endgames' },
    { icon: '👑', name: 'Grandmaster Challenger', desc: 'Challenged Stockfish Level 5 in Championship arena' },
  ];

  return (
    <div className="modalOverlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Grandmaster Profile">
      <div
        className={styles.content}
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Passport Banner */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 0.75rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #241e17 0%, #15110d 100%)',
              border: '2px solid rgba(212, 175, 55, 0.6)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.9rem',
              fontWeight: 900,
              color: '#f7f2ea',
            }}
          >
            {playerName.charAt(0).toUpperCase()}
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#d4af37',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              marginBottom: '0.4rem',
            }}
          >
            FIDE CANDIDATE · RITESH CHESS PRO
          </span>

          <h2 style={{ margin: '0.2rem 0', fontSize: '1.4rem', fontWeight: 900, color: '#f7f2ea' }}>
            {playerName}
          </h2>
          <span style={{ color: '#8b949e', fontSize: '0.82rem' }}>Member since 2026 • Official Standing #142</span>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '0.35rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
          }}
        >
          {(['overview', 'history', 'badges'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === tab ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                color: activeTab === tab ? '#d4af37' : '#8b949e',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'overview' ? '📊 Ratings' : tab === 'history' ? '⚔️ Matches' : '🎖️ Badges'}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Ratings */}
        {activeTab === 'overview' && (
          <div>
            {/* Grid of Ratings */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.65rem',
                marginBottom: '1.25rem',
              }}
            >
              {[
                { title: 'Rapid (10m)', elo: 1450, icon: '⏱' },
                { title: 'Blitz (3m)', elo: 1398, icon: '⚡' },
                { title: 'Bullet (1m)', elo: 1360, icon: '🚀' },
                { title: 'Puzzles', elo: 1620, icon: '🧩' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#8b949e', fontWeight: 600, display: 'block' }}>
                      {item.icon} {item.title}
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: '#f7f2ea', fontFamily: 'monospace' }}>
                      {item.elo}
                    </strong>
                  </div>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>▲ Peak</span>
                </div>
              ))}
            </div>

            {/* Performance Ratio Bar */}
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Won: 68% (12)</span>
                <span style={{ color: '#d4af37', fontWeight: 700 }}>Draw: 18% (3)</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>Loss: 14% (2)</span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '68%', background: '#10b981' }} />
                <div style={{ width: '18%', background: '#d4af37' }} />
                <div style={{ width: '14%', background: '#ef4444' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Match History */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', maxHeight: '240px', overflowY: 'auto' }}>
            {matchHistory.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem', color: '#f7f2ea' }}>{m.opponent}</strong>
                  <small style={{ color: '#8b949e', fontSize: '0.72rem' }}>{m.mode} • {m.time}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: m.result === 'win' ? '#10b981' : m.result === 'draw' ? '#d4af37' : '#ef4444',
                    }}
                  >
                    {m.result.toUpperCase()} ({m.ratingChange})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Badges */}
        {activeTab === 'badges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {badges.map((b, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{b.icon}</span>
                <div>
                  <strong style={{ color: '#f7f2ea', fontSize: '0.85rem', display: 'block' }}>{b.name}</strong>
                  <small style={{ color: '#8b949e', fontSize: '0.74rem' }}>{b.desc}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn" style={{ width: '100%' }} onClick={onClose}>
          Return to Arena
        </button>
      </div>
    </div>
  );
}
