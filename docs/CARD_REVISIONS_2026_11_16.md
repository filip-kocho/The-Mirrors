# Card revisions — 16 November 2026

Implemented from the designer's latest card list and two clarifications. Stable card IDs, original White Mirror discovery patterns, learning costs, and printed Sigil colors remain intact.

## Presentation

- All 35 White Mirrors have individual titles. Both Mirror families display their type beneath their title.
- Spell faces use bolt/infinity mode icons, a darker Permanent section, a black title frame with violet lettering, and a shorter format. Assignment instructions stay outside the face.
- Secrets no longer print the redundant qualifying-resource sentence.

## Executable revisions

| Cards | Implementation |
| --- | --- |
| BM-02, 08, 19, 20 | Remove maximum wording; add Paralysis; place two permanent Corridor Blocks; use Block terminology. |
| IT-07 | Remove overlapping-Air explanatory sentence. |
| IT-11 | Pay a carried Element, gain 1 Courage, Hexlock its vacated Element slot. |
| IT-12 | Pay both carried Mirrors; Hexlock both vacated Mirror slots instead of imposing the old departure restriction. |
| IT-13, 14 | Gain 2 Courage and Hexlock the paid Item or Spell slot. |
| IT-22 | Allow movement through blocked corridors. |
| IT-24 | Add one Relic slot; award 1 Courage for each newly bound physical Sigil, never for Quick assignments or reloads. |
| SP-02 | Permanent movement bonus is 2. |
| SP-08, 13 | Leave a carried Element/Mirror in the room, gain 1 Courage, and Hexlock its vacated slot. |
| SP-16 Quick | Return actual bound Sigils from one owned Permanent Spell; end its effect and gain 1 Courage per returned Sigil. It may be activated again later. Curse Seals are not returned. |
| SP-16 Permanent | Another Permanent Spell costs one fewer matching Sigil. Saved assignments retain their paid socket positions. |
| SP-32 Permanent | At the owner's turn start, optionally place a matching Portal pair in the current room and a selected other room. Both rooms must be free and two physical Portal tokens available. |
| CO-01, 02 | Rex reduces arrival Fear by 1 without a round limit; Alexis adds 1 movement. |
| CO-04 | Once per round, prepare passage through one selected adjacent blocked corridor for mandatory movement. |
| CO-05, 06 | Pull a loose White/Black Mirror from an adjacent room. Madison and Mason retain their linked Stray relationship. |
| CO-07, 08 | Once per round, remove one Fear/Paralysis token or one Hexlock, respectively. |
| CO-09 | Move one Item or up to two Elements from one discovered room into the holder's current room. |

Permanent effects remain their owner's effects on every player's turn when their triggers apply. Other players cannot operate that owner's Spell. Companion action controls appear outside the inspected card. Round-limited powers track the physical Companion, preventing ownership transfers from refreshing them.

## Interpretation and boundaries

The precise provisional choices are recorded in OPEN_DESIGN_DECISIONS.md. In particular, SP-16 automatically chooses an affordable socket to waive and cannot discount itself; CO-05/06/09 have no added once-per-round restriction. Existing Item payment disposal rules remain unchanged, whereas SP-08/13 explicitly leave their payment in the room. Obsolete Spell Tool prerequisites remain blocked. CO-03 and CO-10 proposed special powers are outside this revision and remain unimplemented.

## Verification

- 420 unit/component tests pass, including 18 new revision regressions.
- All 50 browser scenarios pass across the full run and corrected-test reruns, including all 155 card faces, mobile previews, Companion actions, SP-16 assignments/returns, and paired Portals.
- Strict TypeScript checking passes.
- Production build passes (`pnpm build`).
