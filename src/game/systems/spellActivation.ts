import { supportsFilledGaps } from "./magicResources";
import { attachCompanion } from "./companions";
import type { State, Token } from "../domain/engine";
import { byId } from "../cards/catalog";
import { spellAdapters } from "../cards/spellEffects";
import { availableSigils, takeSigils, giveSigils } from "./sigils";
import {
  applicableSpellSeals,
  hasSpell,
  roomActionsBlocked,
} from "./spellModifiers";
import { gainCourage, itemReward, arriveOcculdor } from "./courage";
import { castlePath, connectionId } from "../map/castleConnections";
import { roomGraph } from "../map/roomGraph";
import {
  isImmobilized,
  visitRoom,
  mutableStatus,
  event,
} from "./blackMirrorRuntime";
import { inventoryCapacities, carryingSlot } from "./inventoryCapacity";
import { resolveCompanionConflicts } from "./companionConflicts";
import { portalSupply, assignPortals } from "./portals";
import { legalCell, kaleidoscopeCells } from "../map/kaleidoscopeCells";
import { placeSingleWhite, placeMirrorPair } from "./mirrorPlacement";
import { accessibleItems } from "./itemAccess";
import { itemActionPlan, applyItemAction } from "./itemActions";
export type SpellChoice = {
  id: string;
  label: string;
  group?: string;
  room?: string;
};
export function spellActivationPlan(
  s: State,
  spell: string,
  action: number,
  targets: string[] = [],
) {
  const p = s.players[s.active],
    card = byId[spell],
    mode = card?.casting_modes?.[action],
    adapter = spellAdapters[spell]?.[action],
    slot = p.spellSlots.indexOf(spell);
  if (
    !mode ||
    !adapter ||
    slot < 0 ||
    !p.knowledge[slot] ||
    !p.inventory.some((t) => t.id === spell && t.kind === "Spell")
  )
    throw Error("Only a learned Spell in your Knowledge slots can activate.");
  if (
    s.privacy ||
    s.outcome !== "playing" ||
    p.dead ||
    p.courage === 0 ||
    s.blackMirror.resolution ||
    s.pending
  )
    throw Error("Finish the current resolution before activating a Spell.");
  if (
    s.blackMirror.heroes[p.id]?.hexlocks.some(
      (h) => h.slot === "knowledge" && h.index === slot,
    )
  )
    throw Error("This Knowledge slot is Hexlocked.");
  if (applicableSpellSeals(s, spell, action).length)
    throw Error("This action is sealed by Sigil Seals.");
  const quick = mode.name.toUpperCase() === "QUICK";
  if (!quick && s.blackMirror.bindings[spell]?.length)
    throw Error("Permanent Sigils are already bound.");
  if (
    s.rules.spellPolicies.modePolicy === "EXCLUSIVE_ACTIVE_MODE" &&
    (quick
      ? s.blackMirror.bindings[spell]?.length
      : s.spells.quick.some((q) => q.owner === p.id && q.spell === spell))
  )
    throw Error("This Spell already has the alternative mode assigned.");
  if (
    quick &&
    s.rules.spellPolicies.oneQuickPerSpellPerTurn &&
    s.spells.usage[`quick:${p.id}:${spell}`] === s.turn
  )
    throw Error("Quick already used this owner turn.");
  const op = adapter.operation;
  if (
    roomActionsBlocked(s, p.room) &&
    ![
      "DARKNESS_REWARD",
      "DARKNESS_NEAR",
      "DARKNESS_TWO",
      "IGNORE_DARKNESS",
    ].includes(op)
  )
    throw Error("Clear Darkness before activating this Spell.");
  const free = [...availableSigils(s)],
    selected: string[] = [];
  for (const color of mode.sigil_slots) {
    let i = free.findIndex((t) => t.color === color);
    if (i < 0) i = free.findIndex((t) => t.color === "Wild");
    if (i < 0) throw Error(`Missing available ${color} Sigil(s).`);
    selected.push(free.splice(i, 1)[0].id);
  }
  let choices: SpellChoice[] = [],
    min = 0,
    max = 0;
  const rooms = Object.values(s.rooms),
    near = roomGraph[p.room].neighbors,
    explored = rooms.filter((r) => r.explored),
    status = s.blackMirror.heroes[p.id];
  const roomChoices = (ids: string[]) =>
    ids.map((id) => ({ id, label: id, group: "room", room: id }));
  const objects = (list: Token[], room?: string, group = "object") =>
    list.map((t) => ({
      id: t.id,
      label: `${t.element ?? byId[t.card!]?.name ?? t.kind}${room ? ` in ${room}` : " carried"}`,
      group,
      room,
    }));
  const nearby = explored.filter((r) => near.includes(r.id));
  const tokens = (kind: "fear" | "hexlocks" | "paralysis") =>
    (status?.[kind] ?? []).map((t) => ({
      id: typeof t === "string" ? t : t.id,
      label: `${kind} ${typeof t === "string" ? t : t.id}`,
      group: kind,
    }));
  const eligibleSeals = s.blackMirror.seals
    .filter((t) => p.spellSlots.includes(t.spell))
    .map((t) => ({
      id: t.id,
      label: `${byId[t.spell].name}: ${t.scope}`,
      group: "seal",
    }));
  const requireMovement = () => {
    if (isImmobilized(s, p.id))
      throw Error("Paralysis prevents this movement.");
    assertSpellDeparture(s, p.id);
  };
  if (quick)
    switch (op) {
      case "FEAR_COURAGE":
        choices = tokens("fear");
        min = max = 1;
        break;
      case "FEAR_TWO":
        choices = tokens("fear");
        min = 1;
        max = 2;
        break;
      case "HEXLOCK":
        choices = tokens("hexlocks");
        min = max = 1;
        break;
      case "CALM_TOKENS":
        choices = [...tokens("fear"), ...tokens("paralysis")];
        min = 1;
        max = 2;
        break;
      case "CLEANSE_TWO":
        choices = [...tokens("hexlocks"), ...tokens("paralysis")];
        min = 1;
        max = 2;
        break;
      case "REMOVE_SEAL":
      case "REMOVE_TWO_SEALS":
        choices = eligibleSeals;
        min = 1;
        max = op === "REMOVE_SEAL" ? 1 : 2;
        break;
      case "CLEANSE_HERO":
        choices = s.players
          .filter(
            (h) =>
              h.room === p.room &&
              !h.dead &&
              (s.blackMirror.heroes[h.id]?.fear.length ?? 0) +
                (s.blackMirror.heroes[h.id]?.hexlocks.length ?? 0) >
                0,
          )
          .map((h) => ({ id: h.id, label: h.name, group: "hero" }));
        min = max = 1;
        break;
      case "DARKNESS_REWARD":
      case "DARKNESS_NEAR":
      case "DARKNESS_TWO":
        choices = roomChoices(
          rooms
            .filter(
              (r) =>
                (s.blackMirror.rooms[r.id]?.darkness ?? 0) > 0 &&
                (op === "DARKNESS_NEAR"
                  ? r.id === p.room || near.includes(r.id)
                  : r.explored),
            )
            .map((r) => r.id),
        );
        min = max = 1;
        break;
      case "MOVE_ONE":
      case "MOVE_THREE":
      case "TELEPORT_TWO":
      case "TELEPORT_UNRESTORED":
      case "TELEPORT_ANY":
      case "TELEPORT_PARTY":
      case "CROSS_SEAL": {
        requireMovement();
        const allowed = rooms.filter((r) => {
          if (r.id === p.room) return false;
          if (op === "CROSS_SEAL")
            return (
              near.includes(r.id) &&
              s.blackMirror.thresholds.includes(connectionId(p.room, r.id))
            );
          if (op === "TELEPORT_ANY" || op === "TELEPORT_PARTY")
            return r.explored;
          if (op === "TELEPORT_UNRESTORED")
            return r.id !== "Hall" && r.explored && !r.restored;
          const n = castlePath(s, p.room, r.id).length - 1;
          return (
            n > 0 &&
            n <= (op === "MOVE_ONE" ? 1 : op === "TELEPORT_TWO" ? 2 : 3) &&
            (op !== "TELEPORT_TWO" || r.explored)
          );
        });
        choices = roomChoices(allowed.map((r) => r.id));
        min = max = 1;
        if (op === "TELEPORT_PARTY") {
          choices.push(
            ...s.players
              .filter(
                (h) =>
                  h.id !== p.id &&
                  !h.dead &&
                  h.room === p.room &&
                  !isImmobilized(s, h.id),
              )
              .filter((h) => {
                try {
                  assertSpellDeparture(s, h.id);
                  return true;
                } catch {
                  return false;
                }
              })
              .map((h) => ({
                id: h.id,
                label: `Invite ${h.name} (requires consent)`,
                group: "hero",
              })),
          );
          max = 2;
        }
        break;
      }
      case "PULL_MIRROR":
      case "PULL_OBJECT":
      case "PULL_ELEMENT":
      case "RECRUIT_NEAR":
        choices = nearby.flatMap((r) =>
          objects(
            r.objects.filter((t) =>
              op === "PULL_MIRROR"
                ? t.kind.endsWith("Mirror")
                : op === "PULL_OBJECT"
                  ? t.kind === "Item" || t.kind === "Element"
                  : op === "PULL_ELEMENT"
                    ? t.kind === "Element"
                    : t.kind === "Companion",
            ),
            r.id,
          ),
        );
        min = max = 1;
        break;
      case "REMOTE_WHITE":
        if (s.installed && s.rules.onePairPlacementAndOneFlipPerTurn)
          throw Error("Mirror placement allowance used.");
        choices = [
          ...objects(
            p.inventory.filter((t) => t.kind === "White Mirror"),
            undefined,
            "white",
          ),
          ...roomChoices(
            nearby
              .filter(
                (r) =>
                  r.id !== "Hall" &&
                  !r.restored &&
                  !r.pair.length &&
                  !roomActionsBlocked(s, r.id),
              )
              .map((r) => r.id),
          ),
        ];
        min = max = 2;
        if (
          !choices.some((c) => c.group === "white") ||
          !choices.some((c) => c.group === "room")
        )
          throw Error(
            "Requires a carried White Mirror and an eligible adjacent room.",
          );
        break;
      case "PULL_PAIR":
        choices = explored
          .filter((r) => r.id !== p.room)
          .flatMap((r) =>
            r.objects
              .filter((t) => t.kind.endsWith("Mirror"))
              .flatMap((t) => objects([t], r.id, t.kind)),
          );
        min = max = 2;
        if (
          !choices.some((c) => c.group === "White Mirror") ||
          !choices.some((c) => c.group === "Black Mirror")
        )
          throw Error(
            "Requires a loose White Mirror and a loose Black Mirror.",
          );
        break;
      case "PULL_TWO":
        choices = explored
          .filter((r) => r.id !== p.room)
          .flatMap((r) =>
            objects(
              r.objects.filter((t) => t.kind === "Element"),
              r.id,
            ),
          );
        min = 1;
        max = 2;
        break;
      case "BURN_ELEMENT":
      case "BURN_MIRROR":
        choices = objects(
          p.inventory.filter((t) =>
            op === "BURN_ELEMENT"
              ? t.kind === "Element"
              : t.kind.endsWith("Mirror"),
          ),
        );
        min = max = 1;
        break;
      case "EXCHANGE":
        choices = [
          ...objects(
            p.inventory.filter((t) => t.kind === "Element"),
            undefined,
            "carried",
          ),
          ...explored.flatMap((r) =>
            objects(
              r.objects.filter((t) => t.kind === "Element"),
              r.id,
              "roomElement",
            ),
          ),
        ];
        min = max = 2;
        if (
          !choices.some((c) => c.group === "carried") ||
          !choices.some((c) => c.group === "roomElement")
        )
          throw Error("Requires carried and room Elements.");
        break;
      case "VISION":
        choices = roomChoices(
          rooms.filter((r) => r.id !== "Hall" && !r.explored).map((r) => r.id),
        );
        min = 1;
        max = 2;
        break;
      case "OCCULDOR":
        choices = roomChoices(
          rooms
            .filter((r) => r.id !== "Hall" && r.id !== s.occuldor)
            .map((r) => r.id),
        );
        min = max = 1;
        break;
      case "PORTAL_PAIR":
        if (s.blackMirror.rooms[p.room]?.portal || portalSupply(s) < 2)
          throw Error(
            "Requires two available Portal tokens and no Portal in your room.",
          );
        choices = roomChoices(
          explored
            .filter(
              (r) => r.id !== p.room && !s.blackMirror.rooms[r.id]?.portal,
            )
            .map((r) => r.id),
        );
        min = max = 1;
        break;
      case "STEAL_COMPANION":
        choices = s.players
          .filter((h) => h.id !== p.id && h.room === p.room && !h.dead)
          .flatMap((h) => objects(h.companions, undefined, h.id));
        min = max = 1;
        break;
      case "REFRESH_OTHER":
        choices = s.spells.quick
          .filter(
            (q) =>
              q.owner === p.id &&
              q.spell !== spell &&
              p.spellSlots.includes(q.spell),
          )
          .flatMap((q) =>
            q.sigils.map((t) => ({
              id: t.id,
              label: `${t.color}: ${byId[q.spell].name}`,
              group: "sigil",
            })),
          );
        min = 1;
        max = 2;
        break;
      case "RELOCATE_GLASS": {
        const sources = s.mosaic.flatMap((color, i) => (color ? [i] : []));
        for (const i of sources) {
          const copy = [...s.mosaic];
          copy[i] = null;
          for (const cell of kaleidoscopeCells)
            if (
              cell.id !== i &&
              !copy[cell.id] &&
              legalCell(copy, cell.id) &&
              mosaicConnected(copy, cell.id) &&
              supportsFilledGaps(
                s,
                copy.map((c, n) => (n === cell.id ? s.mosaic[i] : c)),
              )
            )
              choices.push({
                id: `${i}:${cell.id}`,
                label: `Glass ${i + 1} to position ${cell.id + 1}`,
                group: "glass",
              });
        }
        min = max = 1;
        break;
      }
      case "TOOL": {
        const tools = accessibleItems(s).filter((t) => {
          try {
            const plan = itemActionPlan(s, t.card!, true);
            return (
              plan.effect.action !== "SIGIL" ||
              availableSigils(s).length > mode.sigil_slots.length
            );
          } catch {
            return false;
          }
        });
        choices = tools.map((t) => ({
          id: t.id,
          label: byId[t.card!].name,
          group: "tool",
        }));
        min = max = 1;
        const tool = tools.find((t) => targets.includes(t.id));
        if (tool) {
          const plan = itemActionPlan(s, tool.id, true);
          choices.push(
            ...plan.options
              .filter(
                (c) =>
                  plan.effect.action !== "SIGIL" ||
                  !selected.includes(
                    availableSigils(s)[Number(c.id.split(":")[1])].id,
                  ),
              )
              .map((c) => ({
                ...c,
                id: `cost:${plan.effect.action === "SIGIL" ? `physical:${availableSigils(s)[Number(c.id.split(":")[1])].id}` : c.id}`,
                group: "cost",
              })),
          );
          min = 1 + plan.min;
          max = 1 + plan.max;
        }
        break;
      }
    }
  if (min && choices.length < min)
    throw Error("No eligible targets for this immediate effect.");
  return {
    mode,
    adapter,
    quick,
    selected,
    choices,
    min,
    max,
    targetCount: max,
  };
}
export function assertSpellDeparture(s: State, owner: string) {
  const p = s.players.find((h) => h.id === owner)!,
    cap = inventoryCapacities(
      p.inventory,
      [],
      s.blackMirror.heroes[owner]?.hexlocks ?? [],
      s,
      owner,
    );
  if (
    Object.keys(cap).some(
      (k) =>
        p.inventory.filter((t) => carryingSlot(t) === k).length >
        cap[k as keyof typeof cap],
    )
  )
    throw Error("Resolve excess carried objects before moving.");
}
function mosaicConnected(mosaic: (string | null)[], target: number) {
  const filled = mosaic.flatMap((c, i) => (c ? [i] : []));
  filled.push(target);
  const seen = new Set([filled[0]]),
    queue = [filled[0]];
  while (queue.length)
    for (const n of kaleidoscopeCells[queue.shift()!].neighbors)
      if (filled.includes(n) && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
  return seen.size === filled.length;
}
export function validateSpellTargets(
  s: State,
  spell: string,
  action: number,
  targets: string[],
) {
  const plan = spellActivationPlan(s, spell, action, targets),
    chosen = targets.map((id) => plan.choices.find((c) => c.id === id));
  if (
    new Set(targets).size !== targets.length ||
    targets.length < plan.min ||
    targets.length > plan.max ||
    chosen.some((c) => !c)
  )
    throw Error("Choose all valid effect targets before activation.");
  const groups = chosen.map((c) => c!.group),
    op = plan.adapter.operation;
  if (op === "CALM_TOKENS" && new Set(groups).size !== groups.length)
    throw Error("Choose at most one Fear and one Paralysis.");
  if (op === "PULL_TWO" && new Set(chosen.map((c) => c!.room)).size !== 1)
    throw Error("Choose Elements from one room.");
  if (
    op === "EXCHANGE" &&
    (!groups.includes("carried") || !groups.includes("roomElement"))
  )
    throw Error("Choose one carried and one room Element.");
  if (
    op === "REMOTE_WHITE" &&
    (!groups.includes("white") || !groups.includes("room"))
  )
    throw Error("Choose one White Mirror and one destination.");
  if (
    op === "PULL_PAIR" &&
    (!groups.includes("White Mirror") || !groups.includes("Black Mirror"))
  )
    throw Error("Choose one White and one Black Mirror.");
  if (
    op === "TELEPORT_PARTY" &&
    (groups.filter((g) => g === "room").length !== 1 ||
      groups.filter((g) => g === "hero").length > 1)
  )
    throw Error("Choose one destination and at most one invited hero.");
  if (op === "TOOL" && groups.filter((g) => g === "tool").length !== 1)
    throw Error("Choose one Tool and its normal costs.");
  return plan;
}
export function activateSpell(
  s: State,
  spell: string,
  action: number,
  ids: string[],
  targets: string[] = [],
  consented = false,
) {
  const plan = validateSpellTargets(s, spell, action, targets),
    p = s.players[s.active],
    available = availableSigils(s),
    op = plan.adapter.operation;
  if (
    ids.length !== plan.mode.sigil_slots.length ||
    new Set(ids).size !== ids.length ||
    ids.some(
      (id, i) =>
        !available.some(
          (t) =>
            t.id === id &&
            (t.color === plan.mode.sigil_slots[i] || t.color === "Wild"),
        ),
    )
  )
    throw Error(
      "Fill every socket with a distinct matching available physical Sigil.",
    );
  const choice = (group: string) =>
    plan.choices.find((c) => targets.includes(c.id) && c.group === group)!;
  if (op === "TELEPORT_PARTY" && choice("hero") && !consented) {
    s.spells.consent = {
      owner: p.id,
      hero: choice("hero").id,
      spell,
      action,
      sigilIds: ids,
      targets,
      turn: s.turn,
    };
    return;
  }
  const paid = takeSigils(s, p.id, ids).map((token, socket) => ({
    ...token,
    socket,
  }));
  let assignment: State["spells"]["quick"][number] | undefined;
  if (plan.quick) {
    assignment = {
      id: `quick-${s.spells.nextId++}`,
      owner: p.id,
      spell,
      action,
      turn: s.turn,
      sigils: paid,
    };
    s.spells.quick.push(assignment);
    s.spells.usage[`quick:${p.id}:${spell}`] = s.turn;
  } else {
    s.blackMirror.bindings[spell] = paid.map((t) => t.color);
    s.spells.permanentIds[spell] = paid.map((t) => t.id);
    itemReward(
      s,
      p.id,
      "PERMANENT_SIGIL",
      s.rules.itemPolicies.permanentReward === "SIGIL" ? paid.length : 1,
    );
    if (op === "PARALYSIS_IMMUNITY") {
      const status = mutableStatus(s, p.id);
      status.paralysis = [];
      status.immobilized = false;
    }
  }
  const status = mutableStatus(s, p.id);
  const extract = (id: string): Token => {
    for (const pool of [
      p.inventory,
      ...Object.values(s.rooms)
        .filter((r) => r.explored)
        .map((r) => r.objects),
    ]) {
      const i = pool.findIndex((t) => t.id === id);
      if (i >= 0) return pool.splice(i, 1)[0];
    }
    throw Error("Object is no longer accessible.");
  };
  const removeTokens = () => {
    status.fear = status.fear.filter((t) => !targets.includes(t.id));
    status.hexlocks = status.hexlocks.filter((t) => !targets.includes(t.id));
    const removed = status.paralysis.some((id) => targets.includes(id));
    status.paralysis = status.paralysis.filter((id) => !targets.includes(id));
    if (removed && !status.paralysis.length) status.immobilized = false;
  };
  const tryPair = (room: string) => {
    const r = s.rooms[room],
      w = r.objects.find((t) => t.kind === "White Mirror"),
      b = r.objects.find((t) => t.kind === "Black Mirror");
    if (
      room !== "Hall" &&
      !r.restored &&
      !r.pair.length &&
      w &&
      b &&
      !(s.installed && s.rules.onePairPlacementAndOneFlipPerTurn) &&
      !roomActionsBlocked(s, room)
    )
      placeMirrorPair(s, room, w.id, b.id);
  };
  if (plan.quick)
    switch (op) {
      case "FEAR_COURAGE":
        removeTokens();
        gainCourage(s, p.id, 1);
        break;
      case "FEAR_TWO":
      case "HEXLOCK":
      case "CALM_TOKENS":
      case "CLEANSE_TWO":
        removeTokens();
        break;
      case "REMOVE_SEAL":
      case "REMOVE_TWO_SEALS":
        s.blackMirror.seals = s.blackMirror.seals.filter(
          (t) => !targets.includes(t.id),
        );
        break;
      case "CLEANSE_HERO": {
        const h = mutableStatus(s, targets[0]);
        h.fear = [];
        h.hexlocks = [];
        break;
      }
      case "DARKNESS_REWARD":
      case "DARKNESS_NEAR":
      case "DARKNESS_TWO":
        s.blackMirror.rooms[targets[0]].darkness = Math.max(
          0,
          s.blackMirror.rooms[targets[0]].darkness -
            (op === "DARKNESS_TWO" ? 2 : 1),
        );
        if (op === "DARKNESS_REWARD") gainCourage(s, p.id, 1);
        break;
      case "MOVE_ONE":
      case "MOVE_THREE":
      case "TELEPORT_TWO":
      case "TELEPORT_UNRESTORED":
      case "TELEPORT_ANY":
      case "CROSS_SEAL":
        visitRoom(s, p, targets[0]);
        break;
      case "TELEPORT_PARTY": {
        const target = choice("room").id,
          h = choice("hero");
        visitRoom(s, p, target);
        if (h)
          visitRoom(
            s,
            s.players.find((p) => p.id === h.id)!,
            target,
          );
        break;
      }
      case "PULL_MIRROR":
      case "PULL_OBJECT":
      case "PULL_ELEMENT":
      case "PULL_TWO":
      case "PULL_PAIR":
        s.rooms[p.room].objects.push(...targets.map(extract));
        if (op === "PULL_MIRROR" || op === "PULL_PAIR") tryPair(p.room);
        break;
      case "REMOTE_WHITE":
        placeSingleWhite(s, choice("room").id, choice("white").id);
        break;
      case "BURN_ELEMENT":
        s.rooms[p.room].objects.push(extract(targets[0]));
        gainCourage(s, p.id, 3);
        break;
      case "BURN_MIRROR": {
        const t = extract(targets[0]);
        s.rooms[p.room].objects.push(t);
        gainCourage(s, p.id, 3);
        break;
      }
      case "EXCHANGE": {
        const a = choice("carried"),
          b = choice("roomElement"),
          carried = extract(a.id),
          room = extract(b.id);
        p.inventory.push(room);
        s.rooms[b.room!].objects.push(carried);
        break;
      }
      case "VISION":
        s.spells.visions[p.id] = [
          ...new Set([...(s.spells.visions[p.id] ?? []), ...targets]),
        ];
        break;
      case "RECRUIT_NEAR": {
        const t = extract(targets[0]);
        attachCompanion(s, p, t);
        resolveCompanionConflicts(s, p, t.id);
        break;
      }
      case "STEAL_COMPANION": {
        const c = plan.choices.find((c) => c.id === targets[0])!,
          h = s.players.find((h) => h.id === c.group)!;
        const stolen = h.companions.splice(
          h.companions.findIndex((t) => t.id === targets[0]),
          1,
        )[0];
        stolen.originalDiscoverer ??= stolen.discoverer ?? h.id;
        attachCompanion(s, p, stolen);
        resolveCompanionConflicts(s, p, targets[0]);
        break;
      }
      case "OCCULDOR":
        arriveOcculdor(s, targets[0]);
        break;
      case "PORTAL_PAIR":
        assignPortals(s, [p.room, targets[0]]);
        break;
      case "REFRESH_OTHER":
        for (const id of targets) returnOneQuick(s, p.id, id);
        break;
      case "RELOCATE_GLASS": {
        const [a, b] = targets[0].split(":").map(Number);
        s.mosaic[b] = s.mosaic[a];
        s.mosaic[a] = null;
        break;
      }
      case "TOOL":
        applyItemAction(
          s,
          choice("tool").id,
          targets
            .filter((id) => id.startsWith("cost:"))
            .map((id) =>
              id.startsWith("cost:physical:")
                ? `sigil:${availableSigils(s).findIndex((t) => t.id === id.slice(14))}`
                : id.slice(5),
            ),
          s.items.round,
          s.turn,
          true,
        );
        break;
    }
  if (plan.quick && hasSpell(s, "QUICK_RETURN") && assignment?.sigils.length)
    returnOneQuick(s, p.id, assignment.sigils[0].id);
  event(
    s,
    `${p.name} activates ${byId[spell].name} - ${plan.mode.name}. ${plan.quick ? "Remaining Quick Sigils return next owner turn." : "Sigils are permanently bound."}`,
  );
}
export function returnOneQuick(s: State, owner: string, id: string) {
  const q = s.spells.quick.find(
    (q) => q.owner === owner && q.sigils.some((t) => t.id === id),
  );
  if (!q) throw Error("No eligible Quick Sigil.");
  giveSigils(
    s,
    owner,
    q.sigils.splice(
      q.sigils.findIndex((t) => t.id === id),
      1,
    ),
  );
  s.spells.quick = s.spells.quick.filter((q) => q.sigils.length);
}
export function visibleSpellColors(s: State, owner = s.players[s.active].id) {
  const p = s.players.find((p) => p.id === owner)!,
    range = hasSpell(s, "VISION_TWO", owner)
      ? 2
      : hasSpell(s, "VISION_NEAR", owner)
        ? 1
        : 0;
  return [
    ...new Set([
      ...(s.spells.visions[owner] ?? []),
      ...Object.values(s.rooms)
        .filter(
          (r) =>
            range &&
            !r.explored &&
            r.id !== "Hall" &&
            castlePath(s, p.room, r.id, null).length > 1 &&
            castlePath(s, p.room, r.id, null).length <= range + 1,
        )
        .map((r) => r.id),
    ]),
  ];
}
