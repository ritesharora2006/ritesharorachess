'use client';

import React from 'react';
import styles from './DesktopGate.module.css';

interface DesktopGateProps {
  children: React.ReactNode;
}

export default function DesktopGate({ children }: DesktopGateProps) {
  return (
    <>
      {/* Desktop View: Unaltered, 100% full experience */}
      <div className={styles.appContainer}>
        {children}
      </div>

      {/* Mobile / Small Screen Gatekeeper */}
      <aside
        className={styles.mobileGateOverlay}
        role="dialog"
        aria-modal="true"
        aria-label="Desktop screen required"
      >
        <div className={styles.gateBackdrop} aria-hidden="true" />
        <div className={styles.gateRays} aria-hidden="true" />
        <div className={styles.gateVignette} aria-hidden="true" />

        <div className={styles.gateCard}>
          {/* Badge */}
          <div className={styles.gateBadge}>
            <span className={styles.beaconDot} aria-hidden="true" />
            <span>Desktop Arena Required</span>
          </div>

          {/* Desktop Visual Illustration */}
          <div className={styles.visualWrapper} aria-hidden="true">
            <div className={styles.visualGlow} />
            <svg
              className={styles.monitorSvg}
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Monitor Bezel */}
              <rect
                x="8"
                y="10"
                width="64"
                height="44"
                rx="5"
                fill="#161b22"
                stroke="#c29b48"
                strokeWidth="2"
              />
              {/* Screen Inner */}
              <rect
                x="12"
                y="14"
                width="56"
                height="36"
                rx="3"
                fill="#0d1117"
              />
              {/* Mini Chessboard Grid on Screen */}
              <g opacity="0.85">
                <rect x="22" y="18" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="29" y="18" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="36" y="18" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="43" y="18" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="50" y="18" width="7" height="7" fill="#d6b25e" rx="1" />

                <rect x="22" y="25" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="29" y="25" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="36" y="25" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="43" y="25" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="50" y="25" width="7" height="7" fill="#2d3748" rx="1" />

                <rect x="22" y="32" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="29" y="32" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="36" y="32" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="43" y="32" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="50" y="32" width="7" height="7" fill="#d6b25e" rx="1" />

                <rect x="22" y="39" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="29" y="39" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="36" y="39" width="7" height="7" fill="#d6b25e" rx="1" />
                <rect x="43" y="39" width="7" height="7" fill="#2d3748" rx="1" />
                <rect x="50" y="39" width="7" height="7" fill="#d6b25e" rx="1" />
              </g>

              {/* Stand Stem */}
              <path
                d="M37 55L35 64H45L43 55H37Z"
                fill="#242c38"
                stroke="#7a602b"
                strokeWidth="1.5"
              />
              {/* Stand Base */}
              <rect
                x="26"
                y="63"
                width="28"
                height="4"
                rx="2"
                fill="#161b22"
                stroke="#c29b48"
                strokeWidth="1.5"
              />
              {/* Power LED Indicator */}
              <circle cx="40" cy="51" r="1" fill="#10b981" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className={styles.gateTitle}>Future Chess is designed for PC</h1>

          {/* Message */}
          <p className={styles.gateMessage}>
            Please open Future Chess on a desktop or laptop for the complete experience.
          </p>

          {/* Feature Badges */}
          <div className={styles.featuresRow}>
            <span className={styles.featurePill}>♟️ 8×8 Championship Arena</span>
            <span className={styles.featurePill}>⚡ Deep Engine Analysis</span>
            <span className={styles.featurePill}>🎙️ Grandmaster Experience</span>
          </div>

          {/* Recommended Screen Notice */}
          <div className={styles.gateNotice}>
            <span>✨</span>
            <span>Best experienced on a larger screen.</span>
          </div>

          {/* Resolution requirement footnote */}
          <span className={styles.gateFooter}>
            Optimized for PC & Laptop Screens (1024px+)
          </span>
        </div>
      </aside>
    </>
  );
}

