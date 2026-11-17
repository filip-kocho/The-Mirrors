"use client";
import { useState } from "react";
import type { State, Command } from "../game/domain/engine";
import { companionActionPlan } from "../game/systems/companionAbilities";
import { SpellTargets } from "./SpellTargets";
import { GameIcon } from "./GameIcon";
import {
  juliaPresent,
  juliaDiscountReady,
} from "../game/systems/companionLearning";
import { hasCompanion } from "../game/systems/companionAbilities";
export function CompanionControls({
  s,
  card,
  dispatch,
}: {
  s: State;
  card: string;
  dispatch: (c: Command) => unknown;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const player = s.players[s.active];
  if (s.privacy) return null;
  if (["CO-01", "CO-02", "CO-10"].includes(card)) {
    const active =
      card === "CO-10" ? juliaPresent(s) : hasCompanion(s, player.id, card);
    return (
      <aside className="card-reference" aria-label="Companion ability">
        <h3>Companion ability</h3>
        <p>
          {!active
            ? "This Companion is not available to you here."
            : card === "CO-01"
              ? "Active: Rex prevents 1 Courage loss whenever Occuldor arrives in your room."
              : card === "CO-02"
                ? "Active: Alexis adds 1 to your movement allowance."
                : juliaDiscountReady(s)
                  ? "Julia is ready: choose Learn on a Spell to reduce one Earth or Water requirement. At least one Element remains. Julia and Grimoire discounts do not stack."
                  : "Julia's learning discount has been used for this " +
                    s.rules.companionPolicies.juliaRefresh.toLowerCase() +
                    "."}
        </p>
      </aside>
    );
  }
  let plan: ReturnType<typeof companionActionPlan> | undefined,
    reason = "";
  try {
    plan = companionActionPlan(s, card);
  } catch (e) {
    reason = (e as Error).message;
  }
  if (
    !["CO-03", "CO-04", "CO-05", "CO-06", "CO-07", "CO-08", "CO-09"].includes(
      card,
    )
  )
    return null;
  return (
    <aside className="card-reference" aria-label="Companion ability">
      <h3>Companion ability</h3>
      {card === "CO-03" && (
        <>
          <p>
            Before movement, choose one adjacent unexplored room. Only you learn
            its Sigil color; its findings remain hidden.
          </p>
          {!!s.spells.visions[player.id]?.length && (
            <section aria-label="Private scouting results">
              <h4>Only {player.name}'s knowledge</h4>
              {s.spells.visions[player.id].map((id) => (
                <p key={id}>
                  {id}: <GameIcon name={s.rooms[id].color!} />{" "}
                  {s.rooms[id].color}
                </p>
              ))}
            </section>
          )}
        </>
      )}
      {plan ? (
        <>
          <SpellTargets
            s={s}
            choices={plan.options}
            selected={selected}
            max={plan.max}
            onChange={setSelected}
          />
          <button
            disabled={!selected.length}
            onClick={() => {
              if (
                dispatch({
                  type: "USE_COMPANION",
                  playerId: s.players[s.active].id,
                  card,
                  ids: selected,
                }) !== false
              )
                setSelected([]);
            }}
          >
            {card === "CO-03" ? "Scout privately" : "Use ability"}
          </button>
        </>
      ) : (
        <p>{reason}</p>
      )}
    </aside>
  );
}
