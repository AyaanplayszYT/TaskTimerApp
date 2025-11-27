// Simple synth alert to avoid external assets
export const playAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Modern sci-fi beep
    osc.type = 'sine';
    
    // Pitch ramp
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.3);
    
    // Volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};