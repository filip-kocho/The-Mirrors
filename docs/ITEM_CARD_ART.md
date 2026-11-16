# Item card illustrations

All 25 Item cards now use distinct portraits in public/art/item-portraits.webp. Stable IT-01 through IT-25 IDs map to five columns and five rows, in row-major order. Equipment, Tool and Relic rules, names and costs are unchanged. Existing small inventory icons remain intact.

Generated using the built-in imagegen tool, then encoded locally as WebP. Artwork is bundled for offline play. This follows the same portrait atlas and CSS cropping approach as the Companion cards.

## Generation prompt

undefined

## Validation

Unit/component tests, TypeScript and production build checked. A browser test opens all 25 Item cards and verifies their individual atlas positions and bundled asset availability. Representative Equipment, Tool and Relic screenshots are inspected.
