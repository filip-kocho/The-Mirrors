import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  capacities,
  movement,
  loadSave,
  assertState,
  planTransfer,
  type State,
  type Token,
} from "../src/game/domain/engine";
import { items } from "../src/game/cards/items";
import { byId } from "../src/game/cards/catalog";
import { validElementPayment } from "../src/game/systems/elementPayment";
import { automaticLearningPlan } from "../src/game/systems/spells";
import {
  gainCourage,
  loseCourage,
  arriveOcculdor,
} from "../src/game/systems/courage";
import {
  isImmobilized,
  mutableStatus,
  beginHeroTurn,
  visitRoom,
} from "../src/game/systems/blackMirrorRuntime";
import { resolveCompanionConflicts } from "../src/game/systems/companionConflicts";
import {
  kaleidoscopeCells,
  legalCell,
  placementReward,
} from "../src/game/map/kaleidoscopeCells";
import { hasItemEffect, rewardFor } from "../src/game/systems/itemAccess";
import { prerequisiteTool } from "../src/game/cards/toolPrerequisites";
function fixture() {
  const s = initialState(["A", "B"], "items-v03");
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = structuredClone(r.findings);
  }
  const all = Object.values(s.rooms).flatMap((r) => r.objects);
  for (const r of Object.values(s.rooms)) r.objects = [];
  s.rooms.Hall.objects = all;
  s.players[0].room = "R01";
  return s;
}
function card(
  s: State,
  id: string,
  target = id.startsWith("IT-") ? s.players[0].inventory : s.rooms.R01.objects,
) {
  const c = byId[id];
  s.decks[c.family] = s.decks[c.family].filter((x) => x !== id);
  const t: Token = { id, card: id, kind: c.family as Token["kind"] };
  target.push(t);
  return t;
}
function physical(s: State, id: string, target = s.rooms.R01.objects) {
  const at = s.rooms.Hall.objects.findIndex((t) => t.id === id);
  if (at < 0) throw Error(id);
  const t = s.rooms.Hall.objects.splice(at, 1)[0];
  target.push(t);
  return t;
}
function use(s: State, id: string, ids: string[] = []) {
  return reduce(s, {
    type: "USE_ITEM",
    playerId: s.players[s.active].id,
    itemId: id,
    ids,
    round: s.items.round,
    turn: s.turn,
  });
}
function pair(s: State) {
  physical(s, "WM-01");
  physical(s, "BM-01");
  return reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-01",
    blackId: "BM-01",
  });
}
function equipSpell(s: State, id = "SP-01") {
  card(s, id, s.players[0].inventory);
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = id;
}
describe("all 25 revised Item abilities", () => {
  it("keeps IDs and counts but does not map obsolete Tool names onto unrelated Items", () => {
    expect(items).toHaveLength(25);
    expect(new Set(items.map((c) => c.id)).size).toBe(25);
    expect(items.filter((c) => c.subtype === "Equipment")).toHaveLength(10);
    expect(items.filter((c) => c.subtype === "Tool")).toHaveLength(9);
    expect(items.filter((c) => c.subtype === "Relic")).toHaveLength(6);
    const spells = Object.values(byId).filter(
      (c) => typeof c.tool_requirement === "string",
    );
    expect(spells).toHaveLength(15);
    for (const c of spells)
      expect(prerequisiteTool(c.tool_requirement as string)).toBeUndefined();
  });
  it.each([
    ["IT-01", "elements", 5],
    ["IT-02", "items", 3],
    ["IT-03", "mirrors", 3],
    ["IT-24", "relics", 2],
  ] as const)("%s expands capacity only when carried", (id, slot, n) => {
    const s = fixture(),
      t = card(s, id);
    expect(capacities([], [t])[slot]).toBe(capacities([])[slot]);
    expect(capacities([t])[slot]).toBe(n);
    expect(capacities([t], [t])[slot]).toBe(n);
    if (id === "IT-02") expect(capacities([t]).relics).toBe(2);
  });
  it("IT-04 offers 0..3 extra movement without bypassing Paralysis", () => {
    let s = fixture();
    card(s, "IT-04");
    expect(movement(s)).toBe(5);
    s = reduce(s, { type: "SET_BOOTS", playerId: "P1", bonus: 1 });
    expect(movement(s)).toBe(3);
    mutableStatus(s, "P1").paralysis.push("test");
    expect(() =>
      reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] }),
    ).toThrow();
    expect(() =>
      reduce(s, { type: "SET_BOOTS", playerId: "P1", bonus: 4 }),
    ).toThrow();
  });
  it("IT-05 substitutes Aether once and never duplicates a token", () => {
    const s = fixture();
    card(s, "IT-05");
    physical(s, "E-Aether-1");
    expect(validElementPayment(s, ["Water"], ["E-Aether-1"])).toBe(true);
    expect(
      validElementPayment(s, ["Water", "Fire"], ["E-Aether-1", "E-Aether-1"]),
    ).toBe(false);
    expect(validElementPayment(s, ["Water", "Fire"], ["E-Aether-1"])).toBe(
      false,
    );
  });
  it.each([
    ["IT-06", "Earth"],
    ["IT-07", "Fire"],
  ] as const)("%s doubles matching physical tokens and Air", (id, el) => {
    const s = fixture();
    card(s, id);
    physical(s, "E-" + el + "-1");
    physical(s, "E-Air-1");
    expect(
      validElementPayment(
        s,
        [el, el, "Air", "Air"],
        ["E-" + el + "-1", "E-Air-1"],
      ),
    ).toBe(true);
  });
  it("IT-06 + IT-07 overlap defaults to two, with explicit additive variant", () => {
    const s = fixture();
    card(s, "IT-06");
    card(s, "IT-07");
    physical(s, "E-Air-1");
    expect(
      validElementPayment(s, ["Air", "Air", "Air", "Air"], ["E-Air-1"]),
    ).toBe(false);
    s.rules.itemPolicies.airStacking = "SUM";
    expect(
      validElementPayment(s, ["Air", "Air", "Air", "Air"], ["E-Air-1"]),
    ).toBe(true);
  });
  it("IT-08 adds three placement Courage and two encounter loss, not Fear tokens", () => {
    let s = fixture();
    card(s, "IT-08");
    s = pair(s);
    expect(s.players[0].courage).toBe(15);
    expect(rewardFor(s, "FRAGMENT")).toBe(3);
    s.occuldor = "Hall";
    s = reduce(s, { type: "COLLIDE", playerId: "P1" });
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    const before = s.players[0].courage;
    s = reduce(s, {
      type: "PLACE",
      playerId: "P1",
      cell: kaleidoscopeCells.find((c) => c.isEdge)!.id,
    });
    expect(s.players[0].courage).toBe(before + 4);
  });
  it("IT-09 rewards genuine discovery once, never recruitment", () => {
    let s = fixture();
    card(s, "IT-09");
    const w = Object.values(byId).find(
      (c) => c.family === "White Mirror" && c.slots?.includes("Companion"),
    )!;
    physical(s, w.id);
    physical(s, "BM-01");
    s = reduce(s, {
      type: "PLACE_MIRRORS",
      playerId: "P1",
      whiteId: w.id,
      blackId: "BM-01",
    });
    expect(s.players[0].courage).toBe(20);
    const c = s.players[0].companions.pop()!;
    s.rooms.R01.objects.push(c);
    s = reduce(s, { type: "RECRUIT", playerId: "P1", tokenId: c.id });
    expect(s.players[0].courage).toBe(20);
  });
  it("IT-10 waives the chosen contribution but retains Tool and Knowledge requirements", () => {
    let s = fixture();
    card(s, "IT-10");
    card(s, "SP-18");
    card(s, "IT-11");
    physical(s, "E-Air-1");
    s.players[0].knowledge[0] = true;
    expect(() =>
      reduce(s, { type: "LEARN", playerId: "P1", spellId: "SP-18" }),
    ).toThrow("Choose");
    s = reduce(s, {
      type: "LEARN",
      playerId: "P1",
      spellId: "SP-18",
      discount: "Fire",
      elementIds: ["E-Air-1"],
    });
    expect(s.spentElements.map((t) => t.id)).toEqual(["E-Air-1"]);
    expect(s.players[0].spellSlots[0]).toBe("SP-18");
    const z = fixture();
    card(z, "IT-10");
    card(z, "SP-01");
    expect(() => automaticLearningPlan(z, "SP-01")).toThrow("unlocked");
    z.players[0].knowledge[0] = true;
    expect(automaticLearningPlan(z, "SP-01").elementIds).toEqual([]);
  });
  it("IT-11 consumes a local Element and can be used by each hero once per round", () => {
    let s = fixture();
    card(s, "IT-11");
    physical(s, "E-Air-1");
    physical(s, "E-Air-2");
    s = use(s, "IT-11", ["E-Air-1"]);
    expect(s.players[0].courage).toBe(20);
    expect(() => use(s, "IT-11", ["E-Air-2"])).toThrow("round");
    s.moved = true;
    s = reduce(s, { type: "END", playerId: "P1" });
    s = reduce(s, { type: "REVEAL", playerId: "P2" });
    s.players[1].room = "R01";
    s.players[1].inventory.push(
      ...s.players[0].inventory.splice(
        s.players[0].inventory.findIndex((t) => t.id === "IT-11"),
        1,
      ),
    );
    s = use(s, "IT-11", ["E-Air-2"]);
    expect(s.items.round).toBe(1);
    s.moved = true;
    s = reduce(s, { type: "END", playerId: "P2" });
    expect(s.items.round).toBe(2);
    s = reduce(s, { type: "REVEAL", playerId: "P1" });
    s.players[0].inventory.push(
      ...s.players[1].inventory.splice(
        s.players[1].inventory.findIndex((t) => t.id === "IT-11"),
        1,
      ),
    );
    physical(s, "E-Air-3");
    expect(use(s, "IT-11", ["E-Air-3"]).players[0].courage).toBe(22);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("IT-12 leaves exactly two carried mirrors before movement and prevents replacement", () => {
    let s = fixture();
    card(s, "IT-12");
    physical(s, "WM-01", s.players[0].inventory);
    physical(s, "BM-01", s.players[0].inventory);
    physical(s, "WM-02");
    const before = structuredClone(s);
    expect(() => use(s, "IT-12", ["WM-01", "WM-02"])).toThrow();
    expect(s).toEqual(before);
    s = use(s, "IT-12", ["WM-01", "BM-01"]);
    expect(s.players[0].courage).toBe(20);
    expect(() => planTransfer(s, "WM-02", "take")).toThrow("until");
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] });
    expect(s.items.restrictions.P1).toBeUndefined();
    const late = fixture();
    card(late, "IT-12");
    late.moved = true;
    expect(() => use(late, "IT-12", [])).toThrow("before");
  });
  it("IT-13 discards an Item and persists a lost-capacity selection", () => {
    let s = fixture();
    card(s, "IT-13");
    card(s, "IT-01", s.players[0].inventory);
    for (let i = 1; i <= 5; i++)
      physical(s, "E-Air-" + i, s.players[0].inventory);
    expect(() => use(s, "IT-13", ["IT-13"])).toThrow();
    s = use(s, "IT-13", ["IT-01"]);
    expect(s.removed.some((t) => t.id === "IT-01")).toBe(true);
    expect(s.blackMirror.resolution?.phase).toBe("item");
    s = loadSave(JSON.stringify(s));
    while (s.blackMirror.resolution?.choice) {
      const c = s.blackMirror.resolution.choice;
      s = reduce(s, {
        type: "CURSE_CHOICE",
        playerId: "P1",
        choiceId: c.id,
        ids: [c.options[0].id],
      });
    }
    expect(
      s.players[0].inventory.filter((t) => t.kind === "Element"),
    ).toHaveLength(3);
    expect(s.players[0].courage).toBe(21);
  });
  it("IT-14 removes a learned Spell and its bindings without relocking Knowledge", () => {
    let s = fixture();
    card(s, "IT-14");
    equipSpell(s);
    s.blackMirror.bindings["SP-01"] = ["Scarlet"];
    s = use(s, "IT-14", ["SP-01"]);
    expect(s.removed.some((t) => t.id === "SP-01")).toBe(true);
    expect(s.blackMirror.spentSigils).toEqual(["Scarlet"]);
    expect(s.players[0].knowledge[0]).toBe(true);
    expect(s.players[0].spellSlots[0]).toBeNull();
    expect(s.players[0].courage).toBe(21);
  });
  it("IT-15 sacrifices only an owned free Sigil", () => {
    let s = fixture();
    card(s, "IT-15");
    s.players[0].sigils = ["Amber"];
    equipSpell(s);
    s.blackMirror.bindings["SP-01"] = ["Scarlet"];
    expect(() => use(s, "IT-15", ["SP-01"])).toThrow();
    s = use(s, "IT-15", ["sigil:0"]);
    expect(s.players[0].sigils).toEqual([]);
    expect(s.blackMirror.bindings["SP-01"]).toEqual(["Scarlet"]);
    expect(s.blackMirror.spentSigils).toEqual(["Amber"]);
    expect(s.players[0].courage).toBe(21);
  });
  it("IT-16 removes only the selected private Secret without exposing its identity", () => {
    let s = fixture();
    card(s, "IT-16");
    s.players[0].secrets = ["SE-01", "SE-02"];
    s.decks.Secret = s.decks.Secret.filter(
      (id) => !s.players[0].secrets.includes(id),
    );
    s = use(s, "IT-16", ["SE-01"]);
    expect(s.players[0].secrets).toEqual(["SE-02"]);
    expect(s.players[0].courage).toBe(20);
    expect(s.log.at(-1)?.text).not.toContain("SE-01");
  });
  it("IT-17 leaves Loyal and Stray Companions, blocks replacement and prevents following on departure", () => {
    let s = fixture();
    card(s, "IT-17");
    expect(() => use(s, "IT-17")).toThrow("Companion");
    const t = card(s, "CO-01", s.players[0].companions);
    t.behavior = "STRAY";
    s = use(s, "IT-17");
    expect(s.players[0].courage).toBe(20);
    expect(() =>
      reduce(s, { type: "RECRUIT", playerId: "P1", tokenId: t.id }),
    ).toThrow("departure");
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] });
    expect(s.players[0].companions).toHaveLength(0);
    expect(s.rooms.R01.objects.some((x) => x.id === t.id)).toBe(true);
  });
  it("IT-18 spends Courage, moves Occuldor and punishes all present heroes without Rage", () => {
    let s = fixture();
    card(s, "IT-18");
    card(s, "IT-20");
    s.players[1].room = "R02";
    s = use(s, "IT-18", ["R02"]);
    expect(s.players[0].courage).toBe(17);
    expect(s.players[1].courage).toBe(17);
    expect(s.occuldor).toBe("R02");
    expect(s.rage).toBe(0);
  });
  it("IT-19 permanently sacrifices an attached Companion", () => {
    let s = fixture();
    card(s, "IT-19");
    card(s, "CO-01", s.players[0].companions);
    s = use(s, "IT-19", ["CO-01"]);
    expect(s.players[0].companions).toEqual([]);
    expect(s.removed.some((t) => t.id === "CO-01")).toBe(true);
    expect(s.players[0].courage).toBe(21);
  });
  it("IT-20 reduces each penalty once, including encounters, but not costs or unavoidable loss", () => {
    const s = fixture();
    card(s, "IT-20");
    expect(loseCourage(s, "P1", 4)).toBe(3);
    expect(loseCourage(s, "P1", 1)).toBe(0);
    expect(loseCourage(s, "P1", 1, { cost: true })).toBe(1);
    expect(loseCourage(s, "P1", 2, { unpreventable: true })).toBe(2);
    const before = s.players[0].courage;
    arriveOcculdor(s, "R01");
    expect(s.players[0].courage).toBe(before);
    card(s, "IT-08");
    arriveOcculdor(s, "R01");
    expect(s.players[0].courage).toBe(before - 2);
  });
  it("IT-21 grants once per successful pair and not a rejected repeat", () => {
    let s = fixture();
    card(s, "IT-21");
    s = pair(s);
    expect(s.players[0].courage).toBe(18);
    const before = structuredClone(s);
    expect(() =>
      reduce(s, {
        type: "PLACE_MIRRORS",
        playerId: "P1",
        whiteId: "WM-01",
        blackId: "BM-01",
      }),
    ).toThrow();
    expect(s).toEqual(before);
  });
  it("IT-22 suppresses Paralysis without deleting tokens, which return when access is lost", () => {
    let s = fixture();
    card(s, "IT-22");
    mutableStatus(s, "P1").paralysis = ["paralysis-1", "paralysis-2"];
    expect(isImmobilized(s, "P1")).toBe(false);
    expect(movement(s)).toBe(3);
    beginHeroTurn(s);
    expect(mutableStatus(s, "P1").paralysis).toHaveLength(1);
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] });
    s = reduce(s, {
      type: "TRANSFER",
      playerId: "P1",
      tokenId: "IT-22",
      direction: "leave",
    });
    expect(isImmobilized(s, "P1")).toBe(true);
  });
  it("IT-23 permits an isolated inner cell with no fabricated adjacency bonus", () => {
    const s = fixture();
    card(s, "IT-23");
    const cell = kaleidoscopeCells.find((c) => !c.isEdge)!.id;
    expect(legalCell(s.mosaic, cell)).toBe(false);
    expect(legalCell(s.mosaic, cell, hasItemEffect(s, "FREE_FRAGMENT"))).toBe(
      true,
    );
    expect(placementReward(s.mosaic, cell, "Amber", true)).toBe(1);
    s.mosaic[cell] = "Amber";
    expect(legalCell(s.mosaic, cell, true)).toBe(false);
  });
  it("IT-24 rewards actual new permanent commitments exactly once and keeps bindings on reload", () => {
    let s = fixture();
    card(s, "IT-24");
    const spell = Object.values(byId).find((c) =>
      c.casting_modes?.some((m) => m.name.toUpperCase() === "PERMANENT"),
    )!;
    equipSpell(s, spell.id);
    const index = spell.casting_modes!.findIndex(
        (m) => m.name.toUpperCase() === "PERMANENT",
      ),
      colors = spell.casting_modes![index].sigil_slots;
    s.players[0].sigils = [...colors];
    s = reduce(s, {
      type: "BIND_SIGILS",
      playerId: "P1",
      spellId: spell.id,
      action: index,
    });
    expect(s.players[0].courage).toBe(Math.min(35, 18 + colors.length * 3));
    expect(s.players[0].sigils).toEqual([]);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
    expect(() =>
      reduce(s, {
        type: "BIND_SIGILS",
        playerId: "P1",
        spellId: spell.id,
        action: index,
      }),
    ).toThrow();
  });
  it("IT-25 suppresses conflicts but preserves normal Stray transfer", () => {
    const s = fixture();
    card(s, "CO-01", s.players[0].companions);
    card(s, "CO-07", s.players[0].companions);
    const unprotected = structuredClone(s);
    resolveCompanionConflicts(unprotected, unprotected.players[0]);
    expect(unprotected.players[0].companions.map((t) => t.id)).toEqual([
      "CO-07",
    ]);
    card(s, "IT-25");
    resolveCompanionConflicts(s, s.players[0]);
    expect(s.players[0].companions).toHaveLength(2);
    // Rex stays Loyal; Mad Mara is a Stray.
    s.players[1].room = "R01";
    visitRoom(s, s.players[1], "Hall");
    expect(s.players[1].companions.map((t) => t.id)).toContain("CO-07");
  });
  it("rejects stale, duplicate and foreign costs without mutating state", () => {
    const s = fixture();
    card(s, "IT-11");
    physical(s, "E-Air-1", s.players[1].inventory);
    const before = structuredClone(s);
    expect(() => use(s, "IT-11", ["E-Air-1"])).toThrow();
    expect(() =>
      reduce(s, {
        type: "USE_ITEM",
        playerId: "P1",
        itemId: "IT-11",
        ids: [],
        round: 9,
        turn: 1,
      }),
    ).toThrow();
    expect(s).toEqual(before);
    assertState(s);
  });
  it("Prism and Conduit validate combined contributions from carried cards", () => {
    const s = fixture();
    card(s, "IT-05");
    card(s, "IT-06");
    physical(s, "E-Air-1");
    physical(s, "E-Aether-1");
    expect(
      validElementPayment(s, ["Air", "Air", "Fire"], ["E-Air-1", "E-Aether-1"]),
    ).toBe(true);
  });
  it("permanent commitments obey Seals and exact colors; action-granularity rewards remain configurable", () => {
    let s = fixture();
    card(s, "IT-24");
    const spell = Object.values(byId).find((c) =>
      c.casting_modes?.some(
        (m) => m.name.toUpperCase() === "PERMANENT" && m.sigil_slots.length > 1,
      ),
    )!;
    equipSpell(s, spell.id);
    const action = spell.casting_modes!.findIndex(
        (m) => m.name.toUpperCase() === "PERMANENT",
      ),
      mode = spell.casting_modes![action];
    s.players[0].sigils = [...mode.sigil_slots];
    s.blackMirror.seals.push({
      id: "seal-1",
      owner: "P1",
      spell: spell.id,
      scope: "PERMANENT",
    });
    const command = {
      type: "BIND_SIGILS" as const,
      playerId: "P1",
      spellId: spell.id,
      action,
    };
    expect(() => reduce(s, command)).toThrow("sealed");
    s.blackMirror.seals = [];
    s.rules.itemPolicies.permanentReward = "ACTION";
    s = reduce(s, command);
    expect(s.players[0].courage).toBe(21);
    expect(s.blackMirror.bindings[spell.id]).toEqual(mode.sigil_slots);
  });
  it("Locket protects only its holder when Mamba arrives and never prevents a Tool sacrifice", () => {
    let s = fixture();
    card(s, "IT-25", s.players[0].inventory);
    s.players[1].room = "R01";
    card(s, "CO-01", s.players[0].companions);
    card(s, "CO-09", s.players[1].companions);
    card(s, "CO-08", s.players[0].companions);
    resolveCompanionConflicts(s, s.players[0], "CO-08");
    expect(s.players[0].companions.map((t) => t.id)).toContain("CO-01");
    expect(s.players[1].companions).toEqual([]);
    card(s, "IT-19");
    s = use(s, "IT-19", ["CO-01"]);
    expect(s.removed.some((t) => t.id === "CO-01")).toBe(true);
  });
  it("Companion conflict destination is explicit and configurable", () => {
    const s = fixture();
    card(s, "CO-07", s.players[0].companions);
    card(s, "CO-01", s.players[0].companions);
    s.rules.companionPolicies.flee = "STAY";
    resolveCompanionConflicts(s, s.players[0], "CO-07");
    expect(s.rooms.R01.objects.map((t) => t.id)).toContain("CO-01");
  });
  it("a room Locket protects nobody; taking it protects only the holder", () => {
    const s = fixture();
    card(s, "IT-25", s.rooms.R01.objects);
    card(s, "CO-01", s.players[0].companions);
    card(s, "CO-07", s.players[0].companions);
    resolveCompanionConflicts(s, s.players[0]);
    expect(s.players[0].companions.map((t) => t.id)).toEqual(["CO-07"]);
  });
  it("migrates old saves and rejects impossible usage owners", () => {
    const s = fixture(),
      old = JSON.parse(JSON.stringify(s));
    delete old.items;
    delete old.rules.itemPolicies;
    expect(loadSave(JSON.stringify(old)).items.round).toBe(1);
    s.items.used.ghost = { "IT-11": 1 };
    expect(() => loadSave(JSON.stringify(s))).toThrow("ledger");
  });
});
