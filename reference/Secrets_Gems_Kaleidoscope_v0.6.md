
# THE MIRRORS — SECRETS, DIAMOND GEMS & KALEIDOSCOPE
## Complete Implementation Specification v0.6

You are a senior TypeScript/JavaScript developer and board-game systems architect working on the existing digital implementation of The Mirrors.

Your task is to implement the revised Secret achievement system, Wild Diamond Gems, starting Wild Sigils, and updated Kaleidoscope rewards.

This specification supersedes all previous Secret card definitions and the old Kaleidoscope color-adjacency Courage system.

IMPORTANT:
- Implement working gameplay, not just card descriptions.
- Inspect the existing repository before changing anything.
- Reuse established architecture and UI patterns.
- Do not redesign Items, Spells, Companions or Black Mirrors.
- Do not invent additional card powers.
- Preserve physical resource accounting.
- Preserve the Element bag's random-draw rules.
- Keep unresolved design policies configurable.

==================================================
1. SYSTEM OVERVIEW
==================================================

The new mechanics contain:

SECRET CARDS
- 15 unique Secrets.
- 10 easy achievements awarding Diamond Gems.
- 5 hard achievements awarding Courage.
- Secret IDs remain SE-01 through SE-15.

WILD DIAMOND GEMS
- Exactly 10 unique physical tokens.
- Obtained by completing the 10 easy Secrets.
- All Gems have identical wildcard utility abilities.
- Gems can later be installed in the Kaleidoscope.

WILD MIRROR SIGILS
- Every player starts with exactly 1 Wild Sigil.
- Can substitute for any colored Mirror Sigil in Spell activation.
- Can be used in the central Kaleidoscope pentagon.

KALEIDOSCOPE
- 35 colored fragments.
- 10 Diamond Gem gaps.
- 1 central pentagon.

COURAGE
- Restoring a fragment: +1.
- Installing a Diamond Gem: +3.
- Installing a Wild Sigil in the central pentagon: +5.
- Hard Secret completion: +5.

Remove the old Courage bonuses based on neighboring fragment colors.

Do not remove unrelated Courage bonuses granted by Items or Spells.

==================================================
2. SECRET CARD RULES
==================================================

All Secrets are hidden personal achievements.

Secrets are discovered through White Mirrors.

When a Secret is discovered:

1. Draw the Secret.
2. Assign it privately to the discovering player.
3. Keep it unrevealed in their Secret collection.
4. Do not place it in the room.
5. Do not activate its reward automatically.

Players may hold unlimited unrevealed Secrets.

Every Secret has:
- ID
- Name
- Achievement condition
- Reward type
- Reward amount
- Completion state

Secrets have two reward categories:

DIAMOND_CHALLENGE
HEROIC_ACHIEVEMENT

No other Secret subtypes are required.

----------------------------------------
2.1 ACHIEVEMENT COMPLETION
----------------------------------------

A player may reveal a Secret when its condition is currently satisfied.

The game must validate the current state.

Examples:
- Current carried Elements.
- Current carried Mirrors.
- Current equipped Items.
- Current learned Spells.
- Current attached Companions.
- Current unrevealed Secrets.
- Current available colored Sigils.

Do not rely on historical conditions.

When a player reveals an eligible Secret:

1. Validate ownership.
2. Validate that it is unrevealed.
3. Evaluate its achievement condition.
4. Confirm the reward is available.
5. Reveal the Secret publicly.
6. Grant its reward.
7. Move it into completed achievements.
8. Mark it permanently completed.
9. Persist the state.

Completing an achievement does not consume the resources used to qualify.

A completed Secret cannot be claimed twice.

Multiple Secrets may be completed using overlapping resources.

Completed Secrets remain face up and public.

----------------------------------------
2.2 RESOURCE COUNTING
----------------------------------------

Unless explicitly stated otherwise, count only:

