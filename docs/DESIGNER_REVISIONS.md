# Designer revisions — 2026-10-31

The latest explicit requests take precedence over the older AGENTS brief and catalog review policies. The 155-card catalog and stable card IDs remain intact.

## Confirmed and implemented

- All Item abilities and capacity bonuses require the Item in the holder's inventory. Room discoveries grant no passive bonuses. This also applies to required learning Tools; learning Elements still combine carried and local room resources.
- Leaving a capacity Item immediately reduces capacity. If other carried objects no longer fit, a persisted choice asks which excess objects to leave. Other commands wait until it is resolved. Legacy excess inventory remains visible, and capacity errors identify the exact category and excess count.
- Hexlocks cover existing fields instead of hiding them. One Hexlock per hero is removed automatically at the start of their turn, at most once per round. Paralysis appears over the character's head. Token descriptions no longer fill a section below the board.
- Threshold tokens are named **Corridor Blocks** in the interface and revised card text. Internal serialized keys remain compatible.
- Portals connect **only matching-color pairs**, with matching pulsing markers and no linking dashed lines. Active hero figurines pulse. Usable once-per-round carried Tool icons pulse; used or unavailable Tools do not. Reduced-motion settings replace pulsing with a static glow.
- Item Use controls are on the card. The redundant Item cost section is removed; ability text still states actual costs. White Mirrors show discovery icons and a short dark haiku instead of discovery prose. The complete oval Black Mirror card appears during penalty resolution and target selection.
- Every hero's current Courage/Fear tier appears below Occuldor's Rage.
- The hand under Knowledge slot four spends five free Sigils, one per color, to send Occuldor to the Hall. It requires the fourth achievement, works before or after movement, preserves Knowledge, and does not change Rage or cause arrival punishment. Bound Sigils cannot pay. It waits while another resolution is pending and is disabled if Occuldor is already in the Hall.
- Ten small diamond gaps award +3 Courage to the hero placing their last surrounding fragment and turn white. The central five-sided gap awards +5 and turns red. Rewards add to base placement, every adjacent-tile bonus and applicable carried Item rewards, capped by the Courage track. Completed gems are derived from placed cells, so reload cannot award them again.
- Cross-wing corridors curve outward to separate corner doorways. Paths, doors and Corridor Block selection use the same geometry; the room graph is unchanged.
- How to Play explains these changes.

## Geometry

Gem polygons and their surrounding cells are stored in `src/game/map/kaleidoscopeGems.json`. Using the designer's one-based cell labels, the small gaps are:

2/3/6/7; 6/11/12/16; 7/12/13/17; 8/11/15/19; 9/13/18/20;
16/19/22/25; 17/20/24/26; 22/24/29/30; 25/27/29/32; 26/28/30/31.

The central gem is surrounded by 12/16/17/22/24. These gaps never consume a fragment or Sigil.

## Provisional choices and save compatibility

- `rules.blackMirrorPolicies.hexlockRemovalOrder` defaults to `OLDEST`; `NEWEST` is available. Automatic removal and one-per-round are confirmed; which stacked token expires first was unspecified.
- Two Portals created together form a pair. A single new Portal joins the oldest unpaired Portal, or waits if none exists. `singlePortalPairing` defaults to `JOIN_OLDEST`; `NEW_PAIR` allows a lone marker to remain unpaired instead. Pair creation policy is provisional; matching-pair-only travel is confirmed.
- Old saves without pair IDs pair Portal rooms in stable room order. Any old Corridor Block that would isolate rooms under the revised connections is reopened and logged; other blocks remain. Saves with explicit pair IDs are validated normally, including a maximum of two rooms per pair.
- Old pending Hexlock-removal dialogs resolve automatically on load. Round markers and pair IDs persist.
- Printed Spell casting powers, remaining Companion abilities and Secret rewards remain outside this revision. Existing learning, binding and curse behavior is preserved.

## Verification

Regression coverage includes every revised Item, carried-only capacities and ability eligibility, saved excess-object choices, automatic Hexlock expiry, paired Portal movement/migration, five-Sigil payment, every gem and simultaneous gem completion, geometry, real browser interactions and desktop/mobile layouts. See the latest changelog entry for final test totals.
