Latest designer changes (2026-10-31) supersede older review policies below: Hexlocks are removed automatically once per hero per round, Portals connect only matching-color pairs, Threshold tokens are named Corridor Blocks, and the full curse card is displayed during resolution. See DESIGNER_REVISIONS.md for details and save migration.

# Black Mirror v0.4 — review implementation

Updated 2026-10-29. Source: `reference/Black_Mirror_Catalog_v0.4.md`, copied from the designer's supplied implementation specification. The latest designer clarification overrides this specification on visibility: discovered Black Mirrors remain public and inspectable through their icons. Inspection is separate from activation through Collide. Default penalty skipping remains disabled. All 35 stable IDs are implemented; the original 155-card JSON remains unchanged and supplies the other 120 cards.

## Resolution and source files

- `src/game/cards/blackMirrors.ts`: 35 names, rules text, REVIEW/version metadata, typed immediate/deferred operations and recursive Zod validation. `catalog.ts` overlays these definitions by ID. `cardEffects.ts` classifies every Black Mirror as a typed curse.
- `src/game/systems/blackMirrorState.ts`: serializable status tokens, room overlays, corridor seals, action seals, bindings, visited rooms and pending choices. No callbacks or component state are authoritative.
- `blackMirrorRuntime.ts`: the reusable effect queue, explicit target selection, expiry, forced movement and companion behavior. Helpers mutate only reducer-owned copies during play.
- `inventoryCapacity.ts`: shared category capacities, Equipment bonuses and Hexlock reductions. Knowledge seals use slot indices without erasing achievement flags.
- `blackMirrorValidation.ts`: validates owners, rooms, corridor graph safety, action references, unique token identities, bindings and pending resolution references on commands/save loading.
- `map/castleConnections.ts`: normal graph minus Thresholds plus Portal edges; shared by map preview, movement validation and safe-seal selection. Geometry comes from the existing authored map.
- `domain/engine.ts`: command sequencing, collision commitment, death/drop policy and integration with learning, transfers and turn changes.
- `PenaltyDialog`, `CurseChoiceDialog`, `CurseStatus`, `CastleBoard`, `CardFace`, `SpellCastGuide`: curse reveal, choices, map targets, seven token indicators and sealed-action references.

Sequence:

1. `COLLIDE` validates the unblocked local pair and reveals the Black Mirror. No Sigil/Rage is awarded yet.
2. `CONTINUE_COLLISION: apply` starts immediate effects. Deterministic effects execute automatically. Required choices pause the queue and expose only legal targets.
3. `CURSE_CHOICE` validates the choice ID, owner, exact count, distinct targets and special constraints (such as one White plus one Black). A rejected command leaves the original state unchanged.
4. Once immediate effects finish, commit exactly one restoration/Sigil/Rage increment, remove the installed pair, and unlock Knowledge achievements. `pending.committed` prevents repeats.
5. `PLACE` validates the Kaleidoscope cell, applies the existing cumulative neighbor Courage reward, then starts deferred effects. BM-15 asks for a forced destination; BM-15/16 end the turn afterward.
6. Clear pending state and check victory/death. A legal collision finishes through relocation or death; eliminated heroes receive no placement Courage.

The only default choices are forced deterministic operations and removing a sole eligible start-of-turn token. Object sacrifices, branches, spatial destinations and multiple recovery tokens require the player's explicit choice. When no requested targets exist, the queue logs that component's fallback and continues under the review policy; it never silently claims success.

## Token lifecycle

| Token | State/owner | Behavior and expiry |
| --- | --- | --- |
| PARALYSIS | Hero token IDs + current-turn immobilized flag | Blocks departure immediately. Start turn removes one, but that entire turn remains immobilized. Mandatory movement suspended; local actions allowed. |
| HEXLOCK | Hero category and capacity slot; Knowledge index where applicable | Reduces usable capacity, floored at zero; Equipment still adds capacity. Remove exactly one total per affected turn, choosing among multiple. Overflow requires explicit drops. |
| FEAR | Hero token IDs, acquisition-room ID, last-cleared turn | Finish movement in another already discovered room, different from acquisition room. At most one per turn. Separate from the Courage track. |
| THRESHOLD_SEAL | Canonical existing corridor ID | Permanent normal-corridor block; no stacking. Legal placement must retain access to all rooms via normal corridors/Portals. |
| SIGIL_SEAL | Physical Spell ID, expiry owner, scope and optional action index | QUICK/PERMANENT/ALL/SPECIFIC_ACTION suppression. One Seal per eligible Spell for global scopes; BM-28 stacks three on one Quick action. Remove one per turn, no Sigil refund. |
| DARKNESS | Room counter | Each costs 1 Courage to remove. All must be paid before ordinary actions. Departure and normal discovery remain possible. Placement does not reveal findings. |
| PORTAL | Persistent room marker | All active Portal rooms connect to each other in one movement step. A lone Portal provides no destination. Normal discovery occurs on entry; corridor seals do not block magical edges. |

Turn-start recovery occurs once on the actual turn transition, before the hot-seat reveal. Multiple recovery targets are saved behind the privacy screen. Repeated Reveal/Resume never repeats expiry. Curse restrictions are enforced in the domain engine, not merely through disabled buttons.

## Spell integration boundary

The pre-existing application learns Spells but has no executable casting, exhaustion or continuous-effect engine. This implementation does not claim to add those unrelated 35 Spell abilities. `spellSeals` and `canActivateSpellAction` are the shared suppression interface for future casting code; current learned-card and board views show exactly which actions are sealed. Unsealing restores eligibility, not an invented automatic Spell effect.

