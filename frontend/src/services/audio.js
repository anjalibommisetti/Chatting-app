// ==============================================================================
// VibeConnect — Web Audio API Synthesized Audio Effects & Ringtones
// ==============================================================================

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.incomingInterval = null;
    this.outgoingInterval = null;
    this.visualizerId = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound(enabled) {
    if (enabled !== undefined) {
      this.soundEnabled = enabled;
    } else {
      this.soundEnabled = !this.soundEnabled;
    }
    return this.soundEnabled;
  }

  // Play simple tone
  playTone(freq, type = 'sine', duration = 0.15, gainValue = 0.1) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Incoming Call Ringtone: melodic loop (E5 -> G#5 -> B5 -> E6 chime)
  startIncomingRing() {
    if (!this.soundEnabled) return;
    this.stopIncomingRing();
    this.init();
    if (!this.audioCtx) return;

    const ring = () => {
      if (!this.soundEnabled || !this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const freqs = [659.25, 830.61, 987.77, 1318.51];
        freqs.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.29);
        });
      } catch (err) {}
    };

    ring();
    this.incomingInterval = setInterval(ring, 2400);
  }

  stopIncomingRing() {
    if (this.incomingInterval) {
      clearInterval(this.incomingInterval);
      this.incomingInterval = null;
    }
  }

  // Outgoing Dial Tone: periodic dual-frequency beep
  startOutgoingRing() {
    if (!this.soundEnabled) return;
    this.stopOutgoingRing();
    this.init();
    if (!this.audioCtx) return;

    const beep = () => {
      if (!this.soundEnabled || !this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        osc1.type = 'sine';
        osc2.type = 'sine';

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
      } catch (e) {}
    };

    beep();
    this.outgoingInterval = setInterval(beep, 3500);
  }

  stopOutgoingRing() {
    if (this.outgoingInterval) {
      clearInterval(this.outgoingInterval);
      this.outgoingInterval = null;
    }
  }

  // Call Connected chime
  playCallConnected() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.36);
      });
    } catch (e) {}
  }

  // Call Ended tone
  playCallEnded() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const freqs = [587.33, 440, 293.66];
      freqs.forEach((f, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.09);

        gain.gain.setValueAtTime(0.12, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.28);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.29);
      });
    } catch (e) {}
  }

  // Message sent
  playMessageSent() {
    this.playTone(880, 'sine', 0.08, 0.07);
  }

  // Message received ping
  playMessageReceived() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }
}

export const sound = new SoundService();
