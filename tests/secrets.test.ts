import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  loadSave,
  assertState,
  capacities,
  type State,
  type Token,
} from "../src/game/domain/engine";
import { byId, cards, elements } from "../src/game/cards/catalog";
import {
  secrets,
  secretById,
  spellTiers,
  type SpellTier,
} from "../src/game/cards/secrets";
import {
  evaluateSecretCondition,
  secretRevealPlan,
} from "../src/game/systems/secrets";
import { itemActionPlan } from "../src/game/systems/itemActions";
import {
  mutableStatus,
  visitRoom,
} from "../src/game/systems/blackMirrorRuntime";

function fixture() {
  const s = initialState(["Rowan", "Elara"], "secrets-v05");
  const all = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(all);
  s.players[0].room = "R01";
  return s;
}
function add(s: State, id: string, target = s.players[0].inventory) {
  const c = byId[id];
  if (c.family.endsWith("Mirror")) {
    const at = s.rooms.Hall.objects.findIndex((t) => t.id === id);
    target.push(...s.rooms.Hall.objects.splice(at, 1));
  } else {
    s.decks[c.family] = s.decks[c.family].filter((c) => c !== id);
    target.push({ id, card: id, kind: c.family as Token["kind"] });
  }
}
function hidden(s: State, ...ids: string[]) {
  for (const id of ids) {
    s.decks.Secret = s.decks.Secret.filter((c) => c !== id);
    s.players[0].secrets.push(id);
  }
}
function element(s: State, type: (typeof elements)[number], count = 1) {
  for (let i = 0; i < count; i++) {
    const at = s.rooms.Hall.objects.findIndex((t) => t.element === type);
    s.players[0].inventory.push(...s.rooms.Hall.objects.splice(at, 1));
  }
}
function spells(s: State, tier: SpellTier, count: number) {
  const selected = cards
    .filter((c) => c.family === "Spell" && c.subtype === tier)
    .slice(0, count);
  for (const card of selected) {
    add(s, card.id);
    const slot = s.players[0].spellSlots.indexOf(null);
    s.players[0].knowledge[slot] = true;
    s.players[0].spellSlots[slot] = card.id;
  }
  return selected;
}
function companions(s: State, count: number) {
  for (let i = 1; i <= count; i++)
    add(s, `CO-${String(i).padStart(2, "0")}`, s.players[0].companions);
}
const eligible = (s: State, id: string) =>
  evaluateSecretCondition(secretById[id], "P1", s);
const claim = (s: State, id: string, tier?: SpellTier) =>
  reduce(s, { type: "REVEAL_SECRET", playerId: "P1", secretId: id, tier });
const setups: Record<string, (s: State) => void> = {
  "SE-01": (s) => {
    add(s, "IT-01");
    element(s, "Fire", 4);
  },
  "SE-02": (s) => {
    add(s, "IT-01");
    elements.slice(0, 4).forEach((e) => element(s, e));
  },
  "SE-03": (s) => {
    add(s, "IT-03");
    ["BM-01", "BM-02", "BM-03"].forEach((id) => add(s, id));
  },
  "SE-04": (s) => {
    add(s, "IT-03");
    ["WM-01", "WM-02", "WM-03"].forEach((id) => add(s, id));
  },
  "SE-05": (s) => {
    ["IT-02", "IT-01", "IT-03"].forEach((id) => add(s, id));
  },
  "SE-06": (s) => {
    add(s, "IT-11");
    ["IT-12", "IT-13"].forEach((id) => add(s, id, s.rooms.R01.objects));
  },
  "SE-07": (s) => {
    add(s, "IT-24");
    add(s, "IT-21");
  },
  "SE-08": (s) => {
    spells(s, "Basic", 4);
  },
  "SE-09": (s) => {
    spells(s, "Basic", 3);
  },
  "SE-10": (s) => companions(s, 3),
  "SE-11": (s) => hidden(s, "SE-01", "SE-02", "SE-03"),
  "SE-12": (s) => {
    add(s, "IT-01");
    elements.forEach((e) => element(s, e));
  },
  "SE-13": (s) => {
    add(s, "IT-03");
    ["BM-01", "WM-01", "WM-02"].forEach((id) => add(s, id));
  },
  "SE-14": (s) => {
    const used = new Set<string>();
    for (const c of cards.filter((c) => c.family === "Spell")) {
      const action =
        c.casting_modes?.findIndex(
          (m) =>
            m.name.toUpperCase() === "PERMANENT" &&
            m.sigil_slots.some((color) => !used.has(color)),
        ) ?? -1;
      if (action < 0) continue;
      add(s, c.id);
      const slot = s.players[0].spellSlots.indexOf(null);
      s.players[0].knowledge[slot] = true;
      s.players[0].spellSlots[slot] = c.id;
      const colors = c.casting_modes![action].sigil_slots;
      s.players[0].sigils.push(...colors);
      const next = reduce(s, {
        type: "BIND_SIGILS",
        playerId: "P1",
        spellId: c.id,
        action,
      });
      Object.assign(s, next);
      colors.forEach((c) => used.add(c));
      if (used.size >= 3) break;
    }
  },
  "SE-15": (s) => {
    companions(s, 2);
    s.players[0].companions[0].behavior = "LOYAL";
    s.players[0].companions[1].behavior = "STRAY";
    add(s, "IT-21");
  },
};

