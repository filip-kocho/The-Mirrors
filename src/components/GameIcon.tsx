import { useId } from "react";
import { iconAtlas } from "./iconAtlas";
function AtlasArtwork({ name }: { name: string }) {
  const clipId = useId().replaceAll(":", "");
  const artwork = iconAtlas[name];
  const [x, y, width, height] = artwork.box;
  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          {artwork.file === "sigils" ? (
            <polygon
              points={`${width / 2},0 ${width},${height * 0.39} ${width * 0.81},${height} ${width * 0.19},${height} 0,${height * 0.39}`}
            />
          ) : (
            <rect width={width} height={height} />
          )}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={`/icons/${artwork.file}.png`}
          x={-x}
          y={-y}
          width="1536"
          height="1024"
        />
      </g>
    </>
  );
}
export function BoardIcon({
  name,
  x,
  y,
  size,
}: {
  name: string;
  x: number;
  y: number;
  size: number;
}) {
  const artwork = iconAtlas[name];
  if (!artwork) return null;
  return (
    <svg
      className={artwork.file === "sigils" ? "sigil-artwork" : undefined}
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox={`0 0 ${artwork.box[2]} ${artwork.box[3]}`}
      overflow="hidden"
      aria-hidden="true"
      pointerEvents="none"
    >
      <AtlasArtwork name={name} />
    </svg>
  );
}
export function GameIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const resolvedName = iconAtlas[name]
    ? name
    : name === "Empty"
      ? "Empty"
      : "Item";
  const artwork = iconAtlas[resolvedName];
  if (artwork)
    return (
      <svg
        className={`game-icon artwork-icon ${artwork.file === "sigils" ? "sigil-artwork" : ""} ${className}`}
        viewBox={`0 0 ${artwork.box[2]} ${artwork.box[3]}`}
        aria-hidden="true"
        focusable="false"
        overflow="hidden"
      >
        <AtlasArtwork name={resolvedName} />
      </svg>
    );
  return (
    <svg
      className={`game-icon ${className}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="20" cy="20" r="13" strokeDasharray="3 4" />
      <path d="M14 20h12" />
    </svg>
  );
}
