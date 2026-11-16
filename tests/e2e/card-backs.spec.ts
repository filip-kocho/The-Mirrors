import { test, expect } from "@playwright/test";
test("each family has a themed back and preview navigation returns to the front", async ({
  page,
}) => {
  await page.goto("/");
  expect((await page.request.get("/art/card-backs.webp")).ok()).toBe(true);
  await page.getByRole("button", { name: "Catalog" }).click();
  const d = page.getByRole("dialog");
  for (const [family, id] of [
    ["White Mirror", "WM-01"],
    ["Black Mirror", "BM-01"],
    ["Item", "IT-01"],
    ["Spell", "SP-01"],
    ["Companion", "CO-01"],
    ["Secret", "SE-01"],
  ]) {
    await d.getByRole("tab", { name: new RegExp("^" + family) }).click();
    await d.getByRole("button", { name: new RegExp("Inspect " + id) }).click();
    await d.getByRole("button", { name: "View back", exact: true }).click();
    await expect(
      d.getByRole("article", { name: family + " card back", exact: true }),
    ).toBeVisible();
    await expect(d.locator(".card-rules")).toHaveCount(0);
    if (family === "Spell")
      await page.screenshot({ path: "test-results/spell-back.png" });
    await d.getByRole("button", { name: "View front", exact: true }).click();
    await expect(d.locator(".card-rules")).toBeVisible();
    await d.getByRole("button", { name: "View back", exact: true }).click();
    await d.getByRole("button", { name: "Next card", exact: true }).click();
    await expect(d.locator(".card-rules")).toBeVisible();
    await expect(
      d.getByRole("button", { name: "View back", exact: true }),
    ).toBeVisible();
    await d.getByRole("button", { name: "Back to collection" }).click();
  }
});
