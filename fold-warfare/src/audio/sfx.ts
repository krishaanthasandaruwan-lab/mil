import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Game audio on Web Audio. Recorded samples from public/audio (built by `npm run audio`) play with a random
 * variant and slight pitch change per shot, so volleys never sound copy-pasted. Any sound without a sample
 * falls back to the synthesized version below, which also covers the moments before the samples finish loading.
 */

type Wave = OscillatorType;
export type MusicTrack = 'menu' | 'placement' | 'battle';
export type VoiceLine = 'fire_in_the_hole' | 'target_destroyed' | 'mission_completed' | 'mission_failed' | 'its_a_tie' | 'ready' | 'go' | 'final_round';

type Manifest = {
  sfx: Record<string, { volume: number; files: string[] }>;
  music: Record<string, { volume: number; file: string }>;
};
type Sample = { volume: number; buffers: AudioBuffer[] };
type PlayOptions = { volume?: number; spread?: number; delay?: number; /** Play only the last N seconds, so the sound ends on cue. */ tail?: number };
type PlayingMusic = { name: MusicTrack; synth: boolean; gain: GainNode; stop: () => void };

const AUDIO_BASE = 'audio/';
const MASTER_VOLUME = 0.8;

class SoundEngine {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  private musicBus: GainNode | undefined;
  private effectsBus: GainNode | undefined;
  private voiceBus: GainNode | undefined;
  private noiseBuffer: AudioBuffer | undefined;
  private samples = new Map<string, Sample>();
  private tracks = new Map<MusicTrack, { volume: number; buffer: AudioBuffer }>();
  private wantedTrack: MusicTrack | undefined;
  private playing: PlayingMusic | undefined;
  muted = false;
  musicEnabled = true;
  effectsEnabled = true;
  voiceEnabled = true;
  vibration = true;

  private ensureCtx(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    this.master.connect(comp).connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.effectsBus = ctx.createGain();
    this.effectsBus.gain.value = this.effectsEnabled ? 1 : 0;
    this.effectsBus.connect(this.master);
    this.voiceBus = ctx.createGain();
    this.voiceBus.gain.value = this.voiceEnabled ? 1 : 0;
    this.voiceBus.connect(this.master);
    this.ctx = ctx;
    this.noiseBuffer = this.makeNoise();
    return ctx;
  }

  /** Browsers only allow audio after a user gesture; call from the first pointerdown. */
  unlock(): void {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') void ctx.resume().then(() => this.refreshMusic());
    else this.refreshMusic();
  }

  /** Fetches and decodes public/audio. Missing or broken files simply keep their synth fallback. */
  async loadSamples(): Promise<void> {
    const ctx = this.ensureCtx();
    const res = await fetch(`${AUDIO_BASE}manifest.json`).catch(() => undefined);
    if (!res?.ok) return;
    const manifest = (await res.json()) as Manifest;
    const decode = async (file: string): Promise<AudioBuffer | undefined> => {
      try {
        const data = await (await fetch(AUDIO_BASE + file)).arrayBuffer();
        return await ctx.decodeAudioData(data);
      } catch {
        return undefined;
      }
    };
    const sfxLoads = Object.entries(manifest.sfx).map(async ([key, spec]) => {
      const buffers = (await Promise.all(spec.files.map(decode))).filter((b): b is AudioBuffer => !!b);
      if (buffers.length) this.samples.set(key, { volume: spec.volume, buffers });
    });
    const musicLoads = Object.entries(manifest.music).map(async ([key, spec]) => {
      const buffer = await decode(spec.file);
      if (buffer) this.tracks.set(key as MusicTrack, { volume: spec.volume, buffer });
    });
    await Promise.all([...sfxLoads, ...musicLoads]);
    this.refreshMusic();
  }

