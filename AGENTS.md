# THE MIRRORS — CODEX IMPLEMENTATION BRIEF

**Role:** You are a senior game developer, systems designer, TypeScript architect, UI/UX designer, and test engineer. Build a playable, locally runnable, browser-based adaptation of my original tabletop game **The Mirrors**. Use the existing project folder and the supplied assets/catalog. This is not just a card gallery: deliver a real, interactive, rules-driven game playable from setup through victory/defeat. Work incrementally and keep the project runnable at each phase.

**My intent:** Preserve my board game's identity and mechanics. Do not redesign it into a conventional RPG, deckbuilder, hex-crawl, dice movement game, or automated battler. Implement the agreed rules and clearly isolate unknown rules behind configurable playtest defaults. Don't invent permanent rules or silently ignore card effects. If uncertain, record the question in `docs/OPEN_DESIGN_DECISIONS.md`, implement the simplest explicitly labeled provisional behavior, and continue.

## 0. Source material and priorities

The repository may contain these source files (look under `reference/`):
- `The_Mirrors_Conceptual_Card_Catalog_v0.2.json` — **primary source** for all 155 conceptual cards, with IDs, names, learning costs, types, and proposed effects. Load and validate it; do not replace it with fabricated generic cards.
- `The_Mirrors_Development_Rulebook_v0.1.docx` — original rulebook draft, useful background; some rules have been revised since this document.
- `The_Mirrors_Card_Anatomy_Specification_v1.pdf` — card structure and information architecture.
- `castle_map.JPG`, `mirror_puzzle.JPG`, `fearTrack.jpg` — original designer's physical board and tracker concept sketches.
- `the_mirrors_arcane_iconography_guide.png`, `the_mirrors_six_gothic_game_cards.png` — **visual inspiration only**, not reliable final rules text. The sample White Mirror card in this image has an obsolete “choose 1” statement. The real rule is **reveal all discoveries**.

Precedence when sources disagree:
1. The explicit **CONFIRMED RULES** below (newest decisions).
2. Source catalog for individual proposed card concepts and mathematical counts.
3. Previous rulebook for background and unresolved areas.
4. Marked PROVISIONAL defaults in this brief.

Create `docs/RULES_STATUS.md` distinguishing `CONFIRMED`, `PROVISIONAL`, and `NOT IMPLEMENTED`, updated throughout development.

## 1. Game pitch / setting

2–5 adventurers are drinking green beer at the **Drunken Pony** when they dare one another to enter a cursed abandoned manor, **The Mirror Castle**. The castle belonged to the evil mirror wizard **Occuldor**, master of illusions, reflection, vision and manipulation. Local witches imprisoned him beneath a great kaleidoscopic mirror in the central Hall. The heroes accidentally break that prison and release him. The witches concealed White Mirrors and Occuldor concealed Black Mirrors throughout the castle. When an installed White Mirror and Black Mirror collide, they annihilate, produce a **colored Mirror Sigil**, and automatically restore one colored fragment to the central Kaleidoscope. The heroes must restore all 35 fragments to trap Occuldor again.

This is **competitive cooperation**: all heroes must defeat Occuldor, but the most heroic surviving player wins personally when the prison is restored. If every hero dies first, Occuldor wins.

Tone: gothic, mysterious, slightly playful dark fantasy, magical stained-glass and candlelit manor. High readability over decorative excess.

## 2. Exact game component economy (confirmed unless noted)

