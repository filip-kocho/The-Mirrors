import type { State } from "../domain/engine";
import { kaleidoscopeGems } from "../map/kaleidoscopeCells";
import { gainCourage } from "./courage";
import { takeSigils, availableSigils } from "./sigils";
import { roomActionsBlocked } from "./spellModifiers";
export type MagicCommand = {
  type: "MAGIC";
  playerId: string;
  action:
    | "TAKE"
    | "LEAVE"
    | "GIVE"
    | "BREAK_PARALYSIS"
    | "REMOVE_HEXLOCK"
    | "PASSAGE"
    | "SWIFT"
    | "INSTALL_GEM"
    | "INSTALL_WILD";
  resource: string;
  target?: string;
};
export const gapReady = (s: State, id: string) =>
  !!kaleidoscopeGems.find((g) => g.id === id)?.cells.every((n) => s.mosaic[n]);
export const installedGap = (s: State, id: string) =>
  s.magic.gems.some((g) => g.location === "KALEIDOSCOPE" && g.gap === id) ||
  s.magic.pentagon?.gap === id;
export const storedGems = (s: State, owner = s.players[s.active].id) =>
  s.magic.gems.filter(
    (g) => g.location === "PLAYER_STORAGE" && g.owner === owner,
  );
const event = (s: State, text: string) =>
  s.log.push({ id: s.log.length + 1, turn: s.turn, text });
