"use client";
import { useEffect, useRef, useState } from "react";
import {
  MirrorSoundscape,
  audioSettingsKey,
  defaultAudio,
  readAudioSettings,
  type AudioSettings,
} from "../audio/soundscape";
import { subscribeSounds, type SoundName } from "../audio/gameSounds";
import { effectClips } from "../audio/effectClips";
import { musicTracks } from "../audio/musicTracks";

export function SoundControls() {
  const [settings, setSettings] = useState<AudioSettings>(defaultAudio);
  const [status, setStatus] = useState("Sound is off.");
  const [preview, setPreview] = useState<SoundName>("glass");
  const engine = useRef<MirrorSoundscape | null>(null);
  const current = useRef(settings);
  useEffect(() => {
    const audio = new MirrorSoundscape(setStatus);
    engine.current = audio;
    let saved = { ...defaultAudio };
    try {
      saved = readAudioSettings(localStorage.getItem(audioSettingsKey));
    } catch {}
    current.current = saved;
    setSettings(saved);
    audio.setSettings(saved);
    setStatus(
      saved.enabled ? "Click or press a key to start audio." : "Sound is off.",
    );
    const pause = () => audio.setPaused(document.hidden);
    pause();
    const unsubscribeSounds = subscribeSounds((cues) => audio.play(cues));
    const unlock = () => {
      if (!current.current.enabled) return;
      void audio
        .unlock()
        .then(() =>
          setStatus(
            "Sound enabled. Music continues between turns; pauses when this tab is hidden.",
          ),
        )
        .catch(() =>
          setStatus(
            "Audio unavailable in this browser. The game remains playable.",
          ),
        );
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", pause);
    return () => {
      unsubscribeSounds();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", pause);
      audio.dispose();
      engine.current = null;
    };
  }, []);
  const update = (next: AudioSettings) => {
    current.current = next;
    setSettings(next);
    try {
      localStorage.setItem(audioSettingsKey, JSON.stringify(next));
    } catch {}
    engine.current?.setSettings(next);
    if (next.enabled)
      void engine.current
        ?.unlock()
        .then(() =>
          setStatus(
            "Sound enabled. Music continues between turns; pauses when this tab is hidden.",
          ),
        )
        .catch(() =>
          setStatus(
            "Audio unavailable in this browser. The game remains playable.",
          ),
        );
    else setStatus("Sound is off.");
  };
  return (
    <details className="sound-controls">
      <summary aria-label="Sound settings">
        <span aria-hidden="true">{settings.enabled ? "♫" : "♩"}</span> Sound
      </summary>
      <section aria-label="Sound settings panel">
        <h3>Echoes of the castle</h3>
        <button
          aria-pressed={settings.enabled}
          onClick={() => update({ ...settings, enabled: !settings.enabled })}
        >
          {settings.enabled ? "Mute all sound" : "Enable sound"}
        </button>
        <label>
          Music track
          <select
            aria-label="Music track"
            value={settings.track}
            onChange={(e) => update({ ...settings, track: e.target.value })}
          >
            {musicTracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title}
              </option>
            ))}
          </select>
        </label>
        <p className="music-credit">
          <a
            href={
              musicTracks.find((track) => track.id === settings.track)?.source
            }
            target="_blank"
            rel="noreferrer"
          >
            {musicTracks.find((track) => track.id === settings.track)?.title}
          </a>{" "}
          by Kevin MacLeod (incompetech.com), licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
        <label>
          Ambient music <output>{Math.round(settings.music * 100)}%</output>
          <input
            aria-label="Ambient music volume"
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.music * 100)}
            onChange={(e) =>
              update({ ...settings, music: Number(e.target.value) / 100 })
            }
          />
        </label>
        <label>
          Sound effects <output>{Math.round(settings.effects * 100)}%</output>
          <input
            aria-label="Sound effects volume"
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.effects * 100)}
            onChange={(e) =>
              update({ ...settings, effects: Number(e.target.value) / 100 })
            }
          />
        </label>
        <label>
          Preview effect
          <select
            aria-label="Preview effect"
            value={preview}
            onChange={(event) => setPreview(event.target.value as SoundName)}
          >
            {Object.entries(effectClips).map(([name, clip]) => (
              <option key={name} value={name}>
                {clip.label}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!settings.enabled || settings.effects === 0}
          onClick={() => engine.current?.play([{ name: preview, delay: 0 }])}
        >
          Preview sound
        </button>
        <p className="music-credit">
          Downloaded effects: CC0.{" "}
          <a href="/audio/sfx/CREDITS.md" target="_blank" rel="noreferrer">
            Sources and credits
          </a>
          .
        </p>
        <p role="status">{status}</p>
      </section>
    </details>
  );
}
