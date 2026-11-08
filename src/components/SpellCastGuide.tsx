import { spellActivationPlan } from "../game/systems/spellActivation";
import { activePermanent } from "../game/systems/spellModifiers";
import { CurseTokenIcon } from "./CurseTokenIcon";
import { byId } from "../game/cards/catalog";
import { GameIcon } from "./GameIcon";
import type { State } from "../game/domain/engine";
import { spellSeals } from "../game/systems/blackMirrorRuntime";

function readiness(s: State, id: string, index: number) {
  if (index === 1 && s.blackMirror.bindings[id]?.length)
    return activePermanent(s, s.players[s.active].id, id)
      ? "Active"
      : "Suppressed";
  if (
    s.spells.quick.some(
      (q) =>
        q.owner === s.players[s.active].id &&
        q.spell === id &&
        q.action === index,
    )
  )
    return "Awaiting return";
  try {
    spellActivationPlan(s, id, index);
    return "Ready";
  } catch {
    return "Unavailable";
  }
}
export function SpellCastGuide({ spellId, s }: { spellId: string; s?: State }) {
  const card = byId[spellId];
  return (
    <div className="spell-cast-guide" aria-label={`${card.name} casting guide`}>
      {card.casting_modes?.map((mode, index) => (
        <div
          key={mode.name}
          title={`${mode.name}: ${mode.sigil_slots.join(" + ")}. ${mode.assignment}`}
        >
          <small
            className={
              s && readiness(s, spellId, index) === "Ready"
                ? index === 0
                  ? "quick-ready"
                  : "permanent-ready"
                : ""
            }
          >
            {mode.name}
            {s && readiness(s, spellId, index) === "Active" ? " ? active" : ""}
          </small>
          {s && spellSeals(s, spellId, index).length > 0 && (
            <small className="sealed-action">
              <CurseTokenIcon type="SIGIL_SEAL" size={20} />
              Sealed ×{spellSeals(s, spellId, index).length}
              {mode.name.toUpperCase() === "PERMANENT" ? " · suppressed" : ""}
            </small>
          )}
          <div
            className="guide-sigils"
            aria-label={`${mode.name} Sigil requirements`}
          >
            {mode.sigil_slots.map((color, i) => (
              <span
                key={i}
                className={
                  s &&
                  (index === 1
                    ? (s.blackMirror.bindings[spellId]?.length ?? 0) > i
                    : s.spells.quick
                        .filter(
                          (q) =>
                            q.owner === s.players[s.active].id &&
                            q.spell === spellId &&
                            q.action === index,
                        )
                        .flatMap((q) => q.sigils)
                        .filter((t) => t.color === color).length >=
                      mode.sigil_slots
                        .slice(0, i + 1)
                        .filter((c) => c === color).length)
                    ? "guide-sigil used"
                    : "guide-sigil"
                }
                title={s ? readiness(s, spellId, index) : color}
              >
                <GameIcon name={color} />
              </span>
            ))}
          </div>
        </div>
      ))}
      <small className="guide-note">
        {card.id} ? {card.name} ? {card.subtype}
      </small>
    </div>
  );
}