- 35 rooms around a central **Mirror Hall**. Rooms begin face-down/unexplored. Keep a recognizable circular mansion aesthetic; use the source `castle_map.JPG` as a layout reference.
- 35 Kaleidoscope fragments / colored mirror pieces, **7 of each of 5 bright stained-glass colors**: `Scarlet`, `Emerald`, `Amber`, `Fuchsia`, `Amethyst` (names are working labels). Every fragment is randomly preassigned to one room before setup and its color is publicly revealed when that room is explored.
- 35 physical collectible Mirror Sigils, 7 of each color; each color must also have a unique, visually recognizable glyph. A Sigil obtained from a collision matches the color of the restored fragment.
- **35 Black Mirrors** and **35 White Mirrors**, distributed across room findings.
- 70 physical Element tokens, precisely **14 Air, 14 Earth, 14 Fire, 14 Water, 14 Aether**.
- Proposed card catalog includes exactly: 35 White Mirrors, 35 Black Mirrors, 25 Items (**10 Equipment, 9 Tools, 6 Relics**), 35 Spells (**16 Basic, 11 Intermediate, 8 Advanced**), 10 Companions, 15 Secrets = **155 cards**. Card effects are proposals awaiting balance, but use them as first-pass content.
- Original 35 room-finding patterns: generate ALL 35 multisets of 4 objects chosen with repetition from **Black Mirror, White Mirror, Element Slot A, Element Slot B** (`C(7,4)=35`). Shuffle the 35 patterns across rooms, producing exactly **35 Black Mirror occurrences, 35 White Mirror occurrences, and 70 Element occurrences**. For the 70 Element occurrences, randomly draw exact token types from the shuffled pool (14 each).
- White Mirror cards have **3 discovery slots each**. Valid symbols: Spell, Item, Companion, Secret, Empty. The primary card catalog defines 35 exact patterns producing **35 Spells, 25 Items, 10 Companions, 15 Secrets, 20 Empty slots**. No triple-identical-slot cards; at most one Companion per White Mirror. Treat catalog as source of truth and assert these counts at startup/tests.
- Every nonempty White Mirror slot reveals its corresponding card immediately on activation. **All shown discoveries appear**. Items, Spells, and Companions are placed in the room; Secrets go privately/directly to the White Mirror's discoverer. White Mirrors have NO additional abilities.

## 3. Character board and inventory

Each hero has a visible **character board** arranged around their portrait:
- LEFT: 2 carrying slots for any Black or White Mirrors (combined capacity 2).
- TOP: 3 carried Element slots (any mix of Element types).
- RIGHT: 2 slots shared by Equipment and Tools.
- ON CHARACTER: 1 Relic slot (rings, pendants, amulets; separate from Equipment/Tools).
- BOTTOM: 4 Spell Knowledge slots, **all initially locked**.
- No generic hard cap for Secrets; they are private.
- Companions generally do not take regular inventory capacity, although some individual card rules can require an object slot or impose restrictions.
- Equipment can expand capacities, including Element capacity needed for advanced Spells.

**Critical CONFIRMED shared-room rule:** When a hero is physically IN a room, **everything in that room can be combined and used as if it were in the hero's personal inventory**, even if they cannot physically carry it. This includes Items, Tools, Equipment, Relics, Mirrors, and available resources; Spell usage still requires its learning/activation conditions. Local Item abilities work while the hero is in that room. The hero must obey carrying limits when departing; an Item left behind cannot extend the hero's capacity after departing. Items remain in rooms for future heroes, and there must be UI to inspect, collect, leave, exchange, and use them. Do not auto-collect all discoveries.

The first hero to find Secrets receives those Secrets privately, not as shared room inventory.

### Knowledge slot unlocking (confirmed)

All four slots start locked. Unlocks are achievements, checked **immediately when collecting Sigils** and retained permanently thereafter:
1. Slot 1: collect at least 1 Sigil.
2. Slot 2: collect 3 **different** Sigil colors.
3. Slot 3: collect 3 Sigils of the **same** color.
4. Slot 4: collect all **5 different** Sigil colors.

A Sigil committed to a Permanent Spell does not count as currently available for future knowledge conditions. However, **a previously unlocked slot NEVER relocks** if Sigils become bound or lost. Track irreversible unlock markers explicitly, not a live recalculation of inventory. Unlock order was described as 1→2→3→4; for the MVP use ordered progression, record achievement candidates as events, and keep this interpretation configurable/documented so timing can be revisited.

