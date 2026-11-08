# Spell implementation v0.4

This revision supersedes the previous 25/70 effect coverage. All 35 revised Spell cards and all 70 Quick/Permanent configurations now have executable adapters. No Spell effect is a manual-resolution placeholder. Fifteen Spells remain unavailable to learn because their obsolete Tool prerequisites have no approved replacement, as explicitly requested by the designer. Already learned Spells in saved or developer scenarios can use their revised effects.

## Authoritative rules and UI

Quick effects resolve during activation. Exact physical Sigil IDs are assigned atomically, retained independently of the card, and returned once at the next owner turn. Permanent effects bind exact Sigils, are suppressed by Seals/Hexlocks, and cease when the Spell leaves its Knowledge slot. Bound Sigils are discarded rather than returned. Knowledge unlock rules are unchanged.

The opened card contains printed effects and directly clickable Sigil sockets. All target selection, activation buttons, cancellation, warnings and resolution controls are in a separate panel below the card. Room targets use the castle map; fragment relocation uses the Kaleidoscope. The closed card shows name/ID/tier, readiness and assigned Sigils.

SP-08 and SP-13 follow the designer's clarification: **discard means leave the carried object in the current room**. They do not destroy Elements or essential Mirrors. Explicit removal and permanently bound Sigil disposal remain separate rules. Elements used for learning are still consumed under the established learning rules.

## Effect coverage

