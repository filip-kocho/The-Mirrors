import { describe, it, expect } from "vitest";
import {
  cards,
  colors,
  elements,
  validateCatalog,
} from "../src/game/cards/catalog";
import {
  initialState,
  reduce,
  assertState,
  publicRoom,
  loadSave,
  movement,
  capacities,
  planTransfer,
  State,
  Token,
} from "../src/game/domain/engine";
import { generateRoomFindings } from "../src/game/setup/seededRng";
import { roomGraph, pathTo } from "../src/game/map/roomGraph";
const setup = (seed = "test") => initialState(["Rowan", "Elara"], seed);
const move = (s: State, path: string[]) =>
  reduce(s, { type: "MOVE", playerId: s.players[s.active].id, path });
describe("catalog source of truth", () => {
  it("validates all 155 actual cards and exact discovery, learning, subtype and socket counts", () =>
    expect(validateCatalog()).toBe(true));
  it("includes seven Black Mirrors in each curse family", () => {
    const black = cards.filter((c) => c.family === "Black Mirror");
    expect(new Set(black.map((c) => c.subtype)).size).toBe(5);
    for (const family of new Set(black.map((c) => c.subtype)))
      expect(black.filter((c) => c.subtype === family)).toHaveLength(7);
  });
});
describe("physical setup", () => {
  it("generates 35 distinct multisets with 35 of each source symbol", () => {
    const patterns = generateRoomFindings();
    expect(patterns).toHaveLength(35);
    expect(new Set(patterns.map((p) => p.join(""))).size).toBe(35);
    for (let n = 0; n < 4; n++)
      expect(patterns.flat().filter((x) => x === n)).toHaveLength(35);
  });
  it.each(["a", "b", "c", "castle", "green-beer"])(
    "conserves all physical tokens for seed %s",
    (seed) => {
      const s = setup(seed);
      const findings = Object.values(s.rooms).flatMap((r) => r.findings);
      expect(findings).toHaveLength(140);
      expect(findings.filter((t) => t.kind === "White Mirror")).toHaveLength(
        35,
      );
      expect(findings.filter((t) => t.kind === "Black Mirror")).toHaveLength(
        35,
      );
      for (const element of elements)
        expect(findings.filter((t) => t.element === element)).toHaveLength(14);
      for (const color of colors)
        expect(
          Object.values(s.rooms).filter((r) => r.color === color),
        ).toHaveLength(7);
      assertState(s);
    },
  );
  it("reproduces the complete setup and deck order from its seed", () => {
    expect(setup()).toEqual(setup());
    expect(setup("different").rooms).not.toEqual(setup().rooms);
  });
  it("starts everyone in the Hall with empty inventory and four locked slots", () => {
    for (const p of setup().players) {
      expect(p.room).toBe("Hall");
      expect(p.courage).toBe(18);
      expect(p.inventory).toEqual([]);
      expect(p.knowledge).toEqual([false, false, false, false]);
    }
    expect(capacities([])).toEqual({
      mirrors: 2,
      elements: 3,
      items: 2,
      relics: 1,
    });
  });
  it("rejects invalid player setups", () => {
    expect(() => initialState(["One"], "seed")).toThrow();
    expect(() => initialState(["", "Two"], "seed")).toThrow();
    expect(() => initialState(["One", "Two"], "")).toThrow();
  });
});
describe("authoritative navigation", () => {
  it("provides 35 stable rooms and a connected symmetric graph", () => {
    expect(Object.keys(roomGraph)).toHaveLength(36);
    for (const n of Object.values(roomGraph)) {
      expect(pathTo("Hall", n.id).length).toBeGreaterThan(0);
      for (const neighbor of n.neighbors)
        expect(roomGraph[neighbor].neighbors).toContain(n.id);
    }
  });
  it("hides fragment colors and findings until the room is explored", () => {
    expect(publicRoom(setup(), "R01")).toEqual({
      id: "R01",
      explored: false,
      color: null,
      objects: [],
    });
    const s = move(setup(), ["Hall", "R01"]);
    expect(publicRoom(s, "R01").color).toBeTruthy();
    expect(publicRoom(s, "R01").objects).toHaveLength(4);
  });
  it("reveals only the destination, never intermediate rooms", () => {
    const s = move(setup(), ["Hall", "R01", "R06"]);
    expect(s.rooms.R01.explored).toBe(false);
    expect(s.rooms.R06.explored).toBe(true);
    expect(s.players[0].inventory).toEqual([]);
  });
  it("requires a nonzero connected path within Courage range, once per turn", () => {
    const s = setup();
    for (const path of [
      ["Hall"],
      ["Hall", "R01", "Hall"],
      ["Hall", "R35"],
      ["Hall", "R01", "R06", "R16"],
    ])
      expect(() => move(s, path)).toThrow();
    expect(() => move(move(s, ["Hall", "R01"]), ["R01", "R02"])).toThrow();
    expect(s.players[0].room).toBe("Hall");
  });
  it("uses five data-driven Courage movement tiers", () => {
    const s = setup();
    for (const [c, expected] of [
      [1, 1],
      [8, 1],
      [15, 2],
      [22, 3],
      [29, 3],
    ]) {
      s.players[0].courage = c;
      expect(movement(s)).toBe(expected);
    }
  });
  it("rejects inactive actors and ending before movement", () => {
    const s = setup();
    expect(() =>
      reduce(s, { type: "MOVE", playerId: "P2", path: ["Hall", "R01"] }),
    ).toThrow();
    expect(() => reduce(s, { type: "END", playerId: "P1" })).toThrow();
  });
});
describe("local inventories and privacy", () => {
  it("previews full slots without mutation and respects capacity Items accessible in the room", () => {
    const mirrors: Token[] = ["WM-01", "BM-01", "BM-02"].map((id) => ({ id, card: id, kind: id.startsWith("WM") ? "White Mirror" : "Black Mirror" }));
    const elementTokens: Token[] = [1, 2, 3, 4].map((i) => ({ id: `E-Air-${i}`, kind: "Element", element: "Air" }));
    const items: Token[] = cards.filter((c) => c.family === "Item" && c.subtype !== "Relic" && !["IT-01", "IT-02", "IT-03"].includes(c.id)).slice(0, 3).map((c) => ({ id: c.id, card: c.id, kind: "Item" }));
    const relics: Token[] = cards.filter((c) => c.subtype === "Relic").slice(0, 2).map((c) => ({ id: c.id, card: c.id, kind: "Item" }));
    for (const pool of [mirrors, elementTokens, items, relics]) {
      const s = setup();
      const target = pool.at(-1)!;
      s.players[0].inventory = pool.slice(0, -1);
      s.rooms.Hall.objects = [target];
      const before = structuredClone(s);
      expect(() => planTransfer(s, target.id, "take")).toThrow("capacity");
      expect(s).toEqual(before);
      const leaving = planTransfer(s, pool[0].id, "leave");
      s.players[0].inventory = leaving.inventory;
      s.rooms.Hall.objects = leaving.objects;
      expect(planTransfer(s, target.id, "take").inventory).toHaveLength(pool.length - 1);
    }
    const s = setup();
    s.players[0].inventory = elementTokens.slice(0, 3);
    s.rooms.Hall.objects = [elementTokens[3], { id: "IT-01", card: "IT-01", kind: "Item" }];
    expect(()=>planTransfer(s,elementTokens[3].id,"take")).toThrow("capacity");
    s.players[0].inventory.push(s.rooms.Hall.objects.pop()!);
    expect(planTransfer(s,elementTokens[3].id,"take").inventory).toHaveLength(5);
    expect(s.players[0].inventory).toHaveLength(4);
  });
  it("takes and leaves an individual token without duplication", () => {
    let s = move(setup(), ["Hall", "R01"]);
    const token = s.rooms.R01.objects[0];
    s = reduce(s, {
      type: "TRANSFER",
      playerId: "P1",
      tokenId: token.id,
      direction: "take",
    });
    expect(s.players[0].inventory).toEqual([token]);
    expect(s.rooms.R01.objects).toHaveLength(3);
    s = reduce(s, {
      type: "TRANSFER",
      playerId: "P1",
      tokenId: token.id,
      direction: "leave",
    });
    expect(s.players[0].inventory).toEqual([]);
    expect(s.rooms.R01.objects).toHaveLength(4);
    assertState(s);
  });
  it("rejects remote objects", () => {
    const s = move(setup(), ["Hall", "R01"]);
    expect(() =>
      reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        tokenId: s.rooms.R02.findings[0].id,
        direction: "take",
      }),
    ).toThrow();
  });
  it("enforces the combined mirror carrying limit", () => {
    let s = setup();
    const r = Object.values(s.rooms).find(
      (r) => r.findings.filter((t) => t.kind.endsWith("Mirror")).length >= 3,
    )!;
    s.players[0].room = r.id;
    r.explored = true;
    r.objects = structuredClone(r.findings);
    for (const token of r.objects
      .filter((t) => t.kind.endsWith("Mirror"))
      .slice(0, 2))
      s = reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        tokenId: token.id,
        direction: "take",
      });
    const next = s.rooms[r.id].objects.find((t) => t.kind.endsWith("Mirror"))!;
    expect(() =>
      reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        tokenId: next.id,
        direction: "take",
      }),
    ).toThrow("capacity");
    expect(s.players[0].inventory).toHaveLength(2);
  });
  it("counts local capacity items but blocks departure without carrying the item", () => {
    const item: Token = { id: "IT-01", card: "IT-01", kind: "Item" };
    expect(capacities([], [item]).elements).toBe(3);
    const s = setup();
    s.rooms.Hall.objects.push(item);
    s.players[0].inventory = Array.from({ length: 4 }, (_, i) => ({
      id: `test-${i}`,
      kind: "Element",
      element: "Air",
    }));
    expect(() => move(s, ["Hall", "R01"])).toThrow("capacity");
  });
  it("conceals the board between turns and resumes at the next hero", () => {
    let s = move(setup(), ["Hall", "R01"]);
    s = reduce(s, { type: "END", playerId: "P1" });
    expect(s.active).toBe(1);
    expect(s.privacy).toBe(true);
    expect(() => move(s, ["Hall", "R02"])).toThrow("Pass");
    s = reduce(s, { type: "REVEAL", playerId: "P2" });
    expect(move(s, ["Hall", "R02"]).players[1].room).toBe("R02");
  });
  it("round trips saved hidden state, deck order and phase exactly", () => {
    const s = move(setup(), ["Hall", "R01"]);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("rejects corrupted saves", () => {
    const s = setup();
    s.rooms.R01.findings.pop();
    expect(() => loadSave(JSON.stringify(s))).toThrow();
    expect(() => loadSave("{bad json")).toThrow();
  });
});
