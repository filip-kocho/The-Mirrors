import type { State, Token } from "../game/domain/engine";
import { byId } from "../game/cards/catalog";
import { GameIcon } from "./GameIcon";

export function CompletedSecrets({
  s,
  onInspect,
}: {
  s: State;
  onInspect: (token: Token) => void;
}) {
  return (
    <section
      className="panel completed-secrets"
      aria-label="Public completed Secrets"
    >
      <h3>Revealed achievements</h3>
      {s.players.map((p) => (
        <div key={p.id} className="completed-secret-hero">
          <h4>
            {p.name} · {p.completedSecrets.length}
          </h4>
          <div className="completed-secret-cards">
            {p.completedSecrets.map((c) => (
              <button
                key={c.id}
                className="completed-secret-card"
                aria-label={`Inspect ${p.name}'s completed ${byId[c.id].name}`}
                onClick={() =>
                  onInspect({ id: c.id, card: c.id, kind: "Secret" })
                }
              >
                <GameIcon name="Secret" />
                <span>
                  {byId[c.id].name}
                  <small>{c.rewardType==="DIAMOND_GEM"?"1 Diamond Gem":"+"+c.gained+" Courage"} · completed</small>
                </span>
              </button>
            ))}
            {!p.completedSecrets.length && (
              <small>No achievements revealed yet.</small>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
