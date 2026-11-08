// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PenaltyDialog } from "../src/components/PenaltyDialog";
import { KaleidoscopeBoard } from "../src/components/KaleidoscopeBoard";
import { initialState } from "../src/game/domain/engine";
import { PlayerCollection } from "../src/components/PlayerCollection";
import { CardFace } from "../src/components/CardFace";
import { byId } from "../src/game/cards/catalog";
import { SpellAction } from "../src/components/SpellAction";
afterEach(cleanup);
describe("signature interactions", () => {
  it("previews all adjacent bonuses without asking the player to pick a neighbor", () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    const s = initialState(["A", "B"], "adjacency-ui");
    s.mosaic[0] = "Scarlet";
    s.mosaic[5] = "Emerald";
    s.rooms.R01.color = "Scarlet";
    s.pending = { room: "R01", card: "BM-01", stage: "placement" };
    const dispatch = vi.fn();
    const { container } = render(
      <KaleidoscopeBoard s={s} dispatch={dispatch} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cell 2 legal" }));
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(
      screen.getByRole("list", { name: "Adjacent fragment bonuses" }).children,
    ).toHaveLength(2);
    expect(container.querySelectorAll(".bonus-neighbor")).toHaveLength(2);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm placement · +4 Courage" }),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "PLACE",
      playerId: "P1",
      cell: 1,
    });
  });
  it("blocks obsolete Tool prerequisites even when the old unrelated Item ID is carried", () => {
    const s = initialState(["A", "B"], "learning-ui");
    s.players[0].room = "R01";
    s.players[0].knowledge[0] = true;
    s.rooms.R01.explored = true;
    s.rooms.R01.objects = [
      { id: "SP-17", card: "SP-17", kind: "Spell" },
      { id: "E-Air-1", kind: "Element", element: "Air" },
      { id: "E-Earth-1", kind: "Element", element: "Earth" },
    ];
    s.players[0].inventory.push({ id: "IT-11", card: "IT-11", kind: "Item" });
    const dispatch = vi.fn();
    render(<SpellAction s={s} spellId="SP-17" dispatch={dispatch} />);
    const button = screen.getByRole("button", {
      name: `Learn ${byId["SP-17"].name}`,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.title).toContain("Prism Lens");
    fireEvent.click(button);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("does not display private Secret text until its owner reveals it", () => {
    const s = initialState(["A", "B"], "ui");
    s.players[0].secrets = ["SE-01"];
    const inspect = vi.fn();
    render(<PlayerCollection player={s.players[0]} onInspect={inspect} />);
    expect(screen.queryByText("A Promise in the Pub")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Inspect private Secret 1" }),
    );
    expect(inspect).toHaveBeenCalledWith({
      id: "SE-01",
      card: "SE-01",
      kind: "Secret",
    });
  });
  it("shows a Black Mirror face without discovery sockets or empty slots", () => {
    const { container } = render(<CardFace card={byId["BM-01"]} />);
    expect(screen.getByText(byId["BM-01"].effect!)).toBeTruthy();
    expect(container.querySelector(".card-black-mirror")).toBeTruthy();
    expect(container.querySelector(".card-sockets")).toBeNull();
    expect(screen.queryByLabelText("Empty")).toBeNull();
  });
  it("shows only actual discoveries on White Mirrors while retaining the source pattern", () => {
    expect(byId["WM-01"].slots).toContain("Empty");
    const { container } = render(<CardFace card={byId["WM-01"]} />);
    expect(screen.queryByLabelText("Empty")).toBeNull();
    expect(container.querySelectorAll(".card-sockets > span")).toHaveLength(2);
    expect(screen.getByLabelText("Secret")).toBeTruthy();
    expect(screen.getByLabelText("Companion")).toBeTruthy();
    expect(byId["WM-01"].slots).toHaveLength(3);
  });
  it("shows the printed penalty and continues without manual fields or notes", () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    const s = initialState(["A", "B"], "ui");
    s.pending = { room: "R01", card: "BM-08", stage: "penalty" };
    const dispatch = vi.fn();
    render(<PenaltyDialog s={s} dispatch={dispatch} />);
    expect(screen.getByText(byId["BM-08"].effect!)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Resolve curse" }));
    expect(dispatch).toHaveBeenCalledWith({
      type: "CONTINUE_COLLISION",
      playerId: "P1",
      penalty: "apply",
    });
  });
  it("shows the Courage award before committing a legal fragment placement", () => {
    const s = initialState(["A", "B"], "ui");
    s.pending = { room: "R01", card: "BM-01", stage: "placement" };
    const dispatch = vi.fn();
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    render(<KaleidoscopeBoard s={s} dispatch={dispatch} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cell 1 legal" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm placement · +1 Courage" }),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "PLACE",
      playerId: "P1",
      cell: 0,
    });
  });
});
