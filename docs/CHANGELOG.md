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

## 2026-11-07 â€” Discovery captions and curse footer

- Keep discovery names beneath White Mirror icons alongside each card's individual haiku.
- Give the curse popup a separate stationary action footer and scrollable card area so Resolve curse never overlays the Black Mirror.

## 2026-10-31 â€” Individual White Mirror poems and action icons

- Give WM-01 through WM-35 distinct original three-line haiku, displayed consistently in the catalog and all card inspectors.
- Replace the character board's Place/Collide text with paired-mirror and shattering-mirror icons. Preserve accessible action names, explanatory tooltips, legal-action checks and the Collide glow.

## 2026-10-31 â€” Carried Items, board tokens, Portal pairs and gem rewards

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

## 2026-10-27 â€” Placement versus Collide, mirror markers and castle figurines

- Corrected action names throughout UI and domain commands: `PLACE_MIRRORS` selects and installs White + Black, activates every discovery, and brings Occuldor onto Black. `COLLIDE` flips the unblocked placed Black Mirror and resolves the acting hero's curse, Sigil award and Kaleidoscope placement.
- Removed Empty symbols from White card faces while preserving all original catalog patterns and supply counts.
- Added physical white/black oval markers in paired rooms. Occuldor's dark violet wizard miniature stands over the Black Mirror; markers disappear after collision. Human hero miniatures show the first letter of each name.
- Restyled the unchanged five-wing/35-room graph as a stone castle with fortifications, towers, moat, gatehouse and enclosed corridors. No new playable connections were added.
- Existing saved state remains compatible; turn flags and installed pairs are unchanged. Updated browser coverage follows placement, guard relocation, collision and marker removal.

## 2026-10-27 â€” Oval cards, supplied icons, hero collections and Spell learning

- Restored icon-only Mirrors on the table. Clicking opens oval White/Black card faces; Black cards have no discovery sockets. Other families use portrait board-game layouts.
- Bundled the designer's Element, family/subtype and Sigil artwork as local SVG-viewed PNG atlases.
- Newly discovered Companions automatically join their discoverer. Added player-board Sigil, Companion and private Secret icons; Secret text is mounted only when inspected by its owner.
- Kept player-chosen edge/adjacent Kaleidoscope placement, replaced placed glyphs with supplied Sigil artwork, and removed Sigil display from restored rooms.
- Knowledge achievements now default to independent 1 / 3 different / 3 same / 5 different conditions, retaining irreversible unlocks. Legacy saves migrate to this interpretation.
- Implemented learning for all 35 catalog Spells: exact local/carried Element payments, Tool access, free unlocked slot selection, spent-token conservation, equipped-slot persistence and leaving a Spell. Casting and Companion abilities remain unfinished.
- Added domain coverage for payments, ownership, save migration and unlock conditions, plus browser workflows for collections, learning, privacy, placement and resume.

## 2026-10-27 â€” Public Mirrors and explicit Collide selection

- Applied the latest designer clarification over the earlier concealed Black Mirror rule: drawn Mirrors show their printed names and effects in hands and rooms, including paired cards.
- Added Collide beside the character's Mirror slots, with an accessible chooser for the exact White and Black from hand and/or current room. Selection is required; cancellation is harmless.
- Added atomic domain validation of both physical IDs before using either card. Only the selected White's discoveries activate; the selected Black's curse still resolves on a later legal flip.
- Kept explored room objects publicly inspectable by every hero, while transfers and actions require physical presence. Private Secrets remain private.
- Added coverage for both hand, both room, mixed sources, rejected inaccessible cards, cancellation, and public room inspection. Verified 47 unit/interaction tests, eight browser workflows, TypeScript, and a production build.

## 2026-10-27 â€” Designer's board layouts and icon inspection

- Replaced circular rings with the supplied five-wing, 35-square-room layout and matching corridors/doorways.
- Replaced the rectangular puzzle with 35 traced pentagons and an inert gray centerpiece; updated and tested actual shared-edge adjacency.
- Added clickable SVG inventory icons, Element learning icons, and concealed Black Mirror inspection.
- The Hall's center opens a zoomable puzzle dialog; pending fragments open it automatically. Closing preserves placement state and returns keyboard focus.
- Moved rituals below the castle, fixed phone-width overflow, and added desktop/mobile browser coverage.

