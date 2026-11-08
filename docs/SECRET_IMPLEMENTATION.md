# Secret achievements v0.5

Implemented 2026-11-07 from [the supplied specification](../reference/Secret_Achievements_v0.5.md). All SE-01 through SE-15 definitions replace the old Secret effects at import. The original 155-card source JSON remains intact. The canonical subtype is `SECRET_ACHIEVEMENT`, using the specification's fundamental rule; the card face reads “Secret achievement.”

## Playing

White Mirrors privately give Secrets to their discoverer. Discoveries never claim rewards automatically or leave Secrets in rooms. Click a private Secret icon to read its condition, reward, current collection counts and eligibility. Qualifying icons have a pale green outline. **Reveal achievement** is available before or after movement when the active living owner qualifies and no resolution is pending.

Revealing publishes the card, grants Courage through the existing capped Courage function, and moves it into that hero's public completed collection. Requirements are not consumed. Other Secrets may reuse the same possessions. A completed achievement stays complete even if those possessions are lost and cannot pay IT-16's discard cost. Each public card records its completion turn, printed reward, actual Courage gained and optional Spell tier. The Chronicle announces only deliberately revealed achievements, never hidden discoveries or discarded Secret identities.

## Implemented catalog and feasibility

| ID | Name | Requirement | Reward | Feasibility under current rules |
| --- | --- | --- | --- | --- |
| SE-01 | Four of a Kind | 4 carried Elements of one physical type | +4 | IT-01 raises Element capacity to 5 |
| SE-02 | Elemental Harmony | 4 carried Element types | +3 | IT-01 |
| SE-03 | Collector of Shadows | 3 carried Black Mirrors | +3 | IT-03 raises Mirror capacity to 3 |
| SE-04 | The Witches' Collection | 3 carried White Mirrors | +3 | IT-03 |
| SE-05 | Master of Equipment | 3 carried Equipment | +4 | Reachable: IT-02 is itself Equipment, gives capacity 3, and counts with two other Equipment cards. Tested through real take commands |
| SE-06 | The Master Craftsman | 3 different accessible Tools | +4 | Current-room Tools count; other players' Tools do not |
| SE-07 | Treasures of the Castle | 2 equipped Relics | +4 | IT-02 or IT-24; IT-24 itself counts as a Relic |
| SE-08 | The Grand Scholar | 4 learned Spells | +5 | Requires all four permanent Knowledge achievements |
| SE-09 | Master of Incantations | 3 learned Spells of the same printed tier | +2 / +4 / +6 | Deck contains 16 Basic, 11 Intermediate, 8 Advanced. Discounts do not change tiers |
| SE-10 | The Unlikely Fellowship | 3 attached Companions | +3 | Compatible trio such as Rex, Alexis and Poe; both attachment behaviors count |
| SE-11 | Keeper of Whispers | 4 hidden Secrets including itself | +5 | Unlimited private hand, 15-card deck; checked before removal |
| SE-12 | The Fifth Essence | All 5 carried Element types | +5 | IT-01; no wildcard substitution |
| SE-13 | Mirror Convergence | 3 carried Mirrors including both colors | +3 | IT-03 |
| SE-14 | The Runic Trinity | 3 permanent Sigil colors across learned Spells | +4 | Verified with legal BIND_SIGILS commands using existing printed Permanent configurations |
| SE-15 | An Unusual Fellowship | Attached Loyal + Stray + equipped Relic | +4 | Evaluator and claims implemented and tested, but **unreachable in a fresh default game until a per-card Stray mapping is approved** |

SE-15's limitation is inherited: the current discovery system assigns all Companions the default LOYAL behavior. The older catalog contains Follower/Wanderer/Resident prose, not an approved LOYAL/STRAY mapping. No Companion classification or effect was changed to make this achievement possible. Existing saved STRAY tokens are supported and transfer immediately affects eligibility. A global STRAY default alone would not solve the need for both types.

## Architecture and files

- `src/game/cards/secrets.ts`: schema-validated 15-card catalog, typed condition keys, fixed and printed-tier rewards. `catalog.ts` substitutes whole Secret definitions so obsolete fields do not remain. `cardEffects.ts` marks achievements executable.
- `src/game/systems/secrets.ts`: pure `evaluateSecretCondition`, shared `secretRevealPlan`, reducer-only mutation via `revealSecret`, and physical Secret supply/completion validation. No title parsing or historical condition counters.
- `src/game/domain/engine.ts`: typed `REVEAL_SECRET` command and schema, per-hero `completedSecrets`, reducer integration and save validation. All commands clone state before mutation; failed requests are atomic.
- `src/components/SecretControls.tsx`: private current-state status, qualified tier selection and reveal control; public completed card status.
- `src/components/CompletedSecrets.tsx`: public face-up collections for every hero, inspectable without exposing private hands.
- `CardFace.tsx`, `PlayerCollection.tsx`, `Game.tsx`, `HowToPlay.tsx`, `app/globals.css`: card rewards, private icon eligibility, public collection integration and guide/style updates.
- `tests/secrets.test.ts`, `tests/e2e/secrets.spec.ts`: each condition, lifecycle and integration; existing private-hand and IT-16 fixtures updated to retain exact physical card conservation.

## Integration decisions and limits

- Actual carried tokens are deduplicated by physical identity. Equipped Relics are carried Relic tokens in this engine; learned Spells must occupy unlocked Knowledge slots and exist in the owner's inventory. Bound colors are read only from those learned Spells. Room Tool access is exclusively SE-06's exception and does not authorize activating a room Tool.
- Collection evaluation remains true in Darkness/Paralysis. Revealing is a personal action, like Sigil banishment, so those room/movement restrictions do not block it. Pending curses, overflow choices, collisions, handoff, elimination and finished expeditions do block it. Legacy excess inventory must be resolved before claiming.
- SE-09 accepts an optional qualified tier; a unique qualifying tier is selected automatically. With four current Knowledge slots, more than one set of three cannot qualify simultaneously, but the evaluator/UI support choosing among multiple qualifying tiers if capacity expands later.
- No current Item rewards Secret revelation specifically. Courage uses `gainCourage`; existing Item reward hooks and all other card effects are unchanged.
- Save schema defaults missing `completedSecrets` to `[]`; stable IDs update old hidden cards/decks to v0.5 without claims or rewards. Exactly 15 unique Secrets must occupy deck, hidden hands, completed collections or the discarded pool. Duplicates, invalid IDs, room Secrets and inconsistent completed rewards are rejected.
- Privacy follows the existing local hot-seat model: the UI hides other players' hands and eligibility and removes card inspectors at handoff. Browser storage contains the entire expedition; this is not a server-backed multiplayer secrecy boundary.

## Verification

Run `pnpm test`, `pnpm typecheck`, `pnpm test:e2e`, and `pnpm build`. Tests cover all 15 conditions, all three SE-09 rewards, current-state loss of eligibility, physical token counting, SE-05 capacity feasibility, real Permanent Sigil binding feasibility, reward caps, non-consumption, overlapping claims, IT-16, save migration, atomic rejection, private discovery, hot-seat privacy, public completed inspection and desktop/mobile presentation. See the changelog for final totals.

Final verification: `pnpm test` passed 227 tests across 9 files (34 Secret-focused tests); `pnpm test:e2e` passed all 31 flows, including four Secret browser scenarios; `pnpm typecheck` and `pnpm build` passed. Desktop/private and mobile/completed card screenshots were inspected.
