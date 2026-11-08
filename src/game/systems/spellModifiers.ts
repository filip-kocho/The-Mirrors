import type { State } from "../domain/engine";
import { byId } from "../cards/catalog";
import { blackMirrorById } from "../cards/blackMirrors";
import { spellAdapters, type SpellOperation } from "../cards/spellEffects";
export function applicableSpellSeals(s: State, spell: string, action: number) {
  const mode = byId[spell]?.casting_modes?.[action];
  return s.blackMirror.seals.filter(
    (seal) =>
      seal.spell === spell &&
      (seal.scope === "ALL" ||
        (seal.scope === "SPECIFIC_ACTION" && seal.action === action) ||
        seal.scope === mode?.name.toUpperCase()),
  );
}
export function activePermanent(s: State, owner: string, spell: string) {
  const p = s.players.find((p) => p.id === owner),
    i = p?.spellSlots.indexOf(spell) ?? -1,
    action =
      byId[spell]?.casting_modes?.findIndex(
        (m) => m.name.toUpperCase() === "PERMANENT",
      ) ?? -1;
  const bound = s.blackMirror.bindings[spell] ?? [],
    cost = byId[spell]?.casting_modes?.[action]?.sigil_slots ?? [];
  return (
    !!p &&
    !p.dead &&
    p.courage > 0 &&
    i >= 0 &&
    p.knowledge[i] &&
    p.inventory.some((t) => t.id === spell && t.kind === "Spell") &&
    !s.blackMirror.heroes[owner]?.hexlocks.some(
      (h) => h.slot === "knowledge" && h.index === i,
    ) &&
    bound.length === cost.length &&
    cost.length > 0 &&
    cost.every((c, n) => bound[n] === c) &&
    !applicableSpellSeals(s, spell, action).length
  );
}
export function permanentSpells(s: State, owner: string, op: SpellOperation) {
  return (s.players.find((p) => p.id === owner)?.spellSlots ?? []).filter(
    (id): id is string =>
      !!id &&
      activePermanent(s, owner, id) &&
      spellAdapters[id][1].operation === op,
  );
}
export function hasSpell(
  s: State,
  op: SpellOperation,
  owner = s.players[s.active].id,
) {
  return permanentSpells(s, owner, op).length > 0;
}
export function spellMovement(s: State, owner: string, base: number) {
  return (
    Math.max(hasSpell(s, "MOVE_FLOOR", owner) ? 2 : 1, base) +
    (hasSpell(s, "MOVE_BONUS", owner) ? 1 : 0) +
    (hasSpell(s, "MOVE_BONUS_TWO", owner) ? 2 : 0)
  );
}
export function spellFragmentBonus(
  s: State,
  owner: string,
  _different = false,
) {
  return (
    Number(hasSpell(s, "FRAGMENT_REWARD", owner)) +
    Number(hasSpell(s, "FREE_GLASS", owner))
  );
}
export function spellCapacity(s: State, owner: string, slot: string) {
  return Number(
    hasSpell(
      s,
      slot === "items"
        ? "ITEM_CAPACITY"
        : slot === "mirrors"
          ? "MIRROR_CAPACITY"
          : "ELEMENT_CAPACITY",
      owner,
    ) && slot !== "relics",
  );
}
export function ignoresParalysis(s: State, owner: string) {
  return [
    "IGNORE_PARALYSIS",
    "PARALYSIS_IMMUNITY",
    "IGNORE_MOVEMENT_TOKENS",
  ].some((op) => hasSpell(s, op as SpellOperation, owner));
}
export function ignoresThreshold(s: State, owner: string) {
  return (
    hasSpell(s, "IGNORE_THRESHOLD", owner) ||
    hasSpell(s, "IGNORE_MOVEMENT_TOKENS", owner)
  );
}
export function roomActionsBlocked(
  s: State,
  room: string,
  owner = s.players[s.active].id,
) {
  return (
    (s.blackMirror.rooms[room]?.darkness ?? 0) > 0 &&
    !hasSpell(s, "IGNORE_DARKNESS", owner)
  );
}
export function spellLossReduction(
  s: State,
  owner: string,
  amount: number,
  options: { cost?: boolean; unpreventable?: boolean; occuldor?: boolean },
  consume = false,
) {
  if (options.cost || options.unpreventable) return 0;
  if (options.occuldor)
    return hasSpell(s, "ARRIVAL_IMMUNITY", owner)
      ? amount
      : Math.min(
          amount,
          Number(hasSpell(s, "ARRIVAL_GUARD", owner)) +
            2 * Number(hasSpell(s, "ARRIVAL_GUARD_TWO", owner)),
        );
  const res = s.blackMirror.resolution;
  if (!res || res.hero !== owner || !res.card.startsWith("BM-")) return 0;
  const psychological = blackMirrorById[res.card]?.subtype === "Psychological";
  const allowance =
    Number(hasSpell(s, "CURSE_GUARD", owner)) +
    2 * Number(psychological && hasSpell(s, "PSYCHOLOGICAL_GUARD", owner));
  const key = `curse-guard:${s.pending ? `${s.pending.room}:${s.pending.card}:${s.turn}` : res.id}`,
    used = s.spells.usage[key] ?? 0,
    n = Math.min(amount, Math.max(0, allowance - used));
  if (consume) s.spells.usage[key] = used + n;
  return n;
}
// Compatibility event entry; v0.4 rewards are emitted at collision and placement only.
export function spellReward(_s: State, _owner: string, _event: string) {}
