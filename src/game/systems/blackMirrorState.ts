import { z } from "zod";
import { curseEffectSchema } from "../cards/blackMirrors";
const heroStatus = z.object({
  paralysis: z.array(z.string()).default([]),
  hexlocks: z
    .array(
      z.object({
        id: z.string(),
        category: z.enum(["ELEMENT", "ITEM", "MIRROR", "KNOWLEDGE"]),
        slot: z.enum(["elements", "items", "mirrors", "relics", "knowledge"]),
        index: z.number().int().optional(),
      }),
    )
    .default([]),
  fear: z.array(z.object({ id: z.string(), origin: z.string() })).default([]),
  immobilized: z.boolean().default(false),
  hexlockClearedRound: z.number().int().default(-1),
  fearClearedTurn: z.number().int().default(-1),
  visited: z.array(z.string()).default(["Hall"]),
});
export const blackMirrorStateSchema = z
  .object({
    nextId: z.number().int().positive().default(1),
    heroes: z.record(z.string(), heroStatus).default({}),
    rooms: z
      .record(
        z.string(),
        z.object({
          darkness: z.number().int().min(0),
          portal: z.boolean(),
          portalPair: z.string().optional(),
        }),
      )
      .default({}),
    thresholds: z.array(z.string()).default([]),
    revealed: z.array(z.string()).default([]),
    seals: z
      .array(
        z.object({
          id: z.string(),
          owner: z.string(),
          spell: z.string(),
          scope: z.enum(["QUICK", "PERMANENT", "ALL", "SPECIFIC_ACTION"]),
          action: z.number().int().optional(),
        }),
      )
      .default([]),
    bindings: z
      .record(
        z.string(),
        z.array(z.enum(["Scarlet", "Emerald", "Amber", "Fuchsia", "Amethyst"])),
      )
      .default({}),
    spentSigils: z
      .array(z.enum(["Scarlet", "Emerald", "Amber", "Fuchsia", "Amethyst"]))
      .default([]),
    resolution: z
      .object({
        id: z.string(),
        card: z.string(),
        hero: z.string(),
        origin: z.string(),
        phase: z.enum(["immediate", "after", "refresh", "item", "inventory"]),
        effects: z.array(curseEffectSchema),
        choice: z
          .object({
            id: z.string(),
            title: z.string(),
            kind: z.enum([
              "objects",
              "rooms",
              "corridors",
              "options",
              "tokens",
              "actions",
            ]),
            options: z.array(z.object({ id: z.string(), label: z.string() })),
            min: z.number().int(),
            max: z.number().int(),
          })
          .nullable()
          .default(null),
        endTurn: z.boolean().default(false),
        summary: z.array(z.string()).default([]),
      })
      .nullable()
      .default(null),
  })
  .default(() => ({
    nextId: 1,
    heroes: {},
    rooms: {},
    thresholds: [],
    revealed: [],
    seals: [],
    bindings: {},
    spentSigils: [],
    resolution: null,
  }));
export type BlackMirrorState = z.infer<typeof blackMirrorStateSchema>;
export const newHeroStatus = () => heroStatus.parse({});
