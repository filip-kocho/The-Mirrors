import { test, expect } from "@playwright/test";
import { initialState } from "../../src/game/domain/engine";
import {
  attachCompanion,
  resolveEncounters,
} from "../../src/game/systems/companions";
test("Carriers use Item slots, Followers remain separate, and cards show v0.6 relationships", async ({
  page,
}) => {
  const s = initialState(["Rowan", "Elara"], "companions-browser");
  for (const id of ["CO-08", "CO-05", "CO-06"]) {
    s.decks.Companion = s.decks.Companion.filter((x) => x !== id);
    attachCompanion(s, s.players[0], { id, card: id, kind: "Companion" }, true);
  }
  resolveEncounters(s, "Hall");
  await page.goto("/");
  await page.evaluate(
    (s) => localStorage.setItem("the-mirrors-save-v1", JSON.stringify(s)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page
      .locator('[data-slot="items"]')
      .getByRole("button", { name: /Inspect Mamba/ }),
  ).toBeVisible();
  await expect(
    page
      .locator(".player-collection")
      .getByRole("button", { name: /Inspect Mamba/ }),
  ).toHaveCount(0);
  await page
    .locator('[data-slot="items"]')
    .getByRole("button", { name: /Inspect Mamba/ })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Companion characteristics")).toContainText(
    "STRAY",
  );
  await expect(dialog.getByLabel("Companion characteristics")).toContainText(
    "CARRIER",
  );
  await expect(dialog.getByLabel("Companion characteristics")).toContainText(
    "Clementine the Spider",
  );
  await page.screenshot({
    path: "test-results/companions-card.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await page
    .locator(".player-collection")
    .getByRole("button", { name: /Inspect Madison/ })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Companion characteristics"),
  ).toContainText("Linked Ghost Twins");
  await expect(
    page.getByRole("dialog").getByLabel("Companion characteristics"),
  ).toContainText("STRAY");
});
