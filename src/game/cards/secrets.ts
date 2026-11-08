import { z } from "zod";

export const secretConditionKeys = [
  "CARRIED_ELEMENTS_SAME_TYPE",
  "CARRIED_ELEMENTS_DISTINCT_TYPES",
  "CARRIED_BLACK_MIRRORS",
  "CARRIED_WHITE_MIRRORS",
  "CARRIED_EQUIPMENT_COUNT",
  "ACCESSIBLE_DISTINCT_TOOLS",
  "EQUIPPED_RELICS_COUNT",
  "LEARNED_SPELLS_COUNT",
  "LEARNED_SPELLS_SAME_PRINTED_LEVEL",
  "ATTACHED_COMPANIONS_COUNT",
  "UNREVEALED_SECRETS_COUNT",
  "ALL_FIVE_ELEMENTS_CARRIED",
  "MIXED_MIRROR_COLLECTION",
  "PERMANENT_SIGILS_DISTINCT_COLORS",
  "LOYAL_STRAY_AND_RELIC",
] as const;
export const spellTiers = ["Basic", "Intermediate", "Advanced"] as const;
export type SpellTier = (typeof spellTiers)[number];
export const secretSchema = z.object({
  id: z.string().regex(/^SE-(0[1-9]|1[0-5])$/),
  name: z.string().min(1),
  family: z.literal("Secret"),
  subtype: z.literal("SECRET_ACHIEVEMENT"),
  effect: z.string().min(1),
  condition: z.object({
    type: z.enum(secretConditionKeys),
    minimumCount: z.number().int().positive(),
  }),
  reward: z.union([
    z.object({
      type: z.literal("COURAGE"),
      amount: z.number().int().positive(),
    }),
    z.object({
      type: z.literal("COURAGE"),
      byTier: z.object({
        Basic: z.literal(2),
        Intermediate: z.literal(4),
        Advanced: z.literal(6),
      }),
    }),
  ]),
  status: z.literal("ACTIVE"),
  version: z.literal("0.5"),
});
export type SecretCard = z.infer<typeof secretSchema>;
const define = (
  n: number,
  name: string,
  effect: string,
  type: SecretCard["condition"]["type"],
  minimumCount: number,
  amount: number,
): SecretCard => ({
  id: `SE-${String(n).padStart(2, "0")}`,
  name,
  family: "Secret",
  subtype: "SECRET_ACHIEVEMENT",
  effect,
  condition: { type, minimumCount },
  reward: amount
    ? { type: "COURAGE", amount }
    : { type: "COURAGE", byTier: { Basic: 2, Intermediate: 4, Advanced: 6 } },
  status: "ACTIVE",
  version: "0.5",
});
export const secrets = z
  .array(secretSchema)
  .length(15)
  .parse([
    define(
      1,
      "Four of a Kind",
      "Carry at least 4 physical Elements of the same type simultaneously.",
      "CARRIED_ELEMENTS_SAME_TYPE",
      4,
      4,
    ),
    define(
      2,
      "Elemental Harmony",
      "Carry at least 4 different physical Element types simultaneously.",
      "CARRIED_ELEMENTS_DISTINCT_TYPES",
      4,
      3,
    ),
    define(
      3,
      "Collector of Shadows",
      "Carry at least 3 Black Mirror cards simultaneously.",
      "CARRIED_BLACK_MIRRORS",
      3,
      3,
    ),
    define(
      4,
      "The Witches' Collection",
      "Carry at least 3 White Mirror cards simultaneously.",
      "CARRIED_WHITE_MIRRORS",
      3,
      3,
    ),
    define(
      5,
      "Master of Equipment",
      "Carry at least 3 Equipment cards simultaneously. Tools and Relics do not count.",
      "CARRIED_EQUIPMENT_COUNT",
      3,
      4,
    ),
    define(
      6,
      "The Master Craftsman",
      "Have access to at least 3 different Tool cards in your inventory and/or your current room.",
      "ACCESSIBLE_DISTINCT_TOOLS",
      3,
      4,
    ),
    define(
      7,
      "Treasures of the Castle",
      "Have at least 2 Relics equipped simultaneously.",
      "EQUIPPED_RELICS_COUNT",
      2,
      4,
    ),
    define(
      8,
      "The Grand Scholar",
      "Have at least 4 Spells learned in your Knowledge slots simultaneously.",
      "LEARNED_SPELLS_COUNT",
      4,
      5,
    ),
    define(
      9,
      "Master of Incantations",
      "Have at least 3 learned Spells of the same printed tier: Basic grants +2 Courage, Intermediate +4, or Advanced +6. Discounts do not change printed tiers.",
      "LEARNED_SPELLS_SAME_PRINTED_LEVEL",
      3,
      0,
    ),
    define(
      10,
      "The Unlikely Fellowship",
      "Have at least 3 Companions attached simultaneously. Loyal and Stray Companions both count.",
      "ATTACHED_COMPANIONS_COUNT",
      3,
      3,
    ),
    define(
      11,
      "Keeper of Whispers",
      "Hold at least 4 unrevealed Secrets, including this card. Completed Secrets do not count.",
      "UNREVEALED_SECRETS_COUNT",
      4,
      5,
    ),
    define(
      12,
      "The Fifth Essence",
      "Carry all 5 physical Element types: Air, Water, Earth, Fire and Aether.",
      "ALL_FIVE_ELEMENTS_CARRIED",
      5,
      5,
    ),
    define(
      13,
      "Mirror Convergence",
      "Carry at least 3 Mirror cards, including at least 1 Black and 1 White Mirror.",
      "MIXED_MIRROR_COLLECTION",
      3,
      3,
    ),
    define(
      14,
      "The Runic Trinity",
      "Have at least 3 different colors of Mirror Sigils permanently assigned across your currently learned Spells. Free and Quick Sigils do not count.",
      "PERMANENT_SIGILS_DISTINCT_COLORS",
      3,
      4,
    ),
    define(
      15,
      "An Unusual Fellowship",
      "Have at least 1 Loyal Companion, 1 Stray Companion and 1 equipped Relic simultaneously.",
      "LOYAL_STRAY_AND_RELIC",
      3,
      4,
    ),
  ]);
export const secretById: Record<string, SecretCard> = Object.fromEntries(
  secrets.map((c) => [c.id, c]),
);
if (new Set(secrets.map((c) => c.id)).size !== 15)
  throw Error("Secret catalog must have 15 unique IDs.");
export const secretRewardText = (card: SecretCard) =>
  "amount" in card.reward
    ? `+${card.reward.amount} Courage`
    : "+2 / +4 / +6 Courage";
