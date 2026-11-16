import type { State } from "../domain/engine";
import { byId } from "../cards/catalog";
import { roomGraph } from "../map/roomGraph";
import { connectionId } from "../map/castleConnections";
import { isImmobilized, mutableStatus, statusOf, event } from "./blackMirrorRuntime";
import { roomActionsBlocked } from "./spellModifiers";

export const hasCompanion = (s: State, owner: string, card: string) =>
  !!s.players
    .find((p) => p.id === owner && !p.dead)
    ?.companions.some((t) => t.card === card);
export function companionActionPlan(s: State, card: string) {
  const p = s.players[s.active];
  if (
    !hasCompanion(s, p.id, card) ||
    s.privacy ||
    s.outcome !== "playing" ||
    s.pending ||
    s.blackMirror.resolution ||
    s.spells.consent ||
    s.spells.portalOffer ||
    roomActionsBlocked(s, p.room)
  )
    throw Error(
      "Only your attached Companion can act during your action window.",
    );
  const limited = ["CO-04", "CO-07", "CO-08"].includes(card);
  if (limited && s.spells.usage["companion:" + card] === s.items.round)
    throw Error("This Companion has already used its ability this round.");
  const st = statusOf(s, p.id);
  let options: { id: string; label: string; group?: string; room?: string }[] =
    [];
  let max = 1;
  if (card === "CO-04") {
    if (s.moved || isImmobilized(s, p.id))
      throw Error("Use this ability before movement.");
    options = roomGraph[p.room].neighbors
      .filter((id) =>
        s.blackMirror.thresholds.includes(connectionId(p.room, id)),
      )
      .map((id) => ({ id: connectionId(p.room, id), label: "Cross to " + id }));
  } else if (card === "CO-07") {
    options = [
      ...st.fear.map((t) => ({ id: t.id, label: "Fear" })),
      ...st.paralysis.map((id) => ({ id, label: "Paralysis" })),
    ];
  } else if (card === "CO-08") {
    options = st.hexlocks.map((t) => ({
      id: t.id,
      label: t.slot + " Hexlock",
    }));
  } else if (["CO-05", "CO-06", "CO-09"].includes(card)) {
    options = Object.values(s.rooms)
      .filter(
        (r) =>
          r.id !== p.room &&
          (card === "CO-09"
            ? r.explored
            : roomGraph[p.room].neighbors.includes(r.id)),
      )
      .flatMap((r) =>
        r.objects
          .filter((t) =>
            card === "CO-09"
              ? ["Item", "Element"].includes(t.kind)
              : t.kind === (card === "CO-05" ? "White Mirror" : "Black Mirror"),
          )
          .map((t) => ({
            id: t.id,
            label: (t.element ?? byId[t.card!]?.name ?? t.kind) + " in " + r.id,
            group: t.kind,
            room: r.id,
          })),
      );
    if (card === "CO-09") max = 2;
  } else throw Error("This Companion's ability is passive.");
  if (!options.length) throw Error("No eligible targets for this Companion.");
  return { options, min: 1, max, limited };
}
export function useCompanion(s: State, card: string, ids: string[]) {
  const plan = companionActionPlan(s, card),
    p = s.players[s.active];
  const choices = ids.map((id) => plan.options.find((o) => o.id === id));
  if (
    new Set(ids).size !== ids.length ||
    ids.length < 1 ||
    ids.length > plan.max ||
    choices.some((c) => !c)
  )
    throw Error("Choose eligible Companion targets.");
  if (
    card === "CO-09" &&
    (new Set(choices.map((c) => c!.room)).size !== 1 ||
      (ids.length === 2 && choices.some((c) => c!.group !== "Element")))
  )
    throw Error(
      "Choose one Item or up to two Elements from one discovered room.",
    );
  if (plan.limited) s.spells.usage["companion:" + card] = s.items.round;
  const st = mutableStatus(s, p.id);
  if (card === "CO-04")
    s.spells.usage["companion-passage:" + p.id + ":" + ids[0]] = s.turn;
  else if (card === "CO-07") {
    st.fear = st.fear.filter((t) => !ids.includes(t.id));
    const removed = st.paralysis.some((id) => ids.includes(id));
    st.paralysis = st.paralysis.filter((id) => !ids.includes(id));
    if (removed && !st.paralysis.length) st.immobilized = false;
  } else if (card === "CO-08")
    st.hexlocks = st.hexlocks.filter((t) => !ids.includes(t.id));
  else
    for (const choice of choices) {
      const room = s.rooms[choice!.room!];
      const i = room.objects.findIndex((t) => t.id === choice!.id);
      s.rooms[p.room].objects.push(...room.objects.splice(i, 1));
    }
  event(s, p.name + " uses " + byId[card].name + ".");
}
