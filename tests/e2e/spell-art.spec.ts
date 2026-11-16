import { test, expect } from "@playwright/test";
import spells from "../../src/game/cards/spells-v04.json";
test("all 35 Spell cards show their distinct illustration and printed sockets", async ({
  page,
}) => {
  await page.goto("/");
  expect((await page.request.get("/art/spell-portraits.webp")).ok()).toBe(true);
  await page.getByRole("button", { name: "Catalog" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: /^Spell/ }).click();
  for (const [i, spell] of spells.entries()) {
    await dialog
      .getByRole("button", { name: new RegExp("Inspect " + spell.id) })
      .click();
    const art = dialog.locator(".spell-portrait");
    await expect(art).toBeVisible();
    await expect(art).toHaveAttribute("data-spell-art", spell.id);
    const pos = await art.evaluate((el) =>
      getComputedStyle(el).backgroundPosition.split(" ").map(parseFloat),
    );
    expect(pos[0]).toBeCloseTo(((i % 7) * 100) / 6, 2);
    expect(pos[1]).toBe(Math.floor(i / 7) * 25);
    await expect(dialog.getByLabel("Learning cost")).toBeVisible();
    if (i === 0 || i === 18 || i === 34) {
      await dialog.evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({
        path: "test-results/spell-art-" + spell.id + ".png",
      });
    }
    await dialog.getByRole("button", { name: "Back to collection" }).click();
  }
});
