/**
 * Web Audio DJ Groove Synthesizer
 * Provides instant auditory feedback for tracks when official Spotify MP3 previews
 * are unavailable or restricted. Synthesizes a tempo-locked, energy-responsive
 * rhythmic groove at the track's exact BPM and vibe.
 */

class DJGrooveSynthesizer {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private bpm: number = 124;
  private energy: number = 60;
  private gainNode: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTrackPreview(bpm: number = 124, energy: number = 60, valence: number = 50) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.gainNode) return;

    this.bpm = Math.min(180, Math.max(70, bpm));
    this.energy = Math.min(100, Math.max(10, energy));
    this.isRunning = true;
    this.currentStep = 0;

    const stepIntervalMs = (60000 / this.bpm) / 4; // 16th notes

    const tick = () => {
      if (!this.isRunning || !this.ctx) return;
      this.scheduleStep(this.currentStep, valence);
      this.currentStep = (this.currentStep + 1) % 16;
      this.timerId = window.setTimeout(tick, stepIntervalMs);
    };

    tick();
  }

  private scheduleStep(step: number, valence: number) {
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;

    const isQuarter = step % 4 === 0;
    const isOffbeat = step % 4 === 2;

    // 1. Kick Drum on every beat (steps 0, 4, 8, 12)
    if (isQuarter) {
      this.playKick(now);
    }

    // 2. Hi-Hat on offbeats & 16ths based on energy
    if (isOffbeat || (this.energy > 70 && step % 2 === 0)) {
      this.playHiHat(now, isOffbeat ? 0.8 : 0.4);
    }

    // 3. Melodic Bass / Chord pulse on steps 0, 6, 10
    if (step === 0 || step === 6 || step === 10) {
      this.playBassNote(now, valence);
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.gainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    const kickVol = (this.energy / 100) * 0.7 + 0.3;
    gain.gain.setValueAtTime(kickVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playHiHat(time: number, volScale: number = 0.6) {
    if (!this.ctx || !this.gainNode) return;

    // Filtered noise burst for hat
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    const hatVol = volScale * ((this.energy / 100) * 0.4 + 0.2);
    gain.gain.setValueAtTime(hatVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  private playBassNote(time: number, valence: number) {
    if (!this.ctx || !this.gainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Minor / darker for lower valence, Major / brighter for higher valence
    const baseFreq = valence > 55 ? 110 : 98; // A2 or G2
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public setMuted(muted: boolean) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }
}

export const djAudioSynth = new DJGrooveSynthesizer();
