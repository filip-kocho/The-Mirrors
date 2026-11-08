import { test, expect, type Page } from "@playwright/test";
import {
  initialState,
  type State,
  type Token,
} from "../../src/game/domain/engine";
import { byId, cards } from "../../src/game/cards/catalog";
function fixture() {
  const s = initialState(["Rowan", "Elara"], "secret-browser");
  s.players[0].room = "R01";
  s.rooms.R01.explored = true;
  s.rooms.R01.objects = structuredClone(s.rooms.R01.findings);
  return s;
}
function hidden(s: State, ...ids: string[]) {
  for (const id of ids) {
    s.decks.Secret = s.decks.Secret.filter((c) => c !== id);
    s.players[0].secrets.push(id);
  }
}
function add(s: State, id: string, target = s.players[0].inventory) {
  const c = byId[id];
  s.decks[c.family] = s.decks[c.family].filter((c) => c !== id);
  target.push({ id, card: id, kind: c.family as Token["kind"] });
}
async function resume(page: Page, s?: State) {
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
test("a hidden achievement reveals once, survives reload, and is public after handoff without exposing other Secrets", async ({
  page,
}, info) => {
  const s = fixture();
  hidden(s, "SE-09", "SE-01", "SE-02", "SE-03");
  s.moved = true;
  s.phase = "POST_MOVE_ACTIONS";
  await resume(page, s);
  await expect(
    page.getByText("Keeper of Whispers", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Inspect private Secret 1", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Eligible", exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText("4/2");
  await page.screenshot({
    path: info.outputPath("eligible-secret.png"),
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Reveal achievement", exact: true })
    .click();
  await expect(dialog.getByLabel("Completed achievement")).toContainText(
    "Completed by Rowan",
  );
  await expect(
    dialog.getByRole("button", { name: "Reveal achievement", exact: true }),
  ).toHaveCount(0);
  expect((await saved(page)).players[0].courage).toBe(18);
  await page.keyboard.press("Escape");
  await resume(page);
  expect((await saved(page)).players[0].completedSecrets).toHaveLength(1);
  await page.getByRole("button", { name: /End turn/ }).click();
  await expect(
    page.getByText("Keeper of Whispers", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "I am Elara" }).click();
  await expect(
    page.getByRole("button", { name: /Inspect private Secret/ }),
  ).toHaveCount(0);
  await expect(page.getByText("Four of a Kind", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", {
      name: "Inspect Rowan's completed Keeper of Whispers",
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1 Diamond Gem awarded");
  await expect(
    page.getByRole("button", { name: "Reveal achievement" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Private achievement status")).toHaveCount(0);
});
test("a room Relic does not count until equipped; claiming caps Courage and keeps the Relics", async ({
  page,
}, info) => {
  const s = fixture();
  hidden(s, "SE-14");
  add(s, "IT-24");
  add(s, "IT-21", s.rooms.R01.objects);
  s.players[0].courage = 34;
  await resume(page, s);
  await page.getByRole("button", { name: "Inspect private Secret 1" }).click();
  await expect(
    page.getByRole("heading", { name: "Not yet eligible", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reveal achievement" }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog")).toContainText("1/2");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: `Take ${byId["IT-21"].name}`, exact: true })
    .click();
  expect((await saved(page)).players[0].completedSecrets).toEqual([]);
  await page.getByRole("button", { name: "Inspect private Secret 1" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "+1 Courage (+5 reward, capped at 35)",
  );
  await page.getByRole("button", { name: "Reveal achievement" }).click();
  expect((await saved(page)).players[0].courage).toBe(35);
  expect(
    (await saved(page)).players[0].inventory.filter((t) => t.kind === "Item"),
  ).toHaveLength(2);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", {
      name: "Inspect Rowan's completed Treasures of the Castle",
    })
    .click();
  await expect(page.getByLabel("Completed achievement")).toContainText(
    "+1 Courage gained",
  );
  await page.screenshot({
    path: info.outputPath("completed-secret-mobile.png"),
    fullPage: true,
  });
});
test("Craftsman requires carried Equipment and Tool rather than room objects", async ({
  page,
}) => {
  const s = fixture();
  hidden(s, "SE-05");
  add(s, "IT-11");
  add(s, "IT-01", s.rooms.R01.objects);
  await resume(page, s);
  await page.getByRole("button", { name: "Inspect private Secret 1" }).click();
  await expect(
    page.getByRole("button", { name: "Reveal achievement" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Take " + byId["IT-01"].name, exact: true })
    .click();
  await page.getByRole("button", { name: "Inspect private Secret 1" }).click();
  await page.getByRole("button", { name: "Reveal achievement" }).click();
  expect(
    (await saved(page)).magic.gems.find((g) => g.secret === "SE-05")?.location,
  ).toBe("PLAYER_STORAGE");
});

test("four learned Spells give +5 Courage with all Knowledge slots unlocked", async ({
  page,
}) => {
  const s = fixture();
  hidden(s, "SE-15");
  add(s, "IT-10");
  cards
    .filter((c) => c.family === "Spell" && c.subtype === "Advanced")
    .slice(0, 4)
    .forEach((c, i) => {
      add(s, c.id);
      s.players[0].knowledge[i] = true;
      s.players[0].spellSlots[i] = c.id;
    });
  await resume(page, s);
  await page.getByRole("button", { name: "Inspect private Secret 1" }).click();
  await expect(page.getByRole("dialog")).toContainText("4/4");
  await page.getByRole("button", { name: "Reveal achievement" }).click();
  expect((await saved(page)).players[0].courage).toBe(23);
  expect((await saved(page)).players[0].completedSecrets[0].tier).toBe(
    undefined,
  );
});
