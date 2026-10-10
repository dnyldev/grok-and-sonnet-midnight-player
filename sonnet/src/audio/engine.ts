// A small Web Audio synthesis + scheduling engine.
// Nothing here is a pre-recorded sample: every sound (pad, bass, comp, drums)
// is generated from oscillators / filtered noise in real time.

import { parseChord, transposeChordSymbol, type ParsedChord } from "../lib/theory";
import type { Song } from "../data/types";

export type StemKey = "vocal" | "drums" | "bass" | "pad" | "piano";

export const STEM_KEYS: StemKey[] = ["vocal", "drums", "bass", "pad", "piano"];

export const DEFAULT_STEM_VOLUME: Record<StemKey, number> = {
  vocal: 0,
  drums: 0.82,
  bass: 0.78,
  pad: 0.62,
  piano: 0.6,
};

const LOOKAHEAD_SEC = 0.22; // how far ahead we schedule audio events
const TICK_MS = 35;

function noteFreq(semitoneFromC0: number): number {
  // MIDI-ish: C4 = 60 -> here we treat semitoneFromC0=60 as middle C (261.63Hz)
  return 261.6255653 * Math.pow(2, (semitoneFromC0 - 60) / 12);
}

interface ChordPoint {
  absBeat: number;
  symbol: string;
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private masterAnalyser!: AnalyserNode;
  stemGains: Partial<Record<StemKey, GainNode>> = {};
  private stemAnalysers: Partial<Record<StemKey, AnalyserNode>> = {};
  private noiseBuffer: AudioBuffer | null = null;

  private songRef: Song | null = null;
  private chordPoints: ChordPoint[] = [];
  private totalBeats = 0;

  private secPerBeat = 0.6;
  private transpose = 0;

  private elapsedBeats = 0;
  private elapsedSeconds = 0;
  private ctxTimeAtRef = 0;
  playing = false;

  private nextBeatToSchedule = 0;
  private timer: number | null = null;

  onEnded: (() => void) | null = null;

  private ensureCtx() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 1;
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 128;
    this.master.connect(this.masterAnalyser);
    this.masterAnalyser.connect(ctx.destination);

    for (const key of STEM_KEYS) {
      const gain = ctx.createGain();
      gain.gain.value = DEFAULT_STEM_VOLUME[key];
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      gain.connect(analyser);
      gain.connect(this.master);
      this.stemGains[key] = gain;
      this.stemAnalysers[key] = analyser;
    }

    // shared noise buffer for snare/hihat
    const len = ctx.sampleRate * 1;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;

