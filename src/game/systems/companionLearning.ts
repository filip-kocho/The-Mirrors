import type { State } from "../domain/engine";
import type { Element } from "./elementPayment";
import { itemEffects } from "./itemAccess";

export function juliaPresent(s: State) {
  const p = s.players[s.active];
  return (
    s.rooms[p.room].objects.some((t) => t.card === "CO-10") ||
    s.players.some(
      (h) =>
        !h.dead &&
        h.room === p.room &&
        h.companions.some((t) => t.card === "CO-10"),
    )
  );
}
export function juliaDiscountReady(s: State) {
  const p = s.players[s.active];
  const clock =
    s.rules.companionPolicies.juliaRefresh === "ROUND" ? s.items.round : s.turn;
  return (
    !p.dead && juliaPresent(s) && s.spells.usage["julia:" + p.id] !== clock
  );
}
export function learningDiscountSource(
  s: State,
  required: Element[],
  discount?: Element,
) {
  if (!discount || !required.includes(discount)) return undefined;
  // Discounts do not stack; prefer the reusable Grimoire over Julia's limited use.
  if (itemEffects(s).some((e) => e.op === "LEARNING_DISCOUNT"))
    return "Grimoire";
  if (
    required.length > 1 &&
    (discount === "Earth" || discount === "Water") &&
    juliaDiscountReady(s)
  )
    return "Julia";
  return undefined;
}
export function recordJuliaLearning(s: State) {
  s.spells.usage["julia:" + s.players[s.active].id] =
    s.rules.companionPolicies.juliaRefresh === "ROUND" ? s.items.round : s.turn;
}