| ID | Quick | Permanent |
|---|---|---|
| SP-01 Spark of Certainty | Implemented: Remove 1 Fear Token from yourself and gain 1 Courage. | Implemented: Reduce Courage loss from each Black Mirror curse by 1. |
| SP-02 Drawn Curtain | Implemented: Immediately move to an adjacent room through a legal connection. | Implemented: Increase movement allowance by 1. |
| SP-03 Crystal Skin | Implemented: Remove 1 Hexlock Token from yourself. | Implemented: Reduce Courage loss from Occuldor punishments by 1. |
| SP-04 Rippling Step | Implemented: Remove 1 Darkness Token from an explored room and gain 1 Courage. | Implemented: Darkness does not prevent the owner from performing room actions. |
| SP-05 Aether Thread | Implemented: Move 1 loose Mirror card from an adjacent explored room into your current room.  Use the existing room-object and collision system if the movement creates a Mirror pair. | Implemented: Aether can substitute for any Element type when learning Spells.  Do not create new Elements. |
| SP-06 Mirror Glance | Implemented: Place 1 carried White Mirror into an adjacent explored room.  If a collision occurs, resolve it through the standard Mirror collision process. | Implemented: You may place White Mirrors in adjacent explored rooms as though physically present.  Preserve normal placement limits and costs. |
| SP-07 Stone Mark | Implemented: Move 1 Item or Element from an adjacent explored room into your current room. | Implemented: Increase Equipment/Tool carrying capacity by 1. |
| SP-08 Ember Pulse | Implemented: Discard 1 carried Element. Gain 3 Courage. | Implemented: Whenever you restore a Kaleidoscope fragment, gain 1 additional Courage. |
| SP-09 Calm Waters | Implemented: Remove up to 2 Fear Tokens from yourself.  At least one eligible Fear Token must exist. | Implemented: Normal movement allowance cannot fall below 2 because of the Fear tier alone.  Other movement restrictions continue to apply. |
| SP-10 Astral Notation | Implemented: Privately inspect the fragment colors of up to 2 unexplored rooms. | Implemented: You can see the fragment colors of adjacent unexplored rooms.  Do not reveal Black Mirror curse contents. |
| SP-11 Echo Walk | Implemented: Move 1 loose Element from an adjacent explored room into your current room. | Implemented: Tools in adjacent explored rooms count as accessible to you.  Do not duplicate the Tool cards or grant extra Tool activations. |
| SP-12 Geode Shelter | Implemented: Remove 1 Darkness Token from your current or an adjacent room. | Implemented: Increase carried Mirror capacity by 1. |
| SP-13 Kindle Resolve | Implemented: Discard 1 carried Mirror to gain 3 Courage. | Implemented: Gain 1 additional Courage whenever you complete a Mirror collision.  Do not trigger twice for the same collision. |
| SP-14 Tranquil Reflection | Implemented: Remove up to 1 Paralysis Token and 1 Fear Token from yourself.  Require at least one eligible token. | Implemented: Ignore Paralysis movement restrictions.  Paralysis Tokens may still exist unless prevented by another effect. |
| SP-15 Whisper of Origin | Implemented: Exchange 1 carried Element with 1 physical Element present in an explored room.  The player's original Element is left in the selected room.  Do not draw from the Element bag. | Implemented: Increase Element carrying capacity by 1. |
| SP-16 Warding Flame | Implemented: Remove 1 Sigil Seal from one of your learned Spells. | Implemented: Prevent ALL new Sigil Seals from being placed on your learned Spell actions.  Existing Seals are not automatically removed by activation. |
| SP-17 Prismatic Exchange | Implemented: Move up to 2 loose Elements from one explored room into your current room.  Require at least one available Element. | Implemented: When learning a Spell, treat one paid Element as another Element type.  Do not create additional Element tokens. |
| SP-18 Purifying Steam | Implemented: Remove up to 2 Paralysis and/or Hexlock Tokens from yourself. | Implemented: Become completely immune to Paralysis.  Remove any existing Paralysis Tokens when Permanent activates.  Prevent new Paralysis Tokens while the Spell is active. |
| SP-19 Corridor Mist | Implemented: Teleport immediately to an explored room within 2 map connections. | Implemented: You may use the Portal network from your current room as though that room contained a Portal, provided another active Portal exists.  Use existing Portal travel rules. |
| SP-20 Star Compass | Implemented: Immediately move to any explored room whose Kaleidoscope fragment has not yet been restored. | Implemented: See fragment colors of unexplored rooms up to 2 connections from your room. |
| SP-21 Molten Path | Implemented: Immediately cross one Threshold-Sealed connection to an adjacent room. | Implemented: Threshold Seals do not block your movement.  Do not delete Threshold Seal tokens. |
| SP-22 Rooted Ward | Implemented: Remove up to 2 Darkness Tokens from one explored room. | Implemented: Reduce Courage loss from Occuldor punishments by 2. |
| SP-23 Gravestone Key | Implemented: Move 1 unowned Companion from an adjacent explored room into your current room and recruit it.  Do not create a duplicate Companion card. | Implemented: Companions attached to you cannot be forced to leave by Black Mirror curses. |
| SP-24 Steam Rune | Implemented: Immediately activate one accessible Tool ability, paying its normal cost.  This activation may bypass the Tool's normal once-per-round usage restriction for this activation only.  The Tool must have a valid target and payable cost. | Implemented: Whenever a Tool ability grants you Courage, increase that Courage gain by 1. |
| SP-25 Lantern of Souls | Implemented: Remove up to 2 Sigil Seals from your learned Spells. | Implemented: Prevent one Sigil Seal each time an effect attempts to place Sigil Seals on your learned Spells. |
| SP-26 Veil of Forgetting | Implemented: Remove all Fear Tokens and Hexlocks from one hero currently in your room.  The chosen hero may be yourself. | Implemented: Reduce Courage loss from Psychological Black Mirror curses by 2. |
| SP-27 Stonewind Equation | Implemented: Immediately move up to 3 rooms through legal connections. | Implemented: Increase normal movement allowance by 2. |
| SP-28 Kaleidoscope Command | Implemented: Relocate 1 already-restored Kaleidoscope fragment into another empty legal Kaleidoscope position.  Do not: - Create a new fragment. - Generate a new collision. - Generate another Mirror Sigil. - Award another restoration Courage bonus.  Preserve valid Kaleidoscope placement rules. | Implemented: You may restore Kaleidoscope fragments anywhere on the Kaleidoscope, ignoring normal edge/adjacency placement restrictions.  Gain 1 additional Courage per successful restoration. |
| SP-29 Chronomantic Anchor | Implemented: Immediately return up to 2 temporarily assigned Quick Sigils from your OTHER learned Spells to your storage.  Do not return permanently bound Sigils.  Do not return the Sigils being spent to activate SP-29 itself. | Implemented: After each successful Quick activation, return 1 of that action's temporarily assigned Sigils immediately to player storage.  Remaining Quick Sigils return normally at the beginning of the next owner turn.  Do not duplicate Sigils or recursively trigger additional activations. |
| SP-30 Doors Without Walls | Implemented: Teleport immediately to any discovered room. | Implemented: Treat the central Mirror Hall as directly connected to your current room for legal movement. |
| SP-31 Occuldor’s Undoing | Implemented: Move Occuldor immediately to any legal room selected by the player.  Use the existing Occuldor relocation engine. | Implemented: You suffer no Courage loss from Occuldor's presence or arrival punishments.  Other non-Courage effects remain unless the existing rules say otherwise. |
| SP-32 Midnight Chorus | Implemented: Place 2 Portal Tokens: - One in your current room. - One in another explored room.  Use the existing Portal network. | Implemented: At the beginning of each of your turns, you may place a Portal Token in your current room if none is present and a token is available.  This is an ongoing optional turn-start effect.  Do not require more Sigils each turn.  Do not manufacture unlimited Portal Tokens. |
| SP-33 The Witches’ Covenant | Implemented: Steal 1 Companion currently attached to another player in your room.  Transfer its card and current attachment ownership to the Spell owner.  This is an explicit magical exception to ordinary Loyal behavior.  Preserve the original discoverer identity.  Stolen Loyal Companions now follow their current controlling owner until a later explicit effect changes that relationship.  Stolen Strays retain normal Stray behavior and can transfer again when another player leaves first.  Do not trigger discovery rewards. | Implemented: Your attached Companions are immune to forced abandonment and Companion conflicts.  Do not change normal Stray first-to-leave ownership transfers unless the rules explicitly say so. |
| SP-34 Fifth Reflection | Implemented: Move 1 loose White Mirror and 1 loose Black Mirror from explored rooms into your current room.  Resolve a Mirror collision if their combination creates one.  Require both eligible Mirror cards. | Implemented: You may perform Mirror placement and flipping actions in any explored room as though physically present there.  Preserve: - Normal Mirror action legality. - Mirror collision sequence. - Fragment restoration. - Sigil generation. - Occuldor effects. - Black Mirror curse ownership.  A remotely flipped Black Mirror's curse affects the hero who flipped it.  Occuldor's arrival punishment affects heroes physically occupying the target room under the established rules. |
| SP-35 Unbroken Horizon | Implemented: Teleport yourself and up to 1 willing hero occupying your room to any discovered room.  Obtain the other hero's consent through the existing player-choice system. | Implemented: Ignore Paralysis and Threshold Seal movement restrictions.  Do not automatically remove their tokens. |

