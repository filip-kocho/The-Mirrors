import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  loadSave,
  type State,
  type Token,
} from "../src/game/domain/engine";
import { secrets, secretById } from "../src/game/cards/secrets";
import { byId, colors } from "../src/game/cards/catalog";
import { evaluateSecretCondition } from "../src/game/systems/secrets";
import { attachCompanion } from "../src/game/systems/companions";
import { grantSigil, takeSigils } from "../src/game/systems/sigils";
export function fixture() {
  const s = initialState(["A", "B"], "secrets-v06");
  const pool = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(pool);
  s.players[0].room = "R01";
  return s;
}
export function hidden(s: State, id: string) {
  s.decks.Secret = s.decks.Secret.filter((x) => x !== id);
  s.players[0].secrets.push(id);
}
export function add(s: State, id: string) {
  const c = byId[id];
  s.decks[c.family] = s.decks[c.family].filter((x) => x !== id);
  const t: Token = { id, card: id, kind: c.family as Token["kind"] };
  if (c.family === "Companion") attachCompanion(s, s.players[0], t, true);
  else s.players[0].inventory.push(t);
}
export function physical(s: State, id: string) {
  const i = s.rooms.Hall.objects.findIndex((t) => t.id === id);
  if (i < 0) throw Error(id);
  s.players[0].inventory.push(...s.rooms.Hall.objects.splice(i, 1));
}
export function qualify(s: State, id: string) {
  switch (id) {
    case "SE-01":
      physical(s, "E-Air-1");
      physical(s, "E-Air-2");
      break;
    case "SE-02":
      for (const e of ["Air", "Earth", "Fire"]) physical(s, `E-${e}-1`);
      break;
    case "SE-03":
      physical(s, "WM-01");
      physical(s, "BM-01");
      break;
    case "SE-04":
      physical(s, "WM-01");
      physical(s, "WM-02");
      break;
    case "SE-05":
      add(s, "IT-01");
      add(s, "IT-11");
      break;
    case "SE-06":
      add(s, "IT-21");
      break;
    case "SE-07":
      for (const [i, c] of ["SP-01", "SP-02"].entries()) {
        add(s, c);
        s.players[0].knowledge[i] = true;
        s.players[0].spellSlots[i] = c;
      }
      break;
    case "SE-08":
      add(s, "CO-05");
      add(s, "CO-06");
      break;
    case "SE-09":
      hidden(s, "SE-15");
      break;
    case "SE-10":
      grantSigil(s, "P1", "Scarlet");
      grantSigil(s, "P1", "Amber");
      break;
    case "SE-11":
      add(s, "IT-01");
      for (let i = 1; i <= 4; i++) physical(s, `E-Air-${i}`);
      break;
    case "SE-12":
      add(s, "IT-01");
      for (const e of ["Air", "Earth", "Water", "Fire", "Aether"])
        physical(s, `E-${e}-1`);
      break;
    case "SE-13":
      add(s, "IT-03");
      for (let i = 1; i <= 3; i++) physical(s, `WM-0${i}`);
      break;
    case "SE-14":
      add(s, "IT-24");
      add(s, "IT-21");
      break;
    case "SE-15":
      for (const [i, c] of ["SP-01", "SP-02", "SP-03", "SP-04"].entries()) {
        add(s, c);
        s.players[0].knowledge[i] = true;
        s.players[0].spellSlots[i] = c;
      }
      break;
  }
}
export const claim = (s: State, id: string) =>
  reduce(s, { type: "REVEAL_SECRET", playerId: "P1", secretId: id });
