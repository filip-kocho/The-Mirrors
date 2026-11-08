import type { State } from "../game/domain/engine";
import { BoardFigurine } from "./BoardFigurine";
import { CompanionFigurine } from "./CompanionFigurine";

const heroColors = ["#efc77b", "#84c5da", "#d69ed7", "#9acf9e", "#f19b87"];

/** Followers derive their location from ownership, including after loading a save. */
export function RoomParty({ s, roomId }: { s: State; roomId: string }) {
  const figures = s.players.flatMap((hero, index) =>
    hero.room === roomId && !hero.dead
      ? [
          { hero, color: heroColors[index], companion: null as string | null },
          ...hero.companions.map((token) => ({
            hero,
            color: heroColors[index],
            companion: token.card!,
          })),
        ]
      : [],
  );
  const columns = Math.min(5, figures.length),
    rows = Math.ceil(figures.length / 5);
  if (!columns) return null;
  const hall = roomId === "Hall",
    width = hall ? 110 : 62,
    height = hall ? 30 : 27;
  const scale = Math.min(0.8, width / (columns * 27), height / (rows * 38));
  return (
    <g className="room-party">
      {figures.map(({ hero, color, companion }, i) => {
        const row = Math.floor(i / 5),
          rowCount = Math.min(5, figures.length - row * 5);
        return (
          <g
            key={companion ?? hero.id}
            data-holder-id={hero.id}
            transform={`translate(${((i % 5) - (rowCount - 1) / 2) * (width / columns)},${(hall ? 50 : -2) + ((row + 0.5) * height) / rows}) scale(${scale})`}
          >
            {companion ? (
              <CompanionFigurine
                cardId={companion}
                owner={hero.name}
                ownerColor={color}
              />
            ) : (
              <BoardFigurine
                name={hero.name}
                color={color}
                active={hero.id === s.players[s.active].id}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
