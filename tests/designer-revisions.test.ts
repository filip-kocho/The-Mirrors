import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  loadSave,
  capacities,
  type State,
  type Token,
} from "../src/game/domain/engine";
import { byId, colors } from "../src/game/cards/catalog";
import {
  assignPortals,
  portalPairs,
  portalColor,
} from "../src/game/systems/portals";
import {
  connections,
  corridorIds,
  castlePath,
} from "../src/game/map/castleConnections";
import {
  beginHeroTurn,
  mutableStatus,
} from "../src/game/systems/blackMirrorRuntime";
import { banishmentPlan } from "../src/game/systems/banishment";
import {
  kaleidoscopeGems,
  kaleidoscopeCells,
  closingGems,
  completedGems,
  placementBonuses,
  placementReward,
} from "../src/game/map/kaleidoscopeCells";
import {
  corridorGeometry,
  routeGeometry,
} from "../src/game/map/corridorGeometry";
import { roomGraph } from "../src/game/map/roomGraph";
import { itemActionPlan } from "../src/game/systems/itemActions";

function fixture() {
  const s = initialState(["Rowan", "Elara"], "designer-revisions");
  const all = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(all);
  s.players[0].room = "R01";
  return s;
}
function item(s: State, id: string, carried = true) {
  s.decks.Item = s.decks.Item.filter((c) => c !== id);
  const t: Token = { id, card: id, kind: "Item" };
  (carried ? s.players[0].inventory : s.rooms.R01.objects).push(t);
}

