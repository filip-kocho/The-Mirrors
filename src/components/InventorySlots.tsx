import type { State, Token } from "../game/domain/engine";
import { capacities } from "../game/domain/engine";
import { statusOf } from "../game/systems/blackMirrorRuntime";
import { itemActionPlan } from "../game/systems/itemActions";
import { CurseTokenIcon } from "./CurseTokenIcon";
import { GameIcon } from "./GameIcon";
import { TokenIcon } from "./TokenIcon";
import type { ReactNode } from "react";
export function HexlockOverlay({ count = 1 }: { count?: number }) {
  return (
    <span
      className="hexlock-overlay"
      role="img"
      aria-label={count + " Hexlock blocking this slot"}
      title="Hexlock: blocked until removed automatically"
    >
      <CurseTokenIcon type="HEXLOCK" size={42} />
      {count > 1 && <b>{count}</b>}
    </span>
  );
}
export function toolReady(s: State, id?: string) {
  if (!id) return false;
  try {
    itemActionPlan(s, id);
    return true;
  } catch {
    return false;
  }
}
export function InventorySlots({
  s,
  slot,
  tokens,
  icon,
  context,
  onInspect,
  action,
}: {
  s: State;
  slot: "elements" | "mirrors" | "items" | "relics";
  tokens: Token[];
  icon: string;
  context: string;
  onInspect: (t: Token) => void;
  action: (t: Token) => ReactNode;
}) {
  const p = s.players[s.active],
    base = capacities(p.inventory, [], [], s, p.id)[slot],
    locks = statusOf(s, p.id).hexlocks.filter((h) => h.slot === slot),
    usable = Math.max(0, base - locks.length);
  return (
    <>
      {Array.from({ length: Math.max(base, tokens.length) }, (_, i) => {
        const blocked = i >= usable && i < base,
          token = tokens[i];
        return (
          <div
            key={i}
            className={
              "inventory-field" +
              (blocked ? " blocked-field" : "") +
              (i >= base ? " overflow-field" : "")
            }
            data-slot={slot}
            aria-label={
              slot + " slot " + (i + 1) + (blocked ? ": Hexlocked" : "")
            }
          >
            {token ? (
              <TokenIcon
                token={token}
                onInspect={onInspect}
                context={context}
                action={action(token)}
                ready={toolReady(s, token.card)}
              />
            ) : (
              <span className="empty-slot">
                <GameIcon name={icon} />
              </span>
            )}
            {blocked && (
              <HexlockOverlay
                count={
                  i === base - 1 ? Math.max(1, locks.length - base + 1) : 1
                }
              />
            )}
          </div>
        );
      })}
    </>
  );
}
