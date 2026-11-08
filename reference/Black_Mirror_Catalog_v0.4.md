
# THE MIRRORS — BLACK MIRROR CARD CATALOG & IMPLEMENTATION

## Your role

Act as a senior TypeScript/JavaScript game developer, board-game systems designer, and software architect.

You are working on an existing digital implementation of the original board game **The Mirrors**.

Your assignment is to implement the complete **Black Mirror deck (35 cards)**, including all curses, new tokens, target selection, movement, character inventory interactions, Spell and Companion interactions, castle modifications, and Occuldor encounters.

The specification below is **Black Mirror Catalog v0.4 — Review Implementation**.

Do not redesign the entire game. Integrate these mechanics into the existing application and follow the project's established architecture and conventions.

Before making changes, inspect the repository to understand:
- Game state, turn management, and player movement.
- Room exploration and discovery.
- White Mirror and Black Mirror placement and collision.
- Hero Courage/Fear tracking.
- Player inventories and carrying capacity.
- Items, Elements, and Mirror cards.
- Learned Spells, Sigil assignments, and Knowledge slots.
- Companion ownership and movement.
- Occuldor's position, Rage, and punishment calculation.
- Current card catalog format, persistence, and UI components.
- Existing automated tests.

Reuse existing types and components wherever possible. Do not add a framework or large dependency unless justified.

---

# 1. CORE BLACK MIRROR RULES

The Black Mirror deck contains exactly 35 unique cards, divided into five subtypes:

| Subtype | IDs | Count |
|---|---|---|
| Psychological | BM-01 – BM-07 | 7 |
| Material | BM-08 – BM-14 | 7 |
| Spatial | BM-15 – BM-21 | 7 |
| Supernatural | BM-22 – BM-28 | 7 |
| Castle-wide | BM-29 – BM-35 | 7 |

Each card has:
- Stable unique ID
- Name
- Subtype
- Effect description
- Structured, executable effect definitions
- Targeting and timing requirements
- Optional token operations
- Review status

## Black Mirror activation

1. Black Mirror cards start hidden.
2. The player may voluntarily flip an unblocked Black Mirror.
3. Reveal its identity and resolve its curse.
4. Integrate with the existing White/Black Mirror collision mechanism.
5. Restore the appropriate Kaleidoscope fragment and award its corresponding Mirror Sigil.
6. Apply existing Courage restoration rewards and Occuldor Rage changes.
7. Resolve any effects specifically requiring "after collision."

Black Mirror curses generally target only the hero who flips the card. Some Castle-wide cards create persistent environmental effects affecting rooms and later visitors.

Occuldor's normal arrival punishment is a separate game system. BM-34 and BM-35 explicitly invoke it.

IMPORTANT:
- Do not duplicate collision rewards, Sigil generation, or Rage increments.
- Do not alter the existing rule that Black Mirror flipping is optional.
- Preserve the existing mandatory movement rule, except where a card explicitly overrides it.
- Preserve the current death/collision resolution behavior until the unresolved rule is approved.
- Make curse resolution deterministic and safe against repeated invocation.

---

# 2. NEW TOKEN SYSTEM

Implement seven token types.

Use thematic display names, but stable internal identifiers.

## TOKEN 1: PARALYSIS

Internal type: PARALYSIS
Display name: Paralysis Token
Owner: Player
Lifetime: Temporary

Rules:
- Prevents the affected hero from leaving their current room.
- Remove one Paralysis Token at the start of each affected player's turn.
- The player cannot leave the room during a turn in which a Paralysis Token was removed.
- Other actions allowed in the current room remain available, unless a separate effect prevents them.
- Mandatory movement is suspended while paralyzed.
- Multiple Paralysis Tokens mean multiple immobilized turns.

Example:
A hero receives 2 Paralysis Tokens.

Next turn: remove 1; cannot move.
Following turn: remove the last 1; cannot move.
Third turn: normal movement resumes.

## TOKEN 2: HEXLOCK

