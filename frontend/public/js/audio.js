// ===================================================================
// DuoConnect - Web Audio API Synthesized Sounds & Audio Visualizer
// ===================================================================

class SoundFX {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.incomingInterval = null;
    this.outgoingInterval = null;
    this.visualizerAnimationId = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Play a simple synthesized tone
  playTone(freq, type = 'sine', duration = 0.2, gainValue = 0.15) {
    if (!this.soundEnabled) return;
    try {
      this.init();
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

  // Incoming Call Ringtone: melodic pleasant loop
  startIncomingRing() {
    if (!this.soundEnabled) return;
    this.stopIncomingRing();
    this.init();

    const ring = () => {
      if (!this.soundEnabled) return;
      const now = this.audioCtx.currentTime;
      
      // Melody: E5 -> G#5 -> B5 -> E6 chime
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.26);
      });
    };

    ring();
    this.incomingInterval = setInterval(ring, 2200);
  }

  stopIncomingRing() {
    if (this.incomingInterval) {
      clearInterval(this.incomingInterval);
      this.incomingInterval = null;
    }
  }

  // Outgoing Calling Ringtone: standard pleasant dial tone beep cadence
  startOutgoingRing() {
    if (!this.soundEnabled) return;
    this.stopOutgoingRing();
    this.init();

    const beep = () => {
      if (!this.soundEnabled) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, now); // 440 Hz
        osc2.frequency.setValueAtTime(480, now); // 480 Hz
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
      } catch (err) {}
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
    try {
      const now = this.audioCtx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
    try {
      const now = this.audioCtx.currentTime;
      const freqs = [587.33, 440, 293.66]; // D5 -> A4 -> D4
      freqs.forEach((f, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.1);

        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.28);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.29);
      });
    } catch (e) {}
  }

  // Message sent pop
  playMessageSent() {
    this.playTone(880, 'sine', 0.1, 0.07);
  }

  // Message received ping
  playMessageReceived() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now); // G5
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.1); // C6

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  // Visualizer for audio streams (shows pulsing waves on canvas)
  visualizeStream(stream, canvas) {
    if (!stream || !canvas) return;
    try {
      this.init();
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) return;

      const source = this.audioCtx.createMediaStreamSource(stream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const ctx = canvas.getContext('2d');

      const draw = () => {
        this.visualizerAnimationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        let avg = 0;
        for (let i = 0; i < bufferLength; i++) {
          avg += dataArray[i];
        }
        avg = avg / bufferLength;

        // Draw animated concentric sound rings
        const radius = 60 + (avg / 255) * 35;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 + (avg / 255) * 0.7})`;
        ctx.lineWidth = 3 + (avg / 255) * 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 14, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 + (avg / 255) * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      draw();
    } catch (e) {
      console.warn('Audio visualization not supported:', e);
    }
  }

  stopVisualizer() {
    if (this.visualizerAnimationId) {
      cancelAnimationFrame(this.visualizerAnimationId);
      this.visualizerAnimationId = null;
    }
  }
}

window.soundFX = new SoundFX();
