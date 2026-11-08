import {takeSigils,discardSigils} from "../src/game/systems/sigils";
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
import { byId, cards, colors } from "../src/game/cards/catalog";
import { spellAdapters } from "../src/game/cards/spellEffects";
import {
  availableSigils,
  grantSigil,
  returnQuickSigils,
} from "../src/game/systems/sigils";
import {
  spellActivationPlan,
  visibleSpellColors,
} from "../src/game/systems/spellActivation";
import {
  abandonSpell,
  beginHeroTurn,
  mutableStatus,
  isImmobilized,
  beginEffects,
  advanceEffects,
} from "../src/game/systems/blackMirrorRuntime";
import {
  hasSpell,
  activePermanent,
  spellFragmentBonus,
  roomActionsBlocked,
} from "../src/game/systems/spellModifiers";
import { loseCourage } from "../src/game/systems/courage";
import { inventoryCapacities } from "../src/game/systems/inventoryCapacity";
import { roomGraph } from "../src/game/map/roomGraph";
import { connections, connectionId } from "../src/game/map/castleConnections";
import {
  legalCell,
  kaleidoscopeGems,
  kaleidoscopeCells,
  closingGems,
  placementReward,
} from "../src/game/map/kaleidoscopeCells";
import { assignPortals, portalSupply } from "../src/game/systems/portals";
import {
  itemActionPlan,
  applyItemAction,
} from "../src/game/systems/itemActions";
import { accessibleItems } from "../src/game/systems/itemAccess";
import {
  validElementPayment,
  findElementPayment,
} from "../src/game/systems/elementPayment";
import { resolveCompanionConflicts } from "../src/game/systems/companionConflicts";
const near = roomGraph.R01.neighbors.find((id) => id !== "Hall")!;
function fixture(id = "SP-01", action = 0) {
  const s = initialState(["Rowan", "Elara", "Morgan"], "spells-v04");
  // These existing effect tests isolate colored payment; Wild lifecycle has dedicated v0.6 tests.
  discardSigils(s,takeSigils(s,"P1",["WILD-P1"]));
  const all = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(all);
  s.players[0].room = "R01";
  s.players[1].room = "R01";
  s.players[0].courage = 18;
  equip(s, id);
  fund(s, id, action);
  return s;
}
function equip(s: State, id: string) {
  const p = s.players[0],
    slot = p.spellSlots.indexOf(null);
  s.decks.Spell = s.decks.Spell.filter((c) => c !== id);
  p.inventory.push({ id, card: id, kind: "Spell" });
  p.spellSlots[slot] = id;
  p.knowledge[slot] = true;
}
function fund(s: State, id: string, action = 0) {
  for (const c of byId[id].casting_modes![action].sigil_slots)
    grantSigil(s, "P1", c);
}
function physical(
  s: State,
  id: string,
  target: Token[] = s.players[0].inventory,
) {
  const source = s.rooms.Hall.objects,
    i = source.findIndex((t) => t.id === id);
  if (i < 0) throw Error(`Missing ${id}`);
  target.push(...source.splice(i, 1));
}
function add(s: State, id: string, target: Token[] = s.players[0].inventory) {
  s.decks[byId[id].family] = s.decks[byId[id].family].filter((c) => c !== id);
  target.push({
    id,
    card: id,
    kind: byId[id].family as Token["kind"],
    ...(id.startsWith("CO-")
      ? { behavior: "LOYAL" as const, discoverer: "P2" }
      : {}),
  });
}
function cast(s: State, id: string, action = 0, targets: string[] = []) {
  return reduce(s, {
    type: "CAST_SPELL",
    playerId: "P1",
    spellId: id,
    action,
    sigilIds: spellActivationPlan(s, id, action, targets).selected,
    targets,
  });
}
function permanent(id: string) {
  return cast(fixture(id, 1), id, 1);
}
function prepare(i: number) {
  const id = `SP-${String(i).padStart(2, "0")}`,
    s = fixture(id),
    status = mutableStatus(s, "P1");
  let targets: string[] = [];
  if ([1, 9, 14, 26].includes(i)) {
    status.fear = [
      { id: "fear-a", origin: "R35" },
      { id: "fear-b", origin: "R35" },
    ];
    targets = ["fear-a"];
    if (i === 9) targets.push("fear-b");
    if (i === 26) targets = ["P1"];
  }
  if ([3, 18].includes(i)) {
    status.hexlocks = [{ id: "lock-a", slot: "elements", category: "ELEMENT" }];
    targets = ["lock-a"];
    if (i === 18) {
      status.paralysis = ["paralysis"];
      status.immobilized = true;
      targets.push("paralysis");
    }
  }
  if ([4, 12, 22].includes(i)) {
    s.blackMirror.rooms[near] = { darkness: 2, portal: false };
    targets = [near];
  }
  if (i === 5) {
    physical(s, "WM-01", s.rooms[near].objects);
    targets = ["WM-01"];
  }
  if (i === 6) {
    physical(s, "WM-01");
    physical(s, "BM-01", s.rooms[near].objects);
    targets = ["WM-01", near];
  }
  if ([7, 11, 17].includes(i)) {
    physical(s, "E-Air-1", s.rooms[near].objects);
    targets = ["E-Air-1"];
    if (i === 17) {
      physical(s, "E-Water-1", s.rooms[near].objects);
      targets.push("E-Water-1");
    }
  }
  if (i === 8) {
    physical(s, "E-Fire-1");
    targets = ["E-Fire-1"];
  }
  if (i === 10) {
    s.rooms.R35.explored = false;
    s.rooms.R35.findings = [];
    targets = ["R35"];
  }
  if (i === 13) {
    physical(s, "BM-01");
    targets = ["BM-01"];
  }
  if (i === 15) {
    physical(s, "E-Fire-1");
    physical(s, "E-Water-1", s.rooms.R35.objects);
    targets = ["E-Fire-1", "E-Water-1"];
  }
  if ([16, 25].includes(i)) {
    equip(s, "SP-02");
    s.blackMirror.seals = [
      { id: "seal-a", owner: "P1", spell: "SP-02", scope: "ALL" },
      { id: "seal-b", owner: "P1", spell: "SP-02", scope: "ALL" },
    ];
    targets = ["seal-a"];
    if (i === 25) targets.push("seal-b");
  }
  if ([2, 19, 20, 21, 27, 30, 35].includes(i)) {
    targets = [near];
    if (i === 21) s.blackMirror.thresholds.push(connectionId("R01", near));
  }
  if (i === 23) {
    add(s, "CO-01", s.rooms[near].objects);
    targets = ["CO-01"];
  }
  if (i === 24) {
    add(s, "IT-11");
    physical(s, "E-Fire-1");
    (s.items.used.P1 ??= {})["IT-11"] = s.items.round;
    targets = ["IT-11", "cost:E-Fire-1"];
  }
  if (i === 28) {
    s.mosaic[0] = "Scarlet";
    s.rage = 1;
    s.rooms.R35.restored = true;
    physical(s, "BM-01", s.removed);
    physical(s, "WM-01", s.removed);
    targets = [spellActivationPlan(s, id, 0).choices[0].id];
  }
  if (i === 29) {
    equip(s, "SP-01");
    grantSigil(s, "P1", "Scarlet");
    const t = availableSigils(s).at(-1)!;
    s.players[0].sigils.pop();
    s.spells.availableIds.P1.pop();
    s.spells.quick.push({
      id: "old",
      owner: "P1",
      spell: "SP-01",
      action: 0,
      turn: s.turn,
      sigils: [t],
    });
    targets = [t.id];
  }
  if (i === 31) targets = ["R35"];
  if (i === 32) targets = [near];
  if (i === 33) {
    add(s, "CO-01", s.players[1].companions);
    targets = ["CO-01"];
  }
  if (i === 34) {
    physical(s, "WM-01", s.rooms[near].objects);
    physical(s, "BM-01", s.rooms.R35.objects);
    targets = ["WM-01", "BM-01"];
  }
  return { s, id, targets };
}

