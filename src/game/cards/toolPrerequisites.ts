import original from "../../../reference/The_Mirrors_Conceptual_Card_Catalog_v0.2.json";
import { itemById } from "./items";
const originalCards = Object.values(original.cards).flat();
export const legacyToolIds = Object.fromEntries(
  originalCards
    .filter((c) => c.family === "Item" && c.subtype === "Tool")
    .map((c) => [c.name, c.id]),
);
export function prerequisiteTool(name: string) {
  const id = Object.values(itemById).find(
    (c) => c.subtype === "Tool" && c.name === name,
  )?.id;
  return id ? { id, name: itemById[id].name, originalName: name } : undefined;
}
