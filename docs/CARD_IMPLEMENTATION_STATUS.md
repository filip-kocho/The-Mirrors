# Card implementation status

Updated 2026-11-16. See [the latest card revision checklist](CARD_REVISIONS_2026_11_16.md). The original 155-card JSON remains intact. The user-supplied Black Mirror v0.4 review catalog overlays BM-01 through BM-35 by stable ID; the revised Item v0.3 catalog overlays IT-01 through IT-25. Secret achievements v0.5 overlay SE-01 through SE-15. Spell v0.4 and Companion v0.6 revisions also overlay their stable IDs; the White Mirror patterns remain sourced from the original catalog. Import coverage does not imply that every family has executable abilities.

| IDs | Implemented behavior | Remaining limitations |
| --- | --- | --- |
| WM-01..35 | All nonempty discovery slots; Items/Spells local, Companions attached, Secrets private | None for discovery |
| BM-01..07 | Personal Courage calculations and Paralysis | Ring prevention is implemented; BM-06 remains explicitly unpreventable |
| BM-08..14 | Validated carried-object choices/drop categories, fallback losses, Hexlocks including Relic capacity | Review missing-object policies |
| BM-15..21 | Deferred forced movement/end turn, Fear objectives, permanent safe corridor seals | Review forced-visit and conservative topology policies |
| BM-22..28 | Companion/Spell abandonment, action-scope Seals, binding retention, Knowledge Hexlocks | Spell casting, continuous effects, and Seal suppression are implemented |
| BM-29..35 | Darkness/Portal targets, environmental restrictions and matching Portal-pair movement, Occuldor summoning with personal punishment once/twice | Review unavailable targets and visited-room meaning |
| IT-01..25 | All revised Equipment, Tool and Relic effects; interactive costs, per-hero rounds, carried-only modifiers, permanent commitment reward | REVIEW policies and legacy prerequisite links need approval; see ITEM_IMPLEMENTATION.md |
| SP-01..35 | Learning with exact carried/local costs and carried Tool; first free unsealed unlocked slot; abandonment; visible Quick/Permanent requirements and Seal counts | All 35 Quick/Permanent effects implemented; unresolved old Tool prerequisites remain blocked |
| CO-01..10 | v0.6 exact definitions, Carrier Item slots, first-departure Stray ownership, eating before fear, linked Ghost Twins, card relationships and persistence | All ten special abilities implemented, including Poe private scouting and Julia learning discounts. Julia refresh/non-stacking and existing flee/overflow policies remain provisional; see COMPANION_ABILITIES.md. |
| SE-01..15 | v0.6 personal achievements: ten Diamond Challenges, five +5 Courage Heroic Achievements; fixed physical Gem rewards, private eligibility and public completions | Legacy completions retained; see SECRETS_GEMS_IMPLEMENTATION_v0.6.md |

Black Mirrors remain icons, with their card faces publicly inspectable once discovered. Reading a carried, loose or installed Black Mirror does not execute its curse. The landing catalog shows all definitions without revealing which physical card is in a room. White Mirror faces omit Empty symbols; neither mirror face has empty discovery sockets. Place previews both selected card faces.

All 35 Black curses have typed executable effects and individual real-loop regression scenarios. No English text is interpreted to execute a card. Default play requires resolving curses; only an explicit optional playtest configuration allows a logged skip. See [implementation and review policies](BLACK_MIRROR_IMPLEMENTATION.md).


## Spell activation and interface revision (2026-11-07)

Spell activation update: all 35 Spells share validated assignment and lifecycle handling. 16 Quick and 9 Permanent effects execute; 45 unsupported actions explain their reason and spend nothing. Per-card matrix: SPELL_ACTIVATION_IMPLEMENTATION.md.


## Spell catalog v0.4 (2026-11-08)

SP-01..SP-35 now use v0.4 effects: 35 executable Quick actions and 35 executable Permanent abilities. Fifteen learning prerequisites remain blocked, not remapped to unrelated Items. All prior partial Spell-effect coverage is superseded. See SPELL_IMPLEMENTATION_v0.4.md.
