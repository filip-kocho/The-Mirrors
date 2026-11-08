import { hasSpell } from "./spellModifiers";
import type { State, Token } from "../domain/engine";
import { elements } from "../cards/catalog";
import { itemEffects } from "./itemAccess";
export type Element = (typeof elements)[number];
export function elementResources(s: State) {
  const p = s.players[s.active];
  return [...s.rooms[p.room].objects, ...p.inventory].filter(
    (t) => t.kind === "Element",
  );
}
export function reducedCost(s: State, required: Element[], discount?: Element) {
  const canDiscount = itemEffects(s).some((e) => e.op === "LEARNING_DISCOUNT");
  if (discount && (!canDiscount || !required.includes(discount)))
    throw Error("Choose a printed Element requirement to reduce.");
  const cost = [...required];
  if (discount) cost.splice(cost.indexOf(discount), 1);
  return cost;
}
function tokenContribution(s: State, t: Token, element: Element) {
  const effects = itemEffects(s);
  if (t.element !== element)
    return t.element === "Aether" &&
      (effects.some((e) => e.op === "AETHER_WILD") ||
        hasSpell(s, "AETHER_WILD"))
      ? 1
      : 0;
  const doubles = effects.filter(
    (e) => e.op === "DOUBLE" && e.elements.includes(element),
  ).length;
  return doubles
    ? s.rules.itemPolicies.airStacking === "SUM"
      ? 2 * doubles
      : 2
    : 1;
}
function contribute(cost: Element[], element: Element, n: number) {
  const next = [...cost];
  for (let i = 0; i < n; i++) {
    const at = next.indexOf(element);
    if (at < 0) break;
    next.splice(at, 1);
  }
  return next;
}
/** One physical token is consumed once; excess doubled contribution is not stored. */
export function validElementPayment(
  s: State,
  required: Element[],
  ids: string[],
  discount?: Element,
) {
  if (new Set(ids).size !== ids.length) return false;
  const resources = elementResources(s),
    tokens = ids.map((id) => resources.find((t) => t.id === id));
  if (tokens.some((t) => !t)) return false;
  const assign = (
    at: number,
    cost: Element[],
    wild = hasSpell(s, "PAYMENT_WILD"),
  ): boolean => {
    if (at === tokens.length) return cost.length === 0;
    return [...new Set(cost)].some((el) => {
      const n = tokenContribution(s, tokens[at]!, el);
      return n > 0
        ? assign(at + 1, contribute(cost, el, n), wild)
        : wild && assign(at + 1, contribute(cost, el, 1), false);
    });
  };
  return assign(0, reducedCost(s, required, discount));
}
export function findElementPayment(
  s: State,
  required: Element[],
  discount?: Element,
): string[] | null {
  const available = elementResources(s);
  const find = (
    cost: Element[],
    remaining: Token[],
    wild = hasSpell(s, "PAYMENT_WILD"),
  ): string[] | null => {
    if (!cost.length) return [];
    const el = cost[0];
    const candidates = [...remaining].sort(
      (a, b) => Number(b.element === el) - Number(a.element === el),
    );
    for (const token of candidates) {
      const n = tokenContribution(s, token, el);
      if (!n && !wild) continue;
      const rest = find(
        contribute(cost, el, n || 1),
        remaining.filter((t) => t.id !== token.id),
        wild && n > 0,
      );
      if (rest) return [token.id, ...rest];
    }
    return null;
  };
  return find(reducedCost(s, required, discount), available);
}
