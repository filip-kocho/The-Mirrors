import { roomActionsBlocked } from "./spellModifiers";
import { accessibleItems } from "./itemAccess";
import { byId } from "../cards/catalog";
import type { State } from "../domain/engine";
import { prerequisiteTool } from "../cards/toolPrerequisites";
import { itemEffects } from "./itemAccess";
import {
  findElementPayment,
  validElementPayment,
  type Element,
} from "./elementPayment";
import { darkness, knowledgeSealed } from "./blackMirrorRuntime";

export function learningResources(s: State) {
  const player = s.players[s.active];
  return [...s.rooms[player.room].objects, ...player.inventory];
}

export function learningDiscounts(
  s: State,
  spellId: string,
): (Element | undefined)[] {
  return itemEffects(s).some((e) => e.op === "LEARNING_DISCOUNT")
    ? [...new Set(byId[spellId].learn_elements ?? [])]
    : [undefined];
}
export function suggestedPayment(
  s: State,
  spellId: string,
  discount?: Element,
): string[] {
  return (
    findElementPayment(s, byId[spellId].learn_elements ?? [], discount) ?? [""]
  );
}

/** Spend local Elements first and equip the earliest available unlocked slot. */
export function automaticLearningPlan(s: State, spellId: string) {
  const p = s.players[s.active];
  const slot = p.knowledge.findIndex(
    (unlocked, i) =>
      unlocked && !p.spellSlots[i] && !knowledgeSealed(s, p.id, i),
  );
  const discounts = learningDiscounts(s, spellId);
  if (!discounts.length) discounts.push(undefined);
  let last: unknown;
  for (const discount of discounts)
    try {
      return {
        slot,
        discount,
        ...planLearning(
          s,
          spellId,
          slot,
          suggestedPayment(s, spellId, discount),
          discount,
        ),
      };
    } catch (error) {
      last = error;
    }
  throw last;
}

/** Validate the complete payment before touching any physical object. */
export function planLearning(
  s: State,
  spellId: string,
  slot: number,
  elementIds: string[],
  discount?: Element,
) {
  const p = s.players[s.active],
    room = s.rooms[p.room],
    card = byId[spellId];
  if (
    s.privacy ||
    s.outcome !== "playing" ||
    s.pending ||
    s.blackMirror.resolution?.effects.length ||
    roomActionsBlocked(s, p.room) ||
    p.dead
  )
    throw Error("Learning is unavailable during this phase.");
  if (
    !room.objects.some((t) => t.kind === "Spell" && t.id === spellId) ||
    card?.family !== "Spell"
  )
    throw Error("Choose a Spell in your current room.");
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot > 3 ||
    !p.knowledge[slot] ||
    p.spellSlots[slot] ||
    knowledgeSealed(s, p.id, slot)
  )
    throw Error("Choose a free, unlocked Spell Knowledge slot.");
  const accessible = learningResources(s);
  const prerequisite =
    typeof card.tool_requirement === "string"
      ? prerequisiteTool(card.tool_requirement)
      : undefined;
  const tool = prerequisite
    ? accessibleItems(s).find(
        (t) =>
          t.kind === "Item" &&
          (s.rules.itemPolicies.preserveLegacyToolIds
            ? t.card === prerequisite.id
            : byId[t.card!].name === card.tool_requirement),
      )
    : undefined;
  if (typeof card.tool_requirement === "string" && !prerequisite && s.rules.spellPolicies.unresolvedTools === "BLOCK")
    throw Error(`Learning blocked: obsolete Tool prerequisite ${card.tool_requirement} awaits a revised requirement.`);
  if (
    typeof card.tool_requirement === "string" &&
    !tool &&
    (prerequisite || s.rules.spellPolicies.unresolvedTools === "BLOCK")
  )
    throw Error(
      `Requires access to ${prerequisite?.name ?? card.tool_requirement}${prerequisite ? ` (${prerequisite.id}; originally ${prerequisite.originalName})` : ""}.`,
    );
  if (new Set(elementIds).size !== elementIds.length)
    throw Error(
      "Each contribution needs a separate token; do not select the same token twice.",
    );
  if (
    elementIds.some(
      (id) => !accessible.some((t) => t.kind === "Element" && t.id === id),
    )
  )
    throw Error("Payment Elements must be carried or in the current room.");
  if (!validElementPayment(s, card.learn_elements ?? [], elementIds, discount))
    throw Error(
      "Pay the exact Element cost using distinct accessible tokens and active Item modifiers.",
    );
  return { elementIds, toolId: tool?.id };
}
