import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  State,
  Token,
  assertState,
  loadSave,
  capacities,
} from "../src/game/domain/engine";
import {
  blackMirrors,
  curseEffectSchema,
} from "../src/game/cards/blackMirrors";
import { byId, colors } from "../src/game/cards/catalog";
import {
  statusOf,
  mutableStatus,
  isImmobilized,
  spellSeals,
  beginEffects,
  advanceEffects,
  visitRoom,
  beginHeroTurn,
} from "../src/game/systems/blackMirrorRuntime";
import {
  castlePath,
  connections,
  corridorIds,
  legalThreshold,
} from "../src/game/map/castleConnections";
import { legalCell } from "../src/game/map/kaleidoscopeCells";
import { automaticLearningPlan } from "../src/game/systems/spells";

function relocate(s: State, id: string, target: Token[]) {
  for (const r of Object.values(s.rooms)) {
    const pool = r.explored ? r.objects : r.findings,
      i = pool.findIndex((t) => t.id === id);
    if (i >= 0) {
      target.push(...pool.splice(i, 1));
      return;
    }
  }
  throw Error(`Missing ${id}`);
}
export function curseFixture(card = "BM-01", rich = true) {
  let s = initialState(["A", "B"], `curse-${card}`);
  for (const r of Object.values(s.rooms))
    if (!["R34", "R35"].includes(r.id)) {
      r.explored = true;
      r.objects = structuredClone(r.findings);
    }
  s.players[0].room = "R01";
  relocate(s, "WM-01", s.rooms.R01.objects);
  relocate(s, card, s.rooms.R01.objects);
  s = reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-01",
    blackId: card,
  });
  s.occuldor = "Hall";
  s.players[0].courage = 30;
  if (rich) {
    for (const id of [
      "E-Air-1",
      "E-Air-2",
      "E-Fire-1",
      "WM-02",
      card === "BM-02" ? "BM-03" : "BM-02",
    ])
      relocate(s, id, s.players[0].inventory);
    for (const id of ["IT-04", "IT-05", "IT-23", "SP-01", "SP-17"]) {
      const c = byId[id];
      s.decks[c.family] = s.decks[c.family].filter((x) => x !== id);
      s.players[0].inventory.push({
        id,
        card: id,
        kind: c.family as Token["kind"],
      });
    }
    s.players[0].knowledge = [true, true, true, true];
    s.players[0].spellSlots = ["SP-01", "SP-17", null, null];
    s.players[0].sigils = ["Scarlet", "Scarlet", "Emerald"];
  }
  return s;
}
function answerAll(s: State) {
  let guard = 0;
  while (s.blackMirror.resolution?.choice) {
    if (++guard > 100) throw Error("Resolution did not terminate");
    const c = s.blackMirror.resolution.choice;
    let ids = c.options.slice(0, c.min).map((o) => o.id);
    if (c.title.startsWith("Leave one White"))
      ids = [
        c.options.find((o) => o.id.startsWith("WM"))!.id,
        c.options.find((o) => o.id.startsWith("BM"))!.id,
      ];
    const saved = loadSave(JSON.stringify(s));
    expect(saved).toEqual(s);
    s = reduce(s, {
      type: "CURSE_CHOICE",
      playerId: s.players[s.active].id,
      choiceId: c.id,
      ids,
    });
  }
  return s;
}
function apply(s: State) {
  s = reduce(s, { type: "COLLIDE", playerId: "P1" });
  return answerAll(
    reduce(s, { type: "CONTINUE_COLLISION", playerId: "P1", penalty: "apply" }),
  );
}
describe("Black Mirror 0.4 catalog and every curse", () => {
  it("has 35 unique reviewed typed cards with seven per family", () => {
    expect(blackMirrors.map((c) => c.id)).toEqual(
      Array.from(
        { length: 35 },
        (_, i) => `BM-${String(i + 1).padStart(2, "0")}`,
      ),
    );
    for (const family of new Set(blackMirrors.map((c) => c.subtype)))
      expect(blackMirrors.filter((c) => c.subtype === family)).toHaveLength(7);
    for (const c of blackMirrors) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.effect.length).toBeGreaterThan(0);
      expect(c.status).toBe("REVIEW");
      [...c.effects, ...c.after].forEach((e) =>
        expect(() => curseEffectSchema.parse(e)).not.toThrow(),
      );
    }
    expect(JSON.stringify(blackMirrors)).not.toMatch(
      /Resident|Wanderer|Passer/,
    );
  });
  it.each(blackMirrors.map((c) => c.id))(
    "%s resolves through the real collision, choices, save/resume and placement exactly once",
    (card) => {
      let s = curseFixture(card);
      const beforeSigils = s.players[0].sigils.length;
      s = apply(s);
      expect(s.pending?.stage).toBe("placement");
      expect(s.rage).toBe(1);
      expect(s.rooms.R01.restored).toBe(true);
      expect(s.players[0].sigils).toHaveLength(beforeSigils + 1);
      expect(s.players[1].courage).toBe(18);
      expect(s.removed.filter((t) => t.kind.endsWith("Mirror"))).toHaveLength(
        2,
      );
      expect(() =>
        reduce(s, {
          type: "CONTINUE_COLLISION",
          playerId: "P1",
          penalty: "apply",
        }),
      ).toThrow();
      const state = statusOf(s, "P1");
      const n = Number(card.slice(3));
      if (n <= 7) expect(state.paralysis).toHaveLength(n >= 6 ? 2 : 1);
      if (n === 8 || n === 9 || n === 10)
        expect(
          state.hexlocks.filter((h) => h.category === "ELEMENT"),
        ).toHaveLength(n - 7);
      if (n === 17 || n === 18) expect(state.fear).toHaveLength(n - 16);
      if (n >= 19 && n <= 21)
        expect(s.blackMirror.thresholds).toHaveLength(n - 18);
      if (n === 22 || n === 24) expect(s.players[0].companions).toHaveLength(0);
      if ([23, 25, 27].includes(n)) expect(s.blackMirror.seals).toHaveLength(2);
      if (n === 26) {
        expect(s.players[0].spellSlots.every((x) => x === null)).toBe(true);
        expect(
          state.hexlocks.filter((h) => h.category === "KNOWLEDGE"),
        ).toHaveLength(2);
      }
      if (n === 28) expect(s.blackMirror.seals).toHaveLength(3);
      if (n >= 29 && n <= 31)
        expect(
          Object.values(s.blackMirror.rooms).reduce(
            (a, r) => a + r.darkness,
            0,
          ),
        ).toBe(n === 29 ? 1 : 2);
      if (n === 32 || n === 33)
        expect(
          Object.values(s.blackMirror.rooms).filter((r) => r.portal),
        ).toHaveLength(2);
      if (n >= 34) {
        expect(s.occuldor).toBe("R01");
        expect(s.players[0].courage).toBe(n === 34 ? 29 : 28);
      }
      s = answerAll(
        reduce(s, {
          type: "PLACE",
          playerId: "P1",
          cell: s.mosaic.findIndex((_, i) => legalCell(s.mosaic, i)),
        }),
      );
      expect(s.pending).toBeNull();
      expect(s.mosaic.filter(Boolean)).toHaveLength(1);
      if (n === 15 || n === 16) {
        expect(s.active).toBe(1);
        expect(s.turn).toBe(2);
      }
      assertState(s);
      expect(loadSave(JSON.stringify(s))).toEqual(s);
    },
  );
  it("counts all five colors, duplicates, Companions and distinct carried Elements", () => {
    for (let n = 0; n <= 5; n++) {
      const s = curseFixture("BM-02", false);
      s.players[0].sigils = colors.slice(0, n);
      expect(apply(s).players[0].courage).toBe(30 - n);
    }
    const duplicates = curseFixture("BM-03", false);
    duplicates.players[0].sigils = [
      "Scarlet",
      "Scarlet",
      "Scarlet",
      "Amber",
      "Amber",
    ];
    expect(apply(duplicates).players[0].courage).toBe(27);
    const noCompany = curseFixture("BM-04", false);
    noCompany.rooms.R01.objects.push(...noCompany.players[0].companions);
    noCompany.players[0].companions = [];
    expect(apply(noCompany).players[0].courage).toBe(27);
    expect(apply(curseFixture("BM-04")).players[0].courage).toBe(29);
    expect(apply(curseFixture("BM-05")).players[0].courage).toBe(28);
  });
  it("applies full missing-Element Hexlocks and the Mirror Toll fallback, without destroying tokens", () => {
    for (const [card, count] of [
      ["BM-08", 1],
      ["BM-09", 2],
      ["BM-10", 3],
    ] as const) {
      const s = apply(curseFixture(card, false));
      expect(statusOf(s, "P1").hexlocks).toHaveLength(count);
      assertState(s);
    }
    expect(apply(curseFixture("BM-13", false)).players[0].courage).toBe(27);
    expect(apply(curseFixture("BM-14", false)).players[0].courage).toBe(27);
  });
});
describe("token lifecycles, topology and safety", () => {
  it("Material branches preserve all objects, distinguish Relic slots and never produce negative capacity", () => {
    let s = curseFixture("BM-11");
    s = reduce(s, { type: "COLLIDE", playerId: "P1" });
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    const choice = s.blackMirror.resolution!.choice!;
    s = reduce(s, {
      type: "CURSE_CHOICE",
      playerId: "P1",
      choiceId: choice.id,
      ids: ["1"],
    });
    expect(
      s.players[0].inventory.filter((t) => t.kind === "Item"),
    ).toHaveLength(0);
    expect(
      statusOf(s, "P1")
        .hexlocks.map((h) => h.slot)
        .sort(),
    ).toEqual(["items", "items", "relics"]);
    expect(
      capacities(s.players[0].inventory, [], statusOf(s, "P1").hexlocks),
    ).toMatchObject({ items: 0, relics: 0 });
    const three = apply(curseFixture("BM-12"));
    expect(statusOf(three, "P1").hexlocks.map((h) => h.category)).toEqual([
      "ELEMENT",
      "ITEM",
      "MIRROR",
    ]);
    const toll = apply(curseFixture("BM-13"));
    expect(
      toll.players[0].inventory.filter((t) => t.kind.endsWith("Mirror")),
    ).toHaveLength(0);
    expect(statusOf(toll, "P1").hexlocks).toHaveLength(2);
    const locks = Array.from({ length: 8 }, (_, i) => ({
      id: `lock-${i}`,
      category: "ELEMENT" as const,
      slot: "elements" as const,
    }));
    expect(capacities([], [], locks).elements).toBe(0);
    expect(
      capacities(
        [],
        [{ id: "IT-01", card: "IT-01", kind: "Item" }],
        locks.slice(0, 1),
      ).elements,
    ).toBe(2);
  });
  it("abandoned Loyal and Stray Companions remain recruitable and use distinct departure rules", () => {
    let s = curseFixture("BM-22", false);
    s.players[0].companions[0].behavior = "LOYAL";
    s.players[0].companions[0].discoverer = "P1";
    const loyal = s.players[0].companions[0].id;
    const strayId = s.decks.Companion.shift()!;
    s.players[0].companions.push({
      id: strayId,
      card: strayId,
      kind: "Companion",
      behavior: "STRAY",
      discoverer: "P1",
    });
    s = apply(s);
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    expect(
      s.rooms.R01.objects.filter((t) => t.kind === "Companion"),
    ).toHaveLength(2);
    s.active = 1;
    s.players[1].room = "R01";
    s = reduce(s, { type: "RECRUIT", playerId: "P2", tokenId: loyal });
    expect(s.players[1].companions[0].discoverer).toBe("P2");
    s.active = 0;
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] });
    expect(s.players[0].companions.map((t) => t.id)).toEqual([strayId]);
    expect(s.players[1].companions.map((t) => t.id)).toEqual([loyal]);
    expect(() =>
      reduce(s, { type: "RECRUIT", playerId: "P1", tokenId: loyal }),
    ).toThrow("current room");
  });
  it("Knowledge Hexlocks prevent relearning until removed without erasing achievements", () => {
    let s = apply(curseFixture("BM-26"));
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    expect(s.players[0].knowledge).toEqual([true, true, true, true]);
    expect(automaticLearningPlan(s, "SP-01").slot).toBe(2);
    s.players[0].knowledge = [true, true, false, false];
    expect(() => automaticLearningPlan(s, "SP-01")).toThrow("unlocked");
    beginHeroTurn(s);
    s = answerAll(s);
    expect(automaticLearningPlan(s, "SP-01").slot).toBe(0);
  });
  it("counts bound Sigils according to the configured policy and prevents orphaned Seals on death", () => {
    const s = curseFixture("BM-02");
    s.blackMirror.bindings["SP-01"] = ["Amethyst"];
    expect(apply(s).players[0].courage).toBe(27);
    s.rules.blackMirrorPolicies.boundSigilsCountAsPossessed = false;
    expect(apply(s).players[0].courage).toBe(28);
    let lethal = curseFixture("BM-07");
    lethal.blackMirror.seals = [
      { id: "seal-test", owner: "P1", spell: "SP-01", scope: "PERMANENT" },
    ];
    lethal.players[0].courage = 1;
    lethal = apply(lethal);
    expect(lethal.blackMirror.seals[0].owner).toBe("P2");
    lethal = reduce(lethal, { type: "PLACE", playerId: "P1", cell: 0 });
    lethal = reduce(lethal, { type: "END", playerId: "P1" });
    expect(lethal.blackMirror.seals).toHaveLength(0);
  });
  it.each([0, 7, 14, 21, 28])(
    "summoning at Rage %i invokes only the flipper's arrival punishment with correct multiplicity",
    (rage) => {
      for (const card of ["BM-34", "BM-35"]) {
        const s = curseFixture(card, false);
        s.rage = rage;
        s.players[1].room = "R01";
        const before = s.players[1].courage;
        beginEffects(s, card, "immediate");
        advanceEffects(s);
        expect(s.players[0].courage).toBe(
          30 - (Math.floor(rage / 7) + 1) * (card === "BM-35" ? 2 : 1),
        );
        expect(s.players[1].courage).toBe(before);
        expect(s.rage).toBe(rage);
        expect(s.occuldor).toBe("R01");
      }
    },
  );
  it("logs unavailable targets, preserves hidden rooms and rejects corrupted saved references", () => {
    const s = curseFixture("BM-29", false);
    for (const r of Object.values(s.rooms))
      if (!r.explored) {
        r.explored = true;
        r.objects = structuredClone(r.findings);
      }
    const resolved = apply(s);
    expect(resolved.blackMirror.rooms).toEqual({});
    expect(resolved.players[0].courage).toBe(29);
    expect(
      resolved.log.some((e) => e.text.includes("no eligible targets")),
    ).toBe(true);
    const dark = apply(curseFixture("BM-31", false));
    const room = Object.keys(dark.blackMirror.rooms)[0];
    expect(dark.rooms[room].explored).toBe(false);
    const invalid = structuredClone(dark);
    invalid.blackMirror.rooms.MISSING = { darkness: 1, portal: false };
    expect(() => loadSave(JSON.stringify(invalid))).toThrow(
      "Invalid curse room",
    );
    const duplicate = structuredClone(dark);
    mutableStatus(duplicate, "P1").paralysis = ["same", "same"];
    expect(() => loadSave(JSON.stringify(duplicate))).toThrow(
      "Duplicate curse token",
    );
    const old = initialState(["A", "B"], "old-save");
    const json = JSON.parse(JSON.stringify(old));
    delete json.blackMirror;
    delete json.rules.blackMirrorPolicies;
    const migrated = loadSave(JSON.stringify(json));
    expect(migrated.blackMirror.heroes.P1.visited).toEqual(["Hall"]);
    expect(migrated.rules.blackMirrorPolicies.allowSkip).toBe(false);
  });
  it.each([1, 2, 3])(
    "Paralysis %i blocks exactly the subsequent affected turns, including the final removal",
    (n) => {
      const s = curseFixture();
      const status = mutableStatus(s, "P1");
      status.paralysis = Array.from({ length: n }, (_, i) => `p${i}`);
      for (let i = 0; i < n; i++) {
        beginHeroTurn(s);
        expect(isImmobilized(s, "P1")).toBe(true);
        expect(status.paralysis).toHaveLength(n - i - 1);
      }
      beginHeroTurn(s);
      expect(isImmobilized(s, "P1")).toBe(false);
    },
  );
  it("allows ending an immobilized turn, keeps other local actions available, and never refreshes twice on Reveal", () => {
    let s = apply(curseFixture());
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    expect(() =>
      reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "Hall"] }),
    ).toThrow();
    s = reduce(s, { type: "END", playerId: "P1" });
    expect(s.active).toBe(1);
    s = reduce(s, { type: "REVEAL", playerId: "P2" });
    const before = structuredClone(s.blackMirror);
    s = reduce(s, { type: "REVEAL", playerId: "P2" });
    expect(s.blackMirror).toEqual(before);
  });
  it("removes one chosen Hexlock and one chosen Sigil Seal per turn; stacked action Seals persist", () => {
    let s = apply(curseFixture("BM-28"));
    s.pending = null;
    s.mosaic[0] = "Scarlet";
    const st = mutableStatus(s, "P1");
    st.hexlocks.push(
      { id: "hex-a", category: "ELEMENT", slot: "elements" },
      { id: "hex-b", category: "MIRROR", slot: "mirrors" },
    );
    const spell = s.blackMirror.seals[0].spell,
      action = s.blackMirror.seals[0].action!;
    beginHeroTurn(s);
    s = answerAll(s);
    expect(statusOf(s, "P1").hexlocks).toHaveLength(1);
    expect(spellSeals(s, spell, action)).toHaveLength(2);
    beginHeroTurn(s);
    s = answerAll(s);
    expect(spellSeals(s, spell, action)).toHaveLength(1);
    beginHeroTurn(s);
    expect(spellSeals(s, spell, action)).toHaveLength(0);
  });
  it("Fear requires discovered destinations away from its origin and separate turns", () => {
    const s = curseFixture("BM-18");
    const st = mutableStatus(s, "P1");
    st.fear = [
      { id: "f1", origin: "R01" },
      { id: "f2", origin: "R01" },
    ];
    visitRoom(s, s.players[0], "R34");
    expect(st.fear).toHaveLength(2);
    visitRoom(s, s.players[0], "R01");
    expect(st.fear).toHaveLength(2);
    visitRoom(s, s.players[0], "R02");
    expect(st.fear).toHaveLength(1);
    visitRoom(s, s.players[0], "R03");
    expect(st.fear).toHaveLength(1);
    s.turn++;
    visitRoom(s, s.players[0], "R02");
    expect(st.fear).toHaveLength(0);
  });
  it("Darkness stacks, blocks actions until paid, preserves hidden findings and permits departure", () => {
    let s = curseFixture();
    s.blackMirror.rooms.R01 = { darkness: 2, portal: false };
    expect(() =>
      reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        direction: "leave",
        tokenId: "E-Air-1",
      }),
    ).toThrow("Darkness");
    const moved = reduce(s, {
      type: "MOVE",
      playerId: "P1",
      path: ["R01", "Hall"],
    });
    expect(moved.players[0].room).toBe("Hall");
    s = reduce(s, { type: "CLEAR_DARKNESS", playerId: "P1" });
    expect(s.players[0].courage).toBe(29);
    expect(s.blackMirror.rooms.R01.darkness).toBe(1);
    s = reduce(s, { type: "CLEAR_DARKNESS", playerId: "P1" });
    expect(s.blackMirror.rooms.R01.darkness).toBe(0);
  });
  it("Portals form a chosen one-step network and Seals preserve connectivity", () => {
    let s = curseFixture();
    s.blackMirror.rooms.R01 = { darkness: 0, portal: true,portalPair:"pair-a" };
    expect(connections(s, "R01")).not.toContain("R35");
    s.blackMirror.rooms.R35 = { darkness: 0, portal: true,portalPair:"pair-a" };
    s.blackMirror.rooms.R34 = { darkness: 0, portal: true,portalPair:"pair-b" };
    expect(connections(s, "R01")).toEqual(
      expect.arrayContaining(["R35"]),
    );
    expect(connections(s,"R01")).not.toContain("R34");
    expect(castlePath(s, "R01", "R35")).toEqual(["R01", "R35"]);
    s = reduce(s, { type: "MOVE", playerId: "P1", path: ["R01", "R35"] });
    expect(s.rooms.R35.explored).toBe(true);
    for (const edge of corridorIds)
      if (legalThreshold(s, edge)) s.blackMirror.thresholds.push(edge);
    expect(
      corridorIds.some(
        (edge) =>
          !s.blackMirror.thresholds.includes(edge) && !legalThreshold(s, edge),
      ),
    ).toBe(true);
    for (const id of Object.keys(s.rooms))
      expect(castlePath(s, "Hall", id).length).toBeGreaterThan(0);
  });
  it("preserves Sigil bindings under temporary seals and spends them when abandoning a Spell", () => {
    let s = curseFixture("BM-25");
    s.blackMirror.bindings["SP-01"] = ["Scarlet", "Emerald"];
    s = apply(s);
    expect(s.blackMirror.bindings["SP-01"]).toEqual(["Scarlet", "Emerald"]);
    expect(spellSeals(s, "SP-01", 1)).toHaveLength(1);
    s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
    s = reduce(s, { type: "LEAVE_SPELL", playerId: "P1", spellId: "SP-01" });
    expect(s.blackMirror.spentSigils).toEqual(["Scarlet", "Emerald"]);
    expect(s.blackMirror.bindings["SP-01"]).toBeUndefined();
    expect(s.blackMirror.seals.some((seal) => seal.spell === "SP-01")).toBe(
      true,
    );
  });
  it("rejects stale choices atomically and completes a lethal curse's collision", () => {
    let s = curseFixture("BM-08");
    s = reduce(s, { type: "COLLIDE", playerId: "P1" });
    s = reduce(s, {
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
    const before = structuredClone(s);
    expect(() =>
      reduce(s, {
        type: "CURSE_CHOICE",
        playerId: "P1",
        choiceId: "old",
        ids: [],
      }),
    ).toThrow();
    expect(s).toEqual(before);
    let lethal = curseFixture("BM-07");
    lethal.players[0].courage = 1;
    lethal = apply(lethal);
    expect(lethal.players[0].dead).toBe(true);
    expect(lethal.rooms.R01.restored).toBe(true);
    expect(lethal.rage).toBe(1);
  });
});
