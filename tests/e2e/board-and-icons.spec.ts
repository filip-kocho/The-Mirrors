import { test, expect } from "@playwright/test";
import { initialState } from "../../src/game/domain/engine";
import { byId } from "../../src/game/cards/catalog";
import { roomGraph } from "../../src/game/map/roomGraph";
function inventoryFixture() {
  const s = initialState(["Rowan", "Elara"], "icon-inspection");
  for (const room of Object.values(s.rooms)) {
    room.explored = true;
    room.objects = structuredClone(room.findings);
  }
  const pool = Object.values(s.rooms).flatMap((room) => room.objects);
  for (const room of Object.values(s.rooms)) room.objects = [];
  s.rooms.R01.objects = pool.filter((t) =>
    ["WM-01", "BM-01", "E-Air-1"].includes(t.id),
  );
  s.rooms.Hall.objects = pool.filter(
    (t) => !["WM-01", "BM-01", "E-Air-1"].includes(t.id),
  );
  s.rooms.R01.objects.push(
    { id: "IT-01", card: "IT-01", kind: "Item" },
    { id: "SP-01", card: "SP-01", kind: "Spell" },
  );
  s.decks.Item = s.decks.Item.filter((id) => id !== "IT-01");
  s.decks.Spell = s.decks.Spell.filter((id) => id !== "SP-01");
  s.players[0].room = "R01";
  return s;
}

