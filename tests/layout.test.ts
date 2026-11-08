import { describe, it, expect } from "vitest";
import {
  kaleidoscopeCells,
  legalCell,
} from "../src/game/map/kaleidoscopeCells";
import { roomGraph, pathTo } from "../src/game/map/roomGraph";
const edgeKey = (a: number[], b: number[]) =>
  [a.join(","), b.join(",")].sort().join("|");
describe("designer reference layouts", () => {
  it("uses all 35 pentagons and exactly matches adjacency to drawn shared edges", () => {
    expect(kaleidoscopeCells).toHaveLength(35);
    const edges = new Map<string, number[]>();
    for (const c of kaleidoscopeCells) {
      expect(c.points).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        const key = edgeKey(c.points[i], c.points[(i + 1) % 5]);
        edges.set(key, [...(edges.get(key) ?? []), c.id]);
      }
    }
    for (const c of kaleidoscopeCells) {
      const neighbors = [...edges.values()]
        .filter((ids) => ids.length === 2 && ids.includes(c.id))
        .flatMap((ids) => ids.filter((id) => id !== c.id));
      expect([...c.neighbors].sort()).toEqual(neighbors.sort());
    }
    expect([...edges.values()].every((ids) => ids.length <= 2)).toBe(true);
  });
  it("does not treat the gray center or diamond holes as legal outer edges", () => {
    expect(kaleidoscopeCells.filter((c) => c.isEdge)).toHaveLength(20);
    for (const id of [5, 6, 11, 15, 16, 21, 23, 28, 29])
      expect(legalCell(Array(35).fill(null), id)).toBe(false);
    expect(legalCell(Array(35).fill(null), 35)).toBe(false);
  });
  it("keeps 35 rooms in five complete 1+3+3 wings and connected symmetric corridors", () => {
    expect(Object.keys(roomGraph)).toHaveLength(36);
    for (let wing = 0; wing < 5; wing++)
      expect(
        Object.values(roomGraph).filter(
          (n) => n.id !== "Hall" && n.rotation === wing * 72,
        ),
      ).toHaveLength(7);
    for (const n of Object.values(roomGraph)) {
      expect(pathTo("Hall", n.id).length).toBeGreaterThan(0);
      for (const id of n.neighbors)
        expect(roomGraph[id].neighbors).toContain(n.id);
    }
  });
});