Internal type: HEXLOCK
Display name: Hexlock Token
Owner: Player inventory capacity
Lifetime: Temporary

Suggested categories:
- ELEMENT
- ITEM
- MIRROR
- KNOWLEDGE

Rules:
- Each Hexlock temporarily seals one carrying or Knowledge slot in its assigned category.
- The player cannot carry objects in sealed capacity.
- Remove exactly one Hexlock at the start of each player's turn, even if several different categories have Hexlocks.
- Capacity becomes available again after removal.
- Hexlocks may stack and extend the binding duration.
- Objects dropped in a room remain available under existing room-sharing rules.
- Equipment that expands capacity must continue to work with this system.
- Prevent negative usable capacity.

A category may have Hexlocks even when the player currently holds no objects in that category.

The KNOWLEDGE category is provisional for BM-26 and must be explicitly documented.

## TOKEN 3: FEAR

Internal type: FEAR
Display name: Fear Token
Owner: Player
Lifetime: Objective-based

IMPORTANT: This token is separate from the existing Courage/Fear track.

Rules:
- The hero must visit another previously discovered room.
- Remove one Fear Token after completing such a visit.
- Remove at most one Fear Token per player turn.
- The destination must be different from the room where the requirement was acquired.
- More than one Fear Token requires qualifying visits on separate turns.
- Fear Tokens remain until their requirements are completed.

Do not implement restrictions using hidden "remember next turn" logic. The token must be visible in the game state and UI.

## TOKEN 4: THRESHOLD SEAL

Internal type: THRESHOLD_SEAL
Display name: Threshold Seal
Owner: Connection between two rooms
Lifetime: Permanent

Rules:
- Permanently blocks a normal corridor connection.
- Normal movement cannot cross that connection.
- Multiple Seals cannot be placed on an already-blocked connection unless existing game mechanics explicitly support stacking.
- Seals do not automatically expire.
- A placement cannot make the remaining game unwinnable by isolating required, unresolved fragments.
- Treat Portals as separate magical connections.
- Show blocked connections clearly on the board.

Implement a legal-placement validator using the actual room connectivity graph.

Do not invent corridor connections or room coordinates.

## TOKEN 5: SIGIL SEAL

Internal type: SIGIL_SEAL
Display name: Sigil Seal
Owner: Spell/action
Lifetime: Temporary

Rules:
- Disables the specified Sigil-activated action.
- Supports Quick actions, Permanent actions, and effects covering both.
- Does not remove or refund assigned Sigils.
- Remove exactly one Sigil Seal at the start of the afflicted player's turn.
- An action with multiple Seals remains blocked until all its Seals have been removed.
- Permanent effects are suppressed while sealed and resume after the final relevant Seal is removed.
- If Spells are abandoned or transferred, their Seal state must remain consistent and must not create orphaned effects.

Implement generic target scopes:
- QUICK
- PERMANENT
- ALL
- SPECIFIC_ACTION

For cards that block all eligible actions, use one Seal per eligible Spell as the provisional policy. That Seal suppresses all applicable actions on the Spell.

For BM-28, all three Seals target one specific Quick action.

## TOKEN 6: DARKNESS

Internal type: DARKNESS
Display name: Darkness Token
Owner: Room
Lifetime: Until removed by Courage payment

Rules:
- A room containing Darkness restricts visiting heroes from performing ordinary room actions.
- The visiting hero may spend 1 Courage to remove one Darkness Token.
- All Darkness Tokens in the room must be removed before ordinary room actions become available.
- Multiple Darkness Tokens therefore require multiple Courage payments.
- Heroes can leave a Dark room without removing Darkness.
- Tokens persist until paid for.
- Do not automatically reveal an undiscovered room just because a Darkness Token was placed there.

Apply the room's normal discovery and visibility rules when a hero enters.

## TOKEN 7: PORTAL

Internal type: PORTAL
Display name: Portal Token
Owner: Room
Lifetime: Persistent

