export function MovementBadge({ steps }: { steps: number }) {
  return (
    <span
      className="movement-badge"
      aria-label={`Movement allowance: ${steps} steps`}
      title={`Movement allowance: ${steps} steps (including active bonuses)`}
    >
      +{steps}
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <ellipse cx="7" cy="8" rx="3" ry="5" transform="rotate(-18 7 8)" />
        <path d="M6 14l5-1 1 4-5 1z" />
        <ellipse cx="17" cy="12" rx="3" ry="5" transform="rotate(18 17 12)" />
        <path d="M13 18l5 1-1 4-5-1z" />
      </svg>
    </span>
  );
}
