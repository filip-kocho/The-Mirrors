
# THE MIRRORS — SECRET ACHIEVEMENT CARDS
## Complete Catalog and Implementation Specification v0.5

You are a senior TypeScript/JavaScript developer, software architect, and board-game systems engineer working on the existing digital implementation of **The Mirrors**.

Your task is to replace the previous Secret system with a new **hidden achievement system**, containing exactly 15 Secret cards.

Implement the complete card catalog, achievement validation, Courage rewards, player UI, discovery integration, persistence, and tests.

This specification supersedes all previous Secret card effects.

IMPORTANT:
- Preserve the existing IDs SE-01 through SE-15.
- Replace the effects of all previous Secrets.
- Do not modify Black Mirror, Item, Companion, or Spell catalogs unnecessarily.
- Reuse existing game systems and UI conventions.
- Do not invent mechanics to resolve ambiguous cases.
- Complete the implementation rather than merely generating catalog data.

---

# 1. FIRST — INSPECT THE EXISTING PROJECT

Examine the project architecture and identify:

1. Card definitions and catalog formats.
2. Secret cards and private player hands.
3. White Mirror discovery generation.
4. Player inventory and carrying capacities.
5. Element tokens and their physical locations.
6. Black/White Mirror cards and shared carrying slots.
7. Equipment, Tool and Relic categorization.
8. Learned Spells and Knowledge slots.
9. Printed Spell learning-cost levels.
10. Permanent Mirror Sigil assignment.
11. Companion ownership, Loyal and Stray behavior.
12. Courage/Fear track and its maximum value.
13. Turn management and player interactions.
14. Existing event, action, and state-management systems.
15. Save/load and multiplayer visibility rules.
16. Available test framework.

Use existing functionality whenever possible.

Do not introduce a separate inventory system or a second Courage resource.

---

# 2. NEW SECRET SYSTEM — FUNDAMENTAL RULES

All 15 Secrets belong to one subtype:

SECRET_ACHIEVEMENT

Remove the previous Secret subtypes:
- Objective
- Knowledge
- Reaction

The new Secret cards are private, one-time achievements.

## 2.1 Discovery

Secrets are discovered through White Mirror discovery slots.

When a Secret is discovered:
- Draw the Secret card from the Secret deck.
- Give it privately to the player who discovered it.
- Do not place it in the room.
- Do not reveal its identity to other players.
- Do not automatically activate its reward.

The player may keep unlimited Secrets.

Preserve the existing White Mirror discovery distribution.

## 2.2 Achievement conditions

Each Secret has a specific condition involving:
- Carried Elements
- Carried Mirror cards
- Carried Equipment
- Accessible Tools
- Equipped Relics
- Learned Spells
- Permanently assigned Mirror Sigils
- Attached Companions
- Unrevealed Secrets

The player may reveal a Secret when the condition is currently satisfied.

Conditions are checked against the current game state.

Do not use historical event tracking for these achievements.

Example:
SE-01 requires 4 Elements of the same type.

If the player currently carries those Elements, they may reveal the Secret and receive its reward.

If they carried them previously but no longer possess them, they cannot claim it.

## 2.3 Reveal and reward

When the player chooses to reveal an eligible Secret:

1. Validate that the Secret belongs to the player.
2. Validate that it is still hidden and uncompleted.
3. Validate its achievement condition against current game state.
4. Determine its Courage reward.
5. Reveal the card to all players.
6. Award Courage to the owning player.
7. Move the card from their private hand into their completed Secrets collection.
8. Mark the Secret permanently completed.
9. Persist the result.

An achievement is completed only once.

Resources used to satisfy an achievement are NOT consumed.

For example:
SE-03 requires carrying three Black Mirrors.
After completing SE-03, the hero keeps all three Mirrors.

## 2.4 Overlapping achievements

A player may complete several different Secrets using overlapping resources.

Example:
A player carrying three Black Mirrors and one White Mirror may qualify for SE-03 and SE-13 at the same time.

Each Secret:
- Is validated independently.
- Is revealed separately.
- Awards its Courage only once.

Do not block overlapping achievements.

## 2.5 Resource counting

Unless a Secret explicitly states otherwise:

