
# THE MIRRORS — ITEM CARD CATALOG & IMPLEMENTATION
## Version 0.3 — Revised Design

You are a senior TypeScript/JavaScript game developer, systems architect, and board-game mechanics engineer working on the existing digital implementation of **The Mirrors**.

Your assignment is to implement the revised Item card catalog, containing exactly 25 unique cards across three subtypes:

- Equipment: IT-01 to IT-10 (10 cards)
- Tool: IT-11 to IT-19 (9 cards)
- Relic: IT-20 to IT-25 (6 cards)

Implement the complete catalog, abilities, game-state integration, UI support, and automated tests.

IMPORTANT: The creator previously used the word "Artifact" by mistake. The correct and ONLY third Item subtype is **Relic**. Do not create an Artifact type, Artifact inventory, or Artifact slot.

## 1. REPOSITORY INSPECTION

Before coding, examine the existing project.

Identify:
- Item catalog and card types.
- Player board and capacity handling.
- Equipment/Tool and Relic slots.
- Room contents and Item interaction.
- Courage/Fear system.
- Element storage and consumption.
- Movement and turn management.
- Spell learning and Element requirements.
- Mirror Sigil assignment and activation.
- Kaleidoscope fragment placement.
- White/Black Mirror placement and collision.
- Companions and conflicts.
- Occuldor's movement, Rage and punishment.
- Existing Black Mirror token effects.
- UI conventions and automated tests.

Reuse existing architecture and state-management patterns.

Do not redesign other card families or duplicate existing gameplay logic.

---

# 2. ESTABLISHED ITEM RULES

## Item subtypes

EQUIPMENT
- Primarily capacity upgrades, movement enhancements, Element manipulation, and passive benefits.

TOOL
- Primarily activatable abilities, conversions, sacrifices, and strategic actions.
- Most abilities are usable once per round.
- Tools may serve as requirements for learning certain Spells if the Spell catalog explicitly specifies them.

RELIC
- Powerful magical objects with ongoing or special abilities.
- Relics use their own carrying slots.
- Initial Relic capacity is 1.

## Player inventory

Initial carrying capacity:
- 3 Elements
- 2 Mirror cards (White and Black combined)
- 2 Equipment/Tool cards
- 1 Relic card
- Learned Spells use separately unlocked Knowledge slots.

Equipment and Relics may expand these capacities.

## Room access

An established rule in The Mirrors is:

All accessible objects in the current room can be combined and used as if available in the hero's inventory.

Carrying capacity primarily determines what the hero can transport when leaving the room.

Therefore:
- Do not require picking up an Item simply to use its ability while in the room.
- Allow the existing room-access system to provide Item abilities.
- Effects stop being available when the hero leaves an Item behind.
- Preserve current inventory validation when departing.
- Do not create duplicate Item ownership or effects.
- Do not permanently equip room objects merely by using them.

Use existing game mechanics where available.

## Round-limited abilities

"Once per round" means once per complete game round for the relevant player.

Do not confuse:
- Player turn
- Complete game round
- Movement action
- Room entry
- Card activation

Track Tool activation explicitly through game state.

Prevent repeated activations caused by rerenders or repeated UI requests.

---

# 3. EQUIPMENT CATALOG

## IT-01 — Element Bandolier
Subtype: EQUIPMENT
Timing: Passive

Effect:
Increase carried Element capacity by +2.

Implementation:
- Base capacity 3 becomes 5.
- Bonus applies while the Item is available.
- Revalidate carried capacity when its effect is lost.
- Support stacking with other capacity modifiers if permitted by normal rules.

## IT-02 — Adventurer's Satchel
Subtype: EQUIPMENT
Timing: Passive

Effect:
Increase Equipment/Tool capacity by +1.
Increase Relic capacity by +1.

Implementation:
- Both bonuses are active simultaneously.
- Starting Equipment/Tool capacity 2 becomes 3.
- Starting Relic capacity 1 becomes 2.
- Use RELIC terminology everywhere.
- Revalidate dependent capacity when the Satchel is discarded or left behind.
- Do not accidentally remove the Satchel merely because its own capacity bonus disappears.

## IT-03 — Mirror Harness
Subtype: EQUIPMENT
Timing: Passive

Effect:
Increase carried Mirror capacity by +1.

