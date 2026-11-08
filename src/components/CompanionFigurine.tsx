import { byId } from "../game/cards/catalog";

/** Explicit catalog identities; visual variants never infer or execute card effects. */
export const companionShapes: Record<string, string> = {
  "CO-01": "dog",
  "CO-02": "cat",
  "CO-03": "raven",
  "CO-04": "rat",
  "CO-05": "ghost-madison",
  "CO-06": "ghost-mason",
  "CO-07": "ghost-mama",
  "CO-08": "snake",
  "CO-09": "rabbit",
  "CO-10": "plant",
};

export function CompanionFigurine({
  cardId,
  owner,
  ownerColor = "#d9e3e7",
}: {
  cardId: string;
  owner?: string;
  ownerColor?: string;
}) {
  const shape = companionShapes[cardId],
    name = byId[cardId]?.name ?? "Companion";
  return (
    <g
      className="board-figurine companion-figurine"
      data-companion-id={cardId}
      data-shape={shape}
      role="img"
      aria-label={`${name} figurine${owner ? ` · follows ${owner}` : ""}`}
    >
      <title>
        {name}
        {owner ? ` · follows ${owner}` : ""}
      </title>
      <ellipse
        cy="16"
        rx="12"
        ry="4"
        fill="#323942"
        stroke={ownerColor}
        strokeWidth="1.5"
      />
      <g
        fill="#f3f2e9"
        stroke="#545e6a"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {shape === "dog" && (
          <>
            <path d="M-9 8Q-16 4-13-3L-10 0-8 2-3-1 1-9 8-10 12-5 8-2 8 12H4L3 5-4 6-5 13H-9Z" />
            <path d="M1-9-2-12-4-5 0-2Z" fill="#c8d0d3" />
            <path d="M2-1 8 0" stroke={ownerColor} strokeWidth="2" />
            <circle cx="7" cy="-7" r="1" fill="#25303c" />
            <circle cx="12" cy="-5" r="1" fill="#25303c" />
          </>
        )}
        {shape === "cat" && (
          <>
            <path
              d="M5 11Q18 10 12 1Q9-3 13-6"
              fill="none"
              stroke="#f3f2e9"
              strokeWidth="3"
            />
            <path d="M-7-9-8-17-2-13 3-13 9-17 8-8Q8-3 4-1L7 12H-7L-4-1Q-9-3-7-9Z" />
            <path
              d="M-4-7-2-6M3-6 5-7M0-4V-2M-5 0-12-2M5 0 12-2M-1 5-2 12M2 5 3 12"
              fill="none"
            />
          </>
        )}
        {shape === "raven" && (
          <>
            <path d="M-3 9-10 13-7 3Q-13-6-5-8L-1-15Q5-19 9-13L15-10 8-8Q9 5 3 10Z" />
            <path
              d="M-5-5Q3-5 2 5L-5 9ZM-2 10-3 15M3 10 5 15M-6 15H0M2 15H8"
              fill="#cbd3d7"
            />
            <circle cx="5" cy="-13" r="1" fill="#25303c" />
          </>
        )}
        {shape === "rat" && (
          <>
            <path
              d="M-7 10Q-18 13-17 5Q-16 0-12 4"
              fill="none"
              stroke="#e3e5e3"
              strokeWidth="2"
            />
            <path d="M-10 8Q-12-2-3-3L5-5 14 3 7 7 5 12H1L0 10-5 12H-9Z" />
            <circle cx="1" cy="-6" r="4" />
            <circle cx="2" cy="-6" r="2" fill="#c4ced1" />
            <circle cx="8" cy="1" r="1" fill="#25303c" />
            <path d="M11 4 15 6M11 2 16 1" />
          </>
        )}
        {shape?.startsWith("ghost") && (
          <>
            <path
              d={
                shape === "ghost-mama"
                  ? "M-8-8Q-10-21 0-23Q10-21 8-8L14 12 7 10 3 15-1 10-7 14-13 11Z"
                  : "M-8-7Q-9-18 0-19Q9-18 8-7L11 12 6 9 1 14-3 10-9 13-12 8Z"
              }
            />
            <ellipse cy="-8" rx="5" ry="6" fill="#d3dce0" stroke="none" />
            <path d="M-3-9V-7M3-9V-7M-4 2-6 8M4 1 6 7" fill="none" />
            {shape === "ghost-madison" && (
              <path d="M-2-16-8-19-7-13-2-16 3-19 4-13Z" fill="#bbcbd2" />
            )}
            {shape === "ghost-mason" && (
              <path d="M-1-15Q4-13 2-11Q-2-11-1-15" fill="#fdfdfa" />
            )}
            {shape === "ghost-mama" && (
              <path
                d="M-7-11Q0-24 7-11M-8 3Q0 7 8 3M0 7V12"
                fill="none"
                strokeWidth="2"
              />
            )}
          </>
        )}
        {shape === "snake" && (
          <>
            <path
              d="M-9 12Q-16 5-5 3L4 4Q10 5 5 9L-3 10Q-8 7-1 6"
              fill="none"
              stroke="#eef0e9"
              strokeWidth="5"
            />
            <path d="M2 5Q-3-1-2-8Q-9-18 0-20Q11-20 6-9L4-3 8 3Z" />
            <path d="M0-11V1" stroke="#bac9cf" strokeWidth="2" />
            <path
              d="M-3-15-1-14M3-14 5-15M1-19V-23M1-22-1-24M1-22 3-24"
              fill="none"
            />
          </>
        )}
        {shape === "rabbit" && (
          <>
            <ellipse cx="-6" cy="6" rx="7" ry="8" />
            <circle cx="-12" cy="6" r="3" />
            <path d="M-1-7Q-10-24-5-25Q0-25 2-12Q4-28 8-25Q12-22 6-8Q13-1 6 4L6 12H-2L-1 5Q-6-1-1-7Z" />
            <path
              d="M-5-20 0-11M7-21 5-12M-6 12H0"
              fill="none"
              stroke="#bdcbd0"
            />
            <circle cx="6" cy="-3" r="1" fill="#25303c" />
          </>
        )}
        {shape === "plant" && (
          <>
            <path d="M-9 5H9L6 15H-6Z" fill="#d0d8d9" />
            <path d="M0 5V-6" strokeWidth="3" />
            <path d="M0 2Q-13 4-12-6Q-3-9 0 2ZM0 1Q13 3 13-7Q4-9 0 1Z" />
            <path d="M0-4Q-13-7-9-19L0-13 9-19Q13-7 0-4Z" />
            <path d="M-8-16-5-10-3-14 0-8 3-14 5-10 8-16" fill="none" />
          </>
        )}
      </g>
    </g>
  );
}
