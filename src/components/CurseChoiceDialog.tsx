"use client";
import { CardFace } from "./CardFace";
import { useEffect, useRef, useState } from "react";
import type { Command, State } from "../game/domain/engine";
import { byId } from "../game/cards/catalog";
import { CastleBoard } from "./CastleBoard";
import { CurseTokenIcon } from "./CurseTokenIcon";
export function CurseChoiceDialog({
  s,
  dispatch,
  error,
}: {
  s: State;
  dispatch: (command: Command) => void;
  error: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [selected, setSelected] = useState<string[]>([]);
  const res = s.blackMirror.resolution!,
    choice = res.choice!;
  useEffect(() => {
    const element = ref.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    setSelected([]);
  }, [choice.id]);
  const toggle = (id: string) =>
    setSelected((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : choice.max === 1
          ? [id]
          : old.length < choice.max
            ? [...old, id]
            : old,
    );
  const spatial = choice.kind === "rooms" || choice.kind === "corridors";
  return (
    <dialog
      ref={ref}
      className={`curse-choice-dialog${spatial ? " spatial-choice" : ""}`}
      aria-labelledby="curse-choice-title"
      onCancel={(e) => e.preventDefault()}
    >
      <p className="eyebrow">
        {res.phase === "refresh"
          ? "Start of turn · remove one token of each eligible type"
          : `${byId[res.card] ? res.card + " · " + byId[res.card].name : "Inventory"} · ${res.phase === "after" ? "after collision" : ["item", "inventory"].includes(res.phase) ? "capacity adjustment" : "curse"}`}
      </p>
      {byId[res.card]?.family === "Black Mirror" && (
        <CardFace card={byId[res.card]} />
      )}
      <h2 id="curse-choice-title">{choice.title}</h2>
      <p aria-live="polite">
        Select {choice.min} {choice.min === 1 ? "target" : "targets"}.{" "}
        {selected.length} selected.
        {spatial &&
          (choice.kind === "rooms"
            ? " Click a glowing room on the map. Click it again to deselect."
            : " Click a glowing corridor seal on the map. Click it again to deselect.")}
      </p>
      {spatial && (
        <div className="curse-target-map">
          <CastleBoard
            s={s}
            selected={s.players[s.active].room}
            onSelect={toggle}
            onOpenPuzzle={() => {}}
            zoom={1}
            targets={{
              kind: choice.kind as "rooms" | "corridors",
              legal: choice.options.map((o) => o.id),
              selected,
              onToggle: toggle,
            }}
          />
        </div>
      )}
      {!spatial && (
        <div
          className="curse-options"
          role="group"
          aria-label="Legal curse targets"
        >
          {choice.options.map((option) => (
            <label
              key={option.id}
              className={selected.includes(option.id) ? "chosen" : ""}
            >
              <input
                type={choice.max === 1 ? "radio" : "checkbox"}
                name="curse-target"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
                disabled={
                  !selected.includes(option.id) &&
                  selected.length >= choice.max &&
                  choice.max > 1
                }
              />
              {choice.kind === "tokens" && res.effects[0]?.op === "REMOVE" && (
                <CurseTokenIcon type={res.effects[0].token} size={36} />
              )}
              {option.label}
            </label>
          ))}
        </div>
      )}
      {res.summary.length > 0 && (
        <details>
          <summary>Effects already resolved</summary>
          {res.summary.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </details>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        className="primary"
        disabled={selected.length !== choice.min}
        onClick={() =>
          dispatch({
            type: "CURSE_CHOICE",
            playerId: s.players[s.active].id,
            choiceId: choice.id,
            ids: selected,
          })
        }
      >
        {["item", "inventory"].includes(res.phase)
          ? "Leave selected object"
          : "Confirm curse choice"}
      </button>
    </dialog>
  );
}