Rules:
- Portal rooms form a magical movement network.
- A Portal can connect to any other active Portal.
- The moving player selects the destination Portal.
- A lone Portal cannot be used for travel until another Portal exists.
- Portal movement bypasses ordinary corridor distance and Threshold Seals.
- Integrate Portal movement into the existing movement system.
- Unless the existing game specifies otherwise, using a Portal counts as one movement connection.
- Entering an unexplored room via a Portal triggers the normal room-discovery process.
- Portal movement must not bypass Black Mirror or Occuldor rules unexpectedly.
- The map UI must visibly distinguish Portal connections from ordinary corridors.

---

# 3. BLACK MIRROR CARD CATALOG

Use these IDs and effects exactly unless identified as provisional below.

## PSYCHOLOGICAL — BM-01 to BM-07

BM-01 — Unwelcome Reflection
Subtype: PSYCHOLOGICAL
Effect:
- Lose 2 Courage.
- Gain 1 Paralysis Token.

BM-02 — The Coward in Glass
Subtype: PSYCHOLOGICAL
Effect:
- Lose 1 Courage for each different Mirror Sigil color you currently possess.
- No maximum.
- Gain 1 Paralysis Token.

BM-03 — Duplicated Dread
Subtype: PSYCHOLOGICAL
Effect:
- Lose 1 Courage for each additional Sigil of a color you already possess.
- Example: three Sigils of one color and two of another = three additional Sigils, so lose 3 Courage.
- Gain 1 Paralysis Token.
NOTE: Duplicate-counting interpretation is provisional.

BM-04 — Echo of Panic
Subtype: PSYCHOLOGICAL
Effect:
- If the player has no Companion with them, lose 3 Courage.
- Otherwise, lose 1 Courage.
- Gain 1 Paralysis Token.

BM-05 — Elemental Anxiety
Subtype: PSYCHOLOGICAL
Effect:
- Lose 1 Courage for each different Element type you currently carry.
- Five possible Elements: Air, Water, Earth, Fire, Aether.
- Gain 1 Paralysis Token.

BM-06 — Shattered Nerve
Subtype: PSYCHOLOGICAL
Effect:
- Lose 3 Courage.
- Protective effects cannot prevent this Courage loss.
- Gain 2 Paralysis Tokens.

BM-07 — Occuldor's Smile
Subtype: PSYCHOLOGICAL
Effect:
- Lose 4 Courage.
- Gain 2 Paralysis Tokens.

Paralysis counts of two on BM-06 and BM-07 are provisional balancing choices.

## MATERIAL — BM-08 to BM-14

BM-08 — Empty Pockets
Subtype: MATERIAL
Effect:
- Leave 1 carried Element in the current room.
- Gain 1 Element Hexlock.

BM-09 — The Scattered Pouch
Subtype: MATERIAL
Effect:
- Leave 2 carried Elements in the current room.
- Gain 2 Element Hexlocks.

BM-10 — Elemental Spill
Subtype: MATERIAL
Effect:
- Leave 3 carried Elements in the current room.
- Gain 3 Element Hexlocks.

BM-11 — Total Unbinding
Subtype: MATERIAL
Effect:
- Choose one inventory category: ELEMENT, ITEM, or MIRROR.
- Leave every carried object belonging to that category in the current room.
- Gain one matching Hexlock for each object left.

BM-12 — Threefold Forfeit
Subtype: MATERIAL
Effect:
- Leave 1 carried Element, 1 carried Item, and 1 carried Mirror in the room.
- Gain a matching Hexlock for each object actually left.

BM-13 — The Mirror Toll
Subtype: MATERIAL
Effect:
- Leave exactly 1 White Mirror and 1 Black Mirror in the room.
- Gain 2 Mirror Hexlocks.
- If the player cannot leave both requested cards, instead lose 3 Courage and do not gain those Hexlocks.

BM-14 — Stripped of Wonders
Subtype: MATERIAL
Effect:
Choose one:
A. Leave all carried Items in the room and gain one Item Hexlock per Item left.
B. Lose 3 Courage.

