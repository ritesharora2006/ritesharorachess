'use client';

import React, { useState } from 'react';
import styles from './GameReviewModal.module.css';
import type { GameReviewReport, MoveClassification } from '@/lib/game-analysis';

interface GameReviewModalProps {
  report: GameReviewReport | null;
  isAnalyzing: boolean;
  progress: { current: number; total: number };
  onClose: () => void;
  whitePlayerName: string;
  blackPlayerName: string;
  gameResult: string;
  onSelectMove?: (moveIndex: number) => void;
}

const CLASSIFICATION_CONFIG: Record<
  MoveClassification,
  { label: string; symbol: string; iconClass: string }
> = {
  brilliant: { label: 'Brilliant', symbol: '!!', iconClass: styles.iconBrilliant },
  great: { label: 'Great', symbol: '!', iconClass: styles.iconBest },
  best: { label: 'Best', symbol: '★', iconClass: styles.iconBest },
  excellent: { label: 'Excellent', symbol: '✓', iconClass: styles.iconExcellent },
  good: { label: 'Good', symbol: '•', iconClass: styles.iconGood },
  inaccuracy: { label: 'Inaccuracy', symbol: '?!', iconClass: styles.iconInaccuracy },
  mistake: { label: 'Mistake', symbol: '?', iconClass: styles.iconMistake },
  blunder: { label: 'Blunder', symbol: '??', iconClass: styles.iconBlunder },
  missed_win: { label: 'Missed Win', symbol: '✕', iconClass: styles.iconMissedWin },
  book: { label: 'Book Move', symbol: '📖', iconClass: styles.iconGood },
};