COUNT:
- Elements carried by the hero.
- Mirrors carried by the hero.
- Equipment physically carried by the hero.
- Relics equipped in Relic slots.
- Spells learned in Knowledge slots.
- Companions currently attached to the hero.
- Mirror Sigils currently assigned permanently to learned Spells.
- Unrevealed Secrets in the player's private hand.

DO NOT COUNT:
- Objects merely lying in the room.
- Objects in another player's inventory.
- Discarded Items.
- Discarded Spells.
- Discarded Mirror Sigils.
- Abandoned Companions not attached to the hero.
- Completed Secrets.
- Cards returned to any deck or general supply.

EXCEPTION:
SE-06 explicitly counts accessible Tool cards in the current room.

The established room-sharing rule still applies to ordinary actions, but it does not make room objects count as personally carried for achievements.

---

# 3. COMPLETE SECRET CATALOG — 15 CARDS

## SE-01 — FOUR OF A KIND

Subtype: SECRET_ACHIEVEMENT
Reward: +4 Courage

Condition:
Carry at least 4 Elements of the SAME type simultaneously.

Valid examples:
- 4 Fire
- 4 Water
- 4 Earth
- 4 Air
- 4 Aether

Implementation:
- Count physical carried Element tokens by type.
- At least one type must have count >= 4.
- Wildcard properties of Aether do not change its physical type.
- Element-doubling Equipment does not increase physical token count.

Achievement key:
CARRIED_ELEMENTS_SAME_TYPE

---

## SE-02 — ELEMENTAL HARMONY

Subtype: SECRET_ACHIEVEMENT
Reward: +3 Courage

Condition:
Carry at least 4 DIFFERENT Element types simultaneously.

Implementation:
- Count distinct Element types among carried tokens.
- At least four distinct types must be present.
- Duplicate physical tokens of one type do not increase distinct-type count.
- Aether counts as one distinct type, not every type it could substitute for.

Achievement key:
CARRIED_ELEMENTS_DISTINCT_TYPES

---

## SE-03 — COLLECTOR OF SHADOWS

Subtype: SECRET_ACHIEVEMENT
Reward: +3 Courage

Condition:
Carry at least 3 Black Mirror cards simultaneously.

Implementation:
- Count carried Mirror cards whose family/type is BLACK_MIRROR.
- Do not count Black Mirrors placed in rooms or already resolved through collision.
- Do not count mirror cards accessible from room inventory.

Achievement key:
CARRIED_BLACK_MIRRORS

---

## SE-04 — THE WITCHES' COLLECTION

Subtype: SECRET_ACHIEVEMENT
Reward: +3 Courage

Condition:
Carry at least 3 White Mirror cards simultaneously.

Implementation:
- Count carried WHITE_MIRROR cards only.
- Follow the same carrying rules as SE-03.

Achievement key:
CARRIED_WHITE_MIRRORS

---

## SE-05 — MASTER OF EQUIPMENT

Subtype: SECRET_ACHIEVEMENT
Reward: +4 Courage

Condition:
Carry at least 3 Equipment cards simultaneously.

Implementation:
- Count carried Items with subtype EQUIPMENT.
- Do not count Tools or Relics.
- Do not count Equipment merely lying in the room.
- Reuse the actual inventory capacity rules.

IMPORTANT FEASIBILITY CHECK:
The current Item catalog contains IT-02, which grants +1 Equipment/Tool capacity but itself occupies an Equipment/Tool slot.

Starting capacity is 2.

Therefore, IT-02 alone may not make it possible to carry 3 Equipment cards.

Do not silently count room Equipment or create additional slots merely to make this achievement possible.

Keep the specified condition, check whether other legal capacity sources exist, and report any feasibility issue.

Achievement key:
CARRIED_EQUIPMENT_COUNT

---

## SE-06 — THE MASTER CRAFTSMAN

Subtype: SECRET_ACHIEVEMENT
Reward: +4 Courage

Condition:
Have access to at least 3 DIFFERENT Tool cards simultaneously.

Implementation:
Count distinct Tool cards accessible through:
- The hero's carried Equipment/Tool inventory.
- The currently occupied room's shared Item collection.

