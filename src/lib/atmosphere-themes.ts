/**
 * RITESH CHESS — Background Atmosphere Theme Architecture
 * Art-directed visual environments inspired by world-class chess halls,
 * luxury clubs, and AAA gaming aesthetics.
 */

export type AtmosphereThemeId =
  | 'royal-midnight'
  | 'grandmaster-hall'
  | 'golden-chess'
  | 'emerald-strategy'
  | 'obsidian'
  | 'cosmic-chess'
  | 'classic-tournament';

export interface AtmosphereTheme {
  id: AtmosphereThemeId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  colors: {
    base: string;
    surface: string;
    accent: string;
    glow: string;
    border: string;
  };
  previewGradient: string;
  moteType: 'dust' | 'stars' | 'gold' | 'none';
}

export const ATMOSPHERE_THEMES: AtmosphereTheme[] = [
  {
    id: 'grandmaster-hall',
    name: 'Grandmaster Hall',
    icon: '🏛️',
    tagline: 'Traditional Championship Auditorium',
    description: 'Dark tournament hall with dramatic overhead grazing spotlights and rich walnut depth.',
    colors: {
      base: '#0d0c0a',
      surface: '#161411',
      accent: '#c29b48',
      glow: 'rgba(194, 155, 72, 0.12)',
      border: 'rgba(237, 228, 211, 0.12)',
    },
    previewGradient: 'linear-gradient(135deg, #1d1914 0%, #0d0c0a 60%, #292119 100%)',
    moteType: 'dust',
  },
  {
    id: 'royal-midnight',
    name: 'Royal Midnight',
    icon: '♟️',
    tagline: 'Sapphire Championship Void',
    description: 'Deep sophisticated navy & royal obsidian with faint geometric calculation vectors.',
    colors: {
      base: '#070a12',
      surface: '#0e1424',
      accent: '#4f8bf9',
      glow: 'rgba(79, 139, 249, 0.14)',
      border: 'rgba(147, 197, 253, 0.14)',
    },
    previewGradient: 'linear-gradient(135deg, #101a33 0%, #070a12 60%, #1e2c4f 100%)',
    moteType: 'dust',
  },
  {
    id: 'golden-chess',
    name: 'Golden Chess',
    icon: '✨',
    tagline: 'Prestige Brass & Liquid Gold',
    description: 'Ultra-luxurious dark environment illuminated by warm burnished gold and specular highlights.',
    colors: {
      base: '#0e0c08',
      surface: '#1a160d',
      accent: '#d4af37',
      glow: 'rgba(212, 175, 55, 0.22)',
      border: 'rgba(212, 175, 55, 0.25)',
    },
    previewGradient: 'linear-gradient(135deg, #2b2210 0%, #0e0c08 55%, #3d2f14 100%)',
    moteType: 'gold',
  },
  {
    id: 'emerald-strategy',
    name: 'Emerald Strategy',
    icon: '🌲',
    tagline: 'Classical Baize Felt Club',
    description: 'Deep forest and tournament baize green inspired by the most historic chess clubs in Europe.',
    colors: {
      base: '#060e0a',
      surface: '#0d1c14',
      accent: '#2ebd7e',
      glow: 'rgba(46, 189, 126, 0.14)',
      border: 'rgba(46, 189, 126, 0.18)',
    },
    previewGradient: 'linear-gradient(135deg, #11281c 0%, #060e0a 60%, #1a3828 100%)',
    moteType: 'dust',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    icon: '⚫',
    tagline: 'Surgical Hypermodern Minimalism',
    description: 'Pure pitch-black and charcoal precision with zero distractions for absolute tactical focus.',
    colors: {
      base: '#040506',
      surface: '#0c0d10',
      accent: '#9ca3af',
      glow: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.09)',
    },
    previewGradient: 'linear-gradient(135deg, #13151a 0%, #040506 60%, #1f2129 100%)',
    moteType: 'none',
  },
  {
    id: 'cosmic-chess',
    name: 'Cosmic Chess',
    icon: '🌌',
    tagline: 'Infinite Calculation Void',
    description: 'Deep celestial void with ethereal ultraviolet nebulas and gentle floating stardust motes.',
    colors: {
      base: '#050711',
      surface: '#0c1024',
      accent: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.16)',
      border: 'rgba(168, 85, 247, 0.2)',
    },
    previewGradient: 'linear-gradient(135deg, #181438 0%, #050711 55%, #24194f 100%)',
    moteType: 'stars',
  },
  {
    id: 'classic-tournament',
    name: 'Classic Tournament',
    icon: '🏆',
    tagline: 'Walnut Timber & Aged Parchment',
    description: 'Warm handcrafted walnut woodcraft and aged parchment ambiance honoring Staunton heritage.',
    colors: {
      base: '#100d0a',
      surface: '#1c1712',
      accent: '#c28b48',
      glow: 'rgba(194, 139, 72, 0.14)',
      border: 'rgba(194, 139, 72, 0.2)',
    },
    previewGradient: 'linear-gradient(135deg, #2b2016 0%, #100d0a 60%, #3d2c1e 100%)',
    moteType: 'dust',
  },
];

export const DEFAULT_ATMOSPHERE_THEME: AtmosphereThemeId = 'grandmaster-hall';
export const ATMOSPHERE_THEME_STORAGE_KEY = 'ritesh_chess_atmosphere_theme';

export function getAtmosphereTheme(id: string): AtmosphereTheme {
  return ATMOSPHERE_THEMES.find((t) => t.id === id) || ATMOSPHERE_THEMES[0];
}

