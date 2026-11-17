import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/domain/engine";
import {
  gameSounds,
  emitGameSounds,
  subscribeSounds,
} from "../src/audio/gameSounds";
import { readAudioSettings, defaultAudio } from "../src/audio/soundscape";

describe("presentation sound cues", () => {
  it("plays species-specific sounds only for newly discovered companions", () => {
    const before = initialState(["A", "B"], "sounds"),
      after = structuredClone(before);
    after.players[0].companions.push({
      id: "rex",
      card: "CO-01",
      kind: "Companion",
    });
    after.rooms.R01.objects.push({
      id: "poe",
      card: "CO-03",
      kind: "Companion",
    });
    const command = { type: "COLLIDE" as const, playerId: "P1" };
    expect(gameSounds(before, after, command).map((cue) => cue.name)).toEqual([
      "dog",
      "crow",
    ]);
    const moved = structuredClone(after);
    moved.players[0].companions = [];
    moved.rooms.R01.objects.push(after.players[0].companions[0]);
    expect(gameSounds(after, moved, command)).toEqual([]);
  });
  it("uses a generic parchment cue without exposing which Secret was found", () => {
    const before = initialState(["A", "B"], "sounds"),
      after = structuredClone(before);
    after.players[0].secrets.push("SE-01");
    const command = { type: "COLLIDE" as const, playerId: "P1" };
    expect(gameSounds(before, after, command)).toEqual([
      { name: "secret", delay: 1.8 },
    ]);
    after.privacy = true;
    expect(gameSounds(before, after, command)).toEqual([]);
  });
  it("matches footsteps to the actual move and delays discovery until arrival", () => {
    const before = initialState(["A", "B"], "sounds"),
      after = structuredClone(before);
    after.players[0].room = "R02";
    after.rooms.R02.explored = true;
    const cues = gameSounds(before, after, {
      type: "MOVE",
      playerId: "P1",
      path: ["Hall", "R01", "R02"],
    });
    expect(cues.filter((c) => c.name === "step")).toEqual([
      { name: "step", delay: 0 },
      { name: "step", delay: 0.24 },
    ]);
    expect(cues.find((c) => c.name === "discovery")?.delay).toBe(0.48);
  });
  it("plays arrival and collision only on corresponding state changes", () => {
    const before = initialState(["A", "B"], "sounds"),
      after = structuredClone(before);
    const command = { type: "COLLIDE" as const, playerId: "P1" };
    expect(gameSounds(before, after, command)).toEqual([]);
    after.occuldor = "R01";
    expect(gameSounds(before, after, command).map((c) => c.name)).toContain(
      "arrival",
    );
    after.rooms.R02.restored = true;
    expect(gameSounds(before, after, command).map((c) => c.name)).toContain(
      "shatter",
    );
    after.occuldor = "Hall";
    expect(gameSounds(before, after, command).map((c) => c.name)).not.toContain(
      "arrival",
    );
  });
  it("does not reveal hidden colors or replay during handoff", () => {
    const before = initialState(["A", "B"], "sounds"),
      after = structuredClone(before);
    after.spells.visions.P1 = ["R01"];
    const command = {
      type: "USE_COMPANION" as const,
      playerId: "P1",
      card: "CO-03",
      ids: ["R01"],
    };
    expect(gameSounds(before, after, command)).toEqual([
      { name: "magic", delay: 0 },
    ]);
    after.privacy = true;
    expect(gameSounds(before, after, command)).toEqual([]);
    expect(
      gameSounds(before, before, { type: "REVEAL", playerId: "P1" }),
    ).toEqual([]);
  });
  it("prioritizes game endings and isolates failing audio subscribers", () => {
    const before = initialState(["A", "B"], "sounds"),
      after = structuredClone(before);
    after.outcome = "victory";
    expect(
      gameSounds(before, after, { type: "PLACE", playerId: "P1", cell: 0 }),
    ).toEqual([{ name: "victory", delay: 0 }]);
    let heard = false;
    const a = subscribeSounds(() => {
      throw Error("no audio device");
    });
    const b = subscribeSounds(() => {
      heard = true;
    });
    expect(() =>
      emitGameSounds(before, after, { type: "PLACE", playerId: "P1", cell: 0 }),
    ).not.toThrow();
    expect(heard).toBe(true);
    a();
    b();
  });
  it("defaults to opt-in audio and validates saved volume controls", () => {
    expect(readAudioSettings(null)).toEqual(defaultAudio);
    expect(readAudioSettings("broken")).toEqual(defaultAudio);
    expect(
      readAudioSettings('{"enabled":true,"music":3,"effects":-4}'),
    ).toEqual({
      enabled: true,
      music: 1,
      effects: 0,
      track: defaultAudio.track,
    });
    expect(readAudioSettings('{"enabled":true,"music":"loud"}').music).toBe(
      defaultAudio.music,
    );
  });
});
