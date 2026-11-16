"use client";
import { useState } from "react";
import type { State, Command } from "../game/domain/engine";
import { companionActionPlan } from "../game/systems/companionAbilities";
import { SpellTargets } from "./SpellTargets";
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
  let plan: ReturnType<typeof companionActionPlan> | undefined,
    reason = "";
  try {
    plan = companionActionPlan(s, card);
  } catch (e) {
    reason = (e as Error).message;
  }
  if (!["CO-04", "CO-05", "CO-06", "CO-07", "CO-08", "CO-09"].includes(card))
    return null;
  return (
    <aside className="card-reference" aria-label="Companion ability">
      <h3>Companion ability</h3>
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
            Use ability
          </button>
        </>
      ) : (
        <p>{reason}</p>
      )}
    </aside>
  );
}
