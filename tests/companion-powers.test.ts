import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  loadSave,
  type State,
} from "../src/game/domain/engine";
import { roomGraph } from "../src/game/map/roomGraph";
import { companionActionPlan } from "../src/game/systems/companionAbilities";
import { visibleSpellColors } from "../src/game/systems/spellActivation";
import {
  learningDiscounts,
  automaticLearningPlan,
} from "../src/game/systems/spells";
import { reducedCost } from "../src/game/systems/elementPayment";
import {
  juliaDiscountReady,
  learningDiscountSource,
} from "../src/game/systems/companionLearning";
import { byId } from "../src/game/cards/catalog";

function setup(id: string) {
  const s = initialState(["Rowan", "Elara"], "missing-companion-powers");
  s.decks.Companion = s.decks.Companion.filter((x) => x !== id);
  s.players[0].companions.push({ id, card: id, kind: "Companion" });
  return s;
}
function scout(s: State, room: string) {
  return reduce(s, {
    type: "USE_COMPANION",
    playerId: s.players[s.active].id,
    card: "CO-03",
    ids: [room],
  });
}
describe("Poe private scouting", () => {
  it("reveals only one neighboring Sigil privately without exploring, and persists owner knowledge", () => {
    let s = setup("CO-03");
    const room = roomGraph.Hall.neighbors[0],
      before = structuredClone(s.rooms[room]);
    s = scout(s, room);
    expect(s.rooms[room]).toEqual(before);
    expect(visibleSpellColors(s, "P1")).toContain(room);
    expect(visibleSpellColors(s, "P2")).not.toContain(room);
    expect(s.log.at(-1)!.text).not.toContain(before.color!);
    expect(() => scout(s, roomGraph.Hall.neighbors[1])).toThrow(
      "already scouted",
    );
    s = loadSave(JSON.stringify(s));
    expect(s.spells.visions.P1).toContain(room);
    expect(() => scout(s, room)).toThrow("already scouted");
    s.players[1].companions.push(...s.players[0].companions.splice(0));
    s.active = 1;
    s.turn++;
    expect(visibleSpellColors(s, "P2")).not.toContain(room);
    expect(scout(s, room).spells.visions.P2).toContain(room);
  });
  it("validates ownership, timing, adjacency, hidden state and privacy", () => {
    const s = setup("CO-03"),
      room = roomGraph.Hall.neighbors[0];
    expect(() => scout(s, "Hall")).toThrow("eligible");
    const far = Object.keys(s.rooms).find(
      (id) => id !== "Hall" && !roomGraph.Hall.neighbors.includes(id),
    )!;
    expect(() => scout(s, far)).toThrow("eligible");
    s.rooms[room].explored = true;
    expect(() => scout(s, room)).toThrow("eligible");
    s.moved = true;
    expect(() => companionActionPlan(s, "CO-03")).toThrow("before");
    s.moved = false;
    s.privacy = true;
    expect(() => companionActionPlan(s, "CO-03")).toThrow("attached");
    s.privacy = false;
    s.players[0].companions = [];
    expect(() => companionActionPlan(s, "CO-03")).toThrow("attached");
  });
});
describe("Julia learning discount", () => {
  it("discounts only Earth or Water and retains a minimum one-Element cost", () => {
    const s = setup("CO-10");
    expect(reducedCost(s, ["Earth", "Water"], "Earth")).toEqual(["Water"]);
    expect(reducedCost(s, ["Earth", "Water"], "Water")).toEqual(["Earth"]);
    expect(() => reducedCost(s, ["Earth"], "Earth")).toThrow();
    expect(() => reducedCost(s, ["Earth", "Fire"], "Fire")).toThrow();
    s.players[0].companions = [];
    expect(() => reducedCost(s, ["Earth", "Water"], "Earth")).toThrow();
  });
  it("works locally, never remotely, and does not stack with or consume the Grimoire discount", () => {
    const s = setup("CO-10");
    s.players[1].companions.push(...s.players[0].companions.splice(0));
    expect(juliaDiscountReady(s)).toBe(true);
    s.players[1].room = "R01";
    expect(juliaDiscountReady(s)).toBe(false);
    s.rooms.Hall.objects.push(...s.players[1].companions.splice(0));
    expect(juliaDiscountReady(s)).toBe(true);
    s.players[0].inventory.push({ id: "IT-10", card: "IT-10", kind: "Item" });
    expect(learningDiscountSource(s, ["Earth", "Water"], "Earth")).toBe(
      "Grimoire",
    );
    expect(reducedCost(s, ["Earth", "Water"], "Earth")).toEqual(["Water"]);
  });
  it("learns with local payment, consumes one use, survives reload and refreshes next turn", () => {
    let s = setup("CO-10");
    const spell = Object.values(byId).find(
      (c) =>
        c.family === "Spell" &&
        !c.tool_requirement &&
        c.learn_elements!.length === 2 &&
        c.learn_elements!.includes("Earth"),
    )!;
    s.decks.Spell = s.decks.Spell.filter((id) => id !== spell.id);
    s.rooms.Hall.objects.push({ id: spell.id, card: spell.id, kind: "Spell" });
    s.players[0].knowledge[0] = true;
    const remaining = [...spell.learn_elements!];
    remaining.splice(remaining.indexOf("Earth"), 1);
    const source = Object.values(s.rooms).find((r) =>
      r.findings.some((t) => t.element === remaining[0]),
    )!;
    source.explored = true;
    source.objects = structuredClone(source.findings);
    const token = source.objects.splice(
      source.objects.findIndex((t) => t.element === remaining[0]),
      1,
    )[0];
    s.rooms.Hall.objects.push(token);
    expect(automaticLearningPlan(s, spell.id).discountSource).toBe("Julia");
    s = reduce(s, {
      type: "LEARN",
      playerId: "P1",
      spellId: spell.id,
      discount: "Earth",
    });
    expect(s.spentElements.map((t) => t.id)).toEqual([token.id]);
    expect(s.players[0].spellSlots[0]).toBe(spell.id);
    expect(juliaDiscountReady(loadSave(JSON.stringify(s)))).toBe(false);
    expect(learningDiscounts(s, spell.id)).toEqual([undefined]);
    s.turn++;
    expect(juliaDiscountReady(s)).toBe(true);
  });
});
