import { grantSigil } from "../../src/game/systems/sigils";
import { test, expect, type Page } from "@playwright/test";
import { initialState, reduce, type State } from "../../src/game/domain/engine";
import { kaleidoscopeGems } from "../../src/game/map/kaleidoscopeCells";
import { byId } from "../../src/game/cards/catalog";
function fixture() {
  let s = initialState(["Rowan", "Elara"], "gem-browser");
  s.decks.Secret = s.decks.Secret.filter(
    (id) => !["SE-09", "SE-15"].includes(id),
  );
  s.players[0].secrets = ["SE-09", "SE-15"];
  return reduce(s, {
    type: "REVEAL_SECRET",
    playerId: "P1",
    secretId: "SE-09",
  });
}
function surround(s: State, id: string) {
  for (const cell of kaleidoscopeGems.find((g) => g.id === id)!.cells) {
    s.mosaic[cell] = "Scarlet";
  }
  s.rage = s.mosaic.filter(Boolean).length;
  Object.values(s.rooms)
    .filter((r) => r.id !== "Hall")
    .slice(0, s.rage)
    .forEach((r) => (r.restored = true));
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
test("Gem utility exhausts, exhausted Gem installs, and center consumes a Wild exactly once", async ({
  page,
}, info) => {
  const s = fixture(),
    diamond = kaleidoscopeGems.find((g) => g.bonus === 3)!,
    heart = kaleidoscopeGems.find((g) => g.bonus === 5)!;
  surround(s, diamond.id);
  surround(s, heart.id);
  await resume(page, s);
  await page.getByRole("button", { name: "Inspect DG-09 ready" }).click();
  await expect(
    page.getByRole("button", { name: "Break Paralysis" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Swift Movement +1" }).click();
  await expect(
    page.getByRole("button", { name: "Swift Movement +1" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Open Kaleidoscope for installation" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator(`[data-gem="${diamond.id}"]`).click();
  await dialog
    .getByRole("button", { name: "Install DG-09", exact: true })
    .click();
  expect((await saved(page)).players[0].courage).toBe(21);
  await dialog.locator(`[data-gem="${heart.id}"]`).click();
  await dialog
    .getByRole("button", { name: "Install WILD-P1", exact: true })
    .click();
  expect((await saved(page)).players[0].courage).toBe(26);
  expect((await saved(page)).magic.wildStorage).toEqual([
    { id: "WILD-P2", owner: "P2" },
  ]);
  await page.screenshot({
    path: info.outputPath("installed-resources.png"),
    fullPage: true,
  });
});
test("Wild is chosen directly on the required-color Spell socket and stays bound", async ({
  page,
}) => {
  const s = fixture(),
    id = "SP-01";
  s.decks.Spell = s.decks.Spell.filter((x) => x !== id);
  s.players[0].inventory.push({ id, card: id, kind: "Spell" });
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = id;
  grantSigil(s, "P1", "Emerald");
  await resume(page, s);
  await page
    .getByRole("button", {
      name: new RegExp(`^Inspect ${byId[id].name}.*knowledge slot`),
    })
    .click();
  const dialog = page.getByRole("dialog"),
    mode = byId[id].casting_modes![1];
  expect(mode.sigil_slots).toHaveLength(2);
  await dialog
    .getByRole("button", { name: `Permanent ${mode.sigil_slots[0]} socket 1` })
    .click();
  await expect(dialog.getByTitle("Wild Sigil assigned")).toBeVisible();
  await dialog
    .getByRole("button", { name: "Permanent Emerald socket 2" })
    .click();
  await dialog
    .getByRole("button", { name: "Bind Permanently", exact: true })
    .click();
  expect((await saved(page)).blackMirror.bindings[id]).toEqual([
    "Wild",
    "Emerald",
  ]);
  expect(
    (await saved(page)).magic.wildStorage.some((t) => t.owner === "P1"),
  ).toBe(false);
});