Implementation:
- Both White and Black Mirrors use the shared capacity.
- Initial capacity 2 becomes 3.

## IT-04 — Seven-League Boots
Subtype: EQUIPMENT
Timing: Movement

Effect:
Increase the hero's movement allowance by up to +3.

Implementation:
- Allow a selected increase from 0 to 3.
- Add it to the movement allowance calculated from the Courage/Fear track.
- Movement remains mandatory.
- Does not bypass closed corridors, Paralysis, or other restrictions by itself.
- Do not treat +3 as a fixed maximum total movement distance.

## IT-05 — Aether Prism
Subtype: EQUIPMENT
Timing: Element payment

Effect:
Aether can substitute for any other Element.

Implementation:
- An Aether Element may satisfy a Fire, Water, Earth, Air, or Aether requirement.
- Apply to Element-based learning or activation costs.
- Aether is still one physical Element token.
- It is spent according to the original action's payment rules.
- Never create additional Element tokens.
- Do not substitute Aether for a colored Mirror Sigil requirement.

## IT-06 — Earthwind Conduit
Subtype: EQUIPMENT
Timing: Element payment

Effect:
Earth and Air Elements each count as 2 when buying/learning Spells or activating eligible Spell abilities.

Implementation:
- One Earth contributes a value of 2 toward Earth requirements.
- One Air contributes a value of 2 toward Air requirements.
- Applies to Element costs, not physical Mirror Sigil availability.
- A single doubled Element token is consumed once when payment requires consumption.
- Do not duplicate physical tokens.
- Support exact-color/mixed-Element payment validation.

## IT-07 — Emberwind Conduit
Subtype: EQUIPMENT
Timing: Element payment

Effect:
Fire and Air Elements each count as 2 when buying/learning Spells or activating eligible Spell abilities.

Implementation:
- Fire contributes 2 toward Fire requirements.
- Air contributes 2 toward Air requirements.
- Preserve the same rules as IT-06.

Important:
IT-06 and IT-07 both modify Air.

Do not accidentally apply repeated multiplication or create physical Elements.
The exact stacking policy is provisional; implement it in one configurable rule and document the chosen behavior.

## IT-08 — Kaleidoscope's Bargain
Subtype: EQUIPMENT
Timing: Fragment restoration / Occuldor encounter

Effect:
- Gain +3 additional Courage when placing a Kaleidoscope fragment.
- Occuldor's presence causes an additional 2 Fear.

Implementation:
- Trigger Courage reward once per fragment successfully restored by the hero.
- Add the +3 bonus to normal fragment-restoration rewards.
- Preserve the Kaleidoscope's existing adjacency bonus calculation.
- Treat additional Fear provisionally as an additional 2 Courage loss when the player suffers Occuldor's presence/arrival punishment.
- Do not inflict the extra penalty repeatedly on every rerender.
- Use existing Occuldor encounter events.
- Do not confuse Mirror Sigils with Kaleidoscope fragments: Sigils are awarded through collision; fragments are restored to the Kaleidoscope.

## IT-09 — Companion's Bell
Subtype: EQUIPMENT
Timing: Companion discovery

Effect:
Gain +3 Courage whenever you discover a Companion.

Implementation:
- Trigger on genuine Companion discovery.
- This includes Companions revealed through White Mirrors.
- Award the Courage to the discovering hero.
- Do not trigger from an ordinary Stray ownership transfer.
- Do not trigger again when an already discovered Companion is recruited from a room.

## IT-10 — Scholar's Grimoire
Subtype: EQUIPMENT
Timing: Spell learning

Effect:
Reduce the Element cost of learning a Spell by 1.

Implementation:
- Reduce the total required Element contribution by 1.
- Minimum cost is zero.
- Respect specific Element types and Tool prerequisites.
- When the cost contains multiple Element types, allow the player to select which eligible Element requirement to reduce.
- Do not bypass Knowledge-slot requirements.
- Do not treat the reduction as generating an Element.

---

# 4. TOOL CATALOG

## IT-11 — Elemental Crucible
Subtype: TOOL
Timing: Once per round

Effect:
Discard 1 Element to gain 2 Courage.

Requirements:
- One eligible Element must be available to pay the cost.
- Remove the Element through the normal discard operation.
- Increase Courage by 2, respecting the maximum track value.

