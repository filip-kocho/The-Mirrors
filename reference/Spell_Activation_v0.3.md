
# THE MIRRORS — SPELL ACTIVATION ENGINE
## Sigil Assignment, Quick/Permanent Actions and UI
## Implementation Specification v0.3

You are a senior TypeScript/JavaScript engineer, frontend developer, and board-game systems architect working on the existing digital implementation of **The Mirrors**.

Your task is to build and integrate the Spell activation system for all 35 Spell cards.

FOCUS:
- Learned Spell cards.
- Clickable Sigil requirements.
- Player-owned Mirror Sigil storage.
- Quick activation and automatic Sigil return.
- Permanent activation and irreversible Sigil binding.
- Visual highlighting of affordable Spell actions.
- Correct game-state transitions.
- Existing Black Mirror Sigil Seal interactions.
- Automated tests.

This assignment concerns the common Spell activation framework.

Do not redesign the 35 individual Spell effects yet. Preserve their IDs, learning requirements and existing effects unless they must be adapted to the new engine.

Inspect the existing repository before implementing anything.

---

# 1. SPELL SYSTEM OVERVIEW

The game has 35 unique Spell cards:

BASIC:
SP-01 through SP-16
16 cards
Printed learning requirement: 1 Element

INTERMEDIATE:
SP-17 through SP-27
11 cards
Printed learning requirement: 2 Elements

ADVANCED:
SP-28 through SP-35
8 cards
Printed learning requirement: 4 Elements

Some Intermediate and Advanced Spells may require access to a Tool.

Every Spell has:
- A stable ID.
- A name.
- A tier.
- A printed Element learning cost.
- An optional Tool requirement.
- A Quick action.
- A Permanent action.
- Exact-color Mirror Sigil requirements for both actions.

IMPORTANT:

ELEMENTS and MIRROR SIGILS are different resources.

Elements:
- Air
- Water
- Earth
- Fire
- Aether

Mirror Sigils:
- Five separate magical colors/types.
- Each Sigil has its own exact-color requirement.
- Sigils are obtained through Mirror collisions.
- Only actual owned, available Sigils may be assigned.

Use the current game's canonical Sigil color IDs.

Do not use obsolete display color names as permanent internal identifiers. Do not substitute Elements for Mirror Sigils.

---

# 2. LEARNING A SPELL

Learning a Spell and activating its abilities are separate operations.

## Learning procedure

1. Player accesses a Spell card in the current room.
2. Game validates the player's learning requirements.
3. Required Elements are paid through the existing Element-payment system.
4. Required Tool access is checked if applicable.
5. An unlocked and available Knowledge slot is required.
6. The Spell becomes learned and is assigned to that Knowledge slot.
7. The Spell remains accessible through the player's board.

IMPORTANT:

Learning a Spell DOES NOT:
- Assign Mirror Sigils.
- Activate Quick.
- Activate Permanent.
- Automatically generate Courage.
- Consume any Mirror Sigils.

Newly learned Spells begin with empty Quick and Permanent Sigil sockets.

## Knowledge slots

The existing player board has four Knowledge slots, unlocked permanently through established Mirror Sigil milestones.

Do not redesign the Knowledge unlocking system.

A learned Spell must occupy a legal Knowledge slot.

The player may open any learned Spell through its card or Knowledge slot.

---

# 3. OPENING A LEARNED SPELL

When the player clicks an already learned Spell, display a Spell detail panel or modal.

The panel must include:

- Spell name.
- Card ID.
- Tier.
- Learning requirements (informational after learning).
- Quick action text.
- Permanent action text.
- Required Sigil sockets for each action.
- Available player Sigils.
- Currently assigned Quick Sigils.
- Currently bound Permanent Sigils.
- Activation status.
- Relevant Sigil Seal restrictions.

Both Quick and Permanent actions must be visually distinguishable.

Example visual structure:

------------------------------------------------

SP-XX — SPELL NAME
Intermediate Spell

