"use client";
import { useState } from "react";
import type { State, Command } from "../game/domain/engine";
import { remoteMirrorAllowed } from "../game/systems/mirrorPlacement";
import { MirrorPlacementDialog } from "./MirrorPlacementDialog";
export function RemoteMirrorControls({
  s,
  roomId,
  dispatch,
}: {
  s: State;
  roomId: string;
  dispatch: (c: Command) => boolean;
}) {
  const [white, setWhite] = useState("");
  const [open, setOpen] = useState(false),
    p = s.players[s.active],
    room = s.rooms[roomId];
  if (
    roomId === p.room ||
    !remoteMirrorAllowed(s, roomId) ||
    roomId === "Hall" ||
    room.restored
  )
    return null;
  const pairReady = ["White Mirror", "Black Mirror"].every((kind) =>
    [...p.inventory, ...room.objects].some((t) => t.kind === kind),
  );
  return (
    <div className="remote-mirrors">
      <strong>Remote Mirror actions</strong>
      {!room.pair.length && (
        <label>
          White Mirror{" "}
          <select
            aria-label="Remote White Mirror"
            value={white}
            onChange={(e) => setWhite(e.target.value)}
          >
            <option value="">Choose carried Mirror</option>
            {p.inventory
              .filter((t) => t.kind === "White Mirror")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}
                </option>
              ))}
          </select>
          <button
            disabled={!white || !!s.pending}
            onClick={() =>
              dispatch({
                type: "PLACE_WHITE",
                playerId: p.id,
                roomId,
                whiteId: white,
              })
            }
          >
            Place White Mirror
          </button>
        </label>
      )}
      {!room.pair.length && (
        <button
          disabled={!pairReady || !!s.pending}
          onClick={() => setOpen(true)}
        >
          Place remotely
        </button>
      )}
      {room.pair.length === 2 && (
        <button
          disabled={
            !remoteMirrorAllowed(s, roomId, true) ||
            s.occuldor === roomId ||
            !!s.pending
          }
          onClick={() => dispatch({ type: "COLLIDE", playerId: p.id, roomId })}
        >
          Collide remotely
        </button>
      )}
      {open && (
        <MirrorPlacementDialog
          s={s}
          roomId={roomId}
          dispatch={dispatch}
          onClose={() => setOpen(false)}
          error=""
        />
      )}
    </div>
  );
}
