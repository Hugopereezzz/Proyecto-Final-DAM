import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;
  private bgNode: OscillatorNode | null = null;
  private bgGain: GainNode | null = null;
  private enabled = true;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopBg();
  }

  // ─── Background Ambient ─────────────────────────────────────────────────────
  startBg() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    this.bgGain = ctx.createGain();
    this.bgGain.gain.value = 0.04;
    this.bgGain.connect(ctx.destination);

    this.bgNode = ctx.createOscillator();
    this.bgNode.type = 'sawtooth';
    this.bgNode.frequency.value = 55;
    this.bgNode.connect(this.bgGain);
    this.bgNode.start();
  }

  stopBg() {
    try { this.bgNode?.stop(); } catch (_) {}
    this.bgNode = null;
  }

  /** Ramps up pitch when health is low */
  setBgTension(healthPercent: number) {
    if (!this.bgNode || !this.bgGain) return;
    const ctx = this.getCtx();
    const freq = 55 + (1 - healthPercent) * 40;
    const vol  = 0.04 + (1 - healthPercent) * 0.06;
    this.bgNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.5);
    this.bgGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.5);
  }

  // ─── SFX ────────────────────────────────────────────────────────────────────
  playLaunch() {
    if (!this.enabled) return;
    this._playTone(880, 'sawtooth', 0.15, 0.3, 440);
  }

  playExplosion() {
    if (!this.enabled) return;
    this._playNoise(0.4, 0.6);
    this._playTone(120, 'sine', 0.5, 0.8, 60);
  }

  playIntercept() {
    if (!this.enabled) return;
    this._playTone(1200, 'square', 0.1, 0.2, 1200);
  }

  playSiren() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  }

  playLevelUp() {
    if (!this.enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 'sine', 0.2, 0.15), i * 100);
    });
  }

  playRevengeReady() {
    if (!this.enabled) return;
    [300, 400, 600, 800].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 'sawtooth', 0.25, 0.15), i * 80);
    });
  }

  playWorldEvent() {
    if (!this.enabled) return;
    [200, 250, 200, 150].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 'sine', 0.3, 0.2), i * 120);
    });
  }

  // ─── Internals ──────────────────────────────────────────────────────────────
  private _playTone(freq: number, type: OscillatorType, vol: number, duration: number, endFreq?: number) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (endFreq !== undefined) {
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }

  private _playNoise(vol: number, duration: number) {
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }
}
