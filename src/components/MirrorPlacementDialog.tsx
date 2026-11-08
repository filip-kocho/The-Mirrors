"use client";
import { useEffect, useRef, useState } from "react";
import type { Command, State } from "../game/domain/engine";
import { GameIcon } from "./GameIcon";
import { CardFace } from "./CardFace";
import { byId } from "../game/cards/catalog";
import { occuldorArrivalLoss } from "../game/rules/gameRulesConfig";
export function MirrorPlacementDialog({
  s,
  dispatch,
  onClose,
  error,
  roomId,
}: {
  s: State;
  dispatch: (command: Command) => boolean;
  onClose: () => void;
  error: string;
  roomId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [whiteId, setWhiteId] = useState(""),
    [blackId, setBlackId] = useState("");
  const player = s.players[s.active],
    room = s.rooms[roomId ?? player.room];
  const options = [
    ...player.inventory.map((token) => ({ token, source: "Your hand" })),
    ...room.objects.map((token) => ({ token, source: `Room ${room.id}` })),
  ];
  useEffect(() => {
    const dialog = ref.current,
      opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  const loss = occuldorArrivalLoss(s.rage, s.rules);
  return (
    <dialog
      ref={ref}
      className="mirror-placement-dialog"
      aria-labelledby="mirror-placement-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="mirror-placement-heading">
        <div>
          <p className="eyebrow">Mirror pair · {room.id}</p>
          <h2 id="mirror-placement-title">Place</h2>
        </div>
        <button onClick={onClose}>Cancel</button>
      </div>
      <p>
        Choose one White Mirror and one Black Mirror. Combine cards from your
        hand and this room in any mix. Both Mirror cards may be inspected before
        choosing. Reading a Black Mirror does not activate its curse.
      </p>
      <div className="mirror-choices">
        {(["White Mirror", "Black Mirror"] as const).map((kind) => (
          <fieldset key={kind}>
            <legend>
              <GameIcon name={kind} />
              {kind}
            </legend>
            <div className="mirror-choice-icons">
              {!options.some(({ token }) => token.kind === kind) && (
                <p>
                  No {kind} in your hand or this room. Find one before placing a
                  pair.
                </p>
              )}
              {options
                .filter(({ token }) => token.kind === kind)
                .map(({ token, source }, index) => (
                  <label className="mirror-choice" key={token.id}>
                    <div className="choice-source">
                      <input
                        type="radio"
                        name={kind}
                        aria-label={`Choose ${kind === "Black Mirror" ? `Black Mirror ${index + 1}` : token.id} from ${source}`}
                        checked={
                          (kind === "White Mirror" ? whiteId : blackId) ===
                          token.id
                        }
                        onChange={() =>
                          kind === "White Mirror"
                            ? setWhiteId(token.id)
                            : setBlackId(token.id)
                        }
                      />
                      <span>{source}</span>
                    </div>
                    <GameIcon name={token.kind} />
                    <small>{token.id}</small>
                  </label>
                ))}
            </div>
            {(kind === "White Mirror" ? whiteId : blackId) && (
              <CardFace
                card={byId[kind === "White Mirror" ? whiteId : blackId]}
              />
            )}
          </fieldset>
        ))}
      </div>
      <p className="mirror-placement-consequence">
        All White Mirror discoveries will appear. Occuldor will stand on the
        Black Mirror and free his previous mirror. Each living hero here loses{" "}
        {loss} Courage on arrival at Rage {s.rage}, regardless of Sigil color.
        Once Occuldor leaves, a hero here may Collide: flip the Black Mirror,
        resolve its curse and restore the fragment.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="mirror-placement-confirm">
        <span>
          {whiteId || "Choose White"} +{" "}
          {blackId ? "Black Mirror selected" : "Choose Black"}
        </span>
        <button
          className="primary"
          disabled={!whiteId || !blackId}
          onClick={() => {
            if (
              dispatch({
                type: "PLACE_MIRRORS",
                roomId: room.id,
                playerId: player.id,
                whiteId,
                blackId,
              })
            )
              onClose();
          }}
        >
          Confirm placement
        </button>
      </div>
    </dialog>
  );
}
