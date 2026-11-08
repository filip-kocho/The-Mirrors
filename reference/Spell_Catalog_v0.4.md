
# THE MIRRORS — SPELL IMPLEMENTATION
## Complete Spell Catalog v0.4
## Quick & Permanent Activation Engine

You are a senior TypeScript/JavaScript game developer and systems architect.

Your task is to implement the complete revised Spell system for The Mirrors, using the 35 Spell definitions and rules in this specification.

This version supersedes earlier Spell-effect proposals.

Implement working gameplay effects, not merely card descriptions or visual interactions.

Do not redesign unrelated Items, Black Mirrors, Secrets, Companions or castle rules.

==================================================
1. FUNDAMENTAL SPELL RULES
==================================================

The game contains 35 Spells:

BASIC: SP-01 to SP-16 (16)
INTERMEDIATE: SP-17 to SP-27 (11)
ADVANCED: SP-28 to SP-35 (8)

Learning costs:

Basic: 1 Element.
Intermediate: 2 Elements.
Advanced: 4 Elements.

Some Spells originally had additional Tool prerequisites. Inspect the repository for valid, current Tool requirements.

IMPORTANT:
The previous Spell catalog refers to obsolete Tools such as Prism Lens, Astrolabe, Chronoscope and Necronomicon.

Do not automatically map those names to unrelated revised Items or invent new Tool cards.

Report unresolved prerequisites for design review.

SPELL LEARNING:

- Player must have an unlocked Knowledge slot.
- Pay required Elements using existing learning rules.
- Apply valid Equipment effects to learning.
- Learn the Spell.
- Place it on the player board.
- Sigil sockets are initially empty.
- Learning does not activate Quick or Permanent.

There are four Knowledge slots with established Sigil-based unlocking rules.

Do not modify those rules.

==================================================
2. QUICK VS PERMANENT ACTIVATION
==================================================

QUICK ACTION:

A Quick action is an immediate action.

When the player activates Quick:

1. Verify the Spell is learned.
2. Verify the player has the required available Sigils.
3. Verify the effect has legal targets and can resolve.
4. Allow selection of matching Sigil sockets.
5. Confirm activation.
6. Move the Sigils from player storage to Quick assignment.
7. Immediately execute the Spell effect.
8. Keep the Sigils visibly assigned.
9. Return them to the player's storage at the beginning of the owner's next turn.

Quick does not mean "wait until something occurs later."

Every Quick effect in this catalog must execute during activation.

PERMANENT ACTION:

When the player activates Permanent:

1. Validate all requirements.
2. Bind the required Sigils permanently.
3. Activate the ongoing effect immediately.
4. Keep Sigils displayed on the Spell.
5. Maintain the effect through subsequent turns.
6. Remove the effect if the Spell leaves play.
7. Discard permanently bound Sigils when the Spell is abandoned.

Permanent Sigils NEVER return to player storage.

Permanent effects may:
- Modify rules.
- Prevent penalties.
- Provide passive bonuses.
- Automatically respond to events.
- Provide persistent permissions.

No additional Sigil payment is required each turn.

==================================================
3. SIGIL SOCKET SYSTEM
==================================================

Each Spell has Quick and Permanent Sigil requirements.

Sigil sockets must be clickable.

Visual socket states:

EMPTY
AVAILABLE
PENDING_SELECTION
QUICK_ASSIGNED
PERMANENT_BOUND
BLOCKED_BY_SEAL

When every required Sigil is available and the effect is otherwise legal, the action should glow.

If either Quick or Permanent can be activated, show an appropriate indicator on the learned Spell card.

If both are available, show both indicators.

The required Sigil colors must match exactly.

Two sockets requiring the same color need two physical Sigils.

Do not allow a single physical Sigil to fill several sockets.

Pending selection must be reversible before confirmation.

Commit all Sigils atomically.

Sigil states must remain consistent across:
- Player storage.
- Learned Spell cards.
- Temporary Quick assignments.
- Permanent binding.
- Discard.

==================================================
4. SIGIL REQUIREMENTS
==================================================