## 2026-10-25 â€” Initial implementation

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

## Item card artwork

- Add distinct gothic portraits for all 25 Items, mapped by stable ID from a locally bundled atlas.
- Preserve existing Item mechanics and inventory icons.
- Verify every card's illustration in the browser.

## Spell card artwork

- Add distinct gothic magical scenes for all 35 Spells using a local atlas mapped by stable card ID.
- Preserve learning costs, clickable Sigils and external activation controls.
- Add browser coverage for all Spell illustration positions.

## Secret and Mirror artwork

- Add 15 distinct Secret achievement illustrations.
- Use one shared light-and-shadow illustration across White and Black Mirrors, preserving oval layouts and rules.

- Mirror artwork correction: separate luminous White and shadowy Black portraits, with the mirrors upright rather than horizontal.
## Consistent card formats and frames

- Both Mirror families use a 360 x 760 desktop format; Items, Spells, Companions and Secrets use 360 x 700. Width contracts on narrow screens; heights stay fixed within each group.
- Unified dark layered frames and readable ivory text, with silver White Mirrors, amethyst Black Mirrors, amber Items, blue Spells, green Companions and rose Secrets.
- Artwork files are unchanged. Long rules scroll inside a keyboard-focusable region, preserving all descriptions and interactive controls without stretching the card.
- Verified every one of the 155 cards for exact desktop dimensions and overflow, all six families on mobile, existing gameplay interactions, 395 unit/component tests and production build.

## Parchment frame refinement

- Restore the earlier warm parchment and dark ink presentation, with antique metal borders and engraved corner flourishes.
- Preserve the six approved type colors, fixed card dimensions, all existing artwork and scrollable rules.
- Browser validation covers every card dimension, mobile layouts and clickable Spell activation.

## Standard card proportions

- Shorten all card faces to the standard 63:88 aspect ratio (360 x approximately 503 pixels on desktop), retaining oval Mirrors and rectangular other cards.
- Scale artwork windows and spacing to fit while preserving artwork files, parchment frames and type colors. Longer rules remain scrollable and keyboard accessible.

## Cards without internal scrolling

- Keep the 63:88 parchment card faces and artwork, removing internal scrollbars.
- Put full Spell effects and assignment explanations beside the card; keep Quick/Permanent Sigil sockets directly on the card in two columns.
- Put inactive proposed Companion abilities and Secret progress/reveal details in an adjacent reference panel. Companion relationships, Item abilities and buttons, Mirror discoveries and curses remain on the card.
- Stack reference panels below cards on narrow screens. No rules text is truncated or discarded.
- Verify all 155 catalog card faces fit without overflow, six representative mobile faces, and gameplay interactions.

## Catalog preview navigation

- Add Previous/Next arrows and position count to card previews, following the selected family and search results.
- Support Left/Right keyboard arrows, disabled list boundaries, and preserved filters when returning to the collection.
- Keep navigation within the public catalog; gameplay inspectors are unchanged.

## Full printed text and illustrated Mirror cards

- Remove repeated footer IDs/names and return full Spell/Companion rules to their cards.
- Put Spell costs beside titles, give Spells a taller format, enlarge Item/Secret artwork, and move Item timing to the bottom.
- Render Mirror contents on transparent illustrated frames.
- Add six fantasy backs to catalog thumbnails and a View back/front preview control.
- Keep card faces free of internal scrollbars; preserve the rules engine.

## Gothic card refinement ï¿½ 2026-11-15

- Centered Black Mirror curse copy within the glass without changing White Mirror fronts.
- Replaced ornate reverse artwork with restrained, dark gothic SVG designs; Mirror reverses have oval silhouettes.
- Spell faces use rolled parchment edges, centered learning Elements within the title's cost area, and retain full printed casting rules.
- Companion relationship rows use distinct icons alongside readable Dread, Hunt, Predator, and Prey labels.
- Validation: all 155 faces passed desktop fit checks and representative mobile checks; three spell/gameplay checks, back navigation and Companion browser checks passed (7 total). Production build passed.

