/** Paired standing mirrors for placement; fractured mirrors and a spark for collision. */
export function MirrorActionIcon({ action }: { action: "place" | "collide" }) {
  return (
    <svg
      className="mirror-action-icon"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      {action === "place" ? (
        <>
          <ellipse
            cx="11"
            cy="19"
            rx="7"
            ry="11"
            fill="#eee9df"
            stroke="#b29b70"
            strokeWidth="1.7"
          />
          <path
            d="m8 14 5-3m-5 8 7-5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <ellipse
            cx="29"
            cy="19"
            rx="7"
            ry="11"
            fill="#20182f"
            stroke="#b29b70"
            strokeWidth="1.7"
          />
          <path
            d="m26 14 5-3"
            stroke="#ac8dce"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M11 30v4M29 30v4M5 35h30M20 2v7m-3-3 3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M13 6C1 5 1 32 13 34l-3-9 5-5-5-6Z"
            fill="#eee9df"
            stroke="#b29b70"
            strokeWidth="1.7"
          />
          <path
            d="M27 6c12-1 12 26 0 28l3-9-5-5 5-6Z"
            fill="#20182f"
            stroke="#b29b70"
            strokeWidth="1.7"
          />
          <path
            d="m20 9 3 8 7 3-7 3-3 8-3-8-7-3 7-3Z"
            fill="#fff1bc"
            stroke="#d3a558"
            strokeWidth="1.2"
          />
          <path
            d="m17 3 2 3m6 30 2 2M3 8l3 2m28 20 3 2M3 29l3-2m28-16 3-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
