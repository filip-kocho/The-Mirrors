"use client";
import { createPortal } from "react-dom";
import { useState } from "react";
import type { Command, State } from "../game/domain/engine";
import { byId } from "../game/cards/catalog";
import { availableSigils, boundSigils } from "../game/systems/sigils";
import {
  visibleSpellColors,
  validateSpellTargets,
  spellActivationPlan,
} from "../game/systems/spellActivation";
import {
  applicableSpellSeals,
  activePermanent,
} from "../game/systems/spellModifiers";
import { SpellTargets } from "./SpellTargets";
import { GameIcon } from "./GameIcon";

export function SpellActivationControls({
  s,
  spell,
  dispatch,
  actionHost,
}: {
  s: State;
  spell: string;
  dispatch: (c: Command) => unknown;
  actionHost?: HTMLElement | null;
}) {
  if (s.privacy || !s.players[s.active].spellSlots.includes(spell)) return null;
  return (
    <div className="spell-activation-controls">
      {byId[spell].casting_modes?.map((_, action) => (
        <SpellMode
          key={`${spell}:${action}`}
          s={s}
          spell={spell}
          action={action}
          dispatch={dispatch}
          actionHost={actionHost}
        />
      ))}
    </div>
  );
}
function SpellMode({
  s,
  spell,
  action,
  dispatch,
  actionHost,
}: {
  s: State;
  spell: string;
  action: number;
  dispatch: (c: Command) => unknown;
  actionHost?: HTMLElement | null;
}) {
  const mode = byId[spell].casting_modes![action],
    quick = mode.name.toUpperCase() === "QUICK";
  const [selected, setSelected] = useState<(string | null)[]>(
    mode.sigil_slots.map(() => null),
  );
  const [targets, setTargets] = useState<string[]>([]);
  let plan: ReturnType<typeof spellActivationPlan> | undefined,
    reason = "";
  try {
    plan = spellActivationPlan(s, spell, action, targets);
  } catch (e) {
    reason = (e as Error).message;
  }
  const free = availableSigils(s),
    bound = boundSigils(s, spell),
    waiting = s.spells.quick
      .filter(
        (q) =>
          q.owner === s.players[s.active].id &&
          q.spell === spell &&
          q.action === action,
      )
      .flatMap((q) => q.sigils);
  const assigned = quick ? waiting : bound;
  const valid =
    !!plan &&
    selected.every((id, i) =>
      free.some((t) => t.id === id && t.color === mode.sigil_slots[i]),
    ) &&
    new Set(selected).size === selected.length &&
    targets.length >= plan.min &&
    targets.length <= plan.max;
  let targetsValid = false;
  try {
    validateSpellTargets(s, spell, action, targets);
    targetsValid = true;
  } catch {}
  const reset = () => {
    setSelected(mode.sigil_slots.map(() => null));
    setTargets([]);
  };
  return (
    <section
      className={`card-casting-mode ${plan ? (quick ? "quick-ready" : "permanent-ready") : ""}`}
      aria-label={`${mode.name} Sigil sockets`}
    >
      <h3>
        {mode.name}{" "}
        {assigned.length > 0 && (
          <small>
            {quick
              ? "Awaiting your next turn"
              : activePermanent(s, s.players[s.active].id, spell)
                ? "Active · bound"
                : "Bound · suppressed"}
          </small>
        )}
      </h3>
      <p>{mode.effect}</p>
      {!!applicableSpellSeals(s, spell, action).length && (
        <small className="sealed-action">
          Sealed x{applicableSpellSeals(s, spell, action).length}
        </small>
      )}
      <div className="spell-sockets">
        {mode.sigil_slots.map((color, i) => {
          const chosen = free.find((t) => t.id === selected[i]);
          return (
            <button
              key={i}
              type="button"
              aria-label={`${mode.name} ${color} socket ${i + 1}`}
              aria-pressed={!!chosen}
              disabled={!plan || !!assigned.length}
              title={`${color}: ${free.filter((t) => t.color === color && !selected.includes(t.id)).length} unassigned available`}
              onClick={() =>
                setSelected((old) =>
                  old.map((id, j) =>
                    j !== i
                      ? id
                      : id
                        ? null
                        : (free.find(
                            (t) => t.color === color && !old.includes(t.id),
                          )?.id ?? null),
                  ),
                )
              }
            >
              <GameIcon name={color} />
              <small aria-hidden="true">
                {assigned[i] ? "\u25c6" : chosen ? "\u2713" : "+"}
              </small>
            </button>
          );
        })}
      </div>
      {actionHost &&
        createPortal(
          <section
            className="spell-mode spell-resolution"
            aria-label={`${mode.name} activation`}
          >
            <h3>{mode.name}</h3>
            {plan?.targetCount !== 0 && plan && (
              <fieldset>
                <legend>
                  Choose{" "}
                  {plan.min === plan.max ? plan.min : `${plan.min}-${plan.max}`}{" "}
                  target(s)
                </legend>
                <SpellTargets
                  s={s}
                  choices={plan.choices}
                  selected={targets}
                  max={plan.max}
                  onChange={setTargets}
                />
              </fieldset>
            )}
            {!quick && (
              <small>
                Bound Sigils never return to storage when this Spell leaves
                play.
              </small>
            )}
            {reason && <p className="spell-unavailable">{reason}</p>}
            <div className="button-row">
              <button
                disabled={!valid || !targetsValid}
                onClick={() => {
                  if (
                    dispatch({
                      type: "CAST_SPELL",
                      playerId: s.players[s.active].id,
                      spellId: spell,
                      action,
                      sigilIds: selected as string[],
                      targets,
                    }) !== false
                  )
                    reset();
                }}
              >
                {quick ? "Activate Quick" : "Bind Permanently"}
              </button>
              {(selected.some(Boolean) || targets.length > 0) && (
                <button onClick={reset}>Cancel</button>
              )}
            </div>
            {["SP-10", "SP-20"].includes(spell) &&
              !!visibleSpellColors(s).length && (
                <p>
                  Private visions:{" "}
                  {visibleSpellColors(s)
                    .map((id) => `${id}: ${s.rooms[id].color}`)
                    .join("; ")}
                </p>
              )}
          </section>,
          actionHost,
        )}
    </section>
  );
}