  /** "All sound" switch: silences effects, voice and music together. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.02);
  }

  setEffectsEnabled(on: boolean): void {
    this.effectsEnabled = on;
    if (this.effectsBus && this.ctx) this.effectsBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.02);
  }

  setVoiceEnabled(on: boolean): void {
    this.voiceEnabled = on;
    if (this.voiceBus && this.ctx) this.voiceBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.02);
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.requireCtx();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private requireCtx(): AudioContext {
    if (!this.ctx) throw new Error('Audio not unlocked yet');
    return this.ctx;
  }

  private get ready(): boolean {
    return !!this.ctx && !!this.master && this.ctx.state === 'running';
  }

  private tone(freq: number, endFreq: number, duration: number, wave: Wave, volume: number, delay = 0, out?: AudioNode): void {
    if (!this.ready || !this.ctx || !this.effectsBus) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(out ?? this.effectsBus);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private noise(duration: number, volume: number, filterFreq: number, filterEnd: number, type: BiquadFilterType = 'lowpass', delay = 0, out?: AudioNode): void {
    if (!this.ready || !this.ctx || !this.effectsBus || !this.noiseBuffer) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(filterEnd, 20), t + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(out ?? this.effectsBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + duration + 0.05);
  }

  private vary(base: number, spread = 0.08): number {
    return base * (1 + (Math.random() - 0.5) * spread * 2);
  }

  /** Plays a recorded sample. Returns false when there is none, so the caller falls back to the synth. */
  private sample(key: string, opts: PlayOptions = {}): boolean {
    const sample = this.samples.get(key);
    if (!sample) return false;
    const bus = key.startsWith('voice_') ? this.voiceBus : this.effectsBus;
    if (!this.ready || !this.ctx || !bus) return true;
    const buffer = sample.buffers[Math.floor(Math.random() * sample.buffers.length)];
    if (!buffer) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const rate = this.vary(1, opts.spread ?? 0.05);
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    gain.gain.value = sample.volume * (opts.volume ?? 1);
    src.connect(gain).connect(bus);
    const t = this.ctx.currentTime + (opts.delay ?? 0);
    const offset = opts.tail ? Math.max(0, buffer.duration - opts.tail * rate) : 0;
    src.start(t, offset);
    return true;
  }

  /** Dips the music under a big hit or an announcer line, then brings it back. */
  private duck(level = 0.35, hold = 0.6): void {
    if (!this.ctx || !this.musicBus) return;
    const g = this.musicBus.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(level, t, 0.03);
    g.setTargetAtTime(1, t + hold, 0.35);
  }

  voice(line: VoiceLine): void {
    if (this.voiceEnabled && this.sample(`voice_${line}`, { spread: 0 })) this.duck(0.45, 1.1);
  }

