import { test, expect, type Page } from "@playwright/test";
import { initialState, reduce, type State } from "../../src/game/domain/engine";
import { byId } from "../../src/game/cards/catalog";
import {
  grantSigil,
  availableSigils,
  takeSigils,
  discardSigils,
} from "../../src/game/systems/sigils";
import { spellActivationPlan } from "../../src/game/systems/spellActivation";
import { attachCompanion } from "../../src/game/systems/companions";
import {
  mutableStatus,
  beginHeroTurn,
} from "../../src/game/systems/blackMirrorRuntime";
function equip(s: State, id: string) {
  s.decks.Spell = s.decks.Spell.filter((x) => x !== id);
  s.players[0].inventory.push({ id, card: id, kind: "Spell" });
  const i = s.players[0].spellSlots.findIndex((x) => !x);
  s.players[0].spellSlots[i] = id;
  s.players[0].knowledge[i] = true;
}
function bind(s: State, id: string) {
  equip(s, id);
  for (const color of byId[id].casting_modes![1].sigil_slots)
    grantSigil(s, "P1", color);
  return reduce(s, {
    type: "CAST_SPELL",
    playerId: "P1",
    spellId: id,
    action: 1,
    sigilIds: spellActivationPlan(s, id, 1).selected,
  });
}
async function resume(page: Page, s: State) {
  await page.goto("/");
  await page.evaluate(
    (s) => localStorage.setItem("the-mirrors-save-v1", JSON.stringify(s)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
}
const saved = (page: Page): Promise<State> =>
  page.evaluate(() => JSON.parse(localStorage.getItem("the-mirrors-save-v1")!));
test("Companion token removal is usable outside the card and keeps its round limit", async ({
  page,
}) => {
  const s = initialState(["Rowan", "Elara"], "companion-ability-ui");
  s.decks.Companion = s.decks.Companion.filter((x) => x !== "CO-08");
  attachCompanion(s, s.players[0], {
    id: "CO-08",
    card: "CO-08",
    kind: "Companion",
  });
  mutableStatus(s, "P1").hexlocks = [
    { id: "lock-a", category: "ELEMENT", slot: "elements", index: 0 },
    { id: "lock-b", category: "MIRROR", slot: "mirrors", index: 0 },
  ];
  await resume(page, s);
  await page.getByRole("button", { name: /Inspect Mamba/ }).click();
  const d = page.getByRole("dialog"),
    panel = d.getByLabel("Companion ability", { exact: true });
  await expect(
    d.locator(".game-card").getByRole("button", { name: "Use ability" }),
  ).toHaveCount(0);
  await panel.getByRole("checkbox", { name: "elements Hexlock" }).check();
  await panel.getByRole("button", { name: "Use ability" }).click();
  expect(
    (await saved(page)).blackMirror.heroes.P1.hexlocks.map((h) => h.id),
  ).toEqual(["lock-b"]);
  await expect(panel).toContainText("already used");
});
test("discounted Permanent sockets bind through the card and SP-16 returns those physical Sigils", async ({
  page,
}) => {
  let s = bind(initialState(["Rowan", "Elara"], "discount-ui"), "SP-16");
  equip(s, "SP-02");
  discardSigils(
    s,
    takeSigils(
      s,
      "P1",
      availableSigils(s).map((t) => t.id),
    ),
  );
  grantSigil(s, "P1", "Emerald");
  grantSigil(s, "P1", "Scarlet");
  await resume(page, s);
  await page
    .getByRole("button", { name: /Inspect Drawn Curtain.*knowledge slot/ })
    .click();
  const d = page.getByRole("dialog");
  await expect(
    d.getByRole("button", { name: "Permanent Amber socket 2" }),
  ).toBeDisabled();
  await d.getByRole("button", { name: "Permanent Emerald socket 1" }).click();
  await d.getByRole("button", { name: "Bind Permanently" }).click();
  expect((await saved(page)).blackMirror.bindings["SP-02"]).toEqual([
    "Emerald",
  ]);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: /Inspect Warding Flame.*knowledge slot/ })
    .click();
  const quick = d.getByLabel("Quick activation", { exact: true });
  await quick.getByRole("checkbox", { name: "Drawn Curtain" }).check();
  await d.getByRole("button", { name: "Quick Scarlet socket 1" }).click();
  await quick.getByRole("button", { name: "Activate Quick" }).click();
  const next = await saved(page);
  expect(next.blackMirror.bindings["SP-02"]).toBeUndefined();
  expect(next.players[0].courage).toBe(19);
  expect(next.spells.permanentWaivers["SP-02"]).toBeUndefined();
});
test("turn-start Portal offers select the second room on the map and place a matching pair", async ({
  page,
}) => {
  let s = bind(initialState(["Rowan", "Elara"], "portal-ui"), "SP-32");
  s.players[0].room = "R01";
  s.turn = 3;
  beginHeroTurn(s);
  await resume(page, s);
  const d = page.getByRole("dialog", { name: "Turn-start Portal" });
  await expect(
    d.getByRole("button", { name: "Place Portal pair" }),
  ).toBeDisabled();
  await d.getByRole("button", { name: /R35/ }).click();
  await d.getByRole("button", { name: "Place Portal pair" }).click();
  const next = await saved(page);
  expect(next.blackMirror.rooms.R01.portalPair).toBe(
    next.blackMirror.rooms.R35.portalPair,
  );
  expect(
    Object.values(next.blackMirror.rooms).filter((r) => r.portal),
  ).toHaveLength(2);
});
