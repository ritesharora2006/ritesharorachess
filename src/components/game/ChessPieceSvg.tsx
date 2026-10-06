'use client';

import React from 'react';
import type { PieceColor, PieceType } from '@/lib/chess-types';

interface ChessPieceSvgProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export default function ChessPieceSvg({ type, color, className }: ChessPieceSvgProps) {
  const isWhite = color === 'white';
  const fill = isWhite ? '#FFFFFF' : '#1A1E24';
  const stroke = isWhite ? '#2A2E35' : '#0B0D10';
  const highlight = isWhite ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)';

  switch (type) {
    case 'pawn':
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {isWhite ? (
            <path
              d="M12 39.5c0-6 4-10 6.5-11M26.5 28.5c2.5 1 6.5 5 6.5 11"
              stroke={highlight}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M14 38c1.5-4.5 4.5-8 7-9M24 29c2.5 1 5.5 4.5 7 9"
              stroke={highlight}
              strokeWidth="1"
              strokeLinecap="round"
            />
          )}
        </svg>
      );

    case 'knight':
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.163-.987-.99-1.5-1.5-.769-.769-1.5-2.5-1.5-2.5 0-3.5 3-4.5 4-7 1.053-2.632-.5-5.5 2-8.5 2.5-3 5-3.5 8.5-3.5 3 0 5 1.5 6 3 1.5 2.5 2.5 5.5 1.5 7.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"
            fill={isWhite ? stroke : '#FFFFFF'}
            stroke={isWhite ? stroke : '#FFFFFF'}
            strokeWidth="1.5"
          />
          <path
            d="M15 15.5c.5.5 1.5.5 2 0M13.5 13c.5.5 1.5.5 2 0"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {isWhite && (
            <path
              d="M24.5 10.5c2 1 6.5 5.5 6 18"
              stroke={highlight}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      );

    case 'bishop':
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M17.5 26h10M22.5 21v10M19 16l7 7"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'rook':
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M34 14l-3 3H14l-3-3"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M31 17v12.5H14V17"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M31 29.5l1.5 2.5h-20l1.5-2.5"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {isWhite && (
            <path
              d="M15 18.5h15M15 28h15"
              stroke={highlight}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      );

    case 'queen':
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15L14 11v14l-7-11 2 12z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 38.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm7 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm6.5 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm6.5 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm7 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"
            fill={isWhite ? stroke : '#FFFFFF'}
            stroke={isWhite ? stroke : '#FFFFFF'}
            strokeWidth="1.2"
          />
          <circle cx="6" cy="12" r="1.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="14" cy="9" r="1.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="22.5" cy="7.5" r="1.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="31" cy="9" r="1.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="39" cy="12" r="1.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'king':
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.5 11.63V6M20 8h5"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 37c5.5 3.5 16.5 3.5 22 0l-.5-7.5s-4.5 2.5-10.5 2.5-10.5-2.5-10.5-2.5l-.5 7.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 30c-3.5-3.5-3.5-9.5 0-13 3-3 8-1 10.5 1 2.5-2 7.5-4 10.5-1 3.5 3.5 3.5 9.5 0 13-3 3-7 1.5-10.5 0-3.5 1.5-7.5 3-10.5 0z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {isWhite && (
            <path
              d="M19.5 18c1-1 2-1.5 3-1.5s2 .5 3 1.5M14 26c2 1 5 1.5 8.5 1.5s6.5-.5 8.5-1.5"
              stroke={highlight}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      );

    default:
      return null;
  }
}

