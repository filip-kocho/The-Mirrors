import { mutableStatus } from "../../src/game/systems/blackMirrorRuntime";
import { test, expect, type Page } from "@playwright/test";
import { initialState, type State } from "../../src/game/domain/engine";
import { byId } from "../../src/game/cards/catalog";
import { grantSigil } from "../../src/game/systems/sigils";
import { assignPortals } from "../../src/game/systems/portals";
function fixture() {
  const s = initialState(["Rowan", "Elara"], "spell-browser");
  s.players[0].courage = 12;
  mutableStatus(s, "P1").fear = [{ id: "fear-a", origin: "R35" }];
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = "SP-09";
  s.players[0].inventory.push({ id: "SP-09", card: "SP-09", kind: "Spell" });
  s.decks.Spell = s.decks.Spell.filter((id) => id !== "SP-09");
  for (const c of byId["SP-09"].casting_modes![0].sigil_slots)
    grantSigil(s, "P1", c);
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
test("clickable Sigils cancel freely, activate once, persist, and return on owner's next turn", async ({
  page,
}, info) => {
  const s = fixture();
  s.moved = true;
  s.phase = "POST_MOVE_ACTIONS";
  await resume(page, s);
  await page
    .getByRole("button", { name: /Inspect Calm Waters.*knowledge slot/ })
    .click();
  const dialog = page.getByRole("dialog"),
    quick = dialog.getByLabel("Quick activation", { exact: true });
  await expect(
    dialog
      .locator(".game-card")
      .getByRole("button", { name: "Activate Quick" }),
  ).toHaveCount(0);
  await expect(
    dialog
      .locator(".spell-action-panel")
      .getByRole("button", { name: "Activate Quick" }),
  ).toBeDisabled();
  const cardBox = await dialog.locator(".game-card").boundingBox();
  const panelBox = await dialog.locator(".spell-action-panel").boundingBox();
  expect(panelBox!.x).toBeGreaterThanOrEqual(cardBox!.x + cardBox!.width);
  expect(Math.abs(panelBox!.y - cardBox!.y)).toBeLessThan(5);
  await quick.getByRole("checkbox", { name: "fear fear-a" }).check();
  await dialog.getByRole("button", { name: /Quick .* socket 1/ }).click();
  await expect(
    quick.getByRole("button", { name: "Activate Quick" }),
  ).toBeEnabled();
  await quick.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await saved(page)).players[0].sigils).toHaveLength(1);
  await dialog.getByRole("button", { name: /Quick .* socket 1/ }).click();
  await page.screenshot({ path: info.outputPath("spell-sockets.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await expect(
    dialog.getByRole("button", { name: /Quick .* socket 1/ }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("spell-mobile.png") });
  await page.setViewportSize({ width: 1280, height: 720 });
  await quick.getByRole("checkbox", { name: "fear fear-a" }).check();
  await quick.getByRole("button", { name: "Activate Quick" }).click();
  expect((await saved(page)).players[0].courage).toBe(12);
  expect((await saved(page)).spells.quick).toHaveLength(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".guide-sigil.used")).toHaveCount(1);
  await page.getByRole("button", { name: /End turn/ }).click();
  await page.getByRole("button", { name: "I am Elara" }).click();
  expect((await saved(page)).spells.quick).toHaveLength(1);
  await page.getByRole("button", { name: /R01 unexplored reachable/ }).click();
  await page.getByRole("button", { name: "Move here" }).click();
  await page.getByRole("button", { name: /End turn/ }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  const after = await saved(page);
  expect(after.spells.quick).toHaveLength(0);
  expect(after.players[0].sigils).toHaveLength(1);
  await resume(page, after);
  expect((await saved(page)).players[0].sigils).toHaveLength(1);
});
test("matching Portals highlight together and party displays fear-level movement", async ({
  page,
}) => {
  const s = fixture();
  assignPortals(s, ["R01", "R35"]);
  await resume(page, s);
  await page.getByRole("button", { name: /R01 unexplored reachable/ }).click();
  for (const id of ["R01", "R35"])
    await expect(
      page
        .getByRole("button", { name: new RegExp(`^${id} `) })
        .locator('rect[stroke-width="5"]'),
    ).toHaveCount(1);
  await expect(page.locator(".party-fear-row").first()).toContainText("+1");
  await expect(page.locator(".sigil-storage")).toHaveCount(0);
});
test("endgame opens winner and results table and can return to the board", async ({
  page,
}, info) => {
  const s = fixture();
  s.outcome = "defeat";
  s.players.forEach((p) => {
    p.dead = true;
    p.courage = 0;
  });
  await resume(page, s);
  const result = page.getByRole("dialog", { name: "Winner: Occuldor" });
  await expect(result).toBeVisible();
  await expect(result.getByRole("table")).toContainText("Rowan");
  await page.screenshot({ path: info.outputPath("results.png") });
  await result.getByRole("button", { name: "Return to the castle" }).click();
  await expect(result).not.toBeVisible();
  await page.getByRole("button", { name: "View results" }).click();
  await expect(result).toBeVisible();
});