A player cannot equip more learned Spells than unlocked slots. Spells can be left in or exchanged with room Spells. Permanent Sigils **stay attached** to their Spell while it remains equipped; they cannot be freely recovered/rearranged to bypass the permanent commitment. Handling permanently bound Sigils when a Spell is abandoned is unresolved: implement a **configurable default** of moving them to an inaccessible spent/removed pool, not leaving collectible Sigils in the room; log this as PROVISIONAL and isolate it behind a rule option.

## 4. Spells, Elements, Tools and Sigil assignment

A Spell card has: ID, name, school, Basic/Intermediate/Advanced tier, exact learning Element requirements, optional required Tool, and one or more casting configurations.
- Learning consumes the exact listed Elements present in carried + local room resources; a required Tool only needs to be **accessible**, not consumed (provisional; expose through rule config).
- Learning is limited by unlocked Knowledge slots.
- The 35 current Spell learning costs contain exactly **70 Element icons**, **14 of each** Element across the deck. Validate this against the imported catalog.
- Sigils are **strict-color-matched physical tokens**, never generic mana or wildcard resources unless a specific card says otherwise.
- Across all 35 Spells there are **more than 35 printed Sigil positions** (the current catalog contains **132**), creating a meaningful assignment decision.
- A Spell can offer alternative casting configurations, such as QUICK (temporary activation) and PERMANENT (ongoing ability); some configurations need several exact-color Sigils at the same time.
- Quick: place required matching, free/unbound Sigils, resolve effect, exhaust/lock their availability, then refresh at the start of owner's next turn (**PROVISIONAL refresh timing**).
- Permanent: bind exact required Sigils to the Spell and gain its continuous effect while that Spell remains equipped. These Sigils remain bound; no costless reassignment.
- Only one alternative casting configuration on a Spell may be active simultaneously unless card explicitly overrides (PROVISIONAL).
- Advanced Spells may also require a Tool from the Item deck. Tools also provide smaller utility actions.
- Define a typed, easily extensible `Effect` model and execution layer; do not attempt to derive complex effects by NLP-parsing English card text.

## 5. Board, navigation, exploration

Use a **fixed circular castle framework** for MVP, with 35 face-down room tiles, a central Hall, clear connected paths and a manually inspectable/authorable adjacency graph. This preserves the original map. Architecture must allow a future modular-map variant, but do not build procedural tile-placement first.

The user should be able to zoom/pan, click rooms, see corridors, view explored/unexplored state, and inspect a room detail side panel. Room tiles have stable IDs, coordinate locations, neighboring rooms, original findings, remaining objects, fragment color (hidden until explored), mirror installation/collision state, companions present, players present, and room effects.

- Exploration occurs when hero **ends mandatory movement** in an unexplored room. Reveal its preassigned fragment color and four starting findings; instantiate Black Mirror/White Mirror card objects and physical Element tokens from preallocated pools.
- Intermediate rooms a hero passes are NOT entered; do not trigger their discovery, companions, curses, or inventory access.
- Movement is **mandatory each hero turn** (unless a status explicitly immobilizes them). It is determined by the hero's Courage/Fear state, NOT by dice. There is no movement die.
- Player chooses a valid destination/path up to their movement allowance, possibly modified by Items, Companions and Spells. Exact tier distances are **NOT CONFIRMED**. Provisional adjustable mapping: Heroic=3, Confident=3, Calm=2, Anxious=1, Terrified=1. Player may choose to move fewer steps, but must move to a different room unless status/rules prevent it. Make movement rules data-driven.
- Player may combine, use, leave, swap, or take objects in the room. Mirror installation and flipping are OPTIONAL and may be attempted before OR after the mandatory move. Casting may occur before/after movement if timing permits. Exact mirror-action-per-turn limit is **unresolved**; set provisional `onePairPlacementAndOneFlipPerTurn=true` configurable.
- Show path preview and legal destinations; validate route legality in the domain layer, never only in UI.
- Multiple heroes may share a room. Distinguish public board information from private Secrets.