Do not count:
- Tools held privately by other players.
- Discarded Tools.
- Duplicate references to the same physical card.

Access does not mean consuming, equipping, or activating the Tools.

The achievement checks simultaneous access, not Tool usage history.

Achievement key:
ACCESSIBLE_DISTINCT_TOOLS

---

## SE-07 — TREASURES OF THE CASTLE

Subtype: SECRET_ACHIEVEMENT
Reward: +4 Courage

Condition:
Have at least 2 Relics equipped simultaneously.

Implementation:
- Count Relics in the hero's actual Relic slots.
- Do not count unequipped Relics present in the room.
- Base Relic capacity is 1.
- IT-02 and IT-24 each provide +1 Relic capacity.
- Relic is the only correct category name.

Do not introduce an Artifact subtype.

Achievement key:
EQUIPPED_RELICS_COUNT

---

## SE-08 — THE GRAND SCHOLAR

Subtype: SECRET_ACHIEVEMENT
Reward: +5 Courage

Condition:
Have at least 4 learned Spells simultaneously.

Implementation:
- Count Spells occupying learned Knowledge slots.
- Do not count Spell cards lying in the room.
- Do not count discarded Spells.
- Respect Knowledge-slot unlocking.

The four Knowledge slots unlock permanently through established Mirror Sigil milestones.

The Secret does not bypass unlocking requirements.

Achievement key:
LEARNED_SPELLS_COUNT

---

## SE-09 — MASTER OF INCANTATIONS

Subtype: SECRET_ACHIEVEMENT
Reward: Variable (+2, +4, or +6 Courage)

Condition:
Have at least 3 learned Spells with the SAME PRINTED learning-cost level.

Reward table:

3 Basic Spells (1 Element printed requirement):
+2 Courage

3 Intermediate Spells (2 Elements printed requirement):
+4 Courage

3 Advanced Spells (4 Elements printed requirement):
+6 Courage

Implementation:
- Count learned Spells by printed tier/level.
- Do not classify them by their actual discounted learning cost.
- IT-10 cost reduction does not change a Spell's printed tier.
- IT-05/06/07 Element modifiers do not change its tier.
- Only currently learned Spells count.

If several tiers qualify simultaneously:
- The player may select one qualified tier when revealing the Secret.
- Award its corresponding Courage.
- Complete the Secret only once.
- Prefer the existing tier enum if available.

Achievement key:
LEARNED_SPELLS_SAME_PRINTED_LEVEL

---

## SE-10 — THE UNLIKELY FELLOWSHIP

Subtype: SECRET_ACHIEVEMENT
Reward: +3 Courage

Condition:
Have at least 3 Companions attached simultaneously.

Implementation:
- Count Loyal and Stray Companions currently attached to the hero.
- Walking and Carried Loyal Companions both count.
- Strays count while attached, even though they cannot be carried.
- Do not count Companions left in the room.
- Do not count sacrificed Companions.

Achievement key:
ATTACHED_COMPANIONS_COUNT

---

## SE-11 — KEEPER OF WHISPERS

Subtype: SECRET_ACHIEVEMENT
Reward: +5 Courage

Condition:
Hold at least 4 unrevealed Secrets, INCLUDING SE-11 itself.

Implementation:
- Count Secret cards in the owner's private hand.
- All counted Secrets must be unrevealed and uncompleted.
- Include the SE-11 card before it is moved to the completed collection.
- The count is validated immediately BEFORE revealing the card.

Example:
A player has SE-11 and three other unrevealed Secrets.

The player qualifies.

After revealing SE-11:
- SE-11 moves to completed achievements.
- The other three Secrets remain hidden.
- The player receives 5 Courage.

Do not count completed or discarded Secrets.

Achievement key:
UNREVEALED_SECRETS_COUNT

---

## SE-12 — THE FIFTH ESSENCE

Subtype: SECRET_ACHIEVEMENT
Reward: +5 Courage

Condition:
Carry all 5 different Element types simultaneously.

Required types:
- Air
- Water
- Earth
- Fire
- Aether

Implementation:
- Every required type must have at least one physical carried token.
- Aether wild substitution does not count as a missing Element type.
- Element multipliers do not create additional distinct types.
- Room Elements do not count.

