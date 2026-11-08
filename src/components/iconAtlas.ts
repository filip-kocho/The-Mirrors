/** Viewports into the designer's original 1536 x 1024 artwork. No redraws. */
export const iconAtlas: Record<
  string,
  { file: string; box: [number, number, number, number] }
> = {
  Air: { file: "elements", box: [48, 44, 472, 472] },
  Water: { file: "elements", box: [540, 40, 475, 475] },
  Earth: { file: "elements", box: [1000, 40, 480, 480] },
  Fire: { file: "elements", box: [290, 465, 490, 490] },
  Aether: { file: "elements", box: [780, 465, 485, 490] },
  "White Mirror": { file: "rest", box: [30, 163, 250, 293] },
  "Black Mirror": { file: "rest", box: [285, 163, 250, 293] },
  Item: { file: "rest", box: [535, 163, 235, 293] },
  Companion: { file: "rest", box: [775, 163, 235, 293] },
  Secret: { file: "rest", box: [1020, 163, 240, 293] },
  Spell: { file: "rest", box: [1268, 163, 240, 293] },
  Equipment: { file: "rest", box: [383, 586, 240, 253] },
  Tool: { file: "rest", box: [650, 586, 240, 253] },
  Relic: { file: "rest", box: [917, 586, 240, 253] },
  Scarlet: { file: "sigils", box: [282, 45, 438, 410] },
  Amethyst: { file: "sigils", box: [825, 45, 438, 410] },
  Amber: { file: "sigils", box: [53, 450, 440, 416] },
  Emerald: { file: "sigils", box: [548, 450, 440, 416] },
  Fuchsia: { file: "sigils", box: [1043, 450, 440, 416] },
};