QUICK ACTION

Required Sigils:
[ FUCHSIA ] [ ORCHID ]

Effect:
Perform the Quick ability once.

Status:
READY / MISSING SIGILS / BLOCKED / USED

[ ACTIVATE QUICK ]

-----------------------------------------------

PERMANENT ACTION

Required Sigils:
[ FUCHSIA ] [ LILAC ] [ ORCHID ]

Effect:
Activate the ongoing Permanent ability.

Status:
AVAILABLE / MISSING SIGILS / BLOCKED / ACTIVE

[ BIND PERMANENTLY ]

-----------------------------------------------

PLAYER SIGIL STORAGE

Fuchsia: 2 available
Orchid: 1 available
Lilac: 1 available
Rose: 0 available
Peach: 1 available

------------------------------------------------

The colors above are illustrative display labels. Read the actual color definitions from the game configuration.

Do not duplicate the player's storage state inside the Spell UI.

Always derive it from authoritative game state.

---

# 4. CLICKABLE SIGIL SOCKETS

This is a critical interaction requirement.

Every Quick and Permanent action has visible Sigil sockets.

Each socket:
- Displays the exact required Sigil color.
- Can be clicked or tapped.
- Can receive one matching available Sigil.
- Shows whether it is empty, selected, temporarily assigned or permanently bound.

## Interaction

When clicking an empty Sigil socket:

1. Check the required Sigil color.
2. Check the player's available Sigil storage.
3. If a matching Sigil is available, add it to the pending activation selection.
4. Visually fill the socket with that Sigil.
5. Update the number of remaining selectable Sigils.
6. Recalculate whether the complete action can be activated.

If a matching Sigil is unavailable:
- Do not assign anything.
- Provide clear feedback.
- Do not consume other Sigils.

## Pending selection

Allow the player to prepare an activation by selecting Sigils.

Before activation is confirmed:
- Selected Sigils are only a local pending choice.
- They are not permanently removed from storage.
- The player can cancel the activation.
- The player can remove a pending Sigil from its socket.
- Canceling restores the unchanged game state.

On confirmation:
- Validate all required Sigils again.
- Spend every required Sigil atomically.
- Execute the selected action.

Do not partially spend Sigils if activation fails.

## Multiple requirements of the same color

Example:

Quick requirement:
Fuchsia + Fuchsia

The player must have TWO distinct available physical Fuchsia Sigils.

One physical Sigil cannot fill two sockets.

Do not validate only by unique color presence.

Use quantities.

---

# 5. VISUAL AVAILABILITY AND GLOW

Available Sigils and activatable Spell actions should glow.

The player must be able to understand which Spells can be activated without manually opening every card.

## Player board

Every learned Spell should show its activation availability:

QUICK READY:
- All required Quick Sigils are available.
- Action timing is valid.
- No relevant Sigil Seal blocks it.
- The Spell is allowed to use Quick.

PERMANENT READY:
- All required Permanent Sigils are available.
- Permanent action is not already activated.
- No relevant restriction blocks it.
- The Spell is allowed to use Permanent.

When both are available, distinguish the two choices.

For example:
- Quick: subtle magical pulse.
- Permanent: steady golden or violet border.
- Both available: two separate indicators.
- Neither available: neutral card appearance.
- Blocked by curse: sealed/locked overlay.

Use the game's current visual language.

Avoid excessive animation.

## Sigil socket appearance

EMPTY:
Visible outline and required color.

AVAILABLE:
Colored glow or illuminated border.

PENDING:
Filled with selected Sigil; ready for confirmation.

QUICK ASSIGNED:
Filled socket with temporary-binding indication.

PERMANENT ASSIGNED:
Filled socket with persistent locked/bound indication.

SEALED:
Dimmed or overlaid with Sigil Seal symbol.

## Accessibility

Do not use color as the only indication.

Each socket should also have:
- A matching glyph.
- Tooltip or text label.
- Accessible name.
- Clear selected/disabled state.