## Dark gothic finish ï¿½ 2026-11-15
- Lowered Black Mirror text by 18px on desktop and 14px on narrow screens.
- Added dark textured card surfaces, warm ivory lettering, subdued metallic borders, and dark rolled Spell parchment; retained existing illustrations and family colors.
- Refined six gothic reverses with velvet grain, beveled metal, cathedral arches, and distinct family emblems. Mirror backs remain oval.
- Validation: all 155 card faces and representative mobile layouts passed fitting checks; six-family back preview/navigation passed.

## Light family-tinted fronts ï¿½ 2026-11-15
- Replaced midnight front surfaces with light parchment and subtle card-family color washes: amber Items, blue Spells, green Companions, and rose Secrets.
- Restored dark readable lettering and softened engraved details and shadows. Spell scrolls use pale parchment rolls with muted blue accents.
- Kept existing illustrations, Mirror glass, card sizes, and dark card backs.

## Mirror landing page ï¿½ 2026-11-15
- Introduced the game using the same White and Black Mirror frame artwork as the cards, a prominent The Mirrors title, and a short Drunken Pony / Occuldor story.
- Renamed Browse to Catalog and moved it beside How to play in the top navigation.
- Updated browser selectors for the new label. Landing, mobile overflow, rules, and catalog navigation checks passed (2 browser tests).

## Current hero movement badge ï¿½ 2026-11-15
- Added +X and a footsteps icon beside the active hero's name in the turn banner, character board, and party tracker.
- Uses the engine movement allowance including active bonuses; immobilized or fallen heroes show zero. This is the turn allowance, not a decrementing steps counter.
- Validation: TypeScript and all six exploration/spell interaction browser checks passed.

## Confirmed Gem storage and simultaneous Spell modes ï¿½ 2026-11-15
- Collected Diamond Gems cannot be voluntarily left in rooms. The command validator rejects LEAVE and the player UI no longer offers it.
- A hero can store all ten physical Gems; multiple legal gap installations are allowed during the same turn, each consuming a distinct Gem and granting its own reward.
- Permanent binding does not prevent Quick activation on the same Spell. Quick still pays separate available Sigils and obeys its per-turn limit, seals, and target conditions.
- Older saved storage capacity and exclusive-mode settings normalize to these confirmed rules. Existing room Gems remain recoverable; fallen heroes still drop Gems under the existing recovery policy.
- Validation: 398 unit/component tests, TypeScript, and five Gem/Spell browser checks passed.

## BM-34 matching Portal pair — 2026-11-15
- Occuldor's Invitation now places a matched Portal pair: the acting hero's room and one other chosen Portal-free room, explored or unexplored, excluding the Hall.
- Destination selection uses the existing room-map choice flow and survives save/load. Neither Portal is placed before the choice; hidden destinations stay unexplored.
- Occuldor is then summoned; only the acting hero suffers the existing Rage-based arrival consequence once.
- Provisional unavailable-pair fallback: if the current room already has a Portal, fewer than two tokens remain, or no destination exists, skip the entire pair and still summon Occuldor. Existing pairs are preserved.
- Unit validation: all 402 tests pass, including paired travel, saved choice, shortage, and existing-pair preservation.

## 2026-11-16 — Card rules and presentation revisions

Implemented the latest Mirror, Item, Spell and Companion changes, including exact paid-slot Hexlocks, SP-16 binding returns and discounts, SP-32 paired Portals, and interactive Companion powers. Added individual White Mirror titles and revised Spell faces. Owner Permanent effects remain active across turns when triggered. See [complete checklist](CARD_REVISIONS_2026_11_16.md).

## 2026-11-16 — More compact Spell cards

Reduced Spell faces and backs from the 360:570 format to 360:530. Reduced illustration height slightly while preserving rules text size, clickable Sigils and the external action panel. All 155 card faces pass overflow checks, representative mobile cards fit, and the three card-revision interaction scenarios pass (4 browser tests total).

## 2026-11-16 — Character board layout

Moved the active hero's Fear tier and Courage value/meter directly beneath their name. Moved Followers and private Secrets into a separate panel below the character board. Removed the Relic capacity and redundant Courage/movement explanation. TypeScript and seven inventory, Companion and responsive browser scenarios pass.

## 2026-11-16 — Player-colored Kaleidoscope tiles

