# Changelog

## 2026-11-08 - Secrets, Gems and Kaleidoscope v0.6

Replaced all fifteen Secret definitions. Added ten reserved Diamond Gems, utility/exhaustion/storage/installation, and one starting Wild Sigil per hero. Reused physical Spell assignments for Wilds. Replaced color adjacency and automatic closure rewards with +1 fragments, +3 Gem installation and +5 central Wild installation. Added save migration and explicit configurable resource policies.

## 2026-11-08 - Companion system v0.6

Exact ten-card definitions and relationships; Item-slot Carriers; departure-only Stray transfer; eating before fear; permanent linked Ghost Twins; existing card integration, save migration and updated inspectors. No individual Companion powers added. See COMPANION_IMPLEMENTATION_v0.6.md for policies and validation.

## 2026-11-07 ? Secret achievements v0.5

- Replace all 15 Secret definitions with structured current-state achievements, preserving IDs.
- Add private eligibility and voluntary reveal, engine-calculated Courage, non-consumption, public completed collections and repeat-claim protection.
- Preserve private White Mirror discovery; validate exact Secret supply and migrate older saves without automatic rewards.
- Integrate carried/room Tool distinctions, printed Spell tiers, permanent Sigils, Companion attachments and IT-16 hidden-only discard costs.
- Verify SE-05 is reachable with IT-02 plus two Equipment cards. SE-15 is implemented but awaits an approved per-card Stray mapping for fresh-game feasibility.
- Document all 15 cards, files, timing, migration and feasibility in SECRET_IMPLEMENTATION.md.
- Verified: 227 unit/component tests and all 31 browser tests passed, including four Secret flows; strict TypeScript and production build passed. Inspected private and completed card screenshots on desktop/mobile.

## 2026-11-07 — Discovery captions and curse footer

- Keep discovery names beneath White Mirror icons alongside each card's individual haiku.
- Give the curse popup a separate stationary action footer and scrollable card area so Resolve curse never overlays the Black Mirror.

## 2026-10-31 — Individual White Mirror poems and action icons

- Give WM-01 through WM-35 distinct original three-line haiku, displayed consistently in the catalog and all card inspectors.
- Replace the character board's Place/Collide text with paired-mirror and shattering-mirror icons. Preserve accessible action names, explanatory tooltips, legal-action checks and the Collide glow.

## 2026-10-31 — Carried Items, board tokens, Portal pairs and gem rewards

- Apply Item bonuses only while carried; leaving capacity Items opens a saved excess-object choice instead of a generic blocked action.
- Overlay Hexlocks on fields, remove one automatically per round, and place Paralysis on the portrait.
- Rename Corridor Blocks; separate corner corridors and their map selection paths.
- Connect matching Portal pairs only, with paired-color pulses; pulse active heroes and usable carried Tools.
- Put Item actions on cards, remove Item cost panels, add White Mirror haiku and show full Black Mirror curse cards.
- Display all heroes' Fear/Courage beneath Rage and add the five-color Sigil hand action under Knowledge slot four.
- Award +3 for closing each small white gem and +5 for the central red gem, in addition to all neighbor bonuses.
- Update How to Play, migration safeguards and rule documentation. See DESIGNER_REVISIONS.md.
- Verified: 193 unit/component tests, all 27 browser tests, strict TypeScript and production build passed. Inspected desktop board and completed-gem screenshots.

## 2026-10-31 - Item v0.3 and direct map targeting

- Add all 25 revised Items with typed effects, stable IDs, local/carried access and persisted per-hero Tool usage by round.
- Add payment choices, Element substitution/contribution, capacities, movement, Courage modifiers, nine Tool actions and six Relic effects.
- Add real Permanent Sigil commitment and Amulet rewards, with an explicit notice that printed Spell casting remains unfinished.
- Preserve the 15 old Spell prerequisite links by IT ID; document new names and review decisions in ITEM_IMPLEMENTATION.md.
- Add configurable source Companion conflicts and Locket suppression without changing normal Stray transfers or curse abandonment.
- Replace duplicate room/corridor target lists with map selection; add seven engraved thematic curse-token motifs.
- Validation: 170 unit/component tests, the complete 24-test browser suite, focused Item/Black Mirror/landing rechecks, strict TypeScript and the production build passed.


## 2026-10-29 - Restore public Black Mirror inspection