Use keyboard and touch interactions where supported.

## Full-action validation

Only glow an action as READY if ALL its requirements can be satisfied.

Example:

Required:
2 Fuchsia + 1 Orchid.

Available:
1 Fuchsia + 1 Orchid.

The Orchid socket may show that its color exists in storage, but the action MUST NOT be marked READY.

The complete action is unaffordable.

---

# 6. QUICK ACTION ACTIVATION

Quick actions execute their ability once.

Required Sigils are temporarily assigned to the Spell and removed from available player storage.

They remain unavailable until the beginning of that player's NEXT turn.

## Quick activation sequence

1. Player opens a learned Spell.
2. Player selects Quick.
3. Player assigns all required Sigils.
4. Game validates action timing and Sigil availability.
5. Player confirms Quick activation.
6. Required Sigils leave available storage.
7. Sigils appear assigned beneath the Spell's Quick action.
8. The Quick ability executes once.
9. The assignment remains visible until the owner's next turn.
10. At the start of the owner's next turn, the assigned Sigils return to available storage.

Quick action effects are not permanent unless the individual effect explicitly defines a duration.

## Important turn rule

"Next turn" means the NEXT TURN OF THE PLAYER WHO ACTIVATED THE SPELL.

Not:
- The next player's turn.
- The next game-state update.
- The end of the current turn.
- The start of another player's turn.

Example:

Player A activates Quick on turn A3.

The Sigils remain assigned while:
- Player B acts.
- Player C acts.
- Any other heroes act.

At the beginning of A's next turn, A4:
- Remove the temporary Quick assignments.
- Return their physical Sigils to A's storage.
- Make them available for new activations.

## Quick Sigil lifecycle

AVAILABLE
   |
   v
PENDING SELECTION
   |
   v
ASSIGNED TO QUICK
   |
   v
QUICK ABILITY RESOLVES ONCE
   |
   v
TEMPORARILY UNAVAILABLE
   |
   v
START OF OWNER'S NEXT TURN
   |
   v
RETURN TO AVAILABLE STORAGE

## Additional rules

- Do not restore Quick Sigils at the end of the activation turn.
- Do not restore them because the player closes the Spell panel.
- Do not restore them because a component unmounts.
- Do not let them be assigned to other Spells while waiting.
- Return them exactly once.
- Use actual physical Sigil identities, not only counts.

If a Spell is abandoned before its Quick Sigils return:
- Keep a player-owned record of pending Quick returns.
- Return those Quick Sigils at the appropriate next-turn start.
- Do not accidentally treat temporary Quick Sigils as permanently bound.
- Apply any existing explicit discard effect if it overrides normal return.

## Repeated Quick activation

A Quick action executes once for each successful activation.

For the initial implementation, use at most one Quick activation per learned Spell per owner turn, unless the existing rules explicitly permit more.

Make this limit configurable because the designer may revise it.

Do not impose an additional once-per-round limit on every Spell.

Card-specific ability limits still apply.

---

# 7. PERMANENT ACTION ACTIVATION

Permanent actions remain active while their learned Spell remains in play.

They require permanent commitment of the specified Mirror Sigils.

## Permanent activation sequence

1. Player opens a learned Spell.
2. Player selects Permanent.
3. Player assigns all required Sigils.
4. Game validates exact-color requirements.
5. Player confirms Permanent activation.
6. Required Sigils leave player storage.
7. Sigils become permanently bound to the Spell.
8. The Spell's Permanent effect becomes active.
9. Assigned Sigils remain displayed beneath the Permanent action.
10. The Sigils NEVER return to the player's storage.

This is an irreversible resource commitment under the current rules.

## Permanent Sigil lifecycle

AVAILABLE
   |
   v
PENDING SELECTION
   |
   v
