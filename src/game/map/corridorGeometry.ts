import { roomGraph, type Node } from "./roomGraph";
/** Bow connections between neighboring wings outward so corner doorways remain distinct. */
export function corridorGeometry(a: Node, b: Node) {
  const n = (id: string) => Number(id.slice(1)),
    band = (id: string) => (n(id) >= 21 ? 21 : 6),
    wing = (id: string) => Math.floor((n(id) - band(id)) / 3);
  const curved =
    a.id !== "Hall" &&
    b.id !== "Hall" &&
    n(a.id) >= 6 &&
    n(b.id) >= 6 &&
    band(a.id) === band(b.id) &&
    wing(a.id) !== wing(b.id);
  const x = (a.x + b.x) / 2,
    y = (a.y + b.y) / 2,
    dist = Math.hypot(x - 400, y - 400);
  const control = curved
    ? { x: x + ((x - 400) / dist) * 55, y: y + ((y - 400) / dist) * 55 }
    : null;
  return {
    control,
    mid: control
      ? {
          x: (a.x + 2 * control.x + b.x) / 4,
          y: (a.y + 2 * control.y + b.y) / 4,
        }
      : { x, y },
    d:
      "M" +
      a.x +
      "," +
      a.y +
      (control ? " Q" + control.x + "," + control.y + " " : " L") +
      b.x +
      "," +
      b.y,
  };
}
export function routeGeometry(path: string[]) {
  return path
    .slice(1)
    .map((id, i) =>
      roomGraph[path[i]].neighbors.includes(id)
        ? corridorGeometry(roomGraph[path[i]], roomGraph[id]).d
        : "",
    )
    .filter(Boolean)
    .join(" ");
}
