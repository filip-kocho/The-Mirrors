import type { State } from "../domain/engine";
import { byId } from "../cards/catalog";
import { hasSpell, roomActionsBlocked } from "./spellModifiers";
import { roomGraph } from "../map/roomGraph";
import { itemReward, arriveOcculdor } from "./courage";
import { resolveCompanionConflicts } from "./companionConflicts";
export function remoteMirrorAllowed(s: State, room: string, flip = false) {
  const p = s.players[s.active];
  return (
    room === p.room ||
    (!!s.rooms[room]?.explored &&
      (hasSpell(s, "REMOTE_MIRRORS") ||
        (!flip &&
          hasSpell(s, "REMOTE_WHITE_PERMISSION") &&
          roomGraph[p.room].neighbors.includes(room))))
  );
}
export function placeMirrorPair(
  s: State,
  room: string,
  whiteId: string,
  blackId: string,
) {
  const p = s.players[s.active],
    r = s.rooms[room];
  if (!r || !r.explored || roomActionsBlocked(s, room))
    throw Error("Choose an explored room where actions are legal.");
  const log = (text: string) =>
    s.log.push({ id: s.log.length + 1, turn: s.turn, text });
  if (
    r.id === "Hall" ||
    r.restored ||
    r.pair.length ||
    (s.installed && s.rules.onePairPlacementAndOneFlipPerTurn)
  )
    throw Error(
      "Place a pair in an unrestored room without placed mirrors, within the configured action limit.",
    );
  const choices = [
    { id: whiteId, kind: "White Mirror" },
    { id: blackId, kind: "Black Mirror" },
  ];
  const accessible = [...p.inventory, ...r.objects];
  for (const choice of choices)
    if (!accessible.some((t) => t.id === choice.id && t.kind === choice.kind))
      throw Error(
        `Choose an accessible ${choice.kind} from your hand or current room.`,
      );
  for (const choice of choices) {
    const from = r.objects.some((t) => t.id === choice.id)
      ? r.objects
      : p.inventory;
    const i = from.findIndex((t) => t.id === choice.id);
    r.pair.push(...from.splice(i, 1));
  }
  const white = r.pair.find((t) => t.kind === "White Mirror")!;

  for (const slot of byId[white.card!].slots!) {
    if (slot === "Empty") continue;
    const card = s.decks[slot].shift();
    if (!card) throw Error("Discovery deck exhausted unexpectedly.");
    if (slot === "Secret") p.secrets.push(card);
    else if (slot === "Companion") {
      p.companions.push({
        id: card,
        card,
        kind: slot,
        behavior: s.rules.blackMirrorPolicies.defaultCompanionBehavior,
        discoverer: p.id,
        originalDiscoverer: p.id,
      });
      log(`${byId[card].name} joins ${p.name} when discovered.`);
      itemReward(s, p.id, "COMPANION");
      resolveCompanionConflicts(s, p, card);
    } else r.objects.push({ id: card, card, kind: slot });
  }
  itemReward(
    s,
    p.id,
    "PAIR",
    s.rules.itemPolicies.pairReward === "MIRROR" ? 2 : 1,
  );
  s.installed = true;
  log(
    `${p.name} places mirrors in ${r.id}: ${whiteId} + a hidden Black Mirror. All White Mirror discoveries appear; Secrets go privately to the discoverer. Occuldor stands on the Black Mirror; his previous mirror is freed.`,
  );
  arriveOcculdor(s, r.id);
}

export function placeSingleWhite(s: State, roomId: string, whiteId: string) {
  const p = s.players[s.active],
    r = s.rooms[roomId];
  if (
    !r ||
    roomId === "Hall" ||
    !r.explored ||
    r.restored ||
    r.pair.length ||
    roomActionsBlocked(s, roomId) ||
    (s.installed && s.rules.onePairPlacementAndOneFlipPerTurn)
  )
    throw Error("White Mirror placement is not legal here.");
  const i = p.inventory.findIndex(
    (t) => t.id === whiteId && t.kind === "White Mirror",
  );
  if (i < 0) throw Error("Choose a carried White Mirror.");
  r.objects.push(...p.inventory.splice(i, 1));
  const black = r.objects.find((t) => t.kind === "Black Mirror");
  if (black) placeMirrorPair(s, roomId, whiteId, black.id);
  s.installed = true;
}
