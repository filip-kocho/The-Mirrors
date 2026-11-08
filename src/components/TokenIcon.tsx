import { byId } from "../game/cards/catalog";
import type { Token } from "../game/domain/engine";
import { GameIcon } from "./GameIcon";
import { CompanionFigurine } from "./CompanionFigurine";
import type { ReactNode } from "react";
export const tokenLabel = (t: Token) =>
  t.kind === "Black Mirror"
    ? "Black Mirror"
    : (t.element ?? byId[t.card!]?.name ?? t.kind);
export function TokenIcon({
  token,
  onInspect,
  context = "",
  action,
  ready = false,
}: {
  token: Token;
  onInspect: (token: Token) => void;
  context?: string;
  action?: ReactNode;
  ready?: boolean;
}) {
  const label = tokenLabel(token);
  const name =
    token.element ??
    (token.kind === "Item" ? byId[token.card!]?.subtype : token.kind) ??
    token.kind;
  const icon = (
    <button
      className={`inventory-icon${ready ? " item-ready" : ""}`}
      aria-label={`Inspect ${label}${context ? ` · ${context}` : ""}`}
      title={label + (token.linkedGroupId ? " - Linked Ghost Twins" : "")}
      onClick={() => onInspect(token)}
    >
      {token.linkedGroupId && (
        <span className="twin-link" aria-label="Linked Ghost Twins">
          &#8734;
        </span>
      )}
      {token.kind === "Companion" && token.card ? (
        <svg
          className="game-icon companion-miniature"
          viewBox="-20 -28 40 50"
          aria-hidden="true"
        >
          <CompanionFigurine cardId={token.card} />
        </svg>
      ) : (
        <GameIcon name={name} />
      )}
    </button>
  );
  return action ? (
    <div className="object-control">
      {icon}
      <div className="object-action">{action}</div>
    </div>
  ) : (
    icon
  );
}
