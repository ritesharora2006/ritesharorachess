/**
 * RITESH CHESS — Cinematic Welcome Voice Architecture
 * Delivers a studio-grade, professional female AI voice introduction:
 * "Welcome... to the future of chess... by Ritesh Arora."
 */

export interface VoicePlaybackHandle {
  stop: () => void;
}

export function playWelcomeVoice(options?: {
  soundEnabled?: boolean;
  onEnded?: () => void;
}): VoicePlaybackHandle {
  if (typeof window === 'undefined') return { stop: () => {} };
  if (options?.soundEnabled === false) return { stop: () => {} };

  let isStopped = false;
  let audio: HTMLAudioElement | null = null;

  try {
    audio = new Audio('/audio/welcome-voice.mp3');
    audio.preload = 'auto';
    audio.volume = 0.95;

    if (options?.onEnded) {
      audio.addEventListener('ended', options.onEnded);
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Browser autoplay policy engaged before first user gesture.
        // Arm single-interaction unlock listeners across window.
        const unlock = () => {
          if (!isStopped && audio) {
            audio.play().catch(() => {
              speakWithWebSpeechFallback();
            });
          }
          cleanup();
        };

        const cleanup = () => {
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        };

        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      });
    }
  } catch {
    speakWithWebSpeechFallback();
  }

  function speakWithWebSpeechFallback() {
    if (isStopped || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Welcome to the future of chess, by Ritesh Arora.');
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Aria') ||
            v.name.includes('Jenny') ||
            v.name.includes('Natural') ||
            v.name.includes('Online') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Zira') ||
            v.name.toLowerCase().includes('female'))
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful silence on unsupported environments
    }
  }

  return {
    stop: () => {
      isStopped = true;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    },
  };
}

