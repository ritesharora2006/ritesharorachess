/**
 * Small external store for the persisted player name (localStorage-backed).
 * Using useSyncExternalStore avoids SSR/client hydration mismatches and
 * satisfies the react-hooks rules (no setState in effects, no ref reads in render).
 */

type Listener = () => void;

let listeners: Listener[] = [];

export const playerNameStore = {
  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  get(): string {
    if (typeof window === 'undefined') return 'Ritesh';
    return localStorage.getItem('playerName') || 'Ritesh';
  },
  /** Server snapshot is always the default so SSR HTML is deterministic. */
  getServerSnapshot(): string {
    return 'Ritesh';
  },
  set(name: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('playerName', name);
    listeners.forEach((l) => l());
  },
};