## 6. Mirror installation, Occuldor and collision (critical gameplay loop)

**A mirror installation needs one accessible White Mirror and one accessible Black Mirror in the current room (from carried + room objects).** The pair is installed in the current room, associated with that room's preassigned fragment. One successful fragment restoration per room. A previously restored room cannot produce another fragment or normal collision (confirmed intention); any secondary mirror mechanic is future design only.

When installing a pair:
1. Validate legal room, accessible mirrors and current status.
2. Consume/move both Mirror cards from portable/local inventory into this room's installed pair.
3. **Activate the White Mirror**, immediately revealing all three discovery slots; all indicated discoveries appear; Secrets go privately to the activating hero.
4. **Occuldor instantly travels** from the Hall or his prior Black Mirror to the new pair and **blocks the newly installed Black Mirror**. The previous guarded Black Mirror becomes unblocked.
5. Occuldor punishes **only heroes physically present in the room where he arrives**, not distant heroes. His arrival consequence depends on his current Rage stage and the color/glyph of the room's fragment. This is a separate consequence from the hidden Black Mirror curse. Implement a data-driven `revengeMatrix[color][rageTier]`; the exact penalties are PROVISIONAL content and must be easy to tune. Rage does **not** increase merely because he arrives.
6. Status effects (including possible paralysis or frightened companions) resolve through explicit events and choices.

When a hero flips an **UNBLOCKED installed Black Mirror** in the same room:
1. The Black Mirror card remains hidden until this moment, unless an Item/Spell specifically revealed it. Flip it for the acting hero (then public after reveal).
2. Resolve **only that hero's** individual curse using the card's Psychological/Material/Spatial/Supernatural/Castle-wide family and printed effects. No automatic Occuldor-arrival punishment at this time.
3. Complete the successful mirror collision: annihilate the White and Black cards, mark room fragment removed/restored, and give the hero exactly **one physical Sigil matching the fragment's color**.
4. Increase Occuldor Rage by **+1** for that collision.
5. Immediately place the fragment into the central Kaleidoscope using its spatial placement rules, and award Courage.
6. Recheck irreversible Knowledge unlocks immediately when the new Sigil is obtained.
7. Check victory, player survival, statuses, and log consequences.

**PROVISIONAL edge-case policy:** Once a legal flip begins, its fragment is restored even if the Black Mirror curse incapacitates, moves, or kills the hero. Isolate ordering/death/reward behavior in a configurable resolution service. Exact final-mirror Occuldor unblock method remains **UNRESOLVED**: implement a visible, playtest-only emergency `Confront/Dispel Occuldor` action that costs Courage and frees the final mirror; label explicitly as a provisional anti-soft-lock mechanic, and later make it replaceable by approved Spell/Item rules.

Rage starts at 0, increases exactly once per successful collision, and can reach 35 (which coincides with full restoration). Use approximately five editable stages: 0–6, 7–13, 14–20, 21–27, 28–35. Higher Rage increases arrival danger. Punishment categories/values are provisional; provide a JSON configuration file and debug adjustment controls.

## 7. Kaleidoscope placement and Courage (latest confirmed design)

This is an interactive centerpiece, not a static progress counter. It contains **35 color-neutral spatial positions**, not predetermined colored cells. Bright stained-glass fragments are placed in these positions when rooms are restored.

Each restored fragment must be positioned using one of these rules:
- It may occupy a valid cell on the **outer edge** of the Kaleidoscope; OR
- It may occupy an empty cell **edge-adjacent to an already placed fragment**.

A hero **chooses** the placement position among legal cells; show highlighted legal cells with adjacency preview. The board must always have a legal way to place all 35 fragments in some sequence. Every color has 7 fragments and its own stained-glass tint AND glyph. Give the player **+1 Courage for any placement**, plus an adjacency bonus:
- **+1** if the chosen adjacent existing fragment has the SAME color.
- **+2** if the chosen adjacent existing fragment has a DIFFERENT color.
- **+0** additional bonus if there is no adjacent placed fragment.