- Elements physically carried.
- Mirrors physically carried.
- Equipment/Tools physically carried.
- Equipped Relics.
- Learned Spells.
- Attached Companions.
- Unrevealed Secrets in the player's hand.
- Available colored Mirror Sigils in personal storage.

Do not count:
- Objects merely lying in rooms.
- Other players' inventory.
- Discarded cards.
- Completed Secrets.
- Permanently bound Sigils.
- Temporarily assigned Quick Sigils.

The shared-room access rule still applies to normal actions.

However, room resources do not count toward personal collection achievements.

==================================================
3. TEN EASY SECRETS — DIAMOND CHALLENGES
==================================================

Every easy Secret awards exactly ONE Wild Diamond Gem.

No direct Courage is awarded when completing these Secrets.

SE-01 — ELEMENTAL PAIR

Condition:
Carry at least 2 physical Elements of the same type.

Reward:
1 Diamond Gem.

Do not count Element multipliers as additional tokens.

---

SE-02 — ELEMENTAL HARMONY

Condition:
Carry at least 3 different Element types.

Reward:
1 Diamond Gem.

Aether counts as one physical type.

---

SE-03 — MIRROR BALANCE

Condition:
Carry at least:
- 1 White Mirror.
- 1 Black Mirror.

Reward:
1 Diamond Gem.

---

SE-04 — TWIN REFLECTIONS

Condition:
Carry at least 2 Mirrors of the same type.

Valid:
- 2 White Mirrors.
- 2 Black Mirrors.

Reward:
1 Diamond Gem.

---

SE-05 — CRAFTSMAN'S HANDS

Condition:
Carry simultaneously:
- At least 1 Equipment card.
- At least 1 Tool card.

Reward:
1 Diamond Gem.

Relics do not count as Equipment or Tools.

Companions occupying Item slots do not count as Equipment or Tools.

---

SE-06 — RELIC HUNTER

Condition:
Have at least 1 Relic equipped.

Reward:
1 Diamond Gem.

The Relic must occupy a valid Relic slot.

---

SE-07 — APPRENTICE MAGICIAN

Condition:
Have at least 2 learned Spells simultaneously.

Reward:
1 Diamond Gem.

Only Spells occupying unlocked Knowledge slots count.

---

SE-08 — UNEXPECTED COMPANY

Condition:
Have at least 2 attached Companions simultaneously.

Reward:
1 Diamond Gem.

Followers and Carriers both count.

Reunited Ghost Twins count as two physical Companion cards.

---

SE-09 — KEEPER OF WHISPERS

Condition:
Hold at least 2 unrevealed Secrets, including SE-09 itself.

Reward:
1 Diamond Gem.

IMPORTANT:
Validate the condition before moving SE-09 to the completed achievement area.

---

SE-10 — SIGIL HARMONY

Condition:
Have at least 2 AVAILABLE colored Mirror Sigils of different colors in personal storage.

Reward:
1 Diamond Gem.

Do not count:
- Wild Sigils.
- Quick-assigned Sigils.
- Permanently bound Sigils.
- Discarded Sigils.

A Wild Sigil does not count as a distinct printed color for this achievement.

==================================================
4. FIVE HARD SECRETS — HEROIC ACHIEVEMENTS
==================================================

ALL FIVE HARD SECRETS AWARD EXACTLY +5 COURAGE.

Do not use the older +4 values.

These achievements do not award Diamond Gems.

---

SE-11 — FOUR OF A KIND

Condition:
Carry at least 4 Elements of the same type.

Reward:
+5 Courage.

Requires sufficient physical Element carrying capacity.

---

SE-12 — THE FIFTH ESSENCE

Condition:
Carry all five Element types simultaneously:

Air
Water
Earth
Fire
Aether

Reward:
+5 Courage.

Physical tokens are required.

Wildcard substitutions do not count as missing Element types.

---

SE-13 — MASTER OF REFLECTIONS

