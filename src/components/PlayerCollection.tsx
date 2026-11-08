import type { State, Token } from "../game/domain/engine";
import { GameIcon } from "./GameIcon";
import { TokenIcon } from "./TokenIcon";
import { evaluateSecretCondition } from "../game/systems/secrets";
import { secretById } from "../game/cards/secrets";

export function PlayerCollection({
  player,
  onInspect,
  state,
}: {
  player: State["players"][number];
  onInspect: (token: Token) => void;
  state?: State;
}) {
  return (
    <div className="player-collection">
      <h3>Companions · {player.companions.length}</h3>
      <div className="collection-icons">
        {player.companions.map((token) => (
          <TokenIcon
            key={token.id}
            token={token}
            onInspect={onInspect}
            context="attached companion"
          />
        ))}
      </div>
      {player.companions.length > 0 && (
        <p className="muted">
          Your Companions follow you. Click a figurine to read its card.
        </p>
      )}
      <h3>Private Secrets · {player.secrets.length}</h3>
      <div className="collection-icons">
        {player.secrets.map((id, i) => (
          <button
            className={`inventory-icon${state && !state.privacy && state.players[state.active].id === player.id && evaluateSecretCondition(secretById[id], player.id, state).eligible ? " secret-eligible" : ""}`}
            key={id}
            aria-label={`Inspect private Secret ${i + 1}`}
            title={`Private Secret ${i + 1}`}
            onClick={() => onInspect({ id, card: id, kind: "Secret" })}
          >
            <GameIcon name="Secret" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlayerSigils({
  player,
  state,
}: {
  player: State["players"][number];
  state?: State;
}) {
  return (
    <div className="sigils-above-knowledge">
      {" "}
      <h3>Mirror Sigils · {player.sigils.length}</h3>
      <div className="player-sigils" aria-label="Your Mirror Sigils">
        {player.sigils.map((color, i) => (
          <span
            key={i}
            title={`${color} Sigil · available for future Spells`}
            aria-label={`${color} Sigil`}
          >
            <GameIcon name={color} />
          </span>
        ))}
      </div>
      {!player.sigils.length && (
        <p className="empty">{state && (state.spells.quick.some(q=>q.owner===player.id)||player.spellSlots.some(id=>id&&state.blackMirror.bindings[id]?.length)) ? "No free Sigils." : "Restore a fragment to gain its Sigil."}</p>
      )}
    </div>
  );
}
