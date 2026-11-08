import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  loadSave,
  assertState,
  movement,
  type State,
  type Token,
} from "../src/game/domain/engine";
import { byId } from "../src/game/cards/catalog";
import {
  kaleidoscopeGems,
  placementReward,
} from "../src/game/map/kaleidoscopeCells";
import {
  storedGems,
  gapReady,
  supportsFilledGaps,
} from "../src/game/systems/magicResources";
import {
  grantSigil,
  availableSigils,
  takeSigils,
  giveSigils,
} from "../src/game/systems/sigils";
import {
  mutableStatus,
  beginHeroTurn,
  abandonSpell,
} from "../src/game/systems/blackMirrorRuntime";
import { activePermanent } from "../src/game/systems/spellModifiers";
import { spellActivationPlan } from "../src/game/systems/spellActivation";
import { connectionId, connections } from "../src/game/map/castleConnections";
import { roomGraph } from "../src/game/map/roomGraph";
const fixture = () => {
  const s = initialState(["A", "B"], "magic-v06");
  const pool = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(pool);
  s.players[0].room = "R01";
  s.players[1].room = "R01";
  return s;
};
function earn() {
  let s = fixture();
  s.decks.Secret = s.decks.Secret.filter(
    (id) => !["SE-09", "SE-15"].includes(id),
  );
  s.players[0].secrets = ["SE-09", "SE-15"];
  return reduce(s, {
    type: "REVEAL_SECRET",
    playerId: "P1",
    secretId: "SE-09",
  });
}
function equip(s: State, id: string) {
  s.decks.Spell = s.decks.Spell.filter((c) => c !== id);
  s.players[0].inventory.push({ id, card: id, kind: "Spell" });
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = id;
}
function restore(s: State, cells: number[]) {
  for (const cell of cells) {
    if (s.mosaic[cell]) continue;
    const n = s.rage + 1,
      room = s.rooms[`R${String(n).padStart(2, "0")}`];
    room.restored = true;
    s.mosaic[cell] = room.color;
    s.rage++;
    s.players[0].restored++;
    for (const type of ["WM", "BM"]) {
      const id = `${type}-${String(n).padStart(2, "0")}`;
      const i = s.rooms.Hall.objects.findIndex((t) => t.id === id);
      s.removed.push(...s.rooms.Hall.objects.splice(i, 1));
    }
    grantSigil(s, "P1", room.color!);
  }
}
const magic = (
  s: State,
  action: Extract<Parameters<typeof reduce>[1], { type: "MAGIC" }>["action"],
  target?: string,
  resource = "DG-09",
) =>
  reduce(s, {
    type: "MAGIC",
    playerId: s.players[s.active].id,
    action,
    resource,
    target,
  });
