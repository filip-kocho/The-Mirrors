import { companionById } from "./companions";
import revisedSpells from "./spells-v04.json";
import { z } from "zod";
import source from "../../../reference/The_Mirrors_Conceptual_Card_Catalog_v0.2.json";
import { itemById } from "./items";
import { blackMirrorById } from "./blackMirrors";
import { secretById } from "./secrets";
export const colors = [
  "Scarlet",
  "Emerald",
  "Amber",
  "Fuchsia",
  "Amethyst",
] as const;
export const elements = ["Air", "Earth", "Fire", "Water", "Aether"] as const;
export const cardSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    family: z.enum([
      "White Mirror",
      "Black Mirror",
      "Item",
      "Spell",
      "Companion",
      "Secret",
    ]),
    subtype: z.string(),
    effect: z.string().optional(),
    slots: z
      .array(z.enum(["Spell", "Item", "Companion", "Secret", "Empty"]))
      .optional(),
    learn_elements: z.array(z.enum(elements)).optional(),
    casting_modes: z
      .array(
        z.object({
          name: z.string(),
          sigil_slots: z.array(z.enum(colors)),
          effect: z.string(),
          assignment: z.string(),
        }),
      )
      .optional(),
  })
  .passthrough();
export type Card = z.infer<typeof cardSchema>;
export const cards = z.array(cardSchema).parse(
  Object.values(source.cards)
    .flat()
    .map(
      (card) =>
        secretById[card.id] ??
        revisedSpells.find((spell) => spell.id === card.id) ?? {
          ...card,
          ...(blackMirrorById[card.id] ?? {}),
          ...(itemById[card.id] ?? {}),
          ...(companionById[card.id] ? { ...companionById[card.id], subtype: "Companion", conflict: undefined } : {}),
        },
    ),
);
export const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
export function validateCatalog() {
  const require = (ok: boolean, message: string) => {
    if (!ok) throw Error(message);
  };
  require(cards.length === 155 &&
    new Set(cards.map((c) => c.id)).size === 155, "155 unique cards required");
  for (const [family, count] of Object.entries(source.metadata.families))
    require(cards.filter((c) => c.family === family).length ===
      count, `${family} count`);
  const whites = cards.filter((c) => c.family === "White Mirror");
  for (const [symbol, count] of Object.entries({
    Spell: 35,
    Item: 25,
    Companion: 10,
    Secret: 15,
    Empty: 20,
  }))
    require(whites.flatMap((c) => c.slots!).filter((s) => s === symbol)
      .length === count, `${symbol} discoveries`);
  require(whites.every(
    (c) =>
      c.slots?.length === 3 &&
      new Set(c.slots).size > 1 &&
      c.slots.filter((s) => s === "Companion").length <= 1,
  ), "White patterns");
  for (const el of elements)
    require(cards.flatMap((c) => c.learn_elements ?? []).filter((e) => e === el)
      .length === 14, `${el} learning economy`);
  require(cards
    .flatMap((c) => c.casting_modes ?? [])
    .reduce((n, m) => n + m.sigil_slots.length, 0) === 132, "Sigil sockets");
  for (const [subtype, count] of Object.entries({
    Equipment: 10,
    Tool: 9,
    Relic: 6,
    Basic: 16,
    Intermediate: 11,
    Advanced: 8,
  }))
    require(cards.filter((c) => c.subtype === subtype).length ===
      count, `${subtype} count`);
  return true;
}
validateCatalog();
