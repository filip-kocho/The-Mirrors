import { test, expect } from "@playwright/test";
import { secrets } from "../../src/game/cards/secrets";
test("Secret portraits match all 15 IDs and Mirror families have distinct upright illustrations", async ({
  page,
}) => {
  await page.goto("/");
  for (const asset of [
    "secret-portraits.webp",
    "mirror-white.webp",
    "mirror-black.webp",
  ])
    expect((await page.request.get("/art/" + asset)).ok()).toBe(true);
  await page.getByRole("button", { name: "Catalog" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: /^Secret/ }).click();
  for (const [i, card] of secrets.entries()) {
    await dialog
      .getByRole("button", { name: new RegExp("Inspect " + card.id) })
      .click();
    const art = dialog.locator(".secret-portrait");
    await expect(art).toBeVisible();
    await expect(art).toHaveAttribute("data-secret-art", card.id);
    await expect(art).toHaveCSS(
      "background-position",
      (i % 5) * 25 + "% " + Math.floor(i / 5) * 50 + "%",
    );
    if (i === 0) {
      await dialog.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({ path: "test-results/secret-art.png" });
    }
    await dialog.getByRole("button", { name: "Back to collection" }).click();
  }
  const images: string[] = [];
  for (const [family, id] of [
    ["White Mirror", "WM-01"],
    ["Black Mirror", "BM-01"],
  ]) {
    await dialog.getByRole("tab", { name: new RegExp("^" + family) }).click();
    await dialog
      .getByRole("button", { name: new RegExp("Inspect " + id) })
      .click();
    const art = dialog.locator(".mirror-portrait");
    await expect(art).toHaveAttribute(
      "data-mirror-art",
      family === "White Mirror" ? "white" : "black",
    );
    const box = await art.boundingBox();
    expect(box!.height).toBeGreaterThan(box!.width);
    await expect(art).toBeVisible();
    images.push(
      await art.evaluate((el) => getComputedStyle(el).backgroundImage),
    );
    await dialog.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({ path: "test-results/mirror-art-" + id + ".png" });
    await dialog.getByRole("button", { name: "Back to collection" }).click();
  }
  expect(images[0]).not.toBe(images[1]);
});
