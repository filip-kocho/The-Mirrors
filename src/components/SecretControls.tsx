"use client";
import { useState } from "react";
import type { State, Command } from "../game/domain/engine";
import { secretById, type SpellTier } from "../game/cards/secrets";
import {
  evaluateSecretCondition,
  secretRevealPlan,
} from "../game/systems/secrets";

export function SecretControls({
  s,
  id,
  dispatch,
}: {
  s: State;
  id: string;
  dispatch: (command: Command) => unknown;
}) {
  const [tier, setTier] = useState<SpellTier | undefined>();
  const card = secretById[id],
    p = s.players[s.active];
  if (!card || s.privacy) return null;
  const owner = s.players.find((h) =>
    h.completedSecrets.some((c) => c.id === id),
  );
  if (owner) {
    const completed = owner.completedSecrets.find((c) => c.id === id)!;
    return (
      <section className="secret-completion" aria-label="Completed achievement">
        <h3>Completed by {owner.name}</h3>
        {completed.legacy && (
          <p>
            Completed under earlier rules. Its original Courage reward was
            preserved during migration.
          </p>
        )}
        <p>
          Turn {completed.turn}:{" "}
          {completed.rewardType === "DIAMOND_GEM"
            ? "1 Diamond Gem awarded"
            : "+" + completed.gained + " Courage gained"}
        </p>
        {completed.rewardType !== "DIAMOND_GEM" &&
          completed.gained < completed.reward && (
            <p>
              The +{completed.reward} reward was capped by the Courage track.
            </p>
          )}
        <small>
          Revealed to everyone. This achievement cannot be claimed again.
        </small>
      </section>
    );
  }
  if (!p.secrets.includes(id)) return null;
  const evaluation = evaluateSecretCondition(card, p.id, s);
  let reason = "",
    reward: number | undefined;
  try {
    reward = secretRevealPlan(s, p.id, id, tier).reward;
  } catch (e) {
    reason = (e as Error).message;
  }
  return (
    <section
      className="secret-controls"
      aria-label="Private achievement status"
    >
      <h3>{evaluation.eligible ? "Eligible" : "Not yet eligible"}</h3>
      <p>{evaluation.progress}</p>
      {evaluation.variants.length > 1 && (
        <label>
          Choose a printed Spell tier
          <select
            aria-label="Achievement Spell tier"
            value={tier ?? ""}
            onChange={(e) =>
              setTier((e.target.value as SpellTier) || undefined)
            }
          >
            <option value="">Choose tier</option>
            {evaluation.variants.map((v) => (
              <option key={v.tier} value={v.tier}>
                {v.tier} · +{v.reward} Courage
              </option>
            ))}
          </select>
        </label>
      )}
      {card.reward.type === "DIAMOND_GEM" && (
        <p>
          Reveal to receive 1 Diamond Gem. No Courage is awarded until
          installation. If storage is full, the Gem stays in your room.
        </p>
      )}
      {reward !== undefined && card.reward.type !== "DIAMOND_GEM" && (
        <p>
          Reveal to gain +{Math.min(35 - p.courage, reward)} Courage
          {p.courage + reward > 35 ? ` (+${reward} reward, capped at 35)` : ""}.
          Keep all qualifying objects.
        </p>
      )}
      <button
        className="primary"
        disabled={!!reason}
        title={
          reason || "Make this Secret public and claim its one-time reward"
        }
        onClick={() =>
          dispatch({
            type: "REVEAL_SECRET",
            playerId: p.id,
            secretId: id,
            tier,
          })
        }
      >
        Reveal achievement
      </button>
      {reason && evaluation.eligible && (
        <p className="secret-reason">{reason}</p>
      )}
      <small>
        Only you can see this status. Revealing makes the card public.
      </small>
    </section>
  );
}
