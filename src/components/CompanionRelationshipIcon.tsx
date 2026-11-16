/** Distinct silhouettes reinforce relationship labels without relying on color. */
export function CompanionRelationshipIcon({ kind }: { kind: number }) {
  const paths = [
    "M3 12Q12 1 21 12Q12 23 3 12ZM12 8V13M12 16V17",
    "M4 4L12 12M4 4L5 10M4 4L10 5M20 4L12 12M20 4L14 5M20 4L19 10M7 16L12 21L17 16",
    "M3 7Q12 11 21 7L18 18L14 10M10 10L6 18Z",
    "M7 11Q3 2 6 2Q10 2 10 10M14 10Q14 2 18 2Q21 3 17 11M7 11Q2 17 8 21H16Q22 17 17 11ZM9 15H9.1M15 15H15.1M11 18H13",
  ];
  return (
    <svg
      className="companion-relationship-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
