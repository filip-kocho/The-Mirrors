"use client";
import { useState } from "react";
import { LearningDialog } from "./LearningDialog";
import { itemEffects } from "../game/systems/itemAccess";
import type { Command, State } from "../game/domain/engine";
import { automaticLearningPlan } from "../game/systems/spells";
import { byId } from "../game/cards/catalog";
import { darkness } from "../game/systems/blackMirrorRuntime";
import { ActionIcon } from "./ActionIcon";

export function SpellAction({
  s,
  spellId,
  dispatch,
}: {
  s: State;
  spellId: string;
  dispatch: (command: Command) => unknown;
}) {
  const [choosing, setChoosing] = useState(false);
  const modified = itemEffects(s).some((e) =>
    ["AETHER_WILD", "DOUBLE", "LEARNING_DISCOUNT"].includes(e.op),
  );
  const player = s.players[s.active],
    learned = player.spellSlots.includes(spellId);
  let reason = "",
    slot = -1;
  if (learned) {
    if (
      s.privacy ||
      s.pending ||
      s.blackMirror.resolution ||
      darkness(s, player.room) ||
      s.outcome !== "playing" ||
      player.dead
    )
      reason = "Spell actions are unavailable during this phase.";
  } else {
    try {
      slot = automaticLearningPlan(s, spellId).slot;
    } catch (error) {
      reason = (error as Error).message;
    }
  }
  const title =
    reason ||
    (learned
      ? "Leave this Spell in your room; learning costs are not refunded."
      : `Learn: pay ${byId[spellId].learn_elements!.join(" + ")} from this room and/or your board; equip slot ${slot + 1}.`);
  return (
    <>
      {" "}
      <button
        className="spell-action"
        disabled={!!reason}
        title={title}
        aria-label={`${learned ? "Leave" : "Learn"} ${byId[spellId].name}`}
        onClick={() =>
          !learned && modified
            ? setChoosing(true)
            : dispatch({
                type: learned ? "LEAVE_SPELL" : "LEARN",
                playerId: player.id,
                spellId,
              })
        }
      >
        <ActionIcon name={learned ? "leave" : "learn"} />
      </button>
      {choosing && !s.privacy && (
        <LearningDialog
          s={s}
          spell={spellId}
          dispatch={dispatch}
          onClose={() => setChoosing(false)}
        />
      )}
    </>
  );
}
