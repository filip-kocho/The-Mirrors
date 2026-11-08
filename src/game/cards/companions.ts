export const companionDefinitions = [
  {
    id: "CO-01",
    name: "Rex the Dog",
    movementType: "LOYAL",
    followingType: "FOLLOWER",
    dreadIds: ["CO-07"],
    huntIds: ["CO-02", "CO-04"],
    predatorIds: [],
    preyIds: [],
  },
  {
    id: "CO-02",
    name: "Alexis the Cat",
    movementType: "STRAY",
    followingType: "FOLLOWER",
    dreadIds: ["CO-01", "CO-07", "CO-08"],
    huntIds: ["CO-09"],
    predatorIds: ["CO-04"],
    preyIds: [],
  },
  {
    id: "CO-03",
    name: "Poe the Raven",
    movementType: "STRAY",
    followingType: "FOLLOWER",
    dreadIds: ["CO-08", "CO-10"],
    huntIds: [],
    predatorIds: ["CO-09"],
    preyIds: [],
  },
  {
    id: "CO-04",
    name: "Roderick the Rat",
    movementType: "STRAY",
    followingType: "FOLLOWER",
    dreadIds: ["CO-01", "CO-07"],
    huntIds: [],
    predatorIds: [],
    preyIds: ["CO-02", "CO-08", "CO-10"],
  },
  {
    id: "CO-05",
    name: "Madison the Ghost Sister Twin",
    movementType: "LOYAL",
    followingType: "FOLLOWER",
    dreadIds: ["CO-07", "CO-09"],
    huntIds: [],
    predatorIds: [],
    preyIds: [],
  },
  {
    id: "CO-06",
    name: "Mason the Ghost Brother Twin",
    movementType: "LOYAL",
    followingType: "FOLLOWER",
    dreadIds: ["CO-07", "CO-09"],
    huntIds: [],
    predatorIds: [],
    preyIds: [],
  },
  {
    id: "CO-07",
    name: "Mad Mara",
    movementType: "STRAY",
    followingType: "FOLLOWER",
    dreadIds: [],
    huntIds: ["CO-01", "CO-02", "CO-04", "CO-05", "CO-06"],
    predatorIds: [],
    preyIds: [],
  },
  {
    id: "CO-08",
    name: "Mamba the Snake",
    movementType: "STRAY",
    followingType: "CARRIER",
    dreadIds: [],
    huntIds: ["CO-02", "CO-03"],
    predatorIds: ["CO-04", "CO-09"],
    preyIds: [],
  },
  {
    id: "CO-09",
    name: "Clementine the Spider",
    movementType: "STRAY",
    followingType: "CARRIER",
    dreadIds: ["CO-02"],
    huntIds: ["CO-05", "CO-06"],
    predatorIds: [],
    preyIds: ["CO-03", "CO-08", "CO-10"],
  },
  {
    id: "CO-10",
    name: "Julia the Venus",
    movementType: "STRAY",
    followingType: "CARRIER",
    dreadIds: [],
    huntIds: ["CO-03"],
    predatorIds: ["CO-04", "CO-09"],
    preyIds: [],
  },
] as const;
export const companionById = Object.fromEntries(
  companionDefinitions.map((c) => [c.id, c]),
);

export interface CompanionRelationships {
  id: string;
  dreadIds: readonly string[];
  huntIds: readonly string[];
  predatorIds: readonly string[];
  preyIds: readonly string[];
}
export function validateCompanionRelationships(
  definitions: readonly CompanionRelationships[],
) {
  const byId = new Map(definitions.map((c) => [c.id, c]));
  if (definitions.length !== 10 || byId.size !== 10)
    throw Error("Exactly ten unique Companions are required.");
  const pairs = [
    ["huntIds", "dreadIds"],
    ["dreadIds", "huntIds"],
    ["predatorIds", "preyIds"],
    ["preyIds", "predatorIds"],
  ] as const;
  for (const c of definitions) {
    if (
      c.huntIds.some((id) => c.predatorIds.includes(id)) ||
      c.dreadIds.some((id) => c.preyIds.includes(id))
    )
      throw Error("Fear and predation must not overlap: " + c.id);
    for (const [key, reciprocal] of pairs) {
      if (new Set(c[key]).size !== c[key].length)
        throw Error("Duplicate relationship: " + c.id);
      for (const id of c[key]) {
        if (id === c.id) throw Error("Self relationship: " + id);
        const target = byId.get(id);
        if (!target) throw Error("Unknown Companion: " + id);
        if (!target[reciprocal].includes(c.id))
          throw Error("Missing reciprocal relationship: " + c.id + " / " + id);
      }
    }
  }
}
validateCompanionRelationships(companionDefinitions);
