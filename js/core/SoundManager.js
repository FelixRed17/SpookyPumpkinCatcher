export class SoundManager {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  async initialize() {
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context = new AudioContext();
      }

      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
    } catch {
      this.context = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  setBackgroundMusic(enabled) {
    if (!enabled || this.musicTimer) {
      if (!enabled) {
        window.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
      return;
    }

    const notes = [110, 103.83, 98, 92.5];
    this.musicTimer = window.setInterval(() => {
      if (!this.muted && this.context) {
        this.#tone(notes[this.musicStep % notes.length], 0.35, 'sawtooth', 0.035);
        this.musicStep += 1;
      }
    }, 450);
  }

  playCatch() { this.#tone(620, 0.11, 'sine', 0.16, 980); }
  playHit() { this.#tone(180, 0.25, 'sawtooth', 0.2, 60); }
  playStart() {
    [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
      this.#tone(frequency, 0.18, 'triangle', 0.12, null, index * 0.08);
    });
  }
  playJump() { this.#tone(160, 0.15, 'sine', 0.2, 480); }
  playDoubleJump() { this.#tone(350, 0.22, 'triangle', 0.18, 850); }
  playBonePickup() { this.#tone(587.33, 0.2, 'sine', 0.16, 880); }
  playShieldUp() { this.#tone(300, 0.35, 'square', 0.12, 900); }

  #tone(frequency, duration, type, volume, endFrequency = null, delay = 0) {
    if (this.muted || !this.context) return;

    try {
      const startAt = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
      }
      gain.gain.setValueAtTime(volume, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration);
    } catch {
      // Audio is an optional effect and must not interrupt gameplay.
    }
  }
}