test("take arrows disable when Mirror slots are full and enable after leaving a Mirror", async ({
  page,
}) => {
  const s = inventoryFixture();
  const index = s.rooms.Hall.objects.findIndex((t) => t.id === "BM-02");
  s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(index, 1));
  await page.goto("/");
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await page
    .getByRole("button", { name: "Take White Mirror", exact: true })
    .click();
  await page
    .locator('[data-token-id="BM-01"]')
    .getByRole("button", { name: "Take Black Mirror", exact: true })
    .click();
  const take = page
    .locator('[data-token-id="BM-02"]')
    .getByRole("button", { name: "Take Black Mirror", exact: true });
  await expect(take).toBeDisabled();
  await expect(take).toHaveAttribute("title", /capacity/);
  await page
    .getByRole("button", { name: "Leave White Mirror", exact: true })
    .click();
  await expect(take).toBeEnabled();
  await take.click();
  await expect(
    page.getByRole("button", { name: "Take White Mirror", exact: true }),
  ).toBeDisabled();
});
test("icons inspect collected Mirrors, Items and Elements with public Black card faces; room Spells remain inspectable", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (s) => localStorage.setItem("the-mirrors-save-v1", JSON.stringify(s)),
    inventoryFixture(),
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page.locator(".character").getByRole("button", { name: "End turn" }),
  ).toBeVisible();
  await expect(
    page.locator(".turn-banner").getByRole("button", { name: "End turn" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".right-column, .signature-grid, .hall-return"),
  ).toHaveCount(0);
  const inspectorBox = await page.locator(".room-inspector").boundingBox();
  const mapBox = await page.locator(".castle").boundingBox();
  const rageBox = await page.locator(".occuldor-panel").boundingBox();
  const chronicleBox = await page.locator(".log").boundingBox();
  expect(inspectorBox!.y + inspectorBox!.height).toBeLessThan(mapBox!.y);
  expect(mapBox!.width).toBeGreaterThan(800);
  expect(rageBox!.y).toBeGreaterThan(mapBox!.y + mapBox!.height);
  expect(chronicleBox!.y).toBeGreaterThan(rageBox!.y + rageBox!.height);
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Learn Spark of Certainty", exact: true }),
  ).toBeDisabled();
  const rotatedRoom = page.locator('[data-room-id="R02"]');
  await rotatedRoom.click();
  await expect(rotatedRoom).toHaveCSS("outline-style", "none");
  await expect(
    rotatedRoom.locator(".room-floor").locator(".."),
  ).toHaveAttribute("transform", "rotate(72)");
  await page.locator('[data-room-id="R01"]').click();
  const roomMarkers = page.locator('[data-room-id="R01"] .room-object-markers');
  await expect(roomMarkers).toHaveAttribute("aria-label", "5 objects in R01");
  await expect(roomMarkers.locator("svg")).toHaveCount(5);
  for (const room of Object.values(roomGraph).filter((n) => n.id !== "Hall")) {
    await expect(
      page.locator(`[data-room-id="${room.id}"] .room-contents`),
    ).toHaveAttribute("transform", `rotate(${room.rotation + 180})`);
    // The local bottom (+Y) points inward, with the same axes as its square room.
    const radians = ((room.rotation + 180) * Math.PI) / 180;
    expect(
      -Math.sin(radians) * (400 - room.x) + Math.cos(radians) * (400 - room.y),
    ).toBeGreaterThan(0);
  }
  for (const name of [
    "White Mirror",
    "Black Mirror",
    "Air",
    "Element Bandolier",
  ])
    await page
      .getByRole("button", { name: `Take ${name}`, exact: true })
      .click();
  await expect(roomMarkers).toHaveAttribute("aria-label", "1 objects in R01");
  await expect(
    page.getByRole("heading", { name: "Carried objects" }),
  ).toHaveCount(0);
  const leaveAir = page
    .locator(".elements-area .object-action")
    .getByRole("button", { name: "Leave Air", exact: true });
  const airIcon = page.getByRole("button", {
    name: "Inspect Air · element slot",
    exact: true,
  });
  const arrowBox = await leaveAir.boundingBox();
  const iconBox = await airIcon.boundingBox();
  expect(arrowBox!.width).toBe(18);
  expect(arrowBox!.y).toBeGreaterThanOrEqual(iconBox!.y + iconBox!.height);
  expect(arrowBox!.x + arrowBox!.width / 2).toBeCloseTo(
    iconBox!.x + iconBox!.width / 2,
    0,
  );
  await expect(leaveAir).toHaveCSS("border-radius", "50%");
  await leaveAir.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(airIcon).toHaveCount(0);
  const takeAir = page
    .locator(".room-inspector .object-action")
    .getByRole("button", { name: "Take Air", exact: true });
  await expect(takeAir).toHaveCSS("border-radius", "50%");
  await takeAir.click();
  await expect(airIcon).toBeVisible();
  const white = page.getByRole("button", {
    name: "Inspect White Mirror · mirror slot",
    exact: true,
  });
  await expect(white.locator("svg")).toHaveCount(1);
  await expect(white).toHaveText("");
  await white.click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "White Mirror" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByLabel("Secret", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", {
      name: `Inspect Black Mirror · mirror slot`,
      exact: true,
    })
    .click();
  const back = page.getByRole("dialog");
  const inspectedState = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(inspectedState.rage).toBe(0);
  expect(inspectedState.pending).toBeNull();
  expect(inspectedState.players[0].courage).toBe(18);
  await expect(
    back.getByRole("heading", { name: byId["BM-01"].name, exact: true }),
  ).toBeVisible();
  await expect(back).toContainText(byId["BM-01"].name);
  await expect(back).toContainText("BM-01");
  await expect(back).toContainText(byId["BM-01"].effect!);
  await expect(back.locator(".card-black-mirror")).toBeVisible();
  await page.screenshot({ path: "test-results/black-mirror-card.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    back.getByRole("heading", { name: byId["BM-01"].name, exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/card-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", {
      name: "Inspect Element Bandolier · item slot",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Element Bandolier" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Inspect Air · element slot", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Air", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", {
      name: "Inspect Spark of Certainty · room",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Spark of Certainty" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Learning cost").getByLabel("Fire", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").locator(".game-card.card-spell"),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    byId["SP-01"].casting_modes![0].effect,
  );
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: "test-results/icon-inventory.png",
    fullPage: true,
  });
});
test("Placement chooses exact hand and room cards; cancellation changes nothing and room objects stay public", async ({
  page,
}) => {
  const s = inventoryFixture();
  for (const id of ["WM-02", "BM-02"]) {
    const index = s.rooms.Hall.objects.findIndex((token) => token.id === id);
    s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(index, 1));
  }
  await page.goto("/");
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(page.locator(".room-inspector")).not.toContainText(
    byId["BM-02"].effect!,
  );
  await page
    .locator('[data-token-id="BM-01"]')
    .getByRole("button", { name: "Take Black Mirror", exact: true })
    .click();
  // White Mirrors share their printed name, so select the physical ID's row.
  await page
    .locator('.room-inspector [data-token-id="WM-01"]')
    .getByRole("button", { name: "Take White Mirror", exact: true })
    .click();
  const before = await page.evaluate(() =>
    localStorage.getItem("the-mirrors-save-v1"),
  );
  await page
    .locator(".side-slots")
    .getByRole("button", { name: "Place", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Place",
    exact: true,
  });
  await expect(dialog.locator(".game-card")).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Confirm placement" }),
  ).toBeDisabled();
  await dialog
    .getByRole("radio", { name: "Choose WM-01 from Your hand" })
    .check();
  await expect(
    dialog.getByRole("button", { name: "Confirm placement" }),
  ).toBeDisabled();
  await dialog
    .getByRole("radio", { name: "Choose Black Mirror 2 from Room R01" })
    .check();
  await expect(dialog.locator(".game-card")).toHaveCount(2);
  await expect(dialog).toContainText(byId["BM-02"].effect!);
  await page.screenshot({
    path: "test-results/mirror-placement-selection.png",
  });
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(() => localStorage.getItem("the-mirrors-save-v1")),
  ).toBe(before);
  await page.getByRole("button", { name: "Place", exact: true }).click();
  await dialog
    .getByRole("radio", { name: "Choose WM-01 from Your hand" })
    .check();
  await dialog
    .getByRole("radio", { name: "Choose Black Mirror 2 from Room R01" })
    .check();
  await dialog.getByRole("button", { name: "Confirm placement" }).click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  await page
    .getByRole("button", {
      name: "Inspect Black Mirror · paired in room",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(byId["BM-02"].effect!);
  const afterInspection = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(afterInspection).toEqual(after);
  await page.keyboard.press("Escape");
  expect(after.rooms.R01.pair.map((token: { id: string }) => token.id)).toEqual(
    ["WM-01", "BM-02"],
  );
  expect(
    after.players[0].inventory.map((token: { id: string }) => token.id),
  ).toEqual(["BM-01"]);
  await page
    .getByRole("button", { name: "Leave Black Mirror", exact: true })
    .click();
  await page
    .getByRole("button", { name: "R02 explored reachable", exact: true })
    .click();
  await page.getByRole("button", { name: "Move here" }).click();
  // Both accessible mirror colors are required.
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "End turn" }).click();
  await page.getByRole("button", { name: "I am Elara" }).click();
  await page
    .getByRole("button", { name: "R01 explored reachable", exact: true })
    .click();
  await expect(page.locator(".room-inspector")).not.toContainText(
    byId["BM-01"].effect!,
  );
  await expect(
    page.locator(".room-inspector").getByRole("button", { name: /^Take / }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: `Inspect Black Mirror · room`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(byId["BM-01"].effect!);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", {
      name: "Inspect Element Bandolier · room",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(byId["IT-01"].effect!);
});

