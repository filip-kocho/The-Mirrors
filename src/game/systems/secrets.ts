import type { State, Token } from "../domain/engine";
import { byId, elements } from "../cards/catalog";
import { secretById, type SecretCard, type SpellTier } from "../cards/secrets";
import { inventoryCapacities, carryingSlot } from "./inventoryCapacity";
import { gainCourage } from "./courage";
import { awardDiamondGem } from "./magicResources";
const unique = (ts: Token[]) => [...new Map(ts.map((t) => [t.id, t])).values()];
export interface SecretEvaluation {
  eligible: boolean;
  progress: string;
  variants: { tier?: SpellTier; reward: number }[];
}
export function evaluateSecretCondition(
  card: SecretCard,
  playerId: string,
  s: State,
): SecretEvaluation {
  const p = s.players.find((p) => p.id === playerId);
  if (!p) return { eligible: false, progress: "Unknown hero", variants: [] };
  const carried = unique(p.inventory),
    cap = inventoryCapacities(
      carried,
      [],
      s.blackMirror.heroes[p.id]?.hexlocks ?? [],
      s,
      p.id,
    );
  const countType = (type: string) =>
    carried.filter((t) => t.kind === type).length;
  const itemType = (type: string) =>
    carried.filter((t) => t.kind === "Item" && byId[t.card!]?.subtype === type)
      .length;
  const counts = elements.map(
    (e) =>
      carried.filter((t) => t.kind === "Element" && t.element === e).length,
  );
  const legalCapacity = Object.keys(cap).every(
    (slot) =>
      [...carried, ...p.companions].filter((t) => carryingSlot(t) === slot)
        .length <= cap[slot as keyof typeof cap],
  );
  let count = 0;
  switch (card.condition.type) {
    case "ELEMENT_PAIR":
      count = Math.max(...counts);
      break;
    case "ELEMENT_TYPES":
      count = counts.filter(Boolean).length;
      break;
    case "MIRROR_BALANCE":
      count =
        Number(countType("White Mirror") > 0) +
        Number(countType("Black Mirror") > 0);
      break;
    case "MATCHING_MIRRORS":
      count = Math.max(countType("White Mirror"), countType("Black Mirror"));
      break;
    case "CRAFTSMAN":
      count = Number(itemType("Equipment") > 0) + Number(itemType("Tool") > 0);
      break;
    case "RELICS":
      count = Math.min(cap.relics, itemType("Relic"));
      break;
    case "SPELLS":
      count = new Set(
        p.spellSlots.filter(
          (id, i) =>
            id &&
            p.knowledge[i] &&
            carried.some((t) => t.id === id && t.kind === "Spell"),
        ),
      ).size;
      break;
    case "COMPANIONS":
      count = unique(p.companions).length;
      break;
    case "SECRETS":
      count = new Set(p.secrets).size;
      break;
    case "COLORED_SIGILS":
      count = new Set(p.sigils).size;
      break;
  }
  const eligible = legalCapacity && count >= card.condition.minimumCount;
  return {
    eligible,
    progress: `${count}/${card.condition.minimumCount}${legalCapacity ? "" : " - resolve carrying overflow"}`,
    variants: eligible ? [{ reward: card.reward.amount }] : [],
  };
}
export function secretRevealPlan(
  s: State,
  playerId: string,
  id: string,
  _tier?: SpellTier,
) {
  const p = s.players[s.active],
    card = secretById[id];
  if (p.id !== playerId || s.privacy)
    throw Error("Only the active hero may reveal their Secret.");
  if (
    s.outcome !== "playing" ||
    p.dead ||
    !p.courage ||
    s.pending ||
    s.blackMirror.resolution ||
    s.spells.consent ||
    s.spells.portalOffer
  )
    throw Error("Finish the current resolution before revealing a Secret.");
  if (
    !card ||
    !p.secrets.includes(id) ||
    s.players.some((h) => h.completedSecrets.some((c) => c.id === id))
  )
    throw Error("This Secret is not in your unrevealed hand.");
  const evaluation = evaluateSecretCondition(card, playerId, s);
  if (!evaluation.eligible)
    throw Error("Achievement not yet eligible: " + evaluation.progress);
  if (
    card.reward.type === "DIAMOND_GEM" &&
    !s.magic.gems.some((g) => g.secret === id && g.location === "RESERVED")
  )
    throw Error("Reserved Diamond Gem is unavailable.");
  return {
    ...evaluation,
    reward: card.reward.amount,
    card,
    tier: undefined as SpellTier | undefined,
  };
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
  if (plan.card.reward.type === "DIAMOND_GEM") awardDiamondGem(s, id, p.id);
  else gainCourage(s, p.id, 5);
  p.secrets = p.secrets.filter((c) => c !== id);
  p.completedSecrets.push({
    id,
    turn: s.turn,
    reward: plan.reward,
    gained: p.courage - before,
    rewardType: plan.card.reward.type,
  });
  s.log.push({
    id: s.log.length + 1,
    turn: s.turn,
    text: `${p.name} reveals ${plan.card.name} (${id}): ${plan.card.reward.type === "DIAMOND_GEM" ? "receives one Diamond Gem" : "gains +" + (p.courage - before) + " Courage"}. Requirements are kept.`,
  });
}
export function assertSecretState(s: State) {
  const ids = [
    ...s.decks.Secret,
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
    throw Error("Secrets belong in private or completed collections.");
  for (const p of s.players)
    for (const c of p.completedSecrets)
      if (
        c.turn > s.turn ||
        (!c.legacy &&
          (c.reward !== secretById[c.id].reward.amount ||
            c.rewardType !== secretById[c.id].reward.type ||
            c.gained > (c.rewardType === "DIAMOND_GEM" ? 0 : 5)))
      )
        throw Error("Invalid completed Secret reward.");
}
