import { itemRulesSchema, defaultItemRules } from "../systems/itemState";
import { z } from "zod";
export const rulesSchema = z.object({
  spellPolicies: z
    .object({
      portalTokenSupply: z.number().int().min(0).default(10),
      unresolvedTools: z.enum(["BLOCK", "ELEMENTS_ONLY"]).default("BLOCK"),
      oneQuickPerSpellPerTurn: z.boolean().default(true),
      modePolicy: z
        .enum(["EXCLUSIVE_ACTIVE_MODE", "BOTH_ALLOWED"])
        .default("EXCLUSIVE_ACTIVE_MODE"),
      quickOnDeath: z.literal("DISCARD").default("DISCARD"),
    })
    .default(() => ({
      portalTokenSupply: 10,
      unresolvedTools: "BLOCK" as const,
      oneQuickPerSpellPerTurn: true,
      modePolicy: "EXCLUSIVE_ACTIVE_MODE" as const,
      quickOnDeath: "DISCARD" as const,
    })),
  itemPolicies: itemRulesSchema.default(defaultItemRules),
  blackMirrorPolicies: z
    .object({
      hexlockRemovalOrder: z.enum(["OLDEST", "NEWEST"]).default("OLDEST"),
      singlePortalPairing: z
        .enum(["JOIN_OLDEST", "NEW_PAIR"])
        .default("JOIN_OLDEST"),
      sealExpiryAfterDeath: z
        .literal("SURVIVING_HOLDER_OR_FIRST_SURVIVOR")
        .default("SURVIVING_HOLDER_OR_FIRST_SURVIVOR"),
      allowSkip: z.boolean().default(false),
      boundSigilsCountAsPossessed: z.boolean().default(true),
      forcedVisitsClearFear: z.boolean().default(true),
      recruitedLoyalChangesOwner: z.boolean().default(true),
      defaultCompanionBehavior: z.enum(["LOYAL", "STRAY"]).default("LOYAL"),
      insufficientTargets: z
        .literal("AVAILABLE_THEN_LOG")
        .default("AVAILABLE_THEN_LOG"),
      unvisitedMeaning: z.literal("CURRENT_HERO").default("CURRENT_HERO"),
      sealSafety: z
        .literal("ALL_ROOMS_CONNECTED")
        .default("ALL_ROOMS_CONNECTED"),
    })
    .default(
      () =>
        ({
          hexlockRemovalOrder: "OLDEST",
          singlePortalPairing: "JOIN_OLDEST",
          sealExpiryAfterDeath: "SURVIVING_HOLDER_OR_FIRST_SURVIVOR",
          allowSkip: false,
          boundSigilsCountAsPossessed: true,
          forcedVisitsClearFear: true,
          recruitedLoyalChangesOwner: true,
          defaultCompanionBehavior: "LOYAL",
          insufficientTargets: "AVAILABLE_THEN_LOG",
          unvisitedMeaning: "CURRENT_HERO",
          sealSafety: "ALL_ROOMS_CONNECTED",
        }) as const,
    ),
  startingCourage: z.number().int().min(1).max(35),
  movement: z.array(z.number().int().min(1).max(10)).length(5),
  onePairPlacementAndOneFlipPerTurn: z.boolean(),
  orderedKnowledge: z.boolean(),
  consumeLearningTool: z.boolean().default(false),
  confrontCost: z.number().int().min(0).max(10),
  arrivalLossByRage: z
    .tuple([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .default([1, 2, 3, 4, 5]),
});
export type GameRulesConfig = z.infer<typeof rulesSchema>;
export const defaultRules: GameRulesConfig = {
  spellPolicies: {
    portalTokenSupply: 10,
    unresolvedTools: "BLOCK",
    oneQuickPerSpellPerTurn: true,
    modePolicy: "EXCLUSIVE_ACTIVE_MODE",
    quickOnDeath: "DISCARD",
  },
  itemPolicies: defaultItemRules,
  blackMirrorPolicies: {
    hexlockRemovalOrder: "OLDEST",
    singlePortalPairing: "JOIN_OLDEST",
    sealExpiryAfterDeath: "SURVIVING_HOLDER_OR_FIRST_SURVIVOR",
    allowSkip: false,
    boundSigilsCountAsPossessed: true,
    forcedVisitsClearFear: true,
    recruitedLoyalChangesOwner: true,
    defaultCompanionBehavior: "LOYAL",
    insufficientTargets: "AVAILABLE_THEN_LOG",
    unvisitedMeaning: "CURRENT_HERO",
    sealSafety: "ALL_ROOMS_CONNECTED",
  },
  startingCourage: 18,
  movement: [1, 1, 2, 3, 3],
  onePairPlacementAndOneFlipPerTurn: false,
  orderedKnowledge: false,
  consumeLearningTool: false,
  confrontCost: 2,
  arrivalLossByRage: [1, 2, 3, 4, 5],
};
export const ruleStatus = {
  spellPolicies: "PROVISIONAL",
  itemPolicies: "PROVISIONAL",
  blackMirrorPolicies: "PROVISIONAL",
  startingCourage: "PROVISIONAL",
  movement: "PROVISIONAL",
  onePairPlacementAndOneFlipPerTurn: "PROVISIONAL",
  orderedKnowledge: "PROVISIONAL",
  consumeLearningTool: "PROVISIONAL",
  confrontCost: "PROVISIONAL",
  arrivalLossByRage: "CONFIRMED",
} as const;
export const occuldorArrivalLoss = (rage: number, rules: GameRulesConfig) =>
  rules.arrivalLossByRage[Math.max(0, Math.min(4, Math.floor(rage / 7)))];
export const tier = (c: number) =>
  ["Terrified", "Anxious", "Calm", "Confident", "Heroic"][
    Math.max(0, Math.min(4, Math.floor((c - 1) / 7)))
  ];