export default function GameReviewModal({
  report,
  isAnalyzing,
  progress,
  onClose,
  whitePlayerName,
  blackPlayerName,
  gameResult,
  onSelectMove,
}: GameReviewModalProps) {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [copiedPgn, setCopiedPgn] = useState(false);

  if (isAnalyzing) {
    const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.badge}>STOCKFISH 16 • ARCHIVAL ENGINE</span>
              <h2 className={styles.title}>Analyzing Match Telemetry...</h2>
            </div>
          </div>
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '1.25rem', color: 'var(--boxwood-subtle, #9e978a)' }}>
              Evaluating move {progress.current} of {progress.total} positions ({percent}%)
            </p>
            <div className={styles.accuracyBarWrap} style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div className={`${styles.accuracyBarFill} ${styles.whiteFill}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const handleCopyPgn = async () => {
    try {
      await navigator.clipboard.writeText(report.pgn);
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPgn = () => {
    const blob = new Blob([report.pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ritesh-chess-${Date.now()}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedMove =
    selectedMoveIndex !== null && report.moves[selectedMoveIndex]
      ? report.moves[selectedMoveIndex]
      : null;

  // Build SVG Points for Centipawn Evaluation Graph
  // Graph height is 140px, Y=70 is equal (0 cp).
  // +600 cp maps to Y=10, -600 cp maps to Y=130.
  const graphWidth = 720;
  const graphHeight = 140;
  const midY = graphHeight / 2;
  const totalPoints = report.evalGraph.length;

  const pointsString = report.evalGraph
    .map((pt, idx) => {
      const x = totalPoints > 1 ? (idx / (totalPoints - 1)) * graphWidth : graphWidth / 2;
      // Clamped between -800 and +800 cp
      const clampedCp = Math.max(-800, Math.min(800, pt.scoreCp));
      const y = midY - (clampedCp / 800) * (midY - 12);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brass-burnished, #c29b48)' }} />
              CHAMPIONSHIP REVIEW • ACCURACY REPORT
            </span>
            <h2 className={styles.title}>Game Review & Telemetry</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close review">
            ✕
          </button>
        </div>

        {/* Accuracy Comparison */}
        <div className={styles.accuracySection}>
          <div className={styles.playerAccuracyCard}>
            <div className={styles.playerHeader}>
              <span className={styles.playerName}>⚪ {whitePlayerName}</span>
              <span className={styles.accuracyLabel}>CAPS Precision</span>
            </div>
            <span className={styles.accuracyNumber}>{report.whiteAccuracy}%</span>
            <div className={styles.accuracyBarWrap}>
              <div
                className={`${styles.accuracyBarFill} ${styles.whiteFill}`}
                style={{ width: `${report.whiteAccuracy}%` }}
              />
            </div>
          </div>

          <div className={styles.vsDivider}>
            <span className={styles.vsText}>VS</span>
            <span className={styles.resultTag}>{gameResult}</span>
          </div>

          <div className={styles.playerAccuracyCard}>
            <div className={styles.playerHeader}>
              <span className={styles.playerName}>⚫ {blackPlayerName}</span>
              <span className={styles.accuracyLabel}>CAPS Precision</span>
            </div>
            <span className={styles.accuracyNumber}>{report.blackAccuracy}%</span>
            <div className={styles.accuracyBarWrap}>
              <div
                className={`${styles.accuracyBarFill} ${styles.blackFill}`}
                style={{ width: `${report.blackAccuracy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Summary Banner */}
        <div style={{ padding: '0.85rem 1.75rem', background: 'rgba(194, 155, 72, 0.08)', borderBottom: '1px solid var(--border, #2a3242)' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--boxwood-pure, #ede4d3)', fontStyle: 'italic' }}>
            &ldquo;{report.summaryText}&rdquo;
          </p>
        </div>

        {/* Centipawn Evaluation Timeline */}
        <div className={styles.graphSection}>
          <div className={styles.sectionTitle}>
            <span>Evaluation Curve</span>
            <small style={{ color: 'var(--boxwood-subtle, #9e978a)', fontWeight: 400 }}>
              Above line: White advantage | Below line: Black advantage
            </small>
          </div>
          <div className={styles.svgWrap}>
            <svg
              className={styles.evalSvg}
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              preserveAspectRatio="none"
            >
              {/* Center baseline */}
              <line
                x1="0"
                y1={midY}
                x2={graphWidth}
                y2={midY}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              {/* Curve fill for White */}
              <polygon
                points={`0,${midY} ${pointsString} ${graphWidth},${midY}`}
                fill="rgba(194, 155, 72, 0.12)"
              />
              {/* Evaluated polyline */}
              <polyline
                points={pointsString}
                fill="none"
                stroke="var(--brass-burnished, #c29b48)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Move Classification Grid */}
        <div className={styles.statsSection}>
          <div className={styles.sectionTitle}>
            <span>Move Classifications</span>
            <small style={{ color: 'var(--boxwood-subtle, #9e978a)', fontWeight: 400 }}>
              White vs Black counts
            </small>
          </div>
          <div className={styles.statsGrid}>
            {(
              [
                'brilliant',
                'best',
                'excellent',
                'good',
                'inaccuracy',
                'mistake',
                'blunder',
                'missed_win',
              ] as MoveClassification[]
            ).map((cls) => {
              const cfg = CLASSIFICATION_CONFIG[cls];
              const whiteCount = report.whiteStats[cls] || 0;
              const blackCount = report.blackStats[cls] || 0;
              return (
                <div key={cls} className={styles.statCard}>
                  <div className={styles.statBadge}>
                    <span className={`${styles.statIcon} ${cfg.iconClass}`}>{cfg.symbol}</span>
                    <span>{cfg.label}</span>
                  </div>
                  <div className={styles.statCounts}>
                    <span className={styles.statWhiteCount}>⚪ {whiteCount}</span>
                    <span className={styles.statBlackCount}>⚫ {blackCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Move Scrubber & Blunder inspection */}
        <div className={styles.moveScrubberSection}>
          <div className={styles.sectionTitle}>
            <span>Moves Breakdown</span>
            <small style={{ color: 'var(--boxwood-subtle, #9e978a)', fontWeight: 400 }}>
              Click any move to review position
            </small>
          </div>
          <div className={styles.moveList}>
            {report.moves.map((m, idx) => {
              const cfg = CLASSIFICATION_CONFIG[m.classification];
              const isActive = selectedMoveIndex === idx;
              let chipClass = '';
              if (m.classification === 'blunder') chipClass = styles.chipBlunder;
              else if (m.classification === 'mistake') chipClass = styles.chipMistake;
              else if (m.classification === 'inaccuracy') chipClass = styles.chipInaccuracy;
              else if (m.classification === 'best') chipClass = styles.chipBest;
              else if (m.classification === 'brilliant') chipClass = styles.chipBrilliant;

              return (
                <button
                  key={idx}
                  className={`${styles.moveChip} ${chipClass} ${isActive ? styles.moveChipActive : ''}`}
                  onClick={() => {
                    setSelectedMoveIndex(idx);
                    onSelectMove?.(idx);
                  }}
                >
                  <span>
                    {m.color === 'white' ? `${m.moveNumber}.` : '..'} {m.san}
                  </span>
                  <span className={`${styles.statIcon} ${cfg.iconClass}`}>{cfg.symbol}</span>
                </button>
              );
            })}
          </div>

          {selectedMove && (
            <div className={styles.selectedMoveDetail}>
              <div className={styles.selectedMoveText}>
                <strong>
                  {selectedMove.color === 'white' ? 'White' : 'Black'} played {selectedMove.san}:
                </strong>{' '}
                <span style={{ textTransform: 'capitalize' }}>
                  {CLASSIFICATION_CONFIG[selectedMove.classification].label} (
                  {selectedMove.winRateDelta > 0 ? `-${selectedMove.winRateDelta}% win chance` : 'Best play'}
                  )
                </span>
                {selectedMove.bestMoveUci && (
                  <div style={{ marginTop: '0.25rem', color: 'var(--boxwood-subtle, #9e978a)' }}>
                    Engine suggested: <code style={{ color: 'var(--brass-burnished, #c29b48)' }}>{selectedMove.bestMoveUci}</code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={handleCopyPgn}>
              {copiedPgn ? '✓ PGN Copied!' : '📋 Copy PGN'}
            </button>
            <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={handleDownloadPgn}>
              ⬇ Download PGN
            </button>
          </div>
          <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={onClose}>
            Back to Match
          </button>
        </div>
      </div>
    </div>
  );
}