describe("Secret achievement v0.5 catalog and individual lifecycles", () => {
  it("White discovery keeps a newly eligible Secret hidden without automatically rewarding or naming it", () => {
    let s = fixture();
    hidden(s, "SE-01", "SE-02", "SE-03");
    s.decks.Secret = [
      "SE-11",
      ...s.decks.Secret.filter((id) => id !== "SE-11"),
    ];
    add(s, "WM-01", s.rooms.R01.objects);
    add(s, "BM-01", s.rooms.R01.objects);
    s = reduce(s, {
      type: "PLACE_MIRRORS",
      playerId: "P1",
      whiteId: "WM-01",
      blackId: "BM-01",
    });
    expect(s.players[0].secrets).toContain("SE-11");
    expect(eligible(s, "SE-11").eligible).toBe(true);
    expect(s.players[0].completedSecrets).toEqual([]);
    expect(s.players[0].courage).toBe(17);
    expect(s.rooms.R01.objects.some((t) => t.kind === "Secret")).toBe(false);
    expect(
      s.log.some(
        (e) =>
          e.text.includes("SE-11") || e.text.includes("Keeper of Whispers"),
      ),
    ).toBe(false);
  });
  it("claiming another card can make Keeper of Whispers ineligible immediately", () => {
    let s = fixture();
    hidden(s, "SE-11", "SE-12", "SE-01", "SE-02");
    setups["SE-12"](s);
    expect(eligible(s, "SE-11").eligible).toBe(true);
    s = claim(s, "SE-12");
    expect(eligible(s, "SE-11").eligible).toBe(false);
    expect(() => claim(s, "SE-11")).toThrow(/not yet eligible/);
  });
  it("capacity-loss choices block claims and leaving learned Spells removes their permanent colors", () => {
    let s = fixture();
    hidden(s, "SE-01");
    setups["SE-01"](s);
    s = reduce(s, {
      type: "TRANSFER",
      playerId: "P1",
      tokenId: "IT-01",
      direction: "leave",
    });
    expect(s.blackMirror.resolution?.phase).toBe("inventory");
    expect(() => claim(s, "SE-01")).toThrow();
    let t = fixture();
    hidden(t, "SE-14");
    setups["SE-14"](t);
    expect(eligible(t, "SE-14").eligible).toBe(true);
    for (const spellId of t.players[0].spellSlots.filter(
      (id): id is string => !!id,
    ))
      t = reduce(t, { type: "LEAVE_SPELL", playerId: "P1", spellId });
    expect(eligible(t, "SE-14").eligible).toBe(false);
    expect(t.blackMirror.spentSigils.length).toBeGreaterThanOrEqual(3);
    expect(loadSave(JSON.stringify(t))).toEqual(t);
  });
  it("replaces exactly 15 Secret definitions with typed achievements and Courage rewards", () => {
    expect(secrets).toHaveLength(15);
    expect(new Set(secrets.map((c) => c.id)).size).toBe(15);
    for (let i = 1; i <= 15; i++) {
      const c = byId[`SE-${String(i).padStart(2, "0")}`];
      expect(c.subtype).toBe("SECRET_ACHIEVEMENT");
      expect(c).toEqual(secretById[c.id]);
      expect(secretById[c.id].reward.type).toBe("COURAGE");
    }
    expect(
      secrets.filter((c) => "byTier" in c.reward).map((c) => c.id),
    ).toEqual(["SE-09"]);
  });
  it.each(secrets)(
    "$id qualifies from current collections and completes exactly once without consumption",
    (card) => {
      let s = fixture();
      hidden(s, card.id);
      expect(eligible(s, card.id).eligible).toBe(false);
      setups[card.id](s);
      assertState(s);
      const before = structuredClone(s);
      expect(eligible(s, card.id).eligible).toBe(true);
      expect(s).toEqual(before);
      const reward = secretRevealPlan(s, "P1", card.id).reward;
      s = claim(s, card.id);
      expect(s.players[0].courage).toBe(18 + reward);
      expect(s.players[0].secrets).not.toContain(card.id);
      expect(s.players[0].completedSecrets).toEqual([
        {
          id: card.id,
          turn: 1,
          reward,
          gained: reward,
          ...(card.id === "SE-09" ? { tier: "Basic" } : {}),
        },
      ]);
      expect(s.players[0].inventory).toEqual(before.players[0].inventory);
      expect(s.players[0].companions).toEqual(before.players[0].companions);
      expect(s.blackMirror.bindings).toEqual(before.blackMirror.bindings);
      expect(loadSave(JSON.stringify(s))).toEqual(s);
      expect(() => claim(s, card.id)).toThrow(/unrevealed/);
    },
  );
  it.each(spellTiers)(
    "SE-09 uses printed %s tiers despite discounts and validates chosen tier",
    (tier) => {
      let s = fixture();
      hidden(s, "SE-09");
      add(s, "IT-10");
      spells(s, tier, 3);
      const reward = { Basic: 2, Intermediate: 4, Advanced: 6 }[tier];
      expect(eligible(s, "SE-09").variants).toEqual([{ tier, reward }]);
      const wrong = spellTiers.find((t) => t !== tier)!;
      expect(() => claim(s, "SE-09", wrong)).toThrow(/qualifying/);
      s = claim(s, "SE-09", tier);
      expect(s.players[0].courage).toBe(18 + reward);
      expect(
        cards.filter((c) => c.family === "Spell" && c.subtype === tier).length,
      ).toBeGreaterThanOrEqual(3);
    },
  );
  it("uses physical Elements, never doubling, wildcard substitution or room tokens", () => {
    const s = fixture();
    add(s, "IT-06");
    element(s, "Air", 2);
    expect(eligible(s, "SE-01").eligible).toBe(false);
    element(s, "Air");
    expect(eligible(s, "SE-01").eligible).toBe(false);
    element(s, "Air");
    expect(eligible(s, "SE-02").eligible).toBe(false);
    s.players[0].inventory = s.players[0].inventory.filter(
      (t) => t.kind !== "Element",
    );
    add(s, "IT-05");
    ["Fire", "Water", "Earth", "Aether"].forEach((e) =>
      element(s, e as (typeof elements)[number]),
    );
    expect(eligible(s, "SE-02").eligible).toBe(true);
    expect(eligible(s, "SE-12").eligible).toBe(false);
    s.rooms.R01.objects.push(...s.players[0].inventory.splice(0));
    expect(eligible(s, "SE-02").eligible).toBe(false);
  });
  it("SE-03/04 exclude room mirrors and SE-13 requires both colors", () => {
    const s = fixture();
    setups["SE-03"](s);
    expect(eligible(s, "SE-13").eligible).toBe(false);
    expect(eligible(s, "SE-04").eligible).toBe(false);
    s.rooms.R01.objects.push(...s.players[0].inventory.splice(1));
    expect(eligible(s, "SE-03").eligible).toBe(false);
  });
  it("SE-05 is legally reachable with IT-02 itself and two more Equipment, not Tools or Relics", () => {
    let s = fixture();
    hidden(s, "SE-05");
    ["IT-02", "IT-01", "IT-03"].forEach((id) =>
      add(s, id, s.rooms.R01.objects),
    );
    for (const id of ["IT-02", "IT-01", "IT-03"])
      s = reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        tokenId: id,
        direction: "take",
      });
    expect(capacities(s.players[0].inventory).items).toBe(3);
    expect(eligible(s, "SE-05").eligible).toBe(true);
    expect(claim(s, "SE-05").players[0].courage).toBe(22);
    s = reduce(s, {
      type: "TRANSFER",
      playerId: "P1",
      tokenId: "IT-03",
      direction: "leave",
    });
    add(s, "IT-11");
    add(s, "IT-21");
    expect(eligible(s, "SE-05").eligible).toBe(false);
  });
  it("SE-06 deduplicates Tools, permits current-room access only and ignores other owners", () => {
    const s = fixture();
    setups["SE-06"](s);
    s.rooms.R01.objects.push(s.players[0].inventory[0]);
    expect(eligible(s, "SE-06").progress).toContain("3/3");
    s.players[1].inventory.push(s.rooms.R01.objects.shift()!);
    expect(eligible(s, "SE-06").eligible).toBe(false);
    s.players[0].room = "R02";
    expect(eligible(s, "SE-06").eligible).toBe(false);
  });
  it("SE-07 does not count a room Relic, and SE-08/09 ignore unlearned or mixed-tier Spells", () => {
    const s = fixture();
    add(s, "IT-24");
    add(s, "IT-21", s.rooms.R01.objects);
    expect(eligible(s, "SE-07").eligible).toBe(false);
    spells(s, "Basic", 2);
    spells(s, "Intermediate", 1);
    add(s, "SP-04", s.rooms.R01.objects);
    expect(eligible(s, "SE-09").eligible).toBe(false);
    expect(eligible(s, "SE-08").eligible).toBe(false);
  });
  it("SE-10/15 lose eligibility after abandonment or a Stray transfers; missing any requirement fails", () => {
    const s = fixture();
    setups["SE-15"](s);
    for (const missing of ["LOYAL", "STRAY", "RELIC"]) {
      const copy = structuredClone(s);
      if (missing === "RELIC")
        copy.rooms.R01.objects.push(...copy.players[0].inventory.splice(0));
      else
        copy.rooms.R01.objects.push(
          ...copy.players[0].companions.splice(missing === "LOYAL" ? 0 : 1, 1),
        );
      expect(eligible(copy, "SE-15").eligible).toBe(false);
    }
    s.players[1].room = "R01";
    visitRoom(s, s.players[1], "Hall");
    expect(eligible(s, "SE-15").eligible).toBe(false);
    const t = fixture();
    companions(t, 3);
    t.rooms.R01.objects.push(t.players[0].companions.pop()!);
    expect(eligible(t, "SE-10").eligible).toBe(false);
  });
  it("SE-14 ignores free Sigils, discarded bindings and repeated permanent colors", () => {
    const s = fixture();
    spells(s, "Basic", 1);
    const id = s.players[0].spellSlots[0]!;
    s.players[0].sigils = ["Scarlet", "Emerald", "Amber"];
    expect(eligible(s, "SE-14").eligible).toBe(false);
    s.blackMirror.bindings[id] = ["Scarlet", "Scarlet", "Scarlet"];
    expect(eligible(s, "SE-14").eligible).toBe(false);
    s.blackMirror.bindings[id] = ["Scarlet", "Emerald", "Amber"];
    expect(eligible(s, "SE-14").eligible).toBe(true);
    s.players[0].spellSlots[0] = null;
    expect(eligible(s, "SE-14").eligible).toBe(false);
  });
  it("permits overlapping achievements and permanently retains completion after resources leave", () => {
    let s = fixture();
    hidden(s, "SE-02", "SE-12");
    setups["SE-12"](s);
    s = claim(s, "SE-02");
    s = claim(s, "SE-12");
    expect(s.players[0].courage).toBe(26);
    for (const t of [...s.players[0].inventory].filter(
      (t) => t.kind === "Element",
    ))
      s = reduce(s, {
        type: "TRANSFER",
        playerId: "P1",
        tokenId: t.id,
        direction: "leave",
      });
    expect(s.players[0].completedSecrets).toHaveLength(2);
    expect(eligible(s, "SE-12").eligible).toBe(false);
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
  it("SE-11 counts itself before reveal, never completed Secrets; IT-16 cannot spend completed cards", () => {
    let s = fixture();
    hidden(s, "SE-11");
    setups["SE-11"](s);
    add(s, "IT-16");
    s = claim(s, "SE-11");
    expect(s.players[0].secrets).toHaveLength(3);
    expect(eligible(s, "SE-11").eligible).toBe(false);
    expect(itemActionPlan(s, "IT-16").options.map((o) => o.id)).not.toContain(
      "SE-11",
    );
    const before = structuredClone(s);
    expect(() =>
      reduce(s, {
        type: "USE_ITEM",
        playerId: "P1",
        itemId: "IT-16",
        ids: ["SE-11"],
        round: s.items.round,
        turn: s.turn,
      }),
    ).toThrow();
    expect(s).toEqual(before);
  });
  it("rejects stale, inactive, private-handoff, dead and pending-resolution requests atomically", () => {
    const s = fixture();
    hidden(s, "SE-07");
    setups["SE-07"](s);
    for (const change of [
      (s: State) => {
        s.active = 1;
      },
      (s: State) => {
        s.privacy = true;
      },
      (s: State) => {
        s.players[0].dead = true;
      },
      (s: State) => {
        s.pending = { room: "R01", card: "BM-01", stage: "penalty" };
      },
      (s: State) => {
        s.rooms.R01.objects.push(s.players[0].inventory.pop()!);
      },
    ]) {
      const copy = structuredClone(s);
      change(copy);
      const before = structuredClone(copy);
      expect(() => claim(copy, "SE-07")).toThrow();
      expect(copy).toEqual(before);
    }
  });
  it("caps actual Courage, allows personal collection claims in Darkness/Paralysis, and blocks excess capacity", () => {
    let s = fixture();
    hidden(s, "SE-07");
    setups["SE-07"](s);
    s.players[0].courage = 34;
    s.blackMirror.rooms.R01 = { darkness: 2, portal: false };
    mutableStatus(s, "P1").paralysis = ["p1"];
    s = claim(s, "SE-07");
    expect(s.players[0].courage).toBe(35);
    expect(s.players[0].completedSecrets[0].gained).toBe(1);
    const t = fixture();
    hidden(t, "SE-01");
    element(t, "Fire", 4);
    expect(() => claim(t, "SE-01")).toThrow(/excess/);
  });
  it("migrates old hidden hands without automatic rewards and rejects duplicated completed identities", () => {
    const s = fixture();
    hidden(s, "SE-11");
    const raw = JSON.parse(JSON.stringify(s));
    raw.players.forEach(
      (p: Record<string, unknown>) => delete p.completedSecrets,
    );
    const loaded = loadSave(JSON.stringify(raw));
    expect(loaded.players[0].secrets).toEqual(["SE-11"]);
    expect(loaded.players[0].completedSecrets).toEqual([]);
    expect(loaded.players[0].courage).toBe(18);
    loaded.players[0].completedSecrets.push({
      id: "SE-11",
      turn: 1,
      reward: 5,
      gained: 5,
    });
    expect(() => loadSave(JSON.stringify(loaded))).toThrow(/Secret supply/);
  });
});
