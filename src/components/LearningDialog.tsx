"use client";
import { useEffect, useRef, useState } from "react";
import type { State, Command } from "../game/domain/engine";
import { byId } from "../game/cards/catalog";
import {
  automaticLearningPlan,
  learningDiscounts,
  planLearning,
  suggestedPayment,
} from "../game/systems/spells";
import { elementResources, type Element } from "../game/systems/elementPayment";
import { GameIcon } from "./GameIcon";
export function LearningDialog({
  s,
  spell,
  dispatch,
  onClose,
}: {
  s: State;
  spell: string;
  dispatch: (c: Command) => unknown;
  onClose: () => void;
}) {
  const initial = automaticLearningPlan(s, spell),
    ref = useRef<HTMLDialogElement>(null),
    [discount, setDiscount] = useState<Element | undefined>(initial.discount),
    [selected, setSelected] = useState(initial.elementIds);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  let reason = "";
  try {
    planLearning(s, spell, initial.slot, selected, discount);
  } catch (e) {
    reason = (e as Error).message;
  }
  const discounts = learningDiscounts(s, spell).filter(Boolean) as Element[];
  return (
    <dialog
      ref={ref}
      className="learning-dialog"
      aria-label="Choose learning payment"
      onCancel={onClose}
    >
      <h2>Learn {byId[spell].name}</h2>
      <p>
        Printed cost: {byId[spell].learn_elements?.join(" + ")}. Choose physical
        Elements from your board and room. Each selected token is consumed once;
        surplus contributions are lost.
      </p>
      {discounts.length > 0 && (
        <label>
          Grimoire discount{" "}
          <select
            aria-label="Grimoire discount"
            value={discount}
            onChange={(e) => {
              const d = e.target.value as Element;
              setDiscount(d);
              setSelected(suggestedPayment(s, spell, d));
            }}
          >
            {discounts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      )}
      <div className="item-choice-options">
        {elementResources(s).map((t) => (
          <label key={t.id}>
            <input
              type="checkbox"
              checked={selected.includes(t.id)}
              onChange={() =>
                setSelected((old) =>
                  old.includes(t.id)
                    ? old.filter((id) => id !== t.id)
                    : [...old, t.id],
                )
              }
            />
            <GameIcon name={t.element!} />
            {t.element} -{" "}
            {s.players[s.active].inventory.some((x) => x.id === t.id)
              ? "carried"
              : "room"}
          </label>
        ))}
      </div>
      {reason && <p role="status">{reason}</p>}
      <button onClick={onClose}>Cancel</button>{" "}
      <button
        className="primary"
        disabled={!!reason}
        onClick={() => {
          if (
            dispatch({
              type: "LEARN",
              playerId: s.players[s.active].id,
              spellId: spell,
              elementIds: selected,
              discount,
            }) !== false
          )
            onClose();
        }}
      >
        Pay and learn
      </button>
    </dialog>
  );
}
