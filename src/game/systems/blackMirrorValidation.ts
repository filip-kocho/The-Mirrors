import type { State } from "../domain/engine";
import { byId } from "../cards/catalog";
import { blackMirrorById } from "../cards/blackMirrors";
import { castlePath, corridorIds } from "../map/castleConnections";
import { portalPairs } from "./portals";

/** Validate saved token references as well as their Zod shapes. */
export function assertBlackMirrorState(s: State) {
  const b = s.blackMirror,
    heroes = new Set(s.players.map((p) => p.id));
  const ids: string[] = [];
  const pairCounts = Object.values(portalPairs(s)).reduce<
    Record<string, number>
  >((counts, pair) => {
    counts[pair] = (counts[pair] ?? 0) + 1;
    return counts;
  }, {});
  if (Object.values(pairCounts).some((count) => count > 2))
    throw Error("A Portal pair can connect only two rooms.");
  for (const [owner, status] of Object.entries(b.heroes)) {
    if (
      !heroes.has(owner) ||
      status.visited.some((room) => !s.rooms[room]) ||
      status.fear.some((token) => !s.rooms[token.origin])
    )
      throw Error("Invalid curse owner or room.");
    ids.push(
      ...status.paralysis,
      ...status.hexlocks.map((t) => t.id),
      ...status.fear.map((t) => t.id),
    );
    for (const lock of status.hexlocks) {
      const valid =
        lock.category === "ELEMENT"
          ? lock.slot === "elements"
          : lock.category === "MIRROR"
            ? lock.slot === "mirrors"
            : lock.category === "ITEM"
              ? ["items", "relics"].includes(lock.slot)
              : lock.slot === "knowledge" &&
                lock.index !== undefined &&
                lock.index >= 0 &&
                lock.index < 4;
      if (!valid) throw Error("Invalid Hexlock capacity target.");
    }
  }
  if (
    Object.keys(b.rooms).some((room) => !s.rooms[room]) ||
    b.revealed.some((card) => !blackMirrorById[card])
  )
    throw Error("Invalid curse room or revealed card.");
  if (
    new Set(b.thresholds).size !== b.thresholds.length ||
    b.thresholds.some((edge) => !corridorIds.includes(edge))
  )
    throw Error("Invalid Corridor Block.");
  if (
    b.thresholds.length &&
    Object.keys(s.rooms).some((room) => !castlePath(s, "Hall", room).length)
  )
    throw Error("Corridor Blocks disconnect the castle.");
  for (const seal of b.seals) {
    if (!heroes.has(seal.owner) || byId[seal.spell]?.family !== "Spell")
      throw Error("Invalid Sigil Seal owner or Spell.");
    if (
      seal.scope === "SPECIFIC_ACTION" &&
      (seal.action === undefined ||
        byId[seal.spell].casting_modes?.[seal.action]?.name.toUpperCase() !==
          "QUICK")
    )
      throw Error("Invalid Sigil Seal action.");
    ids.push(seal.id);
  }
  if (ids.length !== new Set(ids).size)
    throw Error("Duplicate curse token identity.");
  for (const spell of Object.keys(b.bindings))
    if (!s.players.some((hero) => hero.spellSlots.includes(spell)))
      throw Error("Orphaned permanent Sigil binding.");
  const r = b.resolution;
  if (r) {
    if (
      r.hero !== s.players[s.active].id ||
      !s.rooms[r.origin] ||
      (r.phase === "refresh"
        ? r.card !== "TURN" || !!s.pending
        : r.phase === "inventory"
          ? !!s.pending
          : r.phase === "item"
            ? byId[r.card]?.family !== "Item" || !!s.pending
            : !blackMirrorById[r.card] || r.card !== s.pending?.card)
    )
      throw Error("Invalid pending curse resolution.");
    const choice = r.choice;
    if (
      choice &&
      (!r.effects.length ||
        choice.min < 1 ||
        choice.max < choice.min ||
        choice.max > choice.options.length ||
        new Set(choice.options.map((o) => o.id)).size !== choice.options.length)
    )
      throw Error("Invalid pending curse choices.");
  }
}
