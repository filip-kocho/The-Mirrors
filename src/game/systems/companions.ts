import type { State, Token } from "../domain/engine";
import { companionById } from "../cards/companions";
import { inventoryCapacities, carryingSlot } from "./inventoryCapacity";
import { hasSpell } from "./spellModifiers";
import { hasItemEffect } from "./itemAccess";
import { connections } from "../map/castleConnections";
type Hero = State["players"][number];
export const isCarrier = (t: Token) =>
  t.kind === "Companion" && companionById[t.card!]?.followingType === "CARRIER";
export const movementOf = (t: Token) =>
  t.linkedGroupId
    ? "STRAY"
    : (companionById[t.card!]?.movementType ?? t.behavior ?? "LOYAL");
const log = (s: State, text: string) =>
  s.log.push({ id: s.log.length + 1, turn: s.turn, text });
export function companionLocations(s: State) {
  return [
    ...s.players.flatMap((p) =>
      p.companions.map((token) => ({ token, owner: p, room: p.room })),
    ),
    ...Object.values(s.rooms).flatMap((r) =>
      r.objects
        .filter((t) => t.kind === "Companion")
        .map((token) => ({
          token,
          owner: undefined as Hero | undefined,
          room: r.id,
        })),
    ),
  ];
}
function detach(s: State, t: Token) {
  for (const p of s.players)
    p.companions = p.companions.filter((x) => x.id !== t.id);
  for (const r of Object.values(s.rooms))
    r.objects = r.objects.filter((x) => x.id !== t.id);
}
function group(s: State, t: Token) {
  return t.linkedGroupId
    ? [
        t,
        ...companionLocations(s)
          .filter(
            (x) =>
              x.token.linkedGroupId === t.linkedGroupId && x.token.id !== t.id,
          )
          .map((x) => x.token),
      ]
    : [t];
}
export function carrierRoom(s: State, p: Hero) {
  const cap = inventoryCapacities(
    p.inventory,
    [],
    s.blackMirror.heroes[p.id]?.hexlocks ?? [],
    s,
    p.id,
  );
  return (
    cap.items -
    p.inventory.filter((t) => carryingSlot(t) === "items").length -
    p.companions.filter(isCarrier).length
  );
}
export function attachCompanion(
  s: State,
  p: Hero,
  t: Token,
  discovery = false,
) {
  if (s.removed.some((x) => x.id === t.id))
    throw Error("Removed Companions cannot return.");
  const members = group(s, t);
  const extra = members.filter(
    (x) => isCarrier(x) && !p.companions.some((a) => a.id === x.id),
  ).length;
  if (extra > 0 && extra > carrierRoom(s, p)) {
    if (!discovery) throw Error("A Carrier needs a free Item slot.");
    t.originalDiscoverer ??= p.id;
    t.discoverer = p.id;
    detach(s, t);
    s.rooms[p.room].objects.push(t);
    log(
      s,
      `${companionById[t.card!].name} is discovered by ${p.name}, but stays in the room because no Item slot is free (provisional).`,
    );
    return;
  }
  for (const member of members) {
    member.originalDiscoverer ??= member.discoverer ?? p.id;
    member.discoverer = p.id;
    delete member.fearEncounter;
    member.behavior = movementOf(member);
    detach(s, member);
    p.companions.push(member);
  }
}
export function leaveCompanion(
  s: State,
  t: Token,
  room: string,
  removed = false,
) {
  for (const member of group(s, t)) {
    detach(s, member);
    (removed ? s.removed : s.rooms[room].objects).push(member);
  }
}
function twinsIn(s: State, room: string) {
  const found = companionLocations(s).filter(
    (x) => x.room === room && ["CO-05", "CO-06"].includes(x.token.card!),
  );
  return found.length === 2 ? found : [];
}
function reunite(s: State, p: Hero, twins: ReturnType<typeof twinsIn>) {
  for (const x of twins) {
    x.token.linkedGroupId = "ghost-twins";
    x.token.behavior = "STRAY";
  }
  attachCompanion(s, p, twins[0].token);
  log(
    s,
    `Madison and Mason reunite with ${p.name}. Both cards are permanently linked Strays.`,
  );
}
export function companionDeparture(s: State, p: Hero) {
  for (const t of p.companions) delete t.fearEncounter;
  const twins = twinsIn(s, p.room);
  if (s.items.restrictions[p.id]?.companions === p.room) return;
  if (twins.length && !twins[0].token.linkedGroupId) reunite(s, p, twins);
  const handled = new Set<string>();
  for (const x of companionLocations(s).filter((x) => x.room === p.room)) {
    if (
      handled.has(x.token.id) ||
      movementOf(x.token) !== "STRAY" ||
      x.owner?.id === p.id
    )
      continue;
    const members = group(s, x.token);
    members.forEach((t) => handled.add(t.id));
    if (
      members.some(isCarrier) &&
      carrierRoom(s, p) < members.filter(isCarrier).length
    ) {
      log(
        s,
        `${companionById[x.token.card!].name} stays behind: ${p.name} has no free Item slot (provisional).`,
      );
      continue;
    }
    attachCompanion(s, p, x.token);
    log(
      s,
      `${members.map((t) => companionById[t.card!].name).join(" and ")} follows departing ${p.name}.`,
    );
  }
}
export function normalizeCompanions(s: State) {
  for (const { token, owner } of companionLocations(s)) {
    token.behavior = movementOf(token);
    token.originalDiscoverer ??= token.discoverer ?? owner?.id;
    if (owner) token.discoverer = owner.id;
  }
  // Capacity reductions never leave an attached Carrier outside a legal Item slot.
  for (const p of s.players)
    while (carrierRoom(s, p) < 0 && p.companions.some(isCarrier)) {
      const t = p.companions.filter(isCarrier).at(-1)!;
      leaveCompanion(s, t, p.room);
      log(
        s,
        `${companionById[t.card!].name} stays in ${p.room} after Item capacity decreases (provisional).`,
      );
    }
}
export function resolveEncounters(s: State, room: string) {
  if (!s.rules.itemPolicies.companionConflicts) return;
  const protectedToken = (owner: Hero | undefined) =>
    !!owner &&
    (hasSpell(s, "COMPANION_IMMUNITY", owner.id) ||
      hasItemEffect(s, "IGNORE_CONFLICTS", owner.id));
  // Stable card-ID order, eating across the entire room before any fear; no recursive arrival chains.
  const present = () =>
    companionLocations(s)
      .filter((x) => x.room === room)
      .sort((a, b) => a.token.card!.localeCompare(b.token.card!));
  for (const predator of present()) {
    if (!present().some((x) => x.token.id === predator.token.id)) continue;
    for (const prey of present()) {
      if (protectedToken(prey.owner)) continue;
      if (
        (
          companionById[predator.token.card!]?.predatorIds as readonly string[]
        ).includes(prey.token.card!)
      ) {
        leaveCompanion(s, prey.token, room, true);
        log(
          s,
          `${companionById[predator.token.card!].name} eats ${companionById[prey.token.card!].name}; the card is removed from play.`,
        );
      }
    }
  }
  const snapshot = present(),
    fled = new Set<string>();
  for (const victim of snapshot) {
    if (fled.has(victim.token.id) || protectedToken(victim.owner)) continue;
    const hunters = snapshot.filter((h) =>
      (
        companionById[victim.token.card!]?.dreadIds as readonly string[]
      ).includes(h.token.card!),
    );
    if (!hunters.length) {
      delete victim.token.fearEncounter;
      continue;
    }
    const key = room + ":" + hunters.map((h) => h.token.id).join(",");
    if (victim.token.fearEncounter === key) continue;
    victim.token.fearEncounter = key;
    const destination =
      s.rules.companionPolicies.flee === "STAY"
        ? room
        : (connections(s, room).find((id) => s.rooms[id].explored) ?? room);
    group(s, victim.token).forEach((t) => {
      fled.add(t.id);
      t.fearEncounter = key;
    });
    leaveCompanion(s, victim.token, destination);
    log(
      s,
      `${companionById[victim.token.card!].name} flees to ${destination} (provisional fear destination).`,
    );
  }
  const twins = twinsIn(s, room);
  if (
    twins.length &&
    !twins[0].token.linkedGroupId &&
    twins[0].owner &&
    twins[0].owner.id === twins[1].owner?.id &&
    s.rules.companionPolicies.reunion === "SAME_OWNER_IMMEDIATE"
  )
    reunite(s, twins[0].owner, twins);
}
export function assertCompanions(s: State) {
  const locations = companionLocations(s),
    all = [
      ...locations.map((x) => x.token),
      ...s.removed.filter((t) => t.kind === "Companion"),
    ];
  if (new Set(all.map((t) => t.id)).size !== all.length)
    throw Error("Duplicate physical Companion.");
  if (all.some(t => !companionById[t.card!] || t.id !== t.card))
    throw Error("Unknown Companion identity.");
  const deck = s.decks.Companion;
  if (new Set(deck).size !== deck.length || deck.some(id => !companionById[id] || all.some(t => t.id === id)))
    throw Error("A Companion cannot be in the deck and in play simultaneously.");
  const linked = all.filter((t) => t.linkedGroupId);
  if (linked.length) {
    if (
      linked.length !== 2 ||
      !linked.every((t) => ["CO-05", "CO-06"].includes(t.card!))
    )
      throw Error("Invalid Ghost Twin link.");
    const a = locations.find((x) => x.token.id === linked[0].id),
      b = locations.find((x) => x.token.id === linked[1].id);
    if (!!a !== !!b || a?.room !== b?.room || a?.owner?.id !== b?.owner?.id)
      throw Error("An action cannot split the reunited Ghost Twins.");
  }
}
