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
  attachCompanion,
  companionDeparture,
} from "../src/game/systems/companions";
import { companionActionPlan } from "../src/game/systems/companionAbilities";
import {
  mutableStatus,
  beginHeroTurn,
} from "../src/game/systems/blackMirrorRuntime";
import { arriveOcculdor } from "../src/game/systems/courage";
import { spellActivationPlan } from "../src/game/systems/spellActivation";
import { activePermanent } from "../src/game/systems/spellModifiers";
import {
  grantSigil,
  availableSigils,
  takeSigils,
  discardSigils,
} from "../src/game/systems/sigils";
import { roomGraph } from "../src/game/map/roomGraph";
import { connections, connectionId } from "../src/game/map/castleConnections";

function fixture() {
  const s = initialState(["A", "B"], "revised-cards");
  const pool = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(pool);
  s.players[0].room = "R01";
  return s;
}
function card(s: State, id: string, pool = s.players[0].inventory) {
  const kind = byId[id].family as Token["kind"];
  s.decks[kind] = s.decks[kind].filter((c) => c !== id);
  const token: Token = { id, card: id, kind };
  pool.push(token);
  return token;
}
function physical(s: State, id: string, pool = s.players[0].inventory) {
  const source = s.rooms.Hall.objects;
  pool.push(
    ...source.splice(
      source.findIndex((t) => t.id === id),
      1,
    ),
  );
}
function companion(s: State, id: string) {
  const t = card(s, id, s.rooms.R01.objects);
  attachCompanion(s, s.players[0], t);
}
function use(s: State, id: string, ids: string[]) {
  return reduce(s, {
    type: "USE_COMPANION",
    playerId: s.players[s.active].id,
    card: id,
    ids,
  });
}
function equip(s: State, id: string) {
  card(s, id);
  const index = s.players[0].spellSlots.findIndex((x) => !x);
  s.players[0].spellSlots[index] = id;
  s.players[0].knowledge[index] = true;
}
function fund(s: State, id: string, action: number) {
  for (const color of byId[id].casting_modes![action].sigil_slots)
    grantSigil(s, "P1", color);
}
function cast(s: State, id: string, action: number, targets: string[] = []) {
  const plan = spellActivationPlan(s, id, action, targets);
  return reduce(s, {
    type: "CAST_SPELL",
    playerId: "P1",
    spellId: id,
    action,
    targets,
    sigilIds: plan.selected,
  });
}
const adjacent = roomGraph.R01.neighbors.find((id) => id !== "Hall")!;
describe("approved card revisions", () => {
  it("gives all White Mirrors unique names without changing discoveries", () => {
    const whites = Object.values(byId).filter(
      (c) => c.family === "White Mirror",
    );
    expect(new Set(whites.map((c) => c.name)).size).toBe(35);
    expect(
      whites.every((c) => c.name !== "White Mirror" && c.slots!.length === 3),
    ).toBe(true);
  });
  it("Rex protects its owner on other heroes' turns and on repeated arrivals", () => {
    const s = fixture();
    companion(s, "CO-01");
    s.rage = 7;
    s.players[1].room = "R01";
    s.active = 1;
    arriveOcculdor(s, "R01");
    arriveOcculdor(s, "R01");
    expect(s.players[0].courage).toBe(16);
    expect(s.players[1].courage).toBe(14);
  });
  it("Alexis adds exactly one movement only while attached", () => {
    const s = fixture(),
      base = movement(s);
    companion(s, "CO-02");
    expect(movement(s)).toBe(base + 1);
    s.rooms.R01.objects.push(...s.players[0].companions.splice(0));
    expect(movement(s)).toBe(base);
  });
  it("Roderick permits one selected blocked corridor for movement once per round", () => {
    let s = fixture();
    companion(s, "CO-04");
    const edge = connectionId("R01", adjacent);
    s.blackMirror.thresholds.push(edge);
    expect(connections(s, "R01")).not.toContain(adjacent);
    s = use(s, "CO-04", [edge]);
    expect(connections(s, "R01")).toContain(adjacent);
    expect(() => use(s, "CO-04", [edge])).toThrow("round");
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", adjacent] });
    expect(s.blackMirror.thresholds).toContain(edge);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it.each([
    ["CO-05", "WM-01"],
    ["CO-06", "BM-01"],
  ])("%s pulls only its Mirror from an adjacent room", (co, mirror) => {
    let s = fixture();
    companion(s, co);
    physical(s, mirror, s.rooms[adjacent].objects);
    const other = mirror.startsWith("WM") ? "BM-02" : "WM-02";
    physical(s, other, s.rooms[adjacent].objects);
    const before = JSON.stringify(s);
    expect(() => use(s, co, [other])).toThrow();
    expect(JSON.stringify(s)).toBe(before);
    s = use(s, co, [mirror]);
    expect(s.rooms.R01.objects.some((t) => t.id === mirror)).toBe(true);
    expect(s.players[0].inventory.some((t) => t.id === mirror)).toBe(false);
  });
  it("Mara removes one selected Fear or Paralysis token and refreshes next round", () => {
    let s = fixture();
    companion(s, "CO-07");
    const st = mutableStatus(s, "P1");
    st.fear = [{ id: "fear", origin: "R02" }];
    st.paralysis = ["para"];
    st.immobilized = true;
    s = use(s, "CO-07", ["para"]);
    expect(mutableStatus(s, "P1").immobilized).toBe(false);
    expect(mutableStatus(s, "P1").fear).toHaveLength(1);
    expect(() => use(s, "CO-07", ["fear"])).toThrow("round");
    s.items.round++;
    s = use(s, "CO-07", ["fear"]);
    expect(mutableStatus(s, "P1").fear).toHaveLength(0);
  });
  it("Mamba removes a selected Spell Hexlock once per round", () => {
    let s = fixture();
    companion(s, "CO-08");
    mutableStatus(s, "P1").hexlocks = [
      { id: "a", slot: "knowledge", category: "KNOWLEDGE", index: 0 },
      { id: "b", slot: "elements", category: "ELEMENT", index: 1 },
    ];
    s = use(s, "CO-08", ["a"]);
    expect(mutableStatus(s, "P1").hexlocks.map((h) => h.id)).toEqual(["b"]);
    expect(() => use(s, "CO-08", ["b"])).toThrow("round");
  });
  it("Clementine pulls two Elements from one discovered room, never mixes an Item with an Element", () => {
    let s = fixture();
    companion(s, "CO-09");
    physical(s, "E-Air-1", s.rooms.R35.objects);
    physical(s, "E-Water-1", s.rooms.R35.objects);
    card(s, "IT-01", s.rooms.R35.objects);
    expect(() => use(s, "CO-09", ["IT-01", "E-Air-1"])).toThrow("one Item");
    s = use(s, "CO-09", ["E-Air-1", "E-Water-1"]);
    expect(
      s.rooms.R01.objects.filter((t) => t.kind === "Element"),
    ).toHaveLength(2);
    s = use(s, "CO-09", ["IT-01"]);
    expect(s.rooms.R01.objects.some((t) => t.id === "IT-01")).toBe(true);
    assertState(s);
  });
  it("room Companions cannot use abilities and planning does not mutate state", () => {
    const s = fixture();
    card(s, "CO-07", s.rooms.R01.objects);
    const before = JSON.stringify(s);
    expect(() => companionActionPlan(s, "CO-07")).toThrow("attached");
    expect(JSON.stringify(s)).toBe(before);
  });
  it("IT-11 locks the Element slot paid and IT-12 locks both distinct Mirror slots", () => {
    let s = fixture();
    card(s, "IT-11");
    physical(s, "E-Air-1");
    physical(s, "E-Water-1");
    s = reduce(s, {
      type: "USE_ITEM",
      playerId: "P1",
      itemId: "IT-11",
      ids: ["E-Water-1"],
      round: s.items.round,
      turn: s.turn,
    });
    expect(mutableStatus(s, "P1").hexlocks[0]).toMatchObject({
      slot: "elements",
      index: 1,
    });
    expect(s.players[0].courage).toBe(19);
    s = fixture();
    card(s, "IT-12");
    physical(s, "WM-01");
    physical(s, "BM-01");
    s = reduce(s, {
      type: "USE_ITEM",
      playerId: "P1",
      itemId: "IT-12",
      ids: ["WM-01", "BM-01"],
      round: s.items.round,
      turn: s.turn,
    });
    expect(
      mutableStatus(s, "P1")
        .hexlocks.map((h) => h.index)
        .sort(),
    ).toEqual([0, 1]);
  });
  it("IT-22 crosses blocked corridors without removing Blocks", () => {
    const s = fixture();
    card(s, "IT-22");
    const edge = connectionId("R01", adjacent);
    s.blackMirror.thresholds.push(edge);
    expect(connections(s, "R01")).toContain(adjacent);
    expect(s.blackMirror.thresholds).toContain(edge);
  });
  it.each([
    ["SP-08", "E-Air-1", "elements"],
    ["SP-13", "WM-01", "mirrors"],
  ])("%s leaves its resource and adds a slot Hexlock", (id, resource, slot) => {
    let s = fixture();
    equip(s, id);
    fund(s, id, 0);
    physical(s, resource);
    s = cast(s, id, 0, [resource]);
    expect(s.players[0].courage).toBe(19);
    expect(s.rooms.R01.objects.some((t) => t.id === resource)).toBe(true);
    expect(mutableStatus(s, "P1").hexlocks[0]).toMatchObject({
      slot,
      index: 0,
    });
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("SP-16 returns exact bound identities, ends the effect, and permits later rebinding", () => {
    let s = fixture();
    equip(s, "SP-02");
    fund(s, "SP-02", 1);
    s = cast(s, "SP-02", 1);
    const ids = [...s.spells.permanentIds["SP-02"]];
    equip(s, "SP-16");
    fund(s, "SP-16", 0);
    s = cast(s, "SP-16", 0, ["SP-02"]);
    expect(activePermanent(s, "P1", "SP-02")).toBe(false);
    expect(availableSigils(s).map((t) => t.id)).toEqual(
      expect.arrayContaining(ids),
    );
    expect(s.players[0].courage).toBe(18 + ids.length);
    expect(() => cast(s, "SP-16", 0, ["SP-02"])).toThrow();
    s = cast(s, "SP-02", 1);
    expect(activePermanent(s, "P1", "SP-02")).toBe(true);
    assertState(s);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("SP-16 discounts another Permanent payment, preserves it across saves, and cannot discount itself", () => {
    let s = fixture();
    equip(s, "SP-16");
    fund(s, "SP-16", 1);
    expect(spellActivationPlan(s, "SP-16", 1).waived).toBe(-1);
    s = cast(s, "SP-16", 1);
    equip(s, "SP-02");
    discardSigils(
      s,
      takeSigils(
        s,
        "P1",
        availableSigils(s).map((t) => t.id),
      ),
    );
    const cost = byId["SP-02"].casting_modes![1].sigil_slots;
    for (const c of cost.slice(0, -1)) grantSigil(s, "P1", c);
    const plan = spellActivationPlan(s, "SP-02", 1);
    expect(plan.selected).toHaveLength(cost.length - 1);
    s = cast(s, "SP-02", 1);
    expect(activePermanent(s, "P1", "SP-02")).toBe(true);
    expect(s.spells.permanentIds["SP-02"]).toHaveLength(cost.length - 1);
    expect(activePermanent(loadSave(JSON.stringify(s)), "P1", "SP-02")).toBe(
      true,
    );
    expect(() => cast(s, "SP-02", 1)).toThrow("already bound");
  });
  it("Permanent protection remains active during another hero's turn", () => {
    let s = fixture();
    equip(s, "SP-03");
    fund(s, "SP-03", 1);
    s = cast(s, "SP-03", 1);
    s.active = 1;
    s.turn++;
    s.rage = 7;
    arriveOcculdor(s, "R01");
    expect(s.players[0].courage).toBe(17);
    expect(activePermanent(s, "P1", "SP-03")).toBe(true);
  });
  it("SP-32 creates a pair each eligible owner turn and rejects single-token supply", () => {
    let s = fixture();
    equip(s, "SP-32");
    fund(s, "SP-32", 1);
    s = cast(s, "SP-32", 1);
    s.turn = 3;
    beginHeroTurn(s);
    expect(s.spells.portalOffer).not.toBeNull();
    s = reduce(s, {
      type: "SPELL_PORTAL",
      playerId: "P1",
      accept: true,
      roomId: "R35",
    });
    expect(s.blackMirror.rooms.R01.portalPair).toBe(
      s.blackMirror.rooms.R35.portalPair,
    );
    s.players[0].room = "R02";
    s.turn = 5;
    beginHeroTurn(s);
    s = reduce(s, {
      type: "SPELL_PORTAL",
      playerId: "P1",
      accept: true,
      roomId: "R34",
    });
    expect(
      Object.values(s.blackMirror.rooms).filter((r) => r.portal),
    ).toHaveLength(4);
    expect(s.blackMirror.rooms.R02.portalPair).not.toBe(
      s.blackMirror.rooms.R01.portalPair,
    );
    s.rules.spellPolicies.portalTokenSupply = 5;
    s.players[0].room = "R03";
    s.turn = 7;
    beginHeroTurn(s);
    expect(s.spells.portalOffer).toBeNull();
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
});