Condition:
Carry at least:
- 3 White Mirrors

OR

- 3 Black Mirrors.

Reward:
+5 Courage.

The player must have sufficient Mirror carrying capacity.

---

SE-14 — TREASURES OF THE CASTLE

Condition:
Have at least 2 equipped Relics simultaneously.

Reward:
+5 Courage.

Use the existing Relic capacity system.

IT-02 and IT-24 may expand Relic capacity.

---

SE-15 — THE GRAND SCHOLAR

Condition:
Have at least 4 learned Spells simultaneously.

Reward:
+5 Courage.

All required Knowledge slots must be unlocked.

Do not bypass the existing Sigil-based Knowledge unlock rules.

==================================================
5. WILD DIAMOND GEMS
==================================================

Create exactly 10 physical Wild Diamond Gem tokens.

They are not:
- Items.
- Elements.
- Mirror Sigils.
- Secrets.
- Spells.

They are a separate magical resource type.

All 10 Gems have identical rules.

Do not introduce different Gem colors, rarity levels or unique abilities.

----------------------------------------
5.1 GEM ACQUISITION
----------------------------------------

Each of the 10 easy Secrets is associated with exactly 1 physical Diamond Gem.

When an easy Secret is completed:

1. Reveal the Secret.
2. Identify its reserved Gem token.
3. Release that Gem from the reserved Gem supply.
4. Assign it to the eligible player or the current room according to carrying rules.
5. Mark the Secret completed.

A Gem is NOT awarded when its Secret is discovered.

It is awarded only when the achievement is successfully completed.

No Diamond Gems are generated by Companion discovery in this version.

Do not randomly assign Gem reward markers to cards.

The mapping is fixed:
SE-01 through SE-10 each unlock one Gem.

Maintain exactly 10 physical Gems in the game.

----------------------------------------
5.2 GEM LOCATION
----------------------------------------

A Gem may exist in one of these states:

RESERVED
- Its Secret has not yet been completed.

PLAYER_STORAGE
- Held by a player.

ROOM
- Left or dropped in a castle room.

KALEIDOSCOPE
- Permanently installed in a Diamond gap.

Every Gem must have a unique physical identity.

A Gem cannot exist in multiple locations simultaneously.

----------------------------------------
5.3 GEM CARRYING
----------------------------------------

Use a dedicated Diamond Gem storage area, separate from ordinary Item slots.

Provisional carrying limit:
1 Diamond Gem per hero.

Make this configurable.

If a player earns a Gem while their Gem storage is full:
- Preserve the existing Gem.
- Place the newly released Gem in the current room.
- Make it available through normal room collection rules.

Do not discard or duplicate the Gem.

Do not expand Equipment, Tool or Relic capacities to represent Gems.

----------------------------------------
5.4 GEM UTILITY ACTIONS
----------------------------------------

A player holding a READY Diamond Gem may activate ONE of the following utility actions.

ACTION A — BREAK PARALYSIS

Remove 1 Paralysis Token from yourself.

The token must exist.

ACTION B — REMOVE HEXLOCK

Remove 1 inventory-blocking Hexlock Token from yourself.

The token must exist.

ACTION C — MAGICAL PASSAGE

Ignore one eligible Threshold-Sealed corridor or existing trap restriction during the current movement.

The obstacle is not permanently removed.

Use existing movement and trap systems.

Do not invent a new trap-token type merely for this action.

ACTION D — SWIFT MOVEMENT

Increase the player's maximum movement allowance by +1 room for the current movement.

This is optional additional movement capacity.

It does not require moving an extra room.

It does not bypass other movement restrictions.

----------------------------------------
5.5 GEM EXHAUSTION
----------------------------------------

After a successful utility activation:

READY -> EXHAUSTED

An exhausted Gem cannot activate another utility action until it refreshes.

Refresh timing:

At the beginning of the owning player's NEXT turn:

