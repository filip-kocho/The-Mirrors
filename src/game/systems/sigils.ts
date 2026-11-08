import type { State } from "../domain/engine";
import { byId, colors } from "../cards/catalog";
import type { PhysicalSigil } from "./spellState";

// Color columns are retained for existing rules/save compatibility. Identity columns
// annotate those same entries; they are not another pool or another count of resources.
export function availableSigils(
  s: State,
  owner = s.players[s.active].id,
): PhysicalSigil[] {
  return [
    ...s.players
      .find((p) => p.id === owner)!
      .sigils.map((color, i) => ({
        color,
        id:
          s.spells.availableIds[owner]?.[i] ?? `legacy:${owner}:${i}:${color}`,
      })),
    ...s.magic.wildStorage
      .filter((t) => t.owner === owner)
      .map((t) => ({ id: t.id, color: "Wild" as const })),
  ];
}
export function normalizeSigilIdentities(s: State) {
  for (const p of s.players)
    s.spells.availableIds[p.id] = availableSigils(s, p.id)
      .filter((t) => t.color !== "Wild")
      .map((t) => t.id);
  for (const [spell, list] of Object.entries(s.blackMirror.bindings))
    s.spells.permanentIds[spell] = list.map(
      (c, i) =>
        s.spells.permanentIds[spell]?.[i] ?? `legacy:bound:${spell}:${i}:${c}`,
    );
  s.spells.spentIds = s.blackMirror.spentSigils.map(
    (c, i) => s.spells.spentIds[i] ?? `legacy:spent:${i}:${c}`,
  );
  for (const q of s.spells.quick) {
    const slots = byId[q.spell]?.casting_modes?.[q.action]?.sigil_slots ?? [];
    const used = new Set(
      q.sigils.flatMap((t) => (t.socket === undefined ? [] : [t.socket])),
    );
    for (const t of q.sigils)
      if (t.socket === undefined) {
        const index = slots.findIndex(
          (c, i) => !used.has(i) && (c === t.color || t.color === "Wild"),
        );
        if (index >= 0) {
          t.socket = index;
          used.add(index);
        }
      }
  }
  s.spells.identityReady = true;
}
export function takeSigils(s: State, owner: string, ids: string[]) {
  const available = availableSigils(s, owner);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !available.some((t) => t.id === id))
  )
    throw Error("Choose distinct available Sigils belonging to this hero.");
  const selected = ids.map((id) => available.find((t) => t.id === id)!);
  const rest = available.filter((t) => !ids.includes(t.id));
  const p = s.players.find((p) => p.id === owner)!;
  p.sigils = rest
    .filter((t) => t.color !== "Wild")
    .map((t) => t.color) as typeof p.sigils;
  s.magic.wildStorage = s.magic.wildStorage.filter((t) => !ids.includes(t.id));
  s.spells.availableIds[owner] = rest
    .filter((t) => t.color !== "Wild")
    .map((t) => t.id);
  return selected;
}
export function giveSigils(s: State, owner: string, tokens: PhysicalSigil[]) {
  const p = s.players.find((p) => p.id === owner)!;
  const ids = (s.spells.availableIds[owner] ??= []);
  p.sigils.push(
    ...(tokens
      .filter((t) => t.color !== "Wild")
      .map((t) => t.color) as typeof p.sigils),
  );
  ids.push(...tokens.filter((t) => t.color !== "Wild").map((t) => t.id));
  s.magic.wildStorage.push(
    ...tokens
      .filter((t) => t.color === "Wild")
      .map((t) => ({ id: t.id, owner })),
  );
}
export function grantSigil(
  s: State,
  owner: string,
  color: (typeof colors)[number],
) {
  giveSigils(s, owner, [{ color, id: `SG-${s.spells.nextId++}-${color}` }]);
}
export function discardSigils(s: State, tokens: PhysicalSigil[]) {
  s.blackMirror.spentSigils.push(...tokens.map((t) => t.color));
  s.spells.spentIds.push(...tokens.map((t) => t.id));
}
export function boundSigils(s: State, spell: string): PhysicalSigil[] {
  return (s.blackMirror.bindings[spell] ?? []).map((color, i) => ({
    color,
    id:
      s.spells.permanentIds[spell]?.[i] ??
      `legacy:bound:${spell}:${i}:${color}`,
  }));
}
export function discardBoundSigils(s: State, spell: string) {
  discardSigils(s, boundSigils(s, spell));
  delete s.blackMirror.bindings[spell];
  delete s.spells.permanentIds[spell];
}
export function returnQuickSigils(s: State, owner: string) {
  const due = s.spells.quick.filter(
    (q) => q.owner === owner && q.turn < s.turn,
  );
  s.spells.quick = s.spells.quick.filter((q) => !due.includes(q));
  const p = s.players.find((p) => p.id === owner)!;
  for (const q of due) {
    if (p.dead) discardSigils(s, q.sigils);
    else giveSigils(s, owner, q.sigils);
  }
  s.spells.buffs = s.spells.buffs.filter(
    (b) => b.owner !== owner || b.turn >= s.turn,
  );
  if (due.length)
    s.log.push({
      id: s.log.length + 1,
      turn: s.turn,
      text: `${p.name}'s ${due.reduce((n, q) => n + q.sigils.length, 0)} Quick Sigils return at the start of their next turn.`,
    });
}
export function settleDeadQuickSigils(s: State, owner: string) {
  const due = s.spells.quick.filter((q) => q.owner === owner);
  due.forEach((q) => discardSigils(s, q.sigils));
  s.spells.quick = s.spells.quick.filter((q) => q.owner !== owner);
}
export function assertSigils(s: State) {
  if (!s.spells.identityReady) return;
  const ids: string[] = [
    ...s.magic.wildStorage.map((t) => t.id),
    ...(s.magic.pentagon ? [s.magic.pentagon.id] : []),
  ];
  const consent = s.spells.consent;
  if (
    consent &&
    (!s.players.some((p) => p.id === consent.hero) ||
      consent.hero === consent.owner ||
      consent.owner !== s.players[s.active].id ||
      consent.turn !== s.turn ||
      consent.spell !== "SP-35")
  )
    throw Error("Invalid saved Spell consent.");
  const offer = s.spells.portalOffer;
  if (
    offer &&
    (offer.owner !== s.players[s.active].id || offer.turn !== s.turn)
  )
    throw Error("Invalid saved Portal offer.");
  if (
    Object.keys(s.spells.availableIds).some(
      (id) => !s.players.some((p) => p.id === id),
    )
  )
    throw Error("Unknown Sigil owner.");
  if (new Set(s.spells.quick.map((q) => q.id)).size !== s.spells.quick.length)
    throw Error("Duplicate Quick assignment identity.");
  if (
    s.spells.buffs.some(
      (b) =>
        !s.players.some((p) => p.id === b.owner) ||
        !byId[b.spell]?.casting_modes ||
        b.turn > s.turn,
    )
  )
    throw Error("Invalid Spell modifier.");
  for (const p of s.players) {
    const list = s.spells.availableIds[p.id] ?? [];
    if (list.length !== p.sigils.length)
      throw Error("Sigil identity/storage mismatch.");
    ids.push(...list);
  }
  for (const [spell, list] of Object.entries(s.blackMirror.bindings)) {
    const tags = s.spells.permanentIds[spell] ?? [];
    if (tags.length !== list.length)
      throw Error("Bound Sigil identity mismatch.");
    ids.push(...tags);
  }
  if (
    Object.keys(s.spells.permanentIds).some((id) => !s.blackMirror.bindings[id])
  )
    throw Error("Orphaned permanent Sigil identities.");
  if (s.spells.spentIds.length !== s.blackMirror.spentSigils.length)
    throw Error("Discarded Sigil identity mismatch.");
  ids.push(...s.spells.spentIds);
  for (const q of s.spells.quick) {
    const mode = byId[q.spell]?.casting_modes?.[q.action];
    if (
      !s.players.some((p) => p.id === q.owner) ||
      mode?.name.toUpperCase() !== "QUICK" ||
      q.turn > s.turn ||
      !q.sigils.length
    )
      throw Error("Invalid Quick assignment.");
    const sockets = q.sigils.flatMap((t) =>
      t.socket === undefined ? [] : [t.socket],
    );
    if (
      new Set(sockets).size !== sockets.length ||
      q.sigils.some(
        (t) =>
          t.socket !== undefined &&
          (!mode.sigil_slots[t.socket] ||
            (t.color !== "Wild" && mode.sigil_slots[t.socket] !== t.color)),
      )
    )
      throw Error("Invalid Quick socket assignment.");
    const remaining = [...mode.sigil_slots];
    for (const t of [...q.sigils].sort(
      (a, b) => Number(a.color === "Wild") - Number(b.color === "Wild"),
    )) {
      const i = t.color === "Wild" ? 0 : remaining.indexOf(t.color);
      if (i < 0) throw Error("Invalid Quick Sigil color.");
      remaining.splice(i, 1);
    }
    ids.push(...q.sigils.map((t) => t.id));
  }
  if (new Set(ids).size !== ids.length || ids.some((id) => !id))
    throw Error("A physical Sigil occupies more than one location.");
}
