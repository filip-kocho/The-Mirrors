import type { State, Token } from "../domain/engine";
import { byId, elements } from "../cards/catalog";
import {
  secretById,
  spellTiers,
  type SecretCard,
  type SpellTier,
} from "../cards/secrets";
import { inventoryCapacities, carryingSlot } from "./inventoryCapacity";
import { gainCourage } from "./courage";

const unique = (tokens: Token[]) => [
  ...new Map(tokens.map((t) => [t.id, t])).values(),
];
export interface SecretEvaluation {
  eligible: boolean;
  progress: string;
  variants: { tier?: SpellTier; reward: number }[];
}
/** Current collections only. No historical progress, payment modifiers or state mutation. */
export function evaluateSecretCondition(
  card: SecretCard,
  playerId: string,
  s: State,
): SecretEvaluation {
  const p = s.players.find((p) => p.id === playerId);
  if (!p) return { eligible: false, progress: "Unknown hero.", variants: [] };
  const carried = unique(p.inventory),
    subtype = (t: Token, kind: string) =>
      t.kind === "Item" && byId[t.card!]?.subtype === kind,
    relics = carried.filter((t) => subtype(t, "Relic")).length,
    learned = [
      ...new Set(
        p.spellSlots.filter(
          (id, i): id is string =>
            !!id &&
            p.knowledge[i] &&
            carried.some((t) => t.id === id && t.kind === "Spell"),
        ),
      ),
    ],
    companions = unique(p.companions.filter((t) => t.kind === "Companion")),
    elementCounts = elements.map((e) => ({
      element: e,
      count: carried.filter((t) => t.kind === "Element" && t.element === e)
        .length,
    })),
    distinct = elementCounts.filter((e) => e.count > 0).length,
    black = carried.filter((t) => t.kind === "Black Mirror").length,
    white = carried.filter((t) => t.kind === "White Mirror").length,
    minimum = card.condition.minimumCount;
  let count = 0,
    label = "",
    extra = true;
  switch (card.condition.type) {
    case "CARRIED_ELEMENTS_SAME_TYPE": {
      const best = [...elementCounts].sort((a, b) => b.count - a.count)[0];
      count = best.count;
      label = `${best.element} Elements`;
      break;
    }
    case "CARRIED_ELEMENTS_DISTINCT_TYPES":
    case "ALL_FIVE_ELEMENTS_CARRIED":
      count = distinct;
      label = "different Element types";
      break;
    case "CARRIED_BLACK_MIRRORS":
      count = black;
      label = "carried Black Mirrors";
      break;
    case "CARRIED_WHITE_MIRRORS":
      count = white;
      label = "carried White Mirrors";
      break;
    case "CARRIED_EQUIPMENT_COUNT":
      count = carried.filter((t) => subtype(t, "Equipment")).length;
      label = "carried Equipment";
      break;
    case "ACCESSIBLE_DISTINCT_TOOLS":
      count = new Set(
        unique([...carried, ...(s.rooms[p.room]?.objects ?? [])])
          .filter((t) => subtype(t, "Tool"))
          .map((t) => t.card),
      ).size;
      label = "accessible Tools";
      break;
    case "EQUIPPED_RELICS_COUNT":
      count = relics;
      label = "equipped Relics";
      break;
    case "LEARNED_SPELLS_COUNT":
      count = learned.length;
      label = "learned Spells";
      break;
    case "LEARNED_SPELLS_SAME_PRINTED_LEVEL": {
      const counts = spellTiers.map((tier) => ({
        tier,
        count: learned.filter((id) => byId[id]?.subtype === tier).length,
      }));
      const variants = counts
        .filter((t) => t.count >= minimum)
        .map(({ tier }) => ({
          tier,
          reward:
            "byTier" in card.reward
              ? card.reward.byTier[tier]
              : card.reward.amount,
        }));
      return {
        eligible: variants.length > 0,
        progress: counts
          .map((t) => `${t.tier}: ${t.count}/${minimum}`)
          .join(" · "),
        variants,
      };
    }
    case "ATTACHED_COMPANIONS_COUNT":
      count = companions.length;
      label = "attached Companions";
      break;
    case "UNREVEALED_SECRETS_COUNT":
      count = new Set(
        p.secrets.filter(
          (id) =>
            secretById[id] && !p.completedSecrets.some((c) => c.id === id),
        ),
      ).size;
      label = "unrevealed Secrets (including this card)";
      break;
    case "MIXED_MIRROR_COLLECTION":
      count = black + white;
      label = `carried Mirrors (${black} Black, ${white} White; both needed)`;
      extra = black >= 1 && white >= 1;
      break;
    case "PERMANENT_SIGILS_DISTINCT_COLORS":
      count = new Set(learned.flatMap((id) => s.blackMirror.bindings[id] ?? []))
        .size;
      label = "permanently assigned Sigil colors";
      break;
    case "LOYAL_STRAY_AND_RELIC": {
      const loyal = companions.some(
          (t) =>
            (t.behavior ??
              s.rules.blackMirrorPolicies.defaultCompanionBehavior) === "LOYAL",
        ),
        stray = companions.some(
          (t) =>
            (t.behavior ??
              s.rules.blackMirrorPolicies.defaultCompanionBehavior) === "STRAY",
        );
      count = Number(loyal) + Number(stray) + Number(relics > 0);
      label = `requirements (Loyal: ${loyal ? "yes" : "no"}; Stray: ${stray ? "yes" : "no"}; Relic: ${relics > 0 ? "yes" : "no"})`;
      break;
    }
  }
  const eligible = count >= minimum && extra;
  return {
    eligible,
    progress: `${count}/${minimum} ${label}`,
    variants:
      eligible && "amount" in card.reward
        ? [{ reward: card.reward.amount }]
        : [],
  };
}
/** Same permission/eligibility path used by the UI and reducer. Reward is never client supplied. */
export function secretRevealPlan(
  s: State,
  playerId: string,
  id: string,
  tier?: SpellTier,
) {
  const p = s.players[s.active],
    card = secretById[id];
  if (p.id !== playerId || s.privacy)
    throw Error("Only the active hero may reveal their Secret.");
  if (
    s.outcome !== "playing" ||
    p.dead ||
    p.courage === 0 ||
    s.pending ||
    s.blackMirror.resolution
  )
    throw Error("Finish the current resolution before revealing a Secret.");
  if (
    !card ||
    !p.secrets.includes(id) ||
    s.players.some((h) => h.completedSecrets.some((c) => c.id === id))
  )
    throw Error("This Secret is not in your unrevealed hand.");
  // Old saves may contain excess carried objects. Resolve that using existing inventory rules first.
  const cap = inventoryCapacities(
    p.inventory,
    [],
    s.blackMirror.heroes[p.id]?.hexlocks ?? [],
    s,
    p.id,
  );
  for (const slot of Object.keys(cap) as (keyof typeof cap)[])
    if (p.inventory.filter((t) => carryingSlot(t) === slot).length > cap[slot])
      throw Error("Resolve excess carried objects before revealing a Secret.");
  const evaluation = evaluateSecretCondition(card, playerId, s);
  if (!evaluation.eligible)
    throw Error("Achievement not yet eligible: " + evaluation.progress);
  const variant = tier
    ? evaluation.variants.find((v) => v.tier === tier)
    : evaluation.variants.length === 1
      ? evaluation.variants[0]
      : undefined;
  if (!variant)
    throw Error("Choose a currently qualifying printed Spell tier.");
  return { ...evaluation, ...variant, card };
}
export function revealSecret(
  s: State,
  playerId: string,
  id: string,
  tier?: SpellTier,
) {
  const plan = secretRevealPlan(s, playerId, id, tier),
    p = s.players[s.active],
    before = p.courage;
  p.secrets = p.secrets.filter((secret) => secret !== id);
  gainCourage(s, p.id, plan.reward);
  const gained = p.courage - before;
  p.completedSecrets.push({
    id,
    turn: s.turn,
    reward: plan.reward,
    gained,
    ...(plan.tier ? { tier: plan.tier } : {}),
  });
  s.log.push({
    id: s.log.length + 1,
    turn: s.turn,
    text: `${p.name} reveals ${plan.card.name} (${id})${plan.tier ? ` — ${plan.tier}` : ""}: ${plan.card.effect} Gains +${gained} Courage${gained < plan.reward ? ` (${plan.reward} reward, capped at 35)` : ""}. Achievement completed; requirements are kept.`,
  });
}

export function assertSecretState(s: State) {
  const ids = [
    ...(s.decks.Secret ?? []),
    ...s.players.flatMap((p) => [
      ...p.secrets,
      ...p.completedSecrets.map((c) => c.id),
    ]),
    ...s.removed.filter((t) => t.kind === "Secret").map((t) => t.card!),
  ];
  if (
    ids.length !== 15 ||
    new Set(ids).size !== 15 ||
    ids.some((id) => !secretById[id])
  )
    throw Error("Secret supply or ownership corrupted.");
  if (
    Object.values(s.rooms).some((r) =>
      r.objects.some((t) => t.kind === "Secret"),
    ) ||
    s.players.some((p) => p.inventory.some((t) => t.kind === "Secret"))
  )
    throw Error(
      "Secrets belong in private or completed collections, never room inventory.",
    );
  for (const p of s.players)
    for (const c of p.completedSecrets) {
      const reward = secretById[c.id].reward;
      if (
        c.turn > s.turn ||
        c.gained > c.reward ||
        ("amount" in reward
          ? c.reward !== reward.amount || !!c.tier
          : !c.tier || c.reward !== reward.byTier[c.tier])
      )
        throw Error("Invalid completed Secret reward.");
    }
}