- Latest explicit designer clarification overrides the v0.4 hidden-card instruction.
- Discovered Black Mirrors again open their oval card faces from carried, loose and installed icons, and in the Place chooser. All players can inspect public room cards from anywhere.
- Reading a card has no game-state effect; legal Collide remains the only curse activation.


## 2026-10-29 - Black Mirror v0.4

- Overlay the 35 reviewed Black Mirror definitions by stable ID while retaining the original 155-card source catalog.
- Resolve all immediate and deferred curses through typed commands, persisted choices and exactly-once collision rewards.
- Add Paralysis, capacity/Knowledge Hexlocks, Fear objectives, permanent safe Thresholds, scoped Sigil Seals, Darkness payments and Portal travel.
- Add LOYAL/STRAY follower behavior, curse abandonment/recruitment and consistent bound-Sigil/Seal handling.
- Hide Black identity until Collide; add curse target maps, recovery choices, token counters, room markers and sealed-action references.
- Preserve existing arrival Rage tiers, cumulative Kaleidoscope bonuses, shared-room learning, inventory and hot-seat saves.
- Document provisional A-N policies and the remaining Spell casting boundary in BLACK_MIRROR_IMPLEMENTATION.md.


## 2026-10-28 - Cleaner castle rooms

- Removed printed room IDs and restoration check marks from map tiles. Restored rooms now have black floors, with a matching inspector marker and map legend. Figurines, leftover objects and selection borders remain visible; internal room IDs still support navigation and saved games.

## 2026-10-28 - Mirror welcome, catalog and player guidance

- Redesigned the opening page around paired White/Black Mirrors and removed the seed field; new games still shuffle freshly. The original 155-card catalog now has illustrated card tiles, family tabs, search, keyboard navigation and a return-to-collection action.
- Expanded How to Play into nine sections covering turns, inventory, placement, Rage, collisions, cumulative mosaic rewards, Knowledge, learning, survival, saves and current playtest limits.
- Take controls share the domain transfer preview and disable when carrying limits prevent collection, including local capacity bonuses. Kaleidoscope keyboard focus follows the pentagon instead of drawing a square.
- Spell learning costs appear at the card's upper-left; learned cards no longer contain a Leave action. Board slots retain their leave arrow and display each catalog casting mode's Sigil requirements as guidance; casting remains unimplemented.

## 2026-10-28 - Confirmed Rage-based arrival

- Arrival now costs 1/2/3/4/5 Courage at Rage 0-6/7-13/14-20/21-27/28+, equally for all Sigil colors and every living hero in the room. This supersedes the temporary flat penalty below.
- Preview and engine share the calculation. Existing saves adopt these tiers for future arrivals. Regression checks cover every tier boundary, all colors, multiple present heroes and unaffected distant heroes.

## 2026-10-28 - Occuldor arrival loss

- Confirmed exactly 1 Courage lost by every living hero in the room when Place brings Occuldor onto the new Black Mirror. Replaced provisional color/Rage scaling; distant heroes and Rage remain unchanged.
- Placement preview and log show the same loss. Legacy saves adopt the fixed rule for future arrivals; past Courage values are retained. Tests cover all colors, early/late Rage levels, multiple present heroes, a distant hero, and resumed saves.

## 2026-10-28 - Actions below objects

- Moved circular take, leave and Learn controls from the upper-right corner to centered below their object icons. Spell slots reserve space for the lower action button.
- Reduced these circular controls to 18px with 12px symbols.

## 2026-10-28 - Object corner controls

- Removed the duplicate Carried objects section. Mirrors, Elements, Equipment/Tools, Relics and learned Spells now have small circular leave arrows at the upper-right of their character-board icons.
- Room object icons use matching take arrows; Spells retain Learn controls and their learning requirements. Inspection remains a separate click on the object, with accessible labels and keyboard focus for each control.

## 2026-10-28 - Fresh shuffles for new expeditions

- Fixed the repeated default card order: setup previously reused the fixed `drunken-pony` seed on every new game. A blank optional seed now generates a fresh browser-random seed on each start; all six card families and room allocations use the existing seeded shuffles.
- Entering a seed still reproduces the exact setup. Saved games retain their existing deck order. Browser regression coverage checks different default orders, unchanged card contents, and exact replay with an explicit seed.

## 2026-10-28 - Cumulative adjacency bonuses

