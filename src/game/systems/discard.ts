import type { State, Token } from "../domain/engine";

export function pickupBlocked(s: State, id: string) {
  return s.discardedThisTurn[id] === s.turn;
}
export function assertCanCollect(s: State, id: string) {
  if (pickupBlocked(s, id))
    throw Error("Discarded objects cannot be taken again until the next turn.");
}
/** The caller removes the physical object from its previous location first. */
export function discardToRoom(s: State, room: string, tokens: Token[]) {
  s.rooms[room].objects.push(...tokens);
  for (const token of tokens) s.discardedThisTurn[token.id] = s.turn;
}