    return ctx;
  }

  loadSong(song: Song) {
    this.songRef = song;
    this.secPerBeat = 60 / song.bpm;
    this.totalBeats = song.bars * 4;
    this.chordPoints = song.chords
      .map((c) => ({ absBeat: c.bar * 4 + c.beat, symbol: c.chord }))
      .sort((a, b) => a.absBeat - b.absBeat);
    this.elapsedBeats = 0;
    this.elapsedSeconds = 0;
    this.nextBeatToSchedule = 0;
    this.transpose = 0;
  }

  setStemVolume(key: StemKey, value: number) {
    const ctx = this.ctx;
    const g = this.stemGains[key];
    if (!ctx || !g) return;
    g.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
  }

  setTranspose(semitones: number) {
    this.transpose = semitones;
    if (this.playing && this.ctx) {
      // immediate re-voicing for instant feedback
      const sym = this.chordAt(this.currentBeat());
      this.startPad(sym, this.ctx.currentTime + 0.02, this.remainingChordBeats(this.currentBeat()));
      this.strumChord(sym, this.ctx.currentTime + 0.02, true);
    }
  }

  setBpm(bpm: number) {
    if (!this.ctx) {
      this.secPerBeat = 60 / bpm;
      return;
    }
    const now = this.ctx.currentTime;
    const beat = this.currentBeat(now);
    const seconds = this.currentSeconds(now);
    this.secPerBeat = 60 / bpm;
    this.elapsedBeats = beat;
    this.elapsedSeconds = seconds;
    this.ctxTimeAtRef = now;
    this.nextBeatToSchedule = Math.floor(beat);
  }

  private chordAt(absBeat: number): string {
    let sym = this.chordPoints[0]?.symbol ?? "C";
    for (const p of this.chordPoints) {
      if (p.absBeat <= absBeat + 1e-6) sym = p.symbol;
      else break;
    }
    return transposeChordSymbol(sym, this.transpose);
  }

  private remainingChordBeats(absBeat: number): number {
    let next = this.totalBeats;
    for (const p of this.chordPoints) {
      if (p.absBeat > absBeat + 1e-6) {
        next = p.absBeat;
        break;
      }
    }
    return Math.max(0.5, next - absBeat);
  }

  currentBeat(now?: number): number {
    if (!this.playing) return this.elapsedBeats;
    const t = now ?? this.ctx?.currentTime ?? 0;
    return this.elapsedBeats + (t - this.ctxTimeAtRef) / this.secPerBeat;
  }

  currentSeconds(now?: number): number {
    if (!this.playing) return this.elapsedSeconds;
    const t = now ?? this.ctx?.currentTime ?? 0;
    return this.elapsedSeconds + (t - this.ctxTimeAtRef);
  }

  durationSeconds(): number {
    const beat = this.currentBeat();
    const seconds = this.currentSeconds();
    return seconds + Math.max(0, this.totalBeats - beat) * this.secPerBeat;
  }

  bpm(): number {
    return 60 / this.secPerBeat;
  }

  currentSong(): Song | null {
    return this.songRef;
  }

  play() {
    const ctx = this.ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (this.playing) return;
    if (this.elapsedBeats >= this.totalBeats) {
      this.elapsedBeats = 0;
      this.elapsedSeconds = 0;
    }
    this.playing = true;
    this.ctxTimeAtRef = ctx.currentTime + 0.05;
    this.nextBeatToSchedule = Math.floor(this.elapsedBeats);
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  pause() {
    if (!this.playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.elapsedBeats = this.currentBeat(now);
    this.elapsedSeconds = this.currentSeconds(now);
    this.playing = false;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.04);
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
  }

  seekSeconds(seconds: number) {
    const clamped = Math.max(0, Math.min(this.durationSeconds(), seconds));
    const beat = clamped / this.secPerBeat;
    this.elapsedBeats = beat;
    this.elapsedSeconds = clamped;
    if (this.playing && this.ctx) {
      const now = this.ctx.currentTime;
      this.ctxTimeAtRef = now + 0.03;
      this.nextBeatToSchedule = Math.floor(beat);
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(0, now + 0.025);
      this.master.gain.linearRampToValueAtTime(1, now + 0.09);
    }
  }

  private timeForBeat(b: number): number {
    return this.ctxTimeAtRef + (b - this.elapsedBeats) * this.secPerBeat;
  }

  private tick() {
    if (!this.playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    const curBeat = this.currentBeat(now);
    if (curBeat >= this.totalBeats) {
      this.elapsedBeats = this.totalBeats;
      this.elapsedSeconds = this.currentSeconds(now);
      this.playing = false;
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      this.onEnded?.();
      return;
    }
    const horizon = curBeat + LOOKAHEAD_SEC / this.secPerBeat + 1;
    while (this.nextBeatToSchedule < horizon && this.nextBeatToSchedule < this.totalBeats) {
      const b = this.nextBeatToSchedule;
      const t = this.timeForBeat(b);
      this.scheduleBeat(b, t);
      this.nextBeatToSchedule += 1;
    }
  }

  private scheduleBeat(absBeat: number, time: number) {
    const beatInBar = absBeat % 4;
    const sym = this.chordAt(absBeat);
    const prevSym = absBeat > 0 ? this.chordAt(absBeat - 1) : null;
    const changed = sym !== prevSym;

    this.scheduleDrums(beatInBar, time);
    this.scheduleBass(sym, time, beatInBar === 0);

    if (changed) {
      this.strumChord(sym, time, true);
      this.startPad(sym, time, this.remainingChordBeats(absBeat));
    } else if (beatInBar === 2) {
      this.strumChord(sym, time, false);
    }
  }

  // ---------- Drums ----------
  private scheduleDrums(beatInBar: number, time: number) {
    const gain = this.stemGains.drums!;
    // kick on 0 and 2
    if (beatInBar === 0 || beatInBar === 2) this.kick(time, gain);
    // snare on 1 and 3
    if (beatInBar === 1 || beatInBar === 3) this.snare(time, gain);
    // hihat eighth notes
    this.hihat(time, gain, beatInBar === 0 || beatInBar === 2 ? 0.9 : 0.6);
    this.hihat(time + this.secPerBeat / 2, gain, 0.4);
  }

  private kick(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.14);
    g.gain.setValueAtTime(0.001, time);
    g.gain.exponentialRampToValueAtTime(1, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(g).connect(dest);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  private snare(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.7, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    noise.connect(bp).connect(g).connect(dest);
    noise.start(time);
    noise.stop(time + 0.2);

    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.value = 190;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.25, time);
    bg.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    body.connect(bg).connect(dest);
    body.start(time);
    body.stop(time + 0.12);
  }

  private hihat(time: number, dest: AudioNode, velocity: number) {
    const ctx = this.ctx!;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.5 * velocity, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    noise.connect(hp).connect(g).connect(dest);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  // ---------- Bass ----------
  private scheduleBass(symbol: string, time: number, accent: boolean) {
    const ctx = this.ctx!;
    const chord = parseChord(symbol);
    const dest = this.stemGains.bass!;
    const freq = noteFreq(36 + chord.root);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq / 2;
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const g = ctx.createGain();
    const peak = accent ? 0.9 : 0.6;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + this.secPerBeat * 0.92);
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(g).connect(dest);
    osc.start(time);
    sub.start(time);
    osc.stop(time + this.secPerBeat);
    sub.stop(time + this.secPerBeat);
  }

  // ---------- Comp / "piano" strum ----------
  private strumChord(symbol: string, time: number, full: boolean) {
    const ctx = this.ctx!;
    const chord = parseChord(symbol);
    const dest = this.stemGains.piano!;
    const tones = full ? chord.intervals : chord.intervals.slice(0, 3);
    tones.forEach((interval, i) => {
      const t = time + i * 0.012;
      const freq = noteFreq(60 + chord.root + interval);
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 0.6;
      filter.frequency.setValueAtTime(3200, t);
      filter.frequency.exponentialRampToValueAtTime(500, t + (full ? 0.5 : 0.22));
      const g = ctx.createGain();
      const peak = full ? 0.22 : 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (full ? 0.55 : 0.26));
      osc.connect(filter).connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + (full ? 0.6 : 0.3));
    });
  }

  // ---------- Pad ----------
  private startPad(symbol: string, time: number, durationBeats: number) {
    const ctx = this.ctx!;
    const chord: ParsedChord = parseChord(symbol);
    const dest = this.stemGains.pad!;
    const dur = Math.max(0.6, durationBeats * this.secPerBeat);
    const release = 0.5;

    chord.intervals.forEach((interval) => {
      const freq = noteFreq(48 + chord.root + interval);
      [-5, 5].forEach((detune) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1100;
        filter.Q.value = 0.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(0.18, time + 0.4);
        g.gain.setValueAtTime(0.18, Math.max(time + 0.41, time + dur - release));
        g.gain.linearRampToValueAtTime(0.0001, time + dur);
        osc.connect(filter).connect(g).connect(dest);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      });
    });
  }

  // ---------- Levels for UI ----------
  getLevel(key: StemKey | "master"): number {
    const analyser = key === "master" ? this.masterAnalyser : this.stemAnalysers[key];
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }

  getSpectrum(bands = 24): number[] {
    if (!this.masterAnalyser) return new Array(bands).fill(0);
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    const out: number[] = [];
    const step = Math.floor(data.length / bands) || 1;
    for (let i = 0; i < bands; i++) {
      out.push((data[i * step] ?? 0) / 255);
    }
    return out;
  }

  getBarBeat(): { bar: number; beat: number } {
    const b = Math.max(0, this.currentBeat());
    return { bar: Math.floor(b / 4), beat: Math.floor(b % 4) };
  }
}
