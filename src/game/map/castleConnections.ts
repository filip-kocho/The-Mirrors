import { hasSpell, ignoresThreshold } from "../systems/spellModifiers";
import { portalPairs } from "../systems/portals";
import { roomGraph } from "./roomGraph";
import type { State } from "../domain/engine";
export const connectionId = (a: string, b: string) => [a, b].sort().join("~");
export const corridorIds = Object.values(roomGraph).flatMap((n) =>
  n.neighbors.filter((id) => id > n.id).map((id) => connectionId(n.id, id)),
);
export function connections(
  s: State,
  room: string,
  extraBlocked: string[] = [],
  owner: string | null = s.players[s.active].id,
) {
  const blocked = new Set([...s.blackMirror.thresholds, ...extraBlocked]);
  const normal = roomGraph[room].neighbors.filter(
    (id) =>
      (owner && ignoresThreshold(s, owner)) ||
      !blocked.has(connectionId(room, id)),
  );
  const pairs = portalPairs(s);
  const ownerRoom = s.players.find((p) => p.id === owner)?.room;
  const virtual =
    !!owner && room === ownerRoom && hasSpell(s, "PORTAL_ACCESS", owner);
  const portals =
    s.blackMirror.rooms[room]?.portal || virtual
      ? Object.keys(s.blackMirror.rooms).filter(
          (id) =>
            id !== room &&
            s.blackMirror.rooms[id].portal &&
            (virtual || pairs[id] === pairs[room]),
        )
      : [];
  const hall =
    owner && hasSpell(s, "HALL_CONNECTION", owner)
      ? room === "Hall" && ownerRoom !== "Hall"
        ? [ownerRoom!]
        : room === ownerRoom && room !== "Hall"
          ? ["Hall"]
          : []
      : [];
  return [...new Set([...normal, ...portals, ...hall])];
}
export function castlePath(
  s: State,
  from: string,
  to: string,
  owner: string | null = s.players[s.active].id,
) {
  const queue = [[from]],
    seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!,
      last = path.at(-1)!;
    if (last === to) return path;
    for (const id of connections(s, last, [], owner))
      if (!seen.has(id)) {
        seen.add(id);
        queue.push([...path, id]);
      }
  }
  return [];
}
export function legalThreshold(s: State, edge: string) {
  if (!corridorIds.includes(edge) || s.blackMirror.thresholds.includes(edge))
    return false;
  const seen = new Set(["Hall"]),
    queue = ["Hall"];
  while (queue.length)
    for (const id of connections(s, queue.shift()!, [edge], null))
      if (!seen.has(id)) {
        seen.add(id);
        queue.push(id);
      }
  // Conservative completion policy: preserve all rooms, heroes and physical supplies.
  return seen.size === Object.keys(roomGraph).length;
}
export const innerRooms = roomGraph.Hall.neighbors;
