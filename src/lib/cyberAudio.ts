/**
 * @file cyberAudio.ts
 * Browser-native Web Audio API synthesizer for The Sanctuary Lounge.
 * Delivers soothing cyberpunk generative lounge music & tactile sci-fi sound effects.
 */

class CyberAudioManager {
  private ctx: AudioContext | null = null;
  private isMusicPlaying = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private intervalId: number | null = null;
  private sfxEnabled = true;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Toggle ambient lounge music
  public toggleMusic(): boolean {
    this.initContext();
    if (!this.ctx || !this.musicGain) return false;

    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isMusicPlaying;
  }

  private startMusic() {
    if (!this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;

    // Pentatonic lounge notes (A minor / Cyber chill: A2, C3, D3, E3, G3, A3, C4)
    const scale = [110, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 329.63];
    let step = 0;

    const playAmbientNote = () => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Warm analog synth filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + Math.sin(step) * 200, this.ctx.currentTime);

      const freq = scale[step % scale.length];
      osc.type = step % 4 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.08, now + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 3.0);

      step = (step + (Math.random() > 0.4 ? 1 : 2)) % scale.length;
    };

    // Play drone chord in background
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 deep bass
    droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    droneOsc.connect(droneGain);
    droneGain.connect(this.musicGain);
    droneOsc.start();

    playAmbientNote();
    this.intervalId = window.setInterval(playAmbientNote, 950);
  }

  private stopMusic() {
    this.isMusicPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Tactical sci-fi sound effects
  public playClick() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  public playSuccess() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.04, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.35);
      });
    } catch {}
  }
}

export const cyberAudio = new CyberAudioManager();