- Every shared-edge neighbor now contributes to a new fragment: +1 matching color, +2 different color, plus one base Courage. Multiple neighbors of the same color each count.
- Removed neighbor selection; the preview lists and highlights every contributing fragment. Command validation and scoring use the same cumulative rule; placement legality and Courage cap remain unchanged.


- Unlocked Spell Knowledge spaces now have a lighter background and no open-lock icon; locked slots retain their lock marker.

## 2026-10-28 - Connected Kaleidoscope placement

- Removed the visible zoom label from the center of the castle; click/keyboard zoom remains available.
- Confirmed rule update: only the first fragment starts freely on the outer edge. Every later piece must touch existing glass along a shared edge, including outer-edge positions. Engine validation, highlights and instructions use the same rule.
- Preserved existing saved fragments; future placement uses adjacency. Tests cover disconnected edge rejection, all 35 cells reachable from every starting edge, command atomicity and resumed browser placement.


## 2026-10-28 - Larger table and automatic Spell learning

- Place requires both accessible mirror colors. End Turn moved to the character board; collected Sigils now sit above Knowledge slots, with lock/unlock status icons and blank empty spell spaces.
- Learn book icons on Spell cards/tokens replace take arrows. The engine validates requirements, pays exact local/carried Elements and assigns the first free unlocked slot automatically. Removed the payment/slot selection form.
- Enlarged the map by removing the right sidebar. Room inspector is above the map; Occuldor and chronicle are below. Retired mirror-ritual and Kaleidoscope banners; Hall-center zoom and final Confront remain available.
- Room selection/focus uses the rotated room border, avoiding an unrotated browser outline.


## 2026-10-28 - Companion miniatures

- All ten catalog Companions have pale SVG figurines: dog, cat, raven, rat, distinct ghost twins and maternal spirit, snake, rabbit and carnivorous plant.
- Discovery immediately places the Companion beside its holder on the castle map. Ownership determines its location through movement, turn changes and saved-game resume. Miniature bases use the holder's color; room orientation stays inward and crowded rooms use additional rows.
- The character-board Companion figurine remains clickable to inspect the original card. All Companions follow for this playtest, including printed residents/wanderers; special behaviors and conflicts remain inactive, as requested.
- Validation: 61 unit/component tests, 9 browser tests and typecheck passed; browser coverage verifies Rex's discovery, following, holder association, card inspection and resume.

## 2026-10-28 - Contextual mirror action and room markers

- One character-board button: Place before/after movement, glowing Collide for unguarded pairs; restored rooms cannot receive another pair.
- Collide immediately awards one Sigil and Rage, removes the pair and room Sigil, shows a skippable penalty popup, then opens legal Kaleidoscope pentagons. Manual controls removed; existing automatic Courage penalties remain optional.
- Small public object icons along room bottoms; Mirrors, Sigils and figurines rotate with each castle wing toward the center. Overflow count retains readable spacing.
- Saved pending collisions migrate safely; default per-turn pair/flip cap removed.
- Validation: 61 engine/component tests, 9 browser tests, strict TypeScript check and production build pass. Browser tests cover popup save/resume without duplicate rewards, room icon updates/orientation and empty-room Place availability.

## 2026-10-27 — Placement versus Collide, mirror markers and castle figurines

- Corrected action names throughout UI and domain commands: `PLACE_MIRRORS` selects and installs White + Black, activates every discovery, and brings Occuldor onto Black. `COLLIDE` flips the unblocked placed Black Mirror and resolves the acting hero's curse, Sigil award and Kaleidoscope placement.
- Removed Empty symbols from White card faces while preserving all original catalog patterns and supply counts.
- Added physical white/black oval markers in paired rooms. Occuldor's dark violet wizard miniature stands over the Black Mirror; markers disappear after collision. Human hero miniatures show the first letter of each name.
- Restyled the unchanged five-wing/35-room graph as a stone castle with fortifications, towers, moat, gatehouse and enclosed corridors. No new playable connections were added.
- Existing saved state remains compatible; turn flags and installed pairs are unchanged. Updated browser coverage follows placement, guard relocation, collision and marker removal.

## 2026-10-27 — Oval cards, supplied icons, hero collections and Spell learning