PERMANENTLY BOUND
   |
   +--> SPELL REMAINS LEARNED
   |       |
   |       v
   |    PERMANENT EFFECT ACTIVE
   |
   +--> SPELL DISCARDED OR ABANDONED
           |
           v
        SIGILS DISCARDED

No automatic recovery.

## Persistent effect behavior

Permanent effects:
- Remain active across turns and rounds.
- Do not require reactivation each turn.
- Must not repeatedly pay Sigils.
- Continue working while the Spell remains valid and active.
- May contain passive rules, replacement effects or event-triggered abilities.
- Respect the printed limits of their specific ability.

Example:

A Permanent Spell increases movement by +1.

After activation:
- Its Sigils remain bound.
- The movement bonus applies to future qualifying movement.
- No additional Sigils are paid each turn.

## Spell removal

If the learned Spell is discarded, replaced, or abandoned:

1. Remove its Permanent effect from active game state.
2. Unbind its permanently assigned Sigils from the card.
3. Move those Sigils to the game discard area.
4. Do not return them to the player's storage.
5. Remove the Spell from its Knowledge slot.
6. Apply existing Spell replacement rules.

If the same physical Spell card is later learned again, it must not inherit destroyed Sigil assignments.

## Important distinction

Permanent means the assignment is permanent.

It does not mean the ability survives after the Spell itself leaves play.

---

# 8. QUICK VS PERMANENT MODE RULES

Both action modes must be visible when opening a learned Spell.

The player chooses which available action to activate.

The historical Spell catalog describes Quick and Permanent configurations as alternatives unless the individual Spell explicitly allows both.

Do not make an undocumented assumption about whether:
- Quick may be cast after Permanent activation.
- Permanent may be activated after using Quick earlier.
- Both effects may remain active on one Spell at the same time.

Support this with an explicit mode policy in Spell definitions or common rules.

Examples:
- EXCLUSIVE_ACTIVE_MODE
- BOTH_ALLOWED

Preserve existing approved behavior where present.

Do not permanently lock a Spell out of Permanent activation simply because it previously cast Quick unless that rule is explicitly approved.

Report the actual mode policy implemented.

---

# 9. PLAYER SIGIL STORAGE

Maintain a single authoritative accounting system for physical Mirror Sigils.

A Sigil can occupy exactly ONE location at a time.

Possible states:

AVAILABLE:
In player's personal storage.

QUICK_ASSIGNED:
Temporarily assigned to a Spell action.

PERMANENT_BOUND:
Permanently bound to a learned Spell.

DISCARDED:
Removed from usable circulation.

OTHER:
Any existing game-defined location such as room, supply, or reward pool.

Never permit one physical Sigil to exist in multiple states.

## Suggested data entities

MirrorSigil:
- id
- colorId
- location
- ownerId
- assignedSpellId (optional)
- assignedMode (optional)
- assignedActionId (optional)
- returnTurnId (optional)

LearnedSpell:
- spellId
- ownerId
- knowledgeSlotId
- quickAssignments[]
- permanentAssignments[]
- permanentActive
- modePolicy
- activationUsage
- activeRestrictions[]

Use existing schemas where possible.

Do not create a second storage list that duplicates owned Sigils.

Physical identity is important because:
- Sigils are scarce.
- Each has an exact color.
- The same Sigil cannot activate two actions.
- Permanent Sigils must never return accidentally.
- Quick Sigils return at a precise turn boundary.

---

# 10. START-OF-TURN PROCESSING

Implement Quick Sigil return through the existing turn-state engine.

At the beginning of a player's turn:

1. Identify Quick assignments due to return to this player.
2. Remove those Sigils from their temporary assignment records.
3. Return each Sigil exactly once to the player's available storage.
4. Update corresponding Spell visual states.
5. Update activation eligibility and glow indicators.
6. Continue normal turn-start processing.

Do not implement this using:
- setTimeout
- CSS animation timing
- Component mount effects
- Browser local timers
- Frontend-only countdowns

Use the authoritative turn/round identifiers.

The operation must be idempotent.

