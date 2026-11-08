import { useId, type ReactNode } from "react";

export type CurseTokenType =
  | "PARALYSIS"
  | "HEXLOCK"
  | "FEAR"
  | "THRESHOLD_SEAL"
  | "SIGIL_SEAL"
  | "DARKNESS"
  | "PORTAL";
const palette: Record<CurseTokenType, [string, string]> = {
  PARALYSIS: ["#9cd3dd", "#294858"],
  HEXLOCK: ["#e5b96f", "#5f3426"],
  FEAR: ["#e69faf", "#572035"],
  THRESHOLD_SEAL: ["#ed9d87", "#522d38"],
  SIGIL_SEAL: ["#ddabe9", "#57305f"],
  DARKNESS: ["#acb4d8", "#242b48"],
  PORTAL: ["#ae9af9", "#35215e"],
};
const motifs: Record<CurseTokenType, ReactNode> = {
  PARALYSIS: (
    <>
      <path d="M24 42V25q0-5 4-4v12-17q0-5 4-3v19-19q2-4 5 0v19-15q3-3 5 1v17l5-5q5-2 5 3L41 50H29Z" />
      <path d="m17 37 29 8M17 43l29-8" strokeWidth="3" />
      <path d="m19 18-4 5 4 5m29-12 4 5-4 5" />
    </>
  ),
  HEXLOCK: (
    <>
      <path d="M24 30V23a8 8 0 0 1 16 0v7" strokeWidth="4" />
      <path d="m20 29 12-5 12 5v19L32 53 20 48Z" />
      <circle cx="32" cy="36" r="3" />
      <path d="M32 39v7M14 22l4-4m28 0 4 4M14 47l4 4m28 0 4-4" />
    </>
  ),
  FEAR: (
    <>
      <path d="M12 29q20-23 40 0-20 22-40 0Z" />
      <path d="M32 20v18" strokeWidth="4" />
      <path d="M32 42q-12 13 0 13 12 0 0-13Z" />
      <path d="m17 14-3-4m33 4 3-4M32 11V7" />
    </>
  ),
  THRESHOLD_SEAL: (
    <>
      <path d="M19 50V26q0-15 13-18 13 3 13 18v24M25 48V27q0-8 7-11 7 3 7 11v21M15 51h34" />
      <path d="m16 30 32 13m-32 0 32-13" strokeWidth="3" />
      <path d="m32 29 6 7-6 7-6-7Z" fill="currentColor" />
    </>
  ),
  SIGIL_SEAL: (
    <>
      <path d="m23 40-4 17 13-7 13 7-4-17" />
      <path d="m32 10 6 5 8 1 1 8 5 6-5 6-1 8-8 1-6 5-6-5-8-1-1-8-5-6 5-6 1-8 8-1Z" />
      <circle cx="32" cy="30" r="11" />
      <path d="m32 20 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="currentColor" />
    </>
  ),
  DARKNESS: (
    <>
      <path
        d="M41 12a19 19 0 1 0 9 30 22 22 0 0 1-9-30Z"
        fill="currentColor"
        opacity=".35"
      />
      <path d="M28 34h9v17h-9ZM24 52h17M32 34v-5m0-4c-10-8 9-8 2-17" />
      <path d="m18 23 5 4m18-4 5-4M17 42l-4 2" />
    </>
  ),
  PORTAL: (
    <>
      <path d="M18 52V29q0-17 14-22 14 5 14 22v23ZM22 49V29q0-13 10-17 10 4 10 17v20" />
      <ellipse cx="32" cy="34" rx="7" ry="12" />
      <path d="M31 26c-9 9 10 9 1 17M14 53h36M15 29h6m22 0h6M29 8l3 5 3-5" />
    </>
  ),
};

/** Reusable engraved tokens, drawn as vectors to stay readable on the board. */
export function CurseTokenIcon({
  type,
  size = 44,
  tint,
}: {
  type: CurseTokenType;
  size?: number;
  tint?: string;
}) {
  const id = useId().replaceAll(":", ""),
    [baseLight, dark] = palette[type],
    light = tint ?? baseLight;
  return (
    <svg
      className={`curse-token-icon token-${type.toLowerCase()}`}
      data-curse-token={type}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-rim`} x2=".7" y2="1">
          <stop stopColor="#f5d6a0" />
          <stop offset=".45" stopColor="#806245" />
          <stop offset=".7" stopColor="#e4bd7e" />
          <stop offset="1" stopColor="#675044" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx=".35" cy=".25" r=".8">
          <stop stopColor={dark} />
          <stop offset="1" stopColor="#100e1c" />
        </radialGradient>
      </defs>
      <path
        d="m32 2 21 9 9 21-9 21-21 9-21-9-9-21 9-21Z"
        fill={`url(#${id}-rim)`}
      />
      <path
        d="m32 6 18 8 8 18-8 18-18 8-18-8-8-18 8-18Z"
        fill={`url(#${id}-glass)`}
        stroke={light}
        strokeWidth=".8"
      />
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke={light}
        opacity=".22"
        strokeDasharray="1 4"
      />
      <g
        fill="none"
        stroke={light}
        color={light}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {motifs[type]}
      </g>
      <path d="m32 2 3 4-3 3-3-3Zm0 53 3 3-3 4-3-4Z" fill={light} />
    </svg>
  );
}

export function BoardCurseToken({
  type,
  x,
  y,
  size = 23,
  count,
  tint,
}: {
  type: CurseTokenType;
  x: number;
  y: number;
  size?: number;
  count?: number;
  tint?: string;
}) {
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <CurseTokenIcon type={type} size={size} tint={tint} />
      {count !== undefined && (
        <g transform={`translate(${size - 2},${size - 1})`}>
          <circle r="6" fill="#17121f" stroke="#d5b77f" strokeWidth=".8" />
          <text
            textAnchor="middle"
            y="3"
            fill="#fff2d6"
            fontSize="9"
            fontWeight="bold"
          >
            {count}
          </text>
        </g>
      )}
    </g>
  );
}
