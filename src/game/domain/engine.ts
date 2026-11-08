import {
  applyMagic,
  victoryReady,
  assertMagic,
  dropGems,
  gemMovement,
  awardDiamondGem,
  type MagicCommand,
} from "../systems/magicResources";
import { magicSchema, createMagic } from "../systems/magicState";
import {
  normalizeCompanions,
  assertCompanions,
  attachCompanion,
  leaveCompanion,
  isCarrier,
} from "../systems/companions";
import { kaleidoscopeGems } from "../map/kaleidoscopeCells";
import { updateTurnSpellOffer } from "../systems/blackMirrorRuntime";
import { hasSpell, roomActionsBlocked } from "../systems/spellModifiers";
import { assignPortals, portalSupply } from "../systems/portals";
import {
  placeSingleWhite,
  placeMirrorPair,
  remoteMirrorAllowed,
} from "../systems/mirrorPlacement";
import { banishmentPlan } from "../systems/banishment";
import { spellStateSchema } from "../systems/spellState";
import {
  normalizeSigilIdentities,
  assertSigils,
  availableSigils,
  takeSigils,
  discardSigils,
  grantSigil,
  settleDeadQuickSigils,
} from "../systems/sigils";
import { activateSpell } from "../systems/spellActivation";
import {
  spellMovement,
  spellReward,
  spellFragmentBonus,
} from "../systems/spellModifiers";
import { kaleidoscopeCells } from "../map/kaleidoscopeCells";
import { revealSecret, assertSecretState } from "../systems/secrets";
import { spellTiers, type SpellTier } from "../cards/secrets";
import { normalizePortals } from "../systems/portals";
import { applyItemAction, assignPermanentSigils } from "../systems/itemActions";
import { resolveCompanionConflicts } from "../systems/companionConflicts";
import { itemStateSchema } from "../systems/itemState";
import { itemMovement, hasItemEffect, rewardFor } from "../systems/itemAccess";
import {
  gainCourage,
  loseCourage,
  itemReward,
  arriveOcculdor,
} from "../systems/courage";
import { z } from "zod";
import { byId, cards, colors, elements } from "../cards/catalog";
import { roomGraph } from "../map/roomGraph";
import {
  defaultRules,
  rulesSchema,
  GameRulesConfig,
} from "../rules/gameRulesConfig";
import { rng, shuffle, generateRoomFindings } from "../setup/seededRng";
import { assertBlackMirrorState } from "../systems/blackMirrorValidation";
import { placementReward, closingGems } from "../map/kaleidoscopeCells";
import { unlockKnowledge } from "../systems/knowledge";
import {
  automaticLearningPlan,
  planLearning,
  learningDiscounts,
  suggestedPayment,
} from "../systems/spells";
import { blackMirrorStateSchema } from "../systems/blackMirrorState";
import { inventoryCapacities } from "../systems/inventoryCapacity";
import { connections, legalThreshold } from "../map/castleConnections";
import {
  abandonSpell,
  advanceEffects,
  beginEffects,
  darkness,
  isImmobilized,
  mutableStatus,
  passTurn,
  statusOf,
  visitRoom,
} from "../systems/blackMirrorRuntime";
const tokenSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "White Mirror",
    "Black Mirror",
    "Element",
    "Item",
    "Spell",
    "Companion",
    "Secret",
  ]),
  element: z.enum(elements).optional(),
  card: z.string().optional(),
  behavior: z.enum(["LOYAL", "STRAY"]).optional(),
  discoverer: z.string().optional(),
  originalDiscoverer: z.string().optional(),
  linkedGroupId: z.string().optional(),
  fearEncounter: z.string().optional(),
});
const heroSchema = z.object({
  id: z.string(),
  name: z.string(),
  room: z.string(),
  courage: z.number().int().min(0).max(35),
  inventory: z.array(tokenSchema),
  knowledge: z.array(z.boolean()).length(4),
  sigils: z.array(z.enum(colors)),
  restored: z.number().int(),
  secrets: z.array(z.string()).default([]),
  completedSecrets: z
    .array(
      z.object({
        id: z.string(),
        turn: z.number().int().positive(),
        reward: z.number().int().positive(),
        rewardType: z.enum(["COURAGE", "DIAMOND_GEM"]).optional(),
        legacy: z.boolean().optional(),
        gained: z.number().int().min(0).max(35),
        tier: z.enum(spellTiers).optional(),
      }),
    )
    .default([]),
  companions: z.array(tokenSchema).default([]),
  spellSlots: z
    .array(z.string().nullable())
    .length(4)
    .default([null, null, null, null]),
  dead: z.boolean().default(false),
});
const roomSchema = z.object({
  id: z.string(),
  explored: z.boolean(),
  color: z.enum(colors).nullable(),
  findings: z.array(tokenSchema),
  objects: z.array(tokenSchema),
  pair: z.array(tokenSchema).default([]),
  restored: z.boolean().default(false),
});
export const stateSchema = z.object({
  version: z.literal(1),
  seed: z.string(),
  players: z.array(heroSchema).min(2).max(5),
  rooms: z.record(z.string(), roomSchema),
  active: z.number().int().min(0),
  turn: z.number().int().positive(),
  moved: z.boolean(),
  privacy: z.boolean(),
  phase: z.enum(["PREPARE", "POST_MOVE_ACTIONS"]),
  rage: z.number().int(),
  occuldor: z.string(),
  decks: z.record(z.string(), z.array(z.string())),
  log: z.array(
    z.object({ id: z.number(), turn: z.number(), text: z.string() }),
  ),
});
export const gameSchema = stateSchema.extend({
  magic: magicSchema,
  spells: spellStateSchema,
  blackMirror: blackMirrorStateSchema,
  items: itemStateSchema,
  rulesRevision: z.literal(3).default(3),
  rules: rulesSchema.default(defaultRules),
  installed: z.boolean().default(false),
  flipped: z.boolean().default(false),
  removed: z.array(tokenSchema).default([]),
  spentElements: z.array(tokenSchema).default([]),
  gemOwners: z.record(z.string(), z.string()).default({}),
  mosaic: z
    .array(z.enum(colors).nullable())
    .length(35)
    .default(Array(35).fill(null)),
  pending: z
    .object({
      room: z.string(),
      card: z.string(),
      stage: z.enum(["penalty", "placement", "after"]),
      committed: z.boolean().optional(),
      skipped: z.boolean().optional(),
    })
    .nullable()
    .default(null),
  outcome: z.enum(["playing", "victory", "defeat"]).default("playing"),
  manualNotes: z
    .array(z.object({ player: z.string(), text: z.string(), turn: z.number() }))
    .default([]),
});
export type State = z.infer<typeof gameSchema>;
export type Token = z.infer<typeof tokenSchema>;
export type Command =
  | MagicCommand
  | { type: "PLACE_WHITE"; playerId: string; roomId: string; whiteId: string }
  | { type: "SPELL_CONSENT"; playerId: string; accept: boolean }
  | { type: "SPELL_PORTAL"; playerId: string; accept: boolean }
  | {
      type: "CAST_SPELL";
      playerId: string;
      spellId: string;
      action: number;
      sigilIds: string[];
      targets?: string[];
    }
  | {
      type: "REVEAL_SECRET";
      playerId: string;
      secretId: string;
      tier?: SpellTier;
    }
  | { type: "BANISH_OCCULDOR"; playerId: string }
  | {
      type: "USE_ITEM";
      playerId: string;
      itemId: string;
      ids: string[];
      round: number;
      turn: number;
    }
  | { type: "SET_BOOTS"; playerId: string; bonus: number }
  | { type: "BIND_SIGILS"; playerId: string; spellId: string; action: number }
  | { type: "CURSE_CHOICE"; playerId: string; choiceId: string; ids: string[] }
  | { type: "CLEAR_DARKNESS"; playerId: string }
  | { type: "RECRUIT"; playerId: string; tokenId: string }
  | { type: "MOVE"; playerId: string; path: string[] }
  | {
      type: "TRANSFER";
      playerId: string;
      tokenId: string;
      direction: "take" | "leave";
    }
  | {
      type: "END" | "REVEAL" | "COLLIDE" | "CONFRONT";
      roomId?: string;
      playerId: string;
    }
  | {
      type: "PLACE_MIRRORS";
      roomId?: string;
      playerId: string;
      whiteId: string;
      blackId: string;
    }
  | {
      type: "LEARN";
      elementIds?: string[];
      discount?: (typeof elements)[number];
      playerId: string;
      spellId: string;
    }
  | { type: "LEAVE_SPELL"; playerId: string; spellId: string }
  | {
      type: "CONTINUE_COLLISION";
      playerId: string;
      penalty: "apply" | "skip";
    }
  | { type: "PLACE"; playerId: string; cell: number };