Preserve the existing exact-color Sigil requirements from the original Spell catalog unless a revised canonical mapping is already defined in the project.

Historical color codes:

Sc = Scarlet
Em = Emerald
Ab = Amber
Fu = Fuchsia
Av = Amethyst

These are historical requirement identities, not an instruction to recreate obsolete graphical colors.

Use the current canonical Sigil types and glyphs.

If a color migration is missing, report it rather than arbitrarily assigning a new color.

REQUIREMENT TABLE:

ID     QUICK       PERMANENT

SP-01  Sc          Sc+Em
SP-02  Em          Em+Ab
SP-03  Ab          Ab+Sc
SP-04  Fu          Fu+Em
SP-05  Av          Av+Sc
SP-06  Fu          Fu+Ab
SP-07  Ab          Ab+Em
SP-08  Sc          Sc+Fu
SP-09  Em          Em+Av
SP-10  Av          Av+Ab
SP-11  Em          Em+Fu
SP-12  Ab          Ab+Av
SP-13  Sc          Sc+Ab
SP-14  Fu          Fu+Em
SP-15  Av          Av+Fu
SP-16  Sc          Sc+Av

SP-17  Ab+Fu       Ab+Fu
SP-18  Sc+Em       Sc+Em
SP-19  Em+Fu       Em+Fu
SP-20  Av+Ab       Av+Ab
SP-21  Sc+Ab       Sc+Ab
SP-22  Em+Ab       Em+Ab
SP-23  Av+Sc       Av+Sc
SP-24  Sc+Fu       Sc+Fu
SP-25  Av+Em       Av+Em
SP-26  Fu+Av       Fu+Av
SP-27  Ab+Em       Ab+Em

SP-28  Ab+Av       Ab+Av+Fu
SP-29  Fu+Av       Fu+Av+Em
SP-30  Sc+Ab       Sc+Ab+Av
SP-31  Av+Sc       Av+Sc+Fu
SP-32  Em+Fu       Em+Fu+Av
SP-33  Em+Av       Em+Av+Ab
SP-34  Av+Ab       Av+Ab+Fu
SP-35  Sc+Em       Sc+Em+Ab

==================================================
5. ELEMENT RULES
==================================================

There are five Elements:

AIR
WATER
EARTH
FIRE
AETHER

Elements are obtained randomly from the Element bag.

IMPORTANT:

Do not allow the player to choose arbitrary Element types from a general supply.

Spells may:
- Manipulate Elements already present in rooms.
- Exchange physical Elements with other physical Elements.
- Move Elements between rooms.
- Discard Elements.
- Modify learning payments.

Spells may NOT:
- Generate arbitrary chosen Elements from the bag.
- Duplicate physical Element tokens.
- Treat Element substitutions as generating extra tokens.

The randomly delivered Element economy must remain intact.

==================================================
6. COMPLETE BASIC SPELL CATALOG
==================================================

All Basic Spells require 1 Element to learn.

SP-01 — SPARK OF CERTAINTY
Learning: Fire

QUICK:
Remove 1 Fear Token from yourself and gain 1 Courage.

PERMANENT:
Reduce Courage loss from each Black Mirror curse by 1.

SP-02 — DRAWN CURTAIN
Learning: Air

QUICK:
Immediately move to an adjacent room through a legal connection.

PERMANENT:
Increase movement allowance by 1.

SP-03 — CRYSTAL SKIN
Learning: Earth

QUICK:
Remove 1 Hexlock Token from yourself.

PERMANENT:
Reduce Courage loss from Occuldor punishments by 1.

SP-04 — RIPPLING STEP
Learning: Water

QUICK:
Remove 1 Darkness Token from an explored room and gain 1 Courage.

PERMANENT:
Darkness does not prevent the owner from performing room actions.

SP-05 — AETHER THREAD
Learning: Aether

QUICK:
Move 1 loose Mirror card from an adjacent explored room into your current room.

Use the existing room-object and collision system if the movement creates a Mirror pair.

PERMANENT:
Aether can substitute for any Element type when learning Spells.

