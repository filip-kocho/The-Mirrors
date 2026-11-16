export function SpellModeIcon({ name }: { name: string }) {
  const quick = name.toUpperCase() === "QUICK";
  return (
    <span
      className="spell-mode-icon"
      role="img"
      aria-label={quick ? "Quick" : "Permanent"}
      title={quick ? "Quick action" : "Permanent effect"}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {quick ? (
          <path d="M14 2L5 14H11L10 22L20 9H13Z" fill="currentColor" />
        ) : (
          <path d="M12 12C9 7 7 6 5 7C0 9 2 17 6 17C9 17 11 13 12 12C15 7 17 6 19 7C24 9 22 17 18 17C15 17 13 13 12 12Z" />
        )}
      </svg>
    </span>
  );
}
