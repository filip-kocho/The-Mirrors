# The Mirrors

A local, hot-seat browser adaptation of the supplied original tabletop game. The original 155-card catalog is imported from `reference/` and validated at startup. The supplied Black Mirror v0.4 review catalog updates its 35 Black Mirror definitions by stable ID.

## Run

Requires Node.js 22.12+ (tested with Node 24) and pnpm. If pnpm is missing, install it with `npm install -g pnpm`.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Choose 2–5 heroes and enter the castle. Each new game shuffles the castle and decks automatically; Resume keeps your saved expedition. Dependencies need internet access to install; gameplay uses no remote services, fonts, images, accounts, or backend.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
pnpm exec playwright install chromium
pnpm test:e2e
```

## Playable now

- Seeded 35-room setup; five stone castle wings, battlements, towers, a gatehouse and a pentagonal Hall; zoom, scroll/pan, keyboard room selection and path previews.
- Mandatory Courage-based movement; only the destination is entered and explored.
- Clickable inventory icons for inspecting Elements, Mirrors, Items and Spells; click the Hall center to open the enlarged pentagonal Kaleidoscope.
- Individual resource transfers, shared room resources, carrying capacities, and local capacity equipment.
- Supplied Element, Item/subtype, Mirror, Companion, Secret and Sigil artwork; automatic Companion attachment and private Secret icons on the hero board.
- Learn any discovered Spell by paying its exact Elements from hand and/or current room, accessing its required Tool, and automatically filling the first free unlocked Knowledge slot. Click the **Learn** book icon on the Spell card or its room token. Exact Elements are paid automatically from room resources first, then carried resources; the button stays disabled if any requirement is missing.
- White Mirror icons opening oval board-game card faces, public Black Mirror faces on click, public room objects, and a Place chooser beside the hero's Mirror slots: select the exact White and Black from hand and/or room. Every White discovery appears; Secrets stay private; Occuldor relocates and applies local arrival penalties.
- Unblocked Black flips, collisions, exactly matched Sigil awards, irreversible Knowledge achievements (1 Sigil / 3 different / 3 matching / all 5 colors), Rage, and player-chosen Kaleidoscope placements with cumulative bonuses from every edge-adjacent fragment: +1 for each matching color, +2 for each different color, plus +1 base placement Courage. The first fragment must start on an outer edge; every later fragment must share an edge with an existing piece.
- A final-room Confront fallback, death drops, full-board victory/defeat, survivor ranking, and saved games including pending penalty/placement resolution.

The button beside Mirror slots reads **Place** when both colors are accessible in an unrestored room, and **Collide** for an unguarded installed pair. Discovered Black Mirrors are publicly inspectable; curses activate only on Collide. All 35 v0.4 curses resolve through automatic operations and validated target choices. Rewards commit once after the immediate curse; deferred movement/turn effects follow Kaleidoscope placement. Seven persistent/temporary token types affect capacity, turns, spells and castle connections.

**This is an incremental core-loop playtest, not the completed specification.** All 25 revised Item abilities and Permanent Sigil commitment are implemented. Printed Spell casting, Quick refresh, other Companion powers and Secret rewards remain unfinished. Selected Companion conflicts use documented review rules. Spell learning, automatic Companion attachment and private Secret inspection are implemented. Discoveries remain inspectable, and unavailable mechanics are identified. The board can reach its endgame without those optional card systems, but balance and full rules fidelity depend on completing them.

The room inspector sits above the enlarged castle. Occuldor's track and the chronicle sit below it. End Turn is on the character board; collected Sigils sit above Knowledge slots. Closed/open padlocks mark slot status, while unlocked empty slots remain blank. Click the Hall center to enlarge the Kaleidoscope.

## First ritual

1. Explore rooms, collect or leave Mirrors, and move one or both to a room that needs a pair. You can use mirrors lying in your current room without picking them up.
2. Click **Place** beside your Mirror slots. Choose one White and one Black from your hand and/or current room, then confirm. All White discoveries appear, and Occuldor guards the Black Mirror.
3. Place another pair elsewhere to lure him away.
4. Return to the unblocked pair and click **Collide** to flip the Black Mirror. Resolve its curse and any target choices, then choose a legal Kaleidoscope cell. Every existing fragment sharing an edge adds its Courage bonus automatically; the preview lists all contributions.
5. Repeat. All 35 fragments seal the prison; the last guarded pair can be freed with the labeled provisional Confront action.

The Save button and every successful command store the expedition in this browser. Resume opens the privacy screen. Saves contain hidden information locally; hot-seat privacy protects the rendered UI, not access through browser developer tools. Do not clear browser storage if you want to retain your expedition.

See [rules coverage](docs/RULES_STATUS.md), [open design decisions](docs/OPEN_DESIGN_DECISIONS.md), [architecture](docs/ARCHITECTURE.md), and [card implementation coverage](docs/CARD_IMPLEMENTATION_STATUS.md).

Black Mirror v0.4: [implementation and provisional review decisions](docs/BLACK_MIRROR_IMPLEMENTATION.md). Spell casting and most other card-family powers remain in development.

Revised Item controls, per-card behavior, retained Spell prerequisites and design questions: [Item v0.3 implementation](docs/ITEM_IMPLEMENTATION.md).