EXHAUSTED -> READY

Use the existing authoritative turn engine.

Do not use browser timers or UI lifecycle events.

A Gem can activate only one utility effect per readiness cycle.

Track exhaustion on the physical Gem token, not only on the player, so transferring a Gem cannot reset its usage.

Refreshing must be idempotent.

----------------------------------------
5.6 GEM INSTALLATION
----------------------------------------

A Gem may be permanently installed in a completed Diamond gap.

Requirements:

- The player possesses the Gem.
- A Diamond gap exists.
- The gap is empty.
- All required surrounding Kaleidoscope fragment spaces are occupied.
- The player can legally perform the installation action.

An exhausted Gem may still be installed.

Installation:

1. Select an eligible Diamond gap.
2. Move the Gem from player storage into that gap.
3. Permanently mark the gap filled.
4. Remove the Gem's utility availability.
5. Award +3 Courage to the installing player.
6. Update the Kaleidoscope state.

Installed Gems:
- Cannot be retrieved.
- Cannot be activated.
- Cannot be transferred.
- Cannot be installed again.

Each Diamond gap awards Courage exactly once.

All Diamond Gems are interchangeable for installation.

No color matching is required.

==================================================
6. KALEIDOSCOPE SCORING REDESIGN
==================================================

The Kaleidoscope contains:

- 35 colored fragment positions.
- 10 Diamond Gem gaps.
- 1 central pentagon gap.

Remove the old color-based Courage adjacency rules.

OLD SYSTEM:
- +1 Courage for matching-color adjacency.
- +2 Courage for different-color adjacency.

NEW SYSTEM:

A. FRAGMENT RESTORATION
+1 Courage per successfully restored fragment.

B. DIAMOND INSTALLATION
+3 Courage per successfully installed Diamond Gem.

C. CENTRAL PENTAGON
+5 Courage when an eligible Wild Sigil is permanently installed.

Do not award Courage just because a Gem gap becomes surrounded.

The player must actually install a Gem.

----------------------------------------
6.1 FRAGMENT RESTORATION
----------------------------------------

The existing White/Black Mirror collision system continues restoring the 35 fragments.

When a fragment is restored:

1. Resolve the collision.
2. Restore the appropriate fragment.
3. Award normal collision resources.
4. Award +1 Courage for the fragment.
5. Update surrounding Diamond and Pentagon eligibility.

Do not automatically install Gems.

Preserve the existing fragment-placement legality rules, unless an explicitly activated Item or Spell changes them.

----------------------------------------
6.2 DIAMOND GAPS
----------------------------------------

There are exactly 10 predefined Diamond gaps.

Each gap must have a list of surrounding fragment-position IDs derived from the actual Kaleidoscope geometry.

A Diamond gap becomes READY when all its required neighboring fragments are restored.

States:
INCOMPLETE
READY
FILLED

INCOMPLETE:
At least one surrounding fragment is missing.

READY:
All surrounding fragments exist and the gap is empty.

FILLED:
A Diamond Gem has been installed.

When a gap becomes READY:
- Visually highlight it.
- Allow legal installation.
- Do not automatically award Courage.

When a Gem is installed:
- Award +3 Courage.
- Mark FILLED.
- Never award its Courage again.

----------------------------------------
6.3 CENTRAL PENTAGON
----------------------------------------

The Kaleidoscope has one central pentagon gap.

It becomes READY when all required surrounding fragment spaces have been restored.

An eligible player may install one available Wild Sigil in the pentagon.

On installation:
- Permanently remove the Wild Sigil from player storage.
- Place it in the central pentagon.
- Award +5 Courage.
- Mark the pentagon FILLED.

The pentagon may be filled only once per game.

Other players retain their own Wild Sigils.

Do not automatically return the installed Wild Sigil.

==================================================
7. STARTING WILD SIGILS
==================================================

Every player begins the game with exactly 1 Wild Mirror Sigil.