describe("Secret v0.6", () => {
  it("contains only the fifteen revised rewards", () => {
    expect(secrets).toHaveLength(15);
    expect(
      secrets.filter((c) => c.subtype === "DIAMOND_CHALLENGE"),
    ).toHaveLength(10);
    expect(
      secrets.filter((c) => c.subtype === "HEROIC_ACHIEVEMENT"),
    ).toHaveLength(5);
    for (const c of secrets)
      expect(c.reward).toEqual(
        Number(c.id.slice(3)) <= 10
          ? { type: "DIAMOND_GEM", amount: 1 }
          : { type: "COURAGE", amount: 5 },
      );
  });
  for (const card of secrets)
    it(`${card.id} validates its collection and grants the exact reward once`, () => {
      let s = fixture();
      hidden(s, card.id);
      expect(evaluateSecretCondition(card, "P1", s).eligible).toBe(false);
      expect(() => claim(s, card.id)).toThrow();
      qualify(s, card.id);
      expect(evaluateSecretCondition(card, "P1", s).eligible).toBe(true);
      const inventory = structuredClone(s.players[0].inventory),
        courage = s.players[0].courage;
      s = claim(s, card.id);
      expect(s.players[0].inventory).toEqual(inventory);
      expect(s.players[0].courage).toBe(
        courage + (card.reward.type === "COURAGE" ? 5 : 0),
      );
      expect(s.players[0].completedSecrets[0].rewardType).toBe(
        card.reward.type,
      );
      expect(() => claim(s, card.id)).toThrow();
      expect(loadSave(JSON.stringify(s))).toEqual(s);
    });
  it("room and foreign resources cannot qualify personal achievements", () => {
    const s = fixture();
    hidden(s, "SE-05");
    add(s, "IT-01");
    add(s, "IT-11");
    s.rooms.R01.objects.push(s.players[0].inventory.pop()!);
    expect(evaluateSecretCondition(secretById["SE-05"], "P1", s).eligible).toBe(
      false,
    );
  });
  it("Carrier Item occupancy is not Equipment and Twins count as two cards", () => {
    const s = fixture();
    add(s, "CO-08");
    add(s, "IT-11");
    expect(evaluateSecretCondition(secretById["SE-05"], "P1", s).eligible).toBe(
      false,
    );
    add(s, "CO-05");
    add(s, "CO-06");
    expect(evaluateSecretCondition(secretById["SE-08"], "P1", s).eligible).toBe(
      true,
    );
  });
  it("SE-10 excludes starting Wild and assigned colored Sigils", () => {
    const s = fixture();
    hidden(s, "SE-10");
    grantSigil(s, "P1", "Scarlet");
    expect(evaluateSecretCondition(secretById["SE-10"], "P1", s).eligible).toBe(
      false,
    );
    grantSigil(s, "P1", "Amber");
    expect(evaluateSecretCondition(secretById["SE-10"], "P1", s).eligible).toBe(
      true,
    );
    takeSigils(s, "P1", [s.spells.availableIds.P1[1]]);
    expect(evaluateSecretCondition(secretById["SE-10"], "P1", s).eligible).toBe(
      false,
    );
  });
  it("overlapping collections remain and capped hard rewards log actual gain", () => {
    let s = fixture();
    hidden(s, "SE-01");
    hidden(s, "SE-11");
    qualify(s, "SE-11");
    s = claim(s, "SE-01");
    s.players[0].courage = 34;
    s = claim(s, "SE-11");
    expect(s.players[0].courage).toBe(35);
    expect(s.players[0].completedSecrets[1].gained).toBe(1);
    expect(
      s.players[0].inventory.filter((t) => t.kind === "Element"),
    ).toHaveLength(4);
  });
  it("SE-09 counts itself before revealing; completed Secrets do not count", () => {
    let s = fixture();
    hidden(s, "SE-09");
    hidden(s, "SE-06");
    qualify(s, "SE-06");
    s = claim(s, "SE-06");
    expect(() => claim(s, "SE-09")).toThrow();
    hidden(s, "SE-15");
    s = claim(s, "SE-09");
    expect(s.players[0].secrets).toEqual(["SE-15"]);
    expect(s.magic.gems.find((g) => g.secret === "SE-09")?.location).toBe(
      "ROOM",
    );
  });
  it("privacy and ownership block reveals without altering the original state", () => {
    const s = fixture();
    hidden(s, "SE-06");
    qualify(s, "SE-06");
    s.privacy = true;
    const before = JSON.stringify(s);
    expect(() => claim(s, "SE-06")).toThrow();
    expect(() =>
      reduce(s, { type: "REVEAL_SECRET", playerId: "P2", secretId: "SE-06" }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it("discarded achievements remain unavailable", () => {
    const s = fixture();
    hidden(s, "SE-06");
    qualify(s, "SE-06");
    s.players[0].secrets = [];
    s.removed.push({ id: "SE-06", card: "SE-06", kind: "Secret" });
    expect(() => claim(s, "SE-06")).toThrow();
    expect(loadSave(JSON.stringify(s))).toEqual(s);
  });
});
