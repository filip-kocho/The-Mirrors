import type { State } from "../domain/engine";
/** Legacy markers are paired in stable room order; a lone marker awaits a partner. */
export function portalPairs(s: State) {
  const result: Record<string, string> = {},
    legacy: string[] = [];
  for (const [id, r] of Object.entries(s.blackMirror.rooms).sort(([a], [b]) =>
    a.localeCompare(b),
  ))
    if (r.portal) {
      if (r.portalPair) result[id] = r.portalPair;
      else legacy.push(id);
    }
  legacy.forEach((id, i) => (result[id] = "legacy-" + Math.floor(i / 2)));
  return result;
}
export function normalizePortals(s: State) {
  for (const [id, pair] of Object.entries(portalPairs(s)))
    s.blackMirror.rooms[id].portalPair = pair;
}
export function portalSupply(s: State) {
  return Math.max(
    0,
    s.rules.spellPolicies.portalTokenSupply -
      Object.values(s.blackMirror.rooms).filter((r) => r.portal).length,
  );
}
export function assignPortals(s: State, ids: string[]) {
  normalizePortals(s);
  const fresh = ids
    .filter((id) => !s.blackMirror.rooms[id]?.portal)
    .slice(0, portalSupply(s));
  while (fresh.length) {
    const a = fresh.shift()!;
    let pair: string;
    if (fresh.length) pair = "portal-" + s.blackMirror.nextId++;
    else {
      const pairs = portalPairs(s),
        counts = Object.values(pairs).reduce<Record<string, number>>(
          (n, p) => ((n[p] = (n[p] ?? 0) + 1), n),
          {},
        );
      pair =
        (s.rules.blackMirrorPolicies.singlePortalPairing === "JOIN_OLDEST"
          ? Object.values(pairs)
              .filter((p) => counts[p] === 1)
              .sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true }),
              )[0]
          : undefined) ?? "portal-" + s.blackMirror.nextId++;
    }
    const room = (s.blackMirror.rooms[a] ??= { darkness: 0, portal: false });
    room.portal = true;
    room.portalPair = pair;
    if (fresh.length) {
      const b = fresh.shift()!,
        other = (s.blackMirror.rooms[b] ??= { darkness: 0, portal: false });
      other.portal = true;
      other.portalPair = pair;
    }
  }
}
export function portalColor(pair: string) {
  let hash = 0;
  for (const ch of pair) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return "hsl(" + ((hash * 137.508) % 360) + " 88% 72%)";
}
