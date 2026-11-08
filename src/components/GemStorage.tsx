"use client";
import { useState } from "react";
import type { State, Command } from "../game/domain/engine";
import {
  magicPlan,
  storedGems,
  type MagicCommand,
} from "../game/systems/magicResources";
import { GameIcon } from "./GameIcon";
export function MagicButton({
  s,
  command,
  dispatch,
  children,
}: {
  s: State;
  command: MagicCommand;
  dispatch: (c: Command) => unknown;
  children: React.ReactNode;
}) {
  let reason = "";
  try {
    magicPlan(s, command);
  } catch (e) {
    reason = (e as Error).message;
  }
  return (
    <button
      disabled={!!reason}
      title={reason}
      onClick={() => dispatch(command)}
    >
      {children}
    </button>
  );
}
export function GemStorage({
  s,
  dispatch,
  openPuzzle,
}: {
  s: State;
  dispatch: (c: Command) => unknown;
  openPuzzle: () => void;
}) {
  const p = s.players[s.active],
    gems = storedGems(s),
    [selected, setSelected] = useState<string | null>(null),
    g = gems.find((g) => g.id === selected);
  const command = (
    action: MagicCommand["action"],
    resource: string,
    target?: string,
  ): MagicCommand => ({
    type: "MAGIC",
    playerId: p.id,
    action,
    resource,
    target,
  });
  return (
    <section className="gem-storage" aria-label="Diamond Gem storage">
      <h3>
        Diamond Gems {gems.length}/{s.rules.gemPolicies.capacity}
      </h3>
      {gems.map((g) => (
        <button
          key={g.id}
          aria-label={`Inspect ${g.id} ${g.exhausted ? "exhausted" : "ready"}`}
          onClick={() => setSelected(selected === g.id ? null : g.id)}
        >
          <GameIcon name="Diamond" />
          {g.exhausted ? "Exhausted" : "Ready"}
        </button>
      ))}
      {!gems.length && (
        <p className="muted">Complete a Diamond Challenge to earn a Gem.</p>
      )}
      {g && (
        <div className="gem-actions">
          <strong>{g.id}</strong>
          <MagicButton
            s={s}
            command={command("BREAK_PARALYSIS", g.id)}
            dispatch={dispatch}
          >
            Break Paralysis
          </MagicButton>
          {(
            s.blackMirror.heroes[p.id]?.hexlocks.filter(
              (h) => h.slot !== "knowledge",
            ) ?? []
          ).map((h) => (
            <MagicButton
              key={h.id}
              s={s}
              command={command("REMOVE_HEXLOCK", g.id, h.id)}
              dispatch={dispatch}
            >
              Remove Hexlock: {h.slot}
            </MagicButton>
          ))}
          {!s.blackMirror.heroes[p.id]?.hexlocks.some(
            (h) => h.slot !== "knowledge",
          ) && <button disabled>Remove Hexlock</button>}
          {s.blackMirror.thresholds
            .filter(
              (edge) =>
                !s.rules.gemPolicies.adjacentPassageOnly ||
                edge.split("~").includes(p.room),
            )
            .map((edge) => (
              <MagicButton
                key={edge}
                s={s}
                command={command("PASSAGE", g.id, edge)}
                dispatch={dispatch}
              >
                Magical Passage: {edge}
              </MagicButton>
            ))}
          {!s.blackMirror.thresholds.some(
            (edge) =>
              !s.rules.gemPolicies.adjacentPassageOnly ||
              edge.split("~").includes(p.room),
          ) && <button disabled>Magical Passage</button>}
          <MagicButton
            s={s}
            command={command("SWIFT", g.id)}
            dispatch={dispatch}
          >
            Swift Movement +1
          </MagicButton>
          <MagicButton
            s={s}
            command={command("LEAVE", g.id)}
            dispatch={dispatch}
          >
            Leave Gem in room
          </MagicButton>
          {s.rules.gemPolicies.directTransfer &&
            s.players
              .filter((h) => h.id !== p.id && h.room === p.room)
              .map((h) => (
                <MagicButton
                  key={h.id}
                  s={s}
                  command={command("GIVE", g.id, h.id)}
                  dispatch={dispatch}
                >
                  Give to {h.name}
                </MagicButton>
              ))}
        </div>
      )}
      <button onClick={openPuzzle}>Open Kaleidoscope for installation</button>
    </section>
  );
}
export function RoomGems({
  s,
  room,
  dispatch,
}: {
  s: State;
  room: string;
  dispatch: (c: Command) => unknown;
}) {
  return (
    <div className="room-gems">
      {s.magic.gems
        .filter((g) => g.location === "ROOM" && g.room === room)
        .map((g) => (
          <MagicButton
            key={g.id}
            s={s}
            dispatch={dispatch}
            command={{
              type: "MAGIC",
              playerId: s.players[s.active].id,
              action: "TAKE",
              resource: g.id,
            }}
          >
            <GameIcon name="Diamond" />
            Collect {g.id} ({g.exhausted ? "exhausted" : "ready"})
          </MagicButton>
        ))}
    </div>
  );
}
