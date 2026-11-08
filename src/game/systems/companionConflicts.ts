import { hasSpell } from "./spellModifiers";
import type { State } from "../domain/engine";
import { hasItemEffect } from "./itemAccess";
import { connections } from "../map/castleConnections";
import { byId } from "../cards/catalog";
/** Provisional deterministic destination: first connected explored room, otherwise stay behind. */
function resolveForHero(
  s: State,
  hero: State["players"][number],
  incoming?: string,
) {
  if (
    !s.rules.itemPolicies.companionConflicts ||
    hasSpell(s, "COMPANION_IMMUNITY", hero.id) ||
    hasItemEffect(s, "IGNORE_CONFLICTS", hero.id)
  )
    return;
  const present = new Set(
    [
      ...s.rooms[hero.room].objects,
      ...s.players
        .filter((p) => p.room === hero.room)
        .flatMap((p) => p.companions),
    ]
      .filter((t) => t.kind === "Companion")
      .map((t) => t.card),
  );
  const flee = new Set<string>();
  if (present.has("CO-08")) {
    flee.add("CO-01");
    flee.add("CO-09");
  }
  if (present.has("CO-02") && present.has("CO-04"))
    flee.add(incoming === "CO-04" ? "CO-02" : "CO-04");
  for (const token of [...hero.companions])
    if (flee.has(token.card!)) {
      hero.companions = hero.companions.filter((t) => t.id !== token.id);
      const destination =
        token.card === "CO-01" ||
        s.rules.itemPolicies.conflictDestination === "STAY"
          ? hero.room
          : (connections(s, hero.room).find((id) => s.rooms[id].explored) ??
            hero.room);
      s.rooms[destination].objects.push(token);
      s.log.push({
        id: s.log.length + 1,
        turn: s.turn,
        text:
          byId[token.card!].name +
          " flees a Companion conflict and remains in " +
          destination +
          " (review rule).",
      });
    }
}

export function resolveCompanionConflicts(
  s: State,
  hero: State["players"][number],
  incoming?: string,
) {
  for (const other of s.players.filter((p) => p.room === hero.room && !p.dead))
    resolveForHero(s, other, incoming);
}
