import { z } from "zod";
export type Category = "ELEMENT" | "ITEM" | "MIRROR" | "KNOWLEDGE";
export type Scope = "QUICK" | "PERMANENT" | "ALL" | "SPECIFIC_ACTION";
export type CurseEffect =
  | {
      op: "LOSS";
      amount: number | "COLORS" | "DUPLICATES" | "COMPANY" | "ELEMENT_TYPES";
      unpreventable?: boolean;
    }
  | { op: "TOKEN"; token: "PARALYSIS" | "FEAR"; count: number }
  | {
      op: "DROP";
      category: Category;
      count: number | "all";
      locks: number | "actual";
    }
  | {
      op: "CHOOSE";
      options: { label: string; requires?: "ITEM"; effects: CurseEffect[] }[];
    }
  | { op: "TOLL" }
  | { op: "MOVE"; destination: "ADJACENT" | "INNER" }
  | { op: "END_TURN" }
  | { op: "THRESHOLD"; count: number; adjacent: boolean }
  | { op: "COMPANIONS" }
  | { op: "SPELLS"; hexlock: boolean }
  | { op: "SIGIL_SEALS"; scope: Scope; count: number }
  | {
      op: "ROOM";
      token: "DARKNESS" | "PORTAL";
      count: number;
      amount: number;
      target: "UNDISCOVERED" | "UNVISITED" | "CURRENT";
    }
  | { op: "SUMMON"; punishments: number }
  | { op: "CAPACITY" }
  | { op: "REMOVE"; token: "HEXLOCK" | "SIGIL_SEAL" };
