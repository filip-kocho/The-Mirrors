import { normalizeSigilIdentities } from "../../src/game/systems/sigils";
import { test, expect, type Page } from "@playwright/test";
import {
  initialState,
  type State,
  type Token,
} from "../../src/game/domain/engine";
import { byId, colors } from "../../src/game/cards/catalog";
import { mutableStatus } from "../../src/game/systems/blackMirrorRuntime";
import { assignPortals } from "../../src/game/systems/portals";
import {
  kaleidoscopeGems,
  kaleidoscopeCells,
  placementReward,
} from "../../src/game/map/kaleidoscopeCells";
function fixture() {
  const s = initialState(["Rowan", "Elara"], "revision-browser");
  const all = Object.values(s.rooms).flatMap((r) => r.findings);
  for (const r of Object.values(s.rooms)) {
    r.explored = true;
    r.objects = [];
  }
  s.rooms.Hall.objects = structuredClone(all);
  s.players[0].room = "R01";
  return s;
}
function add(s: State, id: string, carried = true) {
  const c = byId[id];
  s.decks[c.family] = s.decks[c.family].filter((x) => x !== id);
  (carried ? s.players[0].inventory : s.rooms.R01.objects).push({
    id,
    card: id,
    kind: c.family as Token["kind"],
  });
}
async function resume(page: Page, s: State) {
  if(s)normalizeSigilIdentities(s);
  await page.goto("/");
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

test("board tokens, paired Portals, party Fear and the five-Sigil hand are interactive", async ({
  page,
}, testInfo) => {
  const s = fixture();
  s.players[0].knowledge = [true, true, true, true];
  s.players[0].sigils = [...colors];
  s.players[1].courage = 9;
  s.occuldor = "R02";
  mutableStatus(s, "P1").paralysis = ["paralysis-1"];
  mutableStatus(s, "P1").hexlocks = [
    { id: "hex-1", category: "ELEMENT", slot: "elements" },
  ];
  assignPortals(s, ["R01", "R35"]);
  assignPortals(s, ["R02", "R34"]);
  add(s, "IT-11");
  const at = s.rooms.Hall.objects.findIndex((t) => t.id === "E-Air-1");
  s.rooms.R01.objects.push(...s.rooms.Hall.objects.splice(at, 1));
  await resume(page, s);
  await expect(page.locator('[data-slot="elements"]')).toHaveCount(3);
  await expect(
    page.getByRole("img", {
      name: "1 Hexlock blocking this slot",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Paralysis on character" }),
  ).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Elara Courage" }),
  ).toHaveAttribute("value", "9");
  await expect(page.locator(".portal-pulse")).toHaveCount(4);
  await expect(page.locator(".portal-route")).toHaveCount(0);
  await expect(page.locator(".active-figurine")).toHaveCount(1);
  await expect(page.locator(".inventory-icon.item-ready")).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath("revised-table.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Banish Occuldor", exact: true })
    .click();
  expect((await saved(page)).occuldor).toBe("Hall");
  expect((await saved(page)).players[0].sigils).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Banish Occuldor", exact: true }),
  ).toBeDisabled();
});

test("leaving a capacity Item asks which excess objects to leave and resumes safely", async ({
  page,
}) => {
  const s = fixture();
  add(s, "IT-01");
  for (let i = 1; i <= 5; i++) {
    const at = s.rooms.Hall.objects.findIndex((t) => t.id === `E-Air-${i}`);
    s.players[0].inventory.push(...s.rooms.Hall.objects.splice(at, 1));
  }
  await resume(page, s);
  await page
    .getByRole("button", { name: `Leave ${byId["IT-01"].name}`, exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Carrying capacity decreased");
  await dialog.getByRole("radio").first().check();
  await dialog.getByRole("button", { name: "Leave selected object" }).click();
  await dialog.getByRole("radio").first().check();
  await dialog.getByRole("button", { name: "Leave selected object" }).click();
  await expect(dialog).toHaveCount(0);
  expect((await saved(page)).players[0].inventory).toHaveLength(3);
  await expect(page.locator('[data-slot="elements"]')).toHaveCount(3);
});

test("surrounding gaps makes them ready without automatic installation rewards", async ({
  page,
}, testInfo) => {
  for (const bonus of [3, 5]) {
    const s = fixture(),
      gem = kaleidoscopeGems.find((g) => g.bonus === bonus)!,
      last = gem.cells.at(-1)!;
    const filled = [
      ...new Set([
        ...gem.cells.filter((c) => c !== last),
        kaleidoscopeCells[last].neighbors[0],
      ]),
    ];
    filled.forEach((c) => (s.mosaic[c] = "Scarlet"));
    s.rage = filled.length + 1;
    Object.values(s.rooms)
      .filter((r) => r.id !== "Hall")
      .slice(0, s.rage)
      .forEach((r) => (r.restored = true));
    s.pending = { room: "R01", card: "BM-01", stage: "placement" };
    s.players[0].courage = 5;
    const reward = placementReward(s.mosaic, last, s.rooms.R01.color!);
    await resume(page, s);
    const puzzle = page.getByRole("dialog");
    await puzzle
      .getByRole("button", { name: `Cell ${last + 1} legal`, exact: true })
      .click();
    await expect(puzzle).toContainText(
      "+1 Courage",
    );
    await puzzle
      .getByRole("button", {
        name: new RegExp(`Confirm placement.*\\+${reward} Courage`),
      })
      .click();
    expect((await saved(page)).players[0].courage).toBe(5 + reward);
    await expect(puzzle.locator(`[data-gem="${gem.id}"]`)).toHaveAttribute(
      "fill",
      bonus === 5 ? "#8c8e97" : "#090e17",
    );
    await page.screenshot({
      path: testInfo.outputPath(`gem-${bonus}.png`),
      fullPage: true,
    });
    await page.reload();
  }
});
