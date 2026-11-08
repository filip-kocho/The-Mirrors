/** Small tabletop miniatures. The name initial stays legible on the hero's tunic. */
export function BoardFigurine({
  name,
  color,
  wizard = false,
  active = false,
}: {
  name: string;
  color: string;
  wizard?: boolean;
  active?: boolean;
}) {
  return (
    <g
      className={`board-figurine ${wizard ? "wizard-figurine" : "hero-figurine"}${active?" active-figurine":""}`}
      role="img"
      aria-label={`${name} figurine`}
    >
      <title>{name}</title>
      <ellipse
        cy="16"
        rx="11"
        ry="4"
        fill="#101016"
        stroke={active ? "#fff1b1" : color}
        strokeWidth={active ? 2 : 1}
      />
      {wizard ? (
        <>
          <path
            d="M-5-10 0-29 8-12 3-14 10-8H-9Z"
            fill="#3a1758"
            stroke="#b696e0"
            strokeWidth="1"
          />
          <path
            d="M-5-8Q0-14 5-8L4-3 10 13Q0 18-10 13L-4-3Z"
            fill="#38124f"
            stroke="#b696e0"
            strokeWidth="1.2"
          />
          <path
            d="M-2-7 0-4 3-7M-2 0-5 11M3 0 5 11"
            fill="none"
            stroke="#bc8fe0"
            strokeWidth="1"
          />
          <path
            d="M12 15V-16M8-17 12-23 16-17 12-12Z"
            fill="#713da8"
            stroke="#d9b8f5"
            strokeWidth="1.3"
          />
          <path d="M4 1 12-3" stroke="#b696e0" strokeWidth="3" />
        </>
      ) : (
        <>
          <path
            d="M-4-13a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            fill="#eed8bd"
            stroke="#211b23"
            strokeWidth="1.2"
          />
          <path
            d="M-4-8-8-5-12 4-8 6-5 0-5 6-6 14H-1L0 7 1 14H6L5 6 5 0 8 6 12 4 8-5 4-8Z"
            fill={color}
            stroke="#211b23"
            strokeWidth="1.4"
          />
          <path d="M-5 6H5" stroke="#403023" strokeWidth="2" />
          <text
            x="0"
            y="3"
            style={{
              fill: "#171721",
              fontSize: 11,
              fontWeight: 800,
              textAnchor: "middle",
            }}
          >
            {Array.from(name.trim())[0]?.toLocaleUpperCase()}
          </text>
        </>
      )}
    </g>
  );
}

export function PlacedMirrors({ blocked }: { blocked: boolean }) {
  return (
    <g
      className="placed-mirrors"
      role="img"
      aria-label={`Placed White and Black Mirrors${blocked ? "; Black Mirror blocked by Occuldor" : "; Black Mirror unblocked"}`}
    >
      <title>
        Placed mirrors ·{" "}
        {blocked
          ? "Occuldor blocks the Black Mirror"
          : "unblocked: a hero here may Collide"}
      </title>
      <g className="placed-white-mirror" transform="translate(-24,-15)">
        <ellipse
          rx="10"
          ry="15"
          fill="#d9c48f"
          stroke="#2c2931"
          strokeWidth="2"
        />
        <ellipse rx="7" ry="12" fill="#f1f5ee" stroke="#fff" />
        <path d="M-4 5 4-6M-2 9 4 1" stroke="#aebec8" strokeWidth="1.5" />
      </g>
      <g className="placed-black-mirror" transform="translate(24,-15)">
        <ellipse
          rx="10"
          ry="15"
          fill="#887297"
          stroke="#1a1326"
          strokeWidth="2"
        />
        <ellipse rx="7" ry="12" fill="#110c1b" stroke="#c0a9dc" />
        <path d="M0-10-3-2 3 3 0 10" stroke="#765795" fill="none" />
      </g>
    </g>
  );
}
