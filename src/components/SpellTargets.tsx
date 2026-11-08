"use client";
import { useState } from "react";
import type { State } from "../game/domain/engine";
import type { SpellChoice } from "../game/systems/spellActivation";
import { CastleBoard } from "./CastleBoard";
import { KaleidoscopeArt, gemOwnerColors } from "./KaleidoscopeBoard";
export function SpellTargets({
  s,
  choices,
  selected,
  max,
  onChange,
}: {
  s: State;
  choices: SpellChoice[];
  selected: string[];
  max: number;
  onChange: (ids: string[]) => void;
}) {
  const [source, setSource] = useState<number | null>(null);
  const toggle = (id: string) => {
    const c = choices.find((c) => c.id === id)!;
    if (c.group === "tool") {
      onChange(selected.includes(id) ? [] : [id]);
      return;
    }
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : selected.length < max
          ? [...selected, id]
          : max === 1
            ? [id]
            : selected,
    );
  };
  if (choices[0]?.group === "glass") {
    const allowed =
      source === null
        ? [...new Set(choices.map((c) => Number(c.id.split(":")[0])))]
        : choices
            .filter((c) => Number(c.id.split(":")[0]) === source)
            .map((c) => Number(c.id.split(":")[1]));
    return (
      <div className="spell-spatial-target">
        <p>
          {source === null
            ? "Choose the restored fragment to relocate."
            : "Choose a glowing empty destination. No Courage or Sigil is awarded."}
        </p>
        <KaleidoscopeArt
          mosaic={s.mosaic}
          gemColors={gemOwnerColors(s)}
          active
          allowedCells={allowed}
          selected={
            selected.length ? Number(selected[0].split(":")[1]) : source
          }
          onSelect={(id) =>
            source === null ? setSource(id) : onChange([`${source}:${id}`])
          }
        />
        {source !== null && (
          <button
            onClick={() => {
              setSource(null);
              onChange([]);
            }}
          >
            Choose another fragment
          </button>
        )}
      </div>
    );
  }
  const rooms = choices.filter((c) => c.group === "room");
  return (
    <div>
      {rooms.length > 0 && (
        <div className="spell-spatial-target">
          <p>Select a glowing room.</p>
          <CastleBoard
            s={s}
            selected={s.players[s.active].room}
            onSelect={toggle}
            onOpenPuzzle={() => {}}
            zoom={1}
            targets={{
              kind: "rooms",
              legal: rooms.map((c) => c.id),
              selected: selected.filter((id) => s.rooms[id]),
              onToggle: toggle,
            }}
          />
        </div>
      )}
      <div className="spell-target-list">
        {choices
          .filter((c) => c.group !== "room")
          .map((c) => (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              {c.label}
            </label>
          ))}
      </div>
    </div>
  );
}
