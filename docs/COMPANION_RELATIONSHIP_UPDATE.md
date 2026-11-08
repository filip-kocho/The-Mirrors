# Companion relationship correction

The approved matrix from the designer's focused correction is applied in src/game/cards/companions.ts. IDs, names, Loyal/Stray classifications, Carrier rules, movement, Ghost Twins and abilities are unchanged. The centralized resolver already handles predation before fear, so no behavioral rewrite was necessary.

Validation runs at catalog import: ten unique definitions, valid references, no self-references or duplicate entries, reciprocal Hunt/Dread and Predator/Prey, and no overlapping fear/predation lists. Tests assert all forty lists exactly, every Hunt causes fleeing without removal, every Predator removes its prey, and malformed catalogs fail validation.

Companion card art uses public/art/companion-portraits.webp, one locally stored five-by-two atlas generated with the built-in imagegen tool. Reading order: Rex, Alexis, Poe, Roderick, Madison; Mason, Mad Mara, Mamba, Clementine, Julia. CSS crops by stable card ID. Existing board figurines are unchanged.

Art prompt: Create a five-column, two-row equal-cell atlas with no gutters or text. Separate centered portraits of a shaggy dog, elegant cat, black raven, grey rat, Victorian ghost girl, Victorian ghost boy, eccentric adult witch, coiled emerald snake, eight-legged spider and potted Venus flytrap. Detailed painterly gothic fantasy, pale moonlight, candle highlights and consistent charcoal castle backgrounds. Keep each subject inside its own cell.

Spell activation controls now occupy the right column beside the card on desktop; Sigil sockets remain directly clickable on the card. Narrow screens stack the controls to avoid horizontal overflow. A browser geometry assertion verifies the desktop arrangement.

Validation: 395 unit/component tests passed. Browser checks cover Companion portraits and Spell desktop/mobile activation; production build also checked.
