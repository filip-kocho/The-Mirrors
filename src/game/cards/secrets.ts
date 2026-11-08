import { z } from "zod";
export const spellTiers = ["Basic", "Intermediate", "Advanced"] as const;
export type SpellTier = (typeof spellTiers)[number];
export const secretConditionKeys = [
  "ELEMENT_PAIR",
  "ELEMENT_TYPES",
  "MIRROR_BALANCE",
  "MATCHING_MIRRORS",
  "CRAFTSMAN",
  "RELICS",
  "SPELLS",
  "COMPANIONS",
  "SECRETS",
  "COLORED_SIGILS",
] as const;
export const secretSchema = z.object({
  id: z.string().regex(/^SE-(0[1-9]|1[0-5])$/),
  name: z.string(),
  family: z.literal("Secret"),
  subtype: z.enum(["DIAMOND_CHALLENGE", "HEROIC_ACHIEVEMENT"]),
  effect: z.string(),
  condition: z.object({
    type: z.enum(secretConditionKeys),
    minimumCount: z.number().int().positive(),
  }),
  reward: z.object({
    type: z.enum(["DIAMOND_GEM", "COURAGE"]),
    amount: z.number().int().positive(),
  }),
  status: z.literal("ACTIVE"),
  version: z.literal("0.6"),
});
export type SecretCard = z.infer<typeof secretSchema>;
const data: [string, SecretCard["condition"]["type"], number, string][] = [
  [
    "Elemental Pair",
    "ELEMENT_PAIR",
    2,
    "Carry at least 2 physical Elements of the same type.",
  ],
  [
    "Elemental Harmony",
    "ELEMENT_TYPES",
    3,
    "Carry at least 3 different physical Element types.",
  ],
  [
    "Mirror Balance",
    "MIRROR_BALANCE",
    2,
    "Carry at least 1 White Mirror and 1 Black Mirror.",
  ],
  [
    "Twin Reflections",
    "MATCHING_MIRRORS",
    2,
    "Carry at least 2 Mirrors of the same type.",
  ],
  [
    "Craftsman's Hands",
    "CRAFTSMAN",
    2,
    "Carry at least 1 Equipment card and 1 Tool card.",
  ],
  [
    "Relic Hunter",
    "RELICS",
    1,
    "Have at least 1 Relic equipped in a valid Relic slot.",
  ],
  [
    "Apprentice Magician",
    "SPELLS",
    2,
    "Have at least 2 learned Spells in unlocked Knowledge slots.",
  ],
  [
    "Unexpected Company",
    "COMPANIONS",
    2,
    "Have at least 2 attached Companions. Linked Twins count as two cards.",
  ],
  [
    "Keeper of Whispers",
    "SECRETS",
    2,
    "Hold at least 2 unrevealed Secrets, including this card.",
  ],
  [
    "Sigil Harmony",
    "COLORED_SIGILS",
    2,
    "Have at least 2 available colored Sigils of different colors. Wild, Quick-assigned and bound Sigils do not count.",
  ],
  [
    "Four of a Kind",
    "ELEMENT_PAIR",
    4,
    "Carry at least 4 physical Elements of the same type.",
  ],
  [
    "The Fifth Essence",
    "ELEMENT_TYPES",
    5,
    "Carry all five physical Element types simultaneously.",
  ],
  [
    "Master of Reflections",
    "MATCHING_MIRRORS",
    3,
    "Carry at least 3 White Mirrors or at least 3 Black Mirrors.",
  ],
  [
    "Treasures of the Castle",
    "RELICS",
    2,
    "Have at least 2 Relics equipped in valid Relic slots.",
  ],
  [
    "The Grand Scholar",
    "SPELLS",
    4,
    "Have 4 learned Spells in unlocked Knowledge slots.",
  ],
];
export const secrets = data.map(([name, type, minimumCount, effect], i) =>
  secretSchema.parse({
    id: `SE-${String(i + 1).padStart(2, "0")}`,
    name,
    family: "Secret",
    subtype: i < 10 ? "DIAMOND_CHALLENGE" : "HEROIC_ACHIEVEMENT",
    effect,
    condition: { type, minimumCount },
    reward: {
      type: i < 10 ? "DIAMOND_GEM" : "COURAGE",
      amount: i < 10 ? 1 : 5,
    },
    status: "ACTIVE",
    version: "0.6",
  }),
);
export const secretById: Record<string, SecretCard> = Object.fromEntries(
  secrets.map((c) => [c.id, c]),
);
export const secretRewardText = (card: SecretCard) =>
  card.reward.type === "DIAMOND_GEM" ? "1 Diamond Gem" : "+5 Courage";