  click(): void {
    if (this.sample('click')) return;
    this.tone(this.vary(900), 600, 0.06, 'square', 0.12);
  }
  select(): void {
    if (this.sample('select')) return;
    this.tone(520, 880, 0.09, 'triangle', 0.25);
    this.tone(880, 1320, 0.08, 'triangle', 0.15, 0.06);
  }
  place(): void {
    if (this.sample('place')) return;
    this.tone(this.vary(180), 60, 0.18, 'sine', 0.6);
    this.noise(0.12, 0.35, 1200, 200);
  }
  invalid(): void {
    if (this.sample('invalid')) return;
    this.tone(160, 120, 0.16, 'square', 0.18);
    this.tone(130, 100, 0.16, 'square', 0.18, 0.09);
  }
  tick(urgent = false): void {
    if (this.sample('tick', { volume: urgent ? 1.6 : 1, spread: 0 })) return;
    this.tone(urgent ? 1400 : 1000, urgent ? 1300 : 950, 0.05, 'square', urgent ? 0.14 : 0.07);
  }
  turnStart(): void {
    if (this.sample('turn_start')) return;
    this.tone(660, 660, 0.09, 'triangle', 0.25);
    this.tone(990, 990, 0.14, 'triangle', 0.25, 0.1);
  }
  whoosh(): void {
    this.noise(0.55, 0.5, 300, 3500, 'bandpass');
  }
  slam(): void {
    this.duck(0.25, 0.9);
    if (this.sample('slam', { spread: 0.02 })) return;
    this.tone(120, 35, 0.5, 'sine', 0.9);
    this.noise(0.45, 0.8, 2500, 80);
  }
  cannon(): void {
    if (this.sample('cannon')) return;
    this.tone(this.vary(140), 40, 0.25, 'sawtooth', 0.35);
    this.noise(0.22, 0.55, 3000, 200);
  }
  mortarThump(): void {
    if (this.sample('mortar_fire')) return;
    this.tone(this.vary(220), 70, 0.14, 'sine', 0.5);
    this.noise(0.1, 0.3, 900, 150);
  }
  whistle(duration = 0.45): void {
    if (this.sample('mortar_whistle', { tail: duration, spread: 0.03 })) return;
    this.tone(this.vary(1800), 700, duration, 'sine', 0.08);
  }
  rocket(): void {
    if (this.sample('rocket')) return;
    this.noise(0.5, 0.35, 600, 4000, 'bandpass');
    this.tone(this.vary(300), 900, 0.4, 'sawtooth', 0.06);
  }
  turret(): void {
    if (this.sample('turret', { spread: 0.08 })) return;
    for (let i = 0; i < 3; i++) {
      this.noise(0.05, 0.3, 4000, 800, 'highpass', i * 0.07);
      this.tone(this.vary(500), 200, 0.04, 'square', 0.1, i * 0.07);
    }
  }
  explosion(size: 'small' | 'medium' | 'big' = 'medium'): void {
    if (size === 'big') this.duck();
    if (this.sample(`explosion_${size}`)) return;
    const scale = size === 'big' ? 1.6 : size === 'small' ? 0.6 : 1;
    this.tone(this.vary(90), 25, 0.5 * scale, 'sine', 0.9);
    this.noise(0.7 * scale, 0.9, 2200, 60);
    if (size === 'big') this.noise(1.2, 0.5, 600, 40, 'lowpass', 0.08);
  }
  clang(): void {
    if (this.sample('crash')) return;
    this.tone(this.vary(1200), 900, 0.25, 'square', 0.12);
    this.tone(this.vary(1650), 1500, 0.3, 'triangle', 0.15);
    this.noise(0.08, 0.4, 6000, 2000, 'highpass');
  }
  defuse(): void {
    this.noise(0.4, 0.3, 5000, 1500, 'highpass');
    this.tone(1500, 2400, 0.12, 'triangle', 0.18, 0.15);
  }
  beep(): void {
    this.tone(1760, 1760, 0.07, 'square', 0.12);
  }
  radar(): void {
    this.tone(1200, 1200, 0.25, 'sine', 0.2);
    this.tone(1200, 1200, 0.25, 'sine', 0.1, 0.35);
  }
  shieldUp(): void {
    if (this.sample('shield_up')) return;
    this.tone(300, 1200, 0.5, 'triangle', 0.22);
    this.tone(450, 1800, 0.5, 'sine', 0.12, 0.05);
  }
  shieldBreak(): void {
    if (this.sample('shield_break')) return;
    this.noise(0.5, 0.6, 8000, 1000, 'highpass');
    this.tone(1400, 300, 0.4, 'triangle', 0.2);
  }
  reveal(): void {
    this.tone(300, 700, 0.18, 'sine', 0.2);
    this.noise(0.25, 0.2, 2000, 400, 'bandpass');
  }
  star(index: number): void {
    const base = 660 * Math.pow(1.26, index);
    this.tone(base, base, 0.15, 'triangle', 0.35);
    this.tone(base * 1.5, base * 1.5, 0.3, 'triangle', 0.25, 0.08);
    this.noise(0.25, 0.3, 4000, 900);
  }
  coin(): void {
    this.tone(this.vary(1300, 0.03), 1300, 0.06, 'square', 0.1);
    this.tone(1950, 1950, 0.12, 'square', 0.1, 0.06);
  }
  victory(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.3, 'triangle', 0.3, i * 0.13));
    this.tone(1047, 1047, 0.7, 'square', 0.12, 0.55);
    this.tone(784, 784, 0.7, 'triangle', 0.2, 0.55);
  }
  defeat(): void {
    [392, 349, 311, 262].forEach((f, i) => this.tone(f, f * 0.98, 0.4, 'triangle', 0.25, i * 0.22));
  }
  banner(): void {
    this.noise(0.25, 0.4, 500, 3000, 'bandpass');
    this.tone(220, 110, 0.25, 'sawtooth', 0.15, 0.1);
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    this.refreshMusic();
  }

  /** Each screen asks for its track; switching crossfades. `undefined` fades the music out. */
  music(track: MusicTrack | undefined): void {
    this.wantedTrack = track;
    this.refreshMusic();
  }

  private refreshMusic(): void {
    if (!this.ready || !this.ctx || !this.musicBus) return;
    const want = this.musicEnabled ? this.wantedTrack : undefined;
    const current = this.playing;
    if (current && current.name === want && !(current.synth && want && this.tracks.has(want))) return;
    if (current) {
      current.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      window.setTimeout(current.stop, 1500);
      this.playing = undefined;
    }
    if (!want) return;
    const track = this.tracks.get(want);
    this.playing = track ? this.playTrack(want, track.buffer, track.volume) : this.tracks.size === 0 ? this.playSynthMarch(want) : undefined;
  }

  private playTrack(name: MusicTrack, buffer: AudioBuffer, volume: number): PlayingMusic | undefined {
    if (!this.ctx || !this.musicBus) return undefined;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    // MP3 encoder padding sits at both ends; looping just inside it avoids a gap at the seam.
    src.loopStart = 0.03;
    src.loopEnd = buffer.duration - 0.03;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.4);
    src.connect(gain).connect(this.musicBus);
    src.start(this.ctx.currentTime, 0.03);
    return { name, synth: false, gain, stop: () => {
      src.stop();
      gain.disconnect();
    } };
  }

  /** Light military march loop (bass + snare) used until the music files are loaded, or if they are missing. */
  private playSynthMarch(name: MusicTrack): PlayingMusic | undefined {
    if (!this.ctx || !this.musicBus) return undefined;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.18;
    gain.connect(this.musicBus);
    const bass = [110, 0, 110, 0, 146.8, 0, 130.8, 0, 110, 0, 110, 0, 98, 0, 103.8, 0];
    const lead = [440, 0, 523, 0, 587, 0, 523, 659, 0, 587, 523, 0, 494, 0, 440, 0];
    let stepCount = 0;
    const timer = window.setInterval(() => {
      const step = stepCount++ % 16;
      const b = bass[step] ?? 0;
      if (b) this.tone(b, b, 0.18, 'triangle', 0.5, 0, gain);
      const l = lead[step] ?? 0;
      if (l && Math.floor(stepCount / 16) % 2 === 1) this.tone(l, l, 0.12, 'square', 0.08, 0, gain);
      if (step % 4 === 2) this.noise(0.1, 0.25, 4000, 1500, 'highpass', 0, gain);
      if (step % 8 === 0) this.tone(70, 40, 0.15, 'sine', 0.6, 0, gain);
    }, 150);
    return { name, synth: true, gain, stop: () => {
      window.clearInterval(timer);
      gain.disconnect();
    } };
  }
}

export const sfx = new SoundEngine();

/**
 * iPhones ignore the web vibration API, so in the iOS app feedback goes through the Taptic Engine
 * (Capacitor Haptics). Short taps map to light/medium/heavy impacts; patterns become a success buzz.
 */
export const haptic = (pattern: number | number[]): void => {
  if (!sfx.vibration) return;
  if (Capacitor.getPlatform() === 'ios') {
    if (Array.isArray(pattern)) void Haptics.notification({ type: NotificationType.Success });
    else void Haptics.impact({ style: pattern < 15 ? ImpactStyle.Light : pattern < 30 ? ImpactStyle.Medium : ImpactStyle.Heavy });
    return;
  }
  if ('vibrate' in navigator) navigator.vibrate(pattern);
};
