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