If more than one color touches, the latest conversation did not settle stacking. For MVP: allow the player to choose **one adjacent placed fragment** for the bonus; no stacking. Always show calculated potential Courage before confirming. Log this as PROVISIONAL interpretation. The adjacency bonus is **not awarded for color rarity**; all colors have equal quantities and base potency. Do not use the earlier +1..+5 Courage-by-rarity proposal.

Design the physical layout inspired by `mirror_puzzle.JPG`: a central ornate stained-glass mosaic composed of 35 geometric cells, each with graph metadata (`id`, polygon or hex geometry, `neighbors`, `isEdge`). It may use a tessellation proxy in early development but should be styled toward the original asymmetric/circular/kaleidoscopic stained glass. The spatial adjacency graph is authoritative and unit tested.

## 8. Courage, Fear, and win conditions

Heroes begin at **Calm** on a 35-position Courage/Fear track. Positive actions gain Courage; Fear is represented by **losing Courage**, not an independent meter. Suggested starting position=18 (PROVISIONAL). Original tiers:
- Terrified 1–7; Anxious 8–14; Calm 15–21; Confident 22–28; Heroic 29–35; at 0, dead/eliminated according to original rules.
- Courage impacts movement and potentially other abilities.
- When all **35 fragments** have been restored, Occuldor is imprisoned. Determine the most heroic surviving player. **PROVISIONAL ranking**: highest current Courage, then most personally restored fragments; ties remain shared if unresolved.
- If all heroes die before the Kaleidoscope is restored, Occuldor wins.
- Provide an endgame screen with restored count, each hero's contributions, Sigils, Courage, and a narrated outcome.
- Game length of 35 rooms is a genuine open balancing question; add a developer config for short scenarios (e.g. 10/15 rooms), scaling required objects and end conditions explicitly without claiming it is the official game.

## 9. Card families / full content / privacy

Read ALL 155 actual card definitions from catalog JSON; keep IDs stable:
- `WM-01..WM-35`: White Mirrors: fixed 3 discovery symbols and no individual powers.
- `BM-01..BM-35`: hidden personal Black Mirror curses: 7 each Psychological / Material / Spatial / Supernatural / Castle-wide.
- `IT-01..IT-25`: Equipment (capacity/conversions), Tools (small utility + spell-learning access), Relics (hero-defining jewelry/abilities). Character holds 2 Equipment/Tool and 1 Relic initially.
- `SP-01..SP-35`: learn Elements/Tool, strict colored Sigil slots, Quick/Permanent alternate configurations, Basic/Intermediate/Advanced.
- `CO-01..CO-10`: follower/resident/wanderer behaviors, conflicts, occasional figurines or markers, including original named companions such as Rex and Alexis.
- `SE-01..SE-15`: private Secret objectives/knowledge/reactions; effects are **EXPERIMENTAL** and must remain isolated/configurable.

**Important:** This source catalog has human-readable `effect` strings. Implement an explicit per-ID typed effect mapping/adapter (`cardEffects.ts` or JSON DSL) for resolution. Never pretend a printed effect happened if the engine did not change state. For effects not yet automated, present a **manual-resolution dialog** that shows exact effect text and provides validated controls/choices for applying the consequence, followed by a logged confirmation. No silent no-op buttons.

Show a professional card inspector with the correct family layout: name, illustration placeholder, type, cost, ability, target, duration, Sigil placement slots, and card status. White Mirror has a three-icon discovery strip. Black Mirror uses a common unrevealing back, and may only reveal when legally flipped or inspected by an authorized effect. Secret cards are only visible in the correct private player's UI.

## 10. User experience / screens