Achievement key:
ALL_FIVE_ELEMENTS_CARRIED

---

## SE-13 — MIRROR CONVERGENCE

Subtype: SECRET_ACHIEVEMENT
Reward: +3 Courage

Condition:
Carry at least 3 Mirror cards, including:
- At least 1 Black Mirror.
- At least 1 White Mirror.

Valid combinations include:
- 2 Black + 1 White
- 1 Black + 2 White
- Any larger collection satisfying the same requirement.

Implementation:
- Count only physically carried Mirror cards.
- Check total >= 3.
- Check Black >= 1.
- Check White >= 1.

Achievement key:
MIXED_MIRROR_COLLECTION

---

## SE-14 — THE RUNIC TRINITY

Subtype: SECRET_ACHIEVEMENT
Reward: +4 Courage

Condition:
Have at least 3 permanently assigned Mirror Sigils of DIFFERENT colors across your learned Spells.

Implementation:
- Inspect Mirror Sigils assigned to learned Spells.
- Count only permanent assignments.
- Count distinct actual Sigil colors.
- Require at least 3 different colors.

Do not count:
- Unassigned Sigils in the player's possession.
- Temporary/Quick Sigil assignments.
- Sigils on discarded Spells.
- Sigils previously permanently assigned but later discarded.

Three qualifying Sigils may be assigned to one Spell or distributed across several learned Spells.

Do not confuse Elements with Mirror Sigils.

Achievement key:
PERMANENT_SIGILS_DISTINCT_COLORS

---

## SE-15 — AN UNUSUAL FELLOWSHIP

Subtype: SECRET_ACHIEVEMENT
Reward: +4 Courage

Condition:
Simultaneously have:
- At least 1 Loyal Companion attached.
- At least 1 Stray Companion attached.
- At least 1 Relic equipped.

Implementation:
- Count currently attached Companions by attachment behavior.
- LOYAL and STRAY are the only two behavior types.
- Strays cannot be carried.
- The Relic must occupy an actual Relic slot.
- Do not count objects lying in the room.

If a Stray transfers to another hero before the Secret is revealed, the condition may cease to be satisfied.

Achievement key:
LOYAL_STRAY_AND_RELIC

---

# 4. ACHIEVEMENT ENGINE DESIGN

Use structured conditions rather than hardcoded card-title checks.

Suggested model:

SecretCard:
- id
- name
- family: SECRET
- subtype: ACHIEVEMENT
- description
- condition
- reward
- status
- version

Example conceptual definition:

{
  id: "SE-01",
  name: "Four of a Kind",
  family: "SECRET",
  subtype: "ACHIEVEMENT",
  condition: {
    type: "CARRIED_ELEMENTS_SAME_TYPE",
    minimumCount: 4
  },
  reward: {
    type: "COURAGE",
    amount: 4
  },
  status: "ACTIVE",
  version: "0.5"
}

This is an illustrative structure.

Use existing TypeScript types and naming conventions where possible.

## Recommended reusable condition evaluators

- hasCarriedElementsOfSameType
- countDistinctCarriedElements
- countCarriedMirrors
- countCarriedEquipment
- countAccessibleTools
- countEquippedRelics
- countLearnedSpells
- countLearnedSpellsByPrintedLevel
- countAttachedCompanions
- countUnrevealedSecrets
- hasAllElementTypes
- hasMixedMirrorCollection
- countPermanentAssignedSigilColors
- hasRequiredCompanionBehaviors

The engine should support future achievements without requiring a new React component for every Secret.

Create a central evaluation function conceptually equivalent to:

evaluateSecretCondition(secret, playerId, gameState)

It should return:
- Whether the Secret is eligible.
- The qualifying achievement variant, if applicable.
- The possible Courage reward.
- Optional information for the owning player's UI.

This function must be pure and must not mutate game state.

---

# 5. SECRET REVEAL ACTION

Implement a single authoritative Secret-reveal action.

Conceptual flow:

1. Receive player request to reveal a Secret.
2. Validate current player permissions and action timing.
3. Confirm that the card belongs to that player.
4. Confirm that it is still unrevealed.
5. Evaluate the current achievement condition.
6. If invalid, reject without changing state.
7. If valid, calculate the Courage reward.
8. Mark the Secret revealed/completed.
9. Move the card to completed achievements.
10. Award Courage exactly once.
11. Publish the appropriate game event.
12. Persist the updated state.

IMPORTANT:
Validation and mutation must be atomic.

Do not trust a UI-provided reward number.

The server-authoritative or game-engine state must determine whether the condition is satisfied.

Do not reveal a Secret automatically simply because its condition becomes true.

The owner decides when to reveal it.

If the application has a central action/reducer system, use it rather than mutating several stores independently.

---

# 6. TIMING AND PLAYER INTERACTIONS

The following rules are important.

## Collection conditions

All Secret conditions are evaluated against a single current-state snapshot.

If a player currently qualifies, they may reveal an eligible Secret during an allowed player-action window.

If the player loses a required object before revealing it, the Secret becomes ineligible.

Do not introduce historical progress counters for these conditions.

## Multiple Secrets

Different Secrets may qualify simultaneously.

The player may reveal them one at a time.

After revealing one Secret:
- Update Courage.
- Update completed Secrets.
- Re-evaluate remaining hidden Secrets.

SE-11 must be checked before its own removal from the hidden hand.

## Capacity changes

If Equipment is dropped and carrying capacity changes:
- Recalculate capacity.
- Apply existing inventory overflow rules.
- Re-evaluate eligible Secret achievements.

Do not treat temporarily inaccessible inventory objects as valid carried objects unless existing inventory rules do so.

## Black Mirror interactions

Hexlocks and other inventory restrictions may change which objects are legally carried.

The achievement engine should use actual player inventory state, not nominal slot capacity.

Darkness and Paralysis must not automatically invalidate collection conditions, although existing action restrictions may affect whether the player is allowed to reveal a Secret at that moment.

---

# 7. COURAGE REWARDS

All Secrets grant Courage.

Use the existing Courage/Fear track.

Reward values:

SE-01: +4
SE-02: +3
SE-03: +3
SE-04: +3
SE-05: +4
SE-06: +4
SE-07: +4
SE-08: +5
SE-09: +2 / +4 / +6
SE-10: +3
SE-11: +5
SE-12: +5
SE-13: +3
SE-14: +4
SE-15: +4

Rules:
- Courage gain cannot exceed the track maximum.
- No Secret gives Heroism points.
- No Secret permanently increases carrying capacity.
- Secrets do not consume their achievement requirements.
- A completed Secret cannot reward Courage again.
- Bonuses triggered by other Item effects must be resolved through existing game systems.
- Do not create a new Courage reward mechanism.

Use the existing Courage update function, including its maximum-value validation.

---

# 8. USER INTERFACE

## Private Secret hand

The owning player should see:
- Secret artwork or icon.
- Secret name.
- Achievement condition.
- Courage reward.
- Current eligibility status.
- A Reveal/Claim button when legal.

Other players must not see:
- Hidden Secret names.
- Hidden Secret descriptions.
- Achievement conditions belonging to another player's private cards.

Preserve existing hidden-information rules.

## Eligibility indicator

The owning player may see:
- Eligible
- Not yet eligible

For example:

SE-01 — Four of a Kind
Carry 4 Elements of one type.
Reward: +4 Courage
Current state: 3 of 4 Fire Elements
Status: Not eligible

SE-07 — Treasures of the Castle
Equip 2 Relics.
Reward: +4 Courage
Current state: 2 of 2 Relics
Status: Eligible

The display must use the same evaluation logic as the authoritative action.

Never expose eligibility information to other players if it would reveal a hidden Secret.

## Reveal interaction

When the player reveals a qualifying Secret:
- Reveal the artwork/card to all players.
- Display its name and achievement.
- Display the Courage gained.
- Move the card to the player's completed Secret area.
- Update the Courage track.

Avoid a long blocking animation if the project has simpler existing feedback conventions.

## Completed achievements

Provide a public collection of completed Secrets for each hero.

Completed cards:
- Remain face up.
- Cannot be revealed again.
- Cannot be reused as hidden Secrets.
- Cannot be paid as the discard cost for IT-16.
- Do not require the player to maintain the original condition afterward.

