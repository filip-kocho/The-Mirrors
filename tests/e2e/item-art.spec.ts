import { test, expect } from "@playwright/test";
import { items } from "../../src/game/cards/items";
test("all 25 Item cards show their distinct atlas illustration", async ({
  page,
}) => {
  await page.goto("/");
  expect((await page.request.get("/art/item-portraits.webp")).ok()).toBe(true);
  await page.getByRole("button", { name: "Catalog" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: /^Item/ }).click();
  for (const [i, item] of items.entries()) {
    await dialog
      .getByRole("button", { name: new RegExp("Inspect " + item.id) })
      .click();
    const art = dialog.locator(".item-portrait");
    await expect(art).toBeVisible();
    await expect(art).toHaveAttribute("data-item-art", item.id);
    await expect(art).toHaveCSS(
      "background-position",
      (i % 5) * 25 + "% " + Math.floor(i / 5) * 25 + "%",
    );
    if (i === 0 || i === 17 || i === 24)
      await page.screenshot({
        path: "test-results/item-art-" + item.id + ".png",
      });
    await dialog.getByRole("button", { name: "Back to collection" }).click();
  }
});
