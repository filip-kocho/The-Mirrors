// Five wings from main rooms.png: 1 inner + 3 middle + 3 outer rooms per wing.
export interface Node {
  id: string;
  x: number;
  y: number;
  rotation: number;
  neighbors: string[];
}
const id = (n: number) => `R${String(n).padStart(2, "0")}`;
const nodes: Node[] = [];
for (let wing = 0; wing < 5; wing++) {
  const rotation = wing * 72,
    angle = (rotation * Math.PI) / 180;
  const add = (number: number, x: number, y: number) =>
    nodes.push({
      id: id(number),
      x: 400 + x * Math.cos(angle) - y * Math.sin(angle),
      y: 400 + x * Math.sin(angle) + y * Math.cos(angle),
      rotation,
      neighbors: [],
    });
  add(1 + wing, 0, 108);
  [0, -100, 100].forEach((x, column) => {
    add(6 + wing * 3 + column, x, 220);
    add(21 + wing * 3 + column, x, 325);
  });
}
export const roomGraph: Record<string, Node> = Object.fromEntries([
  ["Hall", { id: "Hall", x: 400, y: 400, rotation: 0, neighbors: [] }],
  ...nodes.sort((a, b) => a.id.localeCompare(b.id)).map((n) => [n.id, n]),
]);
function link(a: string, b: string) {
  roomGraph[a].neighbors.push(b);
  roomGraph[b].neighbors.push(a);
}
for (let wing = 0; wing < 5; wing++) {
  const inner = id(1 + wing),
    middle = 6 + wing * 3,
    outer = 21 + wing * 3,
    next = (wing + 1) % 5;
  link("Hall", inner);
  link(inner, id(1 + next));
  link(inner, id(middle));
  for (const row of [middle, outer]) {
    link(id(row + 1), id(row));
    link(id(row), id(row + 2));
  }
  for (let column = 0; column < 3; column++)
    link(id(middle + column), id(outer + column));
  link(id(middle + 1), id(6 + next * 3 + 2));
  link(id(outer + 1), id(21 + next * 3 + 2));
}
export function pathTo(from: string, to: string): string[] {
  const queue = [[from]],
    seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!;
    if (path.at(-1) === to) return path;
    for (const n of roomGraph[path.at(-1)!]?.neighbors ?? [])
      if (!seen.has(n)) {
        seen.add(n);
        queue.push([...path, n]);
      }
  }
  return [];
}