## IT-12 — Mirror Offering
Subtype: TOOL
Timing: Once per round, before movement

Effect:
Leave 2 carried Mirrors in the current room.
Do not take other Mirrors before departing that room.
Gain 2 Courage.

Implementation:
- Require two eligible carried Mirror cards.
- White or Black combinations are allowed.
- Transfer both Mirrors to the current room; do not discard them.
- Gain 2 Courage.
- Prevent taking replacement Mirrors before the hero leaves.
- Clear this restriction after the departure.
- Do not allow the hero to repeatedly activate the effect during the same round.

## IT-13 — Salvager's Crucible
Subtype: TOOL
Timing: Once per round

Effect:
Discard 1 Item to gain 3 Courage.

Implementation:
- Select an eligible Item.
- Remove it from the game through the existing discard mechanism.
- Gain 3 Courage.
- Recalculate capacity if discarded Equipment or a Relic granted capacity bonuses.
- Do not automatically permit self-discarding unless an explicit rule supports it.

## IT-14 — Spellburn Quill
Subtype: TOOL
Timing: Once per round

Effect:
Discard 1 learned Spell to gain 3 Courage.

Implementation:
- Select one learned Spell.
- Remove it from the player's learned Spells.
- Free the corresponding occupied Knowledge slot.
- Keep previously unlocked Knowledge capacity unlocked.
- Discard permanently assigned Mirror Sigils along with the Spell under existing permanent-Sigil rules.
- Gain 3 Courage.
- Do not refund Spell learning costs.

## IT-15 — Sigil Sacrifice
Subtype: TOOL
Timing: Once per round

Effect:
Discard 1 Mirror Sigil to gain 3 Courage.

Implementation:
- Require one eligible owned Mirror Sigil.
- Remove it permanently through the existing Sigil discard system.
- Gain 3 Courage.
- Do not automatically detach Sigils permanently bound to a Spell.
- Do not allow a Sigil to be spent twice.

## IT-16 — Whisper Cipher
Subtype: TOOL
Timing: Once per round

Effect:
Discard 1 Secret to gain 2 Courage.

Implementation:
- Select one Secret from the player's private collection.
- Discard it.
- Gain 2 Courage.
- Do not reveal other Secrets to opponents.
- Preserve existing private-information rules.

## IT-17 — Farewell Whistle
Subtype: TOOL
Timing: Once per round, before movement

Effect:
Leave all currently attached Companions in the room before moving.
Do not take other Companions before leaving.
Gain 2 Courage.

Implementation:
- Detach the player's Companions and place their cards in the room.
- Gain 2 Courage.
- Prevent recruiting replacements before departure.
- Ensure the leaving hero does not immediately reacquire those Companions through the Stray first-to-leave rule.
- Apply the normal Companion recruitment rules on later turns.
- Preserve Loyal and Stray classifications.
- Do not create Resident or Wanderer Companion types.

This card intentionally overrides ordinary Stray-following behavior for the departure that activates it.

## IT-18 — Occuldor's Compass
Subtype: TOOL
Timing: Once per round

Effect:
Lose 1 Courage (gain 1 Fear).
Move Occuldor to any eligible castle room.

Implementation:
- Subtract 1 Courage using the existing Courage/Fear track.
- Do NOT give a Black Mirror Fear Token.
- Allow selection of a legal destination for Occuldor.
- Use the existing Occuldor movement/relocation system.
- Preserve his Rage.
- Resolve existing guarded-mirror release behavior.
- Do not automatically add Rage.
- The interaction between this Tool and Occuldor's normal arrival punishment is a provisional rule; use existing encounter logic and document the result.

## IT-19 — Companion's Bargain
Subtype: TOOL
Timing: Once per round

Effect:
Permanently sacrifice 1 Companion to gain 3 Courage.

Implementation:
- Select one currently attached Companion.
- Remove it permanently from the game.
- Do not leave it in the room.
- Do not transfer it to another hero.
- Do not trigger ordinary Loyal or Stray transfer behavior.
- Gain 3 Courage.
- Resolve its attachment and passive-effect cleanup.

---

# 5. RELIC CATALOG

## IT-20 — Ring of Steady Light
Subtype: RELIC
Timing: Passive

Effect:
Reduce Courage lost from any penalty by 1.