For a game with N players:
- Create N starting Wild Sigils.
- Give one to each player.

These Wild Sigils are additional to the ordinary colored Mirror Sigils obtained through collisions.

Do not alter the number of colored Mirror Sigils.

----------------------------------------
7.1 SPELL ACTIVATION
----------------------------------------

A Wild Sigil can substitute for any one exact-colored Mirror Sigil socket.

Example:

A Quick Spell requires:
- Scarlet
- Emerald

The player may use:
- Scarlet + Emerald

OR
- Wild + Emerald

OR
- Scarlet + Wild

OR
- Two distinct Wild Sigils, if legally owned.

Each Wild Sigil fills only one socket.

A Wild Sigil cannot satisfy several requirements simultaneously.

----------------------------------------
7.2 QUICK ASSIGNMENT
----------------------------------------

If a Wild Sigil is used for a Quick Spell:

- It becomes temporarily assigned.
- It remains unavailable during the assignment.
- It returns to player storage at the beginning of the owner's next turn.

Use the existing Quick lifecycle.

----------------------------------------
7.3 PERMANENT ASSIGNMENT
----------------------------------------

If a Wild Sigil is used for a Permanent Spell:

- It becomes permanently bound.
- It never returns to storage.
- It is discarded if the learned Spell is abandoned.

Use the existing Permanent Spell lifecycle.

----------------------------------------
7.4 PENTAGON INSTALLATION
----------------------------------------

A Wild Sigil may be installed in the central pentagon only if it is AVAILABLE in player storage.

A Quick-assigned Wild Sigil cannot be installed until returned.

A permanently bound Wild Sigil cannot be installed.

Once installed, it cannot be used for Spells again.

The central pentagon holds exactly one Wild Sigil.

----------------------------------------
7.5 WILD SIGIL RESTRICTIONS
----------------------------------------

Wild Sigils do not automatically count as a specific Sigil color for achievements.

In particular:

SE-10 requires two different actual colored Sigils.

The starting Wild Sigil does not satisfy one of those distinct-color requirements.

Do not automatically count Wild Sigils toward color-diversity Knowledge unlock requirements without an existing approved rule.

Preserve the physical identity of each Wild Sigil.

==================================================
8. COURAGE ACCOUNTING
==================================================

Use the existing Courage/Fear track.

All five hard Secrets award +5 Courage.

Each Diamond installation awards +3 Courage.

The central pentagon awards +5 Courage.

Each fragment restoration awards +1 Courage.

Example:

Player restores a fragment:
+1 Courage.

That fragment completes the surrounding arrangement of a Diamond gap.

No Gem is installed yet:
No additional Courage.

Later, the player installs a Diamond Gem:
+3 Courage.

Do not combine those events accidentally.

Use a single authoritative Courage update pipeline.

Respect the existing Courage maximum.

Prevent duplicate rewards.

Potential total Kaleidoscope Courage:

35 fragments x 1 = 35
10 Diamond Gems x 3 = 30
1 central pentagon x 5 = 5

TOTAL = 70

This excludes Courage from:
- Secrets.
- Items.
- Spells.
- Other game effects.

The five hard Secrets provide a further maximum +25 Courage across the full deck.

==================================================
9. SECRET & GEM UI
==================================================

----------------------------------------
9.1 SECRET CARDS
----------------------------------------

Every Secret card must show:

- ID.
- Name.
- Achievement condition.
- Reward type.
- Reward amount.
- Eligibility status.
- Reveal/Claim control.

Easy Secret display:
Reward: 1 Diamond Gem.

Hard Secret display:
Reward: +5 Courage.

Secrets must remain private until revealed.

Only the owning player may see their hidden Secret's details and eligibility.

----------------------------------------
9.2 PLAYER GEM STORAGE
----------------------------------------

Show a dedicated Diamond Gem area.