Do not create new Elements.

SP-06 — MIRROR GLANCE
Learning: Air

QUICK:
Place 1 carried White Mirror into an adjacent explored room.

If a collision occurs, resolve it through the standard Mirror collision process.

PERMANENT:
You may place White Mirrors in adjacent explored rooms as though physically present.

Preserve normal placement limits and costs.

SP-07 — STONE MARK
Learning: Earth

QUICK:
Move 1 Item or Element from an adjacent explored room into your current room.

PERMANENT:
Increase Equipment/Tool carrying capacity by 1.

SP-08 — EMBER PULSE
Learning: Fire

QUICK:
Discard 1 carried Element.
Gain 3 Courage.

PERMANENT:
Whenever you restore a Kaleidoscope fragment, gain 1 additional Courage.

SP-09 — CALM WATERS
Learning: Water

QUICK:
Remove up to 2 Fear Tokens from yourself.

At least one eligible Fear Token must exist.

PERMANENT:
Normal movement allowance cannot fall below 2 because of the Fear tier alone.

Other movement restrictions continue to apply.

SP-10 — ASTRAL NOTATION
Learning: Aether

QUICK:
Privately inspect the fragment colors of up to 2 unexplored rooms.

PERMANENT:
You can see the fragment colors of adjacent unexplored rooms.

Do not reveal Black Mirror curse contents.

SP-11 — ECHO WALK
Learning: Air

QUICK:
Move 1 loose Element from an adjacent explored room into your current room.

PERMANENT:
Tools in adjacent explored rooms count as accessible to you.

Do not duplicate the Tool cards or grant extra Tool activations.

SP-12 — GEODE SHELTER
Learning: Earth

QUICK:
Remove 1 Darkness Token from your current or an adjacent room.

PERMANENT:
Increase carried Mirror capacity by 1.

SP-13 — KINDLE RESOLVE
Learning: Fire

QUICK:
Discard 1 carried Mirror to gain 3 Courage.

PERMANENT:
Gain 1 additional Courage whenever you complete a Mirror collision.

Do not trigger twice for the same collision.

SP-14 — TRANQUIL REFLECTION
Learning: Water

QUICK:
Remove up to 1 Paralysis Token and 1 Fear Token from yourself.

Require at least one eligible token.

PERMANENT:
Ignore Paralysis movement restrictions.

Paralysis Tokens may still exist unless prevented by another effect.

SP-15 — WHISPER OF ORIGIN
Learning: Aether

QUICK:
Exchange 1 carried Element with 1 physical Element present in an explored room.

The player's original Element is left in the selected room.

Do not draw from the Element bag.

PERMANENT:
Increase Element carrying capacity by 1.

SP-16 — WARDING FLAME
Learning: Fire

QUICK:
Remove 1 Sigil Seal from one of your learned Spells.

PERMANENT:
Prevent ALL new Sigil Seals from being placed on your learned Spell actions.

Existing Seals are not automatically removed by activation.

==================================================
7. COMPLETE INTERMEDIATE SPELL CATALOG
==================================================

Intermediate Spells require 2 printed Elements.

SP-17 — PRISMATIC EXCHANGE
Learning: Air + Earth

QUICK:
Move up to 2 loose Elements from one explored room into your current room.

Require at least one available Element.

PERMANENT:
When learning a Spell, treat one paid Element as another Element type.

Do not create additional Element tokens.

SP-18 — PURIFYING STEAM
Learning: Air + Fire

QUICK:
Remove up to 2 Paralysis and/or Hexlock Tokens from yourself.

PERMANENT:
Become completely immune to Paralysis.

Remove any existing Paralysis Tokens when Permanent activates.

Prevent new Paralysis Tokens while the Spell is active.

SP-19 — CORRIDOR MIST
Learning: Air + Water

QUICK:
Teleport immediately to an explored room within 2 map connections.

PERMANENT:
You may use the Portal network from your current room as though that room contained a Portal, provided another active Portal exists.

Use existing Portal travel rules.