Calling turn-start processing twice must not return or duplicate the same Sigil twice.

Coordinate this phase with existing:
- Paralysis Token removal.
- Hexlock removal.
- Sigil Seal removal.
- Other game turn-start effects.

Ensure player-owned Sigils never return at the start of another player's turn.

---

# 11. BLACK MIRROR SIGIL SEAL INTEGRATION

Black Mirrors can add Sigil Seal tokens.

A Sigil Seal blocks the affected Spell action.

## Quick action sealed

- The action cannot be activated.
- Its eligible glow disappears.
- It displays a Seal indicator.
- Its assigned Quick Sigils still follow their normal return lifecycle.
- Sealing does not permanently discard the Sigils.

## Permanent action sealed

- The Permanent effect is temporarily suppressed.
- Its bound Sigils remain bound.
- No Sigils return to storage.
- When the final applicable Seal is removed, the Permanent effect becomes active again.
- The effect does not require paying additional Sigils.

## Multiple Seals

One Seal is removed per affected player's turn according to existing Black Mirror token rules.

If an action has three applicable Seals, it remains blocked until all three are removed.

Do not create a separate Spell-specific Seal removal system that conflicts with the established token engine.

## Visual state

Examples:

QUICK: SEALED ×2
PERMANENT: ACTIVE BUT SUPPRESSED
PERMANENT: ACTIVE
QUICK: READY
QUICK: AWAITING RETURN

Use visual labels and socket appearance, not just glow.

---

# 12. SPELL EFFECT EXECUTION

Separate Sigil payment from ability resolution.

A Spell action must not consume Sigils and then fail silently.

Use a transactional resolution sequence:

1. Validate learned Spell ownership.
2. Validate current action timing.
3. Validate mode availability.
4. Validate Seal restrictions.
5. Validate required Sigil quantities and colors.
6. Validate any additional effect requirements.
7. Request required player choices.
8. Atomically commit Sigil assignments.
9. Resolve the action.
10. Record the result.
11. Emit existing game events.
12. Update UI and persistence.

For actions requiring targets, choose valid targets before committing the irreversible Sigil cost, where possible.

If action validation fails:
- Preserve original storage.
- Preserve current assignments.
- Do not activate the effect.
- Show why activation is unavailable.

For Permanent actions:
- Register their modifier or event handler in the appropriate game-state mechanism.
- Do not register duplicate listeners each time the UI re-renders.
- Remove/suppress the ability when the Spell's lifecycle changes.

For Quick actions:
- Resolve the specified ability once.
- Apply its printed duration separately from the Sigil holding duration.

Do not assume every Quick action must be activated during the player's normal action phase.

Some existing Spells have reaction timing tied to:
- Black Mirror reveal.
- Occuldor arrival.
- Movement.
- Fragment restoration.

Allow activation only during the Spell's legal timing window.

---

# 13. UI IMPLEMENTATION

Use the existing game's card and player-board designs.

## A. Knowledge slots

Every learned Spell card should:
- Be clickable.
- Show its name and tier.
- Show the required Sigil colors.
- Display whether Quick is ready.
- Display whether Permanent is ready or active.
- Display assigned Sigils.
- Display Sigil Seals.

## B. Spell detail panel

Provide:
- Quick section.
- Permanent section.
- Required Sigil sockets.
- Human-readable effect text.
- Available Sigil counts.
- Clickable assignment.
- Confirm activation button.
- Cancel pending assignment control.

Do not trigger a Spell merely by opening the card.

## C. Sigil assignment feedback

When the player clicks a socket:
- Animate the selected Sigil moving from storage to its pending socket if consistent with existing UI.
- Show the Sigil glyph and color.
- Reduce the locally displayed remaining available count.
- Preserve the actual game state until confirmation.

After Quick confirmation:
- Show filled Sigil sockets with a temporary glow.
- Show "Returns next turn" or equivalent tooltip.