Added persistent ownership per pentagonal tile, player-color backgrounds beneath unchanged Sigil icons, an ownership legend, and +1 Courage per same-owner edge neighbor on placement. The preview and engine share the scoring calculation. Updated rules, validation, legacy-save handling and SP-28 relocation. Verified 423 unit/component tests and eight browser scenarios, including scoring, color rendering, saves and normal collision completion.

## 2026-11-16 — Recoverable discards and turn-based pickup blocking

Replaced Item discard removal with physical room drops, including Elements, Items, Spells, Secrets and Sigils. Added persistent pickup restrictions through the current turn across inventory transfer, learning, recruitment and Spell exchanges. Preserved physical Sigil identities, room Secret supply validation and explicit removal/consumption semantics. Updated controls, printed Item wording and tutorial. Verification: 425 unit/component tests and 19 browser scenarios passed.

## 2026-11-16 — Discard terminology clarification

Restored IT-15 Sigil Sacrifice's permanent removal and changed its printed cost/effect to Remove. Ordinary discard remains a room drop blocked from pickup until next turn; remove/permanently discard remain unrecoverable. Updated regressions for direct use and SP-24 Tool activation.

## 2026-11-16 — Release validation

Verified the accumulated card art/presentation, gameplay revisions, player board layout, Kaleidoscope ownership scoring and corrected discard/removal semantics: 425 unit/component tests, all 51 browser tests, and production build passed. The build passed on retry after Next.js displayed a security-upgrade advisory for the installed version; a dependency upgrade remains outstanding.

## 2026-11-16 — Complete Companion special abilities

Added Poe's private pre-movement scouting, map selection, per-hero remembered Sigil colors, saved use limit and hidden handoff. Added Julia's local Earth/Water learning discount, validated payment, minimum-one requirement, provisional configurable refresh, and non-stacking Grimoire precedence. Passive Companion inspectors now show their availability. Audited all ten current abilities and updated the tutorial and implementation matrix. Verified 430 unit/component tests, 11 browser tests and production build (passed on retry after the previously reported Next.js security-upgrade advisory).

## 2026-11-17 — Gothic ambience and game sound effects

Added an original procedural Web Audio score with organ-like drones, distant bells, wind and hall reverb, plus footsteps, spectral laughter on Occuldor arrival, breaking glass, discovery, object handling, magic and endgame cues. Sound is opt-in through the lower-right control, with separate persistent music/effects levels and master mute. Audio pauses on hidden tabs and privacy handoff; rejected commands and resumed saves do not replay events. See AUDIO.md.

Validation: 435 unit/component tests, audio and responsive landing browser tests, and standalone TypeScript passed. Production compilation, TypeScript and static-page generation succeeded, but the build command exited with the existing Next.js security-upgrade advisory on both attempts; dependency remediation remains outstanding.

## Recorded gothic music replacement

Replaced the synthesized background score with locally bundled Ghost Processional and Darkest Child by Kevin MacLeod, licensed CC BY 4.0. Added a persistent track selector and visible attribution/source/license links. Music loops and pauses with mute, privacy handoff and tab visibility; existing game effects retain a separate volume control. Full attribution and original download URLs are in public/audio/CREDITS.md.

Validation: 435 unit/component tests, TypeScript and the recorded-audio browser test pass. Browser verification covers decoded playback of both MP3s, track changes, preferences, mute and effects. Production compilation and page generation complete, but the build exits with the existing Next.js SecurityFatalError dependency advisory.

Music now continues uninterrupted across turn changes and the privacy handoff screen. Verified actual playback advances after End Turn in the browser audio test.

## Downloaded game sound effects

Replaced synthesized effects with 22 downloaded CC0 audio files: performed evil laughter, glass breaking, three stone footsteps, animal/fantasy companion cues, parchment, book learning, magic, gem placement and object/endgame cues. Added companion-discovery detection without replay on transfer, a generic Secret cue that does not identify the private card, per-effect volume balancing and caching. Sound settings now offer a preview selector and source credits. Music still continues through turns.

Validation: 437 unit/component tests and two browser audio tests pass, including decoding every downloaded effect and checking non-silent audio. Source attribution and original filenames are retained in public/audio/sfx/CREDITS.md.