SP-20 — STAR COMPASS
Learning: Air + Aether

QUICK:
Immediately move to any explored room whose Kaleidoscope fragment has not yet been restored.

PERMANENT:
See fragment colors of unexplored rooms up to 2 connections from your room.

SP-21 — MOLTEN PATH
Learning: Earth + Fire

QUICK:
Immediately cross one Threshold-Sealed connection to an adjacent room.

PERMANENT:
Threshold Seals do not block your movement.

Do not delete Threshold Seal tokens.

SP-22 — ROOTED WARD
Learning: Earth + Water

QUICK:
Remove up to 2 Darkness Tokens from one explored room.

PERMANENT:
Reduce Courage loss from Occuldor punishments by 2.

SP-23 — GRAVESTONE KEY
Learning: Earth + Aether

QUICK:
Move 1 unowned Companion from an adjacent explored room into your current room and recruit it.

Do not create a duplicate Companion card.

PERMANENT:
Companions attached to you cannot be forced to leave by Black Mirror curses.

SP-24 — STEAM RUNE
Learning: Fire + Water

QUICK:
Immediately activate one accessible Tool ability, paying its normal cost.

This activation may bypass the Tool's normal once-per-round usage restriction for this activation only.

The Tool must have a valid target and payable cost.

PERMANENT:
Whenever a Tool ability grants you Courage, increase that Courage gain by 1.

SP-25 — LANTERN OF SOULS
Learning: Fire + Aether

QUICK:
Remove up to 2 Sigil Seals from your learned Spells.

PERMANENT:
Prevent one Sigil Seal each time an effect attempts to place Sigil Seals on your learned Spells.

SP-26 — VEIL OF FORGETTING
Learning: Water + Aether

QUICK:
Remove all Fear Tokens and Hexlocks from one hero currently in your room.

The chosen hero may be yourself.

PERMANENT:
Reduce Courage loss from Psychological Black Mirror curses by 2.

SP-27 — STONEWIND EQUATION
Learning: Air + Earth

QUICK:
Immediately move up to 3 rooms through legal connections.

PERMANENT:
Increase normal movement allowance by 2.

==================================================
8. COMPLETE ADVANCED SPELL CATALOG
==================================================

Advanced Spells require 4 printed Elements.

SP-28 — KALEIDOSCOPE COMMAND
Learning: Earth + Fire + Water + Aether

QUICK:
Relocate 1 already-restored Kaleidoscope fragment into another empty legal Kaleidoscope position.

Do not:
- Create a new fragment.
- Generate a new collision.
- Generate another Mirror Sigil.
- Award another restoration Courage bonus.

Preserve valid Kaleidoscope placement rules.

PERMANENT:
You may restore Kaleidoscope fragments anywhere on the Kaleidoscope, ignoring normal edge/adjacency placement restrictions.

Gain 1 additional Courage per successful restoration.

SP-29 — CHRONOMANTIC ANCHOR
Learning: Earth + Fire + Water + Aether

QUICK:
Immediately return up to 2 temporarily assigned Quick Sigils from your OTHER learned Spells to your storage.

Do not return permanently bound Sigils.

Do not return the Sigils being spent to activate SP-29 itself.

PERMANENT:
After each successful Quick activation, return 1 of that action's temporarily assigned Sigils immediately to player storage.

Remaining Quick Sigils return normally at the beginning of the next owner turn.

Do not duplicate Sigils or recursively trigger additional activations.

SP-30 — DOORS WITHOUT WALLS
Learning: Air + Fire + Water + Aether

QUICK:
Teleport immediately to any discovered room.

PERMANENT:
Treat the central Mirror Hall as directly connected to your current room for legal movement.

SP-31 — OCCULDOR'S UNDOING
Learning: Air + Fire + Water + Aether

QUICK:
Move Occuldor immediately to any legal room selected by the player.

Use the existing Occuldor relocation engine.

PERMANENT:
You suffer no Courage loss from Occuldor's presence or arrival punishments.

Other non-Courage effects remain unless the existing rules say otherwise.

