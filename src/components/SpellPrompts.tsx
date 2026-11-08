"use client";
import { useEffect, useRef } from "react";
import type { State, Command } from "../game/domain/engine";
export function SpellPrompts({
  s,
  dispatch,
}: {
  s: State;
  dispatch: (c: Command) => unknown;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    request = s.spells.consent,
    offer = s.spells.portalOffer;
  useEffect(() => {
    if (!s.privacy && !s.blackMirror.resolution && (request || offer))
      ref.current?.showModal();
    else ref.current?.close();
  }, [s.privacy, s.blackMirror.resolution, request, offer]);
  if (!request && !offer) return null;
  const name = s.players.find(
    (p) => p.id === (request?.hero ?? offer?.owner),
  )!.name;
  return (
    <dialog
      ref={ref}
      className="spell-prompt"
      aria-label={request ? "Teleport invitation" : "Turn-start Portal"}
      onCancel={(e) => e.preventDefault()}
    >
      <h2>{request ? `Pass to ${name}` : `${name}: Portal opportunity`}</h2>
      <p>
        {request
          ? `Only ${name} may accept this journey. Travel with the casting hero to ${request.targets.find((id) => s.rooms[id])}? Sigils have not been spent.`
          : "Place an available Portal token in your current room? No additional Sigils are required."}
      </p>
      <button
        onClick={() =>
          dispatch(
            request
              ? { type: "SPELL_CONSENT", playerId: request.hero, accept: true }
              : { type: "SPELL_PORTAL", playerId: offer!.owner, accept: true },
          )
        }
      >
        {request ? `I am ${name}; accept journey` : "Place Portal"}
      </button>
      <button
        onClick={() =>
          dispatch(
            request
              ? { type: "SPELL_CONSENT", playerId: request.hero, accept: false }
              : { type: "SPELL_PORTAL", playerId: offer!.owner, accept: false },
          )
        }
      >
        {request ? "Decline journey" : "Skip Portal"}
      </button>
    </dialog>
  );
}