After Permanent confirmation:
- Show filled Sigil sockets with a locked magical appearance.
- Show "Permanently bound".
- Disable rebinding the same Permanent cost.

## D. Availability indicators

If a learned Spell has enough free Sigils to activate Quick:
- Show a subtle Quick-ready indicator on the Spell card.

If it has enough free Sigils to activate Permanent:
- Show a Permanent-ready indicator.

If both are ready:
- Show both.

If neither is ready:
- Show neither.

If a mode is already active or blocked:
- Show the correct status instead of a false availability indicator.

## E. Storage view

Show all five types of Sigils with:
- Color.
- Glyph.
- Available count.
- Temporarily assigned count.
- Permanently bound count.

Never count bound Sigils as available.

## F. Responsive and accessibility behavior

Support:
- Desktop click.
- Touch interaction.
- Keyboard focus.
- Disabled controls.
- Tooltips.
- Clear contrast.
- Alternative glyph/labels for colors.

Reuse the established square fantasy card visual language.

---

# 14. EXAMPLE ACTIVATION SCENARIO

Assume a player has these Sigils available:

Fuchsia: 2
Orchid: 1
Lilac: 1

The learned Spell has:

QUICK:
Requires Fuchsia + Orchid.

PERMANENT:
Requires Fuchsia + Lilac + Orchid.

Both actions are initially affordable.

### Example A — Quick

The player opens the Spell.

Both Quick and Permanent show availability indicators.

The player selects Quick.

Fuchsia and Orchid sockets fill in pending state.

The player confirms activation.

Available storage becomes:

Fuchsia: 1
Orchid: 0
Lilac: 1

The Quick ability resolves once.

Two assigned Sigils stay visibly attached to the Quick action.

At the beginning of the player's next turn:

Fuchsia: 2
Orchid: 1
Lilac: 1

The Quick sockets clear.

The Sigils may be spent again.

### Example B — Permanent

Instead, assume the player selects Permanent initially.

They select:
- 1 Fuchsia
- 1 Lilac
- 1 Orchid

The player confirms Permanent activation.

Available storage becomes:

Fuchsia: 1
Orchid: 0
Lilac: 0

The Permanent effect activates.

All three Sigils remain bound to the Spell.

They do not return next turn.

They do not return in later rounds.

If the Spell is discarded:
- Its Permanent effect stops.
- The three committed Sigils are discarded.
- They do not return to storage.

IMPORTANT:
The two examples are alternative scenarios from the same starting state.

They are not consecutive activations.

---

# 15. AUTOMATED TESTS

Use the repository's existing test framework.

## Catalog tests

- Exactly 35 Spells.
- IDs SP-01 through SP-35.
- Valid Basic/Intermediate/Advanced tiers.
- Each Spell has Quick and Permanent data.
- Valid exact-color Sigil requirements.
- No obsolete color references in canonical IDs.

## Sigil assignment tests

- One correct Sigil fills one socket.
- Wrong color cannot fill a socket.
- Multiple same-color sockets require multiple physical Sigils.
- Canceling a pending activation changes no game state.
- Activation cannot use another player's Sigils.
- Activation cannot use temporarily assigned Sigils.
- Activation cannot use permanently bound Sigils.
- Invalid activation does not partially consume Sigils.

## Quick tests

- Quick effect executes exactly once.
- Quick Sigils move out of storage.
- Assigned Sigils appear on the Spell.
- Quick Sigils do not return at end of turn.
- Quick Sigils do not return during other players' turns.
- Quick Sigils return at the start of the owner's next turn.
- Returned Sigils become available again.
- Repeated turn-start processing does not duplicate Sigils.
- Abandoning a Spell does not accidentally destroy ordinary pending Quick Sigils.
- Save/load preserves pending returns.

## Permanent tests