SP-32 — RESONANT GATE
Learning: Air + Earth + Water + Aether

QUICK:
Place 2 Portal Tokens:
- One in your current room.
- One in another explored room.

Use the existing Portal network.

PERMANENT:
At the beginning of each of your turns, you may place a Portal Token in your current room if none is present and a token is available.

This is an ongoing optional turn-start effect.

Do not require more Sigils each turn.

Do not manufacture unlimited Portal Tokens.

SP-33 — THE WITCHES' COVENANT
Learning: Air + Earth + Water + Aether

QUICK:
Steal 1 Companion currently attached to another player in your room.

Transfer its card and current attachment ownership to the Spell owner.

This is an explicit magical exception to ordinary Loyal behavior.

Preserve the original discoverer identity.

Stolen Loyal Companions now follow their current controlling owner until a later explicit effect changes that relationship.

Stolen Strays retain normal Stray behavior and can transfer again when another player leaves first.

Do not trigger discovery rewards.

PERMANENT:
Your attached Companions are immune to forced abandonment and Companion conflicts.

Do not change normal Stray first-to-leave ownership transfers unless the rules explicitly say so.

SP-34 — FIFTH REFLECTION
Learning: Air + Earth + Fire + Aether

QUICK:
Move 1 loose White Mirror and 1 loose Black Mirror from explored rooms into your current room.

Resolve a Mirror collision if their combination creates one.

Require both eligible Mirror cards.

PERMANENT:
You may perform Mirror placement and flipping actions in any explored room as though physically present there.

Preserve:
- Normal Mirror action legality.
- Mirror collision sequence.
- Fragment restoration.
- Sigil generation.
- Occuldor effects.
- Black Mirror curse ownership.

A remotely flipped Black Mirror's curse affects the hero who flipped it.

Occuldor's arrival punishment affects heroes physically occupying the target room under the established rules.

SP-35 — UNBROKEN HORIZON
Learning: Air + Earth + Fire + Water

QUICK:
Teleport yourself and up to 1 willing hero occupying your room to any discovered room.

Obtain the other hero's consent through the existing player-choice system.

PERMANENT:
Ignore Paralysis and Threshold Seal movement restrictions.

Do not automatically remove their tokens.

==================================================
9. SPELL EFFECT ARCHITECTURE
==================================================

Do not implement 35 unrelated functions embedded in UI components.

Use a declarative effect system where possible.

Each Spell must contain:
- ID
- Name
- Tier
- Learning Elements
- Tool prerequisite (only if valid)
- Quick Sigil requirements
- Quick effect definition
- Permanent Sigil requirements
- Permanent effect definition
- Targeting requirements
- Status
- Version

Use two primary execution categories:

IMMEDIATE_EFFECT
PERSISTENT_EFFECT

IMMEDIATE_EFFECT:
- Performs a state mutation when activated.
- Resolves immediately.
- Does not wait for future events.
- May permanently change the world.
- Has a clear target selection and outcome.

PERSISTENT_EFFECT:
- Registers ongoing permissions, modifiers, immunities or automatic triggers.
- Remains active while the Spell is learned and not suppressed.
- Does not repeat Sigil payment.
- Is removed or deactivated when the Spell leaves play.

Suggested reusable operations:

GAIN_COURAGE
DISCARD_ELEMENT
DISCARD_MIRROR
REMOVE_PLAYER_TOKEN
REMOVE_ROOM_TOKEN
TRANSFER_ROOM_OBJECT
EXCHANGE_PHYSICAL_ELEMENTS
MOVE_PLAYER
TELEPORT_PLAYER
MODIFY_MOVEMENT
MODIFY_CAPACITY
MODIFY_ELEMENT_PAYMENT
MODIFY_COURAGE_LOSS
PREVENT_TOKEN_APPLICATION
INSPECT_UNEXPLORED_FRAGMENT
PLACE_REMOTE_MIRROR
MOVE_MIRRORS
RELOCATE_FRAGMENT
MODIFY_KALEIDOSCOPE_PLACEMENT
REFRESH_QUICK_SIGILS
PLACE_PORTAL
RELOCATE_OCCULDOR
TRANSFER_COMPANION_OWNERSHIP
PREVENT_COMPANION_ABANDONMENT
EXTEND_MIRROR_ACTION_RANGE

