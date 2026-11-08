import { test, expect } from "@playwright/test";
import type { State } from "../../src/game/domain/engine";

test("new games shuffle every deck without exposing a seed field", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Expedition seed (optional)")).toHaveCount(0);
  const begin = async () => {
    await page.getByRole("button", { name: "Enter the castle" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const state: State = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
    );
    await page.getByRole("button", { name: "Leave table" }).click();
    return state;
  };
  const first = await begin();
  const second = await begin();
  expect(second.seed).not.toBe(first.seed);
  expect(second.rooms).not.toEqual(first.rooms);
  for (const family of ["Spell", "Item", "Companion", "Secret"]) {
    expect(second.decks[family]).not.toEqual(first.decks[family]);
    expect([...second.decks[family]].sort()).toEqual([...first.decks[family]].sort());
  }
  for (const family of ["Black Mirror", "White Mirror"]) {
    const order = (s: State) => Object.values(s.rooms)
      .flatMap((room) => room.findings)
      .filter((token) => token.kind === family)
      .map((token) => token.id);
    expect(order(second)).not.toEqual(order(first));
    expect(order(second).sort()).toEqual(order(first).sort());
  }

});

test("setup, exploration, transfer, privacy and saved-game resume", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the castle" }).click();
  await expect(
    page.getByRole("button", { name: /R01 unexplored reachable/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /R01 unexplored reachable/ }).click();
  await page.getByRole("button", { name: "Move here" }).click();
  await expect(
    page.getByRole("button", { name: "R01 explored" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^Take / })
    .first()
    .click();
  await expect(
    page.locator(".character").getByRole("button", { name: /^Leave / }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "End turn" }).click();
  await expect(
    page.getByRole("heading", { name: "Pass to Elara" }),
  ).toBeVisible();
  await expect(page.getByLabel("Circular castle with 35 rooms")).toHaveCount(0);
  await page.getByRole("button", { name: "I am Elara" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await expect(
    page.getByRole("heading", { name: "Pass to Elara" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I am Elara" }).click();
  await expect(
    page.getByRole("button", { name: /R01 explored/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/castle-table.png",
    fullPage: true,
  });
});
test("keyboard room selection, catalog and dialog dismissal", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Browse the original/ }).click();
  await page.getByRole("textbox", { name: "Search cards" }).fill("SP-01");
  await page.getByRole("button", { name: /SP-01/ }).click();
  await expect(
    page.getByRole("heading", { name: "Spark of Certainty" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Enter the castle" }).click();
  await page.getByRole("button", { name: /R02 unexplored reachable/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Chamber 02" })).toBeVisible();
});
