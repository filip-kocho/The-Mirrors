import { hasSpell } from "./spellModifiers";
import { roomGraph } from "../map/roomGraph";
import type { State, Token } from "../domain/engine";
import { itemById, type ItemEffect } from "../cards/items";
export function accessibleItems(s: State, heroId = s.players[s.active].id) {
  const hero = s.players.find((h) => h.id === heroId)!;
  return [
    ...new Map(
      [
        ...hero.inventory,
        ...(hasSpell(s, "ADJACENT_TOOLS", heroId)
          ? roomGraph[hero.room].neighbors
              .filter((id) => s.rooms[id].explored)
              .flatMap((id) =>
                s.rooms[id].objects.filter(
                  (t) =>
                    t.kind === "Item" && itemById[t.card!]?.subtype === "Tool",
                ),
              )
          : []),
      ]
        .filter((t) => t.kind === "Item")
        .map((t) => [t.id, t]),
    ).values(),
  ];
}
export function effectsForTokens(tokens: Token[]) {
  return [
    ...new Set(tokens.filter((t) => t.kind === "Item").map((t) => t.card!)),
  ].flatMap((id) => itemById[id]?.effects ?? []);
}
export function itemEffects(s: State, heroId = s.players[s.active].id) {
  return effectsForTokens(accessibleItems(s, heroId));
}
export function hasItemEffect(
  s: State,
  op: ItemEffect["op"],
  heroId = s.players[s.active].id,
) {
  return itemEffects(s, heroId).some((e) => e.op === op);
}
export function rewardFor(
  s: State,
  event: Extract<ItemEffect, { op: "REWARD" }>["event"],
  heroId = s.players[s.active].id,
) {
  return itemEffects(s, heroId).reduce(
    (n, e) => n + (e.op === "REWARD" && e.event === event ? e.amount : 0),
    0,
  );
}
export function itemMovement(s: State, heroId = s.players[s.active].id) {
  return itemEffects(s, heroId).reduce(
    (n, e) =>
      n +
      (e.op === "MOVEMENT"
        ? e.selectable
          ? Math.min(e.amount, s.items.boots[heroId] ?? 3)
          : e.amount
        : 0),
    0,
  );
}