Implementation:
- Each distinct Courage-loss penalty is reduced by 1.
- Minimum loss is zero.
- Includes ordinary Black Mirror curses and Occuldor penalties.
- Do not reduce costs that are voluntary payments unless the existing rules define them as penalties.
- Do not reduce gains, only losses.
- Integrate with the central Courage-modifier pipeline.
- Avoid repeatedly reducing each individual point of a multi-point penalty.

## IT-21 — Pendant of Reflections
Subtype: RELIC
Timing: Mirror placement

Effect:
After placing Mirrors, gain 1 Courage.

Implementation:
- Trigger from the existing successful Mirror-placement event.
- Award Courage only for successful placements, not failed attempts.
- Do not double-trigger because of collision animations or rerenders.

The exact trigger frequency (per placed Mirror versus per completed pair) remains provisional. Use the current v0.3 interpretation of one reward per successful pair-placement event if supported by the game engine. Expose this as an explicit rule choice rather than silently assuming it is final.

## IT-22 — Brooch of Unbound Steps
Subtype: RELIC
Timing: Passive / Movement

Effect:
- Increase movement allowance by +1.
- Ignore Paralysis.

Implementation:
- Add +1 to normal movement allowance.
- Paralysis Tokens remain present and expire normally.
- While this Relic applies, Paralysis does not prevent leaving the room.
- Do not delete Paralysis Tokens automatically.
- If the Relic effect is lost, remaining Paralysis restrictions become effective again.

## IT-23 — Crown Shard of Freedom
Subtype: RELIC
Timing: Kaleidoscope fragment placement

Effect:
Place restored Kaleidoscope fragments anywhere on the Kaleidoscope.

Implementation:
- Ignore the normal requirement that placement must be along the edge or adjacent to an existing fragment.
- Do not allow overlapping fragments.
- Respect valid Kaleidoscope positions.
- Award ordinary fragment restoration Courage.
- Calculate adjacency bonuses only from actual neighboring fragments.
- A fragment with no neighbors receives no adjacency bonus.

## IT-24 — Amulet of Permanence
Subtype: RELIC
Timing: Passive / Permanent Sigil assignment

Effect:
- Increase Relic capacity by +1.
- Gain 3 Courage when permanently assigning Mirror Sigils to Spells.

Implementation:
- Add exactly one Relic slot.
- Use the RELIC category, never ARTIFACT.
- Listen to successful permanent Sigil assignment events.
- Do not trigger for temporary/Quick Sigil assignments.
- Do not trigger when reloading game state or refreshing an already active Spell.
- Do not generate Courage multiple times for the same permanent assignment.
- Preserve permanent Sigil binding and discard rules.

Provisional interpretation:
Award 3 Courage per newly permanently assigned physical Sigil.
Keep the reward granularity configurable, because the designer may choose per assignment action instead.

## IT-25 — Locket of the Drunken Pony
Subtype: RELIC
Timing: Passive / Companion conflict

Effect:
Ignore Companion conflicts.

Implementation:
- Suppress conflict penalties involving the affected player's Companions.
- Preserve normal Loyal and Stray following behavior.
- Do not prevent a Stray from changing owners through ordinary movement.
- Do not suppress unrelated Black Mirror effects that abandon or sacrifice Companions.
- Integrate into the existing Companion-conflict resolver.

---

# 6. EFFECT ENGINE DESIGN

Do not create 25 unrelated event handlers embedded directly in components.

Use the current project's established effect engine where possible.

Prefer structured declarative card definitions.

An Item definition should support:

- id
- name
- family = ITEM
- subtype = EQUIPMENT | TOOL | RELIC
- description
- timing
- requirements
- costs
- effects
- usageLimit
- status = REVIEW
- version

Consider reusable effect operations:

- MODIFY_INVENTORY_CAPACITY
- MODIFY_MOVEMENT_ALLOWANCE
- MODIFY_ELEMENT_CONTRIBUTION
- SUBSTITUTE_ELEMENT
- MODIFY_SPELL_LEARNING_COST
- MODIFY_COURAGE_LOSS
- GAIN_COURAGE
- PAY_COURAGE
- DISCARD_ELEMENT
- DISCARD_ITEM
- DISCARD_SPELL
- DISCARD_SIGIL
- DISCARD_SECRET
- LEAVE_MIRRORS
- LEAVE_COMPANIONS
- SACRIFICE_COMPANION
- RELOCATE_OCCULDOR
- IGNORE_PARALYSIS
- IGNORE_COMPANION_CONFLICTS
- MODIFY_FRAGMENT_PLACEMENT_RULES