Reuse existing domain operations instead of inventing duplicate movement, inventory, or collision systems.

==================================================
10. ACTIVATION AND TARGET SELECTION
==================================================

The Spell panel must support:

- Quick and Permanent sections.
- Exact required Sigil sockets.
- Clickable sockets.
- Available Sigils glowing.
- Affordable action highlighting.
- Target selection.
- Confirmation.
- Cancellation.
- Assigned Sigil visuals.
- Active Permanent indicators.

IMPORTANT:

Every Quick ability must have a legal target or valid immediate outcome.

Before spending Sigils:

1. Verify Spell ownership.
2. Verify action availability.
3. Verify Sigil affordability.
4. Verify required targets exist.
5. Collect player choices.
6. Revalidate against authoritative game state.
7. Commit Sigils and resolve the action atomically.

If the action cannot resolve:
- Do not consume Sigils.
- Do not mark the action used.
- Explain the restriction.

Do not permit a Quick action to be activated merely to wait for a future trigger.

==================================================
11. MOVEMENT SPELLS
==================================================

Movement spells must integrate with mandatory movement.

Distinguish:
- Normal mandatory movement.
- Additional immediate movement.
- Teleportation.
- Remote movement through a sealed connection.
- Movement involving other heroes.
- Stray Companion transfers.

Use the existing movement engine.

Do not create a second movement system for Spells.

For Quick movement:
- Resolve the movement immediately.
- Trigger legal movement and room entry effects.
- Resolve Companion movement and transfer rules.
- Apply Occuldor interactions where relevant.

Whether additional Spell movement can replace mandatory movement is not yet finalized.

Preserve the established movement requirement and report any unresolved interaction.

==================================================
12. MIRROR ACTION SPELLS
==================================================

SP-05, SP-06 and SP-34 interact with physical Mirror cards.

Never duplicate Mirror cards.

Use existing operations for:
- Moving a loose Mirror.
- Placing a White Mirror.
- Placing a Black Mirror.
- Flipping a Black Mirror.
- Resolving a collision.
- Restoring the room fragment.
- Awarding the Mirror Sigil.
- Increasing Occuldor Rage.

A Spell must not generate a second fragment or a second Sigil for a single collision.

Maintain Black Mirror curse secrecy until the normal flip or explicit reveal event.

Discovered Mirror card locations are public information.

Do not implement redundant secret inspections of already visible Mirror placements.

==================================================
13. PERMANENT IMMUNITIES
==================================================

SP-16:
Complete prevention of new Sigil Seals.

SP-18:
Complete prevention of Paralysis, removing existing Paralysis when activated.

SP-21:
Threshold Seals no longer block movement.

SP-23:
Prevent forced abandonment of attached Companions from Black Mirror effects.

SP-31:
Prevent Courage loss from Occuldor punishments.

SP-33:
Prevent forced abandonment and Companion conflicts.

SP-35:
Ignore Paralysis and Threshold Seal movement restrictions.

These effects must be applied through central rule/modifier pipelines.

Do not scatter special-case Spell ID checks throughout UI and gameplay code.

Distinguish:
- Prevent token creation.
- Remove existing tokens.
- Ignore a restriction while tokens remain.
- Suppress an effect temporarily.

These are different mechanics.

==================================================
14. BLACK MIRROR SIGIL SEALS
==================================================

Black Mirror Sigil Seals may:
- Block Quick activation.
- Suppress active Permanent effects.

If an action is sealed:
- It cannot be activated.
- It must not glow as available.
- Existing Sigil assignments are not automatically returned.
- Permanently bound Sigils remain bound.
- Temporarily assigned Quick Sigils still return at the normal time.

SP-16 Permanent prevents new Seals.

SP-16 Quick removes an existing Seal when activation is legal.

SP-25 Quick removes up to 2 existing Seals.

