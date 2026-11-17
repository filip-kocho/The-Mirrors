import type { Command, State } from "../game/domain/engine";
import { companionSounds } from "./effectClips";

export type SoundName =
  | "step"
  | "arrival"
  | "shatter"
  | "discovery"
  | "glass"
  | "magic"
  | "learn"
  | "secret"
  | "dog"
  | "cat"
  | "crow"
  | "rat"
  | "ghost"
  | "witch"
  | "snake"
  | "spider"
  | "plant"
  | "object"
  | "victory"
  | "defeat";
export interface SoundCue {
  name: SoundName;
  delay: number;
}
/** Presentation-only cues from successful commands; loading/inspecting never replays events. */
export function gameSounds(
  before: State,
  after: State,
  command: Command,
): SoundCue[] {
  if (before.privacy || after.privacy || command.type === "REVEAL") return [];
  if (after.outcome !== before.outcome && after.outcome !== "playing")
    return [
      { name: after.outcome === "victory" ? "victory" : "defeat", delay: 0 },
    ];
  const cues: SoundCue[] = [];
  const visibleTokens = (state: State) => [
    ...state.players.flatMap((player) => [
      ...player.inventory,
      ...player.companions,
    ]),
    ...Object.values(state.rooms).flatMap((room) => room.objects),
    ...state.removed,
  ];
  const known = new Set(visibleTokens(before).map((token) => token.id));
  const discoveries = visibleTokens(after).filter(
    (token) => !known.has(token.id),
  );
  const animalCues = new Set<SoundName>();
  for (const token of discoveries) {
    if (token.kind === "Companion" && companionSounds[token.card!])
      animalCues.add(companionSounds[token.card!]);
  }
  let discoveryDelay = 1.8;
  for (const name of animalCues) {
    cues.push({ name, delay: discoveryDelay });
    discoveryDelay += 0.8;
  }
  if (
    after.players.some((player, index) =>
      player.secrets.some((id) => !before.players[index].secrets.includes(id)),
    ) ||
    command.type === "REVEAL_SECRET"
  )
    cues.push({
      name: "secret",
      delay: command.type === "REVEAL_SECRET" ? 0 : discoveryDelay,
    });
  if (command.type === "LEARN") cues.push({ name: "learn", delay: 0 });
  const moved = after.players.some((p, i) => p.room !== before.players[i].room);
  const steps = moved
    ? command.type === "MOVE"
      ? Math.min(command.path.length - 1, 8)
      : 2
    : 0;
  for (let i = 0; i < steps; i++) cues.push({ name: "step", delay: i * 0.24 });
  if (after.occuldor !== before.occuldor && after.occuldor !== "Hall")
    cues.push({ name: "arrival", delay: 0.15 });
  if (
    Object.values(after.rooms).some(
      (r) => r.pair.length === 2 && before.rooms[r.id].pair.length !== 2,
    )
  ) {
    cues.push({ name: "object", delay: 0 }, { name: "discovery", delay: 1.7 });
  }
  if (
    Object.values(after.rooms).filter((r) => r.restored).length >
    Object.values(before.rooms).filter((r) => r.restored).length
  )
    cues.push({ name: "shatter", delay: 0 });
  if (
    Object.values(after.rooms).some(
      (r) => r.explored && !before.rooms[r.id].explored,
    )
  )
    cues.push({ name: "discovery", delay: steps * 0.24 });
  if (
    command.type === "PLACE" ||
    (command.type === "MAGIC" &&
      ["INSTALL_GEM", "INSTALL_WILD"].includes(command.action))
  )
    cues.push({ name: "glass", delay: 0 });
  if (["CAST_SPELL", "USE_COMPANION", "USE_ITEM"].includes(command.type))
    cues.push({ name: "magic", delay: 0 });
  if (["TRANSFER", "LEAVE_SPELL", "RECRUIT"].includes(command.type))
    cues.push({ name: "object", delay: 0 });
  return cues;
}
const listeners = new Set<(cues: SoundCue[]) => void>();
export function subscribeSounds(listener: (cues: SoundCue[]) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function emitGameSounds(before: State, after: State, command: Command) {
  // Audio failure must never turn a valid move into an apparent game error.
  try {
    const cues = gameSounds(before, after, command);
    listeners.forEach((fn) => {
      try {
        fn(cues);
      } catch {}
    });
  } catch {}
}