Do not invent an entirely new effects architecture if an existing one can be extended.

Separate:
1. Card definitions.
2. Effect eligibility.
3. Cost payment.
4. Effect resolution.
5. Player choices.
6. State mutation.
7. Visual presentation.

Make all game-state changes deterministic and serializable.

---

# 7. ELEMENT CONTRIBUTION AND PAYMENT ENGINE

IT-05, IT-06, IT-07, and IT-10 require coordinated handling.

Create or extend one central Element-payment calculator.

It should support:
- Required Element types and quantities.
- Wildcard substitution using Aether.
- Double Element contribution.
- Reducing Spell learning costs.
- Player choice among valid payments.
- Available Elements from inventory and current room.
- Exact payment and consumption semantics.

Important distinction:

ELEMENTS:
Air, Water, Earth, Fire, Aether.

MIRROR SIGILS:
Separate colored magical resources used to activate Quick or Permanent Spell abilities.

Never convert one automatically into the other.

A doubling effect modifies the contribution of an Element; it does not manufacture another physical token.

If both IT-06 and IT-07 affect one Air Element, use a centralized stacking rule. Avoid unintended infinite or exponential multiplication.

Do not change existing Spell requirements to make these Items work.

---

# 8. COURAGE AND FEAR RULES

All Item effects must use the existing Courage/Fear track.

Examples:
- Gain 2 Courage.
- Lose 1 Courage.
- Prevent 1 point of a penalty.
- Gain bonus Courage when discovering or restoring something.

Do not create a second Courage resource.

Use existing track minimum, maximum, and hero-death rules.

A Black Mirror Fear Token is a separate mechanic. Never grant a Fear Token when an Item explicitly says "lose 1 Courage."

Event timing must prevent duplicated Courage rewards.

Recommended event integration:
- COMPANION_DISCOVERED
- MIRROR_PLACED
- MIRROR_COLLISION_RESOLVED
- FRAGMENT_RESTORED
- SPELL_LEARNED
- PERMANENT_SIGIL_ASSIGNED
- OCCULDOR_ARRIVED
- COURAGE_PENALTY_APPLIED
- COMPANION_CONFLICT_STARTED

These are conceptual names. Map them to the existing event architecture rather than duplicating events.

---

# 9. INVENTORY AND CAPACITY INTEGRATION

Support dynamic bonuses from:
- IT-01 Element capacity +2
- IT-02 Equipment/Tool capacity +1 and Relic capacity +1
- IT-03 Mirror capacity +1
- IT-24 Relic capacity +1

Support reductions caused by Black Mirror Hexlocks.

Calculate effective capacity centrally:

effectiveCapacity =
  baseCapacity
  + activeItemBonuses
  - activeHexlocks

This is a conceptual formula; preserve the game's rules for temporary blocking and capacity floors.

Important:
- Equipment can expand the capacity used to carry Equipment.
- Relics can expand Relic capacity.
- Dropping a capacity-granting Item may trigger overflow.
- Do not recursively add or remove Items forever.
- Use stable capacity recalculation and resolve overflow through existing inventory-choice mechanisms.
- Current-room objects remain usable under the room-access rule.
- Preserve separate capacity for Equipment/Tools and Relics.

Do not create Artifact slots.

---

# 10. ROOM, COMPANION, SPELL AND OCCULDOR INTEGRATION

## Leaving objects

"Leave" and "Discard" are not synonyms.

LEAVE:
- Place an object or card in the current room.
- Make it accessible through established room mechanics.
- Preserve its identity and state.

DISCARD:
- Remove the object or card according to the game's discard rules.
- Do not silently place it in the room.

SACRIFICE:
- Permanently remove the selected Companion.

## Companion rules

There are only two attachment behaviors:

LOYAL:
- Follows the player who originally discovers it.
- Can be Walking or Carried.

STRAY:
- Follows the first player to leave its current room.
- Transfers its card to that player.
- Cannot be carried.