describe("latest designer rules", () => {
  it("leaving a capacity Item shrinks slots immediately and saves an explicit excess-object choice", () => {
    let s = fixture();
    item(s, "IT-01");
    for (let i = 1; i <= 5; i++) {
      const at = s.rooms.Hall.objects.findIndex((t) => t.id === `E-Air-${i}`);
      s.players[0].inventory.push(...s.rooms.Hall.objects.splice(at, 1));
    }
    s = reduce(s, {
      type: "TRANSFER",
      playerId: "P1",
      tokenId: "IT-01",
      direction: "leave",
    });
    expect(
      capacities(s.players[0].inventory, s.rooms.R01.objects).elements,
    ).toBe(3);
    expect(s.blackMirror.resolution?.phase).toBe("inventory");
    expect(s.blackMirror.resolution?.choice?.title).toContain(
      "capacity decreased",
    );
    s = loadSave(JSON.stringify(s));
    expect(() =>
      reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] }),
    ).toThrow();
    while (s.blackMirror.resolution?.choice) {
      const c = s.blackMirror.resolution.choice;
      s = reduce(s, {
        type: "CURSE_CHOICE",
        playerId: "P1",
        choiceId: c.id,
        ids: c.options.slice(0, c.min).map((o) => o.id),
      });
    }
    expect(s.players[0].inventory).toHaveLength(3);
    expect(
      s.rooms.R01.objects.filter((t) => t.kind === "Element"),
    ).toHaveLength(2);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
    expect(
      reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] }).moved,
    ).toBe(true);
  });
  it("a room Tool cannot be used, even when its payment is available", () => {
    const s = fixture();
    item(s, "IT-11", false);
    expect(() => itemActionPlan(s, "IT-11")).toThrow(/Take this Tool/);
    expect(byId["IT-11"].subtype).toBe("Tool");
  });
  it("removes the oldest Hexlock automatically only once each round, retaining other fields", () => {
    const s = fixture(),
      status = mutableStatus(s, "P1");
    status.hexlocks = [
      { id: "h1", category: "ELEMENT", slot: "elements" },
      { id: "h2", category: "MIRROR", slot: "mirrors" },
      { id: "h3", category: "ITEM", slot: "items" },
    ];
    beginHeroTurn(s);
    expect(status.hexlocks.map((h) => h.id)).toEqual(["h2", "h3"]);
    expect(s.blackMirror.resolution).toBeNull();
    beginHeroTurn(s);
    expect(status.hexlocks).toHaveLength(2);
    s.items.round++;
    beginHeroTurn(s);
    expect(status.hexlocks.map((h) => h.id)).toEqual(["h3"]);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it.each([false, true])(
    "banishes Occuldor before/after movement (%s), spends one of each color and retains Knowledge",
    (moved) => {
      let s = fixture();
      const p = s.players[0];
      s.moved = moved;
      s.phase = moved ? "POST_MOVE_ACTIONS" : "PREPARE";
      s.occuldor = "R02";
      p.knowledge = [true, true, true, true];
      p.sigils = [...colors, "Scarlet"];
      const courage = p.courage;
      s = reduce(s, { type: "BANISH_OCCULDOR", playerId: "P1" });
      expect(s.occuldor).toBe("Hall");
      expect(s.players[0].sigils).toEqual(["Scarlet"]);
      expect(s.blackMirror.spentSigils.sort()).toEqual([...colors].sort());
      expect(s.players[0].knowledge).toEqual([true, true, true, true]);
      expect(s.players[0].courage).toBe(courage);
      expect(s.rage).toBe(0);
      expect(s.moved).toBe(moved);
      expect(loadSave(JSON.stringify(s))).toEqual(s);
    },
  );
  it("rejects banishment without the fourth achievement or five different free Sigils atomically", () => {
    const s = fixture();
    s.occuldor = "R02";
    s.players[0].sigils = [...colors];
    expect(() => banishmentPlan(s)).toThrow(/fourth/);
    s.players[0].knowledge[3] = true;
    s.players[0].sigils = ["Scarlet", "Scarlet", "Emerald", "Amber", "Fuchsia"];
    s.blackMirror.bindings["SP-01"] = ["Amethyst"];
    const before = structuredClone(s);
    expect(() =>
      reduce(s, { type: "BANISH_OCCULDOR", playerId: "P1" }),
    ).toThrow(/five free/);
    expect(s).toEqual(before);
  });
  it("connects matching Portal pairs only and preserves them on reload", () => {
    const s = fixture();
    assignPortals(s, ["R01", "R35"]);
    assignPortals(s, ["R02", "R34"]);
    expect(connections(s, "R01")).toContain("R35");
    expect(connections(s, "R01")).not.toContain("R34");
    const pairs = portalPairs(s);
    expect(portalColor(pairs.R01)).toBe(portalColor(pairs.R35));
    expect(portalColor(pairs.R01)).not.toBe(portalColor(pairs.R02));
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("pairs single Portals as partners arrive and migrates legacy markers deterministically", () => {
    const s = fixture();
    assignPortals(s, ["R01"]);
    expect(connections(s, "R01")).not.toContain("R35");
    assignPortals(s, ["R35"]);
    expect(connections(s, "R01")).toContain("R35");
    delete s.blackMirror.rooms.R01.portalPair;
    delete s.blackMirror.rooms.R35.portalPair;
    const loaded = loadSave(JSON.stringify(s));
    expect(portalPairs(loaded)).toEqual({ R01: "legacy-0", R35: "legacy-0" });
    expect(loadSave(JSON.stringify(loaded))).toEqual(loaded);
  });
  it("traces exactly ten small gems and the designer's central five-tile gem", () => {
    expect(kaleidoscopeGems.filter((g) => g.bonus === 3)).toHaveLength(10);
    expect(
      kaleidoscopeGems
        .find((g) => g.bonus === 5)
        ?.cells.map((n) => n + 1)
        .sort((a, b) => a - b),
    ).toEqual([12, 16, 17, 22, 24]);
    for (const cells of [
      [2, 3, 6, 7],
      [9, 18, 13, 20],
      [7, 12, 13, 17],
    ])
      expect(
        kaleidoscopeGems.some(
          (g) =>
            [...g.cells]
              .map((n) => n + 1)
              .sort((a, b) => a - b)
              .join() === cells.sort((a, b) => a - b).join(),
        ),
      ).toBe(true);
  });
  it("reopens only necessary old Corridor Blocks if paired Portal migration would isolate rooms", () => {
    const s = fixture(),
      island = new Set(["R34", "R35"]);
    for (const id of ["R01", "R02", "R34", "R35"])
      s.blackMirror.rooms[id] = { darkness: 0, portal: true };
    s.blackMirror.thresholds = corridorIds.filter((edge) => {
      const [a, b] = edge.split("~");
      return island.has(a) !== island.has(b);
    });
    const oldBlocks = s.blackMirror.thresholds.length;
    const loaded = loadSave(JSON.stringify(s));
    expect(loaded.blackMirror.thresholds.length).toBeLessThan(oldBlocks);
    expect(loaded.blackMirror.thresholds.length).toBeGreaterThan(0);
    for (const id of Object.keys(roomGraph))
      expect(castlePath(loaded, "Hall", id).length).toBeGreaterThan(0);
    expect(
      loaded.log.some((e) => e.text.includes("Portal-pair save migration")),
    ).toBe(true);
    expect(loadSave(JSON.stringify(loaded))).toEqual(loaded);
  });
  it.each(kaleidoscopeGems)(
    "awards $bonus only on closing $id, in addition to every adjacent tile",
    (gem) => {
      const mosaic: (string | null)[] = Array(35).fill(null),
        last = gem.cells.at(-1)!;
      gem.cells
        .filter((n) => n !== last)
        .forEach((n) => (mosaic[n] = "Scarlet"));
      const ordinary =
        1 +
        placementBonuses(mosaic, last, "Amber").reduce(
          (sum, n) => sum + n.bonus,
          0,
        );
      expect(closingGems(mosaic, last).map((g) => g.id)).toContain(gem.id);
      expect(placementReward(mosaic, last, "Amber", true)).toBe(
        ordinary + gem.bonus,
      );
      mosaic[last] = "Amber";
      expect(completedGems(mosaic).map((g) => g.id)).toContain(gem.id);
      expect(closingGems(mosaic, last)).toEqual([]);
      expect(() => placementReward(mosaic, last, "Amber", true)).toThrow();
    },
  );
  it("adds all gem rewards if one placement completes several gaps", () => {
    const mosaic: (string | null)[] = Array(35).fill("Scarlet"),
      last = 11;
    mosaic[last] = null;
    const gems = closingGems(mosaic, last);
    expect(gems.length).toBeGreaterThan(1);
    expect(placementReward(mosaic, last, "Scarlet")).toBe(
      1 +
        kaleidoscopeCells[last].neighbors.length +
        gems.reduce((n, g) => n + g.bonus, 0),
    );
  });
  it("bows inter-wing corridors and uses the same path in previews without drawing Portal jumps", () => {
    let curves = 0;
    for (const id of corridorIds) {
      const [a, b] = id.split("~"),
        g = corridorGeometry(roomGraph[a], roomGraph[b]);
      if (g.control) {
        curves++;
        expect(g.d).toContain(" Q");
      }
      const reverse = corridorGeometry(roomGraph[b], roomGraph[a]);
      expect(g.mid.x).toBeCloseTo(reverse.mid.x);
      expect(g.mid.y).toBeCloseTo(reverse.mid.y);
    }
    expect(curves).toBeGreaterThan(0);
    expect(routeGeometry(["R01", "R35"])).toBe("");
  });
});
