# Revised Item catalog v0.3

Implemented 2026-10-31 from [the supplied specification](../reference/Item_Catalog_v0.3.md). All 25 definitions are REVIEW content, with stable IT IDs and typed effects. The original 155-card JSON remains intact; revised Item and Black Mirror records override their matching IDs at import. Other card definitions are unchanged.

## Playing with Items

Click an Item icon on your board or in your current room. Passive effects apply only while carried. Tool cards contain their Use button; its dialog offers eligible payment/target choices and confirms the current hero's round usage. Room Items are inspectable but cannot grant bonuses or be activated. Other players' inventories are never accessible. A round completes when turn order wraps, skipping eliminated heroes. Leaving, retaking or reloading a Tool never resets its usage.

Boots offer a 0-3 movement selector in their inspector. Learning with a Grimoire, Prism or Conduit opens a payment dialog; choose the discounted printed Element and the physical tokens to consume. Room and carried Elements can be mixed. The first free unlocked, unsealed Knowledge slot receives the learned Spell.

Occuldor's Compass selects its destination directly on the map. Capacity lost to Salvager's Crucible opens a saved excess-object choice; ordinary play resumes after all excess objects are left. The earlier curse selectors likewise use direct map selection, with no duplicate numbered room/corridor lists. Seven distinct engraved token motifs now mark curses and castle effects.

## Implemented cards

| IDs | Behavior |
| --- | --- |
| IT-01/02/03 | +2 Elements; +1 Equipment/Tool and +1 Relic; +1 Mirror, only while carried, with Hexlock adjustments |
| IT-04 | Selected 0-3 extra movement, still subject to mandatory movement, connections and Paralysis |
| IT-05/06/07/10 | Aether substitution; matching Earth/Air or Fire/Air contribution of two; chosen one-Element learning discount |
| IT-08/09 | +3 per fragment placement with +2 Occuldor encounter loss; +3 per genuine Companion discovery |
| IT-11..19 | All nine validated Tool actions, actual physical costs, per-hero round ledger, before-move restrictions where specified |
| IT-20 | Each distinct penalty reduced once, minimum zero; voluntary costs and explicitly unpreventable BM-06 losses excluded |
| IT-21 | Successful mirror-placement reward, once per pair by default |
| IT-22 | +1 movement and suppression of Paralysis while carried; tokens still expire |
| IT-23 | Any empty valid Kaleidoscope position; only actual neighbors contribute Courage |
| IT-24 | +1 Relic capacity and reward for new permanent physical Sigil commitments |
| IT-25 | Suppression of Companion conflicts for its holder, preserving normal Stray following, abandonment and sacrifice |

## Integration boundary

Permanent Sigil commitment is now a validated command with exact colors, complete configuration payment, Seal checks, irreversible bindings, reward emission and save/load support. Abandonment or Spellburn removes the bound Sigils to the spent pool. The inspector explicitly says that committing Sigils does **not** execute the Spell's printed ability: the pre-existing full Spell casting/Quick refresh system is still unfinished. Element contribution helpers are reusable for future Element-based casting costs; there are currently no automated Spell activation costs to connect them to. No Quick action claims an Amulet reward.

The Locket needed a conflict resolver, which previously did not exist. An explicit adapter now implements the original catalog's conflict fields for Rex/Coco versus Mamba and Alexis versus Julius. Other Companion abilities remain unfinished. Conflict behavior is a configurable review rule, not a claim that the whole Companion family is implemented.

## Spell prerequisite migration ? designer review needed

15 Spells still print old Tool names. Each retains the exact physical IT ID originally required. The card UI displays its revised name and ID; error messages also identify the former name. No Spell costs, schools or disciplines were reassigned. These stable-ID links keep learning functional, but their new thematic fit needs approval.

| Stable ID | Former prerequisite | Revised Tool | Affected Spells |
| --- | --- | --- | --- |
| IT-11 | Prism Lens | Elemental Crucible | SP-17, SP-28 |
| IT-12 | Astrolabe | Mirror Offering | SP-20, SP-34 |
| IT-13 | Cryptex | Salvager's Crucible | SP-30 |
| IT-14 | Chronoscope | Spellburn Quill | SP-24, SP-27, SP-29 |
| IT-15 | Necronomicon | Sigil Sacrifice | SP-23, SP-31 |
| IT-16 | Phonograph | Whisper Cipher | SP-32 |
| IT-17 | Florist’s Shears | Farewell Whistle | SP-33 |
| IT-18 | Geode Compass | Occuldor's Compass | SP-21, SP-35 |
| IT-19 | Psychograph | Companion's Bargain | SP-26 |

## Provisional interpretations

All editable Item policies live in rules.itemPolicies, with Zod defaults in itemState.ts; ruleStatus labels them PROVISIONAL.

