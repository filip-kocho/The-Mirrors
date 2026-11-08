"use client";
import { useEffect, useRef } from "react";
import { byId } from "../game/cards/catalog";
import type { Command, State } from "../game/domain/engine";
import { SpellActivationControls } from "./SpellActivationControls";
import { spellAdapters } from "../game/cards/spellEffects";
import { CardFace } from "./CardFace";
export function PenaltyDialog({
  s,
  dispatch,
  error,
}: {
  s: State;
  dispatch: (command: Command) => void;
  error?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const pending = s.pending;
  if (pending?.stage !== "penalty") return null;
  const proceed = (penalty: "apply" | "skip") =>
    dispatch({
      type: "CONTINUE_COLLISION",
      playerId: s.players[s.active].id,
      penalty,
    });
  return (
    <dialog
      ref={ref}
      className="penalty-dialog"
      aria-labelledby="penalty-title"
      onCancel={(e) => e.preventDefault()}
    >
      <div className="penalty-content">
        <p className="eyebrow">Black Mirror revealed - {pending.room}</p>
        <h2 id="penalty-title">Black Mirror curse</h2>
        <p>
          Resolve this curse, then receive the room's Sigil and restore its
          fragment. Any after-collision effects follow placement.
        </p>
        <CardFace card={byId[pending.card]} />
        {s.players[s.active].spellSlots
          .filter(
            (id): id is string =>
              !!id &&
              spellAdapters[id]?.some(
                (a) => false,
              ),
          )
          .map((id) => (
            <details key={id}>
              <summary>Reaction: {byId[id].name}</summary>
              <SpellActivationControls s={s} spell={id} dispatch={dispatch} />
            </details>
          ))}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
      <div className="button-row">
        <button className="primary" onClick={() => proceed("apply")}>
          Resolve curse
        </button>
        {s.rules.blackMirrorPolicies.allowSkip && (
          <button onClick={() => proceed("skip")}>
            Skip penalty and continue
          </button>
        )}
      </div>
    </dialog>
  );
}