IT-17 specifically overrides normal following behavior during the departure used to activate the Item.

Do not introduce old Resident, Wanderer or Passer categories.

## Spell rules

- Learned Spells require unlocked Knowledge slots.
- Learning requires Elements and sometimes Tools.
- Temporary/Quick and Permanent Sigil assignments are separate.
- Permanently committed Sigils cannot normally be reclaimed.
- Discarding a Spell with Permanent Sigils also discards those Sigils under established rules.

Do not return permanent Sigils automatically when IT-14 discards a Spell.

## Occuldor rules

IT-18 moves Occuldor but does not inherently increase Rage.

Reuse existing systems for:
- Position
- Rage
- Arrival penalties
- Blocking Black Mirrors
- Relocation from guarded Mirrors

Do not duplicate Occuldor state or create a new punishment calculation.

---

# 11. USER INTERFACE

Update Item presentation using existing square Item and subtype icon styling.

Each card should display:
- ID
- Name
- Subtype
- Effect
- Timing
- Required cost
- Once-per-round state, when applicable

## Player board

Show capacity bonuses for:
- Elements
- Mirrors
- Equipment/Tools
- Relics

Show active Item effects and available Tool actions.

## Tool activation

When activating a Tool:
1. Validate requirements.
2. Highlight available targets.
3. Let the player select valid resources or objects.
4. Show relevant cost and expected reward.
5. Confirm the action using the game's existing interaction style.
6. Apply the effect atomically.
7. Mark the Tool used for the round.

Do not allow the same resource to be consumed by two actions.

## Passive effects

No activation button is required for ordinary passive Equipment or Relic effects.

Their bonuses should be shown in the relevant player-board indicators.

---

# 12. TESTING REQUIREMENTS

Use the repository's existing testing framework.

## Catalog tests

Verify:
- Exactly 25 Item cards.
- Unique IDs IT-01 through IT-25.
- Exactly 10 Equipment.
- Exactly 9 Tools.
- Exactly 6 Relics.
- No Artifact subtype or Artifact capacity references.
- Every Item has a valid description and executable effect.

## Individual card tests

IT-01: Capacity increases by exactly 2.

IT-02: Equipment/Tool and Relic capacities each increase by 1.

IT-03: Mirror capacity increases by 1.

IT-04: Movement bonus 0 through 3; mandatory movement remains valid.

IT-05: Aether fulfills requirements for other Elements.

IT-06: Earth and Air contribute two units each.

IT-07: Fire and Air contribute two units each.

IT-08: Extra Courage on fragment restoration and additional Occuldor penalty.

IT-09: Courage only on genuine Companion discovery.

IT-10: Learning cost reduced by 1, never below zero.

IT-11: Element discarded, Courage gained once per round.

IT-12: Exactly two Mirrors left; no replacement before departure.

IT-13: Item discarded; associated capacity changes handled.

IT-14: Learned Spell discarded; committed Sigils handled.

IT-15: Owned Sigil discarded and cannot be reused.

IT-16: Private Secret discarded without revealing other Secrets.

IT-17: Companions left in room; Strays do not immediately follow the activating hero.

IT-18: Courage decreased, Occuldor relocated, no extra Rage generated.

IT-19: Companion permanently removed, Courage gained.

IT-20: Each distinct Courage-loss penalty reduced by 1.

IT-21: Courage awarded only for successful qualifying Mirror placements.

IT-22: Movement increased and Paralysis ignored without deleting tokens.

IT-23: Arbitrary valid fragment placement permitted; adjacency scored correctly.

IT-24: Extra Relic slot and correct permanent Sigil Courage rewards.

IT-25: Companion conflict prevention without altering ordinary Stray transfer.

## Integration tests

Test combinations including:
- IT-02 + IT-24: both Relic slot increases.
- IT-05 + IT-06: Aether substitution and Element contribution.
- IT-06 + IT-07: overlapping Air effects.
- IT-04 + IT-22: movement bonuses.
- IT-20 + Black Mirror Courage penalties.
- IT-22 + Paralysis Tokens.
- IT-08 + Occuldor punishment.
- IT-09 + White Mirror Companion discovery.
- IT-12 + Mirror inventory restrictions.
- IT-14 + permanent Sigil discard.
- IT-17 + Loyal and Stray Companions.
- IT-18 + Occuldor guarding a Black Mirror.
- IT-23 + Kaleidoscope adjacency rewards.
- IT-24 + grouped permanent Sigil assignments.

