import { refreshGems } from "./magicResources";
import { companionDeparture, leaveCompanion } from "./companions";
import { portalSupply, assignPortals } from "./portals";
import { discardBoundSigils, returnQuickSigils } from "./sigils";
import {
  hasSpell,
  ignoresParalysis,
  applicableSpellSeals,
} from "./spellModifiers";
import type { State, Token } from "../domain/engine";
import { byId } from "../cards/catalog";
import { blackMirrorById, Category, CurseEffect } from "../cards/blackMirrors";
import { newHeroStatus } from "./blackMirrorState";
import { inventoryCapacities, carryingSlot } from "./inventoryCapacity";
import {
  connections,
  corridorIds,
  innerRooms,
  legalThreshold,
} from "../map/castleConnections";
import { loseCourage, arriveOcculdor } from "./courage";
import { hasItemEffect } from "./itemAccess";
import { resolveCompanionConflicts } from "./companionConflicts";

export const statusOf = (s: State, id: string) =>
  s.blackMirror.heroes[id] ?? newHeroStatus();
export function mutableStatus(s: State, id: string) {
  return (s.blackMirror.heroes[id] ??= {
    ...newHeroStatus(),
    visited: [...new Set(["Hall", s.players.find((p) => p.id === id)!.room])],
  });
}
export const tokenId = (s: State, prefix: string) =>
  `${prefix}-${s.blackMirror.nextId++}`;
export function event(s: State, text: string) {
  s.log.push({ id: s.log.length + 1, turn: s.turn, text });
  s.blackMirror.resolution?.summary.push(text);
}
export const isImmobilized = (s: State, id: string) =>
  !hasItemEffect(s, "IGNORE_PARALYSIS", id) &&
  !ignoresParalysis(s, id) &&
  (statusOf(s, id).immobilized || statusOf(s, id).paralysis.length > 0);
export const knowledgeSealed = (s: State, id: string, slot: number) =>
  statusOf(s, id).hexlocks.some(
    (h) => h.slot === "knowledge" && h.index === slot,
  );
export const darkness = (s: State, room: string) =>
  s.blackMirror.rooms[room]?.darkness ?? 0;
export function spellSeals(s: State, spell: string, action: number) {
  return applicableSpellSeals(s, spell, action);
}
export const canActivateSpellAction = (
  s: State,
  spell: string,
  action: number,
) =>
  !!byId[spell]?.casting_modes?.[action] &&
  spellSeals(s, spell, action).length === 0;
