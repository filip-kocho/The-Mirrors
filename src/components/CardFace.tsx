import { SpellModeIcon } from "./SpellModeIcon";
import { CompanionRelationshipIcon } from "./CompanionRelationshipIcon";
import { companionById } from "../game/cards/companions";
import { companionLocations } from "../game/systems/companions";
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
    <>
      <article
        className={`game-card card-${card.family.toLowerCase().replaceAll(" ", "-")}`}
        aria-label={`${card.name} card`}
      >
        <div className="card-family-line">
          <span>
            {!card.family.endsWith("Mirror") && card.family !== card.name
              ? card.family
              : ""}
          </span>
          <span>{card.id}</span>
          {action}
        </div>
        <div className="card-title">
          {card.learn_elements && (
            <section
              className="spell-learning-corner"
              aria-label="Learning cost"
            >
              <div className="card-sockets learning-cost">
                {card.learn_elements.map((element, i) => (
                  <span key={i} aria-label={element} title={element}>
                    <GameIcon name={element} />
                  </span>
                ))}
              </div>
            </section>
          )}
          <h2>{card.name}</h2>
        </div>
        <div className="card-illustration" aria-hidden="true">
          {card.family === "Companion" ? (
            <span
              className="companion-portrait"
              style={{
                backgroundPosition: `${((Number(card.id.slice(3)) - 1) % 5) * 25}% ${Number(card.id.slice(3)) > 5 ? 100 : 0}%`,
              }}
            />
          ) : card.family === "Item" ? (
            <span
              className="item-portrait"
              data-item-art={card.id}
              style={{
                backgroundPosition: `${((Number(card.id.slice(3)) - 1) % 5) * 25}% ${Math.floor((Number(card.id.slice(3)) - 1) / 5) * 25}%`,
              }}
            />
          ) : card.family === "Spell" ? (
            <span
              className="spell-portrait"
              data-spell-art={card.id}
              style={{
                backgroundPosition: `${(((Number(card.id.slice(3)) - 1) % 7) * 100) / 6}% ${Math.floor((Number(card.id.slice(3)) - 1) / 7) * 25}%`,
              }}
            />
          ) : card.family === "Secret" ? (
            <span
              className="secret-portrait"
              data-secret-art={card.id}
              style={{
                backgroundPosition: `${((Number(card.id.slice(3)) - 1) % 5) * 25}% ${Math.floor((Number(card.id.slice(3)) - 1) / 5) * 50}%`,
              }}
            />
          ) : (
            <span
              className="mirror-portrait"
              data-mirror-art={
                card.family === "White Mirror" ? "white" : "black"
              }
            />
          )}
          <span className="card-art-ornament">✧</span>
        </div>
        <div className="card-type-ribbon">
          {card.family.endsWith("Mirror")
            ? card.family
            : card.family === "Secret"
              ? card.subtype === "DIAMOND_CHALLENGE"
                ? "Diamond Challenge"
                : "Heroic Achievement"
              : card.subtype || card.family}
        </div>
        <div
          className="card-rules"
          role="region"
          aria-label={`${card.name} rules`}
        >
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
          {card.effect && !["White Mirror", "Spell"].includes(card.family) && (
            <section className="card-effect">
              <h3>
                {card.family === "Black Mirror"
                  ? "Personal curse"
                  : card.family === "Secret"
                    ? "Achievement"
                    : card.family === "Companion"
                      ? "Ability"
                      : "Ability"}
              </h3>
              <p>{card.effect}</p>
            </section>
          )}
          {card.family === "Secret" && secretById[card.id] && (
            <section className="secret-reward">
              <h3>One-time reward</h3>
              <strong>{secretRewardText(secretById[card.id])}</strong>
            </section>
          )}
          {card.family !== "Secret" && controls}
          {card.family === "Companion" &&
            companionById[card.id] &&
            (() => {
              const definition = companionById[card.id];
              const location =
                state &&
                companionLocations(state).find((x) => x.token.card === card.id);
              const linked = location?.token.linkedGroupId;
              const reunionPending =
                state &&
                location &&
                ["CO-05", "CO-06"].includes(card.id) &&
                companionLocations(state).filter(
                  (x) =>
                    x.room === location.room &&
                    ["CO-05", "CO-06"].includes(x.token.card!),
                ).length === 2;
              return (
                <section
                  className="companion-characteristics"
                  aria-label="Companion characteristics"
                >
                  <h3>
                    {linked ? "STRAY" : definition.movementType} /{" "}
                    {definition.followingType}
                  </h3>
                  {linked && <p>Linked Ghost Twins: always travel together</p>}
                  {!linked && reunionPending && (
                    <p>
                      Reunion pending: first departing hero claims both Twins
                    </p>
                  )}
                  {(
                    ["dreadIds", "huntIds", "predatorIds", "preyIds"] as const
                  ).map((key, i) => (
                    <p key={key}>
                      <strong>
                        <CompanionRelationshipIcon kind={i} />(
                        {["Dread", "Hunt", "Predator", "Prey"][i]}):{" "}
                      </strong>
                      {definition[key]
                        .map((id) => companionById[id].name)
                        .join(", ") || "None"}
                    </p>
                  ))}
                </section>
              );
            })()}
          {card.family === "Spell" &&
            typeof card.tool_requirement === "string" && (
              <p className="card-tool">
                Tool:{" "}
                {prerequisiteTool(card.tool_requirement)?.name ??
                  card.tool_requirement}{" "}
                {prerequisiteTool(card.tool_requirement)?.id}
              </p>
            )}
          {spellActions ??
            card.casting_modes?.map((mode, index) => (
              <section
                className={"card-casting-mode mode-" + mode.name.toLowerCase()}
                key={mode.name}
              >
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
                  <SpellModeIcon name={mode.name} />
                  {mode.sigil_slots.map((color, i) => (
                    <span
                      key={i}
                      title={color}
                      aria-label={color}
                      style={
                        {
                          "--sigil-color": sigils[color].color,
                        } as CSSProperties
                      }
                    >
                      <GameIcon name={color} />
                    </span>
                  ))}
                </div>
                <p>{mode.effect}</p>
              </section>
            ))}
        </div>
        {card.family === "Item" && (
          <div className="card-item-timing">{itemById[card.id].timing}</div>
        )}
      </article>
      {card.family === "Secret" && controls && (
        <aside className="card-reference" aria-label="Achievement status">
          {controls}
        </aside>
      )}
    </>
  );
}