Use a visually strong but readable desktop-first interface with responsive adaptations:
1. **Landing:** The Mirrors branding, Drunken Pony introduction, start/load game, rules/tutorial.
2. **Setup/Lobby:** 2–5 local players, names, avatar/color, seeded random setup, optional demo scenarios, rule variant panel (provisional items visibly labeled).
3. **Main Game Table:** interactive circular manor map (center Hall + 35 rooms), Occuldor location, clear heroes/room markers; interactive Kaleidoscope; compact Fear/Courage track and Occuldor Rage track; turn/phase banner; action buttons; public event log.
4. **Current Hero Character Board:** mirrors left (2), Elements above (3), Equipment/Tools right (2), Relic on portrait (1), learned Spells below (4 initially locked with unlocking criteria), held Sigils with color/glyph, Companions, private Secrets.
5. **Room Inspector:** discoveries, White/Black Mirror counts and installed pair status, whether Black is guarded, fragment color after exploration, local shared objects, exchange/combine actions, local Spells and Tools.
6. **Card Modal:** readable ability/cost text; Spell Sigil activation slots rendered as actual clickable sockets; legal choices highlighted.
7. **Mirror Action Modal:** install pair; White Mirror reveal animation; Occuldor travels and punishes only present heroes; flip hidden Black Mirror; personal curse; glass shatter/collision; Kaleidoscope placement and Courage calculation.
8. **Between-turn privacy overlay:** for hot-seat pass-and-play, hide current player's private Secrets and any privately peeked Black Mirror knowledge when control switches. Require click-to-reveal for next player.
9. **Endgame:** hero victory / Occuldor victory plus detailed log and stats.
10. **Developer tools:** seed entry, deck inspector, game-state snapshots, force phase, place heroes, grant tokens, Rage/Courage controls, demo state buttons, event timeline, validation errors. Only in development mode.

Visual language: gothic manor, polished dark surfaces, warm parchment for cards, bright glassy sigils, glowing legal-move highlights. Use CSS/SVG for prototypes; supplied iconography image is a style reference, not a sprite atlas. Keep accessibility: keyboard controls, tooltips, readable typography, icon shapes in addition to color, color-blind-safe glyphs, and reduced motion support.

## 11. Implementation architecture and stack

Use a modern, maintainable web stack:
- Next.js App Router + React + TypeScript (strict), pnpm.
- Tailwind CSS for styling, and a light accessible component layer.
- Zustand or similarly compact client state for UI; core game rules MUST be in a **pure TypeScript domain engine**, decoupled from React and visual components. Use reducers/commands/events and immutable or safely controlled state updates.
- Zod schemas to validate imported card JSON, seeded setup, saved games and commands.
- Vitest for engine tests, React Testing Library for interaction tests, Playwright for end-to-end happy paths.
- Browser localStorage/IndexedDB for versioned local saved games and settings; no mandatory backend for MVP.
- Use seeded PRNG for reproducible setup/deck draws and replay. Never use `Math.random()` directly in the deterministic engine.
- Define normalized IDs for rooms, cards, tokens, Sigil instances, player entities, and events.
- Keep all authoritative rules in one `GameRulesConfig` with statuses CONFIRMED/PROVISIONAL. Different stage/board variants can adjust this config without editing UI code.

Suggested folders:
```
app/
  page.tsx
  game/page.tsx
src/
  game/
    domain/{types,commands,reducer,events,selectors,rules,validators}.ts
    setup/{seededRng,generateRoomFindings,initialState}.ts
    map/{roomGraph,kaleidoscopeCells,pathfinding}.ts
    systems/{turns,movement,inventory,discovery,mirrors,occuldor,courage,spells,companions,secrets,victory}.ts
    cards/{catalog,schemas,cardEffects,resolveEffect}.ts
    rules/gameRulesConfig.ts
  components/{CastleBoard,KaleidoscopeBoard,CharacterBoard,RoomInspector,CardModal,OcculdorTrack,FearTrack,GameLog,...}.tsx
  stores/{useGameStore,useUiStore}.ts
  persistence/{saveGames,migrations}.ts
  assets/
docs/{RULES_STATUS,OPEN_DESIGN_DECISIONS,ARCHITECTURE,CARD_IMPLEMENTATION_STATUS}.md
reference/
tests/
```

