
# THE MIRRORS — COMPANION SYSTEM IMPLEMENTATION
## Version 0.6 — Core Mechanics Only

You are a senior TypeScript/JavaScript game developer working on the existing digital implementation of The Mirrors.

Your task is to implement the complete Companion system according to the rules below.

IMPORTANT:
- Do NOT invent Companion abilities or special powers.
- Do NOT introduce Power Scores or numerical strength calculations.
- Do NOT implement a combat system.
- Do NOT assign new Courage bonuses to Companions.
- Do NOT redesign unrelated cards.
- Preserve existing card abilities where possible, but do not modify or add them as part of this task.
- Focus on Companion characteristics, ownership, movement, carrying, relationships, conflicts, and the Ghost Twins.

Inspect the existing project architecture before making changes.

========================================
1. COMPANION CATALOG
========================================

The game contains exactly 10 Companion cards.

Use these IDs and names:

CO-01 — Rex the Dog
CO-02 — Alexis the Cat
CO-03 — Poe the Raven
CO-04 — Roderick the Rat
CO-05 — Madison the Ghost Sister Twin
CO-06 — Mason the Ghost Brother Twin
CO-07 — Mad Mara
CO-08 — Mamba the Snake
CO-09 — Clementine the Spider
CO-10 — Julia the Venus

Replace outdated characters:
- Julius the Rat becomes Roderick the Rat.
- Mad Mama becomes Mad Mara.
- Coco the Rabbit becomes Clementine the Spider.

Preserve the stable card IDs.

Do not create additional Companion cards.

========================================
2. COMPANION CHARACTERISTICS
========================================

Each Companion has four independent classifications:

A. MOVEMENT
- LOYAL
- STRAY

B. FOLLOWING
- FOLLOWER
- CARRIER

C. FEARING
- DREAD
- HUNT

D. EATING
- PREDATOR
- PREY

These represent different aspects of Companion behavior.

Do not combine them into a single subtype.

----------------------------------------
2.1 MOVEMENT
----------------------------------------

LOYAL:

A Loyal Companion follows the player currently holding its Companion card.

- Initially belongs to the discovering player.
- Moves with its current owner.
- Does not transfer to another player through ordinary room departure.
- May change ownership through an explicitly permitted game effect.

STRAY:

A Stray Companion follows the FIRST player who leaves its current room.

- Initially belongs to the discovering player.
- When any player leaves the room first, the Stray follows that player.
- Its Companion card transfers to the departing player.
- The departing player becomes its current owner.
- Subsequent room departures follow the same rule.

Example:

Player A owns Alexis the Cat.

Player B enters A's room.

If B leaves first, Alexis follows B.

The card transfers from Player A to Player B.

If A leaves first, Alexis follows A.

IMPORTANT:

A Stray transfer occurs on ROOM DEPARTURE, not room entry.

Do not trigger transfers during movement previews or invalid movement attempts.

----------------------------------------
2.2 FOLLOWING
----------------------------------------

FOLLOWER:

- Stays in the player's dedicated free Companion area.
- Does not occupy an Item slot.
- Travels with its owner according to its Movement behavior.

CARRIER:

- Must occupy one Item slot on the player's board.
- Its Companion card is placed in that slot.
- Uses carrying capacity.
- Travels with the player according to its Movement behavior.

A Companion can be:

LOYAL + FOLLOWER
LOYAL + CARRIER
STRAY + FOLLOWER
STRAY + CARRIER

All combinations are valid.

Do not preserve the obsolete rule that Strays cannot be carried.

If a Stray Carrier changes owners, its Item-slot usage must be transferred accordingly.

Do not allow illegal inventory overflow.

The exact available Item-slot category must follow the existing inventory system.

----------------------------------------
2.3 FEARING
----------------------------------------

DREAD:

Lists the Companion IDs that this Companion fears.

When an applicable feared Companion is encountered, this Companion must flee according to the fear-resolution rules.

HUNT:

Lists the Companion IDs that this Companion frightens.

These are the Companions that must flee from this one.

DREAD and HUNT should be reciprocal relationships.

Example:

Rex has:
DREAD: [Mad Mara]

Mad Mara has:
HUNT: [Rex]

Therefore Rex flees from Mad Mara when a valid fear encounter occurs.

----------------------------------------
2.4 EATING
----------------------------------------

PREDATOR:

Lists Companion IDs that this Companion can eat.

PREY:

Lists Companion IDs that can eat this Companion.

Predator and Prey relationships must be reciprocal.

Example:

Rex:
PREDATOR: [Alexis, Roderick]

Alexis:
PREY: [Rex]

Roderick:
PREY: [Rex]

Eating permanently removes the eaten Companion from play.