---

# 9. INTEGRATION WITH OTHER CARD FAMILIES

## White Mirrors

White Mirrors generate Secret discoveries.

The discovery system must:
- Draw from the new 15-card deck.
- Give each Secret privately to the discovering hero.
- Preserve the existing discovery count and distribution.
- Never leave newly discovered Secrets in the room.

## Items

Relevant interactions:

IT-01:
Increases Element capacity and helps SE-01, SE-02, SE-12.

IT-02:
Increases Equipment/Tool and Relic capacity, relevant to SE-05 and SE-07.

IT-03:
Increases Mirror capacity, relevant to SE-03, SE-04, SE-13.

IT-05:
Aether wildcard functionality must not alter physical Element-type counts.

IT-06 and IT-07:
Double Element contributions must not double the physical token count.

IT-16:
May discard an unrevealed Secret for Courage.
Completed Secrets cannot be selected as payment.

IT-24:
Increases Relic capacity and may help SE-07.

Do not modify these Item card effects to simplify achievement validation.

## Spells

Use learned Spells, not Spell cards available in the room.

For SE-09:
- Use printed learning-cost tiers.
- Do not use actual modified cost after discounts.

For SE-14:
- Use existing permanent Sigil assignments.
- Count distinct colors.
- Do not count temporarily assigned or discarded Sigils.

## Companions

Companion classifications:

LOYAL:
Follows its original discoverer.

STRAY:
Follows the first hero to leave its current room and may transfer owners.

The Secret system checks current attachment ownership.

It does not change how Companions move.

SE-10 counts both types.
SE-15 requires at least one of each.

## Black Mirrors

Black Mirror curses may cause inventory loss, Spell loss, Companion abandonment, and carrying-capacity restrictions.

Secret eligibility must update after those state changes.

Do not automatically reveal Secrets when a Black Mirror is resolved.

## Occuldor

Secrets do not directly modify Occuldor.

Do not add Occuldor achievements, Rage triggers, or additional punishment rules.

---

# 10. AUTOMATED TESTING

Use the existing test framework.

## Catalog tests

Verify:
- Exactly 15 Secret cards.
- IDs SE-01 through SE-15 exist.
- No duplicate IDs.
- Every Secret belongs to subtype ACHIEVEMENT.
- No legacy Objective/Knowledge/Reaction effects remain.
- Every Secret has a valid condition.
- Every Secret awards Courage.
- Only SE-09 has variable rewards.

## Individual achievement tests

SE-01:
4 identical physical Elements qualify.
3 identical Elements do not.
Element doubling does not count.

SE-02:
4 distinct types qualify.
4 copies of one type do not.

SE-03:
3 carried Black Mirrors qualify.
Mirrors in a room do not.

SE-04:
3 carried White Mirrors qualify.
Mixed Mirrors alone do not.

SE-05:
3 carried Equipment cards qualify.
Tools and Relics do not.
Test whether the collection is reachable with real inventory capacity.

SE-06:
3 accessible distinct Tools qualify.
Count carried and current-room Tools.
Do not count tools in another player's inventory.

SE-07:
2 equipped Relics qualify.
One equipped and one in the room do not.

SE-08:
4 learned Spells qualify.
Unlearned room Spells do not.

SE-09:
3 Basic = +2 Courage.
3 Intermediate = +4 Courage.
3 Advanced = +6 Courage.
Mixed levels do not qualify.
Element cost discounts do not change tier.

SE-10:
3 attached Companions qualify.
Abandoned Companions do not.

SE-11:
4 hidden Secrets including SE-11 qualify.
Validate before revealing SE-11.
Completed Secrets do not count.

SE-12:
All five physical Element types qualify.
Aether cannot stand for a missing type.

SE-13:
3 Mirrors including both colors qualify.
3 all-Black or all-White Mirrors do not.

SE-14:
3 distinct colors of permanent Sigils qualify.
Quick Sigils do not count.
3 permanently assigned Sigils of one color do not.

SE-15:
At least one Loyal Companion, one Stray Companion, and one equipped Relic qualify.
Missing any of those requirements fails.

