export function ActionIcon({
  name,
}: {
  name: "learn" | "locked" | "unlocked" | "leave" | "take";
}) {
  return (
    <svg
      className="action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "learn" ? (
        <>
          <path d="M12 8Q6 4 2 7V20Q6 17 12 21Q18 17 22 20V7Q18 4 12 8V21" />
          <path d="M12 2V5M9 3 12 5 15 3M5 11 9 12M15 12 19 11" />
        </>
      ) : name === "leave" || name === "take" ? (
        <path d={name === "leave" ? "M12 4V20M6 14L12 20L18 14" : "M12 20V4M6 10L12 4L18 10"} />
      ) : (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path
            d={
              name === "locked"
                ? "M8 10V6a4 4 0 0 1 8 0V10"
                : "M8 10V6a4 4 0 0 1 8 0"
            }
          />
          <path d="M12 14V17" />
        </>
      )}
    </svg>
  );
}