const category = z.enum(["ELEMENT", "ITEM", "MIRROR", "KNOWLEDGE"]);
const count = z.number().int().min(0).max(35);
export const curseEffectSchema: z.ZodType<CurseEffect> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z.object({
      op: z.literal("LOSS"),
      amount: z.union([
        count,
        z.enum(["COLORS", "DUPLICATES", "COMPANY", "ELEMENT_TYPES"]),
      ]),
      unpreventable: z.boolean().optional(),
    }),
    z.object({
      op: z.literal("TOKEN"),
      token: z.enum(["PARALYSIS", "FEAR"]),
      count,
    }),
    z.object({
      op: z.literal("DROP"),
      category,
      count: z.union([count, z.literal("all")]),
      locks: z.union([count, z.literal("actual")]),
    }),
    z.object({
      op: z.literal("CHOOSE"),
      options: z.array(
        z.object({
          label: z.string(),
          requires: z.literal("ITEM").optional(),
          effects: z.array(curseEffectSchema),
        }),
      ),
    }),
    z.object({ op: z.literal("TOLL") }),
    z.object({
      op: z.literal("MOVE"),
      destination: z.enum(["ADJACENT", "INNER"]),
    }),
    z.object({ op: z.literal("END_TURN") }),
    z.object({ op: z.literal("THRESHOLD"), count, adjacent: z.boolean() }),
    z.object({ op: z.literal("COMPANIONS") }),
    z.object({ op: z.literal("SPELLS"), hexlock: z.boolean() }),
    z.object({
      op: z.literal("SIGIL_SEALS"),
      scope: z.enum(["QUICK", "PERMANENT", "ALL", "SPECIFIC_ACTION"]),
      count,
    }),
    z.object({
      op: z.literal("ROOM"),
      token: z.enum(["DARKNESS", "PORTAL"]),
      count,
      amount: count,
      target: z.enum(["UNDISCOVERED", "UNVISITED", "CURRENT"]),
    }),
    z.object({ op: z.literal("SUMMON"), punishments: count }),
    z.object({ op: z.literal("CAPACITY") }),
    z.object({
      op: z.literal("REMOVE"),
      token: z.enum(["HEXLOCK", "SIGIL_SEAL"]),
    }),
  ]),
);
const loss = (
  amount: Extract<CurseEffect, { op: "LOSS" }>["amount"],
): CurseEffect => ({ op: "LOSS", amount });
const paralysis = (count = 1): CurseEffect => ({
  op: "TOKEN",
  token: "PARALYSIS",
  count,
});
const drop = (
  category: Category,
  count: number | "all",
  locks: number | "actual",
): CurseEffect => ({ op: "DROP", category, count, locks });
const room = (
  token: "DARKNESS" | "PORTAL",
  count: number,
  amount: number,
  target: "UNDISCOVERED" | "UNVISITED" | "CURRENT",
): CurseEffect => ({ op: "ROOM", token, count, amount, target });
type Definition = {
  id: string;
  name: string;
  subtype: string;
  effect: string;
  effects: CurseEffect[];
  after: CurseEffect[];
  version: "0.4";
  status: "REVIEW";
};
const rows: [string, string, CurseEffect[], CurseEffect[]?][] = [
  [
    "Unwelcome Reflection",
    "Lose 2 Courage. Gain 1 Paralysis Token.",
    [loss(2), paralysis()],
  ],
  [
    "The Coward in Glass",
    "Lose 1 Courage per different Mirror Sigil color you possess, without a maximum. Gain 1 Paralysis Token.",
    [loss("COLORS"), paralysis()],
  ],
  [
    "Duplicated Dread",
    "Lose 1 Courage per additional Sigil beyond the first of each color. Gain 1 Paralysis Token.",
    [loss("DUPLICATES"), paralysis()],
  ],
  [
    "Echo of Panic",
    "Without a Companion, lose 3 Courage; otherwise lose 1. Gain 1 Paralysis Token.",
    [loss("COMPANY"), paralysis()],
  ],
  [
    "Elemental Anxiety",
    "Lose 1 Courage per different carried Element type. Gain 1 Paralysis Token.",
    [loss("ELEMENT_TYPES"), paralysis()],
  ],
  [
    "Shattered Nerve",
    "Lose 3 Courage; protection cannot prevent this loss. Gain 2 Paralysis Tokens.",
    [{ op: "LOSS", amount: 3, unpreventable: true }, paralysis(2)],
  ],
  [
    "Occuldor's Smile",
    "Lose 4 Courage. Gain 2 Paralysis Tokens.",
    [loss(4), paralysis(2)],
  ],
  [
    "Empty Pockets",
    "Leave 1 carried Element in this room. Gain 1 Element Hexlock, even if no Element is available.",
    [drop("ELEMENT", 1, 1)],
  ],
  [
    "The Scattered Pouch",
    "Leave up to 2 carried Elements in this room. Gain 2 Element Hexlocks.",
    [drop("ELEMENT", 2, 2)],
  ],
  [
    "Elemental Spill",
    "Leave up to 3 carried Elements in this room. Gain 3 Element Hexlocks.",
    [drop("ELEMENT", 3, 3)],
  ],
  [
    "Total Unbinding",
    "Choose Elements, Items or Mirrors. Leave all carried objects in that category; gain one matching Hexlock per object left.",
    [
      {
        op: "CHOOSE",
        options: (["ELEMENT", "ITEM", "MIRROR"] as Category[]).map(
          (category) => ({
            label: category,
            effects: [drop(category, "all", "actual")],
          }),
        ),
      },
    ],
  ],
  [
    "Threefold Forfeit",
    "Leave 1 carried Element, 1 Item and 1 Mirror if available. Gain a matching Hexlock for each object left.",
    [
      drop("ELEMENT", 1, "actual"),
      drop("ITEM", 1, "actual"),
      drop("MIRROR", 1, "actual"),
    ],
  ],
  [
    "The Mirror Toll",
    "Leave exactly 1 carried White Mirror and 1 carried Black Mirror; gain 2 Mirror Hexlocks. If you cannot leave both, instead lose 3 Courage with no Hexlocks.",
    [{ op: "TOLL" }],
  ],
  [
    "Stripped of Wonders",
    "Choose: leave all carried Items and gain a matching Hexlock per Item, or lose 3 Courage. With no Items, choose the Courage loss.",
    [
      {
        op: "CHOOSE",
        options: [
          {
            label: "Leave all Items",
            requires: "ITEM",
            effects: [drop("ITEM", "all", "actual")],
          },
          { label: "Lose 3 Courage", effects: [loss(3)] },
        ],
      },
    ],
  ],
  [
    "Displaced Reflection",
    "After collision, choose an adjacent room through an unblocked connection and move there. Immediately end your turn.",
    [],
    [{ op: "MOVE", destination: "ADJACENT" }, { op: "END_TURN" }],
  ],
  [
    "Stilled Reflection",
    "After collision, remain here and immediately end your turn, even if mandatory movement is unfulfilled.",
    [],
    [{ op: "END_TURN" }],
  ],
  [
    "A Familiar Fear",
    "Gain 1 Fear Token. End movement in another previously discovered room to remove it.",
    [{ op: "TOKEN", token: "FEAR", count: 1 }],
  ],
  [
    "The Long Return",
    "Gain 2 Fear Tokens. Each requires a visit to another previously discovered room, on separate turns.",
    [{ op: "TOKEN", token: "FEAR", count: 2 }],
  ],
  [
    "Sealed Threshold",
    "Place 1 permanent Corridor Block on a legal corridor touching this room.",
    [{ op: "THRESHOLD", count: 1, adjacent: true }],
  ],
  [
    "Warded Passages",
    "Seal one legal corridor touching this room, then one other legal corridor anywhere. Seals are permanent.",
    [
      { op: "THRESHOLD", count: 1, adjacent: true },
      { op: "THRESHOLD", count: 1, adjacent: false },
    ],
  ],
  [
    "The Castle Closes In",
    "Move to a chosen room in the innermost ring, then permanently seal three legal corridors.",
    [
      { op: "MOVE", destination: "INNER" },
      { op: "THRESHOLD", count: 3, adjacent: false },
    ],
  ],
  [
    "Frightened Company",
    "Leave every attached Companion in this room. Other heroes may recruit them.",
    [{ op: "COMPANIONS" }],
  ],
  [
    "Silenced Invocations",
    "Place one Quick Sigil Seal on each eligible learned Spell. Lose 1 Courage per Seal placed.",
    [{ op: "SIGIL_SEALS", scope: "QUICK", count: 1 }],
  ],
  [
    "The Great Severance",
    "Choose: leave all Companions or all learned Spells here. Permanent Sigils on abandoned Spells are spent.",
    [
      {
        op: "CHOOSE",
        options: [
          { label: "Leave all Companions", effects: [{ op: "COMPANIONS" }] },
          {
            label: "Leave all Spells",
            effects: [{ op: "SPELLS", hexlock: false }],
          },
        ],
      },
    ],
  ],
  [
    "Suppressed Enchantments",
    "Place one Permanent Sigil Seal on each eligible learned Spell. Bound Sigils remain; Permanent effects are suppressed until unsealed.",
    [{ op: "SIGIL_SEALS", scope: "PERMANENT", count: 1 }],
  ],
  [
    "The Forgotten Grimoire",
    "Leave all learned Spells here. Gain one Knowledge Hexlock per Spell left. Knowledge achievements remain unlocked.",
    [{ op: "SPELLS", hexlock: true }],
  ],
  [
    "Total Silence",
    "Place one Sigil Seal on each eligible learned Spell, blocking all its Quick and Permanent actions.",
    [{ op: "SIGIL_SEALS", scope: "ALL", count: 1 }],
  ],
  [
    "The Triple Mute",
    "Choose one learned Spell's Quick action. Place 3 Sigil Seals on that action; it stays blocked until all three are removed.",
    [{ op: "SIGIL_SEALS", scope: "SPECIFIC_ACTION", count: 3 }],
  ],
  [
    "A Light Goes Out",
    "Choose one undiscovered room; place 1 Darkness Token there. Lose 1 Courage.",
    [room("DARKNESS", 1, 1, "UNDISCOVERED"), loss(1)],
  ],
  [
    "Two Darkened Chambers",
    "Choose two different discovered rooms you have not visited; place 1 Darkness Token in each. Lose 1 Courage.",
    [room("DARKNESS", 2, 1, "UNVISITED"), loss(1)],
  ],
  [
    "Deepening Shadow",
    "Choose one undiscovered room; place 2 Darkness Tokens there. Lose 1 Courage.",
    [room("DARKNESS", 1, 2, "UNDISCOVERED"), loss(1)],
  ],
  [
    "Unseen Gateways",
    "Choose two different undiscovered rooms; place a Portal in each. Lose 1 Courage.",
    [room("PORTAL", 2, 1, "UNDISCOVERED"), loss(1)],
  ],
  [
    "Forgotten Gateways",
    "Choose two different discovered rooms you have not visited; place a Portal in each. Lose 1 Courage.",
    [room("PORTAL", 2, 1, "UNVISITED"), loss(1)],
  ],
  [
    "Occuldor's Invitation",
    "Place a Portal here and summon Occuldor. Only you suffer his normal Rage-based punishment once.",
    [room("PORTAL", 1, 1, "CURRENT"), { op: "SUMMON", punishments: 1 }],
  ],
  [
    "Face the Master",
    "Summon Occuldor here. Only you suffer his normal Rage-based punishment twice, sequentially.",
    [{ op: "SUMMON", punishments: 2 }],
  ],
];
export const blackMirrors: Definition[] = rows.map(
  ([name, effect, effects, after = []], i) => ({
    id: `BM-${String(i + 1).padStart(2, "0")}`,
    name,
    effect,
    effects,
    after,
    subtype: [
      "Psychological",
      "Material",
      "Spatial",
      "Supernatural",
      "Castle-wide",
    ][Math.floor(i / 7)],
    version: "0.4",
    status: "REVIEW",
  }),
);
export const blackMirrorById = Object.fromEntries(
  blackMirrors.map((c) => [c.id, c]),
);
blackMirrors.forEach((card) =>
  [...card.effects, ...card.after].forEach((effect) =>
    curseEffectSchema.parse(effect),
  ),
);