- Permanent activation consumes exact required Sigils.
- Permanent effect activates once.
- Permanent Sigils never return during normal turn progression.
- Bound Sigils are unavailable for new activations.
- Permanent ability remains effective across rounds.
- Re-rendering does not duplicate passive modifiers.
- Discarding the Spell removes its effect.
- Discarding the Spell discards its permanently bound Sigils.
- A newly learned Spell does not inherit discarded assignments.

## Sigil Seal tests

- Sealed Quick actions cannot activate.
- Sealed Permanent effects are suppressed.
- Permanent Sigils remain bound when suppressed.
- Removing the final Seal restores Permanent effect operation.
- Quick return still works if the affected action becomes sealed.
- Multiple Seals are removed according to established turn rules.

## UI tests

- Opening a Spell does not activate it.
- Sigil sockets are clickable.
- Matching available Sigils are highlighted.
- Incomplete multi-Sigil requirements do not glow as READY.
- Both Quick and Permanent availability are displayed correctly.
- Pending Sigils can be removed before confirmation.
- Quick sockets show their temporary-assignment status.
- Permanent sockets show their bound status.
- Counts match actual authoritative storage.
- Changes update across learned Spells.

## Integration tests

- Spell learning does not spend Sigils.
- Tool and Element learning costs remain independent.
- Black Mirror Sigil Seals function.
- Item IT-24 triggers on permanent Sigil commitment without duplicate Courage rewards.
- Item IT-15 cannot discard a permanently bound Sigil from available storage.
- Secret SE-14 correctly counts permanently bound Sigils of different colors.
- Abandoning Spells through Black Mirror BM-24 or BM-26 applies the correct Sigil cleanup.
- All 35 Spell cards use the same activation engine.

---

# 16. IMPLEMENTATION PHASES

PHASE 1 — Repository audit
Inspect existing learned Spells, Sigil storage, player board, and game turn engine.

PHASE 2 — State model
Introduce or adapt physical Sigil assignment states and Spell activation status.

PHASE 3 — Quick lifecycle
Implement temporary assignment, exact-color payment, and next-owner-turn return.

PHASE 4 — Permanent lifecycle
Implement permanent commitment, ongoing effects, suppression, and disposal.

PHASE 5 — Activation validation
Implement eligibility selectors, cost validation, mode restrictions, and atomic activation.

PHASE 6 — Spell UI
Build clickable sockets, glowing availability, pending selection, activation buttons, and assigned-Sigil indicators.

PHASE 7 — Integrations
Connect the engine to Black Mirror Sigil Seals, Items, Secrets, and existing Spell abilities.

PHASE 8 — Tests
Cover assignment, lifecycle, persistence, rendering, and interaction edge cases.

PHASE 9 — Documentation
Explain how new Spell effects should plug into the activation engine.

Implement the complete foundation and wire it into the existing Spell catalog.

Do not stop after creating a visual-only prototype.

---

# 17. DEFINITION OF DONE

The implementation is complete when:

1. Learned Spell cards can be opened.
2. Quick and Permanent actions are visibly separate.
3. Every required Sigil socket can be clicked.
4. The player can assign exact matching Sigils.
5. Fully affordable actions glow on learned Spell cards.
6. Invalid or incomplete assignments cannot activate.
7. Quick consumes its Sigils temporarily.
8. Quick resolves its effect once.
9. Quick Sigils return at the beginning of the owner's next turn.
10. Permanent activation permanently commits Sigils.
11. Permanent effects remain active while the Spell remains in play.
12. Permanent Sigils never return to the player.
13. Abandoning a Spell discards its Permanent Sigils.
14. Sigil Seals correctly suppress abilities.
15. The state survives save/load.
16. All 35 Spells use the common activation framework.
17. Automated tests cover critical activation behavior.

After implementation, provide:
- Files created/modified.
- Summary of the activation architecture.
- Description of Sigil state and return lifecycle.
- UI components introduced.
- Tests executed and results.
- Any Spell effects not yet compatible with the new engine.
- Design assumptions requiring approval.

Avoid unrelated refactoring.

END OF SPECIFICATION