export const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MAGIC"),
    playerId: z.string(),
    action: z.enum([
      "TAKE",
      "LEAVE",
      "GIVE",
      "BREAK_PARALYSIS",
      "REMOVE_HEXLOCK",
      "PASSAGE",
      "SWIFT",
      "INSTALL_GEM",
      "INSTALL_WILD",
    ]),
    resource: z.string(),
    target: z.string().optional(),
  }),
  z.object({
    type: z.literal("PLACE_WHITE"),
    playerId: z.string(),
    roomId: z.string(),
    whiteId: z.string(),
  }),
  z.object({
    type: z.literal("SPELL_CONSENT"),
    playerId: z.string(),
    accept: z.boolean(),
  }),
  z.object({
    type: z.literal("SPELL_PORTAL"),
    playerId: z.string(),
    accept: z.boolean(),
  }),
  z.object({
    type: z.literal("CAST_SPELL"),
    playerId: z.string(),
    spellId: z.string(),
    action: z.number().int().min(0),
    sigilIds: z.array(z.string()),
    targets: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal("REVEAL_SECRET"),
    playerId: z.string(),
    secretId: z.string(),
    tier: z.enum(spellTiers).optional(),
  }),
  z.object({ type: z.literal("BANISH_OCCULDOR"), playerId: z.string() }),
  z.object({
    type: z.literal("USE_ITEM"),
    playerId: z.string(),
    itemId: z.string(),
    ids: z.array(z.string()),
    round: z.number().int(),
    turn: z.number().int(),
  }),
  z.object({
    type: z.literal("SET_BOOTS"),
    playerId: z.string(),
    bonus: z.number().int().min(0).max(3),
  }),
  z.object({
    type: z.literal("BIND_SIGILS"),
    playerId: z.string(),
    spellId: z.string(),
    action: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("CURSE_CHOICE"),
    playerId: z.string(),
    choiceId: z.string(),
    ids: z.array(z.string()),
  }),
  z.object({ type: z.literal("CLEAR_DARKNESS"), playerId: z.string() }),
  z.object({
    type: z.literal("RECRUIT"),
    playerId: z.string(),
    tokenId: z.string(),
  }),
  z.object({
    type: z.literal("LEARN"),
    elementIds: z.array(z.string()).optional(),
    discount: z.enum(elements).optional(),
    playerId: z.string(),
    spellId: z.string(),
  }),
  z.object({
    type: z.literal("LEAVE_SPELL"),
    playerId: z.string(),
    spellId: z.string(),
  }),
  z.object({
    type: z.literal("MOVE"),
    playerId: z.string(),
    path: z.array(z.string()).min(2),
  }),
  z.object({
    type: z.literal("TRANSFER"),
    playerId: z.string(),
    tokenId: z.string(),
    direction: z.enum(["take", "leave"]),
  }),
  ...(["END", "REVEAL", "COLLIDE", "CONFRONT"] as const).map((type) =>
    z.object({
      type: z.literal(type),
      playerId: z.string(),
      roomId: z.string().optional(),
    }),
  ),
  z.object({
    type: z.literal("PLACE_MIRRORS"),
    roomId: z.string().optional(),
    playerId: z.string(),
    whiteId: z.string().min(1),
    blackId: z.string().min(1),
  }),
  z.object({
    type: z.literal("CONTINUE_COLLISION"),
    playerId: z.string(),
    penalty: z.enum(["apply", "skip"]),
  }),
  z.object({
    type: z.literal("PLACE"),
    playerId: z.string(),
    cell: z.number().int().min(0).max(34),
  }),
]);
export function initialState(
  names: string[],
  seed: string,
  rules: GameRulesConfig = defaultRules,
): State {
  z.array(z.string().trim().min(1).max(30)).min(2).max(5).parse(names);
  if (!seed.trim()) throw Error("Enter a seed");
  rules = rulesSchema.parse(rules);
  const random = rng(seed),
    patterns = shuffle(generateRoomFindings(), random),
    fragments = shuffle(
      colors.flatMap((c) => Array(7).fill(c) as (typeof colors)[number][]),
      random,
    );
  const white = shuffle(
      cards.filter((c) => c.family === "White Mirror"),
      random,
    ),
    black = shuffle(
      cards.filter((c) => c.family === "Black Mirror"),
      random,
    );
  const bag = shuffle(
    elements.flatMap((e) =>
      Array.from({ length: 14 }, (_, i) => ({
        id: `E-${e}-${i + 1}`,
        kind: "Element" as const,
        element: e,
      })),
    ),
    random,
  );
  const rooms: State["rooms"] = {
    Hall: {
      id: "Hall",
      explored: true,
      color: null,
      findings: [],
      objects: [],
      pair: [],
      restored: false,
    },
  };
  Object.keys(roomGraph)
    .filter((id) => id !== "Hall")
    .forEach((id, i) => {
      const findings: Token[] = patterns[i].map((n) => {
        if (n > 1) return bag.pop()!;
        const c = (n === 0 ? black : white).pop()!;
        return { id: c.id, card: c.id, kind: c.family as Token["kind"] };
      });
      rooms[id] = {
        id,
        explored: false,
        color: fragments[i],
        findings,
        objects: [],
        pair: [],
        restored: false,
      };
    });
  return {
    magic: createMagic(names.map((_, i) => `P${i + 1}`)),
    spells: {
      ...spellStateSchema.parse(undefined),
      identityReady: true,
      availableIds: Object.fromEntries(names.map((_, i) => [`P${i + 1}`, []])),
    },
    blackMirror: blackMirrorStateSchema.parse(undefined),
    items: itemStateSchema.parse(undefined),
    version: 1,
    rulesRevision: 3,
    seed,
    rules,
    players: names.map((name, i) => ({
      id: `P${i + 1}`,
      name: name.trim(),
      room: "Hall",
      courage: rules.startingCourage,
      inventory: [],
      knowledge: [false, false, false, false],
      sigils: [],
      restored: 0,
      secrets: [],
      completedSecrets: [],
      companions: [],
      spellSlots: [null, null, null, null],
      dead: false,
    })),
    rooms,
    active: 0,
    turn: 1,
    moved: false,
    privacy: false,
    phase: "PREPARE",
    rage: 0,
    occuldor: "Hall",
    decks: Object.fromEntries(
      ["Item", "Spell", "Companion", "Secret"].map((f) => [
        f,
        shuffle(
          cards.filter((c) => c.family === f).map((c) => c.id),
          random,
        ),
      ]),
    ),
    log: [
      {
        id: 1,
        turn: 1,
        text: "A fallen mug. A shattered prison. Occuldor awakens in the Mirror Hall.",
      },
    ],
    installed: false,
    flipped: false,
    removed: [],
    spentElements: [],
    gemOwners: {},
    mosaic: Array(35).fill(null),
    pending: null,
    outcome: "playing",
    manualNotes: [],
  };
}
export const movement = (s: State) =>
  gemMovement(s) +
  itemMovement(s) +
  spellMovement(
    s,
    s.players[s.active].id,
    s.rules.movement[
      Math.max(
        0,
        Math.min(4, Math.floor((s.players[s.active].courage - 1) / 7)),
      )
    ],
  );