The eaten card:
- Is removed from its owner.
- Is removed from any occupied Item slot.
- No longer participates in movement or conflicts.
- Cannot be recruited again.
- Is moved to the game's removed/discarded Companion state.

========================================
3. COMPANION DEFINITIONS
========================================

Use the following exact Movement and Following classifications:

CO-01 — REX THE DOG
Movement: LOYAL
Following: FOLLOWER

CO-02 — ALEXIS THE CAT
Movement: STRAY
Following: FOLLOWER

CO-03 — POE THE RAVEN
Movement: STRAY
Following: FOLLOWER

CO-04 — RODERICK THE RAT
Movement: STRAY
Following: FOLLOWER

CO-05 — MADISON THE GHOST SISTER TWIN
Movement: LOYAL
Following: FOLLOWER

CO-06 — MASON THE GHOST BROTHER TWIN
Movement: LOYAL
Following: FOLLOWER

CO-07 — MAD MARA
Movement: STRAY
Following: FOLLOWER

CO-08 — MAMBA THE SNAKE
Movement: STRAY
Following: CARRIER

CO-09 — CLEMENTINE THE SPIDER
Movement: STRAY
Following: CARRIER

CO-10 — JULIA THE VENUS
Movement: STRAY
Following: CARRIER

NOTE:
Mason and Madison change their Movement classification after their special reunion event.

========================================
4. COMPLETE RELATIONSHIP MATRIX
========================================

Use Companion IDs internally, never display-name comparisons.

CO-01 — REX

DREAD:
CO-07

HUNT:
CO-02, CO-04

PREDATOR:
CO-02, CO-04

PREY:
None

---

CO-02 — ALEXIS

DREAD:
CO-01, CO-07

HUNT:
CO-04, CO-09

PREDATOR:
CO-04, CO-09

PREY:
CO-01

---

CO-03 — POE

DREAD:
CO-10

HUNT:
CO-09

PREDATOR:
CO-09

PREY:
CO-10

---

CO-04 — RODERICK

DREAD:
CO-01, CO-02, CO-08, CO-10, CO-07

HUNT:
None

PREDATOR:
None

PREY:
CO-01, CO-02, CO-08, CO-10

---

CO-05 — MADISON

DREAD:
CO-09, CO-07

HUNT:
None

PREDATOR:
None

PREY:
None

---

CO-06 — MASON

DREAD:
CO-09, CO-07

HUNT:
None

PREDATOR:
None

PREY:
None

---

CO-07 — MAD MARA

DREAD:
None

HUNT:
CO-01, CO-02, CO-04, CO-05, CO-06

PREDATOR:
None

PREY:
None

---

CO-08 — MAMBA

DREAD:
None

HUNT:
CO-04, CO-09

PREDATOR:
CO-04, CO-09

PREY:
None

---

CO-09 — CLEMENTINE

DREAD:
CO-02, CO-08, CO-10, CO-03

HUNT:
CO-05, CO-06

PREDATOR:
None

PREY:
CO-02, CO-08, CO-10, CO-03

---

CO-10 — JULIA

DREAD:
None

HUNT:
CO-04, CO-09, CO-03

PREDATOR:
CO-04, CO-09, CO-03

PREY:
None

========================================
5. CONFLICT RESOLUTION PRIORITY
========================================

When Companions encounter one another, evaluate relationships in this order:

1. EATING — Predator / Prey
2. FEARING — Hunt / Dread

Eating has priority over Hunting.

Example:

Rex encounters Alexis.

Rex both Hunts and can Eat Alexis.

Result:
- Resolve eating.
- Alexis is removed from the game.
- Do not also resolve a fleeing effect for Alexis.

When a pair has no eating relationship, check fear.

Example:

Mad Mara encounters Rex.

Mad Mara Hunts Rex but cannot Eat Rex.

Result:
- Resolve the fear relationship.
- Rex must flee.

Use one centralized encounter resolver.

Do not duplicate conflict logic across Companion UI components.

Prevent repeated resolutions and infinite conflict loops.

The exact fleeing destination and protection rules are not yet finalized.

Isolate those policies rather than inventing new rules.

========================================
6. COMPANION DISCOVERY
========================================

Companions are discovered through White Mirrors.

When discovered:

1. Reveal the Companion.
2. Assign it to the discovering player.
3. Record its original discoverer.
4. Set the current owner.
5. Apply Movement classification.
6. Apply Following classification.
7. Place it in the correct player area.
8. Validate Item capacity for Carriers.
9. Resolve applicable Companion encounters.
10. Persist the resulting state.

Initially, every Companion belongs to the discovering player.

Do not create Resident or Wanderer Companion types.

Companions may subsequently be left in rooms through game effects.

========================================
7. PLAYER BOARD INTEGRATION
========================================

The player board must have:

A. FREE COMPANION AREA