describe("Wild Diamond Gem transactions", () => {
  it("creates ten reserved Gems and one separate Wild per player", () => {
    for (const n of [2, 3, 4, 5]) {
      const s = initialState(
        Array.from({ length: n }, (_, i) => `Hero ${i}`),
        "magic",
      );
      expect(s.magic.gems).toHaveLength(10);
      expect(s.magic.wildStorage).toHaveLength(n);
      expect(
        s.players.every(
          (p) => p.sigils.length === 0 && p.knowledge.every((k) => !k),
        ),
      ).toBe(true);
      assertState(s);
    }
  });
  it("utility requires a real token and invalid commands preserve readiness", () => {
    const s = earn(),
      before = JSON.stringify(s);
    expect(() => magic(s, "BREAK_PARALYSIS")).toThrow("No Paralysis");
    expect(() => magic(s, "REMOVE_HEXLOCK", "missing")).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it("Paralysis removal exhausts once, preserves turn restriction by default and refreshes idempotently", () => {
    let s = earn();
    const st = mutableStatus(s, "P1");
    st.paralysis = ["para-a", "para-b"];
    st.immobilized = true;
    s = magic(s, "BREAK_PARALYSIS");
    expect(s.blackMirror.heroes.P1.paralysis).toEqual(["para-b"]);
    expect(s.blackMirror.heroes.P1.immobilized).toBe(true);
    expect(() => magic(s, "BREAK_PARALYSIS")).toThrow("exhausted");
    beginHeroTurn(s);
    expect(storedGems(s)[0].exhausted).toBe(true);
    s.turn += 2;
    beginHeroTurn(s);
    expect(storedGems(s)[0].exhausted).toBe(false);
    beginHeroTurn(s);
    expect(storedGems(s)[0].exhausted).toBe(false);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("configurable Paralysis recovery allows movement only after last token is removed", () => {
    let s = earn();
    s.rules.gemPolicies.paralysisMovement = true;
    mutableStatus(s, "P1").paralysis = ["p"];
    s.blackMirror.heroes.P1.immobilized = true;
    s = magic(s, "BREAK_PARALYSIS");
    expect(s.blackMirror.heroes.P1.immobilized).toBe(false);
  });
  it("Hexlock utility removes one inventory lock, not Knowledge", () => {
    let s = earn();
    mutableStatus(s, "P1").hexlocks = [
      { id: "item-lock", category: "ITEM", slot: "items" },
      {
        id: "knowledge-lock",
        category: "KNOWLEDGE",
        slot: "knowledge",
        index: 0,
      },
    ];
    expect(() => magic(s, "REMOVE_HEXLOCK", "knowledge-lock")).toThrow();
    s = magic(s, "REMOVE_HEXLOCK", "item-lock");
    expect(s.blackMirror.heroes.P1.hexlocks.map((h) => h.id)).toEqual([
      "knowledge-lock",
    ]);
    expect(storedGems(s)[0].exhausted).toBe(true);
  });
  it("Swift adds one optional step only for current movement", () => {
    let s = earn();
    const before = movement(s);
    s = magic(s, "SWIFT");
    expect(movement(s)).toBe(before + 1);
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] });
    expect(movement(s)).toBe(before);
    expect(() => magic(s, "SWIFT")).toThrow();
  });
  it("Magical Passage bypasses one selected blocked corridor without removing the block", () => {
    let s = earn();
    const edge = connectionId("R01", "Hall");
    s.blackMirror.thresholds.push(edge);
    expect(connections(s, "R01")).not.toContain("Hall");
    s = magic(s, "PASSAGE", edge);
    expect(connections(s, "R01")).toContain("Hall");
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] });
    expect(s.blackMirror.thresholds).toContain(edge);
    expect(connections(s, "Hall")).not.toContain("R01");
  });
  it("room transfer cannot refresh an exhausted physical Gem", () => {
    let s = magic(earn(), "SWIFT");
    s = magic(s, "LEAVE");
    s.active = 1;
    s = magic(s, "TAKE");
    expect(storedGems(s)[0].exhausted).toBe(true);
    expect(() => magic(s, "SWIFT")).toThrow("exhausted");
    expect(loadSave(JSON.stringify(s))).toEqual(s);
    s.turn++;
    beginHeroTurn(s);
    expect(storedGems(s)[0].exhausted).toBe(false);
  });
  it("direct transfer is disabled unless configured", () => {
    let s = earn();
    expect(() => magic(s, "GIVE", "P2")).toThrow();
    s.rules.gemPolicies.directTransfer = true;
    s = magic(s, "GIVE", "P2");
    expect(storedGems(s, "P2")).toHaveLength(1);
  });
  it("Diamond installation needs support, accepts exhaustion and pays exactly once", () => {
    let s = earn();
    const gap = kaleidoscopeGems.find((g) => g.bonus === 3)!;
    expect(() => magic(s, "INSTALL_GEM", gap.id)).toThrow();
    restore(s, gap.cells);
    const before = s.players[0].courage;
    s = magic(s, "SWIFT");
    s = magic(s, "INSTALL_GEM", gap.id);
    expect(s.players[0].courage).toBe(before + 3);
    expect(storedGems(s)).toEqual([]);
    expect(s.magic.gems.find((g) => g.id === "DG-09")).toMatchObject({
      location: "KALEIDOSCOPE",
      gap: gap.id,
      exhausted: true,
    });
    expect(() => magic(s, "INSTALL_GEM", gap.id)).toThrow();
    expect(() => magic(s, "SWIFT")).toThrow();
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("ten diamond gaps and one center become ready without Courage", () => {
    const s = earn(),
      before = s.players[0].courage;
    expect(kaleidoscopeGems.filter((g) => g.bonus === 3)).toHaveLength(10);
    expect(kaleidoscopeGems.filter((g) => g.bonus === 5)).toHaveLength(1);
    for (const gap of kaleidoscopeGems) {
      restore(s, gap.cells);
      expect(gapReady(s, gap.id)).toBe(true);
    }
    expect(s.players[0].courage).toBe(before);
    expect(s.gemOwners).toEqual({});
  });
  it("filled gaps reject unsupported relocation under default policy", () => {
    let s = earn();
    const gap = kaleidoscopeGems[0];
    restore(s, gap.cells);
    s = magic(s, "INSTALL_GEM", gap.id);
    const copy = [...s.mosaic];
    copy[gap.cells[0]] = null;
    expect(supportsFilledGaps(s, copy)).toBe(false);
    s.rules.gemPolicies.relocation = "RETAIN_INSTALLED";
    expect(supportsFilledGaps(s, copy)).toBe(true);
  });
  it("duplicate Gem and Wild records are rejected on load", () => {
    const s = earn();
    const copy = structuredClone(s);
    copy.magic.gems[0] = copy.magic.gems[1];
    expect(() => loadSave(JSON.stringify(copy))).toThrow();
    s.magic.wildStorage.push({ ...s.magic.wildStorage[0] });
    expect(() => loadSave(JSON.stringify(s))).toThrow();
  });
  it("legacy saves gain supply once without replaying old Courage rewards", () => {
    const s = earn();
    const old = JSON.parse(JSON.stringify(s));
    delete old.magic;
    old.players[0].completedSecrets[0] = {
      id: "SE-09",
      turn: 1,
      reward: 2,
      gained: 2,
      tier: "Basic",
    };
    old.gemOwners = { heart: "P1" };
    const loaded = loadSave(JSON.stringify(old));
    expect(loaded.players[0].courage).toBe(s.players[0].courage);
    expect(loaded.magic.gems.find((g) => g.secret === "SE-09")?.location).toBe(
      "PLAYER_STORAGE",
    );
    expect(loaded.gemOwners).toEqual({});
    expect(loadSave(JSON.stringify(loaded))).toEqual(loaded);
  });
});
describe("Wild Sigil sockets and central installation", () => {
  it("Quick Wild occupies one socket, is unavailable for center, and returns next owner turn", () => {
    let s = fixture();
    equip(s, "SP-01");
    mutableStatus(s, "P1").fear = [{ id: "fear", origin: "R01" }];
    s = reduce(s, {
      type: "CAST_SPELL",
      playerId: "P1",
      spellId: "SP-01",
      action: 0,
      sigilIds: ["WILD-P1"],
      targets: ["fear"],
    });
    expect(s.magic.wildStorage.some((t) => t.owner === "P1")).toBe(false);
    const heart = kaleidoscopeGems.find((g) => g.bonus === 5)!;
    restore(s, heart.cells);
    expect(() => magic(s, "INSTALL_WILD", heart.id, "WILD-P1")).toThrow(
      "available",
    );
    expect(loadSave(JSON.stringify(s))).toEqual(s);
    s.turn += 2;
    beginHeroTurn(s);
    expect(availableSigils(s).some((t) => t.id === "WILD-P1")).toBe(true);
    s = magic(s, "INSTALL_WILD", heart.id, "WILD-P1");
    expect(s.magic.pentagon?.id).toBe("WILD-P1");
    expect(() => magic(s, "INSTALL_WILD", heart.id, "WILD-P1")).toThrow();
  });
  it("Permanent Wild binds and is discarded when its Spell is abandoned", () => {
    let s = fixture();
    equip(s, "SP-01");
    const cost = byId["SP-01"].casting_modes![1].sigil_slots;
    for (const color of cost.slice(1)) grantSigil(s, "P1", color);
    const ids = [
      "WILD-P1",
      ...availableSigils(s)
        .filter((t) => t.color !== "Wild")
        .map((t) => t.id),
    ];
    s = reduce(s, {
      type: "CAST_SPELL",
      playerId: "P1",
      spellId: "SP-01",
      action: 1,
      sigilIds: ids,
      targets: [],
    });
    expect(activePermanent(s, "P1", "SP-01")).toBe(true);
    s.turn += 2;
    beginHeroTurn(s);
    expect(s.magic.wildStorage.some((t) => t.id === "WILD-P1")).toBe(false);
    abandonSpell(s, s.players[0], "SP-01");
    expect(s.spells.spentIds).toContain("WILD-P1");
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("two distinct Wilds fill two sockets, but one cannot be reused", () => {
    let s = fixture();
    equip(s, "SP-17");
    giveSigils(s, "P1", takeSigils(s, "P2", ["WILD-P2"]));
    const mode = byId["SP-17"].casting_modes![1];
    expect(mode.sigil_slots).toHaveLength(2);
    expect(() =>
      reduce(s, {
        type: "CAST_SPELL",
        playerId: "P1",
        spellId: "SP-17",
        action: 1,
        sigilIds: ["WILD-P1", "WILD-P1"],
        targets: [],
      }),
    ).toThrow();
    s = reduce(s, {
      type: "CAST_SPELL",
      playerId: "P1",
      spellId: "SP-17",
      action: 1,
      sigilIds: ["WILD-P1", "WILD-P2"],
      targets: [],
    });
    expect(activePermanent(s, "P1", "SP-17")).toBe(true);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("center pays +5 once, other heroes retain Wilds", () => {
    let s = fixture();
    const heart = kaleidoscopeGems.find((g) => g.bonus === 5)!;
    restore(s, heart.cells);
    s = magic(s, "INSTALL_WILD", heart.id, "WILD-P1");
    expect(s.players[0].courage).toBe(23);
    s.active = 1;
    expect(() => magic(s, "INSTALL_WILD", heart.id, "WILD-P2")).toThrow();
    expect(s.magic.wildStorage).toEqual([{ id: "WILD-P2", owner: "P2" }]);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("neighbor colors and newly surrounded gaps never add base rewards", () => {
    const mosaic = Array(35).fill("Scarlet");
    mosaic[11] = null;
    expect(placementReward(mosaic, 11, "Amber", true)).toBe(1);
  });
});
