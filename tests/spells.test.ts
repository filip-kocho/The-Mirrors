import { prerequisiteTool } from "../src/game/cards/toolPrerequisites";
import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  assertState,
  loadSave,
  State,
  Token,
} from "../src/game/domain/engine";
import { byId } from "../src/game/cards/catalog";
import { unlockKnowledge } from "../src/game/systems/knowledge";
import { planLearning, suggestedPayment } from "../src/game/systems/spells";

function setup(spellId = "SP-18") {
  const s = initialState(["A", "B"], "learning");
  for (const room of Object.values(s.rooms)) {
    room.explored = true;
    room.objects = structuredClone(room.findings);
  }
  const pool = Object.values(s.rooms).flatMap((r) => r.objects);
  for (const room of Object.values(s.rooms)) room.objects = [];
  s.rooms.Hall.objects = pool;
  s.players[0].room = "R01";
  s.players[0].knowledge[0] = true;
  const card = byId[spellId];
  s.decks.Spell = s.decks.Spell.filter((id) => id !== spellId);
  s.rooms.R01.objects.push({ id: spellId, card: spellId, kind: "Spell" });
  const tokens = [...card.learn_elements!];
  for (const element of tokens) {
    const index = s.rooms.Hall.objects.findIndex((t) => t.element === element);
    s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(index, 1));
  }
  const tool =
    typeof card.tool_requirement === "string"
      ? prerequisiteTool(card.tool_requirement)
      : undefined;
  if (tool) {
    s.decks.Item = s.decks.Item.filter((id) => id !== tool.id);
    s.players[0].inventory.push({ id: tool.id, card: tool.id, kind: "Item" });
  }
  return s;
}
function learn(s: State, spellId = "SP-18") {
  return reduce(s, {
    type: "LEARN",
    playerId: s.players[s.active].id,
    spellId,
  });
}
describe("Spell learning", () => {
  it("skips occupied and locked slots automatically, then refuses learning when no slot remains", () => {
    let s = setup("SP-01");
    s.players[0].knowledge = [true, false, true, true];
    s = learn(s, "SP-01");
    for (const id of ["SP-02", "SP-03"]) {
      s.decks.Spell = s.decks.Spell.filter((cardId) => cardId !== id);
      s.rooms.R01.objects.push({ id, card: id, kind: "Spell" });
      for (const element of byId[id].learn_elements!) {
        const i = s.rooms.Hall.objects.findIndex((t) => t.element === element);
        s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(i, 1));
      }
      s = learn(s, id);
    }
    expect(s.players[0].spellSlots).toEqual(["SP-01", null, "SP-02", "SP-03"]);
    s.decks.Spell = s.decks.Spell.filter((id) => id !== "SP-04");
    s.rooms.R01.objects.push({ id: "SP-04", card: "SP-04", kind: "Spell" });
    const before = structuredClone(s);
    expect(() => learn(s, "SP-04")).toThrow("free, unlocked");
    expect(s).toEqual(before);
    expect(() =>
      reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        tokenId: "SP-04",
        direction: "take",
      }),
    ).toThrow("dedicated action");
  });
  it("pays exact mixed hand/room costs and equips the first free unlocked slot", () => {
    const s = setup();
    const i = s.rooms.R01.objects.findIndex((t) => t.element === "Air");
    s.players[0].inventory.push(...s.rooms.R01.objects.splice(i, 1));
    s.players[0].knowledge = [true, false, true, false];
    const next = learn(s, "SP-18");
    expect(next.players[0].spellSlots).toEqual(["SP-18", null, null, null]);
    expect(next.players[0].inventory.map((t) => t.id)).toEqual(["SP-18"]);
    expect(next.spentElements.map((t) => t.element).sort()).toEqual([
      "Air",
      "Fire",
    ]);

    expect(s.spentElements).toHaveLength(0);
    assertState(next);
    expect(loadSave(JSON.stringify(next))).toEqual(next);
  });
  it("rejects locked or occupied slots, wrong/duplicate/inaccessible payments, and missing Tools atomically", () => {
    const s = setup();
    const before = structuredClone(s);
    expect(() =>
      planLearning(s, "SP-18", 1, suggestedPayment(s, "SP-18")),
    ).toThrow("unlocked");
    expect(() => planLearning(s, "SP-18", 0, [])).toThrow("exact Element");
    const ids = suggestedPayment(s, "SP-18");
    expect(() => planLearning(s, "SP-18", 0, [ids[0], ids[0]])).toThrow(
      "separate token",
    );
    expect(() => planLearning(s, "SP-18", 0, [ids[0], "E-Fire-1"])).toThrow(
      "current room",
    );
    expect(s).toEqual(before);
    const unresolved = setup("SP-17");
    const beforeUnresolved = structuredClone(unresolved);
    expect(() => learn(unresolved, "SP-17")).toThrow("Prism Lens");
    expect(unresolved).toEqual(beforeUnresolved);
  });
  it("rejects an accessible Element of the wrong type", () => {
    const s = setup("SP-01");
    const i = s.rooms.Hall.objects.findIndex((t) => t.element === "Water");
    const token = s.rooms.Hall.objects.splice(i, 1)[0];
    s.rooms.R01.objects.push(token);
    expect(() => planLearning(s, "SP-01", 0, [token.id])).toThrow(
      "exact Element",
    );
  });
  it("rejects remote Spells, inactive heroes and pending resolution", () => {
    const s = setup();
    s.players[0].room = "Hall";
    expect(() => learn(s)).toThrow("current room");
    s.players[0].room = "R01";
    expect(() =>
      reduce(s, {
        type: "LEARN",
        playerId: "P2",
        spellId: "SP-18",
      }),
    ).toThrow("active hero");
    s.pending = { room: "R01", card: "BM-01", stage: "placement" };
    expect(() => learn(s)).toThrow("Finish");
  });
  it("leaves an equipped Spell without refund, permanently retains its unlocked slot, and requires paying to relearn", () => {
    let s = learn(setup("SP-01"), "SP-01");
    expect(() => planLearning(s, "SP-01", 0, [])).toThrow();
    s = reduce(s, { type: "LEAVE_SPELL", playerId: "P1", spellId: "SP-01" });
    expect(s.players[0].spellSlots[0]).toBeNull();
    expect(s.players[0].knowledge[0]).toBe(true);
    expect(s.rooms.R01.objects.some((t) => t.id === "SP-01")).toBe(true);
    expect(s.spentElements).toHaveLength(1);
    expect(() => learn(s, "SP-01")).toThrow("current room");
  });
  it("conserves repeated costs and supports every catalog Spell's learning requirements", () => {
    for (const card of Object.values(byId).filter(
      (c) => c.family === "Spell",
    )) {
      if (
        typeof card.tool_requirement === "string" &&
        !prerequisiteTool(card.tool_requirement)
      ) {
        const blocked = setup(card.id);
        expect(() => learn(blocked, card.id)).toThrow(card.tool_requirement);
        continue;
      }
      const s = learn(setup(card.id), card.id);
      expect(s.players[0].spellSlots[0]).toBe(card.id);
      expect(s.spentElements).toHaveLength(card.learn_elements!.length);
      assertState(s);
    }
  });
  it("loads older saves with empty companion/Spell slots and no spent Elements", () => {
    const raw = JSON.parse(
      JSON.stringify(initialState(["A", "B"], "old-save")),
    );
    delete raw.spentElements;
    delete raw.rulesRevision;
    raw.rules.orderedKnowledge = true;
    delete raw.rules.consumeLearningTool;
    for (const p of raw.players) {
      delete p.companions;
      delete p.spellSlots;
    }
    const s = loadSave(JSON.stringify(raw));
    expect(s.spentElements).toEqual([]);
    expect(s.rules.orderedKnowledge).toBe(false);
    expect(s.players[0].companions).toEqual([]);
    expect(s.players[0].spellSlots).toEqual([null, null, null, null]);
  });
  it("rejects replacing an occupied slot without spending resources", () => {
    let s = learn(setup("SP-01"), "SP-01");
    s.decks.Spell = s.decks.Spell.filter((id) => id !== "SP-02");
    s.rooms.R01.objects.push({ id: "SP-02", card: "SP-02", kind: "Spell" });
    const i = s.rooms.Hall.objects.findIndex((t) => t.element === "Air");
    s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(i, 1));
    const before = structuredClone(s);
    expect(() => learn(s, "SP-02")).toThrow("free, unlocked");
    expect(s).toEqual(before);
  });
  it("clears a learned Spell's slot when an automatic penalty kills its owner", () => {
    let s = learn(setup("SP-01"), "SP-01");
    for (const id of ["WM-01", "BM-07"]) {
      const i = s.rooms.Hall.objects.findIndex((t) => t.id === id);
      s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(i, 1));
    }
    s = reduce(s, {
      type: "PLACE_MIRRORS",
      playerId: "P1",
      whiteId: "WM-01",
      blackId: "BM-07",
    });
    s.occuldor = "Hall";
    s = reduce(s, { type: "COLLIDE", playerId: "P1" });
    s.players[0].courage = 1;
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    expect(s.players[0].spellSlots).toEqual([null, null, null, null]);
    expect(s.rooms.R01.objects.some((t) => t.id === "SP-01")).toBe(true);
    assertState(s);
  });
});
describe("Sigil Knowledge achievements", () => {
  it("unlocks each of the four stated conditions immediately and never relocks", () => {
    const s = initialState(["A", "B"], "unlocks"),
      p = s.players[0];
    p.sigils = ["Scarlet"];
    unlockKnowledge(p, s.rules.orderedKnowledge);
    expect(p.knowledge).toEqual([true, false, false, false]);
    p.sigils.push("Scarlet", "Scarlet");
    unlockKnowledge(p, s.rules.orderedKnowledge);
    expect(p.knowledge).toEqual([true, false, true, false]);
    p.sigils.push("Emerald", "Amber");
    unlockKnowledge(p, s.rules.orderedKnowledge);
    expect(p.knowledge).toEqual([true, true, true, false]);
    p.sigils.push("Fuchsia", "Amethyst");
    unlockKnowledge(p, s.rules.orderedKnowledge);
    expect(p.knowledge).toEqual([true, true, true, true]);
    p.sigils = [];
    unlockKnowledge(p, s.rules.orderedKnowledge);
    expect(p.knowledge).toEqual([true, true, true, true]);
  });
});
