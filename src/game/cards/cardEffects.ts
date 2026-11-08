import { cards } from "./catalog";
export type Effect =
  | { kind: "curse" }
  | { kind: "item" }
  | { kind: "achievement" }
  | { kind: "unimplemented"; text: string }
  | { kind: "discovery" };
// Explicit IDs, no interpretation of English text at runtime.
export const cardEffects: Record<string, Effect> = Object.fromEntries(
  cards.map((c) => [
    c.id,
    (c.family === "Black Mirror"
      ? { kind: "curse" }
      : c.family === "Item"
        ? { kind: "item" }
        : c.family === "Secret"
          ? { kind: "achievement" }
          : undefined) ??
      (c.family === "White Mirror"
        ? { kind: "discovery" }
        : {
            kind: "unimplemented",
            text:
              c.effect ??
              c.casting_modes
                ?.map((m) => `${m.name}: ${m.effect}`)
                .join("\n") ??
              "See printed card.",
          }),
  ]),
);