Display:
- Gem count.
- Ready/Exhausted state.
- Utility activation control.
- Installation control when eligible.

Opening a Gem shows:

BREAK PARALYSIS
REMOVE HEXLOCK
MAGICAL PASSAGE
SWIFT MOVEMENT

Only legal actions should be enabled.

The player chooses one action.

After activation:
- Mark the Gem exhausted.
- Update the visual state.
- Disable further utility activation until refresh.

----------------------------------------
9.3 KALEIDOSCOPE UI
----------------------------------------

Display:
- 35 fragment positions.
- 10 Diamond Gem gaps.
- 1 central pentagon.

Diamond gap states:
- Incomplete: neutral.
- Ready: glowing outline.
- Filled: physical Gem displayed.

Central pentagon states:
- Incomplete.
- Ready.
- Filled with Wild Sigil.

When selecting an eligible gap:
- Show the required resource.
- Show the Courage reward.
- Allow confirmation.
- Apply installation atomically.

Do not visually fill a gap before the game engine confirms the operation.

----------------------------------------
9.4 WILD SIGIL UI
----------------------------------------

Show Wild Sigils in the player's Sigil storage.

Use a distinctive multicolored glyph.

Wild Sigils must be selectable when filling colored Spell sockets.

Do not change the appearance of the socket's required color.

Once assigned:
- Quick: show temporarily assigned Wild Sigil.
- Permanent: show bound Wild Sigil.
- Pentagon: show installed Wild Sigil.

Do not show the same Wild Sigil in storage and on the board simultaneously.

==================================================
10. GAME STATE MODEL
==================================================

Use current project schemas where possible.

Suggested conceptual definitions:

SecretDefinition:
- id
- name
- category
- achievementCondition
- rewardType
- rewardAmount

SecretInstance:
- instanceId
- cardId
- ownerId
- revealed
- completed

DiamondGem:
- instanceId
- sourceSecretId
- locationType
- ownerId
- roomId
- kaleidoscopeGapId
- exhausted
- refreshTurnId

WildSigil:
- instanceId
- ownerId
- locationType
- assignedSpellId
- assignedMode
- assignedSocketId
- kaleidoscopeGapId

KaleidoscopeGap:
- id
- type
- requiredNeighborFragmentIds[]
- state
- installedResourceId
- courageAwarded

Use actual game IDs and types.

Do not duplicate canonical resource records.

==================================================
11. REUSABLE GAME OPERATIONS
==================================================

Prefer or extend existing operations:

evaluateSecretCondition
revealSecret
completeSecret
awardDiamondGem
moveGemToRoom
collectDiamondGem
activateDiamondGem
exhaustDiamondGem
refreshDiamondGem
installDiamondGem
calculateDiamondGapReadiness
installCentralWildSigil
validateWildSigilAssignment
calculateAvailableSigils
grantCourage

All actions must validate state before mutation.

Important resource transactions must be atomic.

A rejected action must not consume resources.

==================================================
12. IMPORTANT INTEGRATIONS
==================================================

ITEMS

- Element-capacity Equipment affects SE-11 and SE-12.
- Mirror-capacity Equipment affects SE-13.
- Relic-capacity bonuses affect SE-14.
- IT-16 may discard an unrevealed Secret, following existing rules.
- Completed Secrets must not be eligible for discard-as-payment.
- IT-08 and other restoration Courage bonuses remain governed by their own effects.

SPELLS

- Wild Sigils may fill matching Spell sockets.
- Quick Wild Sigils return next turn.
- Permanent Wild Sigils never return.
- All Sigil assignment states remain authoritative.
- Spell effects granting movement or removing tokens must not consume Diamond Gems unless a Gem is explicitly activated.

COMPANIONS

- Attached Companions count for SE-08.
- Carriers and Followers both count.
- The reunited Ghost Twins count as two physical Companion cards.

BLACK MIRRORS

