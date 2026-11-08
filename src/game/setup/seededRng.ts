export function rng(seed: string) {
  let a = 2166136261;
  for (const c of seed) a = Math.imul(a ^ c.charCodeAt(0), 16777619);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(values: readonly T[], random: () => number) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function generateRoomFindings() {
  const patterns: number[][] = [];
  for (let a = 0; a < 4; a++)
    for (let b = a; b < 4; b++)
      for (let c = b; c < 4; c++)
        for (let d = c; d < 4; d++) patterns.push([a, b, c, d]);
  return patterns;
}
