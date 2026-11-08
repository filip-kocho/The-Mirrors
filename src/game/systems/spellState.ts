import { z } from "zod";
import { colors } from "../cards/catalog";
export const physicalSigilSchema = z.object({
  id: z.string(),
  color: z.enum([...colors, "Wild"]),
  socket: z.number().int().min(0).optional(),
});
export type PhysicalSigil = z.infer<typeof physicalSigilSchema>;
export const spellStateSchema = z
  .object({
    version: z.number().int().default(4),
    portalOffer: z
      .object({ owner: z.string(), turn: z.number().int() })
      .nullable()
      .default(null),
    consent: z
      .object({
        owner: z.string(),
        hero: z.string(),
        spell: z.string(),
        action: z.number().int(),
        sigilIds: z.array(z.string()),
        targets: z.array(z.string()),
        turn: z.number().int(),
      })
      .nullable()
      .default(null),
    identityReady: z.boolean().default(false),
    nextId: z.number().int().positive().default(1),
    availableIds: z.record(z.string(), z.array(z.string())).default({}),
    permanentIds: z.record(z.string(), z.array(z.string())).default({}),
    spentIds: z.array(z.string()).default([]),
    quick: z
      .array(
        z.object({
          id: z.string(),
          owner: z.string(),
          spell: z.string(),
          action: z.number().int(),
          turn: z.number().int(),
          sigils: z.array(physicalSigilSchema),
        }),
      )
      .default([]),
    usage: z.record(z.string(), z.number().int()).default({}),
    buffs: z
      .array(
        z.object({
          owner: z.string(),
          spell: z.string(),
          kind: z.enum(["SHIELD", "CURSE_SHIELD", "CALM", "RANGE"]),
          amount: z.number(),
          turn: z.number().int(),
        }),
      )
      .default([]),
    exploredTurn: z.record(z.string(), z.number().int()).default({}),
    afterCurse: z
      .object({ owner: z.string(), turn: z.number().int() })
      .nullable()
      .default(null),
    visions: z.record(z.string(), z.array(z.string())).default({}),
    publicColors: z.array(z.string()).default([]),
  })
  .default(() => ({
    version: 4,
    portalOffer: null,
    consent: null,
    identityReady: false,
    nextId: 1,
    availableIds: {},
    permanentIds: {},
    spentIds: [],
    quick: [],
    usage: {},
    buffs: [],
    exploredTurn: {},
    afterCurse: null,
    visions: {},
    publicColors: [],
  }));