For FOLLOWERS:
- Display all attached Follower cards.
- Do not consume Item slots.

B. ITEM INVENTORY

For CARRIERS:
- Display Companion cards inside valid Item slots.
- Count each Carrier toward carrying capacity.

Do not create an unrelated Carrier inventory.

Use the existing Item capacity implementation.

A Carrier card must not simultaneously appear in the free Follower area and an Item slot.

When ownership transfers:
- Remove the card from the previous owner's area.
- Add it to the new owner's appropriate area.
- Recalculate capacities.
- Update the visual state.

========================================
8. GHOST TWINS — SPECIAL SYSTEM
========================================

The Ghost Twins are:

CO-05 — Madison
CO-06 — Mason

Initially:
- Both are LOYAL.
- Both are FOLLOWERS.
- They may have different owners.
- Their cards are independent.

They have a unique REUNION mechanic.

----------------------------------------
8.1 REUNION
----------------------------------------

When the Twins are united in the same room, they become eligible for their reunion event.

After the reunion completes:

- BOTH become STRAY.
- Both remain FOLLOWERS.
- Both belong to ONE player.
- Both must remain together.
- Both cards become permanently linked.
- They cannot be separated by ordinary movement.
- They transfer together.

Do not merge the two physical cards.

Create a persistent linked-group relationship.

----------------------------------------
8.2 LINKED TWINS
----------------------------------------

After reunion:

Mason and Madison behave as one Stray group for movement and ownership.

Example:

Player A owns both Twins.

Player B enters the same room.

Player B leaves first.

Result:
- Both Twins follow Player B.
- Both cards transfer to B.
- Player A loses both cards.

Do not transfer only Mason or only Madison.

----------------------------------------
8.3 OWNERSHIP AT REUNION
----------------------------------------

The exact initial claim rule when the Twins are held by different players has not been explicitly finalized.

Implement a configurable reunion-claim policy.

Suggested provisional behavior from prior design discussion:

- When both Twins meet in one room, register reunion as pending.
- The first player to depart that room becomes owner of both.
- Both become permanently linked Strays.

If both Twins already have the same owner, they may reunite immediately under the configured policy.

Do not hardcode this provisional claim rule into unrelated movement logic.

The confirmed invariant is:

AFTER REUNION, BOTH TWINS ARE STRAY AND ALWAYS BELONG TO THE SAME PLAYER.

----------------------------------------
8.4 SPECIAL TARGETING
----------------------------------------

Effects that move, transfer, abandon, or remove Companions must preserve the linked state.

Do not allow an ordinary single-Companion action to split reunited Twins.

If an existing action cannot legally target the linked group, reject the partial operation or use an explicitly approved group-handling policy.

Do not invent a new Twin ability in this task.

========================================
9. ROOM DEPARTURE PROCESSING
========================================

Integrate Companion processing with the existing movement engine.

When a player leaves a room:

1. Validate legal movement.
2. Identify attached Loyal Companions.
3. Identify Strays present in the departure room.
4. Identify reunited Twin group, if present.
5. Resolve applicable transfer restrictions.
6. Check Carrier Item-slot capacity.
7. Transfer eligible Strays.
8. Transfer both Twins atomically if linked.
9. Move the player and accompanying Companions.
10. Update ownership and locations.
11. Resolve relevant room-entry encounters.
12. Persist state.

Invalid or canceled movement must not cause Companion transfers.

Mandatory movement must remain governed by existing rules.

For teleports and special movement, reuse the central departure/movement mechanism and document any unresolved exceptions.

========================================
10. COMPANION STATE MODEL
========================================

Use a single authoritative Companion state.

Suggested fields:

CompanionDefinition:
- id
- name
- movementType
- followingType
- dreadIds[]
- huntIds[]
- predatorIds[]
- preyIds[]

CompanionInstance:
- instanceId
- cardId
- originalDiscovererId
- currentOwnerId
- currentRoomId
- attachmentState
- effectiveMovementType
- linkedGroupId

Allowed states should cover:

IN_DECK
ATTACHED
IN_ROOM
REMOVED

Use existing enums or schemas where available.

A Companion cannot simultaneously be:
- Attached to a player.
- Present as a detached card in a room.
- Removed from play.

Preserve physical card identity.

========================================
11. EXISTING CARD INTEGRATION
========================================

The Companion engine must integrate with existing game systems.

Items may:
- Grant rewards when discovering Companions.
- Force Companions to be left in rooms.
- Sacrifice Companions.
- Prevent Companion conflicts.

Spells may:
- Recruit Companions.
- Transfer Companion ownership.
- Prevent forced abandonment.

Black Mirrors may:
- Force Companion abandonment.
- Affect inventory capacity.
- Trigger other existing restrictions.

Secrets may:
- Count attached Companions.
- Check Loyal versus Stray classification.

