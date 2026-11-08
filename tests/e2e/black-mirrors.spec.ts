import { test, expect, Page } from "@playwright/test";
import { initialState, reduce, State } from "../../src/game/domain/engine";
import {
  beginHeroTurn,
  mutableStatus,
} from "../../src/game/systems/blackMirrorRuntime";
import { byId } from "../../src/game/cards/catalog";

function fixture(card: string) {
  let s = initialState(["Rowan", "Elara"], `browser-${card}`);
  for (const r of Object.values(s.rooms))
    if (r.id !== "R35") {
      r.explored = true;
      r.objects = structuredClone(r.findings);
    }
  for (const id of ["WM-01", card, "E-Air-1", "E-Fire-1"]) {
    for (const r of Object.values(s.rooms)) {
      const pool = r.explored ? r.objects : r.findings,
        index = pool.findIndex((t) => t.id === id);
      if (index >= 0) {
        (id.startsWith("E-")
          ? s.players[0].inventory
          : s.rooms.R01.objects
        ).push(...pool.splice(index, 1));
        break;
      }
    }
  }
  s.players[0].room = "R01";
  s = reduce(s, {
    type: "PLACE_MIRRORS",
    playerId: "P1",
    whiteId: "WM-01",
    blackId: card,
  });
  s.occuldor = "Hall";
  s.players[0].courage = 25;
  return s;
}
async function resume(page: Page, s?: State) {
  await page.goto("/");
  if (s)
    await page.evaluate(
      (state) =>
        localStorage.setItem("the-mirrors-save-v1", JSON.stringify(state)),
      s,
    );
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await page.getByRole("button", { name: "I am Rowan" }).click();
}
const saved = (page: Page): Promise<State> =>
  page.evaluate(() => JSON.parse(localStorage.getItem("the-mirrors-save-v1")!));
async function flip(page: Page) {
  await page.getByRole("button", { name: "Collide", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Skip penalty and continue" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Resolve curse" }).click();
}
async function place(page: Page) {
  await page.getByRole("button", { name: "Cell 1 legal", exact: true }).click();
  await page.getByRole("button", { name: /Confirm placement/ }).click();
}

test("Material curse keeps its object choice across reload, drops the chosen token and seals capacity", async ({
  page,
}) => {
  await resume(page, fixture("BM-08"));
  await flip(page);
  let choice = page.getByRole("dialog", { name: /Choose 1 ELEMENT/ });
  await expect(choice).toBeVisible();
  expect((await saved(page)).rage).toBe(0);
  await resume(page);
  choice = page.getByRole("dialog", { name: /Choose 1 ELEMENT/ });
  await expect(
    choice.getByRole("button", { name: "Confirm curse choice" }),
  ).toBeDisabled();
  await choice.getByRole("radio", { name: "Air", exact: true }).check();
  await choice.getByRole("button", { name: "Confirm curse choice" }).click();
  await place(page);
  const s = await saved(page);
  expect(s.rooms.R01.objects.some((t) => t.id === "E-Air-1")).toBe(true);
  expect(s.players[0].inventory.some((t) => t.id === "E-Air-1")).toBe(false);
  expect(s.rage).toBe(1);
  expect(s.players[0].sigils).toHaveLength(1);
  await expect(page.getByLabel("elements slot 3: Hexlocked")).toBeVisible();
  await page.screenshot({
    path: "test-results/black-mirror-hexlock.png",
    fullPage: true,
  });
});

test("Threshold curse selects a legal corridor on the actual map and retains its blocked marker", async ({
  page,
}) => {
  await resume(page, fixture("BM-19"));
  await flip(page);
  const choice = page.getByRole("dialog", { name: /permanent Corridor Block/ });
  const state = await saved(page),
    edge = state.blackMirror.resolution!.choice!.options[0].id;
  await expect(choice.getByRole("radio")).toHaveCount(0);
  await choice
    .getByRole("button", { name: `Corridor ${edge}`, exact: true })
    .click();
  await page.screenshot({
    path: "test-results/black-mirror-corridor-choice.png",
  });
  await choice.getByRole("button", { name: "Confirm curse choice" }).click();
  await place(page);
  await expect(
    page.getByRole("img", { name: `Corridor Block ${edge}`, exact: true }),
  ).toBeVisible();
  expect((await saved(page)).blackMirror.thresholds).toEqual([edge]);
});

