/**
 * RITESH CHESS — Studio Sound Architecture & Tactile Haptics
 * Organic, material-grounded audio synthesis simulating real wooden boards,
 * felt mats, and heavy Staunton pieces, plus native device haptic feedback.
 */

export type SoundProfileId = 'wood' | 'vinyl' | 'marble';

export interface SoundProfile {
  id: SoundProfileId;
  name: string;
  description: string;
}

export const SOUND_PROFILES: SoundProfile[] = [
  { id: 'wood', name: 'Tournament Walnut Wood', description: 'Deep, resonant acoustic thud of weighted wood on timber.' },
  { id: 'vinyl', name: 'Club Vinyl & Felt', description: 'Crisp, muted placement on tournament canvas.' },
  { id: 'marble', name: 'Polished Marble Stone', description: 'Sharp, clean mineral strike with high-frequency clarity.' },
];

export const SOUND_PROFILE_STORAGE_KEY = 'ritesh_chess_sound_profile';

let activeAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!activeAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      activeAudioCtx = new AudioCtx();
    }
  }
  if (activeAudioCtx && activeAudioCtx.state === 'suspended') {
    activeAudioCtx.resume().catch(() => {});
  }
  return activeAudioCtx;
}

export type SoundEvent = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'endgame' | 'lowtime';

export function playSound(event: SoundEvent, profile: SoundProfileId = 'wood') {
  if (typeof window === 'undefined') return;

  // 1. Device Haptics
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (event === 'move') {
        navigator.vibrate(12);
      } else if (event === 'capture') {
        navigator.vibrate([20, 30, 20]);
      } else if (event === 'check') {
        navigator.vibrate([35, 40, 35]);
      } else if (event === 'endgame') {
        navigator.vibrate([50, 50, 80]);
      }
    } catch {
      // Haptics not allowed
    }
  }

  // 2. High-Definition Audio Synthesis
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (event === 'move') {
      if (profile === 'wood') {
        // Deep resonant wood knock with natural sub-harmonic
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (profile === 'vinyl') {
        // Soft felt tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        // Sharp marble click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } else if (event === 'capture') {
      // Snappy double-knock impact
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(480, now);
      osc1.frequency.exponentialRampToValueAtTime(150, now + 0.09);
      osc2.frequency.setValueAtTime(680, now);
      osc2.frequency.exponentialRampToValueAtTime(190, now + 0.09);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.09);
      osc2.stop(now + 0.09);
    } else if (event === 'check') {
      // Clear alert chime with rich harmonic
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (event === 'castle') {
      // Two-step glide
      [0, 0.09].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 300 : 360, now + delay);
        osc.frequency.exponentialRampToValueAtTime(120, now + delay + 0.06);
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      });
    } else if (event === 'endgame') {
      // Grandmaster resolution chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.28, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } else if (event === 'lowtime') {
      // Subtle heartbeat tension pulse for < 10 seconds
      [0, 0.12].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(85, now + delay);
        osc.frequency.exponentialRampToValueAtTime(45, now + delay + 0.08);
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    }
  } catch {
    // Ignore audio interruption
  }
}

