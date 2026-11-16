import type { State, Token } from "../domain/engine";
import {
  carryingSlot,
  inventoryCapacities,
  blockedSlotIndices,
} from "./inventoryCapacity";
import { mutableStatus, tokenId } from "./blackMirrorRuntime";

/** Block the carrying area vacated by a paid card/resource; Spells retain their slot index. */
export function hexlockPaidSlot(s: State, token: Token) {
  const hero = s.players[s.active];
  const slot = token.kind === "Spell" ? "knowledge" : carryingSlot(token);
  if (!slot) throw Error("This object has no carrying slot to Hexlock.");
  const locks = mutableStatus(s, hero.id).hexlocks.filter(
    (h) => h.slot === slot,
  );
  const base =
    slot === "knowledge"
      ? 4
      : inventoryCapacities(hero.inventory, [], [], s, hero.id)[slot];
  const blocked = blockedSlotIndices(base, locks);
  const available = Array.from({ length: base }, (_, i) => i).filter(
    (i) => !blocked.has(i),
  );
  const index =
    slot === "knowledge"
      ? hero.spellSlots.indexOf(token.id)
      : available[
          hero.inventory
            .filter((t) => carryingSlot(t) === slot)
            .findIndex((t) => t.id === token.id)
        ];
  if (index !== undefined && index < 0)
    throw Error("Spell must occupy a Knowledge slot.");
  mutableStatus(s, hero.id).hexlocks.push({
    id: tokenId(s, "HEXLOCK"),
    category:
      slot === "knowledge"
        ? "KNOWLEDGE"
        : slot === "mirrors"
          ? "MIRROR"
          : slot === "elements"
            ? "ELEMENT"
            : "ITEM",
    slot,
    ...(index !== undefined ? { index } : {}),
  });
}
