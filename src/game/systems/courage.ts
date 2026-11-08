import type { State } from "../domain/engine";
import { itemEffects, rewardFor } from "./itemAccess";
import { occuldorArrivalLoss } from "../rules/gameRulesConfig";
import {spellLossReduction} from "./spellModifiers";
export function gainCourage(s: State, heroId: string, amount: number) {
  const p = s.players.find((p) => p.id === heroId)!;
  if (!p.dead && p.courage > 0) p.courage = Math.min(35, p.courage + amount);
}
export function penaltyAmount(
  s: State,
  heroId: string,
  amount: number,
  options: { cost?: boolean; unpreventable?: boolean; occuldor?: boolean } = {},
  consume=false,
) {
  const effects = itemEffects(s, heroId);
  const extra = options.occuldor
    ? effects.reduce((n, e) => n + (e.op === "ARRIVAL_EXTRA" ? e.amount : 0), 0)
    : 0;
  const reduction =
    options.cost || options.unpreventable
      ? 0
      : effects.reduce(
          (n, e) => n + (e.op === "REDUCE_PENALTY" ? e.amount : 0),
          0,
        );
  const remaining=Math.max(0, amount + extra - reduction);
  return remaining-spellLossReduction(s,heroId,remaining,options,consume);
}
export function loseCourage(
  s: State,
  heroId: string,
  amount: number,
  options: Parameters<typeof penaltyAmount>[3] = {},
) {
  const p = s.players.find((p) => p.id === heroId)!;
  const loss = penaltyAmount(s, heroId, amount, options,true);
  p.courage = Math.max(0, p.courage - loss);
  return loss;
}
export function itemReward(
  s: State,
  heroId: string,
  event: Parameters<typeof rewardFor>[1],
  units = 1,
) {
  const n = rewardFor(s, event, heroId) * units;
  if (n) {
    gainCourage(s, heroId, n);
    s.log.push({
      id: s.log.length + 1,
      turn: s.turn,
      text: `${s.players.find((p) => p.id === heroId)!.name} gains +${n} Courage from an Item (${event}).`,
    });
  }
  return n;
}
export function arriveOcculdor(
  s: State,
  room: string,
  onlyHero?: string,
  times = 1,
) {
  s.occuldor = room;
  for (const hero of s.players.filter(
    (p) => !p.dead && p.room === room && (!onlyHero || p.id === onlyHero),
  ))
    for (let i = 0; i < times; i++) {
      const loss = loseCourage(
        s,
        hero.id,
        occuldorArrivalLoss(s.rage, s.rules),
        { occuldor: true },
      );
      s.log.push({
        id: s.log.length + 1,
        turn: s.turn,
        text: `${hero.name} loses ${loss} Courage to Occuldor's arrival in ${room} at Rage ${s.rage}.`,
      });
    }
}