Do not redesign those other cards in this task.

Use central Companion operations so they work with the new rules.

IMPORTANT:
When a Companion is eaten, all ownership, inventory occupancy, and active-effect references must be cleaned up.

========================================
12. USER INTERFACE
========================================

Update Companion cards to clearly display:

- Character name.
- Movement: Loyal / Stray.
- Following: Follower / Carrier.
- Dread relationships.
- Hunt relationships.
- Predator relationships.
- Prey relationships.

Do not display numerical Power Scores.

Do not introduce or rewrite individual special abilities.

Follower cards must appear in the player's free Companion area.

Carrier cards must occupy Item inventory slots.

When a Stray changes owner:
- Move its card to the new player.
- Update the board.
- Show an appropriate transfer notification.

When a Companion is eaten:
- Remove its card from play.
- Show the appropriate event result.

When a Companion flees:
- Update its location according to the configured fear rules.

For reunited Twins:
- Show both cards as linked.
- Display STRAY on both.
- Show a shared reunion indicator.
- Move both cards together.

========================================
13. AUTOMATED TESTS
========================================

Create tests for:

CATALOG
- Exactly 10 Companion definitions.
- Correct IDs and names.
- Correct Movement and Following classifications.
- Correct relationship matrix.
- Reciprocal relationship validation.

LOYAL
- Loyal follows its current owner.
- Does not transfer automatically.
- Explicit ownership changes remain possible.

STRAY
- First departing player receives Stray.
- Room entry does not transfer Stray.
- Invalid movement does not transfer Stray.
- Transfers are atomic.

FOLLOWER
- No Item slot consumed.

CARRIER
- Item slot required.
- Capacity validated.
- Ownership changes update slot usage.
- No illegal inventory overflow.

EATING
- Predator removes correct Prey.
- Eating occurs before fear.
- Removed Companion cannot reappear.
- Item capacity is released.

FEARING
- Correct Dread and Hunt relationships.
- No duplicate fleeing.
- No infinite conflict chains.

TWINS
- Initially separate Loyal Followers.
- Reunion converts both to Stray.
- Both remain one linked pair.
- Both transfer together.
- They cannot be separated by ordinary movement.
- Linked state survives save/load.

INTEGRATION
- White Mirror discovery.
- Existing Item interactions.
- Existing Spell interactions.
- Black Mirror abandonment.
- Secret eligibility.
- Movement and teleportation.

PERSISTENCE
- Original discoverer.
- Current owner.
- Physical location.
- Carried status.
- Removed status.
- Twin reunion status.

========================================
14. IMPLEMENTATION PLAN
========================================

PHASE 1
Inspect the existing repository and Companion code.

PHASE 2
Replace outdated Companion names and classification data.

PHASE 3
Implement independent Movement and Following systems.

PHASE 4
Integrate Carriers with Item inventory.

PHASE 5
Implement centralized Stray transfers during movement.

PHASE 6
Implement Predator/Prey resolution.

PHASE 7
Implement Hunt/Dread resolution.

PHASE 8
Implement Ghost Twin reunion and linked ownership.

PHASE 9
Integrate existing Items, Spells, Black Mirrors and Secrets.

PHASE 10
Update UI to show Companion classifications and relationships.

PHASE 11
Implement unit and integration tests.

PHASE 12
Document unresolved rules and verify game-state consistency.

========================================
15. STRICT EXCLUSIONS
========================================

Do not implement:

- New Companion special abilities.
- New Companion Courage bonuses.
- Numerical Power Score mechanics.
- Combat or attack calculations.
- Strength-based victory conditions.
- New Companion cards.
- New Companion categories.
- Autonomous Resident/Wanderer behavior.
- Unapproved Twin powers or rewards.

Keep this implementation focused on the Companion framework.

Future work will separately define and balance individual Companion abilities.

========================================
16. DEFINITION OF DONE
========================================

The task is complete when:

1. All 10 Companion cards exist with correct data.
2. Loyal and Stray movement works.
3. Followers and Carriers occupy correct areas.
4. Carriers respect Item capacity.
5. Eating takes priority over Hunting.
6. Dread/Hunt relationships work.
7. Eaten Companions are permanently removed.
8. The Twins can reunite.
9. Reunited Twins become linked Strays.
10. Linked Twins always transfer together.
11. Existing game integrations remain functional.
12. The UI reflects Companion states.
13. Save/load preserves all Companion information.
14. Automated tests pass.
15. No new individual Companion powers are introduced.

After implementation, report:

- Files modified.
- Data-model changes.
- Movement implementation.
- Inventory integration.
- Conflict-resolution implementation.
- Ghost Twins implementation.
- Tests executed and results.
- Unresolved design questions.

END OF SPECIFICATION