Missing-object provisional policy:
- BM-08, BM-09, and BM-10 drop as many requested Elements as available, but apply their full stated Hexlock counts.
- BM-11 grants Hexlocks equal to objects actually left.
- BM-12 grants Hexlocks for objects actually left.
- BM-14 with zero Items should require choosing the Courage penalty to avoid a free escape.

Do not destroy dropped objects. They must become available in the room through the existing inventory system.

Account for Relics, Equipment, and Tools in the Item category. Do not silently change Item capacity or slot rules.

## SPATIAL — BM-15 to BM-21

BM-15 — Displaced Reflection
Subtype: SPATIAL
Effect (after collision):
- Move the hero to an adjacent room of their choice through an unblocked connection.
- Immediately end the current turn.
- Treat this as forced movement, not a new normal movement action.

BM-16 — Stilled Reflection
Subtype: SPATIAL
Effect (after collision):
- Remain in the current room.
- Immediately end the current turn.
- This explicitly overrides any unfulfilled mandatory movement.

BM-17 — A Familiar Fear
Subtype: SPATIAL
Effect:
- Gain 1 Fear Token.
- Remove the Token after ending movement in a different previously discovered room.

BM-18 — The Long Return
Subtype: SPATIAL
Effect:
- Gain 2 Fear Tokens.
- Each requires a qualifying visit to a previously discovered room.
- Remove at most one Fear Token per turn.

BM-19 — Sealed Threshold
Subtype: SPATIAL
Effect:
- Place 1 permanent Threshold Seal on a legal connection adjacent to the current room.

BM-20 — Warded Passages
Subtype: SPATIAL
Effect:
- Place 2 permanent Threshold Seals.
- First: one legal connection touching the current room.
- Second: one other legal connection anywhere in the castle.

BM-21 — The Castle Closes In
Subtype: SPATIAL
Effect:
- Move the hero to a chosen room in the innermost ring around the central Hall.
- Place 3 permanent Threshold Seals on any three legal castle connections.

The exact set of BM-21 middle/inner rooms must come from existing map metadata. Do not hardcode arbitrary room IDs.

All permanent connection blocks must pass the map's completion-safety validator.

## SUPERNATURAL — BM-22 to BM-28

BM-22 — Frightened Company
Subtype: SUPERNATURAL
Effect:
- Leave all currently attached Companions in the current room.
- Move their cards into the room's Companion collection.
- Other visiting heroes may recruit them.

Companions have two existing attachment behaviors:
LOYAL:
- Follows the player who originally discovered it.
- May be Walking or Carried.

STRAY:
- Follows the first player to leave its current room.
- Transfers ownership if necessary.
- Cannot be carried.

This curse overrides their normal attachment for the purpose of leaving them behind.

Do not reintroduce Resident, Wanderer, or Passer behavior types.

BM-23 — Silenced Invocations
Subtype: SUPERNATURAL
Effect:
- Block all Quick Sigil actions on all eligible learned Spells.
- Place 1 Sigil Seal on each affected Spell.
- Lose 1 Courage for every Sigil Seal placed.
- Remove Sigil Seals using the standard one-per-turn removal rule.

BM-24 — The Great Severance
Subtype: SUPERNATURAL
Effect:
Choose one:
A. Leave all Companions in the current room.
B. Leave all learned Spells in the current room.

Use existing abandon/recruit semantics.
Permanently assigned Sigils on abandoned Spells are discarded according to the previously established Spell rule.

BM-25 — Suppressed Enchantments
Subtype: SUPERNATURAL
Effect:
- Block all Permanent Sigil actions on learned Spells.
- Place 1 Sigil Seal on each eligible Spell.
- Permanently committed Sigils remain attached.
- Effects resume after the applicable Seals are removed.

BM-26 — The Forgotten Grimoire
Subtype: SUPERNATURAL
Effect:
- Leave all learned Spells in the current room.
- Gain one Knowledge Hexlock for each Spell removed from the player's learned Spell slots.
- Do not permanently remove Knowledge unlocks.

KNOWLEDGE Hexlocks are a provisional extension of the Hexlock mechanism.

