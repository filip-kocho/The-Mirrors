import type { State } from "../domain/engine";
import { colors } from "../cards/catalog";

export function unlockKnowledge(
  player: State["players"][number],
  ordered: boolean,
): boolean[] {
  const counts = colors.map(
    (color) => player.sigils.filter((s) => s === color).length,
  );
  const different = counts.filter(Boolean).length;
  const candidates = [
    player.sigils.length >= 1,
    different >= 3,
    Math.max(...counts) >= 3,
    different === 5,
  ];
  candidates.forEach((met, i) => {
    if (met && (!ordered || i === 0 || player.knowledge[i - 1]))
      player.knowledge[i] = true;
  });
  return candidates;
}