test("Hall center opens the traced puzzle, supports zoom, and returns without moving the hero", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the castle" }).click();
  await expect(page.locator(".hall-puzzle-portal > text")).toHaveCount(0);
  await expect(page.locator(".kaleidoscope-dialog")).toHaveCount(0);
  const hall = page.getByRole("button", {
    name: "Open Kaleidoscope",
    exact: true,
  });
  await hall.focus();
  await page.keyboard.press("Enter");
  const puzzle = page.getByRole("dialog", { name: "The Kaleidoscope · 0/35" });
  await expect(puzzle).toBeVisible();
  await expect(puzzle.locator(".glass-cell")).toHaveCount(35);
  await page.getByRole("button", { name: "Zoom puzzle in" }).click();
  await expect(puzzle.getByRole("button", { name: "125%" })).toBeVisible();
  await puzzle.getByRole("button", { name: "125%" }).click();
  await page.screenshot({ path: "test-results/kaleidoscope-zoom.png" });
  await page.keyboard.press("Escape");
  await expect(puzzle).toHaveCount(0);
  await expect(page.getByRole("button", { name: "End turn" })).toBeDisabled();
  await expect(hall).toBeFocused();
});
test("puzzle and icon controls fit a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the castle" }).click();
  await page
    .getByRole("button", { name: "Open Kaleidoscope", exact: true })
    .click();
  const puzzle = page.getByRole("dialog", { name: "The Kaleidoscope · 0/35" });
  await expect(puzzle).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/kaleidoscope-mobile.png" });
  await page.getByRole("button", { name: "Back to castle" }).click();
  await expect(puzzle).toHaveCount(0);
});

test("Place requires both mirror colors locally, including carried mirrors", async ({
  page,
}) => {
  const s = inventoryFixture();
  const blackIndex = s.rooms.R01.objects.findIndex(
    (t) => t.kind === "Black Mirror",
  );
  s.rooms.Hall.objects.push(...s.rooms.R01.objects.splice(blackIndex, 1));
  await page.goto("/");
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeDisabled();
  // A different player's carried Black Mirror is still inaccessible.
  const i = s.rooms.Hall.objects.findIndex((t) => t.id === "BM-01");
  s.players[1].inventory.push(...s.rooms.Hall.objects.splice(i, 1));
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.reload();
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeDisabled();
  s.players[0].inventory.push(...s.players[1].inventory.splice(0));
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.reload();
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeEnabled();
});