export function abandonSpell(
  s: State,
  hero: State["players"][number],
  spell: string,
) {
  const i = hero.inventory.findIndex((t) => t.id === spell);
  if (i >= 0) s.rooms[hero.room].objects.push(...hero.inventory.splice(i, 1));
  hero.spellSlots = hero.spellSlots.map((id) => (id === spell ? null : id));
  discardBoundSigils(s, spell);
  // Seals stay with the physical Spell; their original afflicted owner clears them.
}
export function visitRoom(
  s: State,
  hero: State["players"][number],
  destination: string,
  forced = false,
) {
  const status = mutableStatus(s, hero.id),
    origin = hero.room,
    room = s.rooms[destination],
    discovered = room.explored;
  if (destination !== origin) companionDeparture(s, hero);
  delete s.items.restrictions[hero.id];
  delete s.magic.movement[hero.id];
  hero.room = destination;
  const remaining = s.players.find((p) => p.room === origin && !p.dead);
  if (remaining) resolveCompanionConflicts(s, remaining);
  resolveCompanionConflicts(s, hero);
  if (!room.explored) {
    s.spells.exploredTurn[hero.id] = s.turn;
    room.explored = true;
    room.objects = structuredClone(room.findings);
    event(
      s,
      `${hero.name} explores ${destination}: ${room.color} fragment and four findings revealed.`,
    );
  }
  if (!status.visited.includes(destination)) status.visited.push(destination);
  if (
    discovered &&
    destination !== origin &&
    status.fearClearedTurn !== s.turn &&
    (!forced || s.rules.blackMirrorPolicies.forcedVisitsClearFear)
  ) {
    const i = status.fear.findIndex((t) => t.origin !== destination);
    if (i >= 0) {
      status.fear.splice(i, 1);
      status.fearClearedTurn = s.turn;
      event(s, `${hero.name} completes one Fear visit in ${destination}.`);
    }
  }
}
export function beginEffects(
  s: State,
  card: string,
  phase: "immediate" | "after" | "refresh" | "item" | "inventory",
  effects?: CurseEffect[],
) {
  const hero = s.players[s.active];
  s.blackMirror.resolution = {
    id: tokenId(s, "resolution"),
    card,
    hero: hero.id,
    origin: s.pending?.room ?? hero.room,
    phase,
    effects: structuredClone(
      effects ??
        (phase === "after"
          ? blackMirrorById[card].after
          : blackMirrorById[card].effects),
    ),
    choice: null,
    endTurn: false,
    summary: [],
  };
}
export function updateTurnSpellOffer(s: State) {
  const hero = s.players[s.active];
  s.spells.portalOffer =
    hasSpell(s, "TURN_PORTAL", hero.id) &&
    !s.blackMirror.rooms[hero.room]?.portal &&
    portalSupply(s) > 0
      ? { owner: hero.id, turn: s.turn }
      : null;
}
export function beginHeroTurn(s: State) {
  refreshGems(s);
  returnQuickSigils(s, s.players[s.active].id);
  const hero = s.players[s.active],
    status = mutableStatus(s, hero.id);
  if (hasSpell(s, "PARALYSIS_IMMUNITY", hero.id)) status.paralysis = [];
  s.spells.portalOffer = null;
  status.immobilized = status.paralysis.length > 0;
  if (status.paralysis.length) {
    status.paralysis.shift();
    event(
      s,
      `${hero.name} removes one Paralysis Token. ${hasItemEffect(s, "IGNORE_PARALYSIS", hero.id) ? "The Brooch allows movement while accessible." : "Cannot leave this turn."}`,
    );
  }
  const effects: CurseEffect[] = [];
  if (status.hexlocks.length && status.hexlockClearedRound !== s.items.round) {
    const removed = (
      s.rules.blackMirrorPolicies.hexlockRemovalOrder === "NEWEST"
        ? status.hexlocks.pop()
        : status.hexlocks.shift()
    )!;
    status.hexlockClearedRound = s.items.round;
    event(
      s,
      `${hero.name} automatically removes one ${removed.category} Hexlock.`,
    );
  }
  if (s.blackMirror.seals.some((seal) => seal.owner === hero.id))
    effects.push({ op: "REMOVE", token: "SIGIL_SEAL" });
  if (effects.length) {
    beginEffects(s, "TURN", "refresh", effects);
    advanceEffects(s);
    if (!s.blackMirror.resolution?.effects.length)
      s.blackMirror.resolution = null;
  }
  if (!s.blackMirror.resolution) updateTurnSpellOffer(s);
}
export function passTurn(s: State) {
  s.spells.afterCurse = null;
  s.spells.portalOffer = null;
  if (s.outcome !== "playing" || s.players.every((p) => p.dead)) return;
  do {
    s.active = (s.active + 1) % s.players.length;
    if (s.active === 0) s.items.round++;
  } while (s.players[s.active].dead);
  s.turn++;
  s.moved = false;
  s.installed = false;
  s.flipped = false;
  s.phase = "PREPARE";
  s.privacy = true;
  event(s, `${s.players[s.active].name}'s turn begins.`);
  beginHeroTurn(s);
}
function categoryTokens(tokens: Token[], category: Category) {
  return tokens.filter((t) =>
    category === "ELEMENT"
      ? t.kind === "Element"
      : category === "ITEM"
        ? t.kind === "Item"
        : category === "MIRROR"
          ? t.kind.endsWith("Mirror")
          : t.kind === "Spell",
  );
}
function label(t: Token) {
  return t.kind === "Black Mirror"
    ? "Black Mirror"
    : (t.element ?? byId[t.card!]?.name ?? t.kind);
}
function lose(
  s: State,
  hero: State["players"][number],
  amount: number,
  unpreventable = false,
) {
  amount = loseCourage(s, hero.id, amount, { unpreventable });
  event(s, `${hero.name} loses ${amount} Courage to the personal curse.`);
}
function addLocks(
  s: State,
  hero: State["players"][number],
  category: Category,
  count: number,
  dropped: Token[] = [],
) {
  const status = mutableStatus(s, hero.id);
  for (let i = 0; i < count; i++)
    status.hexlocks.push({
      id: tokenId(s, "HEXLOCK"),
      category,
      slot:
        category === "ITEM"
          ? carryingSlot(dropped[i]) === "relics"
            ? "relics"
            : "items"
          : category === "MIRROR"
            ? "mirrors"
            : "elements",
    });
  event(s, `${hero.name} gains ${count} ${category} Hexlock(s).`);
}
function leave(s: State, hero: State["players"][number], ids: string[]) {
  const tokens = hero.inventory.filter((t) => ids.includes(t.id));
  hero.inventory = hero.inventory.filter((t) => !ids.includes(t.id));
  s.rooms[hero.room].objects.push(...tokens);
  event(s, `${hero.name} leaves ${tokens.length} object(s) in ${hero.room}.`);
  return tokens;
}
function overflow(s: State, hero: State["players"][number]) {
  const cap = inventoryCapacities(
    hero.inventory,
    s.rooms[hero.room].objects,
    statusOf(s, hero.id).hexlocks,
    s,
    hero.id,
  );
  return hero.inventory.filter((t) => {
    const slot = carryingSlot(t);
    return (
      slot &&
      hero.inventory.filter((item) => carryingSlot(item) === slot).length >
        cap[slot]
    );
  });
}

