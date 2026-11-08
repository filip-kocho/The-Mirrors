import { test, expect, type Page } from "@playwright/test";
import { initialState, reduce, type State } from "../../src/game/domain/engine";
import { byId } from "../../src/game/cards/catalog";
import { grantSigil } from "../../src/game/systems/sigils";
import { spellActivationPlan } from "../../src/game/systems/spellActivation";
import { beginHeroTurn } from "../../src/game/systems/blackMirrorRuntime";
import { roomGraph } from "../../src/game/map/roomGraph";
const near = roomGraph.R01.neighbors.find((id) => id !== "Hall")!;
function fixture(id: string, action = 0) {
  const s = initialState(["Rowan", "Elara"], "spell-v04-browser");
  const pool = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(pool);
  s.players.forEach((p) => (p.room = "R01"));
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = id;
  s.players[0].inventory.push({ id, card: id, kind: "Spell" });
  s.decks.Spell = s.decks.Spell.filter((c) => c !== id);
  for (const color of byId[id].casting_modes![action].sigil_slots)
    grantSigil(s, "P1", color);
  return s;
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
async function open(page: Page, id: string, action = 0) {
  await page
    .getByRole("button", {
      name: new RegExp(`^Inspect ${byId[id].name}.*knowledge slot`),
    })
    .click();
  const d = page.getByRole("dialog");
  for (const [i, color] of byId[id].casting_modes![
    action
  ].sigil_slots.entries())
    await d
      .locator(".game-card")
      .getByRole("button", {
        name: `${action ? "Permanent" : "Quick"} ${color} socket ${i + 1}`,
      })
      .click();
  return d;
}
test("SP-35 uses the map outside the card and requires saved explicit consent", async ({
  page,
}, info) => {
  const s = fixture("SP-35");
  await resume(page, s);
  const d = await open(page, "SP-35"),
    actions = d.getByLabel("Quick activation", { exact: true });
  await expect(d.locator(".game-card input")).toHaveCount(0);
  await actions.getByRole("button", { name: new RegExp(`^${near} `) }).click();
  await actions.getByRole("checkbox", { name: /Invite Elara/ }).check();
  await actions.getByRole("button", { name: "Activate Quick" }).click();
  const invitation = page.getByRole("dialog", { name: "Teleport invitation" });
  await expect(invitation).toBeVisible();
  const pending = await saved(page);
  expect(pending.spells.quick).toHaveLength(0);
  expect(pending.players[0].room).toBe("R01");
  await resume(page, pending);
  await page
    .getByRole("button", { name: "I am Elara; accept journey" })
    .click();
  expect((await saved(page)).players.map((p) => p.room)).toEqual([near, near]);
  expect((await saved(page)).spells.quick).toHaveLength(1);
  await page.screenshot({ path: info.outputPath("teleport-complete.png") });
});
test("SP-24 pays a Tool cost once while bypassing its previous round use", async ({
  page,
}, info) => {
  const s = fixture("SP-24");
  s.decks.Item = s.decks.Item.filter((id) => id !== "IT-11");
  s.players[0].inventory.push({ id: "IT-11", card: "IT-11", kind: "Item" });
  const i = s.rooms.Hall.objects.findIndex((t) => t.id === "E-Fire-1");
  s.players[0].inventory.push(...s.rooms.Hall.objects.splice(i, 1));
  s.items.used.P1 = { "IT-11": s.items.round };
  await resume(page, s);
  const d = await open(page, "SP-24"),
    actions = d.getByLabel("Quick activation", { exact: true });
  await actions
    .getByRole("checkbox", { name: "Elemental Crucible", exact: true })
    .check();
  await actions.getByRole("checkbox", { name: "Fire", exact: true }).check();
  await page.screenshot({
    path: info.outputPath("actions-outside-card.png"),
    fullPage: true,
  });
  await actions.getByRole("button", { name: "Activate Quick" }).click();
  expect((await saved(page)).spentElements.map((t) => t.id)).toContain(
    "E-Fire-1",
  );
  expect((await saved(page)).spells.quick).toHaveLength(1);
});
test("SP-32 turn-start Portal persists and consumes only one supply token", async ({
  page,
}) => {
  let s = fixture("SP-32", 1);
  s = reduce(s, {
    type: "CAST_SPELL",
    playerId: "P1",
    spellId: "SP-32",
    action: 1,
    sigilIds: spellActivationPlan(s, "SP-32", 1).selected,
  });
  s.turn = 3;
  beginHeroTurn(s);
  await resume(page, s);
  const d = page.getByRole("dialog", { name: "Turn-start Portal" });
  await expect(d).toBeVisible();
  await d.getByRole("button", { name: "Place Portal", exact: true }).click();
  const after = await saved(page);
  expect(after.blackMirror.rooms.R01.portal).toBe(true);
  expect(after.players[0].sigils).toHaveLength(0);
  expect(after.blackMirror.bindings["SP-32"]).toHaveLength(3);
  await expect(d).not.toBeVisible();
});
test("SP-28 relocates a physical fragment using the puzzle selector without awarding rewards", async ({
  page,
}) => {
  const s = fixture("SP-28");
  s.mosaic[0] = "Scarlet";
  s.rage = 1;
  s.rooms.R35.restored = true;
  for (const id of ["WM-01", "BM-01"]) {
    const i = s.rooms.Hall.objects.findIndex((t) => t.id === id);
    s.removed.push(...s.rooms.Hall.objects.splice(i, 1));
  }
  const move = spellActivationPlan(s, "SP-28", 0)
    .choices[0].id.split(":")
    .map(Number);
  await resume(page, s);
  const d = await open(page, "SP-28"),
    actions = d.getByLabel("Quick activation", { exact: true });
  await actions
    .getByRole("button", { name: new RegExp(`^Cell ${move[0] + 1} `) })
    .click();
  await actions
    .getByRole("button", { name: `Cell ${move[1] + 1} legal`, exact: true })
    .click();
  await actions.getByRole("button", { name: "Activate Quick" }).click();
  const after = await saved(page);
  expect(after.mosaic[move[1]]).toBe("Scarlet");
  expect(after.mosaic[move[0]]).toBeNull();
  expect(after.rage).toBe(1);
  expect(after.players[0].courage).toBe(18);
});
