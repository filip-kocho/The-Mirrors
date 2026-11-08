import { test, expect } from "@playwright/test";

test("mirror landing, tabbed catalog, card return and detailed rules work on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".landing-mirror")).toHaveCount(2);
  await expect(page.getByText("Expedition seed", { exact: false })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: "test-results/mirror-landing.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Browse the original/ }).click();
  const dialog = page.getByRole("dialog");
  for (const [name, count] of [
    ["White Mirror", 35],
    ["Black Mirror", 35],
    ["Item", 25],
    ["Spell", 35],
    ["Companion", 10],
    ["Secret", 15],
  ] as const) {
    await dialog.getByRole("tab", { name: new RegExp(`^${name}`) }).click();
    await expect(dialog.getByRole("tabpanel").getByRole("button")).toHaveCount(
      count,
    );
  }
  await dialog.getByRole("tab", { name: /^Spell/ }).click();
  await page.screenshot({
    path: "test-results/card-catalog.png",
    fullPage: true,
  });
  await dialog.getByRole("textbox", { name: "Search cards" }).fill("SP-01");
  await dialog.getByRole("button", { name: /Inspect SP-01/ }).click();
  await expect(
    dialog.getByRole("heading", { name: "Spark of Certainty" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Back to collection" }).click();
  await expect(dialog.getByRole("tab", { name: /^Spell/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    dialog.getByRole("textbox", { name: "Search cards" }),
  ).toHaveValue("SP-01");
  await dialog
    .getByRole("textbox", { name: "Search cards" })
    .fill("no such card");
  await expect(dialog.getByText(/No cards match/)).toBeVisible();
  await dialog.getByRole("tab", { name: /^Spell/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: /^Companion/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveCount(12);
  await expect(dialog.getByText(/Neighbor colors add no Courage/)).toBeVisible();
  await expect(
    dialog.getByText(/Open the Spell to click matching Sigils/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mirror-landing-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Browse the original/ }).click();
  await dialog.getByRole("textbox", { name: "Search cards" }).fill("");
  await expect(dialog.getByRole("tabpanel")).toBeVisible();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/card-catalog-mobile.png",
    fullPage: true,
  });
});
