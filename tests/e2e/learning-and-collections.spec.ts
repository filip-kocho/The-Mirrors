import { test, expect } from "@playwright/test";
import { initialState, reduce } from "../../src/game/domain/engine";
import { byId } from "../../src/game/cards/catalog";
import { pathTo } from "../../src/game/map/roomGraph";

function scenario() {
  let s = initialState(["Rowan", "Elara"], "learning-browser");
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = structuredClone(r.findings);
  }
  const pool = Object.values(s.rooms).flatMap((r) => r.objects);
  for (const r of Object.values(s.rooms)) r.objects = [];
  s.rooms.R01.objects = pool.filter((t) => ["WM-01", "BM-17"].includes(t.id));
  s.rooms.R02.objects = pool.filter((t) =>
    ["WM-02", "BM-02", "E-Fire-1"].includes(t.id),
  );
  s.rooms.Hall.objects = pool.filter(
    (t) => !["WM-01", "BM-17", "WM-02", "BM-02", "E-Fire-1"].includes(t.id),
  );
  s.players[0].room = "R01";
  s.decks.Spell = ["SP-01", ...s.decks.Spell.filter((id) => id !== "SP-01")];
  s.decks.Companion = [
    "CO-01",
    ...s.decks.Companion.filter((id) => id !== "CO-01"),
  ];
  s.decks.Secret = ["SE-01", ...s.decks.Secret.filter((id) => id !== "SE-01")];
  s = reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-01",
    blackId: "BM-17",
  });
  s.installed = false;
  s.players[0].room = "R02";
  s = reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-02",
    blackId: "BM-02",
  });
  s.players[0].room = "R01";
  s = reduce(s, { type: "COLLIDE", playerId: "P1" });
  s = reduce(s, {
    type: "CONTINUE_COLLISION",
    playerId: "P1",
    penalty: "apply",
  });
  s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
  s = reduce(s, { type: "MOVE", playerId: "P1", path: pathTo("R01", "R02") });
  return s;
}
test("attached Companions, private Secret icons, paid Spell learning and saved equipped slots", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    scenario(),
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  const sigilsBox = await page.locator(".sigils-above-knowledge").boundingBox();
  const slotsBox = await page.locator(".knowledge").boundingBox();
  expect(sigilsBox!.y + sigilsBox!.height).toBeLessThan(slotsBox!.y);
  await expect(
    page
      .getByLabel("Spell slot 1: unlocked, empty")
      .locator(".spell-space svg"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Inspect Rex the Dog · attached companion",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Your Mirror Sigils")
      .locator('image[href="/icons/sigils.png"]'),
  ).toHaveCount(1);
  await expect(page.getByText(byId["SE-01"].name, { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Inspect private Secret 1", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(byId["SE-01"].effect!);
  await page.keyboard.press("Escape");
  await expect(page.getByText(byId["SE-01"].name, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Learn Spark of Certainty", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", {
      name: "Inspect Spark of Certainty \u00b7 room",
      exact: true,
    })
    .click();
  const spellCard = page.getByRole("dialog").locator(".game-card.card-spell");
  await expect(spellCard).toBeVisible();
  const costBox = await spellCard.getByLabel("Learning cost").boundingBox();
  const titleBox = await spellCard
    .getByRole("heading", { name: "Spark of Certainty" })
    .boundingBox();
  expect(costBox!.y).toBeLessThan(titleBox!.y);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.locator(".spell-learning")).toHaveCount(0);
  await page.screenshot({ path: "test-results/spell-learning.png" });
  await spellCard
    .getByRole("button", { name: "Learn Spark of Certainty", exact: true })
    .click();
  await expect(
    spellCard.getByRole("button", {
      name: "Leave Spark of Certainty",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Inspect Spark of Certainty · knowledge slot",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .locator(".room-inspector")
      .getByRole("button", { name: "Inspect Fire · room", exact: true }),
  ).toHaveCount(0);
  const guide = page.getByLabel("Spark of Certainty casting guide");
  await expect(guide).toBeVisible();
  for (const mode of byId["SP-01"].casting_modes!) {
    await expect(
      guide.getByLabel(`${mode.name} Sigil requirements`).locator(".game-icon"),
    ).toHaveCount(mode.sigil_slots.length);
  }
  await expect(
    page
      .locator(".knowledge")
      .getByRole("button", { name: "Leave Spark of Certainty" }),
  ).toBeEnabled();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(stored.spentElements.map((t: { id: string }) => t.id)).toEqual([
    "E-Fire-1",
  ]);
  expect(stored.players[0].spellSlots).toEqual(["SP-01", null, null, null]);
  await page.screenshot({
    path: "test-results/player-collection.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "End turn" }).click();
  await page.getByRole("button", { name: "I am Elara" }).click();
  await expect(
    page.getByRole("button", { name: "Inspect private Secret 1", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(byId["SE-01"].name, { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "R03 explored reachable", exact: true })
    .click();
  await page.getByRole("button", { name: "Move here" }).click();
  await page.getByRole("button", { name: "End turn" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page.getByRole("button", {
      name: "Inspect Spark of Certainty · knowledge slot",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open Kaleidoscope", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .locator('.glass-cell image[href="/icons/sigils.png"]'),
  ).toHaveCount(1);
  await page.screenshot({ path: "test-results/kaleidoscope-sigil.png" });
});
