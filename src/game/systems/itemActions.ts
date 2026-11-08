import { leaveCompanion } from "./companions";
import { hasSpell, roomActionsBlocked } from "./spellModifiers";
import { availableSigils, takeSigils, discardSigils } from "./sigils";
import { spellActivationPlan, activateSpell } from "./spellActivation";
import type { State, Token } from "../domain/engine";
import { byId } from "../cards/catalog";
import { itemById } from "../cards/items";
import { accessibleItems } from "./itemAccess";
import {
  gainCourage,
  loseCourage,
  arriveOcculdor,
  itemReward,
} from "./courage";
import { abandonSpell, canActivateSpellAction } from "./blackMirrorRuntime";

export function itemActionPlan(s: State, id: string, extraUse = false) {
  const hero = s.players[s.active],
    definition = itemById[id],
    effect = definition?.effects.find((e) => e.op === "TOOL");
  if (!effect || !accessibleItems(s).some((t) => t.card === id))
    throw Error("Take this Tool into your Item slot before using its ability.");
  if (
    s.privacy ||
    s.outcome !== "playing" ||
    hero.dead ||
    s.pending ||
    s.blackMirror.resolution ||
    roomActionsBlocked(s, hero.room)
  )
    throw Error("Tool actions are unavailable during this phase.");
  if (!extraUse && s.items.used[hero.id]?.[id] === s.items.round)
    throw Error("This hero already used this Tool this round.");
  if (effect.beforeMove && s.moved)
    throw Error("Use this Tool before movement.");
  const accessible = [...s.rooms[hero.room].objects, ...hero.inventory];
  const label = (t: Token) => t.element ?? byId[t.card!]?.name ?? t.kind;
  let options: { id: string; label: string }[] = [],
    min = 1,
    max = 1;
  const fromTokens = (tokens: Token[]) =>
    tokens.map((t) => ({ id: t.id, label: label(t) }));
  switch (effect.action) {
    case "ELEMENT":
      options = fromTokens(accessible.filter((t) => t.kind === "Element"));
      break;
    case "MIRRORS":
      options = fromTokens(
        hero.inventory.filter((t) => t.kind.endsWith("Mirror")),
      );
      min = max = 2;
      break;
    case "ITEM":
      options = fromTokens(
        accessible.filter(
          (t) =>
            t.kind === "Item" &&
            (s.rules.itemPolicies.allowSelfDiscard || t.card !== id),
        ),
      );
      break;
    case "SPELL":
      options = fromTokens(
        hero.inventory.filter((t) => hero.spellSlots.includes(t.id)),
      );
      break;
    case "SIGIL":
      options = availableSigils(s).map(({color}, i) => ({
        id: `sigil:${i}`,
        label: color,
      }));
      break;
    case "SECRET":
      options = hero.secrets.map((id, i) => ({
        id,
        label: `Secret ${i + 1}: ${byId[id].name}`,
      }));
      break;
    case "LEAVE_COMPANIONS":
      if (
        !hero.companions.length &&
        s.rules.itemPolicies.whistleRequiresCompanion
      )
        throw Error("At least one attached Companion is required.");
      min = max = 0;
      break;
    case "OCCULDOR":
      if (hero.courage < 1) throw Error("Cannot pay the Courage cost.");
      options = Object.values(s.rooms)
        .filter((r) => r.id !== "Hall" && r.id !== s.occuldor)
        .map((r) => ({ id: r.id, label: r.id }));
      break;
    case "SACRIFICE_COMPANION":
      options = fromTokens(hero.companions.filter((t) => !t.linkedGroupId));
      break;
  }
  if (options.length < min)
    throw Error("The required sacrifice is not available.");
  return {
    effect,
    options,
    min,
    max,
    kind:
      effect.action === "OCCULDOR" ? ("rooms" as const) : ("objects" as const),
    cost: definition.cost,
    reward: effect.reward,
  };
}
export function applyItemAction(
  s: State,
  id: string,
  ids: string[],
  round: number,
  turn: number,
  extraUse = false,
) {
  const plan = itemActionPlan(s, id, extraUse),
    hero = s.players[s.active],
    room = s.rooms[hero.room];
  if (
    round !== s.items.round ||
    turn !== s.turn ||
    new Set(ids).size !== ids.length ||
    ids.length < plan.min ||
    ids.length > plan.max ||
    ids.some((id) => !plan.options.some((o) => o.id === id))
  )
    throw Error("Choose current, distinct, eligible Tool targets.");
  (s.items.used[hero.id] ??= {})[id] = s.items.round;
  const extract = (tokenId: string) => {
    for (const pool of [hero.inventory, room.objects]) {
      const i = pool.findIndex((t) => t.id === tokenId);
      if (i >= 0) return pool.splice(i, 1)[0];
    }
    throw Error("Object is no longer accessible.");
  };
  const restriction = (s.items.restrictions[hero.id] ??= {});
  switch (plan.effect.action) {
    case "ELEMENT":
      s.spentElements.push(extract(ids[0]));
      break;
    case "MIRRORS":
      room.objects.push(...ids.map(extract));
      restriction.mirrors = hero.room;
      break;
    case "ITEM":
      s.removed.push(extract(ids[0]));
      break;
    case "SPELL":
      abandonSpell(s, hero, ids[0]);
      s.removed.push(extract(ids[0]));
      s.blackMirror.seals = s.blackMirror.seals.filter(
        (seal) => seal.spell !== ids[0],
      );
      break;
    case "SIGIL":
      discardSigils(
        s,
        takeSigils(s, hero.id, [
          availableSigils(s, hero.id)[Number(ids[0].split(":")[1])].id,
        ]),
      );
      break;
    case "SECRET":
      hero.secrets = hero.secrets.filter((secret) => secret !== ids[0]);
      s.removed.push({ id: ids[0], card: ids[0], kind: "Secret" });
      break;
    case "LEAVE_COMPANIONS":
      for (const t of [...hero.companions])
        if (hero.companions.some((x) => x.id === t.id))
          leaveCompanion(s, t, hero.room);
      hero.companions = [];
      restriction.companions = hero.room;
      break;
    case "OCCULDOR":
      loseCourage(s, hero.id, 1, { cost: true });
      if (s.rules.itemPolicies.compassArrivalPunishes)
        arriveOcculdor(s, ids[0]);
      else s.occuldor = ids[0];
      break;
    case "SACRIFICE_COMPANION": {
      const i = hero.companions.findIndex((t) => t.id === ids[0]);
      leaveCompanion(s, hero.companions[i], hero.room, true);
      break;
    }
  }
  gainCourage(
    s,
    hero.id,
    plan.reward +
      (plan.reward > 0 && hasSpell(s, "TOOL_REWARD", hero.id) ? 1 : 0),
  );
  s.log.push({
    id: s.log.length + 1,
    turn: s.turn,
    text: `${hero.name} uses ${itemById[id].name}${plan.reward ? `: +${plan.reward} Courage` : ""}. Used for round ${s.items.round}.`,
  });
}

export function permanentAssignmentPlan(
  s: State,
  spell: string,
  action: number,
) {
  const plan = spellActivationPlan(s, spell, action);
  if (plan.quick) throw Error("Choose a Permanent action.");
  const available = availableSigils(s);
  return {
    indices: plan.selected.map((id) => available.findIndex((t) => t.id === id)),
    colors: [...plan.mode.sigil_slots],
  };
}
export function assignPermanentSigils(s: State, spell: string, action: number) {
  const plan = spellActivationPlan(s, spell, action);
  if (plan.quick) throw Error("Choose a Permanent action.");
  activateSpell(s, spell, action, plan.selected);
}
