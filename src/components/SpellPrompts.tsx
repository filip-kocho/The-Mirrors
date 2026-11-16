"use client";
import { useEffect, useRef, useState } from "react";
import { SpellTargets } from "./SpellTargets";
import type { State, Command } from "../game/domain/engine";
export function SpellPrompts({
  s,
  dispatch,
}: {
  s: State;
  dispatch: (c: Command) => unknown;
}) {
  const [destination, setDestination] = useState<string[]>([]);
  const ref = useRef<HTMLDialogElement>(null),
    request = s.spells.consent,
    offer = s.spells.portalOffer;
  useEffect(() => {
    if (!s.privacy && !s.blackMirror.resolution && (request || offer))
      ref.current?.showModal();
    else ref.current?.close();
  }, [s.privacy, s.blackMirror.resolution, request, offer]);
  useEffect(() => {
    setDestination([]);
  }, [offer?.turn, offer?.owner]);
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
          : "Place a matching Portal pair in your current room and another room without a Portal. No additional Sigils are required."}
      </p>
      {offer && (
        <SpellTargets
          s={s}
          choices={Object.values(s.rooms)
            .filter(
              (r) =>
                r.id !== "Hall" &&
                r.id !== s.players[s.active].room &&
                !s.blackMirror.rooms[r.id]?.portal,
            )
            .map((r) => ({ id: r.id, label: r.id, room: r.id, group: "room" }))}
          selected={destination}
          max={1}
          onChange={setDestination}
        />
      )}
      <button
        disabled={!!offer && !destination.length}
        onClick={() =>
          dispatch(
            request
              ? { type: "SPELL_CONSENT", playerId: request.hero, accept: true }
              : {
                  type: "SPELL_PORTAL",
                  playerId: offer!.owner,
                  accept: true,
                  roomId: destination[0],
                },
          )
        }
      >
        {request ? `I am ${name}; accept journey` : "Place Portal pair"}
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
