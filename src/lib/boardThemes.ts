export type BoardThemeId = 'wood' | 'green' | 'blue' | 'purple' | 'dark' | 'sand' | 'ocean' | 'autumn';

export interface BoardTheme {
  id: BoardThemeId;
  label: string;
  icon: string;
  light: string;
  dark: string;
  move: string;
  lastMove: string;
  selected: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'wood', label: 'Classic Wood', icon: '🪵', light: '#e4c28d', dark: '#91643b', move: '#b98b59', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'green', label: 'Green', icon: '🌿', light: '#f0d9b5', dark: '#4f7652', move: '#c5bd83', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'blue', label: 'Blue', icon: '🔵', light: '#d8eaf3', dark: '#4d76a1', move: '#a9c7d4', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'purple', label: 'Purple', icon: '🟣', light: '#e7d9ef', dark: '#6d4d80', move: '#bba7c8', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'dark', label: 'Dark', icon: '⚫', light: '#4a4d50', dark: '#17191d', move: '#5e6266', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'sand', label: 'Sand', icon: '🏜️', light: '#ead7b5', dark: '#9a7045', move: '#c7ae83', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'ocean', label: 'Ocean', icon: '🌊', light: '#bfe8ea', dark: '#16466b', move: '#7eb6bb', lastMove: '#d4a94099', selected: '#d4a940' },
  { id: 'autumn', label: 'Autumn', icon: '🍂', light: '#f0d6a2', dark: '#9a4f27', move: '#c39b69', lastMove: '#d4a94099', selected: '#d4a940' },
];

export const DEFAULT_BOARD_THEME: BoardThemeId = 'wood';
export const BOARD_THEME_STORAGE_KEY = 'ritesh-chess-board-theme';

export function getBoardTheme(id: BoardThemeId): BoardTheme {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0];
}
