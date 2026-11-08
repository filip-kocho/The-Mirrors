# Board and icon update — 2026-10-27

## Latest card and icon direction

The subsequent terminology correction distinguishes **Place** (selected pair placement and White discovery) from **Collide** (legal Black flip, personal curse, Sigil and mosaic). White card faces now omit Empty symbols completely. The original catalog's three-slot patterns remain authoritative data.

The main map is now a castle floor plan: masonry walls, connected corridor floors, five wings, an outer fortified wall, towers, moat and gatehouse. This decoration does not change the original authored 35-room graph. Placed pairs appear as white and black ovals inside their room; the wizard stands over guarded Black. Hero miniatures carry their name initial and player color; the wizard miniature is dark violet.

The latest user requests override the old sample artwork's rules: Mirror cards are oval, icons remain on the table until clicked, Companions attach automatically, and Secrets are inspected privately from the hero board. Black Mirror faces have no discovery/empty sockets. Other families use portrait board-game cards with readable titles, an artwork field, subtype, rules panels, and family-specific costs or sockets. The anatomy PDF informs presentation; its older hidden-Black-Mirror wording does not override the user.

The supplied `Elements.png`, `rest.png`, and `Sigils.png` are copied unchanged to `public/icons/`. `src/components/iconAtlas.ts` records SVG viewport coordinates for each symbol; this uses the original artwork without generated replacements or network dependencies. `rest.png` supplies White Mirror, Black Mirror, Item, Equipment, Tool, Relic, Companion, Secret and Spell icons. `Elements.png` supplies Air, Water, Earth, Fire and Aether in their shown order.

Sigil artwork is mapped to the existing catalog colors: upper-left red/pink = Scarlet, upper-right violet = Amethyst, lower-left orange = Amber, lower-middle teal = Emerald, lower-right pink/violet = Fuchsia. The distinct original glyphs remain visible. These icons appear in the character collection, Spell cost sockets, unrestored explored rooms, and occupied Kaleidoscope cells. Restored rooms lose their displayed Sigil; internal room color metadata remains for conservation and saves.

The existing guarded-pair sequence is retained: Place creates the chosen pair; Collide performs the later legal unblocked flip, curse and restoration, and the player chooses the Kaleidoscope position. The Sigil remains owned by that hero after placement for future casting.

The user's current request is to use inventory icons, make carried cards inspectable, open a zoomed Kaleidoscope from the Hall center, and match the two supplied pictures. The images are visual references, not additional rules instructions.

Original copies are preserved in `reference/design-2026-10-27/`:

- `main rooms.png`: five wings, each with one inner square room, three middle square rooms and three outer square rooms. The Hall is pentagonal. The authored graph follows the dotted corridors; rotation and doorway markers follow each wing. Total: 35 rooms plus the Hall.
- `kaledioscope.png`: 35 blue pentagons around a gray pentagonal centerpiece. `kaleidoscopeGeometry.json` records the traced polygons, shared-edge neighbors and outer-edge flags. Near-identical vertices in the raster were snapped to shared coordinates. The centerpiece does not consume one of the 35 fragments. The latest designer revision makes it a +5 Courage gem when surrounded; ten small enclosed diamond gaps award +3 each. Internal diamond holes do not count as the outer edge.

The reference's blue is an empty-glass presentation, not a gameplay color assignment. Placed fragments use their existing five colors and distinct glyphs. Geometry tests check that every neighbor relation corresponds to an actual shared polygon edge and all 35 cells can be filled legally.

Click the middle of the Hall (or focus it and press Enter) to open the puzzle in a modal zoom view. Opening or closing the view does not move a hero or consume an action. A pending restoration opens it automatically; closing leaves the pending placement intact. Escape / Back returns keyboard focus to the initiating control. The default view fits the full puzzle; zoom controls allow closer inspection with scrolling.

Elements, Mirrors, Equipment, Tools, Relics and Spells use distinct local SVG icons, with accessible names and hover labels. Click a room or carried icon to inspect it. The designer's subsequent clarification supersedes the original concealed Black Mirror display: drawn Mirrors remain icons in hands and rooms; clicking displays their complete card text. White Mirrors show only nonempty discovery symbols; the complete three-slot catalog patterns remain unchanged. Place beside the character's Mirror slots opens an explicit hand/room pair chooser. Spell learning costs use Element icons. Spell learning is now available; casting remains unfinished.

Saved state keeps stable room IDs, card identities, resources and mosaic cell indices. Existing saved expeditions now display and use the new corridor and pentagon graphs; previously placed colors retain their saved indices. Prior placements are not rescored or replayed against the new geometry.

The 2026-10-28 refinement rotates all room contents (Sigil, placed Mirrors, wizard and heroes) on the room axes, with local bottom facing inward along its wing. Small object icons sit at that bottom edge. Up to five icons are visible; larger piles show four plus a remaining count, with all objects listed in the tooltip and room inspector. Hall contents keep a neutral orientation. The single Place/Collide control and skippable penalty popup supersede the earlier separate-action/manual workflow.

The Hall-center zoom label has been removed; the miniature mosaic remains clickable and keyboard accessible. The first fragment starts at an outer edge and every later fragment joins an existing piece along a shared edge. The original geometry and gray decorative center remain unchanged.
