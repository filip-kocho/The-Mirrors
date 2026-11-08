# Card implementation status

Updated 2026-11-07. The original 155-card JSON remains intact. The user-supplied Black Mirror v0.4 review catalog overlays BM-01 through BM-35 by stable ID; the revised Item v0.3 catalog overlays IT-01 through IT-25. Secret achievements v0.5 overlay SE-01 through SE-15. The other 80 definitions remain sourced from the original catalog. Import coverage does not imply that every family has executable abilities.

| IDs | Implemented behavior | Remaining limitations |
| --- | --- | --- |
| WM-01..35 | All nonempty discovery slots; Items/Spells local, Companions attached, Secrets private | None for discovery |
| BM-01..07 | Personal Courage calculations and Paralysis | Ring prevention is implemented; BM-06 remains explicitly unpreventable |
| BM-08..14 | Validated carried-object choices/drop categories, fallback losses, Hexlocks including Relic capacity | Review missing-object policies |
| BM-15..21 | Deferred forced movement/end turn, Fear objectives, permanent safe corridor seals | Review forced-visit and conservative topology policies |
| BM-22..28 | Companion/Spell abandonment, action-scope Seals, binding retention, Knowledge Hexlocks | Actual Spell casting/continuous effects remain an unfinished pre-existing module; suppression predicate and visible Seal state are implemented |
| BM-29..35 | Darkness/Portal targets, environmental restrictions and matching Portal-pair movement, Occuldor summoning with personal punishment once/twice | Review unavailable targets and visited-room meaning |
| IT-01..25 | All revised Equipment, Tool and Relic effects; interactive costs, per-hero rounds, carried-only modifiers, permanent commitment reward | REVIEW policies and legacy prerequisite links need approval; see ITEM_IMPLEMENTATION.md |
| SP-01..35 | Learning with exact carried/local costs and carried Tool; first free unsealed unlocked slot; abandonment; visible Quick/Permanent requirements and Seal counts | Permanent binding implemented with explicit UI limitation; printed casting abilities and Quick exhaustion remain unfinished |
| CO-01..10 | Automatic attachment, pale figurines, LOYAL/STRAY departure semantics, curse abandonment, room recruitment and death drops | Per-card behavior assignment defaults to LOYAL; Rex/Coco/Mamba and Alexis/Julius conflicts implemented with review defaults; other powers unfinished |
| SE-01..15 | All v0.5 current-state achievements, private inspection, atomic one-time Courage rewards, public completed collections, IT-16 protection and hot-seat persistence | SE-15 requires an approved Stray mapping; all fresh discoveries currently default LOYAL. See SECRET_IMPLEMENTATION.md |

Black Mirrors remain icons, with their card faces publicly inspectable once discovered. Reading a carried, loose or installed Black Mirror does not execute its curse. The landing catalog shows all definitions without revealing which physical card is in a room. White Mirror faces omit Empty symbols; neither mirror face has empty discovery sockets. Place previews both selected card faces.

All 35 Black curses have typed executable effects and individual real-loop regression scenarios. No English text is interpreted to execute a card. Default play requires resolving curses; only an explicit optional playtest configuration allows a logged skip. See [implementation and review policies](BLACK_MIRROR_IMPLEMENTATION.md).


## Spell activation and interface revision (2026-11-07)

Spell activation update: all 35 Spells share validated assignment and lifecycle handling. 16 Quick and 9 Permanent effects execute; 45 unsupported actions explain their reason and spend nothing. Per-card matrix: SPELL_ACTIVATION_IMPLEMENTATION.md.


## Spell catalog v0.4 (2026-11-08)

SP-01..SP-35 now use v0.4 effects: 35 executable Quick actions and 35 executable Permanent abilities. Fifteen learning prerequisites remain blocked, not remapped to unrelated Items. All prior partial Spell-effect coverage is superseded. See SPELL_IMPLEMENTATION_v0.4.md.