BM-27 — Total Silence
Subtype: SUPERNATURAL
Effect:
- Block all Sigil-powered actions on all learned Spells.
- Place 1 Sigil Seal on each eligible Spell.
- Suppress both Quick and Permanent effects for the corresponding Spell until its Seal is removed.

BM-28 — The Triple Mute
Subtype: SUPERNATURAL
Effect:
- Choose one learned Spell's Quick Sigil action.
- Place 3 Sigil Seals on that specific action.
- That action remains disabled until all three Seals are removed.

Important:
- A Spell may have several Sigil configurations.
- Match Sigils by their exact color, not by Element type.
- Do not remove physical Sigils when temporarily sealing actions.
- Do not unlock learned Spell slots merely because a Spell was removed or sealed.
- Spells left in rooms must remain accessible according to established room-sharing rules.
- If the player has no matching Spells or Companions, do not invent a Courage penalty. Resolve the applicable empty-target case safely and record it for review.

## CASTLE-WIDE — BM-29 to BM-35

BM-29 — A Light Goes Out
Subtype: CASTLE_WIDE
Effect:
- Select one undiscovered room.
- Place 1 Darkness Token on that room.
- Lose 1 Courage.

BM-30 — Two Darkened Chambers
Subtype: CASTLE_WIDE
Effect:
- Select two different discovered-but-unvisited rooms.
- Place 1 Darkness Token in each room.
- Lose 1 Courage.

BM-31 — Deepening Shadow
Subtype: CASTLE_WIDE
Effect:
- Select one undiscovered room.
- Place 2 Darkness Tokens on that room.
- Lose 1 Courage.

BM-32 — Unseen Gateways
Subtype: CASTLE_WIDE
Effect:
- Select two different undiscovered rooms.
- Place 1 Portal Token in each room.
- Lose 1 Courage.

BM-33 — Forgotten Gateways
Subtype: CASTLE_WIDE
Effect:
- Select two different discovered-but-unvisited rooms.
- Place 1 Portal Token in each room.
- Lose 1 Courage.

BM-34 — Occuldor's Invitation
Subtype: CASTLE_WIDE
Effect:
- Place 1 Portal Token in the current room.
- Immediately attract/summon Occuldor to that room.
- Only the player flipping this Black Mirror suffers Occuldor's normal Rage-based punishment.
- Apply that punishment once.

BM-35 — Face the Master
Subtype: CASTLE_WIDE
Effect:
- Immediately summon Occuldor to the current room.
- The player flipping this card suffers Occuldor's normal Rage-based punishment twice.

Important:
- Reuse the existing Occuldor Rage/punishment calculation.
- Do not implement a second punishment formula.
- Never increase Rage merely for summoning Occuldor unless that is already a separate established rule.
- If Occuldor is guarding another Black Mirror, his relocation must be processed through the existing Occuldor-position state machine.
- Other heroes present in the same room are not punished by BM-34 or BM-35 unless a separate established game rule independently requires it.
- The two punishments in BM-35 should be resolved sequentially.

The phrase "discovered but unvisited" needs to be mapped to actual exploration state. Preserve its intended distinction; do not silently replace it with "any discovered room."

---

# 4. DATA MODEL

Implement the catalog as structured data, not hardcoded UI conditionals.

Prefer the existing repository architecture. A possible model is:

BlackMirrorCard:
- id
- cardType: BLACK_MIRROR
- title
- subtype
- description
- effects[]
- severity (optional, review-only)
- version
- status: REVIEW

Effect descriptors should support:
- LOSE_COURAGE
- ADD_PLAYER_TOKEN
- DROP_INVENTORY
- CHOOSE_ONE
- CONDITIONAL
- FORCED_MOVEMENT
- END_TURN
- PLACE_CONNECTION_TOKEN
- PLACE_ROOM_TOKEN
- BLOCK_SPELL_ACTIONS
- DROP_COMPANIONS
- DROP_SPELLS
- SUMMON_OCCULDOR
- RESOLVE_OCCULDOR_PUNISHMENT

