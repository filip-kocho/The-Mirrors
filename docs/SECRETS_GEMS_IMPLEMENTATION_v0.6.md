# Secrets, Diamond Gems and Kaleidoscope v0.6

Implemented from [the supplied specification](../reference/Secrets_Gems_Kaleidoscope_v0.6.md). This replaces the v0.5 Secret conditions, neighbor-color Courage bonuses, and automatic gap-closure rewards.

## Revised Secret catalog

All conditions inspect the active hero's current personal collection. Room resources do not count. Reveal remains voluntary and private until completion; requirements are kept. Each Secret completes once.

| ID | Name | Requirement | Reward |
| --- | --- | --- | --- |
| SE-01 | Elemental Pair | 2 same-type Elements | DG-01 |
| SE-02 | Elemental Harmony | 3 different Element types | DG-02 |
| SE-03 | Mirror Balance | 1 White and 1 Black Mirror | DG-03 |
| SE-04 | Twin Reflections | 2 same-type Mirrors | DG-04 |
| SE-05 | Craftsman's Hands | Equipment and Tool | DG-05 |
| SE-06 | Relic Hunter | 1 equipped Relic | DG-06 |
| SE-07 | Apprentice Magician | 2 learned Spells | DG-07 |
| SE-08 | Unexpected Company | 2 attached Companions; Twins count twice | DG-08 |
| SE-09 | Keeper of Whispers | 2 unrevealed Secrets, including itself | DG-09 |
| SE-10 | Sigil Harmony | 2 available colored Sigils of different colors | DG-10 |
| SE-11 | Four of a Kind | 4 same-type Elements | +5 Courage |
| SE-12 | The Fifth Essence | All 5 Element types | +5 Courage |
| SE-13 | Master of Reflections | 3 same-type Mirrors | +5 Courage |
| SE-14 | Treasures of the Castle | 2 legally equipped Relics | +5 Courage |
| SE-15 | The Grand Scholar | 4 learned Spells in unlocked slots | +5 Courage |

Wild, Quick-assigned and permanently bound Sigils do not satisfy SE-10. Capacity and equipped-slot legality are checked, including Companion carriers. Easy Secrets grant no Courage.

## Physical resources and actions

Exactly ten uniquely identified Gems start RESERVED and each has one fixed Secret. Locations transition between PLAYER_STORAGE, ROOM and KALEIDOSCOPE. Storage is separate from ordinary inventory; overflow goes into the current room. Collect, leave and optional transfer commands validate ownership, location and capacity. Death drops carried Gems.

A ready Gem can remove one existing Paralysis, remove a selected inventory Hexlock, bypass one selected Corridor Block for the current movement, or add one maximum movement. A successful utility exhausts the physical token. It refreshes at its current holder's next turn; transferring it does not immediately refresh it. An exhausted Gem may still be permanently installed. Installed Gems cannot be recovered or reused.

Each hero starts with one additional physical Wild Sigil. It substitutes for one colored Spell socket, supports Quick exhaustion/return and Permanent binding, and follows existing abandonment/spent rules. Socket indices preserve the assignment when another Quick token returns early. Only a free Wild may be installed in the central pentagon. Wilds do not unlock Knowledge slots or count as colored diversity.

## Kaleidoscope and interface

The existing 35 fragment cells, ten diamond gaps and central pentagon remain authoritative. The first fragment uses the outer edge; subsequent fragments must adjoin existing glass. Each fragment grants +1 Courage, with no neighbor-color bonus. Existing explicit Item/Spell restoration effects remain separate.

Surrounding a gap only makes it ready. The player chooses a ready diamond gap and installs one stored Gem for +3 Courage, or installs one free Wild in the ready center for +5. Each gap pays once. Filled gaps use the installer's color and a resource glyph; ready gaps glow and support keyboard selection.

The player board includes dedicated Gem storage, readiness and utility controls, plus Wilds in existing Sigil storage. Room Gems are public and collectible when legal. Secret inspection and completed rewards distinguish Gems from Courage. Spell sockets remain clickable with Wild assignment indicators; action resolution stays outside the card. How to Play describes the new rules.

## Provisional policies

Saved gemPolicies isolate unresolved rules:

- Capacity defaults to one Gem; additional earned Gems go to the current room.
- Direct hero transfers default off; leave/take through the room is available. The optional direct transfer requires the same room.
- Victory defaults to 35 fragments. ALL_INLAYS optionally requires all ten Gems and the central Wild too; this experimental variant has no invented recovery for discarded Secret cards.
- Installation is allowed during ordinary pre/post-movement actions; POST_MOVE is an optional restriction. Pending resolutions and privacy handoff block unrelated actions.
- Passage selects one existing adjacent Corridor Block for the next movement. Adjacency is configurable. There is no separate implemented trap-token model. Swift gives +1 and does not stack within the current movement.
- Removing Paralysis preserves an already established immobilized turn by default. A policy can restore movement after the last Paralysis is removed.
- Fragment relocation must preserve support under installed resources by default; RETAIN_INSTALLED permits unsupported installed resources without granting rewards again.
- Wilds do not count toward Knowledge unlocks. This preserves colored milestones without inventing Wild color-diversity rules.

## Saves and invariants

Zod validates resource state and saved configuration. Engine assertions enforce the ten-Gem mapping, single locations, storage capacity, completion/release consistency, unique gap occupancy and one physical starting Wild per hero across all storage, assignments, spent tokens and the center.

Older saves receive the resource model and starting Wilds. Previously completed SE-01..10 release their reserved Gems once, without replaying Courage or reopening achievements. Existing completion history is marked legacy and original Courage is preserved. Old cosmetic gap ownership is cleared: surrounding glass alone no longer represents an installed resource. Repeated loading does not duplicate rewards. Older Quick assignments gain deterministic socket indices.

## Main files

- Catalog and achievements: src/game/cards/secrets.ts, src/game/systems/secrets.ts.
- New resources: src/game/systems/magicState.ts and magicResources.ts.
- Integration: engine.ts, gameRulesConfig.ts, sigils.ts, spellState.ts, spellActivation.ts, spellModifiers.ts, blackMirrorState.ts, blackMirrorRuntime.ts, itemActions.ts, castleConnections.ts and kaleidoscopeCells.ts.
- UI: GemStorage.tsx, Game.tsx, GameIcon.tsx, CastleBoard.tsx, KaleidoscopeBoard.tsx, PlayerCollection.tsx, SecretControls.tsx, CompletedSecrets.tsx, CardFace.tsx, SpellActivationControls.tsx, SpellCastGuide.tsx, HowToPlay.tsx and app/globals.css.
- Tests: magic-resources.test.ts, secrets.test.ts, existing engine/component regressions, e2e/magic-resources.spec.ts and updated Secret/mirror/landing browser scenarios.
- Documentation: README, RULES_STATUS, OPEN_DESIGN_DECISIONS, ARCHITECTURE, CARD_IMPLEMENTATION_STATUS, CHANGELOG and the historical Secret report.

## Validation

- 372 unit/component tests passed across 12 files.
- 41 Playwright browser tests passed, including Gem earning, exhaustion, installation, central Wild consumption and Wild Spell binding.
- Production Next.js build passed, including TypeScript compilation.
- Browser screenshot inspected for installed resource appearance and player colors.

Existing Companion v0.6 changes remain in the working tree. This report does not claim previously unimplemented individual Companion powers are now automated. No commit or GitHub push was performed for this update.
