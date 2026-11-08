"use client";
import { useEffect, useRef, useState } from "react";
import type { State } from "../game/domain/engine";
export function SignaturePanel({ s }: { s: State }) {
  const ref = useRef<HTMLDialogElement>(null),
    [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (s.outcome !== "playing" && !dismissed) ref.current?.showModal();
    else ref.current?.close();
  }, [s.outcome, dismissed]);
  if (s.outcome === "playing") return null;
  const ranked = [...s.players].sort(
    (a, b) =>
      Number(a.dead) - Number(b.dead) ||
      b.courage - a.courage ||
      b.restored - a.restored,
  );
  const best = ranked.find((p) => !p.dead),
    winners =
      s.outcome === "victory" && best
        ? ranked.filter(
            (p) =>
              !p.dead &&
              p.courage === best.courage &&
              p.restored === best.restored,
          )
        : [];
  return (
    <>
      <section className="panel ending">
        <h2>
          {s.outcome === "victory"
            ? "The prison is restored."
            : "Occuldor claims the castle."}
        </h2>
        <button onClick={() => setDismissed(false)}>View results</button>
      </section>
      <dialog
        ref={ref}
        className="results-dialog"
        aria-labelledby="results-title"
        onCancel={() => setDismissed(true)}
      >
        <p className="eyebrow">The final reflection</p>
        <h1 id="results-title">
          {s.outcome === "defeat"
            ? "Winner: Occuldor"
            : winners.length
              ? `${winners.length > 1 ? "Winners" : "Winner"}: ${winners.map((p) => p.name).join(" & ")}`
              : "The castle is saved. No hero survived."}
        </h1>
        <p>
          {s.outcome === "victory"
            ? "The completed Kaleidoscope imprisons Occuldor once more."
            : "Every adventurer has fallen. Occuldor remains free."}{" "}
          {s.mosaic.filter(Boolean).length}/35 fragments restored.
        </p>
        {winners.length > 0 && (
          <p>
            {winners.map((p) => p.name).join(" & ")}{" "}
            {winners.length === 1
              ? "is the most heroic surviving adventurer."
              : "are the most heroic surviving adventurers."}
          </p>
        )}
        <table>
          <thead>
            <tr>
              <th>Hero</th>
              <th>Courage</th>
              <th>Restored</th>
              <th>Sigils</th>
              <th>Secrets achieved</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p) => (
              <tr key={p.id}>
                <th>
                  {p.name}
                  {p.dead
                    ? " - Fallen"
                    : winners.includes(p)
                      ? " - Winner"
                      : ""}
                </th>
                <td>{p.courage}</td>
                <td>{p.restored}</td>
                <td>
                  {p.sigils.length +
                    s.spells.quick
                      .filter((q) => q.owner === p.id)
                      .reduce((n, q) => n + q.sigils.length, 0) +
                    p.spellSlots.reduce(
                      (n, id) =>
                        n +
                        (id ? (s.blackMirror.bindings[id]?.length ?? 0) : 0),
                      0,
                    )}
                </td>
                <td>{p.completedSecrets.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Surviving heroes rank by Courage, then personal restorations. Equal
          scores share victory.
        </p>
        <button onClick={() => setDismissed(true)}>Return to the castle</button>
      </dialog>
    </>
  );
}