1. Boots choose freely from 0 to 3, defaulting to 3, and add to normal movement. A shorter legal route remains allowed.
2. Conduits overlap at two Air contributions (airStacking=MAX). SUM permits four; neither policy duplicates tokens. Contributions apply to a token's native type; substituted Aether contributes one. Surplus contribution is lost, not banked.
3. Bargain's extra two loss applies to each actual Occuldor encounter, including a curse summon, not to Fear Tokens, mere co-location or general penalties.
4. Grimoire removes one selected printed requirement, including reducing a one-Element cost to zero. It never bypasses Tools or Knowledge. Multiple distinct requirements require an explicit choice.
5. Mirror Offering leaves two carried Mirrors of any color combination. No replacement pickups before departure; ordinary access to room objects is otherwise preserved.
6. Salvager's Crucible cannot discard itself by default (allowSelfDiscard=false). Other accessible Items may be discarded, including Relics and another Tool.
7. Farewell Whistle requires at least one attached Companion (whistleRequiresCompanion=true). It leaves all, blocks recruitment, and suppresses Stray pickup on that hero's next departure; behaviors/ownership metadata remain intact.
8. Compass costs one Courage and resolves normal destination arrival for all present living heroes (compassArrivalPunishes=true), without increasing Rage. Eligible rooms are the 35 castle rooms, excluding Occuldor's current room and Hall; hidden findings remain hidden. A voluntary cost may be lethal, consistently with existing Confront/Darkness payments.
9. Pendant rewards once per successful pair (pairReward=PAIR), before arrival punishment. MIRROR grants two. A failed placement grants nothing.
10. Amulet rewards three per newly committed Sigil (permanentReward=SIGIL). ACTION grants three per complete commitment. No rewards occur on load, repeat commands, Seals, refresh or invalid payments.
11. Consumable room Elements and Items are accessible. Learned Spells, free Sigils, private Secrets and attached Companions must belong to the acting hero. Permanent bindings cannot be sacrificed as free Sigils.
12. Legacy Tool names map to their unchanged IDs (preserveLegacyToolIds=true). Turning this off enforces literal names and intentionally blocks the unresolved prerequisites; prefer approving mappings rather than disabling compatibility.
13. Companion conflicts default on (companionConflicts=true). Mamba displaces Rex/Coco; Rex stays in the room. For the ambiguous Alexis/Julius pair, arriving Julius displaces Alexis; otherwise Julius flees. Default conflictDestination=FIRST_EXPLORED_OR_STAY uses the first accessible explored neighbor, or the present room if none exists; STAY is configurable. Only the affected holder's Locket suppresses their conflicts, a local Locket protects nobody until taken.
14. Carried passive Item bonuses continue in Darkness; active Tool use, learning and binding require clearing Darkness. Death never revives a hero through later rewards.
15. Older saves gain an empty usage ledger and an estimated round from their turn/player count. Old saves did not record skipped dead-player rounds, so an exact historical round is unrecoverable; future rounds are explicit and exact.

Items discovered during a White Mirror reveal remain in the room with no passive bonuses until taken. Only genuinely new Companion discovery triggers the Bell. Permanent Sigils keep previously achieved Knowledge unlocked.

## Architecture and changed files

- cards/items.ts: declarative revised definitions and typed operations; cards/catalog.ts overlays them. cards/toolPrerequisites.ts preserves old links. cardEffects.ts identifies automated Items.
- systems/itemAccess.ts, inventoryCapacity.ts, itemState.ts: shared availability, passive modifiers, capacities and persisted policy/usage data.
- systems/elementPayment.ts and spells.ts: physical payment allocation and validation.
- systems/itemActions.ts: Tool plans, costs and permanent commitments. systems/courage.ts: central gain, loss, reward and Occuldor-arrival handling.
- systems/companionConflicts.ts: explicit proposed conflict adapter and Locket suppression.
- domain/engine.ts, blackMirrorRuntime.ts, blackMirrorState.ts, blackMirrorValidation.ts: typed commands, rounds, saved capacity choices, penalties and departure restrictions.
- map/kaleidoscopeCells.ts and KaleidoscopeBoard.tsx: Crown placement and Bargain reward previews.
- ItemControls.tsx, LearningDialog.tsx, SpellAction.tsx, CardFace.tsx, Game.tsx, CurseStatus.tsx, HowToPlay.tsx, globals.css: interactive controls, card details and guidance.
- CurseTokenIcon.tsx, CastleBoard.tsx, CurseChoiceDialog.tsx: thematic tokens and direct map targeting from the preceding request.
- tests/items.test.ts: behavioral checks for every Item plus interaction, atomicity and persistence coverage. tests/e2e/items.spec.ts: real-browser Tool, payment, Compass and binding flows. Existing tests updated for revised Bandolier capacity and stable Tool IDs; unrelated Black curse fixtures use a neutral Relic rather than the now-active Ring.

## Verification

Following the latest designer revisions, 193 unit/component tests and all 27 browser tests passed. Desktop/mobile interactions and saved overflow choices were checked. Production build and strict TypeScript checks passed. Coverage includes all 25 Items, mixed payment, every existing Spell's learning cost, once-per-round use, rejection atomicity, carried-only Item effects and shared-room payment resources, binding/Seal interactions, saved overflow decisions, penalties and Companion exceptions.