- Restored icon-only Mirrors on the table. Clicking opens oval White/Black card faces; Black cards have no discovery sockets. Other families use portrait board-game layouts.
- Bundled the designer's Element, family/subtype and Sigil artwork as local SVG-viewed PNG atlases.
- Newly discovered Companions automatically join their discoverer. Added player-board Sigil, Companion and private Secret icons; Secret text is mounted only when inspected by its owner.
- Kept player-chosen edge/adjacent Kaleidoscope placement, replaced placed glyphs with supplied Sigil artwork, and removed Sigil display from restored rooms.
- Knowledge achievements now default to independent 1 / 3 different / 3 same / 5 different conditions, retaining irreversible unlocks. Legacy saves migrate to this interpretation.
- Implemented learning for all 35 catalog Spells: exact local/carried Element payments, Tool access, free unlocked slot selection, spent-token conservation, equipped-slot persistence and leaving a Spell. Casting and Companion abilities remain unfinished.
- Added domain coverage for payments, ownership, save migration and unlock conditions, plus browser workflows for collections, learning, privacy, placement and resume.

## 2026-10-27 — Public Mirrors and explicit Collide selection

- Applied the latest designer clarification over the earlier concealed Black Mirror rule: drawn Mirrors show their printed names and effects in hands and rooms, including paired cards.
- Added Collide beside the character's Mirror slots, with an accessible chooser for the exact White and Black from hand and/or current room. Selection is required; cancellation is harmless.
- Added atomic domain validation of both physical IDs before using either card. Only the selected White's discoveries activate; the selected Black's curse still resolves on a later legal flip.
- Kept explored room objects publicly inspectable by every hero, while transfers and actions require physical presence. Private Secrets remain private.
- Added coverage for both hand, both room, mixed sources, rejected inaccessible cards, cancellation, and public room inspection. Verified 47 unit/interaction tests, eight browser workflows, TypeScript, and a production build.

## 2026-10-27 — Designer's board layouts and icon inspection

- Replaced circular rings with the supplied five-wing, 35-square-room layout and matching corridors/doorways.
- Replaced the rectangular puzzle with 35 traced pentagons and an inert gray centerpiece; updated and tested actual shared-edge adjacency.
- Added clickable SVG inventory icons, Element learning icons, and concealed Black Mirror inspection.
- The Hall's center opens a zoomable puzzle dialog; pending fragments open it automatically. Closing preserves placement state and returns keyboard focus.
- Moved rituals below the castle, fixed phone-width overflow, and added desktop/mobile browser coverage.

## 2026-10-25 — Initial implementation

- Read the source brief, catalog, DOCX rulebook, PDF anatomy guide, and board/iconography sketches. Retained the brief's precedence over obsolete sample rules.
- Phase 1 foundation: Next.js, strict TypeScript, Tailwind, Zustand, original catalog validation, lobby, character board and interactive circular 35-room castle.
- Phase 2 core: seeded physical setup, mandatory movement, destination-only discovery, take/leave, local capacity handling, hot-seat privacy, event log and save/load.
- Phase 3 core playtest: mirror installation, full White discovery, Occuldor guard relocation and local revenge, personal curses (three automatic; 32 manual), collisions, Sigils, Knowledge achievements, spatial placement, death, final Confront and endgame.
- Added Vitest engine tests, React interaction tests and Playwright browser workflows; verified production builds.
- Phase 4 and remaining Phase 5 work explicitly recorded as unfinished. No invented replacement catalog or silent spell/companion ability buttons.


## Spell activation and interface revision (2026-11-07)

Implemented common Spell activation, exact physical Sigils, Quick return, permanent effects/suppression/discard, 25 executable configurations, explicit unsupported reasons, card sockets and usage markers. Applied designer feedback: remove text Sigil storage, player-colored completed gems, paired Portal highlights, Secret pulse, Fear-tier bars and movement, prominent winner/results dialog.


## Spell catalog v0.4 (2026-11-08)

Replaced all 35 Spell definitions with v0.4 and implemented all 70 effects, including remote mirrors, movement, immunities, Tool reuse, Portal supply, fragment relocation and consent-based teleportation. Preserved original Companion discoverer separately from current ownership. Moved execution controls outside Spell cards while retaining clickable Sigils directly on each card. Obsolete Tool learning remains blocked.

## Companion relationships and card presentation

- Apply the approved exclusive fear/predation matrix and startup validation.
- Add ten distinct gothic Companion portraits.
- Position Spell resolution beside the card on desktop, preserving clickable sockets.
- Add exact relationship and encounter regressions plus browser layout checks.