- Paralysis Tokens may be removed by Gems.
- Hexlock Tokens may be removed by Gems.
- Threshold Seals may be bypassed through a Gem utility action.
- Do not modify the underlying curse definitions.

KALEIDOSCOPE FRAGMENT MOVEMENT

Some Spells can relocate restored fragments.

If such movement affects a surrounded Gem or the central pentagon, preserve the consistency of the board.

Do not award completion Courage again.

Do not duplicate Gems.

The treatment of fragment relocation around already filled gaps must be documented and validated.

==================================================
13. AUTOMATED TESTS
==================================================

CATALOG TESTS

- Exactly 15 Secrets.
- Exactly 10 Diamond Challenges.
- Exactly 5 Heroic Achievements.
- All Heroic Achievements grant +5 Courage.
- All Diamond Challenges grant one Gem.
- No obsolete Secret effects remain.

ACHIEVEMENT TESTS

SE-01:
Two same-type Elements qualify.

SE-02:
Three distinct Element types qualify.

SE-03:
One White and one Black Mirror qualify.

SE-04:
Two same-type Mirrors qualify.

SE-05:
Equipment plus Tool qualifies.

SE-06:
One equipped Relic qualifies.

SE-07:
Two learned Spells qualify.

SE-08:
Two attached Companions qualify.

SE-09:
Two unrevealed Secrets including itself qualify.

SE-10:
Two available distinct colored Sigils qualify.
Wild Sigils do not count.

SE-11:
Four same-type Elements award +5.

SE-12:
All five Element types award +5.

SE-13:
Three same-type Mirrors award +5.

SE-14:
Two equipped Relics award +5.

SE-15:
Four learned Spells award +5.

SECRET LIFECYCLE

- Hidden Secrets remain private.
- Ineligible reveals fail.
- Completed Secrets cannot be claimed again.
- Multiple achievements may overlap.
- Reward is granted exactly once.
- Discarded Secrets cannot be claimed.
- Save/load retains completed status.

DIAMOND GEM TESTS

- Exactly 10 Gems exist.
- Each easy Secret releases its reserved Gem.
- One Secret cannot release two Gems.
- Gem acquisition does not automatically grant Courage.
- Gem utility removes a valid Paralysis Token.
- Gem utility removes a valid Hexlock.
- Gem utility supports legal sealed-corridor bypass.
- Gem utility increases movement allowance by 1.
- Invalid utility actions do not exhaust the Gem.
- Successful utility actions exhaust the Gem.
- Exhausted Gems cannot activate twice.
- Gems refresh at owner's next turn.
- Transferring Gems does not reset exhaustion.
- An exhausted Gem can be installed.
- Installation permanently removes it from player storage.
- Installation grants +3 Courage exactly once.

WILD SIGIL TESTS

- Every player starts with one Wild Sigil.
- Wild Sigils can fill colored Spell sockets.
- One Wild Sigil fills one socket.
- Quick Wild Sigils return correctly.
- Permanent Wild Sigils remain bound.
- Bound Wild Sigils cannot be installed in the pentagon.
- Only one Wild Sigil can fill the central pentagon.
- Pentagon installation grants +5 Courage exactly once.

KALEIDOSCOPE TESTS

- Exactly 10 Diamond gaps exist.
- Exactly one central pentagon exists.
- Surrounding-fragment readiness is correct.
- Incomplete gaps reject installation.
- Full gaps reject duplicate installation.
- Diamond installation grants +3.
- Pentagon installation grants +5.
- Fragment restoration grants +1.
- Old color-adjacency Courage bonuses are absent.
- Spells relocating fragments do not produce duplicate rewards.

PERSISTENCE TESTS

- Secrets survive save/load.
- Gem ownership survives save/load.
- Gem exhaustion survives save/load.
- Installed Gems remain installed.
- Wild Sigil assignments persist.
- Pentagon state persists.
- No resource duplication occurs.