test("Darkness requires separate Courage payments while Portal routes allow exploration", async ({
  page,
}) => {
  const s = fixture("BM-17");
  s.blackMirror.rooms.R01 = { darkness: 2, portal: true };
  s.blackMirror.rooms.R35 = { darkness: 0, portal: true };
  await resume(page, s);
  await expect(
    page.getByRole("button", { name: "Collide", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Clear one Darkness (-1 Courage)",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Collide", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Clear one Darkness (-1 Courage)",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Collide", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".portal-route")).toHaveCount(0);
  await expect(page.locator(".portal-pulse")).toHaveCount(2);
  await page.locator('[data-room-id="R35"]').click();
  await expect(page.locator(".route")).toContainText("1 steps");
  await page.getByRole("button", { name: "Move here" }).click();
  const after = await saved(page);
  expect(after.players[0].room).toBe("R35");
  expect(after.rooms.R35.explored).toBe(true);
  expect(after.players[0].courage).toBe(23);
});

test("Paralysis suspends mandatory movement and start-of-turn choices remove only one Hexlock", async ({
  page,
}) => {
  await resume(page, fixture("BM-01"));
  await flip(page);
  await place(page);
  await page.getByRole("button", { name: "Back to castle" }).click();
  await expect(page.getByLabel("Paralysis on character")).toBeVisible();
  await expect(page.getByRole("button", { name: "End turn" })).toBeEnabled();
  await page.getByRole("button", { name: "End turn" }).click();
  await expect(
    page.getByRole("heading", { name: "Pass to Elara" }),
  ).toBeVisible();
  const s = fixture("BM-17"),
    status = mutableStatus(s, "P1");
  status.paralysis = ["paralysis-test"];
  status.hexlocks = [
    { id: "hex-1", category: "ELEMENT", slot: "elements" },
    { id: "hex-2", category: "MIRROR", slot: "mirrors" },
  ];
  beginHeroTurn(s);
  await resume(page, s);
  await expect(page.getByRole("dialog",{name:/Choose one HEXLOCK/})).toHaveCount(0);
  await expect(page.getByLabel("mirrors slot 2: Hexlocked")).toBeVisible();
  await expect(page.getByLabel("elements slot 3: Hexlocked")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "End turn" })).toBeEnabled();
  await resume(page);
  expect((await saved(page)).blackMirror.heroes.P1.hexlocks).toHaveLength(1);
});

test("after-collision movement asks for a destination and ends the turn only after choosing", async ({
  page,
}) => {
  await resume(page, fixture("BM-15"));
  await flip(page);
  await place(page);
  const choice = page.getByRole("dialog", {
    name: "Choose the forced destination",
  });
  await expect(choice).toBeVisible();
  const before = await saved(page),
    destination = before.blackMirror.resolution!.choice!.options.find(
      (o) => o.id !== "Hall",
    )!;
  await expect(choice.getByRole("radio")).toHaveCount(0);
  await choice.locator(`[data-room-id="${destination.id}"]`).click();
  await choice.getByRole("button", { name: "Confirm curse choice" }).click();
  await expect(
    page.getByRole("heading", { name: "Pass to Elara" }),
  ).toBeVisible();
  const after = await saved(page);
  expect(after.players[0].room).toBe(destination.id);
  expect(after.rage).toBe(1);
  expect(after.pending).toBeNull();
});

test("three Sigil Seals mark the chosen Quick action on the board and card, and survive reload", async ({
  page,
}) => {
  const s = fixture("BM-28");
  s.decks.Spell = s.decks.Spell.filter((id) => id !== "SP-01");
  s.players[0].inventory.push({ id: "SP-01", card: "SP-01", kind: "Spell" });
  s.players[0].knowledge[0] = true;
  s.players[0].spellSlots[0] = "SP-01";
  await resume(page, s);
  await flip(page);
  const choice = page.getByRole("dialog", {
    name: "Choose the Quick action to seal three times",
  });
  await choice.getByRole("radio").check();
  await choice.getByRole("button", { name: "Confirm curse choice" }).click();
  await place(page);
  await page.getByRole("button", { name: "Back to castle" }).click();
  await expect(page.locator(".knowledge .sealed-action")).toHaveText(
    /Sealed.*3/,
  );
  await page
    .getByRole("button", {
      name: `Inspect ${byId["SP-01"].name} · knowledge slot`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog").locator(".sealed-action")).toHaveText(
    /Sealed.*3/,
  );
  await page.keyboard.press("Escape");
  await resume(page);
  expect((await saved(page)).blackMirror.seals).toHaveLength(3);
});