describe("all 35 v0.4 Spells", () => {
  it("retains exact costs and 70 fully implemented configurations", () => {
    expect(cards.filter((c) => c.family === "Spell")).toHaveLength(35);
    expect(Object.values(spellAdapters).flat()).toHaveLength(70);
    expect(
      Object.values(spellAdapters)
        .flat()
        .every((a) => !!a.operation && !a.unavailable),
    ).toBe(true);
  });
  for (let i = 1; i <= 35; i++) {
    const id = `SP-${String(i).padStart(2, "0")}`;
    it(`${id} Quick resolves immediately, rejects stale targets atomically and preserves physical resources`, () => {
      const { s, targets } = prepare(i),
        before = structuredClone(s);
      expect(() => cast(s, id, 0, ["invalid"])).toThrow();
      expect(s).toEqual(before);
      const next = cast(s, id, 0, targets);
      assertState(next);
      expect(next.spells.quick.some((q) => q.spell === id)).toBe(true);
      expect(next.spells.usage[`quick:P1:${id}`]).toBe(s.turn);
      expect(() => cast(next, id, 0, targets)).toThrow();
      if ([1, 4].includes(i)) expect(next.players[0].courage).toBe(19);
      if ([8, 13].includes(i)) {
        expect(next.players[0].courage).toBe(21);
        expect(next.rooms.R01.objects.some((t) => t.id === targets[0])).toBe(
          true,
        );
      }
      if ([2, 19, 20, 21, 27, 30, 35].includes(i)) {
        expect(next.players[0].room).toBe(near);
        expect(next.moved).toBe(false);
      }
      if ([5, 7, 11, 17].includes(i))
        for (const id of targets)
          expect(next.rooms.R01.objects.some((t) => t.id === id)).toBe(true);
      if (i === 6) {
        expect(next.rooms[near].pair.map((t) => t.id).sort()).toEqual([
          "BM-01",
          "WM-01",
        ]);
        expect(next.occuldor).toBe(near);
        expect(next.players[0].room).toBe("R01");
      }
      if ([9, 26].includes(i))
        expect(next.blackMirror.heroes.P1.fear).toHaveLength(0);
      if ([3, 18].includes(i))
        expect(next.blackMirror.heroes.P1.hexlocks).toHaveLength(0);
      if (i === 10) {
        expect(next.spells.visions.P1).toContain("R35");
        expect(next.rooms.R35.explored).toBe(false);
      }
      if ([12, 4].includes(i))
        expect(next.blackMirror.rooms[near].darkness).toBe(1);
      if (i === 22) expect(next.blackMirror.rooms[near].darkness).toBe(0);
      if (i === 15) {
        expect(
          next.players[0].inventory.some((t) => t.id === "E-Water-1"),
        ).toBe(true);
        expect(next.rooms.R35.objects.some((t) => t.id === "E-Fire-1")).toBe(
          true,
        );
      }
      if (i === 16) expect(next.blackMirror.seals).toHaveLength(1);
      if (i === 25) expect(next.blackMirror.seals).toHaveLength(0);
      if ([23, 33].includes(i)) {
        expect(next.players[0].companions[0].id).toBe("CO-01");
        expect(next.players[0].companions[0].originalDiscoverer).toBe("P2");
        expect(next.players[0].companions[0].discoverer).toBe("P1");
      }
      if (i === 24) {
        expect(next.spentElements.some((t) => t.id === "E-Fire-1")).toBe(true);
        expect(next.players[0].courage).toBeGreaterThan(18);
      }
      if (i === 28) {
        expect(next.mosaic.filter(Boolean)).toHaveLength(1);
        expect(next.players[0].courage).toBe(18);
        expect(next.rage).toBe(1);
      }
      if (i === 29) {
        expect(availableSigils(next).some((t) => t.id === targets[0])).toBe(
          true,
        );
        expect(next.spells.quick.some((q) => q.id === "old")).toBe(false);
      }
      if (i === 31) expect(next.occuldor).toBe("R35");
      if (i === 32) {
        expect(portalSupply(next)).toBe(portalSupply(s) - 2);
        expect(next.blackMirror.rooms.R01.portalPair).toBe(
          next.blackMirror.rooms[near].portalPair,
        );
      }
      if (i === 34) {
        expect(next.rooms.R01.pair).toHaveLength(2);
        expect(next.rage).toBe(0);
      }
    });
    it(`${id} Permanent binds, persists, suppresses under Seals and discards on abandonment`, () => {
      const s = permanent(id),
        ids = [...s.spells.permanentIds[id]];
      expect(activePermanent(s, "P1", id)).toBe(true);
      expect(hasSpell(s, spellAdapters[id][1].operation)).toBe(true);
      s.turn = 4;
      beginHeroTurn(s);
      expect(s.players[0].sigils).toHaveLength(0);
      expect(activePermanent(s, "P1", id)).toBe(true);
      s.blackMirror.seals.push({
        id: "seal",
        owner: "P1",
        spell: id,
        scope: "PERMANENT",
      });
      expect(activePermanent(s, "P1", id)).toBe(false);
      s.blackMirror.seals = [];
      expect(activePermanent(s, "P1", id)).toBe(true);
      expect(loadSave(JSON.stringify(s))).toEqual(s);
      abandonSpell(s, s.players[0], id);
      expect(activePermanent(s, "P1", id)).toBe(false);
      expect(s.spells.spentIds).toEqual(["WILD-P1",...ids]);
      assertState(s);
    });
  }
  it("Quick returns only at the original owner's next start even after Spell abandonment", () => {
    const { s, id, targets } = prepare(1);
    let next = cast(s, id, 0, targets);
    const ids = next.spells.quick[0].sigils.map((t) => t.id);
    abandonSpell(next, next.players[0], id);
    next.turn = 2;
    next.active = 1;
    beginHeroTurn(next);
    expect(next.players[0].sigils).toHaveLength(0);
    next = loadSave(JSON.stringify(next));
    next.turn = 4;
    next.active = 0;
    beginHeroTurn(next);
    expect(availableSigils(next).map((t) => t.id)).toEqual(ids);
    beginHeroTurn(next);
    expect(availableSigils(next)).toHaveLength(1);
  });
  it("distinct-color and duplicate physical ID validation is atomic", () => {
    const { s, id, targets } = prepare(27),
      before = structuredClone(s),
      id0 = availableSigils(s)[0].id;
    expect(() =>
      reduce(s, {
        type: "CAST_SPELL",
        playerId: "P1",
        spellId: id,
        action: 0,
        sigilIds: [id0, id0],
        targets,
      }),
    ).toThrow("distinct");
    expect(s).toEqual(before);
  });
  it("SP-35 requires the invited hero's consent and moves both once", () => {
    const { s, id } = prepare(35),
      invited = cast(s, id, 0, [near, "P2"]);
    expect(invited.spells.consent?.hero).toBe("P2");
    expect(invited.spells.quick).toHaveLength(0);
    expect(invited.players[0].room).toBe("R01");
    expect(() =>
      reduce(invited, { type: "SPELL_CONSENT", playerId: "P1", accept: true }),
    ).toThrow("invited");
    const no = reduce(invited, {
      type: "SPELL_CONSENT",
      playerId: "P2",
      accept: false,
    });
    expect(no.players[0].sigils).toEqual(s.players[0].sigils);
    const yes = reduce(loadSave(JSON.stringify(invited)), {
      type: "SPELL_CONSENT",
      playerId: "P2",
      accept: true,
    });
    expect(yes.players.slice(0, 2).map((p) => p.room)).toEqual([near, near]);
    expect(yes.spells.quick).toHaveLength(1);
    expect(() =>
      reduce(yes, { type: "SPELL_CONSENT", playerId: "P2", accept: true }),
    ).toThrow();
  });
  it("SP-29 Permanent returns one token immediately, never twice", () => {
    let s = permanent("SP-29");
    equip(s, "SP-01");
    fund(s, "SP-01");
    mutableStatus(s, "P1").fear = [{ id: "f", origin: near }];
    s = cast(s, "SP-01", 0, ["f"]);
    expect(s.players[0].sigils).toHaveLength(1);
    expect(s.spells.quick).toHaveLength(0);
    expect(() => cast(s, "SP-01", 0, ["f"])).toThrow("already used");
    s.turn = 4;
    returnQuickSigils(s, "P1");
    expect(s.players[0].sigils).toHaveLength(1);
  });
  it("mode alternatives remain exclusive until Quick assignment returns", () => {
    const { s, id, targets } = prepare(1);
    let next = cast(s, id, 0, targets);
    fund(next, id, 1);
    expect(() => cast(next, id, 1)).toThrow("alternative");
    next.rules.spellPolicies.modePolicy = "BOTH_ALLOWED";
    next = cast(next, id, 1);
    expect(next.spells.quick).toHaveLength(1);
    expect(activePermanent(next, "P1", id)).toBe(true);
  });
  it("SP-32 optional turn-start Portal uses a finite shared supply without extra Sigils", () => {
    let s = permanent("SP-32");
    s.rules.spellPolicies.portalTokenSupply = 1;
    s.turn = 4;
    beginHeroTurn(s);
    expect(s.spells.portalOffer?.owner).toBe("P1");
    s = reduce(s, { type: "SPELL_PORTAL", playerId: "P1", accept: true });
    expect(portalSupply(s)).toBe(0);
    expect(s.blackMirror.bindings["SP-32"]).toHaveLength(3);
    s.players[0].room = near;
    s.turn = 7;
    beginHeroTurn(s);
    expect(s.spells.portalOffer).toBeNull();
    expect(() => cast(prepare(32).s, "SP-32", 0, [near])).not.toThrow();
  });
  it("SP-01 and SP-26 prevent curse damage per curse, excluding Courage costs", () => {
    for (const [id, expected] of [
      ["SP-01", 1],
      ["SP-26", 2],
    ] as const) {
      const s = permanent(id);
      beginEffects(s, "BM-01", "immediate", [
        { op: "LOSS", amount: 2 },
        { op: "LOSS", amount: 3 },
      ]);
      advanceEffects(s);
      expect(s.players[0].courage).toBe(18 - 5 + expected);
      loseCourage(s, "P1", 1, { cost: true });
      expect(s.players[0].courage).toBe(17 - 5 + expected);
    }
  });
  it("SP-03, SP-22, SP-31 reduce Occuldor losses by 1, 2, and all", () => {
    for (const [id, loss] of [
      ["SP-03", 4],
      ["SP-22", 3],
      ["SP-31", 0],
    ] as const) {
      const s = permanent(id);
      loseCourage(s, "P1", 5, { occuldor: true });
      expect(s.players[0].courage).toBe(18 - loss);
    }
  });
  it("SP-02/SP-27 increase movement and SP-09 provides a Fear-only floor", () => {
    for (const [id, expected] of [
      ["SP-02", 2],
      ["SP-27", 3],
      ["SP-09", 2],
    ] as const) {
      const s = permanent(id);
      s.players[0].courage = 5;
      expect(movement(s)).toBe(expected);
      mutableStatus(s, "P1").paralysis = ["p"];
      expect(isImmobilized(s, "P1")).toBe(true);
    }
  });
  it("SP-07/SP-12/SP-15 expand the appropriate carrying field", () => {
    for (const [id, slot, expected] of [
      ["SP-07", "items", 3],
      ["SP-12", "mirrors", 3],
      ["SP-15", "elements", 4],
    ] as const) {
      const s = permanent(id);
      expect(inventoryCapacities(s.players[0].inventory, [], [], s)[slot]).toBe(
        expected,
      );
      abandonSpell(s, s.players[0], id);
      expect(inventoryCapacities(s.players[0].inventory, [], [], s)[slot]).toBe(
        expected - 1,
      );
    }
  });
  it("SP-04 ignores Darkness without removing tokens", () => {
    const s = permanent("SP-04");
    s.blackMirror.rooms.R01 = { darkness: 3, portal: false };
    expect(roomActionsBlocked(s, "R01")).toBe(false);
    expect(s.blackMirror.rooms.R01.darkness).toBe(3);
  });
  it("SP-05 substitutes Aether and SP-17 substitutes one physical Element", () => {
    for (const id of ["SP-05", "SP-17"]) {
      const s = permanent(id);
      physical(s, "E-Aether-1");
      const ids = findElementPayment(s, ["Earth"]);
      expect(ids).toEqual(["E-Aether-1"]);
      expect(validElementPayment(s, ["Earth"], ids!)).toBe(true);
      expect(validElementPayment(s, ["Earth", "Fire"], ids!)).toBe(false);
    }
  });
  it("SP-10/SP-20 reveal colors privately at the correct graph distance", () => {
    for (const id of ["SP-10", "SP-20"]) {
      const s = permanent(id);
      s.rooms[near].explored = false;
      s.rooms[near].findings = [];
      expect(visibleSpellColors(s)).toContain(near);
      expect(visibleSpellColors(s, "P2")).not.toContain(near);
    }
  });
  it("SP-11 grants adjacent Tool access without moving or duplicating it", () => {
    const s = permanent("SP-11");
    add(s, "IT-11", s.rooms[near].objects);
    physical(s, "E-Air-1");
    expect(accessibleItems(s).some((t) => t.id === "IT-11")).toBe(true);
    applyItemAction(s, "IT-11", ["E-Air-1"], s.items.round, s.turn);
    expect(s.rooms[near].objects.some((t) => t.id === "IT-11")).toBe(true);
    expect(() => itemActionPlan(s, "IT-11")).toThrow("already used");
  });
  it("SP-14/SP-35 ignore Paralysis; SP-18 removes and prevents it", () => {
    for (const id of ["SP-14", "SP-18", "SP-35"]) {
      let s = fixture(id, 1);
      mutableStatus(s, "P1").paralysis = ["old"];
      s = cast(s, id, 1);
      expect(isImmobilized(s, "P1")).toBe(false);
      expect(s.blackMirror.heroes.P1.paralysis.length).toBe(
        id === "SP-18" ? 0 : 1,
      );
      beginEffects(s, "BM-01", "immediate", [
        { op: "TOKEN", token: "PARALYSIS", count: 2 },
      ]);
      advanceEffects(s);
      expect(s.blackMirror.heroes.P1.paralysis.length).toBe(
        id === "SP-18" ? 0 : 3,
      );
    }
  });
  it("SP-16 prevents all new Seals; SP-25 prevents exactly one per effect", () => {
    for (const [id, count] of [
      ["SP-16", 0],
      ["SP-25", 1],
    ] as const) {
      const s = permanent(id);
      equip(s, "SP-02");
      beginEffects(s, "BM-27", "immediate", [
        { op: "SIGIL_SEALS", scope: "QUICK", count: 1 },
      ]);
      advanceEffects(s);
      expect(s.blackMirror.seals).toHaveLength(count);
    }
  });
  it("SP-19 accesses Portal endpoints and SP-30 connects the Hall", () => {
    const s = permanent("SP-19");
    assignPortals(s, ["R35", "R34"]);
    expect(connections(s, "R01")).toContain("R35");
    const h = permanent("SP-30");
    h.players[0].room = "R35";
    expect(connections(h, "R35")).toContain("Hall");
    expect(connections(h, "Hall")).toContain("R35");
  });
  it("SP-21/SP-35 ignore Corridor Blocks without deleting them", () => {
    for (const id of ["SP-21", "SP-35"]) {
      const s = permanent(id),
        edge = connectionId("R01", near);
      s.blackMirror.thresholds.push(edge);
      expect(connections(s, "R01")).toContain(near);
      expect(s.blackMirror.thresholds).toContain(edge);
    }
  });
  it("SP-23/SP-33 protect against forced curse abandonment; only SP-33 prevents conflicts", () => {
    for (const id of ["SP-23", "SP-33"]) {
      const s = permanent(id);
      add(s, "CO-01", s.players[0].companions);
      beginEffects(s, "BM-23", "immediate", [{ op: "COMPANIONS" }]);
      advanceEffects(s);
      expect(s.players[0].companions).toHaveLength(1);
      add(s, "CO-07", s.players[0].companions);
      resolveCompanionConflicts(s, s.players[0]);
      expect(s.players[0].companions.some((t) => t.id === "CO-01")).toBe(
        id === "SP-33",
      );
    }
  });
  it("SP-24 adds one Courage to a Tool reward without extra payment", () => {
    const s = permanent("SP-24");
    add(s, "IT-11");
    physical(s, "E-Air-1");
    const base = itemActionPlan(s, "IT-11").reward;
    applyItemAction(s, "IT-11", ["E-Air-1"], s.items.round, s.turn);
    expect(s.players[0].courage).toBe(19 + base);
  });
  it("SP-08 and SP-28 grant fragment bonuses; SP-28 allows any free cell", () => {
    for (const id of ["SP-08", "SP-28"]) {
      const s = permanent(id);
      expect(spellFragmentBonus(s, "P1")).toBe(1);
      if (id === "SP-28")
        expect(
          legalCell(
            s.mosaic,
            kaleidoscopeCells.find((c) => !c.isEdge)!.id,
            hasSpell(s, "FREE_GLASS"),
          ),
        ).toBe(true);
    }
  });
  it("SP-06 and SP-34 permit remote placement with punishment only in the target room", () => {
    for (const id of ["SP-06", "SP-34"]) {
      let s = permanent(id);
      physical(s, "WM-01");
      physical(s, "BM-01", s.rooms[near].objects);
      s.players[1].room = near;
      s = reduce(s, {
        type: "PLACE_MIRRORS",
        playerId: "P1",
        roomId: near,
        whiteId: "WM-01",
        blackId: "BM-01",
      });
      expect(s.players[0].courage).toBe(18);
      expect(s.players[1].courage).toBe(17);
      expect(s.rooms[near].pair).toHaveLength(2);
    }
  });
  it("SP-34 remotely flips through the normal curse, Sigil, Rage and restoration sequence", () => {
    let s = permanent("SP-34");
    physical(s, "WM-01", s.rooms.R35.pair);
    physical(s, "BM-01", s.rooms.R35.pair);
    s.players[1].room = "R35";
    s = reduce(s, { type: "COLLIDE", playerId: "P1", roomId: "R35" });
    expect(s.pending?.room).toBe("R35");
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    expect(s.players[0].courage).toBeLessThan(18);
    expect(s.players[1].courage).toBe(18);
    expect(s.players[0].room).toBe("R01");
    expect(s.rage).toBe(1);
    expect(s.players[0].sigils).toEqual([s.rooms.R35.color]);
    expect(s.rooms.R35.restored).toBe(true);
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    expect(s.pending).toBeNull();
    expect(s.mosaic[0]).toBe(s.rooms.R35.color);
  });
  it("SP-13 Permanent rewards a collision once, separately from fragment placement", () => {
    let s = permanent("SP-13");
    physical(s, "WM-01", s.rooms.R01.pair);
    physical(s, "BM-01", s.rooms.R01.pair);
    const baseline = structuredClone(s);
    abandonSpell(baseline, baseline.players[0], "SP-13");
    const collide = (state: State) =>
      reduce(reduce(state, { type: "COLLIDE", playerId: "P1" }), {
        type: "CONTINUE_COLLISION",
        playerId: "P1",
        penalty: "apply",
      });
    s = collide(s);
    expect(s.players[0].courage).toBe(collide(baseline).players[0].courage + 1);
    expect(spellFragmentBonus(s, "P1")).toBe(0);
  });
  it("SP-05 pulling a loose Mirror completes the standard placement without an automatic flip", () => {
    const { s, id, targets } = prepare(5);
    physical(s, "BM-01", s.rooms.R01.objects);
    const next = cast(s, id, 0, targets);
    expect(next.rooms.R01.pair).toHaveLength(2);
    expect(next.occuldor).toBe("R01");
    expect(next.rage).toBe(0);
    expect(next.rooms.R01.restored).toBe(false);
  });
  it("SP-06 Permanent can place a lone White Mirror and shares the placement allowance", () => {
    let s = permanent("SP-06");
    s.rules.onePairPlacementAndOneFlipPerTurn = true;
    physical(s, "WM-01");
    physical(s, "WM-02");
    s = reduce(s, {
      type: "PLACE_WHITE",
      playerId: "P1",
      roomId: near,
      whiteId: "WM-01",
    });
    expect(s.rooms[near].objects.some((t) => t.id === "WM-01")).toBe(true);
    expect(() =>
      reduce(s, {
        type: "PLACE_WHITE",
        playerId: "P1",
        roomId: near,
        whiteId: "WM-02",
      }),
    ).toThrow("legal");
  });
  it("SP-24 never spends an activation Sigil again as the Tool's sacrifice", () => {
    let s = fixture("SP-24");
    add(s, "IT-15");
    expect(() => spellActivationPlan(s, "SP-24", 0)).toThrow("eligible");
    grantSigil(s, "P1", "Amber");
    const token = availableSigils(s).at(-1)!;
    s = cast(s, "SP-24", 0, ["IT-15", `cost:physical:${token.id}`]);
    expect(s.spells.spentIds).toContain(token.id);
    expect(s.spells.quick[0].sigils).toHaveLength(2);
    expect(s.players[0].sigils).toHaveLength(0);
  });
  it("SP-28 completed gems cannot award Courage again after relocation", () => {
    const s = fixture("SP-28");
    const gem = kaleidoscopeGems[0],
      last = gem.cells[0];
    const mosaic: Array<string | null> = Array(35).fill("Scarlet");
    mosaic[last] = null;
    expect(
      placementReward(mosaic, last, "Scarlet", true, []) -
        placementReward(mosaic, last, "Scarlet", true, [gem.id]),
    ).toBe(0);
  });
});
