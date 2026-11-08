import type { State } from "../domain/engine";
import { colors } from "../cards/catalog";
export function banishmentPlan(s: State) {
  const p = s.players[s.active];
  if (
    s.privacy ||
    s.outcome !== "playing" ||
    p.dead ||
    s.pending ||
    s.blackMirror.resolution
  )
    throw Error("Finish the current action before banishing Occuldor.");
  if (!p.knowledge[3])
    throw Error("Unlock the fourth Spell Knowledge slot first.");
  if (s.occuldor === "Hall") throw Error("Occuldor is already in the Hall.");
  const indices = colors.map((c) => p.sigils.indexOf(c));
  if (indices.some((i) => i < 0))
    throw Error("Requires five free Sigils, one of each color.");
  return indices;
}