Use strongly typed definitions if the project supports TypeScript.

Avoid embedding game-engine behavior in card description strings. Human-readable descriptions should be generated from or kept consistent with executable data.

Create reusable effect resolvers rather than one large switch containing 35 unrelated hardcoded implementations.

A switch on the small set of effect operation types is acceptable.

---

# 5. RESOLUTION ENGINE

Implement a generic Black Mirror effect-resolution pipeline.

Conceptual flow:

1. Player requests to flip a Black Mirror.
2. Validate the action.
3. Reveal the card.
4. Create an effect-resolution context.
5. Resolve immediate effects.
6. Request any required player choices.
7. Commit legal inventory and token changes.
8. Integrate with the existing collision sequence.
9. Execute after-collision effects.
10. Complete or end the turn according to the card.
11. Persist the resulting game state.

Use existing events or game actions where available.

Suggested conceptual operations:

- revealBlackMirror
- resolveCardEffects
- requestCardChoice
- resolveInventoryDrop
- applyToken
- removeExpiredTokens
- validateCorridorSealPlacement
- resolvePortalMovement
- blockSpellAction
- summonOcculdor
- completeBlackMirrorResolution

These are conceptual names, not mandatory new functions.

## State consistency

- Resolve each card exactly once per activation.
- Do not duplicate Sigils or Courage rewards.
- Prevent repeated token application after re-rendering.
- Preserve determinism and replayability where the existing game supports it.
- Keep all token and effect state serializable.
- Support save/load without losing temporary effects.
- Use existing multiplayer/turn authority patterns if present.
- Ensure pending player choices survive the application's normal state transitions.

## Timing

Tokens must have a predictable lifecycle.

At the start of an affected player's turn:
- Remove at most 1 Paralysis Token.
- Remove at most 1 Hexlock.
- Remove at most 1 Sigil Seal.
- Do not remove Fear Tokens automatically.
- Do not remove room Darkness, Portals, or Threshold Seals automatically.

Different temporary token types each remove their own allowance. For example, the player may remove one Hexlock and one Sigil Seal during the same turn.

Paralysis still prevents movement on the turn its last token is removed.

No token may be removed twice because a React component re-rendered.

## Player choices

Provide an explicit choice interaction for:
- Selecting which Elements or other inventory objects to leave.
- Choosing the inventory category for BM-11.
- Choosing the alternative in BM-14 and BM-24.
- Choosing destination rooms.
- Selecting corridors to seal.
- Selecting rooms for Darkness and Portals.
- Choosing Sigil actions for BM-28.
- Choosing which eligible token is removed when several Sigil Seals or Hexlocks exist.

Highlight legal targets and disable invalid targets.

Do not automatically choose the first target just because it is convenient.

---

# 6. UI REQUIREMENTS

Integrate new behavior into the existing game UI.

## Black Mirror card

Display:
- Card title
- Subtype
- Effect description
- Relevant token symbols
- Immediate or after-collision timing where useful

Reuse existing Black Mirror visual assets.

## Player board

Display:
- Paralysis Token count
- Hexlocks, grouped by affected inventory category
- Fear Token count
- Active Sigil Seals

Clearly show unusable inventory or Knowledge slots.

## Castle map

Display:
- Permanent Threshold Seals on corridors
- Darkness Token counts on rooms
- Portal Tokens on rooms
- Legal Portal destinations during movement
- Relevant targeting and selection feedback

## Spell cards

Display:
- Sealed Quick actions
- Sealed Permanent actions
- Number of Sigil Seals on a specific action
- Whether Permanent effects are suppressed

## Interaction feedback

After resolving a curse, show a concise outcome summary.

Example:

"BM-09 — The Scattered Pouch
You left 2 Elements in the room.
You gained 2 Hexlocks.
Your Element carrying capacity is temporarily reduced."

Follow existing design conventions; do not redesign the entire interface.

Avoid adding unnecessary confirmation dialogs for actions already confirmed through gameplay.

---

