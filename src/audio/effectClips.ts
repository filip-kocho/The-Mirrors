import type { SoundName } from "./gameSounds";

/** Downloaded CC0 recordings. Provenance and original filenames: /audio/sfx/CREDITS.md. */
export const effectClips: Record<
  SoundName,
  { label: string; files: string[]; gain: number }
> = {
  step: {
    label: "Stone footsteps",
    files: ["step-1.ogg", "step-2.ogg", "step-3.ogg"],
    gain: 0.65,
  },
  arrival: {
    label: "Occuldor's evil laugh",
    files: ["arrival.ogg"],
    gain: 0.85,
  },
  shatter: { label: "Breaking mirrors", files: ["shatter.wav"], gain: 0.6 },
  discovery: { label: "Room discovery", files: ["discovery.ogg"], gain: 0.6 },
  glass: { label: "Sigil and gem placement", files: ["glass.ogg"], gain: 0.6 },
  magic: { label: "Spell casting", files: ["magic.ogg"], gain: 0.7 },
  learn: { label: "Learning a spell", files: ["learn.ogg"], gain: 0.7 },
  secret: { label: "Secret parchment", files: ["secret.ogg"], gain: 0.75 },
  object: { label: "Object handling", files: ["object.ogg"], gain: 0.55 },
  dog: { label: "Rex — bark", files: ["dog.ogg"], gain: 0.65 },
  cat: { label: "Alexis — meow", files: ["cat.wav"], gain: 0.8 },
  crow: { label: "Poe — corvid call", files: ["crow.ogg"], gain: 0.65 },
  rat: { label: "Roderick — creature squeak", files: ["rat.ogg"], gain: 0.55 },
  ghost: {
    label: "Ghost twins — spectral howl",
    files: ["ghost.ogg"],
    gain: 0.5,
  },
  witch: { label: "Mad Mara — eerie voice", files: ["witch.ogg"], gain: 0.55 },
  snake: { label: "Mamba — breath", files: ["snake.ogg"], gain: 0.6 },
  spider: {
    label: "Clementine — creature rustle",
    files: ["spider.ogg"],
    gain: 0.55,
  },
  plant: { label: "Julia — feeding snap", files: ["plant.ogg"], gain: 0.6 },
  victory: { label: "Victory", files: ["victory.ogg"], gain: 0.7 },
  defeat: { label: "Defeat", files: ["defeat.ogg"], gain: 0.6 },
};

export const companionSounds: Record<string, SoundName> = {
  "CO-01": "dog",
  "CO-02": "cat",
  "CO-03": "crow",
  "CO-04": "rat",
  "CO-05": "ghost",
  "CO-06": "ghost",
  "CO-07": "witch",
  "CO-08": "snake",
  "CO-09": "spider",
  "CO-10": "plant",
};
