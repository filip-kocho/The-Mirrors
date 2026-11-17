import { effectClips } from "./effectClips";
import { musicTracks } from "./musicTracks";
import type { SoundCue, SoundName } from "./gameSounds";

export interface AudioSettings {
  enabled: boolean;
  track: string;
  music: number;
  effects: number;
}
export const defaultAudio: AudioSettings = {
  enabled: false,
  track: musicTracks[0].id,
  music: 0.28,
  effects: 0.55,
};
export const audioSettingsKey = "the-mirrors-audio-v1";
export function readAudioSettings(raw: string | null): AudioSettings {
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || typeof value.enabled !== "boolean")
      return { ...defaultAudio };
    const level = (n: unknown, fallback: number) =>
      typeof n === "number" && Number.isFinite(n)
        ? Math.max(0, Math.min(1, n))
        : fallback;
    return {
      enabled: value.enabled,
      track: musicTracks.some((track) => track.id === value.track)
        ? value.track
        : defaultAudio.track,
      music: level(value.music, defaultAudio.music),
      effects: level(value.effects, defaultAudio.effects),
    };
  } catch {
    return { ...defaultAudio };
  }
}

/** Locally hosted recorded music with independent downloaded game effects. */
export class MirrorSoundscape {
  private context: AudioContext | null = null;
  private music: GainNode | null = null;
  private effects: GainNode | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  private settings = { ...defaultAudio };
  private paused = false;
  private disposed = false;
  private effectBuffers = new Map<string, Promise<AudioBuffer>>();
  private variation = new Map<SoundName, number>();
  private playbackEpoch = 0;
  constructor(private onError: (message: string) => void = () => {}) {}

  async unlock() {
    if (this.disposed) return;
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      const master = context.createGain(),
        limiter = context.createDynamicsCompressor();
      master.gain.value = 0.65;
      limiter.threshold.value = -12;
      limiter.knee.value = 18;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.3;
      master.connect(limiter).connect(context.destination);
      this.music = context.createGain();
      this.effects = context.createGain();
      this.music.connect(master);
      this.effects.connect(master);
      // A quiet, decaying stone-hall impulse; the dry signal remains intelligible.
      const reverb = context.createConvolver(),
        wet = context.createGain();
      const impulse = context.createBuffer(
        2,
        context.sampleRate * 2.8,
        context.sampleRate,
      );
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < data.length; i++)
          data[i] =
            (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3) * 0.35;
      }
      reverb.buffer = impulse;
      wet.gain.value = 0.25;
      this.musicElement = new Audio();
      this.musicElement.preload = "none";
      this.musicElement.loop = true;
      context.createMediaElementSource(this.musicElement).connect(this.music);
      this.effects.connect(reverb);
      reverb.connect(wet).connect(master);
    }
    this.setSettings(this.settings);
    if (this.settings.enabled && !this.paused) {
      await this.context.resume();
      await this.startMusic();
      void Promise.allSettled(
        Object.values(effectClips).flatMap((clip) =>
          clip.files.map((file) => this.loadClip(file)),
        ),
      );
    }
  }
  setSettings(settings: AudioSettings) {
    if (settings.effects === 0 && this.settings.effects !== 0)
      this.stopEffects();
    this.settings = settings;
    const track =
      musicTracks.find((track) => track.id === settings.track) ??
      musicTracks[0];
    if (
      this.musicElement &&
      this.musicElement.getAttribute("src") !== track.src
    ) {
      this.musicElement.pause();
      this.musicElement.src = track.src;
    }
    const c = this.context;
    if (!c) return;
    this.music!.gain.setTargetAtTime(
      settings.enabled ? settings.music : 0,
      c.currentTime,
      0.06,
    );
    this.effects!.gain.setTargetAtTime(
      settings.enabled ? settings.effects : 0,
      c.currentTime,
      0.03,
    );
    if (!settings.enabled) {
      this.stop();
      void c.suspend().catch(() => {});
    } else if (settings.music === 0) {
      this.musicElement?.pause();
    }
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) {
      this.stop();
      void this.context?.suspend().catch(() => {});
    } else if (this.settings.enabled && this.context)
      void this.unlock().catch(() => {});
  }
  private stop() {
    this.musicElement?.pause();
    this.stopEffects();
  }
  private stopEffects() {
    this.playbackEpoch++;
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {}
    }
    this.voices.clear();
  }
  dispose() {
    this.disposed = true;
    this.stop();
    this.musicElement?.removeAttribute("src");
    this.musicElement?.load();
    void this.context?.close().catch(() => {});
  }
  private track(
    source: AudioScheduledSourceNode,
    nodes: AudioNode[],
    start: number,
    duration: number,
  ) {
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      nodes.forEach((n) => n.disconnect());
    };
    source.start(start);
    source.stop(start + duration);
  }
  private async startMusic() {
    if (
      !this.settings.enabled ||
      !this.settings.music ||
      this.paused ||
      this.disposed ||
      this.context?.state !== "running" ||
      !this.musicElement?.paused
    )
      return;
    try {
      await this.musicElement.play();
    } catch (error) {
      // Track switches, mute and handoff can cancel an outstanding play request.
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    }
  }
  private loadClip(file: string): Promise<AudioBuffer> {
    const cached = this.effectBuffers.get(file);
    if (cached) return cached;
    const context = this.context!;
    const request = fetch("/audio/sfx/" + file)
      .then((response) => {
        if (!response.ok) throw Error("Unable to load " + file);
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        // Balance quiet field recordings against louder designed effects.
        let peak = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          for (const sample of buffer.getChannelData(channel))
            peak = Math.max(peak, Math.abs(sample));
        }
        const scale = peak > 0 ? Math.min(4, 0.85 / peak) : 1;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const data = buffer.getChannelData(channel);
          for (let i = 0; i < data.length; i++) data[i] *= scale;
        }
        return buffer;
      })
      .catch((error) => {
        this.effectBuffers.delete(file);
        throw error;
      });
    this.effectBuffers.set(file, request);
    return request;
  }
  play(cues: SoundCue[]) {
    if (
      !this.settings.enabled ||
      !this.settings.effects ||
      this.paused ||
      this.disposed ||
      this.context?.state !== "running"
    )
      return;
    const context = this.context,
      epoch = this.playbackEpoch,
      now = context.currentTime;
    for (const { name, delay } of cues) {
      const clip = effectClips[name];
      const index = this.variation.get(name) ?? 0;
      this.variation.set(name, index + 1);
      void this.loadClip(clip.files[index % clip.files.length])
        .then((buffer) => {
          if (
            this.disposed ||
            epoch !== this.playbackEpoch ||
            this.paused ||
            !this.settings.enabled ||
            !this.settings.effects ||
            context.state !== "running" ||
            this.voices.size >= 24
          )
            return;
          const source = context.createBufferSource(),
            gain = context.createGain();
          source.buffer = buffer;
          gain.gain.value = clip.gain;
          source.connect(gain).connect(this.effects!);
          this.track(
            source,
            [gain],
            Math.max(context.currentTime, now + delay),
            buffer.duration,
          );
        })
        .catch(() =>
          this.onError(
            "A sound effect could not load. Try previewing it again.",
          ),
        );
    }
  }
}