# 7. EDGE CASES AND SAFETY

Address these explicitly:

1. A curse requires more objects than the player carries.
2. Inventory capacity is already partially blocked.
3. Equipment increases capacity while Hexlocks exist.
4. A player has no Items, Mirrors, Elements, Spells, or Companions.
5. A Companion is Loyal or Stray when abandoned by a curse.
6. A player drops a Spell with permanently committed Sigils.
7. A Spell has several Quick or Permanent actions.
8. Multiple Sigil Seals are attached to the same action.
9. Sigil Seals remain attached when ownership or Spell location changes.
10. A player cannot move because of Paralysis.
11. A forced movement effect occurs before mandatory movement.
12. A forced movement ends the player's turn.
13. A Threshold Seal would disconnect a required castle section.
14. There are no legal corridors left to seal.
15. There are not enough eligible rooms for Darkness or Portal placement.
16. Darkness exists on an undiscovered room.
17. Multiple Portals exist in the castle.
18. A Portal leads into a room that has not yet been discovered.
19. Occuldor is already in the target room or guarding another Black Mirror.
20. A Courage penalty would kill the hero.
21. Existing room-sharing mechanics interact with dropped items and spells.
22. Repeated effects must not produce duplicate card or token mutations.

Do not silently choose game-design answers to unresolved cases.

Where a fallback is necessary for a playable implementation:
- Prefer configurable resolution policies.
- Mark provisional defaults clearly.
- Add tests proving their behavior.
- Report unresolved decisions after implementation.

---

# 8. TESTING REQUIREMENTS

Use the project's existing test framework.

## Catalog validation tests

Verify:
- Exactly 35 Black Mirror cards exist.
- All IDs BM-01 through BM-35 are unique and consecutive.
- Every card belongs to exactly one of the five subtypes.
- Each subtype contains exactly seven cards.
- Every effect uses a supported typed operation.
- Every token reference is valid.
- Each card has a nonempty name and description.
- No references to obsolete Companion types exist.

## Token lifecycle tests

Test:
- Paralysis with 1, 2, and 3 tokens.
- Paralysis overriding mandatory movement.
- Hexlock with multiple categories.
- Element, Mirror, Item, and Knowledge capacity changes.
- Sigil Seal stacking on one action.
- Sigil Seal removal across several Spells.
- Fear completion requiring separate visits.
- Darkness payment and removal.
- Portal connections with 1, 2, and 3 active Portals.
- Permanent Threshold Seal placement.

## Card effect tests

Provide at least one automated scenario for every BM-01 through BM-35.

Pay particular attention to:

BM-02:
0 to 5 different Sigil colors. No maximum of three.

BM-03:
Repeated Sigil colors, with duplicate counting.

BM-04:
No Companion versus Companion present.

BM-05:
Multiple copies of one Element versus different Elements.

BM-08 to BM-14:
Available resources, missing resources, capacity reduction, and room inventory.

BM-15 and BM-16:
Correct turn-ending behavior.

BM-17 and BM-18:
Fear requirement and one-per-turn removal.

BM-19 to BM-21:
Permanent corridor blocks and connectivity validation.

BM-22 and BM-24:
Loyal and Stray Companion abandonment.

BM-23 to BM-28:
Quick/Permanent Spell suppression, Sigil binding, and staged Seal removal.

BM-29 to BM-31:
Darkness room selection, stacking, and Courage payments.

BM-32 and BM-33:
Portal creation and destination choice.

BM-34 and BM-35:
Occuldor relocation and correct punishment count.

## Regression tests

Verify:
- White Mirror discovery still works.
- Ordinary movement still works.
- Collision restores exactly one fragment.
- A restored fragment is not restored twice.
- Sigil awards remain correct.
- Occuldor Rage changes only as intended.
- Card effects cannot be activated multiple times.
- Save/load preserves active tokens and modified castle connections.

---

# 9. PROVISIONAL RULES / DESIGN QUESTIONS

The following are not fully finalized. Keep them explicit.