## Tool prerequisites awaiting design review

No legacy Tool name is mapped by old Item ID to an unrelated revised Item. The default policy is BLOCK, confirmed by the designer. These printed prerequisites remain visible on the cards and in disabled-learning reasons:

| Spell | Unresolved prerequisite |
|---|---|
| SP-17 Prismatic Exchange | Prism Lens |
| SP-20 Star Compass | Astrolabe |
| SP-21 Molten Path | Geode Compass |
| SP-23 Gravestone Key | Necronomicon |
| SP-24 Steam Rune | Chronoscope |
| SP-26 Veil of Forgetting | Psychograph |
| SP-27 Stonewind Equation | Chronoscope |
| SP-28 Kaleidoscope Command | Prism Lens |
| SP-29 Chronomantic Anchor | Chronoscope |
| SP-30 Doors Without Walls | Cryptex |
| SP-31 Occuldor’s Undoing | Necronomicon |
| SP-32 Midnight Chorus | Phonograph |
| SP-33 The Witches’ Covenant | Florist’s Shears |
| SP-34 Fifth Reflection | Astrolabe |
| SP-35 Unbroken Horizon | Geode Compass |

## Shared operations and integration

- Token removal targets Fear, Paralysis, Hexlocks and Sigil Seals without conflating removal, immunity or ignored restrictions. Central curse hooks apply complete SP-16 Seal immunity, one-per-effect SP-25 prevention, SP-18 Paralysis immunity and Companion protection.
- Movement, teleportation, forced routes, Hall links and Portal access reuse the existing connection and room-entry services. Stray departures and Companion conflicts still resolve there. SP-35 records a saved invitation, spends nothing until the invited hero explicitly accepts, revalidates, then moves both heroes once.
- Shared physical-object transfers use existing card/token instances. SP-15 exchanges a carried Element with a real explored-room token. SP-17 moves at most two from one room. Learning modifiers substitute contributions without manufacturing tokens.
- Remote White placement and SP-34 pair placement reuse mirrorPlacement. When moved loose Mirrors create an eligible pair, normal placement reveals all White discoveries and brings Occuldor to guard the Black Mirror; it does not bypass the later legal flip. Action limits remain shared. Remote curses target the casting hero, while arrival punishment targets actual occupants of the destination room. SP-13's Permanent collision reward and SP-08/SP-28 fragment rewards are separate and each issued once.
- SP-24 validates and pays a Tool's ordinary costs, temporarily bypassing its usage limit for that activation only. Its selected Sigil sacrifices retain physical identity even after paying activation costs. SP-29 returns actual Quick IDs early and never resets the once-per-turn usage ledger.
- Portal markers share one finite configured supply. SP-32 Quick requires two unused tokens and two rooms without Portals; its pair uses matching-color travel. Permanent offers a saved, optional turn-start placement after normal start-of-turn resolution, with no new Sigil payment.
- Companion current ownership is the containing player's collection. originalDiscoverer preserves historical discovery independently of existing Loyal recruitment bookkeeping. Magical theft does not trigger discovery rewards. Strays can transfer again normally.
- Fragment relocation conserves the 35 positions/pieces and issues no new restoration, Sigil, Rage or Courage. Recorded gem rewards cannot be awarded again if a fragment is moved away and the gap later reclosed. Legacy completed gems without ownership history are marked awarded with neutral color.