Example domain types (adapt as needed):
```
type SigilColor = 'Scarlet'|'Emerald'|'Amber'|'Fuchsia'|'Amethyst';
type Element = 'Air'|'Earth'|'Fire'|'Water'|'Aether';
type CourageState = 'Terrified'|'Anxious'|'Calm'|'Confident'|'Heroic';
type CardFamily = 'White Mirror'|'Black Mirror'|'Item'|'Spell'|'Companion'|'Secret';
type MirrorPairState = 'none'|'blocked'|'unblocked'|'collided';
type Timing = 'preMove'|'move'|'enterRoom'|'postMove'|'endTurn';
interface GameCommand { type: string; playerId: string; payload?: unknown; }
interface GameEvent { id: string; type: string; payload: unknown; timestampTurn: number; }
```
All state-changing player interactions should issue typed commands validated for phase, ownership, adjacency, capacity, cost, location and access; emit deterministic events consumed by UI/log/animation. Undo must restore coherent state and must not break secret information (disable undo after unrecoverable private reveals or handle information leaks explicitly).

## 12. Rules engine / turn structure

Implement clear state-machine phases for each active player:
- `PREPARE`: inspect/use/leave/exchange accessible local+carried objects, learn allowed Spells, optional spell/mirror interactions.
- `PRE_MOVE_ACTIONS`: optional mirror pair installation and/or Black Mirror flip, spell casts subject to action limits.
- `MOVE_REQUIRED`: select legal nonzero destination/path, Courage-dependent movement; statuses may create exceptions.
- `ENTER_ROOM`: if unexplored, reveal preassigned contents; resolve companions and on-entry effects.
- `POST_MOVE_ACTIONS`: optional mirror pair installation/flip, inventory, spell interactions.
- `END_TURN`: resolve statuses, quick Sigil refresh according to configured timing, hand control to next player with private-info screen.

Do not duplicate actions incorrectly between pre/post stages; shared per-turn flags track placement count, flip count, quick-cast activations, and movement completed. Confirmations display exact resource cost, Courage changes, and target. Handheld spell/card/modals must never let inactive players operate the active hero.

Provisional turn order: fixed clockwise, skip dead players. Make turn order configurable because dynamic order was discussed but not finalized.

## 13. Setup, supply integrity and soft-lock prevention

On seed-based setup:
1. Shuffle 35 exact room finding multisets and assign one to each of 35 rooms.
2. Shuffle 35 fragment objects, 7 per color, and assign one to each room, initially hidden.
3. Create exactly 35 White Mirror card instances, 35 Black Mirror instances, 70 Element token instances at exact type counts; assign physical findings as rooms are revealed without duplication.
4. Shuffle item/spell/companion/secret decks, with fixed seeded order, and instantiate discoveries through White Mirror activations.
5. Put Occuldor and all heroes in central Hall. Courage starts at Calm (18 provisional), Rage 0, empty inventory, four locked Spell slots.
6. Generate a valid castle connected-room graph and Kaleidoscope adjacency graph; reject invalid/disconnected setups.

**Invariant:** With all 35 rooms and pairs active, the 35 physical White and Black Mirrors must remain discoverable and available until collided; no card effect may permanently destroy a required mirror, fragment, or Sigil without an explicit recoverability/anti-soft-lock rule. Implement invariant checks so card effects or character deaths can't accidentally make the game unwinnable. If a player dies holding essential resources, drop them in their last room (provisional); ensure access remains possible.

## 14. Testing and acceptance criteria (do not omit)