## Lifecycle tests

Verify:
- Secret discovery adds a hidden card.
- The Secret is visible only to its owner.
- Ineligible reveal requests are rejected.
- Eligible reveal awards the correct Courage.
- Repeated reveal does not award Courage again.
- Completed cards remain face up.
- Overlapping achievements can be completed separately.
- Completed achievements remain valid when resources are lost afterward.
- Save/load preserves hidden and completed states.
- Multiplayer actions do not reveal private data incorrectly.
- Courage does not exceed the maximum.
- IT-16 cannot discard completed Secrets.

---

# 11. DESIGN VALIDATION AND FEASIBILITY CHECKS

Before declaring implementation complete, test whether every Secret is achievable under the actual rules.

In particular:

SE-05:
Three carried Equipment cards may be impossible with current capacity upgrades, because IT-02 uses a slot itself.

SE-06:
Three Tools should be achievable using shared-room access.

SE-08:
Four Spells require all four Knowledge slots to be unlocked.

SE-09:
Verify that at least three Spells exist in each printed learning-cost tier.

SE-11:
Four unrevealed Secrets may be rare in multiplayer games but is allowed.

SE-12:
Five different Elements require sufficient carrying capacity.

SE-14:
Verify that at least three different Sigil colors can be committed permanently across available Spells.

SE-15:
Verify Loyal and Stray Companions both exist in the final Companion deck.

Report any impossible achievement rather than secretly rewriting it.

Do not create additional inventory slots, change reward values, or modify other cards without approval.

---

# 12. IMPLEMENTATION PLAN

Implement in the following order.

PHASE 1 — Repository audit
- Inspect existing Secret logic.
- Locate old effects and card definitions.
- Identify private-hand and completed-card state.
- Identify inventory, Spell, Sigil, and Companion selectors.
- Identify the existing Courage update pipeline.

PHASE 2 — Replace Secret catalog
- Register the 15 revised cards.
- Preserve SE-01 through SE-15 IDs.
- Remove obsolete effect definitions.
- Introduce structured achievement conditions.

PHASE 3 — Generic condition evaluation
- Implement reusable pure condition evaluators.
- Implement variable reward evaluation for SE-09.
- Add eligibility checks.
- Avoid duplicating validation rules in UI components.

PHASE 4 — Reveal and completion
- Implement authoritative reveal action.
- Validate state at reveal time.
- Award Courage atomically.
- Move the card to completed achievements.
- Prevent repeated completion.

PHASE 5 — Integrations
- White Mirror discovery.
- Player inventory and room-access distinctions.
- Equipment/Tool/Relic categories.
- Spell learning tiers and Knowledge slots.
- Permanent Sigil assignments.
- Loyal and Stray Companions.
- Item IT-16.
- Black Mirror inventory modifications.

PHASE 6 — User interface
- Private Secret hand.
- Eligibility information visible to owner.
- Reveal button.
- Public completed achievements.
- Courage reward feedback.

PHASE 7 — Tests
- Catalog validation.
- Individual card eligibility.
- Variable reward behavior.
- Privacy.
- Reveal lifecycle.
- Persistence.
- Regression tests.

PHASE 8 — Review
- Check each achievement for feasibility.
- Document any provisional interpretations.
- Report implementation details and test results.

---

# 13. DEFINITION OF DONE

The feature is complete when:

1. All 15 revised Secret cards are registered.
2. All old Secret abilities are replaced.
3. Secrets are privately discovered through White Mirrors.
4. All achievement conditions are evaluated from current game state.
5. Players can reveal eligible Secrets manually.
6. Courage rewards are accurate.
7. Completed Secrets cannot be claimed again.
8. Overlapping achievements work.
9. Item, Spell, Companion, and Black Mirror interactions remain correct.
10. Secret state persists correctly.
11. Automated tests cover every Secret.
12. Achievement feasibility issues are reported.

After implementation, provide:

- Files created or modified.
- Summary of the new achievement engine.
- List of implemented Secret cards.
- UI components added or changed.
- Test commands and results.
- Any unreachable achievements.
- Any unresolved rule assumptions.

Keep implementation modular and easy to rebalance.

END OF SPECIFICATION