## Configurable assumptions / open questions

1. EXCLUSIVE_ACTIVE_MODE remains the default; BOTH_ALLOWED is a playtest option. No approval was inferred to change the established alternatives rule.
2. One Quick activation per Spell per owner turn remains the default. Early Sigil return does not permit loops or reset this limit.
3. Quick movement is additional and does not fulfill mandatory normal movement.
4. Fifteen obsolete Tool prerequisites remain blocked until explicit replacements are supplied.
5. Portal supply is **10 provisional tokens**, configurable through spellPolicies.portalTokenSupply; the designer has not yet confirmed a count. Existing loaded Portals are retained if a later limit is lower, but no additional tokens can be placed until capacity exists.
6. Fragment relocation does not alter past Courage; conservative relocation legality keeps remaining glass connected and applies normal destination adjacency. SP-28 Permanent independently allows unrestricted new placement.
7. Moving Mirrors may install a legal pair; normal guarded-Black/flip ordering is retained. No automatic curse/flip occurs merely because two loose Mirrors meet.
8. Permanent SP-29 returns the first printed assigned Sigil deterministically. Selecting which of several colors returns remains a design choice to revisit.
9. SP-16's total Seal immunity is intentionally stronger than SP-25's prevention of one per placement effect; this balancing issue is preserved, not silently corrected.
10. Existing public discovered-Black inspection remains unchanged; this update does not redesign Black Mirror visibility.

## Files and extension points

Catalog: reference/Spell_Catalog_v0.4.md, src/game/cards/spells-v04.json, catalog.ts, spellEffects.ts, toolPrerequisites.ts.

Domain: systems/spellActivation.ts, spellModifiers.ts, spellState.ts, sigils.ts, mirrorPlacement.ts; integrations in domain/engine.ts, map/castleConnections.ts, map/kaleidoscopeCells.ts, systems/blackMirrorRuntime.ts, inventoryCapacity.ts, elementPayment.ts, spells.ts, itemActions.ts, itemAccess.ts, companionConflicts.ts, portals.ts and secrets.ts; configuration in gameRulesConfig.ts.

UI: SpellActivationControls, SpellTargets, SpellPrompts, RemoteMirrorControls, SpellCastGuide, MirrorPlacementDialog, CardFace, Game, InventorySlots, KaleidoscopeBoard, HowToPlay, globals.css. React portals keep action controls outside the card while socket selection stays local and reversible until confirmation.

Tests: spell-activation.test.ts covers every Quick and every Permanent plus shared integrations; revised learning/Item/component tests reject obsolete Tool remapping. Browser tests cover socket/action separation, paid Tool use, target maps, saved consent, turn-start Portal offers and fragment relocation alongside the full game regression suite.

## Verification

326 unit/component tests passed, including 99 focused v0.4 activation/integration cases covering every Quick and Permanent. All 38 Playwright tests passed. TypeScript and production build passed. Browser coverage verifies that Sigil sockets remain inside the card and activation/targets are outside it, plus saved consent, Tool payment, finite Portal offers, remote actions, relocation, the full mirror loop and endgame. Desktop and mobile screenshots were inspected.