A. Does a Sigil permanently committed to a Spell count as "possessed" for BM-02 and BM-03?

B. For BM-03, does every additional duplicate Sigil count, or should all Sigils belonging to a repeated color count?

C. Are BM-06 and BM-07 supposed to grant two Paralysis Tokens, or one like the other Psychological cards?

D. If BM-12 requires an Item, Mirror, or Element the player lacks, is that component skipped, or does another penalty apply?

E. Should BM-26 create one Knowledge Hexlock for every abandoned Spell or follow another rule?

F. Can a Loyal Companion abandoned through BM-22 or BM-24 become Loyal to a new hero, and how do abandoned Strays behave?

G. What exactly does "discovered but unvisited" mean for BM-30 and BM-33? Is it relative to the current hero, or to all players?

H. What happens if no legal destination or Threshold Seal placement exists?

I. When Occuldor is summoned elsewhere, what happens to the mirror he was previously guarding?

J. Does a Black Mirror collision finish if its curse kills the flipping hero?

K. What happens to Sigil Seals when a Spell is abandoned?

L. Does a Portal count as one movement step, and can Occuldor use Portals?

M. Does permanent corridor blocking apply to Occuldor as well as heroes?

N. Can room inventory, including spells and items, be used while a hero has Paralysis Tokens?

Implement agreed rules directly. For unresolved rules, prefer the provisional interpretation in this prompt where supplied, isolate it in configurable logic, and document the decision. Do not quietly turn a provisional interpretation into a permanent canonical game rule.

---

# 10. IMPLEMENTATION DELIVERABLES

Produce:

1. **Black Mirror card catalog**
   - All 35 cards in the repository's preferred structured format.
   - Stable IDs.
   - Human-readable descriptions.
   - Executable effect definitions.

2. **Reusable curse-resolution engine**
   - Immediate effects.
   - Player choices.
   - Deferred after-collision effects.
   - Proper event ordering.

3. **Token system**
   - All seven types.
   - Correct owners and lifecycles.
   - Persistent and temporary effects.
   - Save/load compatibility.

4. **Game-state integration**
   - Inventory capacity.
   - Movement and mandatory-turn logic.
   - Companions.
   - Spells and Sigils.
   - Room contents.
   - Map connections.
   - Occuldor.

5. **User interface**
   - Card details.
   - Token counters and indicators.
   - Target selection.
   - Castle board overlays.
   - Effect feedback.

6. **Automated tests**
   - Full catalog coverage.
   - Token lifecycle tests.
   - Every card's primary effect.
   - Important interactions and regressions.

7. **Developer documentation**
   - Explain the effect architecture.
   - Explain token lifecycle semantics.
   - Provide examples of adding new cards.
   - List provisional assumptions and unresolved game-design decisions.

---

# 11. WORKFLOW AND COMPLETION CRITERIA

Implement in this order:

Phase 1 — Repository inspection and architecture mapping
Phase 2 — Catalog and effect types
Phase 3 — Reusable token/state infrastructure
Phase 4 — Psychological and Material effects
Phase 5 — Spatial effects and castle connections
Phase 6 — Supernatural effects and Spell/Companion integrations
Phase 7 — Castle-wide effects, Darkness, Portals, and Occuldor
Phase 8 — UI integration and automated testing

These are implementation stages, not separate projects. Complete the full feature in the current assignment where feasible.

Do not stop after creating the catalog or example cards. The goal is a working integration.

When finished, provide:
- A summary of changes.
- Files added or modified.
- Implemented cards and token mechanics.
- Test commands and results.
- Any incomplete behavior or blocking constraints.
- A concise list of provisional decisions requiring game-designer approval.

## Definition of done

The application contains all 35 Black Mirror cards, resolves supported effects through the normal game loop, displays and persists the new tokens, correctly interacts with hero inventories, Spells, Companions, castle connections, and Occuldor, and has automated tests for all 35 cards.

Avoid unrelated refactoring.

Keep the implementation modular, deterministic, and easy to rebalance as the game design evolves.

END OF SPECIFICATION