Also test:
- Saving and reloading active Items.
- Capacity changes caused by leaving Items behind.
- Once-per-round resets.
- Activations from Items present in the current room.
- Player choices and cancellation.
- Maximum Courage boundaries.
- No duplicate rewards.

---

# 13. PROVISIONAL DESIGN DECISIONS

These mechanics are not yet fully finalized.

Do not silently establish new permanent rules.

1. IT-04:
Does "up to +3" mean a freely chosen bonus of 0–3 each move?

2. IT-06 / IT-07:
How do overlapping Air multipliers stack?
Default: a physical Air Element contributes 2, not 4.

3. IT-08:
Is the +2 Fear applied whenever Occuldor is present, or only when an Occuldor punishment is resolved?
Default: add 2 Courage loss to the applicable encounter penalty.

4. IT-10:
Which Element requirement is reduced if a Spell requires several different types?
Default: player chooses one eligible requirement.

5. IT-12:
Must the two Mirrors be carried, and can an Item in the room itself be used to initiate the action?
Default: require two carried Mirrors.

6. IT-13:
Can the Tool itself be discarded to pay its own cost?
Default: exclude self-discard until approved.

7. IT-17:
Can this ability grant Courage with zero attached Companions?
Default: at least one Companion must be left.

8. IT-18:
Does an Item-triggered Occuldor arrival punish heroes in the destination room?
Follow existing arrival rules; document actual behavior.

9. IT-21:
Is +1 Courage awarded per individual Mirror or per Mirror-pair placement?
Keep the current interpretation configurable.

10. IT-24:
Does permanent Sigil assignment award +3 Courage per Sigil or per assignment action?
Default: +3 per newly committed physical Sigil, pending approval.

11. Room access:
Which consumable resources can be discarded directly from room contents?
Respect the existing shared-room access rules. Do not create resources or consume another player's privately held possessions.

12. Tool prerequisites:
Older Spell data may still reference the previous Tool names (Prism Lens, Astrolabe, etc.).
Preserve stable IT IDs where possible, inspect all Spell prerequisites, and report any semantic mismatches.
Do not silently leave broken references or reassign magical disciplines without approval.

Where a provisional interpretation is necessary:
- Isolate it in a configurable rule.
- Add tests for the default.
- Document it clearly.
- Do not alter unrelated game rules.

---

# 14. IMPLEMENTATION WORKFLOW

Implement in this order:

Phase 1:
Inspect the existing project and map the required integration points.

Phase 2:
Replace the Item catalog with the revised 25-card definitions.

Phase 3:
Implement capacity bonuses and Element payment modifiers.

Phase 4:
Implement passive Equipment effects.

Phase 5:
Implement reusable Tool activation, discard and sacrifice handling.

Phase 6:
Integrate Relic effects with Courage, movement, Kaleidoscope and Companions.

Phase 7:
Integrate the updated Item system with Black Mirror tokens, Spells, and Occuldor.

Phase 8:
Update UI and player-board indicators.

Phase 9:
Run catalog, card-specific, integration and regression tests.

Phase 10:
Document implementation choices and any remaining design decisions.

Avoid unrelated refactoring.

---

# 15. DEFINITION OF DONE

The implementation is complete when:

- All 25 Item cards exist with the correct IDs and subtypes.
- No Artifact category exists.
- All three Item subtypes work with existing inventory rules.
- Equipment capacity effects are reflected in game state and UI.
- Element substitution and doubling work without duplicating physical tokens.
- Tool actions have correct costs and once-per-round restrictions.
- Relic effects integrate with the existing game engine.
- Item effects work with the Black Mirror token system.
- Companion, Spell, Kaleidoscope and Occuldor interactions are preserved.
- Item effects survive save/load correctly.
- Every Item has automated behavioral tests.
- No existing game rules have been changed silently.

After implementation, report:

1. Files changed.
2. Features implemented.
3. Tests executed and results.
4. Existing Spell prerequisites affected by the Item changes.
5. Provisional assumptions used.
6. Unresolved rules requiring designer approval.

END OF IMPLEMENTATION SPECIFICATION
