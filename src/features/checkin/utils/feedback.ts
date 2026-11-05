import type { FeedbackTone } from '../types';

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioContext: AudioContext | null = null;

/**
 * Call this from a tap (e.g. "Start camera"). iPhones only allow sound
 * after a user gesture, so we wake the audio engine up on the first tap.
 */
export function primeAudio(): void {
  try {
    const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    audioContext ??= new Ctor();
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch {
    /* sound is a nicety, never a requirement */
  }
}

function beep(frequency: number, startAfterMs: number, durationMs: number): void {
  if (!audioContext || audioContext.state !== 'running') return;
  const start = audioContext.currentTime + startAfterMs / 1000;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + durationMs / 1000 + 0.02);
}

/** One short high beep = in. Two mid beeps = already in. One long low buzz = problem. */
export function playFeedback(tone: FeedbackTone): void {
  try {
    if (tone === 'success') {
      navigator.vibrate?.(60);
      beep(880, 0, 120);
    } else if (tone === 'warning') {
      navigator.vibrate?.([80, 60, 80]);
      beep(600, 0, 110);
      beep(600, 170, 110);
    } else {
      navigator.vibrate?.(220);
      beep(220, 0, 320);
    }
  } catch {
    /* never let feedback break a check-in */
  }
}