Existing permanent bindings in state remain attached under temporary Seals. Abandonment moves bound colors to the inaccessible spent ledger, following the existing provisional commitment policy. Action Seals remain on the physical Spell when it is left/relearned, with an explicit expiry owner. A dead owner's recovery responsibility transfers to the surviving holder, or first living hero, so the Seal cannot become accidentally permanent. New binding commands and individual physical Sigil IDs remain part of the unfinished casting module.

## Provisional decisions A–N

These defaults are implemented for review, not asserted as finalized rules. Global policies live in `GameRulesConfig.blackMirrorPolicies`; card-specific balance values and sequences live in the typed catalog rather than UI code.

| Question | Current review default |
| --- | --- |
| A. Bound Sigils possessed? | Yes for BM-02/03; `boundSigilsCountAsPossessed` can disable this. Available/unbound Sigils still govern Knowledge conditions. |
| B. Duplicate colors? | Count copies beyond the first per color, as the supplied example specifies. |
| C. BM-06/07 Paralysis? | Two each, explicit catalog values. |
| D. Missing material objects? | BM-08/09/10 drop what exists but give full locks; BM-11/12 give locks for actual drops. BM-13 requires both colors or loses 3. BM-14 with no Items requires loss 3. Relic drops seal Relic capacity, not Equipment slots. |
| E. BM-26 Knowledge? | One indexed Knowledge Hexlock for each abandoned Spell; achievement booleans retained. |
| F. Abandoned Companions? | Recruitable. LOYAL changes holder on recruitment by default; STRAY follows the first hero departing, including from another holder in that room. No Stray carrying action exists. Default all cards to LOYAL until a per-card mapping is supplied. |
| G. Discovered but unvisited? | Relative to the flipping hero's recorded visits; excludes their current room and the Hall. Passing through never counts as visiting. |
| H. Missing destinations/seal targets? | Resolve available requested targets, log unavailable components. Threshold safety conservatively preserves **all** rooms and physical supplies, including through Portals. |
| I. Summoning guard? | Occuldor immediately relocates, freeing his previous Black Mirror. BM-34/35 punish only the flipper, once/twice, at pre-collision Rage. |
| J. Lethal curse? | Finish restoration and award Sigil/Rage; no revival or Courage for the dead. Preserve original final-collision victory policy. |
| K. Abandoned Spell Seals? | Stay on that physical Spell; original afflicted hero removes one per turn. On death, expiry responsibility transfers to a surviving holder/first survivor. No bound Sigils are refunded. |
| L. Portal step/Occuldor? | One step per Portal connection. Occuldor's existing placement/summoning travel is instantaneous and does not pathfind. |
| M. Thresholds and Occuldor? | Affect hero corridor movement; do not prevent magical Occuldor arrival. |
| N. Paralysis/local objects? | Ordinary local actions remain available unless Darkness or another restriction blocks them. |

Additional review details: explicit forced-movement card effects override normal movement allowance/Paralysis, do not consume or reset the normal movement flag, and may complete a Fear visit (`forcedVisitsClearFear`). The Hall qualifies as a previously discovered Fear destination. Companions follow forced movement. Hexlock overflow resolves after forced movement using the destination's accessible capacity. Optional `allowSkip` is false by default; when explicitly enabled it skips the entire curse, including deferred effects, and logs that choice.

## Saves and migration

Save key/version and rules revision 3 remain compatible. Missing Black Mirror state defaults to empty; legacy heroes are known to have visited only the Hall and their current room because prior saves had no authoritative visit history. Already removed Black Mirrors and a legacy pending reveal become public. Existing v0.4 states round-trip exactly, including queued choices and expiry ownership.

Legacy pending collisions had already awarded their Sigil/Rage. Undefined `committed` means legacy/already awarded; resuming their new v0.4 curse cannot award twice. No previous reward is reversed. All future Black cards use v0.4 definitions. Refreshing the browser does not regenerate cards or advance the queue.

## Adding a card operation

Keep IDs stable. A definition contains readable text plus `effects` (immediate) and `after` (after fragment placement):

```ts
effects: [
  { op: "LOSS", amount: 2 },
  { op: "TOKEN", token: "PARALYSIS", count: 1 },
],
after: []
```

For a new operation, extend the `CurseEffect` union and Zod schema, implement its executor case and legal-target provider, then add a real-loop test for resolution, invalid targets, repeated commands and save/resume. Do not parse `effect` prose. Spatial targeting must use the authored connectivity data. Preserve physical Mirrors/Elements by moving them between existing pools.

## Verification

Verified on 2026-10-29: 135 engine/component tests and 20 Playwright browser tests passed. TypeScript checking and the optimized Next.js production build passed.

`pnpm test` covers the 35-card review catalog and one real collision/choice/save/placement scenario per Black Mirror, plus lifecycle, topology, material branches, capacity Equipment, Relics, companion recruitment, Knowledge locks, bound Sigils, death, summon Rage tiers and corrupted-save rejection. Existing tests retain original setup, discovery, learning, inventory, Kaleidoscope scoring and full-board victory coverage.

`pnpm test:e2e -- --workers=2` covers public discovered-card inspection, complete Place/lure/Collide flow, object-choice resume, corridor map selection, Darkness payments, Portal exploration, Paralysis turn ending, recovery choices, deferred movement, Seal display and the final victory. `pnpm typecheck` and `pnpm build` verify the production application.