==================================================
14. IMPLEMENTATION PHASES
==================================================

PHASE 1 — Repository audit

Inspect:
- Secret catalog.
- Achievement conditions.
- Player inventory.
- White Mirror discoveries.
- Courage scoring.
- Sigil storage.
- Spell activation.
- Kaleidoscope geometry.
- Movement and Black Mirror tokens.

PHASE 2 — Replace Secret catalog

Register all 15 new achievement definitions.

Remove obsolete Secret effects and rewards.

PHASE 3 — Achievement engine

Implement pure condition evaluation and authoritative completion.

PHASE 4 — Diamond Gem resource

Implement 10 physical Gem tokens, reserved supply, acquisition, storage and transfers.

PHASE 5 — Gem utility actions

Implement removal, movement enhancement, obstacle bypass, exhaustion and refresh.

PHASE 6 — Wild Sigils

Give every player one Wild Sigil at setup.

Integrate Wild Sigils into Quick and Permanent Spell assignment.

PHASE 7 — Kaleidoscope changes

Implement:
- 10 Diamond gaps.
- 1 central pentagon.
- Readiness validation.
- Gem installation.
- Wild Sigil installation.
- Revised Courage scoring.

PHASE 8 — UI

Update Secret cards, Gem storage, Wild Sigil storage, Kaleidoscope gaps and reward feedback.

PHASE 9 — Integrations

Connect to Items, Spells, Companions, Black Mirrors and movement.

PHASE 10 — Tests

Implement unit, integration, persistence and regression tests.

PHASE 11 — Documentation

Document changes, provisional policies and unresolved decisions.

==================================================
15. PROVISIONAL RULES
==================================================

These remain configurable until explicitly approved:

1. Maximum Diamond Gems carried per player.
   Initial proposal: 1.

2. Whether a Gem may be transferred voluntarily between players.

3. Whether Gems are required for overall victory.
   Preserve the existing objective of restoring 35 fragments unless the approved game rules specify otherwise.

4. Whether Gem installation requires a specific player action window or may occur at any time during the owner's turn.

5. Exact timing and restrictions for Gem-based trap bypass.

6. Whether removing Paralysis with a Gem allows movement during the same turn when existing Paralysis rules would normally prevent it.

7. How relocated fragments interact with previously filled Diamond or Pentagon gaps.

8. Whether a Wild Sigil counts toward colored-Sigil Knowledge unlocking.
   Do not automatically grant color-diversity milestones from Wild Sigils.

Do not invent permanent rules for these cases.

Use existing approved mechanics when available.

Otherwise implement a clearly documented configurable policy.

==================================================
16. DEFINITION OF DONE
==================================================

The implementation is complete when:

1. The 15 revised Secrets are available.
2. Easy Secrets award Diamond Gems.
3. All five hard Secrets award +5 Courage.
4. Exactly 10 Diamond Gems exist.
5. Gems can be earned, stored, activated and installed.
6. Gems have universal utility actions.
7. Gem exhaustion and refresh work.
8. Every player starts with one Wild Sigil.
9. Wild Sigils work with Spell activation.
10. Wild Sigils can be installed in the central pentagon.
11. Diamond installation awards +3 Courage.
12. Pentagon installation awards +5 Courage.
13. Old color-adjacency scoring is removed.
14. Fragment restoration still awards +1 Courage.
15. Existing card interactions remain functional.
16. UI updates correctly.
17. Save/load works.
18. Automated tests pass.
19. No Gems or Sigils can be duplicated.
20. Unresolved rules are documented.

After implementation, report:

- Files modified.
- New Secret catalog.
- New resource definitions.
- Achievement evaluation implementation.
- Gem utility implementation.
- Wild Sigil integration.
- Kaleidoscope scoring changes.
- UI changes.
- Tests executed and results.
- Remaining design questions.

END OF IMPLEMENTATION SPECIFICATION
