"use client";
import { useState, useRef, useEffect } from "react";
import type { State, Command } from "../game/domain/engine";
import { itemById } from "../game/cards/items";
import {
  itemActionPlan,
  permanentAssignmentPlan,
} from "../game/systems/itemActions";
import { accessibleItems } from "../game/systems/itemAccess";
import { byId } from "../game/cards/catalog";
import { CastleBoard } from "./CastleBoard";
export function ItemControls({
  s,
  id,
  dispatch,
}: {
  s: State;
  id: string;
  dispatch: (c: Command) => unknown;
}) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    ref = useRef<HTMLDialogElement>(null),
    card = itemById[id],
    hero = s.players[s.active];
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  if (!card || s.privacy) return null;
  const carried = accessibleItems(s).some((t) => t.card === id);
  let plan: ReturnType<typeof itemActionPlan> | undefined,
    reason = "";
  if (card.subtype === "Tool")
    try {
      plan = itemActionPlan(s, id);
    } catch (e) {
      reason = (e as Error).message;
    }
  const toggle = (id: string) =>
    setSelected((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : plan?.max === 1
          ? [id]
          : old.length < (plan?.max ?? 0)
            ? [...old, id]
            : old,
    );
  return (
    <div className="card-ability-controls">
      {id === "IT-04" && carried && (
        <label>
          Movement bonus{" "}
          <select
            aria-label="Boots movement bonus"
            value={s.items.boots[hero.id] ?? 3}
            disabled={
              s.moved || !!s.pending || !!s.blackMirror.resolution || hero.dead
            }
            onChange={(e) =>
              dispatch({
                type: "SET_BOOTS",
                playerId: hero.id,
                bonus: Number(e.target.value),
              })
            }
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                +{n}
              </option>
            ))}
          </select>
        </label>
      )}
      {card.subtype === "Tool" && (
        <>
          <button
            className={plan ? "primary item-ready" : "primary"}
            title={reason || "Use this carried Item once this round"}
            disabled={!plan}
            onClick={() => {
              setSelected([]);
              setOpen(true);
            }}
          >
            Use {card.name}
          </button>
          <small>
            {!carried
              ? "Take this Item to use it."
              : s.items.used[hero.id]?.[id] === s.items.round
                ? "Used this round"
                : "Once per round"}
          </small>
        </>
      )}
      <dialog
        ref={ref}
        className={
          "item-action-dialog" +
          (plan?.kind === "rooms" ? " spatial-choice" : "")
        }
        aria-label={"Use " + card.name}
        onCancel={() => setOpen(false)}
      >
        <h2>{card.name}</h2>
        <p>{card.effect}</p>
        {plan?.kind === "rooms" ? (
          <div className="curse-target-map">
            <CastleBoard
              s={s}
              selected={hero.room}
              onSelect={toggle}
              onOpenPuzzle={() => {}}
              zoom={1}
              targets={{
                kind: "rooms",
                legal: plan.options.map((o) => o.id),
                selected,
                onToggle: toggle,
              }}
            />
          </div>
        ) : (
          <div className="item-choice-options">
            {plan?.options.map((o) => (
              <label key={o.id}>
                <input
                  type={plan.max === 1 ? "radio" : "checkbox"}
                  name="item-target"
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />
                {o.label}
              </label>
            ))}
          </div>
        )}
        <button onClick={() => setOpen(false)}>Cancel</button>{" "}
        <button
          className="primary"
          disabled={!plan || selected.length !== plan.min}
          onClick={() => {
            if (
              dispatch({
                type: "USE_ITEM",
                playerId: hero.id,
                itemId: id,
                ids: selected,
                round: s.items.round,
                turn: s.turn,
              }) !== false
            )
              setOpen(false);
          }}
        >
          Confirm {card.name}
        </button>
      </dialog>
    </div>
  );
}