export function awardDiamondGem(s: State, secret: string, owner: string) {
  const g = s.magic.gems.find((g) => g.secret === secret),
    p = s.players.find((p) => p.id === owner)!;
  if (!g || g.location !== "RESERVED")
    throw Error("This Secret's Diamond Gem is not available.");
  if (storedGems(s, owner).length < s.rules.gemPolicies.capacity) {
    g.location = "PLAYER_STORAGE";
    g.owner = owner;
  } else {
    g.location = "ROOM";
    g.room = p.room;
  }
}
export function magicPlan(s: State, c: MagicCommand) {
  const p = s.players[s.active];
  if (
    c.playerId !== p.id ||
    s.privacy ||
    p.dead ||
    s.outcome !== "playing" ||
    s.pending ||
    s.blackMirror.resolution ||
    s.spells.consent ||
    s.spells.portalOffer
  )
    throw Error(
      "Finish the current turn resolution before using magical resources.",
    );
  if (roomActionsBlocked(s, p.room))
    throw Error("Clear Darkness before this action.");
  const g = s.magic.gems.find((g) => g.id === c.resource),
    status = s.blackMirror.heroes[p.id];
  if (c.action === "INSTALL_WILD") {
    if (
      !s.magic.wildStorage.some((t) => t.id === c.resource && t.owner === p.id)
    )
      throw Error("Choose an available Wild Sigil.");
  } else if (c.action === "TAKE") {
    if (!g || g.location !== "ROOM" || g.room !== p.room)
      throw Error("Choose a Gem in your current room.");
    if (storedGems(s).length >= s.rules.gemPolicies.capacity)
      throw Error("Diamond Gem storage is full.");
  } else if (!g || g.location !== "PLAYER_STORAGE" || g.owner !== p.id)
    throw Error("Choose a Diamond Gem in your storage.");
  if (c.action === "GIVE") {
    const recipient = s.players.find((h) => h.id === c.target);
    if (
      !s.rules.gemPolicies.directTransfer ||
      !recipient ||
      recipient.id === p.id ||
      recipient.dead ||
      recipient.room !== p.room ||
      storedGems(s, recipient.id).length >= s.rules.gemPolicies.capacity
    )
      throw Error("Direct Gem transfer is unavailable.");
  }
  if (c.action.startsWith("INSTALL")) {
    const gap = kaleidoscopeGems.find((g) => g.id === c.target);
    if (s.rules.gemPolicies.installWindow === "POST_MOVE" && !s.moved)
      throw Error("Install after movement under this rule variant.");
    if (!gap || !gapReady(s, gap.id) || installedGap(s, gap.id))
      throw Error("Choose an empty, fully surrounded gap.");
    if ((gap.bonus === 5) !== (c.action === "INSTALL_WILD"))
      throw Error(
        "Diamonds need a Gem; the central pentagon needs a Wild Sigil.",
      );
  }
  if (
    ["BREAK_PARALYSIS", "REMOVE_HEXLOCK", "PASSAGE", "SWIFT"].includes(c.action)
  ) {
    if (g!.exhausted)
      throw Error("This Gem is exhausted until its holder's next turn.");
    if (c.action === "BREAK_PARALYSIS" && !status?.paralysis.length)
      throw Error("No Paralysis Token to remove.");
    if (
      c.action === "REMOVE_HEXLOCK" &&
      !status?.hexlocks.some((h) => h.slot !== "knowledge" && h.id === c.target)
    )
      throw Error("Choose an inventory Hexlock Token.");
    if (["PASSAGE", "SWIFT"].includes(c.action) && s.moved)
      throw Error("Use this Gem before movement.");
    if (
      c.action === "PASSAGE" &&
      (!c.target ||
        !s.blackMirror.thresholds.includes(c.target) ||
        (s.rules.gemPolicies.adjacentPassageOnly &&
          !c.target.split("~").includes(p.room)))
    )
      throw Error("Choose one blocked corridor adjoining your room.");
    if (
      c.action === "SWIFT" &&
      s.magic.movement[p.id]?.turn === s.turn &&
      s.magic.movement[p.id]?.swift
    )
      throw Error("This movement already has a Gem bonus.");
  }
  return { gem: g };
}
export function applyMagic(s: State, c: MagicCommand) {
  const { gem: g } = magicPlan(s, c),
    p = s.players[s.active];
  if (c.action === "TAKE" || c.action === "GIVE") {
    g!.location = "PLAYER_STORAGE";
    g!.owner = c.action === "TAKE" ? p.id : c.target;
    delete g!.room;
  } else if (c.action === "LEAVE") {
    g!.location = "ROOM";
    g!.room = p.room;
    delete g!.owner;
  } else if (c.action === "INSTALL_GEM") {
    g!.location = "KALEIDOSCOPE";
    g!.gap = c.target;
    delete g!.owner;
    s.gemOwners[c.target!] = p.id;
    gainCourage(s, p.id, 3);
  } else if (c.action === "INSTALL_WILD") {
    takeSigils(s, p.id, [c.resource]);
    s.magic.pentagon = { id: c.resource, owner: p.id, gap: c.target! };
    s.gemOwners[c.target!] = p.id;
    gainCourage(s, p.id, 5);
  } else {
    const status = s.blackMirror.heroes[p.id];
    if (c.action === "BREAK_PARALYSIS") {
      status.paralysis.shift();
      if (s.rules.gemPolicies.paralysisMovement && !status.paralysis.length)
        status.immobilized = false;
    }
    if (c.action === "REMOVE_HEXLOCK")
      status.hexlocks = status.hexlocks.filter((h) => h.id !== c.target);
    if (c.action === "SWIFT" || c.action === "PASSAGE") {
      const b =
        s.magic.movement[p.id]?.turn === s.turn
          ? s.magic.movement[p.id]
          : { turn: s.turn, swift: false, passage: null };
      if (c.action === "SWIFT") b.swift = true;
      else b.passage = c.target!;
      s.magic.movement[p.id] = b;
    }
    g!.exhausted = true;
    g!.usedTurn = s.turn;
  }
  event(
    s,
    `${p.name}: ${c.action.replaceAll("_", " ")} with ${c.resource}${c.action === "INSTALL_GEM" ? " (+3 Courage)" : c.action === "INSTALL_WILD" ? " (+5 Courage)" : ""}.`,
  );
}
export function refreshGems(s: State) {
  for (const g of storedGems(s))
    if (g.exhausted && g.usedTurn < s.turn) g.exhausted = false;
}
export function dropGems(s: State, owner: string, room: string) {
  for (const g of storedGems(s, owner)) {
    g.location = "ROOM";
    g.room = room;
    delete g.owner;
  }
}
export function gemMovement(s: State) {
  const b = s.magic.movement[s.players[s.active].id];
  return !s.moved && b?.turn === s.turn && b.swift ? 1 : 0;
}
export function supportsFilledGaps(s: State, mosaic: (string | null)[]) {
  return (
    s.rules.gemPolicies.relocation === "RETAIN_INSTALLED" ||
    kaleidoscopeGems
      .filter((g) => installedGap(s, g.id))
      .every((g) => g.cells.every((n) => mosaic[n]))
  );
}
export function assertMagic(s: State) {
  const gems = s.magic.gems;
  if (
    gems.length !== 10 ||
    new Set(gems.map((g) => g.id)).size !== 10 ||
    new Set(gems.map((g) => g.secret)).size !== 10
  )
    throw Error("Diamond Gem supply corrupted.");
  const gapIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const g = gems.find((g) => g.id === `DG-${String(i + 1).padStart(2, "0")}`);
    if (!g || g.secret !== `SE-${String(i + 1).padStart(2, "0")}`)
      throw Error("Invalid reserved Gem mapping.");
    if (g.location === "RESERVED" && (g.owner || g.room || g.gap))
      throw Error("Reserved Gem has a location.");
    if (
      g.location === "PLAYER_STORAGE" &&
      (!s.players.some((p) => p.id === g.owner) || g.room || g.gap)
    )
      throw Error("Invalid Gem holder.");
    if (g.location === "ROOM" && (!s.rooms[g.room!] || g.owner || g.gap))
      throw Error("Invalid Gem room.");
    if (g.location === "KALEIDOSCOPE") {
      if (
        !kaleidoscopeGems.some((x) => x.id === g.gap && x.bonus === 3) ||
        g.owner ||
        g.room
      )
        throw Error("Invalid installed Gem.");
      gapIds.push(g.gap!);
    }
    if (g.usedTurn > s.turn) throw Error("Invalid Gem exhaustion turn.");
    const completed = s.players.some((p) =>
      p.completedSecrets.some((c) => c.id === g.secret),
    );
    if ((g.location === "RESERVED") === completed)
      throw Error("Gem release disagrees with Secret completion.");
  }
  if (new Set(gapIds).size !== gapIds.length)
    throw Error("Two Gems occupy one gap.");
  for (const p of s.players)
    if (storedGems(s, p.id).length > s.rules.gemPolicies.capacity)
      throw Error("Gem storage overflow.");
  if (
    s.magic.pentagon &&
    !kaleidoscopeGems.some(
      (g) => g.id === s.magic.pentagon!.gap && g.bonus === 5,
    )
  )
    throw Error("Invalid central Sigil.");
  if (!supportsFilledGaps(s, s.mosaic))
    throw Error("An installed gap must remain surrounded.");
  const wild = [
    ...s.magic.wildStorage.map((t) => t.id),
    ...s.spells.quick.flatMap((q) =>
      q.sigils.filter((t) => t.color === "Wild").map((t) => t.id),
    ),
    ...Object.entries(s.blackMirror.bindings).flatMap(([id, cs]) =>
      cs.flatMap((c, i) =>
        c === "Wild" ? [s.spells.permanentIds[id]?.[i]] : [],
      ),
    ),
    ...s.blackMirror.spentSigils.flatMap((c, i) =>
      c === "Wild" ? [s.spells.spentIds[i]] : [],
    ),
    ...(s.magic.pentagon ? [s.magic.pentagon.id] : []),
  ];
  if (
    wild.length !== s.players.length ||
    new Set(wild).size !== wild.length ||
    s.players.some((p) => !wild.includes(`WILD-${p.id}`))
  )
    throw Error("Wild Sigil supply corrupted.");
  if (s.magic.wildStorage.some((t) => !s.players.some((p) => p.id === t.owner)))
    throw Error("Invalid Wild owner.");
}

export const victoryReady = (s: State) =>
  s.mosaic.every(Boolean) &&
  (s.rules.gemPolicies.victory === "FRAGMENTS_ONLY" ||
    (s.magic.gems.every((g) => g.location === "KALEIDOSCOPE") &&
      !!s.magic.pentagon));
