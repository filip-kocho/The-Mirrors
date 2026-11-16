import { companionById } from "../cards/companions";
import { spellCapacity } from "./spellModifiers";
import type { State } from "../domain/engine";
import { effectsForTokens } from "./itemAccess";
import { byId } from "../cards/catalog";
import type { Token } from "../domain/engine";
import type { BlackMirrorState } from "./blackMirrorState";
export function inventoryCapacities(
  inventory: Token[],
  local: Token[] = [],
  locks: BlackMirrorState["heroes"][string]["hexlocks"] = [],
  state?: State,
  owner = state?.players[state.active].id,
) {
  const base = { mirrors: 2, elements: 3, items: 2, relics: 1 };
  if (state && owner)
    for (const slot of ["mirrors", "elements", "items"] as const)
      base[slot] += spellCapacity(state, owner, slot);
  for (const effect of effectsForTokens(inventory))
    if (effect.op === "CAPACITY") base[effect.slot] += effect.amount;
  return Object.fromEntries(
    Object.entries(base).map(([slot, n]) => [
      slot,
      Math.max(0, n - locks.filter((h) => h.slot === slot).length),
    ]),
  ) as typeof base;
}
export function carryingSlot(
  t: Token,
): "mirrors" | "elements" | "items" | "relics" | null {
  return t.kind === "Companion" &&
    companionById[t.card!]?.followingType === "CARRIER"
    ? "items"
    : t.kind.endsWith("Mirror")
      ? "mirrors"
      : t.kind === "Element"
        ? "elements"
        : t.kind === "Item"
          ? byId[t.card!]?.subtype === "Relic"
            ? "relics"
            : "items"
          : null;
}
/** Stable explicit Hexlock positions, with legacy locks filled from the final slots. */
export function blockedSlotIndices(base: number, locks: { index?: number }[]) {
  const result = new Set<number>();
  for (const lock of locks)
    if (lock.index !== undefined && lock.index >= 0 && lock.index < base)
      result.add(lock.index);
  for (
    let i = base - 1;
    result.size < Math.min(base, locks.length) && i >= 0;
    i--
  )
    result.add(i);
  return result;
}
