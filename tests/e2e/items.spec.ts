import { normalizeSigilIdentities } from "../../src/game/systems/sigils";
import { test, expect, Page } from "@playwright/test";
import { initialState, State, Token } from "../../src/game/domain/engine";
import { byId } from "../../src/game/cards/catalog";
function fixture() {
  const s = initialState(["Rowan", "Elara"], "item-browser");
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
function add(s: State, id: string) {
  const c = byId[id];
  s.decks[c.family] = s.decks[c.family].filter((x) => x !== id);
  (c.family === "Item" ? s.players[0].inventory : s.rooms.R01.objects).push({
    id,
    card: id,
    kind: c.family as Token["kind"],
  });
}
function element(s: State, id: string) {
  const index = s.rooms.Hall.objects.findIndex((t) => t.id === id);
  s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(index, 1));
}
async function resume(page: Page, s?: State) {
  if(s)normalizeSigilIdentities(s);
  await page.goto("/");
  if (s)
    await page.evaluate(
      (state) =>
        localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
      s,
    );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
}
const saved = (page: Page): Promise<State> =>
  page.evaluate(() => JSON.parse(localStorage.getItem("the-mirrors-save-v1")!));
async function inspect(page: Page, id: string) {
  await page
    .getByRole("button", {
      name: "Inspect " + byId[id].name + " \u00b7 item slot",
      exact: true,
    })
    .click();
  return page.getByRole("dialog", { name: byId[id].name + " card inspector" });
}
test("Tool costs are selected, consumed once, and usage survives reload", async ({
  page,
}) => {
  const s = fixture();
  add(s, "IT-11");
  element(s, "E-Air-1");
  element(s, "E-Water-1");
  await resume(page, s);
  let dialog = await inspect(page, "IT-11");
  await dialog
    .getByRole("button", { name: "Use Elemental Crucible", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: /Confirm Elemental/ }),
  ).toBeDisabled();
  await dialog.getByRole("radio", { name: "Air", exact: true }).check();
  await page.screenshot({ path: "test-results/item-tool-cost.png" });
  await dialog.getByRole("button", { name: /Confirm Elemental/ }).click();
  expect((await saved(page)).players[0].courage).toBe(20);
  expect((await saved(page)).spentElements.map((t) => t.id)).toEqual([
    "E-Air-1",
  ]);
  await expect(
    dialog.getByRole("button", { name: "Use Elemental Crucible", exact: true }),
  ).toBeDisabled();
  await resume(page);
  dialog = await inspect(page, "IT-11");
  await expect(dialog).toContainText("Used this round");
  await expect(
    dialog.getByRole("button", { name: "Use Elemental Crucible", exact: true }),
  ).toBeDisabled();
});
test("Grimoire and Prism spend room Aether with carried-only bonuses", async ({
  page,
}) => {
  const s = fixture();
  for (const id of ["IT-10", "IT-05", "SP-01"]) add(s, id);
  element(s, "E-Aether-1");
  s.players[0].knowledge[0] = true;
  await resume(page, s);
  await page
    .getByRole("button", { name: "Learn " + byId["SP-01"].name, exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Choose learning payment" });
  await expect(dialog.getByLabel("Grimoire discount")).toHaveValue("Fire");
  await page.screenshot({ path: "test-results/item-learning-payment.png" });
  await dialog
    .getByRole("button", { name: "Pay and learn", exact: true })
    .click();
  expect((await saved(page)).players[0].spellSlots[0]).toBe("SP-01");
  expect((await saved(page)).spentElements).toHaveLength(0);
});

test("Occuldor Compass selects directly on castle map and applies destination penalties", async ({
  page,
}) => {
  const s = fixture();
  add(s, "IT-18");
  s.players[1].room = "R02";
  await resume(page, s);
  const dialog = await inspect(page, "IT-18");
  await dialog
    .getByRole("button", { name: "Use Occuldor's Compass", exact: true })
    .click();
  await expect(dialog.getByRole("radio")).toHaveCount(0);
  await dialog.getByRole("button", { name: /R02 explored/ }).click();
  await page.screenshot({ path: "test-results/item-compass-map.png" });
  await dialog.getByRole("button", { name: /Confirm Occuldor/ }).click();
  const result = await saved(page);
  expect(result.occuldor).toBe("R02");
  expect(result.rage).toBe(0);
  expect(result.players.map((p) => p.courage)).toEqual([17, 17]);
});
test("Amulet rewards one permanent commitment with visible binding and no repeated payment", async ({
  page,
}) => {
  const s = fixture();
  add(s, "IT-24");
  const spell = Object.values(byId).find((c) =>
    c.casting_modes?.some((m) => m.name.toUpperCase() === "PERMANENT"),
  )!;
  s.decks.Spell = s.decks.Spell.filter((id) => id !== spell.id);
  s.players[0].inventory.push({ id: spell.id, card: spell.id, kind: "Spell" });
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = spell.id;
  const colors = spell.casting_modes!.find(
    (m) => m.name.toUpperCase() === "PERMANENT",
  )!.sigil_slots;
  s.players[0].sigils = [...colors];
  await resume(page, s);
  await page
    .getByRole("button", {
      name: "Inspect " + spell.name + " \u00b7 knowledge slot",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: spell.name + " card inspector",
  });
  for(let i=0;i<colors.length;i++) await dialog.getByRole("button",{name:`Permanent ${colors[i]} socket ${i+1}`,exact:false}).click();
  await dialog.getByRole("button", { name: "Bind Permanently" }).click();
  await expect(
    dialog.getByRole("button", { name: "Bind Permanently" }),
  ).toBeDisabled();
  expect((await saved(page)).players[0].courage).toBe(
    Math.min(35, 18 + colors.length * 3),
  );
  await expect(dialog).toContainText("Active");
});
