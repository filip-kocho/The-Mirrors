import { test, expect } from "@playwright/test";
import { cards } from "../../src/game/cards/catalog";
test("all card faces use two consistent formats with distinct family frames", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "Catalog" }).click();
  const dialog = page.getByRole("dialog");
  const colors = new Map<string, string>();
  for (const family of [
    "White Mirror",
    "Black Mirror",
    "Item",
    "Spell",
    "Companion",
    "Secret",
  ]) {
    await dialog.getByRole("tab", { name: new RegExp("^" + family) }).click();
    for (const card of cards.filter((c) => c.family === family)) {
      await dialog
        .getByRole("button", { name: new RegExp("Inspect " + card.id) })
        .click();
      const face = dialog.locator(".game-card");
      const box = await face.boundingBox();
      expect(box!.width, card.id).toBe(360);
      expect(box!.height / box!.width, card.id).toBeCloseTo(
        family === "Spell" ? 53 / 36 : 88 / 63,
        2,
      );
      colors.set(
        family,
        await face.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--card-accent").trim(),
        ),
      );
      await expect(face.locator(".card-imprint")).toHaveCount(0);
      await expect(face.getByText(card.id, { exact: true })).toHaveCount(1);
      if (family === "Spell")
        for (const mode of card.casting_modes ?? [])
          await expect(
            face.getByText(mode.effect, { exact: true }),
          ).toBeVisible();
      if (family === "Companion")
        await expect(
          face.getByText(card.effect!, { exact: true }),
        ).toBeVisible();
      const rules = face.getByRole("region", { name: / rules$/ });
      expect(
        await rules.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
        card.id + " rules fit",
      ).toBe(true);
      await expect(rules).toHaveCSS("overflow-y", "visible");
      const overflow = await face.evaluate(
        (el) => el.scrollHeight > el.clientHeight + 1,
      );
      expect(overflow, card.id).toBe(false);
      if (card.id.endsWith("01")) {
        await dialog.evaluate((el) => {
          el.scrollTop = 0;
        });
        await page.screenshot({
          path: "test-results/frame-" + card.id + ".png",
        });
      }
      await dialog.getByRole("button", { name: "Back to collection" }).click();
    }
  }
  expect(new Set(colors.values()).size).toBe(6);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [family, id] of [
    ["White Mirror", "WM-01"],
    ["Black Mirror", "BM-35"],
    ["Item", "IT-25"],
    ["Spell", "SP-35"],
    ["Companion", "CO-07"],
    ["Secret", "SE-15"],
  ]) {
    await dialog.getByRole("tab", { name: new RegExp("^" + family) }).click();
    await dialog
      .getByRole("button", { name: new RegExp("Inspect " + id) })
      .click();
    const face = dialog.locator(".game-card"),
      box = await face.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(390);
    expect(box!.height / box!.width).toBeCloseTo(
      family === "Spell" ? 53 / 36 : 88 / 63,
      2,
    );
    expect(
      await face
        .locator(".card-rules")
        .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      id + " mobile rules fit",
    ).toBe(true);
    expect(
      await face.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Back to collection" }).click();
  }
});
