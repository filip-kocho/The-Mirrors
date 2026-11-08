import { byId } from "../src/game/cards/catalog";
import { grantSigil, availableSigils } from "../src/game/systems/sigils";
import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  loadSave,
  assertState,
  type State,
  type Token,
  planTransfer,
} from "../src/game/domain/engine";
import {
  companionDefinitions,
  companionById,
} from "../src/game/cards/companions";
import {
  attachCompanion,
  companionDeparture,
  companionLocations,
  resolveEncounters,
  normalizeCompanions,
  carrierRoom,
  leaveCompanion,
  movementOf,
} from "../src/game/systems/companions";
import {
  visitRoom,
  beginEffects,
  advanceEffects,
} from "../src/game/systems/blackMirrorRuntime";
import { itemActionPlan } from "../src/game/systems/itemActions";
function fixture() {
  const s = initialState(["A", "B"], "companion-v06");
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = structuredClone(r.findings);
  }
  s.players.forEach((p) => (p.room = "R01"));
  return s;
}
function add(s: State, id: string, owner = 0) {
  s.decks.Companion = s.decks.Companion.filter((x) => x !== id);
  const t: Token = { id, card: id, kind: "Companion" };
  attachCompanion(s, s.players[owner], t, true);
  return t;
}
function item(s: State, id: string, owner = 0) {
  s.decks.Item = s.decks.Item.filter((x) => x !== id);
  s.players[owner].inventory.push({ id, card: id, kind: "Item" });
}
describe("Companion v0.6 catalog", () => {
  it("has ten stable identities and independent classifications", () => {
    expect(companionDefinitions).toHaveLength(10);
    expect(companionDefinitions.map((c) => c.name)).toEqual([
      "Rex the Dog",
      "Alexis the Cat",
      "Poe the Raven",
      "Roderick the Rat",
      "Madison the Ghost Sister Twin",
      "Mason the Ghost Brother Twin",
      "Mad Mara",
      "Mamba the Snake",
      "Clementine the Spider",
      "Julia the Venus",
    ]);
    expect(
      companionDefinitions
        .filter((c) => c.movementType === "LOYAL")
        .map((c) => c.id),
    ).toEqual(["CO-01", "CO-05", "CO-06"]);
    expect(
      companionDefinitions
        .filter((c) => c.followingType === "CARRIER")
        .map((c) => c.id),
    ).toEqual(["CO-08", "CO-09", "CO-10"]);
  });
  it("validates every reciprocal relationship", () => {
    for (const c of companionDefinitions) {
      for (const id of c.dreadIds)
        expect(companionById[id].huntIds).toContain(c.id);
      for (const id of c.huntIds)
        expect(companionById[id].dreadIds).toContain(c.id);
      for (const id of c.predatorIds)
        expect(companionById[id].preyIds).toContain(c.id);
      for (const id of c.preyIds)
        expect(companionById[id].predatorIds).toContain(c.id);
    }
  });
});
describe("ownership and physical carrying", () => {
  it("Loyal follows current owner while a Stray transfers only on departure", () => {
    const s = fixture();
    add(s, "CO-01");
    add(s, "CO-03");
    s.players[1].room = "Hall";
    visitRoom(s, s.players[1], "R01");
    expect(s.players[1].companions).toHaveLength(0);
    visitRoom(s, s.players[1], "Hall");
    expect(s.players[1].companions.map((t) => t.card)).toEqual(["CO-03"]);
    expect(s.players[0].companions[0].card).toBe("CO-01");
    expect(s.players[1].companions[0].originalDiscoverer).toBe("P1");
    expect(s.players[1].companions[0].discoverer).toBe("P2");
    visitRoom(s, s.players[0], "Hall");
    expect(s.players[0].companions[0].card).toBe("CO-01");
  });
  it("invalid movement is atomic", () => {
    const s = fixture();
    add(s, "CO-03", 1);
    const before = JSON.stringify(s);
    expect(() =>
      reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "R35"] }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it("explicit Loyal transfer preserves original discoverer", () => {
    const s = fixture(),
      t = add(s, "CO-01");
    attachCompanion(s, s.players[1], t);
    expect(s.players[0].companions).toEqual([]);
    expect(t.originalDiscoverer).toBe("P1");
    expect(t.discoverer).toBe("P2");
  });
  it("Carrier occupies an Item slot and transfer releases the old slot", () => {
    const s = fixture();
    add(s, "CO-08");
    add(s, "CO-05");
    expect(carrierRoom(s, s.players[0])).toBe(1);
    companionDeparture(s, s.players[1]);
    expect(carrierRoom(s, s.players[0])).toBe(2);
    expect(carrierRoom(s, s.players[1])).toBe(1);
  });
  it("full board rejects explicit recruitment and leaves automatic Strays behind", () => {
    const s = fixture();
    const t = add(s, "CO-08", 1);
    item(s, "IT-04");
    item(s, "IT-05");
    expect(() => attachCompanion(s, s.players[0], t)).toThrow("Item slot");
    visitRoom(s, s.players[0], "Hall");
    expect(s.players[1].companions).toContain(t);
  });
  it("discovered Carrier records discoverer but remains in room if full", () => {
    const s = fixture();
    item(s, "IT-04");
    item(s, "IT-05");
    const t = add(s, "CO-08");
    expect(s.players[0].companions).toEqual([]);
    expect(s.rooms.R01.objects).toContain(t);
    expect(t.originalDiscoverer).toBe("P1");
  });
  it("taking an Item cannot ignore an occupied Carrier slot", () => {
    const s = fixture();
    add(s, "CO-08");
    item(s, "IT-04");
    s.decks.Item = s.decks.Item.filter((x) => x !== "IT-05");
    s.rooms.R01.objects.push({ id: "IT-05", card: "IT-05", kind: "Item" });
    expect(() => planTransfer(s, "IT-05", "take")).toThrow("capacity");
  });
  it("capacity decrease detaches Carrier safely and persists", () => {
    const s = fixture();
    add(s, "CO-08");
    item(s, "IT-04");
    item(s, "IT-05");
    normalizeCompanions(s);
    expect(s.players[0].companions).toEqual([]);
    expect(
      loadSave(JSON.stringify(s)).rooms.R01.objects.some(
        (t) => t.card === "CO-08",
      ),
    ).toBe(true);
  });
});
describe("central encounters", () => {
  for (const predator of companionDefinitions)
    for (const prey of predator.predatorIds)
      it(`${predator.id} eats ${prey} before fear`, () => {
        const s = fixture();
        add(s, predator.id);
        const t = add(s, prey, 1);
        resolveEncounters(s, "R01");
        expect(s.removed.map((x) => x.card)).toContain(prey);
        expect(companionLocations(s).some((x) => x.token.id === t.id)).toBe(
          false,
        );
        expect(s.log.filter((x) => x.text.includes("flees"))).toHaveLength(0);
        expect(() => attachCompanion(s, s.players[0], t)).toThrow("Removed");
        expect(
          loadSave(JSON.stringify(s)).removed.some((x) => x.id === t.id),
        ).toBe(true);
      });
  it("fear flees once with a configurable fallback and no recursive loop", () => {
    const s = fixture();
    s.rules.companionPolicies.flee = "STAY";
    add(s, "CO-01");
    add(s, "CO-07", 1);
    resolveEncounters(s, "R01");
    expect(s.rooms.R01.objects.some((t) => t.card === "CO-01")).toBe(true);
    const n = s.log.length;
    resolveEncounters(s, "R01");
    expect(s.log).toHaveLength(n);
  });
  it("eating frees a Carrier slot", () => {
    const s = fixture();
    add(s, "CO-09");
    add(s, "CO-03", 1);
    expect(carrierRoom(s, s.players[0])).toBe(1);
    resolveEncounters(s, "R01");
    expect(carrierRoom(s, s.players[0])).toBe(2);
  });
  it("existing Locket protects only its holder", () => {
    const s = fixture();
    item(s, "IT-25");
    add(s, "CO-04");
    add(s, "CO-09", 1);
    add(s, "CO-08");
    resolveEncounters(s, "R01");
    expect(s.players[0].companions.some((t) => t.card === "CO-04")).toBe(true);
    expect(s.removed.some((t) => t.card === "CO-09")).toBe(true);
  });
});
describe("Ghost Twin linked group", () => {
  it("different owners remain pending until first departure and then move atomically", () => {
    let s = fixture();
    add(s, "CO-05");
    add(s, "CO-06", 1);
    resolveEncounters(s, "R01");
    expect(s.players[0].companions[0].linkedGroupId).toBeUndefined();
    s = loadSave(JSON.stringify(s));
    visitRoom(s, s.players[1], "Hall");
    expect(s.players[1].companions.map((t) => t.card).sort()).toEqual([
      "CO-05",
      "CO-06",
    ]);
    expect(
      s.players[1].companions.every((t) => movementOf(t) === "STRAY"),
    ).toBe(true);
    s = loadSave(JSON.stringify(s));
    visitRoom(s, s.players[0], "Hall");
    visitRoom(s, s.players[0], "R01");
    expect(s.players[0].companions).toHaveLength(2);
    expect(s.players[1].companions).toEqual([]);
    assertState(s);
  });
  it("same-owner immediate reunion is configurable", () => {
    const s = fixture();
    add(s, "CO-05");
    add(s, "CO-06");
    s.rules.companionPolicies.reunion = "FIRST_DEPARTURE";
    resolveEncounters(s, "R01");
    expect(s.players[0].companions[0].linkedGroupId).toBeUndefined();
    s.rules.companionPolicies.reunion = "SAME_OWNER_IMMEDIATE";
    resolveEncounters(s, "R01");
    expect(
      s.players[0].companions.every((t) => t.linkedGroupId === "ghost-twins"),
    ).toBe(true);
  });
  it("explicit transfer and abandonment handle both; sacrifice cannot select half", () => {
    const s = fixture();
    add(s, "CO-05");
    add(s, "CO-06");
    resolveEncounters(s, "R01");
    attachCompanion(s, s.players[1], s.players[0].companions[0]);
    expect(s.players[1].companions).toHaveLength(2);
    leaveCompanion(s, s.players[1].companions[0], "R01");
    expect(s.rooms.R01.objects.filter((t) => t.linkedGroupId)).toHaveLength(2);
    attachCompanion(
      s,
      s.players[0],
      s.rooms.R01.objects.find((t) => t.linkedGroupId)!,
    );
    item(s, "IT-19");
    expect(() => itemActionPlan(s, "IT-19")).toThrow("sacrifice");
  });
  it("invalid split fails state validation", () => {
    const s = fixture();
    add(s, "CO-05");
    add(s, "CO-06");
    resolveEncounters(s, "R01");
    s.players[1].companions.push(s.players[0].companions.pop()!);
    expect(() => assertState(s)).toThrow("split");
  });
  it("Black Mirror abandonment preserves reunion", () => {
    const s = fixture();
    add(s, "CO-05");
    add(s, "CO-06");
    resolveEncounters(s, "R01");
    beginEffects(s, "BM-22", "immediate", [{ op: "COMPANIONS" }]);
    advanceEffects(s);
    expect(s.players[0].companions).toHaveLength(0);
    expect(s.rooms.R01.objects.filter((t) => t.linkedGroupId)).toHaveLength(2);
  });
});

describe("real card integration", () => {
  it("White Mirror discovery assigns the exact Carrier with original discoverer", () => {
    let s = fixture();
    s.decks.Companion = [
      "CO-08",
      ...s.decks.Companion.filter((id) => id !== "CO-08"),
    ];
    for (const id of ["WM-01", "BM-01"])
      for (const room of Object.values(s.rooms)) {
        const i = room.objects.findIndex((t) => t.id === id);
        if (i >= 0) {
          s.rooms.R01.objects.push(...room.objects.splice(i, 1));
          break;
        }
      }
    s = reduce(s, {
      type: "PLACE_MIRRORS",
      playerId: "P1",
      whiteId: "WM-01",
      blackId: "BM-01",
    });
    expect(
      s.players[0].companions.find((t) => t.card === "CO-08"),
    ).toMatchObject({
      behavior: "STRAY",
      originalDiscoverer: "P1",
      discoverer: "P1",
    });
    expect(carrierRoom(s, s.players[0])).toBe(1);
  });
  it("SP-33 transfers both linked Twins without changing either original discoverer", () => {
    let s = fixture();
    add(s, "CO-05", 1);
    add(s, "CO-06", 1);
    resolveEncounters(s, "R01");
    s.decks.Spell = s.decks.Spell.filter((id) => id !== "SP-33");
    s.players[0].inventory.push({ id: "SP-33", card: "SP-33", kind: "Spell" });
    s.players[0].knowledge[0] = true;
    s.players[0].spellSlots[0] = "SP-33";
    for (const color of byId["SP-33"].casting_modes![0].sigil_slots)
      grantSigil(s, "P1", color);
    const ids = availableSigils(s, "P1").filter(t=>t.color!=="Wild").map((t) => t.id);
    s = reduce(s, {
      type: "CAST_SPELL",
      playerId: "P1",
      spellId: "SP-33",
      action: 0,
      sigilIds: ids,
      targets: ["CO-05"],
    });
    expect(s.players[0].companions).toHaveLength(2);
    expect(s.players[1].companions).toEqual([]);
    expect(
      s.players[0].companions.every((t) => t.originalDiscoverer === "P2"),
    ).toBe(true);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("forced teleport uses the same Stray departure and linked Twin operation", () => {
    const s = fixture();
    add(s, "CO-05");
    add(s, "CO-06");
    resolveEncounters(s, "R01");
    visitRoom(s, s.players[1], "R35", true);
    expect(s.players[1].companions).toHaveLength(2);
    expect(companionLocations(s).every((x) => x.room === "R35")).toBe(true);
  });
  for (const hunter of companionDefinitions)
    for (const victim of hunter.huntIds.filter(
      (id) => !(hunter.predatorIds as readonly string[]).includes(id),
    ))
      it(`${hunter.id} frightens ${victim} without eating it`, () => {
        const s = fixture();
        add(s, hunter.id);
        add(s, victim, 1);
        resolveEncounters(s, "R01");
        expect(s.removed.filter((t) => t.kind === "Companion")).toEqual([]);
        expect(s.players[1].companions).toEqual([]);
        expect(
          companionLocations(s).find((x) => x.token.card === victim)?.owner,
        ).toBeUndefined();
      });
});
