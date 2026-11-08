import { grantSigil, normalizeSigilIdentities } from "../../src/game/systems/sigils";
import { test, expect } from "@playwright/test";
import { initialState, State, reduce } from "../../src/game/domain/engine";
function scenario(): State {
  const s = initialState(["Rowan", "Elara"], "browser-mirrors");
  s.decks.Companion = [
    "CO-01",
    ...s.decks.Companion.filter((id) => id !== "CO-01"),
  ];
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = structuredClone(r.findings);
  }
  const loose = Object.values(s.rooms).flatMap((r) => r.objects);
  for (const r of Object.values(s.rooms)) r.objects = [];
  const ids = ["WM-01", "BM-08", "WM-02", "BM-01"];
  s.rooms.R01.objects = loose.filter((t) => ids.slice(0, 2).includes(t.id));
  s.rooms.R02.objects = loose.filter((t) => ids.slice(2).includes(t.id));
  s.rooms.Hall.objects = loose.filter((t) => !ids.includes(t.id));
  s.players[0].room = "R01";
  return s;
}

test("later Kaleidoscope fragments highlight only cells touching existing glass, including after resume", async ({
  page,
}) => {
  let s = scenario();
  s = reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-01",
    blackId: "BM-08",
  });
  s.players[0].room = "R02";
  s = reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-02",
    blackId: "BM-01",
  });
  s.players[0].room = "R01";
  s = reduce(s, { type: "COLLIDE", playerId: "P1" });
  s = reduce(s, {
    type: "CONTINUE_COLLISION",
    playerId: "P1",
    penalty: "apply",
  });
  s = reduce(s, { type: "PLACE", playerId: "P1", cell: 0 });
  s.players[0].room = "R02";
  s.occuldor = "Hall";
  s = reduce(s, { type: "COLLIDE", playerId: "P1" });
  s = reduce(s, {
    type: "CONTINUE_COLLISION",
    playerId: "P1",
    penalty: "apply",
  });
  if(s)normalizeSigilIdentities(s);
  await page.goto("/");
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  const puzzle = page.getByRole("dialog");
  const legalCellButton = puzzle.getByRole("button", {
    name: "Cell 2 legal",
    exact: true,
  });
  await page.keyboard.press("Tab");
  await legalCellButton.focus();
  await expect(legalCellButton).toHaveCSS("outline-style", "none");
  await expect(legalCellButton.locator("polygon")).toHaveCSS(
    "stroke-width",
    "5px",
  );
  await expect(puzzle.locator(".glass-cell.legal")).toHaveCount(2);
  await expect(
    puzzle.getByRole("button", { name: "Cell 2 legal", exact: true }),
  ).toBeEnabled();
  await expect(
    puzzle.getByRole("button", { name: "Cell 3 legal", exact: true }),
  ).toBeEnabled();
  const disconnected = puzzle.getByRole("button", {
    name: "Cell 4",
    exact: true,
  });
  await expect(disconnected).toHaveAttribute("aria-disabled", "true");
  await disconnected.dispatchEvent("click");
  await expect(
    puzzle.getByRole("button", { name: "Confirm placement", exact: true }),
  ).toBeDisabled();
  await puzzle
    .getByRole("button", { name: "Cell 2 legal", exact: true })
    .click();
  await puzzle.getByRole("button", { name: /Confirm placement/ }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(stored.mosaic.filter(Boolean)).toHaveLength(2);
  expect(stored.mosaic[3]).toBeNull();
});
test("place mirrors, lure Occuldor away, Collide, resolve a curse and place the Sigil", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (s) => localStorage.setItem("the-mirrors-save-v1", JSON.stringify(s)),
    scenario(),
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await page.getByRole("button", { name: "Place", exact: true }).click();
  await page.getByRole("radio", { name: "Choose WM-01 from Room R01" }).check();
  await page
    .getByRole("radio", { name: "Choose Black Mirror 1 from Room R01" })
    .check();
  await page.getByRole("button", { name: "Confirm placement" }).click();
  const firstRoom = page.locator('[data-room-id="R01"]');
  const secondRoom = page.locator('[data-room-id="R02"]');
  await expect(firstRoom.locator(".placed-white-mirror")).toHaveCount(1);
  await expect(firstRoom.locator(".placed-black-mirror")).toHaveCount(1);
  await expect(
    firstRoom.getByRole("img", { name: "Occuldor figurine", exact: true }),
  ).toBeVisible();
  await expect(
    firstRoom.getByRole("img", { name: "Rowan figurine", exact: true }),
  ).toContainText("R");
  const afterPlacement = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(afterPlacement.rage).toBe(0);
  expect(afterPlacement.players[0].sigils).toEqual([]);
  expect(afterPlacement.players[0].companions).toHaveLength(1);
  await expect(
    firstRoom.locator('.companion-figurine[data-shape="dog"]'),
  ).toHaveCount(1);
  await expect(
    firstRoom.getByRole("img", {
      name: "Rex the Dog figurine · follows Rowan",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Inspect Rex the Dog · attached companion",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Rex the Dog");
  await page.keyboard.press("Escape");
  await expect(
    page
      .locator(".occuldor-panel")
      .getByRole("heading", { name: "Guarding R01" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeDisabled();
  // Move/end a normal turn, then pass Elara's turn to return control to Rowan.
  await page
    .getByRole("button", { name: "R02 explored reachable", exact: true })
    .click();
  await page.getByRole("button", { name: "Move here" }).click();
  await expect(firstRoom.locator(".companion-figurine")).toHaveCount(0);
  await expect(
    secondRoom.getByRole("img", {
      name: "Rex the Dog figurine · follows Rowan",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/companion-follows.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "End turn" }).click();
  await page.getByRole("button", { name: "I am Elara" }).click();
  await expect(
    secondRoom.locator('[data-holder-id="P1"] .companion-figurine'),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "R03 explored reachable", exact: true })
    .click();
  await page.getByRole("button", { name: "Move here" }).click();
  await page.getByRole("button", { name: "End turn" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await page.getByRole("button", { name: "Place", exact: true }).click();
  await page.getByRole("radio", { name: "Choose WM-02 from Room R02" }).check();
  await page
    .getByRole("radio", { name: "Choose Black Mirror 1 from Room R02" })
    .check();
  await page.getByRole("button", { name: "Confirm placement" }).click();
  await expect(firstRoom.locator(".wizard-figurine")).toHaveCount(0);
  await expect(firstRoom.locator(".placed-mirrors")).toHaveCount(1);
  await expect(
    secondRoom.getByRole("img", { name: "Occuldor figurine", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "R01 explored reachable", exact: true })
    .click();
  await page.getByRole("button", { name: "Move here" }).click();
  await expect(
    page.getByRole("button", { name: "Collide", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".side-slots .collide-ready")).toHaveAccessibleName(
    "Collide",
  );
  await page.getByRole("button", { name: "Collide" }).click();
  await expect(
    page.getByRole("dialog", { name: "Black Mirror curse" }),
  ).toBeVisible();
  const collided = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(collided.rage).toBe(0);
  expect(collided.players[0].sigils).toHaveLength(0);
  expect(collided.rooms.R01.pair).toHaveLength(2);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  // Keep the fixed action footer outside the scrolling card on both screen sizes.
  const desktopViewport = page.viewportSize()!;
  for (const viewport of [desktopViewport, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const content = page.locator(".penalty-content");
    const footer = page.locator(".penalty-dialog .button-row");
    await content.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const bodyBox = (await content.boundingBox())!;
    const footerBox = (await footer.boundingBox())!;
    expect(bodyBox.y + bodyBox.height).toBeLessThanOrEqual(footerBox.y);
    expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByRole("button", { name: "Resolve curse" })).toBeVisible();
  }
  await page.setViewportSize(desktopViewport);
  await page.screenshot({ path: "test-results/penalty-popup.png" });
  // Reload while the popup is pending: the reward must never be issued twice.
  await page.reload();
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect(
    page.getByRole("dialog", { name: "Black Mirror curse" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resolve curse" }).click();
  // Closing the zoom view must not discard the pending restoration.
  await page.getByRole("button", { name: "Back to castle" }).click();
  await expect(
    firstRoom.getByRole("img", {
      name: "Rex the Dog figurine · follows Rowan",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Place", exact: true }),
  ).toBeDisabled();
  await expect(firstRoom.locator(".placed-mirrors")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "End turn" })).toBeDisabled();
  await page
    .getByRole("button", { name: "Open Kaleidoscope", exact: true })
    .click();
  await page.getByRole("button", { name: "Cell 1 legal", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm placement · +1 Courage" })
    .click();
  await page.getByRole("button", { name: "Back to castle" }).click();
  await expect(page.getByText("Unlocked", { exact: true })).toHaveCount(1);
  await expect(
    page
      .getByLabel("Your Mirror Sigils")
      .locator('image[href="/icons/sigils.png"]'),
  ).toHaveCount(1);
  await expect(page.locator(".room-inspector .room-symbol image")).toHaveCount(
    0,
  );
  await expect(page.locator(".room-inspector")).toContainText(
    "Fragment restored to the Kaleidoscope.",
  );
  await expect(page.getByText("1/35 fragments restored")).toBeVisible();
  await expect(
    page.locator('[data-room-id="R01"] .room-floor'),
  ).toHaveAttribute("fill", "#000000");
  await expect(
    page
      .locator(".room-contents > text, .room-contents > g > text")
      .filter({ hasText: /^R\d|✓/ }),
  ).toHaveCount(0);
  await expect(
    page.locator(".room-symbol").getByRole("img", { name: "Restored room" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/restored-black-room.png",
    fullPage: true,
  });
});
test("final Confront, collision and spatial placement reach the victory screen", async ({
  page,
}) => {
  let s = scenario();
  const roomIds = Object.keys(s.rooms).filter((id) => id !== "Hall");
  // A late-game fixture preserves all 140 physical starting objects.
  const pool = Object.values(s.rooms).flatMap((r) => r.objects);
  for (const r of Object.values(s.rooms)) r.objects = [];
  s.rooms.Hall.objects = pool.filter((t) => t.kind === "Element");
  for (let i = 0; i < 35; i++) {
    const r = s.rooms[roomIds[i]];
    const pair = pool.filter(
      (t) =>
        t.id === `WM-${String(i + 1).padStart(2, "0")}` ||
        t.id === `BM-${String(i + 1).padStart(2, "0")}`,
    );
    if (i < 34) {
      r.restored = true;
      s.removed.push(...pair);
      s.mosaic[i] = r.color;
      grantSigil(s,"P1",r.color!);
    } else r.pair = pair;
  }
  s.rage = 34;
  s.players[0].restored = 34;
  s.players[0].room = "R35";
  s.players[0].courage = 20;
  const expectedBonus = 1;
  s.occuldor = "R35";
  s.moved = true;
  // BM-35 invokes two personal arrival punishments before restoration.
  await page.goto("/");
  await page.evaluate(
    (state) =>
      localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
    s,
  );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await page.getByRole("button", { name: /Confront Occuldor/ }).click();
  await page.getByRole("button", { name: "Collide" }).click();
  await page.getByRole("button", { name: "Resolve curse" }).click();
  await page
    .getByRole("button", { name: "Cell 35 legal", exact: true })
    .click();
  await expect(page.getByLabel("Bonus neighbor")).toHaveCount(0);
  await expect(
    page.getByRole("list", { name: "Adjacent fragment bonuses" }).locator("li"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: `Confirm placement · +${expectedBonus} Courage`,
    }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Confirm placement/ }).click();
  await expect(
    page.getByRole("heading", { name: "The prison is restored." }),
  ).toBeVisible();
  const finished = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-mirrors-save-v1")!),
  );
  expect(finished.players[0].courage).toBe(
    20 - s.rules.confrontCost - 10 + expectedBonus,
  );
});
