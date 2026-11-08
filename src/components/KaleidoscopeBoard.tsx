"use client";
import { hasSpell } from "../game/systems/spellModifiers";
import { hasItemEffect, rewardFor } from "../game/systems/itemAccess";
import { spellFragmentBonus } from "../game/systems/spellModifiers";
import { useEffect, useRef, useState } from "react";
import type { Command, State } from "../game/domain/engine";
import { BoardIcon, GameIcon } from "./GameIcon";
import {
  kaleidoscopeCells,
  kaleidoscopeGems,
  closingGems,
  legalCell,
  placementReward,
  placementBonuses,
} from "../game/map/kaleidoscopeCells";
export function gemOwnerColors(s: State) {
  const colors = ["#efc77b", "#84c5da", "#d69ed7", "#9acf9e", "#f19b87"];
  return Object.fromEntries(
    Object.entries(s.gemOwners).map(([gem, id]) => [
      gem,
      colors[s.players.findIndex((p) => p.id === id)] ?? "#b9a780",
    ]),
  );
}
export const glassColors: Record<string, string> = {
  Scarlet: "#f57579",
  Emerald: "#72d8ae",
  Amber: "#f2c76e",
  Fuchsia: "#e08bce",
  Amethyst: "#b29afa",
};
const glyph: Record<string, string> = {
  Scarlet: "◆",
  Emerald: "✳",
  Amber: "☀",
  Fuchsia: "✿",
  Amethyst: "✦",
};
export function KaleidoscopeArt({
  mosaic,
  active = false,
  selected = null,
  onSelect,
  labels = true,
  freePlacement = false,
  gemColors = {},
  allowedCells,
}: {
  mosaic: (string | null)[];
  active?: boolean;
  selected?: number | null;
  onSelect?: (id: number) => void;
  labels?: boolean;
  freePlacement?: boolean;
  gemColors?: Record<string, string>;
  allowedCells?: number[];
}) {
  return (
    <svg
      className="kaleidoscope-art"
      viewBox="0 0 876 881"
      aria-label={labels ? "Kaleidoscope with 35 pentagonal cells" : undefined}
      aria-hidden={!labels}
    >
      <circle
        cx="437"
        cy="436"
        r="425"
        fill="#090e17"
        stroke="#a18b60"
        strokeWidth="3"
      />
      {kaleidoscopeGems.map((g) => {
        const complete = g.cells.every((id) => mosaic[id]),
          preview =
            selected !== null &&
            closingGems(mosaic, selected).some((x) => x.id === g.id);
        return (
          <polygon
            key={g.id}
            className={
              "gem-glass" +
              (complete ? " complete" : "") +
              (preview ? " preview" : "")
            }
            data-gem={g.id}
            aria-label={
              (g.bonus === 5 ? "Central gem" : "Small gem") +
              (complete ? " complete" : " incomplete")
            }
            points={g.points.map((p) => p.join(",")).join(" ")}
            fill={
              complete
                ? (gemColors[g.id] ?? "#b9a780")
                : g.bonus === 5
                  ? "#8c8e97"
                  : "#090e17"
            }
            stroke={complete ? "#fff0d0" : preview ? "#f8db86" : "#303847"}
            strokeWidth={preview ? 4 : 2}
          >
            <title>
              {g.bonus === 5
                ? "Central gem +5 Courage"
                : "Small gem +3 Courage"}
            </title>
          </polygon>
        );
      })}
      {kaleidoscopeCells.map((c) => {
        const color = mosaic[c.id],
          legal =
            active &&
            (allowedCells
              ? allowedCells.includes(c.id)
              : legalCell(mosaic, c.id, freePlacement)),
          near =
            selected !== null &&
            kaleidoscopeCells[selected].neighbors.includes(c.id) &&
            !!color;
        return (
          <g
            key={c.id}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect && legal ? 0 : undefined}
            aria-disabled={onSelect ? !legal : undefined}
            aria-label={
              onSelect
                ? `Cell ${c.id + 1}${color ? " " + color : legal ? " legal" : ""}`
                : undefined
            }
            aria-pressed={onSelect ? selected === c.id : undefined}
            className={`glass-cell ${legal ? "legal" : ""} ${selected === c.id ? "selected" : ""} ${near ? "neighbor" : ""} ${near ? "bonus-neighbor" : ""}`}
            onClick={() => {
              if (legal) onSelect?.(c.id);
            }}
            onKeyDown={(e) => {
              if (legal && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect?.(c.id);
              }
            }}
          >
            <title>{`Cell ${c.id + 1} · ${color ?? (c.isEdge ? "outer edge" : "inner cell")}`}</title>
            <polygon
              points={c.points.map((p) => p.join(",")).join(" ")}
              fill={color ? glassColors[color] : "#385d9c"}
              stroke="#172c4c"
              strokeWidth="2"
            />
            {color && (
              <BoardIcon name={color} x={c.x - 30} y={c.y - 32} size={60} />
            )}
            {labels && !color && (
              <text x={c.x} y={c.y + 6}>
                {c.id + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
export function KaleidoscopeBoard({
  s,
  dispatch,
  onClose,
}: {
  s: State;
  dispatch: (c: Command) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [cell, setCell] = useState<number | null>(null),
    [zoom, setZoom] = useState(1);
  const pending = s.pending?.stage === "placement" ? s.pending : null,
    p = s.players[s.active];
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement as HTMLElement | SVGElement | null;
    element?.showModal();
    return () => {
      element?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  const bonuses =
    cell !== null && pending
      ? placementBonuses(s.mosaic, cell, s.rooms[pending.room].color!)
      : [];
  let reward: number | null = null;
  if (cell !== null && pending)
    try {
      reward =
        placementReward(
          s.mosaic,
          cell,
          s.rooms[pending.room].color!,
          hasItemEffect(s, "FREE_FRAGMENT") || hasSpell(s, "FREE_GLASS"),
          Object.keys(s.gemOwners),
        ) +
        rewardFor(s, "FRAGMENT") +
        spellFragmentBonus(
          s,
          p.id,
          bonuses.some((n) => n.color !== s.rooms[pending.room].color),
        );
    } catch {}
  return (
    <dialog
      ref={dialog}
      className="kaleidoscope-dialog"
      aria-labelledby="kaleidoscope-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="puzzle-heading">
        <div>
          <p className="eyebrow">The heart of the Mirror Hall</p>
          <h2 id="kaleidoscope-title">
            The Kaleidoscope · {s.mosaic.filter(Boolean).length}/35
          </h2>
        </div>
        <button onClick={onClose} aria-label="Back to castle">
          ← Back to castle
        </button>
      </div>
      <div className="puzzle-layout">
        <div>
          <div className="puzzle-zoom">
            <button
              aria-label="Zoom puzzle out"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            >
              −
            </button>
            <button onClick={() => setZoom(1)}>
              {Math.round(zoom * 100)}%
            </button>
            <button
              aria-label="Zoom puzzle in"
              disabled={zoom >= 2}
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            >
              +
            </button>
          </div>
          <div className="puzzle-viewport">
            <div
              style={{
                width: `min(${zoom * 100}%, ${zoom * 65}dvh)`,
                margin: "0 auto",
              }}
            >
              <KaleidoscopeArt
                freePlacement={
                  hasItemEffect(s, "FREE_FRAGMENT") || hasSpell(s, "FREE_GLASS")
                }
                mosaic={s.mosaic}
                gemColors={gemOwnerColors(s)}
                active={!!pending}
                selected={cell}
                onSelect={setCell}
              />
            </div>
          </div>
        </div>
        <aside className="placement-guide">
          {pending ? (
            <>
              <p className="eyebrow">A fragment is ready</p>
              <h3 style={{ color: glassColors[s.rooms[pending.room].color!] }}>
                <GameIcon name={s.rooms[pending.room].color!} />{" "}
                {s.rooms[pending.room].color}
              </h3>
              <p>
                {hasItemEffect(s, "FREE_FRAGMENT") || hasSpell(s, "FREE_GLASS")
                  ? "Crown Shard of Freedom: choose any empty cell."
                  : s.mosaic.some(Boolean)
                    ? "Choose a highlighted cell sharing an edge with an existing fragment. Every new piece must join the placed glass."
                    : "Place the first fragment in a highlighted outer-edge cell."}
              </p>
              {bonuses.length > 0 && (
                <ul
                  className="adjacency-bonuses"
                  aria-label="Adjacent fragment bonuses"
                >
                  {bonuses.map((n) => (
                    <li key={n.id}>
                      Cell {n.id + 1} {"\u00b7"} {n.color}: +{n.bonus} Courage
                    </li>
                  ))}
                </ul>
              )}
              {!!rewardFor(s, "FRAGMENT") && (
                <p>
                  Kaleidoscope's Bargain: +{rewardFor(s, "FRAGMENT")} Courage.
                </p>
              )}
              {cell !== null &&
                closingGems(s.mosaic, cell, Object.keys(s.gemOwners)).map(
                  (g) => (
                    <p key={g.id}>
                      Close {g.bonus === 5 ? "the central gem" : "a small gem"}:
                      +{g.bonus} Courage
                    </p>
                  ),
                )}
              <p className="reward-preview">
                {reward === null
                  ? "Select a cell to preview Courage."
                  : `+${p.dead ? 0 : reward} Courage`}
              </p>
              <button
                className="primary wide"
                disabled={reward === null}
                onClick={() => {
                  dispatch({
                    type: "PLACE",
                    playerId: p.id,
                    cell: cell!,
                  });
                  setCell(null);
                }}
              >
                Confirm placement
                {reward !== null ? ` · +${p.dead ? 0 : reward} Courage` : ""}
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">The shattered prison</p>
              <h3>{s.mosaic.filter(Boolean).length} fragments restored</h3>
              <p>
                Restore a room’s mirror pair to receive its fragment and choose
                where it belongs.
              </p>
            </>
          )}
          <div className="puzzle-rules">
            <p>
              First fragment: outer edge. Every later fragment: share an edge
              with an existing piece.
            </p>
            <p>+1 Courage for placing glass.</p>
            <p>
              +1 for each same-color neighbor.
              <br />
              +2 for each different-color neighbor.
            </p>
            <p>
              Close a small diamond gem: +3 Courage. Close the central pentagon:
              +5 Courage. Both shine in the closing hero's color. The hero
              placing the last surrounding tile receives the bonus once.
            </p>
            <small>
              Every shared-edge neighbor adds its bonus. Gems are enclosed gaps,
              not fragment slots.
            </small>
          </div>
        </aside>
      </div>
    </dialog>
  );
}
