import type { State } from "../domain/engine";
import { resolveEncounters } from "./companions";
export function resolveCompanionConflicts(
  s: State,
  hero: State["players"][number],
  _incoming?: string,
) {
  resolveEncounters(s, hero.room);
}