/** Resolves deterministic operations; returns at the next explicit, serializable choice. */
export function advanceEffects(
  s: State,
  answer?: { choiceId: string; ids: string[] },
) {
  const res = s.blackMirror.resolution;
  if (!res) throw Error("No curse choice is pending.");
  const hero = s.players.find((p) => p.id === res.hero)!,
    status = mutableStatus(s, hero.id);
  let selected: string[] | undefined;
  if (answer) {
    const choice = res.choice;
    if (
      !choice ||
      answer.choiceId !== choice.id ||
      new Set(answer.ids).size !== answer.ids.length ||
      answer.ids.length < choice.min ||
      answer.ids.length > choice.max ||
      answer.ids.some((id) => !choice.options.some((o) => o.id === id))
    )
      throw Error("Choose valid, distinct targets for the current effect.");
    selected = answer.ids;
    res.choice = null;
  } else if (res.choice) return;
  const choose = (
    title: string,
    options: { id: string; label: string }[],
    count: number,
    kind: "objects" | "rooms" | "corridors" | "options" | "tokens" | "actions",
  ): string[] | null => {
    if (!options.length || !count) {
      event(
        s,
        `${res.card}: no eligible targets; this component has no effect (review policy).`,
      );
      return [];
    }
    if (selected) {
      const result = selected;
      selected = undefined;
      return result;
    }
    const n = Math.min(count, options.length);
    if (n < count)
      event(
        s,
        `${res.card}: only ${n} of ${count} required targets exist; resolve those available (review policy).`,
      );
    res.choice = {
      id: tokenId(s, "choice"),
      title,
      options: options.map(({ id, label }) => ({ id, label })),
      min: n,
      max: n,
      kind,
    };
    return null;
  };
  while (res.effects.length) {
    const effect = res.effects[0];
    switch (effect.op) {
      case "LOSS": {
        const sigils = [
          ...hero.sigils,
          ...s.spells.quick
            .filter((q) => q.owner === hero.id)
            .flatMap((q) => q.sigils.map((t) => t.color)),
          ...(s.rules.blackMirrorPolicies.boundSigilsCountAsPossessed
            ? hero.spellSlots.flatMap((id) =>
                id ? (s.blackMirror.bindings[id] ?? []) : [],
              )
            : []),
        ].filter((color) => color !== "Wild");
        const amount =
          typeof effect.amount === "number"
            ? effect.amount
            : effect.amount === "COLORS"
              ? new Set(sigils).size
              : effect.amount === "DUPLICATES"
                ? sigils.length - new Set(sigils).size
                : effect.amount === "COMPANY"
                  ? hero.companions.length
                    ? 1
                    : 3
                  : new Set(
                      hero.inventory
                        .filter((t) => t.kind === "Element")
                        .map((t) => t.element),
                    ).size;
        lose(s, hero, amount, effect.unpreventable);
        break;
      }
      case "TOKEN":
        for (let i = 0; i < effect.count; i++) {
          const id = tokenId(s, effect.token);
          if (effect.token === "PARALYSIS") {
            if (hasSpell(s, "PARALYSIS_IMMUNITY", hero.id)) continue;
            status.paralysis.push(id);
            status.immobilized = true;
          } else status.fear.push({ id, origin: hero.room });
        }
        event(
          s,
          `${hero.name} gains ${effect.count} ${effect.token} Token(s).`,
        );
        break;
      case "DROP": {
        const available = categoryTokens(hero.inventory, effect.category);
        const ids =
          effect.count === "all"
            ? available.map((t) => t.id)
            : choose(
                `Choose ${Math.min(effect.count, available.length)} ${effect.category} object(s) to leave`,
                available.map((t) => ({ id: t.id, label: label(t) })),
                effect.count,
                "objects",
              );
        if (ids === null) return;
        const dropped = leave(s, hero, ids);
        addLocks(
          s,
          hero,
          effect.category,
          effect.locks === "actual" ? dropped.length : effect.locks,
          dropped,
        );
        break;
      }
      case "CHOOSE": {
        const options = effect.options.flatMap((option, i) =>
          option.requires === "ITEM" &&
          !hero.inventory.some((t) => t.kind === "Item")
            ? []
            : [{ id: String(i), label: option.label }],
        );
        const ids = choose(
          "Choose how to resolve the curse",
          options,
          1,
          "options",
        );
        if (ids === null) return;
        res.effects.splice(
          0,
          1,
          ...structuredClone(effect.options[Number(ids[0])].effects),
        );
        continue;
      }
      case "TOLL": {
        if (
          !["White Mirror", "Black Mirror"].every((kind) =>
            hero.inventory.some((t) => t.kind === kind),
          )
        ) {
          lose(s, hero, 3);
          break;
        }
        const available = hero.inventory.filter((t) =>
          t.kind.endsWith("Mirror"),
        );
        const ids = choose(
          "Leave one White and one Black Mirror",
          available.map((t) => ({ id: t.id, label: label(t) })),
          2,
          "objects",
        );
        if (ids === null) return;
        if (
          new Set(
            available.filter((t) => ids.includes(t.id)).map((t) => t.kind),
          ).size !== 2
        )
          throw Error("Choose exactly one White and one Black Mirror.");
        leave(s, hero, ids);
        addLocks(s, hero, "MIRROR", 2);
        break;
      }
      case "MOVE": {
        if (hero.courage === 0) break;
        const options = (
          effect.destination === "INNER"
            ? innerRooms.filter((id) => id !== hero.room)
            : connections(s, hero.room)
        ).filter((id) => !!s.rooms[id]);
        const ids = choose(
          "Choose the forced destination",
          options.map((id) => ({
            id,
            label: `${id}${s.rooms[id].explored ? " · explored" : " · unexplored"}`,
          })),
          1,
          "rooms",
        );
        if (ids === null) return;
        if (ids.length) {
          visitRoom(s, hero, ids[0], true);
          event(s, `${hero.name} is forced to ${ids[0]}.`);
        }
        res.effects.splice(1, 0, { op: "CAPACITY" });
        break;
      }
      case "END_TURN":
        res.endTurn = true;
        break;
      case "THRESHOLD": {
        const options = corridorIds.filter(
          (edge) =>
            (!effect.adjacent || edge.split("~").includes(hero.room)) &&
            legalThreshold(s, edge),
        );
        const ids = choose(
          `Place a permanent Corridor Block (${effect.count} remaining)`,
          options.map((id) => ({ id, label: id.replace("~", " ↔ ") })),
          1,
          "corridors",
        );
        if (ids === null) return;
        if (ids.length) {
          if (!legalThreshold(s, ids[0]))
            throw Error("This Seal would disconnect the castle.");
          s.blackMirror.thresholds.push(ids[0]);
          event(s, `Corridor Block blocks ${ids[0]}.`);
          if (effect.count > 1) {
            effect.count--;
            continue;
          }
        }
        break;
      }
      case "COMPANIONS":
        if (
          hasSpell(s, "CURSE_COMPANION_GUARD", hero.id) ||
          hasSpell(s, "COMPANION_IMMUNITY", hero.id)
        )
          break;
        const abandoned = [...hero.companions];
        for (const t of abandoned)
          if (hero.companions.some((x) => x.id === t.id))
            leaveCompanion(s, t, hero.room);
        event(
          s,
          `${hero.name} leaves ${abandoned.length} Companion(s) in ${hero.room}.`,
        );
        hero.companions = [];
        break;
      case "SPELLS":
        hero.spellSlots.forEach((id, index) => {
          if (!id) return;
          abandonSpell(s, hero, id);
          if (effect.hexlock)
            status.hexlocks.push({
              id: tokenId(s, "HEXLOCK"),
              category: "KNOWLEDGE",
              slot: "knowledge",
              index,
            });
          event(
            s,
            `${hero.name} abandons ${byId[id].name}${effect.hexlock ? " and gains a Knowledge Hexlock" : ""}.`,
          );
        });
        break;
      case "SIGIL_SEALS": {
        if (hasSpell(s, "SEAL_IMMUNITY", hero.id)) break;
        let prevented = hasSpell(s, "SEAL_GUARD", hero.id) ? 1 : 0;
        const actions = hero.spellSlots.flatMap((id) =>
          id
            ? (byId[id].casting_modes ?? []).flatMap((mode, index) =>
                effect.scope === "ALL" ||
                mode.name.toUpperCase() ===
                  (effect.scope === "SPECIFIC_ACTION" ? "QUICK" : effect.scope)
                  ? [
                      {
                        id: `${id}:${index}`,
                        spell: id,
                        action: index,
                        label: `${byId[id].name} · ${mode.name} ${index + 1}`,
                      },
                    ]
                  : [],
              )
            : [],
        );
        const ids =
          effect.scope === "SPECIFIC_ACTION"
            ? choose(
                "Choose the Quick action to seal three times",
                actions,
                1,
                "actions",
              )
            : [...new Set(actions.map((a) => a.spell))];
        if (ids === null) return;
        let added = 0;
        for (const id of ids)
          for (let i = 0; i < effect.count; i++) {
            if (prevented > 0) {
              prevented--;
              continue;
            }
            const target = actions.find((a) => a.id === id);
            s.blackMirror.seals.push({
              id: tokenId(s, "SIGIL_SEAL"),
              owner: hero.id,
              spell: target?.spell ?? id,
              scope: effect.scope,
              ...(target ? { action: target.action } : {}),
            });
            added++;
          }
        event(
          s,
          `${hero.name} gains ${added} ${effect.scope} Sigil Seal(s)${added ? "" : "; no eligible learned actions (review)"}.`,
        );
        if (effect.scope === "QUICK") lose(s, hero, added);
        break;
      }
      case "ROOM": {
        if (effect.token === "PORTAL" && portalSupply(s) === 0) {
          event(s, "No Portal tokens remain in the shared supply.");
          break;
        }
        const eligible = Object.values(s.rooms).filter(
          (r) =>
            r.id !== "Hall" &&
            (effect.target === "UNDISCOVERED"
              ? !r.explored
              : effect.target === "UNVISITED"
                ? r.explored &&
                  !status.visited.includes(r.id) &&
                  r.id !== hero.room
                : r.id === hero.room) &&
            (effect.token !== "PORTAL" || !s.blackMirror.rooms[r.id]?.portal),
        );
        const ids =
          effect.target === "CURRENT"
            ? [hero.room]
            : choose(
                `Choose ${Math.min(effect.count, eligible.length)} room(s) for ${effect.token}`,
                eligible.map((r) => ({ id: r.id, label: r.id })),
                effect.token === "PORTAL"
                  ? Math.min(effect.count, portalSupply(s))
                  : effect.count,
                "rooms",
              );
        if (ids === null) return;
        if (effect.token === "PORTAL") assignPortals(s, ids);
        for (const id of ids) {
          const room = (s.blackMirror.rooms[id] ??= {
            darkness: 0,
            portal: false,
          });
          if (effect.token === "DARKNESS") room.darkness += effect.amount;
          // Portal allocation is handled by the finite shared supply.
          event(
            s,
            `${effect.amount} ${effect.token} placed in ${id}; discovery is unchanged.`,
          );
        }
        break;
      }
      case "SUMMON":
        arriveOcculdor(s, hero.room, hero.id, effect.punishments);
        break;
      case "CAPACITY": {
        if (hero.courage === 0) break;
        const targets = overflow(s, hero);
        if (!targets.length) break;
        const ids = choose(
          "Carrying capacity decreased: choose an excess object to leave here",
          targets.map((t) => ({ id: t.id, label: label(t) })),
          1,
          "objects",
        );
        if (ids === null) return;
        leave(s, hero, ids);
        continue;
      }
      case "REMOVE": {
        const eligible =
          effect.token === "HEXLOCK"
            ? status.hexlocks.map((h) => ({
                id: h.id,
                label: `${h.category} Hexlock${h.slot === "relics" ? " (Relic)" : ""}`,
              }))
            : s.blackMirror.seals
                .filter((seal) => seal.owner === hero.id)
                .map((seal) => ({
                  id: seal.id,
                  label: `${byId[seal.spell].name}: ${seal.scope}`,
                }));
        const ids =
          effect.token === "HEXLOCK"
            ? status.hexlockClearedRound === s.items.round
              ? []
              : (s.rules.blackMirrorPolicies.hexlockRemovalOrder === "NEWEST"
                  ? eligible.slice(-1)
                  : eligible.slice(0, 1)
                ).map((t) => t.id)
            : eligible.length <= 1
              ? eligible.map((t) => t.id)
              : choose(
                  `Choose one ${effect.token} to remove this turn`,
                  eligible,
                  1,
                  "tokens",
                );
        if (ids === null) return;
        if (effect.token === "HEXLOCK" && ids.length)
          status.hexlockClearedRound = s.items.round;
        status.hexlocks = status.hexlocks.filter((h) => !ids.includes(h.id));
        s.blackMirror.seals = s.blackMirror.seals.filter(
          (seal) => !ids.includes(seal.id),
        );
        event(s, `${hero.name} removes ${ids.length} ${effect.token}.`);
        break;
      }
    }
    res.effects.shift();
    selected = undefined;
  }
  if (res.phase !== "refresh" && overflow(s, hero).length && hero.courage > 0) {
    res.effects.push({ op: "CAPACITY" });
    advanceEffects(s);
  }
}
