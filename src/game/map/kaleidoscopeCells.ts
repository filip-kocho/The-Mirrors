import gems from "./kaleidoscopeGems.json";
export const kaleidoscopeGems = gems;
export function completedGems(placed: (string | null)[]) {
  return gems.filter((g) => g.cells.every((id) => placed[id]));
}
export function closingGems(
  placed: (string | null)[],
  id: number,
  awarded: string[] = [],
) {
  return placed[id]
    ? []
    : gems.filter(
        (g) =>
          !awarded.includes(g.id) &&
          g.cells.includes(id) &&
          g.cells.every((n) => n === id || placed[n]),
      );
}
import geometry from "./kaleidoscopeGeometry.json";
// The 35 blue pentagons traced from kaledioscope.png; enclosed gaps are completion gems.
// Only full shared edges are neighbors. Internal holes do not count as outer edges.
export const kaleidoscopeCells = geometry;
export const kaleidoscopeCenter = "399,387 472,387 494,457 435,499 377,456";
export function legalCell(
  placed: (string | null)[],
  id: number,
  freePlacement = false,
) {
  const c = kaleidoscopeCells[id];
  return Boolean(
    c &&
    !placed[id] &&
    (freePlacement ||
      (placed.some(Boolean) ? c.neighbors.some((n) => placed[n]) : c.isEdge)),
  );
}
export function placementReward(
  placed: (string | null)[],
  id: number,
  color: string,
  freePlacement = false,
  awarded: string[] = [],
) {
  if (!legalCell(placed, id, freePlacement))
    throw Error(
      placed.some(Boolean)
        ? "Every new fragment must share an edge with an existing fragment."
        : "Place the first fragment on an empty outer-edge cell.",
    );
  return (
    1 +
    placementBonuses(placed, id, color).reduce((sum, n) => sum + n.bonus, 0) +
    closingGems(placed, id, awarded).reduce((sum, g) => sum + g.bonus, 0)
  );
}

export function placementBonuses(
  placed: (string | null)[],
  id: number,
  color: string,
) {
  return kaleidoscopeCells[id].neighbors
    .filter((n) => placed[n])
    .map((n) => ({
      id: n,
      color: placed[n]!,
      bonus: placed[n] === color ? 1 : 2,
    }));
}
