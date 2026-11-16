# Card presentation revision

## Final anatomy

- Each card prints its ID once in the upper band. The repeated THE MIRRORS / ID footer is removed.
- White and Black Mirrors use transparent illustrated frames as the whole card. Discoveries, haiku and curse text sit inside the glass. The old inset illustration is no longer displayed.
- Items use larger artwork, an Ability heading and a text area reserving three lines, followed by bottom timing such as Passive or Once per round. Complete wording is preserved if it needs additional space; nothing is truncated.
- Spells use a taller 360 x 650 desktop format. Learning Element icons sit at the left of the title without a visible Learning cost heading; accessible labeling remains. Exact Tool prerequisites, both casting effects and assignment text are printed on the card. Clickable Sigils stay on the card and resolution controls stay outside.
- Companions show the printed Ability and the complete relationship lists on the card. The requested inactive-proposal heading is removed. This is a presentation change; it does not implement new individual Companion powers.
- Secrets use larger artwork with their condition and reward on the face. Private live achievement status and confirmation controls remain separate from printed content.
- No internal card scrollbars or truncated rules. Existing type colors and parchment remain for non-Mirror faces.

## Card backs

Six family-specific backs appear in catalog thumbnails and through View back / View front in the preview. Previous/Next browsing returns to the next front. This is a catalog feature and does not change gameplay visibility.

New assets: public/art/card-backs.webp, mirror-white-frame.webp and mirror-black-frame.webp. Existing per-card portraits are retained.

## Artwork generation

Used the built-in imagegen tool. The back atlas prompt specified three columns and two rows: silver White Mirror, amethyst Black Mirror, amber treasure chest Item, sapphire grimoire Spell, emerald paw Companion, rose sealed parchment Secret. Antique filigree, burgundy velvet, gothic painted style, no text or IDs.

Mirror edit prompts used the existing upright White/Black images as references: remove the exterior castle/candles/velvet; retain the ornate complete oval frame; make exterior transparent and glass opaque with a faint reflection for readable text; front-facing portrait 63:88 canvas. White uses pale frosted ivory, Black dark obsidian violet. Alpha is preserved in the WebP conversion.

## Validation

395 unit/component tests passed. Fifteen focused browser tests passed, including every catalog card's dimensions, overflow, single ID, full Spell/Companion text, mobile representatives, active Spell/Item controls, Mirror collision, catalog navigation and all six backs. Production build checked separately.

## Follow-up refinement
The backs now use six local code-native SVG assets (`public/art/back-*.svg`) with dark surfaces, restrained gothic arches, and family-colored engraving. Mirror backs are oval. Spell fronts are parchment scrolls with centered Element costs. Companion relationships retain their labels with additional distinct SVG icons. Black curse copy is centered inside its glass; White fronts are unchanged.
