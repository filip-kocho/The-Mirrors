import { z } from "zod";
export const magicSchema = z.object({
  version: z.literal(6).default(6),
  gems: z
    .array(
      z.object({
        id: z.string(),
        secret: z.string(),
        location: z.enum([
          "RESERVED",
          "PLAYER_STORAGE",
          "ROOM",
          "KALEIDOSCOPE",
        ]),
        owner: z.string().optional(),
        room: z.string().optional(),
        gap: z.string().optional(),
        exhausted: z.boolean(),
        usedTurn: z.number().int().default(0),
      }),
    )
    .length(10),
  wildStorage: z.array(z.object({ id: z.string(), owner: z.string() })),
  pentagon: z
    .object({ id: z.string(), owner: z.string(), gap: z.string() })
    .nullable()
    .default(null),
  movement: z
    .record(
      z.string(),
      z.object({
        turn: z.number().int(),
        swift: z.boolean().default(false),
        passage: z.string().nullable().default(null),
      }),
    )
    .default({}),
});
export const createMagic = (owners: string[]) =>
  magicSchema.parse({
    gems: Array.from({ length: 10 }, (_, i) => ({
      id: `DG-${String(i + 1).padStart(2, "0")}`,
      secret: `SE-${String(i + 1).padStart(2, "0")}`,
      location: "RESERVED",
      exhausted: false,
    })),
    wildStorage: owners.map((owner) => ({ id: `WILD-${owner}`, owner })),
  });
