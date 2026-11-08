import { z } from "zod";
export const itemRulesSchema = z.object({
  airStacking: z.enum(["MAX", "SUM"]).default("MAX"),
  allowSelfDiscard: z.boolean().default(false),
  whistleRequiresCompanion: z.boolean().default(true),
  compassArrivalPunishes: z.boolean().default(true),
  pairReward: z.enum(["PAIR", "MIRROR"]).default("PAIR"),
  permanentReward: z.enum(["SIGIL", "ACTION"]).default("SIGIL"),
  preserveLegacyToolIds: z.boolean().default(true),
  conflictDestination: z
    .enum(["FIRST_EXPLORED_OR_STAY", "STAY"])
    .default("FIRST_EXPLORED_OR_STAY"),
  companionConflicts: z.boolean().default(true),
});
export const defaultItemRules = itemRulesSchema.parse({});
export const itemStateSchema = z
  .object({
    round: z.number().int().positive().default(1),
    used: z
      .record(z.string(), z.record(z.string(), z.number().int().positive()))
      .default({}),
    boots: z.record(z.string(), z.number().int().min(0).max(3)).default({}),
    restrictions: z
      .record(
        z.string(),
        z.object({
          mirrors: z.string().optional(),
          companions: z.string().optional(),
        }),
      )
      .default({}),
  })
  .default(() => ({ round: 1, used: {}, boots: {}, restrictions: {} }));
