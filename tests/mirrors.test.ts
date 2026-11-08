import { grantSigil } from "../src/game/systems/sigils";
import { it, expect, describe } from "vitest";
import {
  initialState,
  reduce,
  State,
  assertState,
  loadSave,
} from "../src/game/domain/engine";
import {
  kaleidoscopeCells,
  legalCell,
  placementReward,
} from "../src/game/map/kaleidoscopeCells";
import { byId, colors } from "../src/game/cards/catalog";
import {
  defaultRules,
  occuldorArrivalLoss,
} from "../src/game/rules/gameRulesConfig";
function fixture() {
  const s = initialState(["A", "B"], "mirror-tests");
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = structuredClone(r.findings);
  }
  s.players[0].room = "R01";
  s.players[1].room = "Hall";
  return s;
}
function moveToken(s: State, id: string, to: string) {
  for (const room of Object.values(s.rooms)) {
    const i = room.objects.findIndex((t) => t.id === id);
    if (i >= 0) {
      s.rooms[to].objects.push(...room.objects.splice(i, 1));
      return;
    }
  }
  throw Error("Missing token");
}
function pairReady(s: State, room: string, white = "WM-01", black = "BM-01") {
  moveToken(s, white, room);
  moveToken(s, black, room);
  s.players[0].room = room;
  s.rooms[room].objects.sort(
    (a, b) =>
      Number(b.id === white || b.id === black) -
      Number(a.id === white || a.id === black),
  );
}
const cmd = (
  s: State,
  type: "PLACE_MIRRORS" | "COLLIDE" | "END" | "CONFRONT",
) => {
  const p = s.players[s.active],
    objects = [...s.rooms[p.room].objects, ...p.inventory];
  return type === "PLACE_MIRRORS"
    ? reduce(s, {
        type,
        playerId: p.id,
        whiteId:
          objects.find((t) => t.kind === "White Mirror")?.id ?? "missing",
        blackId:
          objects.find((t) => t.kind === "Black Mirror")?.id ?? "missing",
      })
    : reduce(s, { type, playerId: p.id });
};
function firstCollision() {
  let s = fixture();
  pairReady(s, "R01");
  s = cmd(s, "PLACE_MIRRORS");
  s.installed = false;
  pairReady(s, "R02", "WM-02", "BM-02");
  s = cmd(s, "PLACE_MIRRORS");
  s.players[0].room = "R01";
  s = cmd(s, "COLLIDE");
  return reduce(s, {
    type: "CONTINUE_COLLISION",
    playerId: "P1",
    penalty: "apply",
  });
}
describe("mirror loop", () => {
  it.each([
    [0, 1],
    [6, 1],
    [7, 2],
    [13, 2],
    [14, 3],
    [20, 3],
    [21, 4],
    [27, 4],
    [28, 5],
    [34, 5],
  ])(
    "arrival at Rage %i costs every present hero %i for all colors and legacy saves",
    (rage, loss) => {
      for (const color of colors) {
        let s = fixture();
        s.players.push({
          ...structuredClone(s.players[1]),
          id: "P3",
          name: "C",
        });
        s.players[1].room = "R01";
        s.players[1].courage = 12;
        const matchingRoom = Object.values(s.rooms).find(
          (r) => r.color === color,
        )!;
        [s.rooms.R01.color, matchingRoom.color] = [
          matchingRoom.color,
          s.rooms.R01.color,
        ];
        // A conserved late-game fixture: prior pairs are removed and their glass restored.
        const restored = Object.values(s.rooms)
          .filter((r) => !["Hall", "R01"].includes(r.id))
          .slice(0, rage);
        restored.forEach((room, i) => {
          for (const prefix of ["WM", "BM"]) {
            const id = `${prefix}-${String(i + 2).padStart(2, "0")}`;
            moveToken(s, id, room.id);
            const index = room.objects.findIndex((t) => t.id === id);
            s.removed.push(...room.objects.splice(index, 1));
          }
          room.restored = true;
          s.mosaic[i] = room.color;
          grantSigil(s,"P1",room.color!);
        });
        s.rage = rage;
        s.players[0].restored = rage;
        pairReady(s, "R01");
        assertState(s);
        const legacy = JSON.parse(JSON.stringify(s));
        delete legacy.rules.arrivalLossByRage;
        legacy.rules.arrivalCourageLoss = 1;
        legacy.rules.revengeMatrix = Object.fromEntries(
          colors.map((c) => [c, [1, 2, 3, 4, 5]]),
        );
        s = loadSave(JSON.stringify(legacy));
        s = cmd(s, "PLACE_MIRRORS");
        expect(s.players.map((p) => p.courage)).toEqual([
          18 - loss,
          12 - loss,
          18,
        ]);
        expect(s.rage).toBe(rage);
        expect(s.occuldor).toBe("R01");
        expect(
          s.log.filter((event) =>
            event.text.includes(`loses ${loss} Courage to Occuldor's arrival`),
          ),
        ).toHaveLength(2);
        assertState(s);
      }
    },
  );
  it("keeps the final Rage tier at 5 through Rage 38", () => {
    for (let rage = 28; rage <= 38; rage++)
      expect(occuldorArrivalLoss(rage, defaultRules)).toBe(5);
  });
  it.each([[], ["WM-02"], ["BM-02"], ["WM-02", "BM-02"]])(
    "Placement uses exact selected cards with hand choices %j",
    (...held) => {
      let s = fixture();
      pairReady(s, "R01");
      moveToken(s, "WM-02", "R01");
      moveToken(s, "BM-02", "R01");
      for (const id of held) {
        const index = s.rooms.R01.objects.findIndex((t) => t.id === id);
        s.players[0].inventory.push(...s.rooms.R01.objects.splice(index, 1));
      }
      const original = structuredClone(s);
      s = reduce(s, {
        type: "PLACE_MIRRORS",
        playerId: "P1",
        whiteId: "WM-02",
        blackId: "BM-02",
      });
      expect(s.rooms.R01.pair.map((t) => t.id)).toEqual(["WM-02", "BM-02"]);
      expect(s.rooms.R01.objects.map((t) => t.id)).toEqual(
        expect.arrayContaining(["WM-01", "BM-01"]),
      );
      expect(s.players[0].inventory).toHaveLength(0);
      const slots = byId["WM-02"].slots!;
      expect(s.players[0].secrets.length).toBe(
        slots.filter((slot) => slot === "Secret").length,
      );
      for (const family of ["Item", "Spell", "Companion"]) {
        expect(
          s.rooms.R01.objects.filter((t) => t.kind === family).length,
        ).toBe(slots.filter((slot) => slot === family).length);
      }
      expect(original.rooms.R01.pair).toHaveLength(0);
      assertState(s);
    },
  );
  it("rejects inaccessible or incorrect mirror choices without consuming cards", () => {
    const s = fixture();
    pairReady(s, "R01");
    moveToken(s, "BM-02", "R02");
    moveToken(s, "BM-03", "R02");
    const i = s.rooms.R02.objects.findIndex((t) => t.id === "BM-03");
    s.players[1].inventory.push(...s.rooms.R02.objects.splice(i, 1));
    const before = structuredClone(s);
    for (const blackId of ["BM-02", "BM-03", "WM-01", "missing"]) {
      expect(() =>
        reduce(s, {
          type: "PLACE_MIRRORS",
          playerId: "P1",
          whiteId: "WM-01",
          blackId,
        }),
      ).toThrow("accessible Black Mirror");
      expect(s).toEqual(before);
    }
    expect(() =>
      reduce(s, {
        type: "PLACE_MIRRORS",
        playerId: "P1",
        whiteId: "BM-01",
        blackId: "BM-01",
      }),
    ).toThrow("accessible White Mirror");
    expect(s).toEqual(before);
  });
  it("installs local mirrors, reveals every discovery and keeps Secrets private", () => {
    let s = fixture();
    pairReady(s, "R01");
    const before = s.rooms.R01.objects.length;
    s = cmd(s, "PLACE_MIRRORS");
    expect(s.rooms.R01.pair).toHaveLength(2);
    expect(s.players[0].secrets).toHaveLength(1);
    expect(s.players[0].companions).toHaveLength(1);
    expect(s.rooms.R01.objects).toHaveLength(before - 2);
    expect(s.rooms.R01.objects.some((t) => t.kind === "Companion")).toBe(false);
    expect(s.occuldor).toBe("R01");
    expect(s.rage).toBe(0);
    expect(s.players[1].courage).toBe(18);
    expect(s.players[0].courage).toBe(17);
    expect(s.log.some((e) => e.text.includes(s.players[0].secrets[0]))).toBe(
      false,
    );
    assertState(s);
  });
  it("blocks the guarded pair; relocating Occuldor unblocks the old pair", () => {
    let s = fixture();
    pairReady(s, "R01");
    s = cmd(s, "PLACE_MIRRORS");
    expect(() => cmd(s, "COLLIDE")).toThrow("unblocked");
    s.installed = false;
    pairReady(s, "R02", "WM-02", "BM-02");
    s = cmd(s, "PLACE_MIRRORS");
    s.players[0].room = "R01";
    const before = s.players[0].courage;
    s = cmd(s, "COLLIDE");
    expect(s.pending?.stage).toBe("penalty");
    expect(s.rage).toBe(0);
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    expect(s.players[0].courage).toBe(before - 2);
    expect(s.players[1].courage).toBe(18);
    expect(s.rage).toBe(1);
    expect(s.players[0].sigils).toEqual([s.rooms.R01.color]);
    expect(s.players[0].knowledge).toEqual([true, false, false, false]);
    expect(s.pending?.stage).toBe("placement");
    expect(s.removed).toHaveLength(2);
  });
  it("restores despite a lethal curse and drops carried essential resources", () => {
    let s = fixture();
    pairReady(s, "R01", "WM-01", "BM-07");
    s = cmd(s, "PLACE_MIRRORS");
    s.occuldor = "Hall";
    s.players[0].courage = 1;
    const token = s.rooms.R01.objects.pop()!;
    s.players[0].inventory.push(token);
    s = cmd(s, "COLLIDE");
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    expect(s.players[0].dead).toBe(true);
    expect(s.rooms.R01.objects.some((t) => t.id === token.id)).toBe(true);
    expect(s.rooms.R01.restored).toBe(true);
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    expect(s.players[0].courage).toBe(0);
    expect(s.outcome).toBe("playing");
    assertState(s);
  });
  it("resolves Material curses before committing rewards and rejects unconfigured skipping", () => {
    let s = fixture();
    pairReady(s, "R01", "WM-01", "BM-08");
    s = cmd(s, "PLACE_MIRRORS");
    s.occuldor = "Hall";
    s = cmd(s, "COLLIDE");
    expect(s.rage).toBe(0);
    expect(s.rooms.R01.pair).toHaveLength(2);
    expect(s.players[0].sigils).toHaveLength(0);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
    expect(() =>
      reduce(s, {
        type: "CONTINUE_COLLISION",
        playerId: "P1",
        penalty: "skip",
      }),
    ).toThrow("must be resolved");
    expect(() => reduce(s, { type: "PLACE", playerId: "P1", cell: 0 })).toThrow(
      "awaiting placement",
    );
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    expect(s.blackMirror.heroes.P1.hexlocks).toHaveLength(1);
    expect(s.rage).toBe(1);
    expect(s.players[0].sigils).toHaveLength(1);
    expect(s.rooms.R01.pair).toHaveLength(0);
    expect(s.pending?.stage).toBe("placement");
    expect(() =>
      reduce(s, {
        type: "CONTINUE_COLLISION",
        playerId: "P1",
        penalty: "apply",
      }),
    ).toThrow("No collision penalty");
  });
  it("persists a collision awaiting spatial placement", () => {
    const s = firstCollision();
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("migrates an old pending manual curse exactly once without losing its physical pair", () => {
    let s = fixture();
    pairReady(s, "R01", "WM-01", "BM-08");
    s = cmd(s, "PLACE_MIRRORS");
    s.occuldor = "Hall";
    const legacy = {
      ...s,
      rulesRevision: 2,
      rules: { ...s.rules, onePairPlacementAndOneFlipPerTurn: true },
      pending: { room: "R01", card: "BM-08", stage: "curse" },
    };
    s = loadSave(JSON.stringify(legacy));
    expect(s.pending?.stage).toBe("penalty");
    expect(s.rules.onePairPlacementAndOneFlipPerTurn).toBe(false);
    expect(s.rage).toBe(1);
    expect(s.players[0].sigils).toEqual([s.rooms.R01.color]);
    expect(s.players[0].knowledge[0]).toBe(true);
    expect(s.rooms.R01.pair).toHaveLength(0);
    expect(s.removed).toHaveLength(2);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("allows placement before and after movement in one turn by default", () => {
    let s = fixture();
    pairReady(s, "R02", "WM-02", "BM-02");
    pairReady(s, "R01");
    s = cmd(s, "PLACE_MIRRORS");
    expect(s.moved).toBe(false);
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "R02"] });
    s = cmd(s, "PLACE_MIRRORS");
    expect(s.rooms.R01.pair).toHaveLength(2);
    expect(s.rooms.R02.pair).toHaveLength(2);
    expect(s.occuldor).toBe("R02");
    expect(s.rage).toBe(0);
  });
  it("prevents repeated collisions and installations in restored rooms", () => {
    let s = firstCollision();
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    s.installed = false;
    s.flipped = false;
    expect(() => cmd(s, "PLACE_MIRRORS")).toThrow();
    expect(() => cmd(s, "COLLIDE")).toThrow();
  });
  it("loses when all heroes die to arrival before restoration", () => {
    let s = fixture();
    pairReady(s, "R01");
    for (const h of s.players) {
      h.room = "R01";
      h.courage = 1;
    }
    s = cmd(s, "PLACE_MIRRORS");
    expect(s.outcome).toBe("defeat");
  });
});
describe("neutral spatial Kaleidoscope", () => {
  it("has 35 symmetric connected cells with an edge route to every cell", () => {
    expect(kaleidoscopeCells).toHaveLength(35);
    const seen = new Set([0]),
      queue = [0];
    while (queue.length) {
      for (const n of kaleidoscopeCells[queue.shift()!].neighbors)
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
    }
    expect(seen.size).toBe(35);
    for (const c of kaleidoscopeCells)
      for (const n of c.neighbors)
        expect(kaleidoscopeCells[n].neighbors).toContain(c.id);
  });
  it("starts on an outer edge, then requires shared-edge adjacency even for edge cells", () => {
    const a = Array(35).fill(null);
    expect(legalCell(a, 0)).toBe(true);
    expect(legalCell(a, 11)).toBe(false);
    expect(() => placementReward(a, 11, "Scarlet")).toThrow("first fragment");
    a[0] = "Scarlet";
    expect(legalCell(a, 0)).toBe(false);
    expect(legalCell(a, 1)).toBe(true);
    expect(legalCell(a, 3)).toBe(false);
    expect(() => placementReward(a, 3, "Scarlet")).toThrow(
      "must share an edge",
    );
    a[1] = "Emerald";
    expect(legalCell(a, 5)).toBe(true);
    a[5] = "Amber";
    expect(legalCell(a, 11)).toBe(true);
    expect(legalCell(a, 15)).toBe(false);
  });
  it("adds every matching and different neighbor bonus, ignoring nonadjacent fragments", () => {
    const a = Array(35).fill(null);
    expect(placementReward(a, 0, "Scarlet")).toBe(1);
    a[0] = "Scarlet";
    expect(placementReward(a, 1, "Scarlet")).toBe(2);
    expect(placementReward(a, 1, "Emerald")).toBe(3);
    a[5] = "Emerald";
    expect(placementReward(a, 1, "Scarlet")).toBe(4);
    a[5] = "Scarlet";
    expect(placementReward(a, 1, "Scarlet")).toBe(3);
    expect(placementReward(a, 1, "Amber")).toBe(5);
    a[34] = "Amber";
    expect(placementReward(a, 1, "Amber")).toBe(5);
    a.fill(null);
    a[1] = "Scarlet";
    a[3] = "Emerald";
    a[11] = "Amethyst";
    expect(placementReward(a, 5, "Scarlet")).toBe(6);
    expect(placementReward(a, 5, "Amber")).toBe(7);
  });
  it("can fill all 35 cells from every permitted starting edge without disconnected placements", () => {
    for (const start of kaleidoscopeCells.filter((c) => c.isEdge)) {
      const a = Array(35).fill(null);
      expect(legalCell(a, start.id)).toBe(true);
      a[start.id] = "Amethyst";
      for (let i = 1; i < 35; i++) {
        const next = kaleidoscopeCells.find((c) => legalCell(a, c.id));
        expect(next).toBeDefined();
        expect(next!.neighbors.some((n) => a[n])).toBe(true);
        a[next!.id] = "Amethyst";
      }
      expect(kaleidoscopeCells.some((c) => legalCell(a, c.id))).toBe(false);
    }
  });
  it("rejects a disconnected later placement atomically through the game command", () => {
    let s = firstCollision();
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    s.players[0].room = "R02";
    s.occuldor = "Hall";
    s = cmd(s, "COLLIDE");
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    const before = structuredClone(s);
    expect(() => reduce(s, { type: "PLACE", playerId: "P1", cell: 3 })).toThrow(
      "must share an edge",
    );
    expect(s).toEqual(before);
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 1 });
    expect(s.mosaic.filter(Boolean)).toHaveLength(2);
    assertState(s);
  });
});
it("runs all 35 real pairs to victory with exact conservation and the final Confront fallback", () => {
  let s = fixture();
  s.rules.blackMirrorPolicies.allowSkip = true;
  const roomIds = Object.keys(s.rooms).filter((id) => id !== "Hall");
  // Deterministic test fixture: arrange real physical cards, then issue ordinary commands.
  const loose = Object.values(s.rooms).flatMap((r) => r.objects);
  for (const r of Object.values(s.rooms)) r.objects = [];
  roomIds.forEach((id, i) => {
    s.rooms[id].objects.push(
      loose.find((t) => t.id === `WM-${String(i + 1).padStart(2, "0")}`)!,
      loose.find((t) => t.id === `BM-${String(i + 1).padStart(2, "0")}`)!,
    );
  });
  s.rooms.Hall.objects.push(...loose.filter((t) => t.kind === "Element"));
  for (const room of roomIds) {
    s.players[0].room = room;
    s.players[0].courage = 35;
    s.installed = false;
    s = cmd(s, "PLACE_MIRRORS");
  }
  for (let i = 0; i < 35; i++) {
    s.players[0].room = roomIds[i];
    s.players[0].courage = 35;
    s.flipped = false;
    if (i === 34) s = cmd(s, "CONFRONT");
    s = cmd(s, "COLLIDE");
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "skip",
    });
    const cell = kaleidoscopeCells.find((c) => legalCell(s.mosaic, c.id))!;
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: cell.id });
    assertState(s);
  }
  expect(s.rage).toBe(35);
  expect(s.outcome).toBe("victory");
  expect(s.removed).toHaveLength(70);
  expect(s.players[0].sigils).toHaveLength(35);
  expect(s.players[0].knowledge.every(Boolean)).toBe(true);
});