SP-25 Permanent prevents one Seal from each qualifying placement effect.

If the Spell containing a removal ability is itself blocked by a Seal, follow the existing action-blocking rules.

Do not allow sealed abilities to activate merely to remove their own Seal unless an explicit rule permits it.

==================================================
15. TURN-START QUICK SIGIL RETURN
==================================================

At the start of the owner's NEXT turn:

1. Find temporary Quick assignments due for return.
2. Remove their Spell assignment.
3. Return the same physical Sigils to player storage.
4. Clear relevant Quick socket visuals.
5. Recompute all Spell availability indicators.
6. Continue normal turn-start processing.

This must be authoritative and idempotent.

Do not implement this through browser timers, animations or component mount effects.

SP-29 may return eligible Quick Sigils earlier.

Early-returned Sigils must not return again at the original turn-start boundary.

==================================================
16. PERMANENT SIGIL DISPOSAL
==================================================

When a Spell with a Permanent action is discarded, replaced or abandoned:

- Deactivate its ongoing effect.
- Discard all permanently bound Sigils.
- Never return those Sigils to storage.
- Free its Knowledge slot according to established rules.
- Preserve previously unlocked Knowledge capacity.
- Remove any stale modifiers or listeners.

Ensure Items and Black Mirror effects that discard Spells use this same cleanup process.

==================================================
17. UI REQUIREMENTS
==================================================

Every learned Spell card must show:

- Spell ID and name.
- Tier.
- Quick readiness.
- Permanent readiness.
- Assigned Sigils.
- Permanent activation status.
- Relevant Sigil Seals.

Opening a Spell must show:

QUICK:
- Immediate effect description.
- Required sockets.
- Available Sigils.
- Legal targets.
- Activate Quick button.

PERMANENT:
- Ongoing effect description.
- Required sockets.
- Available Sigils.
- Bind Permanently button.
- Permanent binding warning.
- Active/suppressed state.

After activation:

QUICK:
Show Sigils assigned beneath Quick and a return-next-turn indication.

PERMANENT:
Show Sigils bound beneath Permanent with a locked magical appearance.

For effects requiring a target:
- Provide a room/card/hero selection UI.
- Highlight legal targets.
- Do not permit invalid selection.
- Allow cancellation before committing Sigils.

Use the existing game's visual language and canonical Sigil glyphs.

==================================================
18. AUTOMATED TESTING
==================================================

Create tests for every Spell.

For each Quick:
- Valid activation resolves its effect immediately.
- Invalid activation consumes no Sigils.
- Correct physical objects are modified.
- Required targets are validated.
- No duplicate rewards or tokens appear.

For each Permanent:
- Activation binds correct Sigils.
- Effect remains active through turns.
- Effect is suppressed correctly by Sigil Seals.
- Sigils never return automatically.
- Discarding the Spell removes its ongoing effect.

Specific integration tests:

SP-05:
Moving a loose Mirror preserves physical identity and may trigger a legal collision.

SP-06:
Remote White Mirror placement respects the normal collision resolver.

SP-15:
Element exchange moves real existing tokens; no bag choice.

SP-16:
All new Sigil Seals are prevented while Permanent is active.

SP-17:
Moving Elements does not manufacture new tokens.

SP-18:
Paralysis immunity is complete.

SP-20:
Teleport only to legal explored rooms with unrestored fragments.

SP-24:
Tool activation pays normal costs and cannot create a repeated activation loop.

SP-26:
Remove all selected hero's eligible Fear Tokens and Hexlocks.

SP-28:
Fragment relocation does not award duplicate Sigils or Courage.

SP-29:
Early Quick Sigil return cannot duplicate Sigils.

SP-30:
Teleport preserves legal Companion movement and ownership.

SP-31:
Occuldor relocation and penalty prevention work through the existing engine.

SP-32:
Portal creation requires actual available Portal Tokens.
Permanent effect does not consume extra Sigils per turn.

SP-33:
Stealing a Companion changes current ownership but preserves original discoverer.
Stray transfer behavior remains valid.
No discovery rewards are triggered.

