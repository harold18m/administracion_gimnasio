import { useCallback } from 'react';

export function useSound() {
  const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, delay = 0) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }, []);

  const playSuccess = useCallback(() => {
    // A pleasant major third ascending
    playTone(880, 'sine', 0.1); // A5
    playTone(1108.73, 'sine', 0.4, 0.1); // C#6
  }, [playTone]);

  const playError = useCallback(() => {
    // A harsh buzz/low tone
    playTone(150, 'sawtooth', 0.3);
    playTone(100, 'sawtooth', 0.3, 0.2);
  }, [playTone]);

  return { playSuccess, playError };
}