export const capacities = inventoryCapacities;
function checkCapacity(
  inventory: Token[],
  local: Token[] = [],
  locks: ReturnType<typeof statusOf>["hexlocks"] = [],
  s?: State,
  owner = s?.players[s.active].id,
) {
  const cap = capacities(inventory, local, locks, s, owner);
  inventory = [
    ...inventory,
    ...(s?.players.find((p) => p.id === owner)?.companions.filter(isCarrier) ??
      []),
  ];
  const groups = {
    mirrors: inventory.filter((t) => t.kind.endsWith("Mirror")),
    elements: inventory.filter((t) => t.kind === "Element"),
    items: inventory.filter(
      (t) =>
        isCarrier(t) ||
        (t.kind === "Item" && byId[t.card!]?.subtype !== "Relic"),
    ),
    relics: inventory.filter((t) => byId[t.card!]?.subtype === "Relic"),
  };
  for (const slot of ["elements", "mirrors", "items", "relics"] as const)
    if (groups[slot].length > cap[slot])
      throw Error(
        `Carrying capacity: ${groups[slot].length} ${slot}, but only ${cap[slot]} usable slots. Carried Items grant expansions; Hexlocks block slots. Leave ${groups[slot].length - cap[slot]} ${slot} in this room before continuing.`,
      );
}
/** Shared transfer preview for the engine and take/leave controls. */
export function planTransfer(
  s: State,
  tokenId: string,
  direction: "take" | "leave",
) {
  const hero = s.players[s.active];
  if (roomActionsBlocked(s, hero.room, hero.id))
    throw Error("Clear all Darkness before using room objects.");
  const inventory = [...hero.inventory],
    objects = [...s.rooms[hero.room].objects];
  const from = direction === "take" ? objects : inventory;
  const to = direction === "take" ? inventory : objects;
  const index = from.findIndex((token) => token.id === tokenId);
  if (index < 0) throw Error("That object is not accessible here.");
  const token = from[index];
  if (
    direction === "take" &&
    token.kind.endsWith("Mirror") &&
    s.items.restrictions[hero.id]?.mirrors === hero.room
  )
    throw Error(
      "Mirror Offering prevents taking mirrors until you leave this room.",
    );
  if (["Spell", "Secret", "Companion"].includes(token.kind))
    throw Error("This card requires its dedicated action.");
  from.splice(index, 1);
  to.push(token);
  if (direction === "take")
    checkCapacity(
      inventory,
      objects,
      statusOf(s, hero.id).hexlocks,
      s,
      hero.id,
    );
  return { inventory, objects, token };
}
export function reduce(state: State, command: Command): State {
  command = commandSchema.parse(command);
  const s = structuredClone(state),
    p = s.players[s.active],
    r = s.rooms[p.room];
  normalizeCompanions(s);
  normalizeSigilIdentities(s);
  if (
    command.playerId !== p.id &&
    !(
      command.type === "SPELL_CONSENT" &&
      s.spells.consent?.hero === command.playerId
    )
  )
    throw Error("Only the active hero may act.");
  if (s.spells.consent && !["SPELL_CONSENT", "REVEAL"].includes(command.type))
    throw Error("The invited hero must accept or decline first.");
  if (command.type === "REVEAL") {
    s.privacy = false;
    return s;
  }
  if (s.privacy) throw Error("Pass the screen to the next hero first.");
  if (
    s.spells.portalOffer &&
    !["SPELL_PORTAL", "CURSE_CHOICE"].includes(command.type)
  )
    throw Error("Accept or skip the turn-start Portal first.");
  if (s.outcome !== "playing") throw Error("This expedition has ended.");
  if (
    s.blackMirror.resolution?.effects.length &&
    command.type !== "CURSE_CHOICE"
  )
    throw Error("Resolve the current curse or start-of-turn choice first.");
  if (
    s.pending &&
    !["CONTINUE_COLLISION", "PLACE", "CURSE_CHOICE", "CAST_SPELL"].includes(
      command.type,
    )
  )
    throw Error("Finish the penalty popup and fragment placement first.");
  if (
    p.dead &&
    !["END", "PLACE", "CURSE_CHOICE", "CONTINUE_COLLISION"].includes(
      command.type,
    )
  )
    throw Error("This hero is eliminated. End their turn.");
  if (
    roomActionsBlocked(s, p.room) &&
    [
      "TRANSFER",
      "LEARN",
      "LEAVE_SPELL",
      "PLACE_MIRRORS",
      "PLACE_WHITE",
      "COLLIDE",
      "CONFRONT",
      "RECRUIT",
    ].includes(command.type)
  )
    throw Error("Remove all Darkness before ordinary room actions.");
  const log = (text: string) =>
    s.log.push({ id: s.log.length + 1, turn: s.turn, text });
  const deaths = () => {
    for (const hero of s.players)
      if (hero.courage === 0 && !hero.dead) {
        hero.dead = true;
        settleDeadQuickSigils(s, hero.id);
        // Provisional: surviving heroes inherit expiry responsibility so abandoned seals cannot become permanent.
        for (const seal of s.blackMirror.seals.filter(
          (seal) => seal.owner === hero.id,
        )) {
          const successor =
            s.players.find(
              (other) =>
                other.courage > 0 && other.spellSlots.includes(seal.spell),
            ) ?? s.players.find((other) => other.courage > 0);
          if (successor) seal.owner = successor.id;
        }
        for (const id of [...hero.spellSlots])
          if (id) abandonSpell(s, hero, id);
        s.rooms[hero.room].objects.push(...hero.inventory);
        for (const t of [...hero.companions])
          if (hero.companions.some((x) => x.id === t.id))
            leaveCompanion(s, t, hero.room);
        hero.inventory = [];
        hero.companions = [];
        dropGems(s, hero.id, hero.room);
        hero.spellSlots = [null, null, null, null];
        log(
          `${hero.name} falls. Their carried objects remain in ${hero.room}.`,
        );
      }
    if (s.players.every((h) => h.dead) && !s.pending) s.outcome = "defeat";
  };
  const completeCollision = () => {
    const pending = s.pending!;
    if (pending.committed !== false) return;
    const origin = s.rooms[pending.room];
    origin.restored = true;
    s.removed.push(...origin.pair);
    origin.pair = [];
    s.rage++;
    p.restored++;
    grantSigil(s, p.id, origin.color!);
    if (hasSpell(s, "COLLISION_REWARD")) gainCourage(s, p.id, 1);
    const candidates = unlockKnowledge(p, s.rules.orderedKnowledge);
    for (let i = 0; i < 4; i++) {
      if (candidates[i])
        log(`${p.name}: Knowledge achievement ${i + 1} condition met.`);
    }
    pending.stage = "penalty";
    pending.committed = true;
    log(
      `${p.name} restores ${origin.id}, receives one ${origin.color} Sigil. Rage rises to ${s.rage}.`,
    );
  };
  const finishEffects = () => {
    const resolution = s.blackMirror.resolution;
    deaths();
    if (!resolution || resolution.effects.length) return;
    const phase = resolution.phase,
      endTurn = resolution.endTurn;
    s.blackMirror.resolution = null;
    if (phase === "refresh") updateTurnSpellOffer(s);
    if (phase === "immediate") {
      completeCollision();
      s.pending!.stage = "placement";
    } else if (phase === "after") {
      spellReward(s, p.id, "CURSE_ROUND_REWARD");
      s.spells.buffs = s.spells.buffs.filter(
        (b) => b.owner !== p.id || b.kind !== "CURSE_SHIELD",
      );
      s.spells.afterCurse = { owner: p.id, turn: s.turn };
      s.pending = null;
      if (victoryReady(s)) s.outcome = "victory";
      else {
        deaths();
        if (endTurn) passTurn(s);
      }
    }
  };
  if (command.type !== "CAST_SPELL") s.spells.afterCurse = null;
  if (command.type === "SPELL_CONSENT") {
    const request = s.spells.consent;
    if (
      !request ||
      request.hero !== command.playerId ||
      request.owner !== p.id ||
      request.turn !== s.turn
    )
      throw Error("Only the invited hero may consent to this pending journey.");
    s.spells.consent = null;
    if (command.accept) {
      activateSpell(
        s,
        request.spell,
        request.action,
        request.sigilIds,
        request.targets,
        true,
      );
      deaths();
    }
  } else if (command.type === "SPELL_PORTAL") {
    const offer = s.spells.portalOffer;
    if (!offer || offer.owner !== p.id || offer.turn !== s.turn)
      throw Error("No turn-start Portal offer.");
    if (command.accept) {
      if (
        !hasSpell(s, "TURN_PORTAL") ||
        s.blackMirror.rooms[p.room]?.portal ||
        portalSupply(s) < 1
      )
        throw Error("Portal placement is no longer available.");
      assignPortals(s, [p.room]);
    }
    s.spells.portalOffer = null;
  } else if (command.type === "CAST_SPELL") {
    activateSpell(
      s,
      command.spellId,
      command.action,
      command.sigilIds,
      command.targets,
    );
    s.spells.afterCurse = null;
    deaths();
  } else if (command.type === "MAGIC") {
    applyMagic(s, command);
    if (victoryReady(s)) s.outcome = "victory";
  } else if (command.type === "REVEAL_SECRET") {
    revealSecret(s, command.playerId, command.secretId, command.tier);
  } else if (command.type === "BANISH_OCCULDOR") {
    const ids = banishmentPlan(s);
    discardSigils(
      s,
      takeSigils(
        s,
        p.id,
        ids.map((i) => availableSigils(s, p.id)[i].id),
      ),
    );
    s.occuldor = "Hall";
    log(
      `${p.name} spends five different Sigils to banish Occuldor to the Mirror Hall, freeing his guarded mirror.`,
    );
  } else if (command.type === "USE_ITEM") {
    applyItemAction(
      s,
      command.itemId,
      command.ids,
      command.round,
      command.turn,
    );
    resolveCompanionConflicts(s, p);
    beginEffects(s, command.itemId, "item", [{ op: "CAPACITY" }]);
    advanceEffects(s);
    finishEffects();
  } else if (command.type === "SET_BOOTS") {
    if (
      s.moved ||
      !hasItemEffect(s, "MOVEMENT") ||
      ![...p.inventory, ...r.objects].some((t) => t.card === "IT-04")
    )
      throw Error(
        "Choose the Boots bonus before movement with the Boots accessible.",
      );
    s.items.boots[p.id] = command.bonus;
  } else if (command.type === "BIND_SIGILS") {
    assignPermanentSigils(s, command.spellId, command.action);
  } else if (command.type === "CURSE_CHOICE") {
    advanceEffects(s, { choiceId: command.choiceId, ids: command.ids });
    finishEffects();
  } else if (command.type === "CLEAR_DARKNESS") {
    if (!darkness(s, p.room)) throw Error("This room has no Darkness.");
    s.blackMirror.rooms[p.room].darkness--;
    loseCourage(s, p.id, 1, { cost: true });
    log(
      `${p.name} spends 1 Courage to remove one Darkness Token in ${p.room}.`,
    );
    deaths();
  } else if (command.type === "RECRUIT") {
    if (s.items.restrictions[p.id]?.companions === p.room)
      throw Error("Farewell Whistle prevents recruiting until departure.");
    const i = r.objects.findIndex(
      (t) => t.id === command.tokenId && t.kind === "Companion",
    );
    if (i < 0) throw Error("Choose a Companion in your current room.");
    const companion = r.objects[i];
    if (
      (companion.behavior ?? "LOYAL") === "LOYAL" &&
      companion.discoverer &&
      companion.discoverer !== p.id &&
      !s.rules.blackMirrorPolicies.recruitedLoyalChangesOwner
    )
      throw Error("This Loyal Companion awaits its original discoverer.");
    companion.originalDiscoverer ??= companion.discoverer ?? p.id;
    attachCompanion(s, p, companion);
    if ((companion.behavior ?? "LOYAL") === "LOYAL")
      companion.discoverer = p.id;
    log(`${p.name} recruits ${byId[companion.card!].name}.`);
    resolveCompanionConflicts(s, p, companion.id);
  } else if (command.type === "MOVE") {
    const path = z.array(z.string()).min(2).parse(command.path);
    if (
      s.moved ||
      isImmobilized(s, p.id) ||
      path[0] !== p.room ||
      path.at(-1) === p.room ||
      path.length - 1 > movement(s) ||
      path.some(
        (id, i) =>
          !roomGraph[id] ||
          (i > 0 && !connections(s, path[i - 1]).includes(id)),
      )
    )
      throw Error("Choose a connected path within your movement allowance.");
    checkCapacity(p.inventory, [], statusOf(s, p.id).hexlocks, s, p.id);
    visitRoom(s, p, path.at(-1)!);
    s.moved = true;
    s.phase = "POST_MOVE_ACTIONS";
    if (path.length === 3) spellReward(s, p.id, "TWO_STEP_REWARD");
    const target = s.rooms[p.room];
    log(`${p.name} moves ${path.join(" → ")}.`);
    if (!target.explored) {
      target.explored = true;
      target.objects = structuredClone(target.findings);
      log(
        `${p.name} explores ${p.room}: ${target.color} fragment and four findings revealed.`,
      );
    }
  } else if (command.type === "TRANSFER") {
    const { inventory, objects, token } = planTransfer(
      s,
      command.tokenId,
      command.direction,
    );
    p.inventory = inventory;
    r.objects = objects;
    if (token.kind === "Item") resolveCompanionConflicts(s, p);
    if (command.direction === "leave") {
      beginEffects(
        s,
        token.kind === "Item" ? token.card! : "INVENTORY",
        "inventory",
        [{ op: "CAPACITY" }],
      );
      advanceEffects(s);
      finishEffects();
    }
    log(
      `${p.name} ${command.direction === "take" ? "takes" : "leaves"} ${token.kind === "Black Mirror" ? "Black Mirror" : (token.element ?? byId[token.card!]?.name ?? token.kind)}.`,
    );
  } else if (command.type === "LEARN") {
    const auto = automaticLearningPlan(s, command.spellId);
    if (
      learningDiscounts(s, command.spellId).filter(Boolean).length > 1 &&
      !command.discount
    )
      throw Error(
        "Choose the printed Element requirement discounted by your Grimoire.",
      );
    const discount = command.discount ?? auto.discount;
    const plan = {
      slot: auto.slot,
      ...planLearning(
        s,
        command.spellId,
        auto.slot,
        command.elementIds ?? suggestedPayment(s, command.spellId, discount),
        discount,
      ),
    };
    for (const id of plan.elementIds) {
      const source = r.objects.some((t) => t.id === id)
        ? r.objects
        : p.inventory;
      s.spentElements.push(
        ...source.splice(
          source.findIndex((t) => t.id === id),
          1,
        ),
      );
    }
    if (plan.toolId && s.rules.consumeLearningTool) {
      const source = [
        p.inventory,
        ...Object.values(s.rooms).map((r) => r.objects),
      ].find((pool) => pool.some((t) => t.id === plan.toolId))!;
      s.removed.push(
        ...source.splice(
          source.findIndex((t) => t.id === plan.toolId),
          1,
        ),
      );
    }
    p.inventory.push(
      ...r.objects.splice(
        r.objects.findIndex((t) => t.id === command.spellId),
        1,
      ),
    );
    p.spellSlots[plan.slot] = command.spellId;
    checkCapacity(p.inventory, r.objects, statusOf(s, p.id).hexlocks, s, p.id);
    log(
      `${p.name} learns ${byId[command.spellId].name} in Knowledge slot ${plan.slot + 1}, spending ${byId[command.spellId].learn_elements!.join(" + ")}.`,
    );
  } else if (command.type === "LEAVE_SPELL") {
    const slot = p.spellSlots.indexOf(command.spellId);
    const index = p.inventory.findIndex(
      (t) => t.id === command.spellId && t.kind === "Spell",
    );
    if (slot < 0 || index < 0)
      throw Error("Only an equipped Spell can be left in your current room.");
    abandonSpell(s, p, command.spellId);
    beginEffects(s, "INVENTORY", "inventory", [{ op: "CAPACITY" }]);
    advanceEffects(s);
    finishEffects();
    log(
      `${p.name} leaves ${byId[command.spellId].name}. Learning Elements are not refunded.`,
    );
  } else if (command.type === "PLACE_WHITE") {
    if (!remoteMirrorAllowed(s, command.roomId))
      throw Error("No remote Mirror permission.");
    placeSingleWhite(s, command.roomId, command.whiteId);
    deaths();
  } else if (command.type === "PLACE_MIRRORS") {
    const target = command.roomId ?? p.room;
    if (!remoteMirrorAllowed(s, target))
      throw Error("No permission for remote Mirror placement.");
    placeMirrorPair(s, target, command.whiteId, command.blackId);
    deaths();
  } else if (command.type === "COLLIDE") {
    const target = command.roomId ?? p.room;
    if (!remoteMirrorAllowed(s, target, true))
      throw Error("No permission for remote Collide.");
    const r = s.rooms[target];
    if (roomActionsBlocked(s, target))
      throw Error("Remove target room Darkness first.");
    if (
      r.pair.length !== 2 ||
      s.occuldor === r.id ||
      r.restored ||
      (s.flipped && s.rules.onePairPlacementAndOneFlipPerTurn)
    )
      throw Error(
        "Collide only an unblocked placed pair in your current room, within the configured action limit.",
      );
    s.flipped = true;
    const card = r.pair.find((t) => t.kind === "Black Mirror")!.card!;
    s.pending = { room: r.id, card, stage: "penalty", committed: false };
    if (!s.blackMirror.revealed.includes(card))
      s.blackMirror.revealed.push(card);
    log(
      `${p.name} begins Collide and flips ${byId[card].name}: ${byId[card].effect}`,
    );
  } else if (command.type === "CONTINUE_COLLISION") {
    if (s.pending?.stage !== "penalty")
      throw Error("No collision penalty is awaiting a choice.");
    if (command.penalty === "skip") {
      if (!s.rules.blackMirrorPolicies.allowSkip)
        throw Error("Black Mirror curses must be resolved in this game.");
      log(
        `${p.name} skips ${s.pending.card}'s penalty under the optional playtest rule.`,
      );
      completeCollision();
      s.pending.stage = "placement";
      s.pending.skipped = true;
    } else {
      beginEffects(s, s.pending.card, "immediate");
      advanceEffects(s);
      finishEffects();
    }
  } else if (command.type === "PLACE") {
    if (s.pending?.stage !== "placement")
      throw Error("No fragment is awaiting placement.");
    const color = s.rooms[s.pending.room].color!,
      reward =
        placementReward(
          s.mosaic,
          command.cell,
          color,
          hasItemEffect(s, "FREE_FRAGMENT") || hasSpell(s, "FREE_GLASS"),
          Object.keys(s.gemOwners),
        ) +
        rewardFor(s, "FRAGMENT") +
        spellFragmentBonus(
          s,
          p.id,
          kaleidoscopeCells[command.cell].neighbors.some(
            (n) => !!s.mosaic[n] && s.mosaic[n] !== color,
          ),
        );
    s.mosaic[command.cell] = color;
    gainCourage(s, p.id, reward);
    log(
      `${p.name} places ${color} in cell ${command.cell + 1}: ${p.dead ? "no Courage awarded to an eliminated hero" : `+${reward} Courage`}.`,
    );
    s.pending.stage = "after";
    beginEffects(
      s,
      s.pending.card,
      "after",
      s.pending.skipped ? [] : undefined,
    );
    advanceEffects(s);
    finishEffects();
  } else if (command.type === "CONFRONT") {
    if (
      r.id !== s.occuldor ||
      r.pair.length !== 2 ||
      Object.values(s.rooms).filter(
        (room) => room.id !== "Hall" && !room.restored,
      ).length !== 1
    )
      throw Error("Confront is only available for the final unrestored room.");
    loseCourage(s, p.id, s.rules.confrontCost, { cost: true });
    s.occuldor = "Hall";
    log(
      `${p.name} confronts Occuldor: −${s.rules.confrontCost} Courage. Final mirror freed (provisional).`,
    );
    deaths();
  } else if (command.type === "END") {
    if (!s.moved && !p.dead && !isImmobilized(s, p.id))
      throw Error("Mandatory movement must be completed first.");
    checkCapacity(p.inventory, r.objects, statusOf(s, p.id).hexlocks, s, p.id);
    passTurn(s);
  }
  normalizeCompanions(s);
  assertState(s);
  return s;
}
export function assertState(s: State) {
  gameSchema.parse(s);
  assertCompanions(s);
  assertSigils(s);
  assertMagic(s);
  assertSecretState(s);
  assertBlackMirrorState(s);
  const heroIds = new Set(s.players.map((p) => p.id));
  for (const [hero, uses] of Object.entries(s.items.used))
    if (
      !heroIds.has(hero) ||
      Object.entries(uses).some(
        ([id, round]) => byId[id]?.subtype !== "Tool" || round > s.items.round,
      )
    )
      throw Error("Invalid Item usage ledger.");
  if (
    Object.keys(s.items.boots).some((id) => !heroIds.has(id)) ||
    Object.entries(s.items.restrictions).some(
      ([id, r]) =>
        !heroIds.has(id) || Object.values(r).some((room) => !s.rooms[room]),
    )
  )
    throw Error("Invalid Item owner or restriction room.");
  if (
    s.active >= s.players.length ||
    Object.keys(s.rooms).length !== 36 ||
    Object.keys(roomGraph).some((id) => !s.rooms[id])
  )
    throw Error("Invalid board or active player");
  const physical = [
    ...Object.values(s.rooms).flatMap((r) => [
      ...(r.explored ? r.objects : r.findings),
      ...r.pair,
    ]),
    ...s.players.flatMap((p) => p.inventory),
    ...s.removed,
    ...s.spentElements,
  ].filter((t) => t.kind.endsWith("Mirror") || t.kind === "Element");
  if (
    physical.length !== 140 ||
    new Set(physical.map((t) => t.id)).size !== 140
  )
    throw Error("Physical supply corrupted");
  const expected = new Set([
    ...cards.filter((c) => c.family.endsWith("Mirror")).map((c) => c.id),
    ...elements.flatMap((e) =>
      Array.from({ length: 14 }, (_, i) => `E-${e}-${i + 1}`),
    ),
  ]);
  for (const token of physical) {
    if (!expected.has(token.id)) throw Error("Unknown physical token");
    if (token.kind === "Element" && !token.id.startsWith(`E-${token.element}-`))
      throw Error("Element type corrupted");
    if (
      token.kind.endsWith("Mirror") &&
      (token.card !== token.id || byId[token.id]?.family !== token.kind)
    )
      throw Error("Mirror identity corrupted");
  }
  for (const color of colors)
    if (Object.values(s.rooms).filter((r) => r.color === color).length !== 7)
      throw Error("Fragment supply corrupted");
  if (!s.rooms[s.occuldor]) throw Error("Invalid Occuldor location");
  if (
    s.pending &&
    (!s.rooms[s.pending.room] ||
      byId[s.pending.card]?.family !== "Black Mirror")
  )
    throw Error("Invalid pending resolution");
  if (s.spentElements.some((t) => t.kind !== "Element"))
    throw Error("Only Elements belong in the spent pool.");
  const attached = s.players.flatMap((p) => p.companions);
  if (
    new Set(attached.map((t) => t.id)).size !== attached.length ||
    attached.some(
      (t) => t.kind !== "Companion" || byId[t.card!]?.family !== "Companion",
    )
  )
    throw Error("Invalid attached Companion.");
  for (const p of s.players) {
    if (!s.rooms[p.room]) throw Error("Invalid hero location");
    const equipped = p.spellSlots.filter((id) => id !== null);
    if (
      new Set(equipped).size !== equipped.length ||
      p.spellSlots.some(
        (id, i) =>
          id &&
          (!p.knowledge[i] ||
            !p.inventory.some((t) => t.id === id && t.kind === "Spell")),
      )
    )
      throw Error("Invalid Spell Knowledge assignment.");
  }
  if (
    s.rage !== Object.values(s.rooms).filter((r) => r.restored).length ||
    s.rage !==
      s.mosaic.filter(Boolean).length +
        (s.pending &&
        s.pending.committed !== false &&
        s.pending.stage !== "after"
          ? 1
          : 0)
  )
    throw Error("Restoration count corrupted");
}
export function loadSave(raw: string): State {
  const stored = JSON.parse(raw);
  if (stored.gemOwners === undefined)
    stored.gemOwners = Object.fromEntries(
      kaleidoscopeGems
        .filter((g) => g.cells.every((i) => stored.mosaic?.[i]))
        .map((g) => [g.id, "legacy-unknown"]),
    );
  if (stored.spells && stored.spells.version !== 4) {
    stored.spells.version = 4;
    stored.spells.buffs = [];
    stored.spells.afterCurse = null;
  }
  const revision = stored.rulesRevision;
  if (revision === undefined || revision < 3) {
    stored.rulesRevision = 3;
    if (stored.rules) stored.rules.onePairPlacementAndOneFlipPerTurn = false;
    // Older pending curses had not committed restoration or awarded the Sigil.
    if (stored.pending?.stage === "curse") {
      const origin = stored.rooms[stored.pending.room];
      const hero = stored.players[stored.active];
      origin.restored = true;
      stored.removed = [...(stored.removed ?? []), ...origin.pair];
      origin.pair = [];
      stored.rage++;
      hero.restored++;
      hero.sigils.push(origin.color);
      if (stored.spells) stored.spells.identityReady = false;
      stored.pending.stage = "penalty";
    }
  }
  if (!stored.items)
    stored.items = {
      ...itemStateSchema.parse(undefined),
      round: Math.floor((stored.turn - 1) / stored.players.length) + 1,
    };
  const migrateMagic = !stored.magic;
  if (migrateMagic) {
    stored.magic = createMagic(stored.players.map((p: { id: string }) => p.id));
    stored.gemOwners = {};
  }
  const s = gameSchema.parse(stored);
  if (migrateMagic) {
    s.log.push({
      id: s.log.length + 1,
      turn: s.turn,
      text: "Updated to Secrets/Gems v0.6: preserved past Courage and completed achievements, released their reserved Gems, and added one starting Wild Sigil per hero. Previously enclosed gaps now await resource installation.",
    });
    for (const p of s.players)
      for (const completed of p.completedSecrets) {
        completed.legacy = true;
        if (Number(completed.id.slice(3)) <= 10)
          awardDiamondGem(s, completed.id, p.id);
      }
  }
  if (stored.spells?.identityReady) assertSigils(s);
  normalizeSigilIdentities(s);
  const legacyPortals = Object.values(s.blackMirror.rooms).some(
    (r) => r.portal && !r.portalPair,
  );
  normalizePortals(s);
  if (legacyPortals) {
    // Old saves allowed all-to-all Portals. Keep only Corridor Blocks that
    // preserve castle access after migrating to the confirmed paired rule.
    const previousBlocks = [...s.blackMirror.thresholds];
    s.blackMirror.thresholds = [];
    for (const edge of previousBlocks) {
      if (legalThreshold(s, edge)) s.blackMirror.thresholds.push(edge);
      else
        s.log.push({
          id: s.log.length + 1,
          turn: s.turn,
          text: `Portal-pair save migration reopens ${edge} to keep every room reachable.`,
        });
    }
  }
  if (
    s.blackMirror.resolution?.phase === "refresh" &&
    s.blackMirror.resolution.choice &&
    s.blackMirror.resolution.effects[0]?.op === "REMOVE" &&
    s.blackMirror.resolution.effects[0].token === "HEXLOCK"
  ) {
    s.blackMirror.resolution.choice = null;
    advanceEffects(s);
    if (!s.blackMirror.resolution.effects.length)
      s.blackMirror.resolution = null;
  }
  if (!stored.blackMirror) {
    // Legacy saves did not record visits; only Hall and the current room are certain.
    for (const hero of s.players) mutableStatus(s, hero.id);
    s.blackMirror.revealed = [
      ...new Set([
        ...s.removed
          .filter((t) => t.kind === "Black Mirror")
          .map((t) => t.card!),
        ...(s.pending ? [s.pending.card] : []),
      ]),
    ];
  }
  if (revision === undefined || revision < 2) {
    s.rules.orderedKnowledge = false;
  }
  if (revision === undefined || revision < 3)
    for (const player of s.players)
      unlockKnowledge(player, s.rules.orderedKnowledge);
  normalizeCompanions(s);
  assertState(s);
  return s;
}
export function publicRoom(s: State, id: string) {
  const r = s.rooms[id];
  return r.explored
    ? {
        id: r.id,
        explored: true,
        color: r.restored ? null : r.color,
        objects: r.objects,
      }
    : {
        id: r.id,
        explored: false,
        color: s.spells.publicColors.includes(id) ? r.color : null,
        objects: [],
      };
}