Automated tests must cover:
- Generate exactly 35 unique room-finding multisets, with 35 White / 35 Black / 70 Element occurrences and exact 14-per-Element bag.
- Exactly 35 preassigned fragments, 7 each of five colors; fragment stays hidden until room explored.
- White Mirror catalog exact 35 cards / 105 printed slots and totals S35/I25/C10/X15/Empty20, with no triple symbols and maximum one Companion symbol.
- Exactly 35 Black curses, 25 Items (10/9/6), 35 Spells (16/11/8), 10 Companions, 15 Secrets.
- Printed learning costs exactly 70 Element appearances, 14 each; Sigil socket total exceeds 35 (source catalog currently 132).
- All initial inventory/knowledge capacities; shared-room items accessible while in room, but leaving cannot violate carried-capacity limits.
- Movement mandatory, Courage based, path adjacency valid; intermediate rooms never explored.
- Pair installation consumes exactly one White+one Black; White reveals ALL slots; Secrets private; Occuldor arrives and blocks new Black while prior blocked Black becomes free; only heroes in arrival room suffer arrival punishment.
- Unblocked Black only can be flipped, hidden curse only targets flipping hero, collision restores exactly one corresponding fragment, awards its color Sigil, and Rage increases exactly +1.
- Kaleidoscope legal edge/adjacent positions; placement Courage +1 base, +1 same-neighbor, +2 different-neighbor (one chosen adjacent neighbor, no stacking); total pieces placed cannot exceed 35; no fixed color zones.
- Knowledge unlocks immediate and irreversible; permanent Sigils cannot be used for future combinations; Quick and Permanent Sigil rules, strict glyph matching, group requirements.
- Reveal of Black Mirror through authorized Item/Spell not visible to unauthorized players; Secret privacy in hot-seat mode.
- Loss at all players dead before final restoration; win at 35 pieces with correct winner/summary.
- Save/load exactly reproduces seeded draws, deck order, active phase, board status, hidden info and bound Sigils.

Add E2E tests for: (1) start 2-player game and explore a room; (2) transfer resource between room and hero; (3) assemble pair, have Occuldor guard it, lure him away with second pair, flip first, apply personal curse, restore fragment and receive Sigil; (4) use legal Kaleidoscope placement; (5) learn and cast a Spell; (6) unlock Spell Knowledge via Sigil combination; (7) resume saved game; (8) finish a tiny developer test scenario.

## 15. Delivery and iterative process

Do not stop after a plan or static UI. Implement a working application in phases, run/build/tests after each phase, and maintain a concise changelog:

**Phase 1 — Runnable foundation:** initialize app, strict types, layout, seeded card import and validation, landing/setup, interactive circular castle, player board skeleton, game log, basic test harness.

**Phase 2 — Core tabletop loop:** generate physical findings; exploration, room inventory, mandatory deterministic movement, passing-room behavior, characters, multiple players/pass-and-play.

**Phase 3 — Signature mechanics:** White+Black mirror installation, White Mirror discovery, Occuldor travel/block/arrival revenge, private Black Mirror flip and curse, collision, Sigils, Rage, interactive Kaleidoscope, Courage, victory and defeat, anti-soft-lock fallback.

**Phase 4 — Full cards:** import and render all 155 cards, legal learning, Elements, Tools, Relics, 4 Knowledge slot achievements, exact-color Quick/Permanent/grouped Sigil placements, companions, secrets, implementation coverage dashboard (typed engine effects or clearly marked manual-resolution fallbacks).

**Phase 5 — Quality:** polished gothic visuals, animations, tutorial/quick help, save/load, comprehensive tests, accessibility, responsive UI, debug/test scenarios, README, balance configuration.

At every milestone:
- Leave the app runnable and deterministic.
- Say what is complete and what remains provisional.
- Document commands to launch (`pnpm install`, `pnpm dev`, `pnpm test`, `pnpm build`) and any environment requirements.
- If there is an existing project, inspect and integrate with it rather than overwriting indiscriminately.
- Do not make network calls or require authentication, paid services, or hosted dependencies to play locally.

## 16. First thing to do

Inspect the repository and `reference/` files. Report a concise implementation plan and architecture, create the minimal running project (if none exists), then **immediately implement Phase 1**. Continue through the highest phase you can complete in this session. Ask questions only for a genuine blocker that cannot safely be handled as a documented provisional rule. Do not stop with pseudocode, paper-only mockups, or a dashboard that merely describes the game.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
