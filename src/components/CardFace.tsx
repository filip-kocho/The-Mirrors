import { itemById } from "../game/cards/items";
import { whiteMirrorHaiku } from "../game/cards/whiteMirrorHaiku";
import { secretById, secretRewardText } from "../game/cards/secrets";
import { prerequisiteTool } from "../game/cards/toolPrerequisites";
import { CurseTokenIcon } from "./CurseTokenIcon";
import type { CSSProperties, ReactNode } from "react";
import type { Card } from "../game/cards/catalog";
import { GameIcon } from "./GameIcon";
import type { State } from "../game/domain/engine";
import { spellSeals } from "../game/systems/blackMirrorRuntime";

const sigils: Record<string, { color: string; glyph: string }> = {
  Scarlet: { color: "#f57579", glyph: "◆" },
  Emerald: { color: "#72d8ae", glyph: "✳" },
  Amber: { color: "#f2c76e", glyph: "☀" },
  Fuchsia: { color: "#e08bce", glyph: "✿" },
  Amethyst: { color: "#b29afa", glyph: "✦" },
};

/** A readable card face; surrounding UI decides when its contents may be shown. */
export function CardFace({
  card,
  action,
  state,
  controls,
  spellActions,
}: {
  card: Card;
  action?: ReactNode;
  state?: State;
  controls?: ReactNode;
  spellActions?: ReactNode;
}) {
  return (
    <article
      className={`game-card card-${card.family.toLowerCase().replaceAll(" ", "-")}`}
      aria-label={`${card.name} card`}
    >
      {card.learn_elements && (
        <section className="spell-learning-corner" aria-label="Learning cost">
          <h3>Learning cost</h3>
          <div className="card-sockets learning-cost">
            {card.learn_elements.map((element, i) => (
              <span key={i} aria-label={element} title={element}>
                <GameIcon name={element} />
                <small aria-hidden="true">{element}</small>
              </span>
            ))}
          </div>
          {typeof card.tool_requirement === "string" && (
            <p className="card-tool">
              Tool:{" "}
              {prerequisiteTool(card.tool_requirement)?.name ??
                card.tool_requirement}{" "}
              {prerequisiteTool(card.tool_requirement)?.id}
            </p>
          )}
        </section>
      )}

      <div className="card-family-line">
        <span>{card.family}</span>
        <span>{card.id}</span>
        {action}
      </div>
      <div className="card-title">
        <h2>{card.name}</h2>
      </div>
      <div className="card-illustration" aria-hidden="true">
        <span className="card-halo" />
        <GameIcon name={card.family === "Item" ? card.subtype : card.family} />
        <span className="card-art-ornament">✧</span>
      </div>
      <div className="card-type-ribbon">
        {card.family === "Secret"
          ? "Secret achievement"
          : card.subtype || card.family}
      </div>
      <div className="card-rules">
        {card.family === "White Mirror" && card.slots && (
          <section className="card-discoveries" aria-label="Discoveries">
            <div className="card-sockets">
              {card.slots
                .filter((slot) => slot !== "Empty")
                .map((slot, i) => (
                  <span key={i} aria-label={slot} title={slot}>
                    <GameIcon name={slot} />
                    <small aria-hidden="true">{slot}</small>
                  </span>
                ))}
            </div>
          </section>
        )}
        {card.family === "White Mirror" && (
          <p className="mirror-haiku">
            {whiteMirrorHaiku[card.id]?.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        )}
        {card.effect && card.family !== "White Mirror" && (
          <section className="card-effect">
            <h3>
              {card.family === "Black Mirror"
                ? "Personal curse"
                : card.family === "Secret"
                  ? "Achievement"
                  : "Ability"}
            </h3>
            <p>{card.effect}</p>
          </section>
        )}
        {card.family === "Item" && (
          <section className="card-item-details">
            <h3>{itemById[card.id].timing}</h3>
          </section>
        )}
        {card.family === "Secret" && secretById[card.id] && (
          <section className="secret-reward">
            <h3>One-time reward</h3>
            <strong>{secretRewardText(secretById[card.id])}</strong>
            <p>Your qualifying resources are not consumed.</p>
          </section>
        )}
        {controls}
        {card.family === "Companion" && typeof card.conflict === "string" && (
          <section>
            <h3>Conflict</h3>
            <p>{card.conflict}</p>
          </section>
        )}
        {spellActions ??
          card.casting_modes?.map((mode, index) => (
            <section className="card-casting-mode" key={mode.name}>
              <h3>{mode.name}</h3>
              {state && spellSeals(state, card.id, index).length > 0 && (
                <p className="sealed-action">
                  <CurseTokenIcon type="SIGIL_SEAL" size={24} />
                  Sealed ×{spellSeals(state, card.id, index).length} — action
                  suppressed
                </p>
              )}
              <div
                className="card-sigil-sockets"
                aria-label={`${mode.name} Sigil requirements`}
              >
                {mode.sigil_slots.map((color, i) => (
                  <span
                    key={i}
                    title={color}
                    aria-label={color}
                    style={
                      { "--sigil-color": sigils[color].color } as CSSProperties
                    }
                  >
                    <GameIcon name={color} />
                  </span>
                ))}
              </div>
              <p>{mode.effect}</p>
              <small>{mode.assignment}</small>
            </section>
          ))}
      </div>
      <div className="card-imprint">
        <span>THE MIRRORS</span>
        <span>✧</span>
        <span>{card.id}</span>
      </div>
    </article>
  );
}