SP-34:
Remote Mirror operations resolve collisions and curses correctly.

SP-35:
Both heroes move exactly once to the destination.
Consent is required.
Companion and Stray ownership remains consistent.

Also test:
- Save/load.
- Player ownership.
- Duplicate activation prevention.
- Once-per-turn and once-per-round limits.
- Sigil availability glow.
- Permanent/Quick mode policy.
- Black Mirror interactions.
- Item bonuses and immunities.
- Secret SE-14 permanent-Sigil achievement.
- Knowledge-slot replacement.

==================================================
19. IMPLEMENTATION PHASES
==================================================

PHASE 1 — Audit
Inspect Spell definitions, Sigil storage, movement, inventory, tokens and effect engine.

PHASE 2 — Catalog
Replace all 35 Spell effects with the v0.4 definitions above.

PHASE 3 — Activation
Ensure Quick resolves immediately and Permanent produces ongoing effects.

PHASE 4 — Reusable effects
Implement token removal, physical resource transfer, movement, teleportation, remote Mirror actions, Portal placement, fragment relocation, and Companion theft.

PHASE 5 — Persistent modifiers
Implement ongoing capacities, immunities, movement modifiers, visibility, Courage effects and special permissions.

PHASE 6 — UI
Implement clickable Sigil sockets, glow, target selection, activation feedback and bound Sigil presentation.

PHASE 7 — Integration
Connect Spells to Items, Secrets, Companions, Black Mirrors and Occuldor.

PHASE 8 — Tests
Implement individual card tests and full game-state regression coverage.

PHASE 9 — Documentation
Record all implementation choices and remaining rule questions.

==================================================
20. UNRESOLVED RULES TO REPORT
==================================================

Do not silently invent answers to these questions:

1. Can one learned Spell use Quick after Permanent has been activated?
   The original catalog treated configurations as alternatives.

2. Can the same Quick ability activate more than once during one player turn?
   The previous implementation proposal used one activation per Spell per turn.

3. Can immediate Spell movement replace mandatory movement?
   Do not change the existing mandatory-movement rule without approval.

4. How are obsolete Tool learning prerequisites migrated to the revised Item catalog?

5. Are there enough physical Portal Tokens for SP-32, and what happens when the supply is exhausted?

6. Does remotely relocating Kaleidoscope fragments change past Courage awards?
   Default for v0.4: No recalculation or duplicate reward.

7. Does remote Mirror action use the same normal Mirror action allowance?
   Preserve existing restrictions unless an explicit Spell effect overrides them.

8. If SP-33 steals a Loyal Companion, what happens if a later effect refers to its original discoverer?
   Preserve both original discoverer and current owner.

9. SP-16's Permanent Sigil Seal immunity is stronger than SP-25's Permanent effect.
   Report this balancing issue rather than silently changing either Spell.

10. SP-29 may create powerful repeated Quick-use combinations.
    Preserve physical Sigil accounting and flag potential infinite activation loops.

==================================================
21. DEFINITION OF DONE
==================================================

The implementation is complete when:

- All 35 updated Spell cards exist.
- Quick effects resolve immediately.
- Permanent effects remain active while learned.
- Sigil costs are correct.
- Sigil sockets are clickable.
- Eligible Spell actions glow.
- Quick Sigils return at the owner's next turn.
- Permanent Sigils never return.
- Spells use actual physical Elements and Mirrors.
- Random Element bag rules remain intact.
- Remote Mirror actions work.
- Token removal and immunity work.
- Portal and teleportation actions work.
- Companion stealing works.
- All existing Spell effects have been replaced.
- Save/load works.
- Automated tests pass.

After implementation, report:
1. Files modified.
2. Spell cards implemented.
3. Reusable effects added.
4. UI components changed.
5. Tests executed and results.
6. Legacy Tool prerequisites requiring review.
7. Remaining rule ambiguities.
8. Any Spell that could not be implemented and the exact reason.

Do not silently substitute a different effect for an unavailable mechanic.

END OF SPECIFICATION
