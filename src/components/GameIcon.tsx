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
  if (name === "Diamond" || name === "Wild")
    return (
      <svg
        x={x}
        y={y}
        width={size}
        height={size}
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <path
          d={
            name === "Wild"
              ? "M20 2 38 15 31 37 9 37 2 15Z"
              : "M20 2 37 20 20 38 3 20Z"
          }
          fill="#d3eeff"
          stroke="#d5af65"
          strokeWidth="2"
        />
        <path
          d="M20 3 28 20 20 37 12 20Z"
          fill={name === "Wild" ? "#b16ac7" : "#68b6c9"}
        />
        <path d="M4 20H36" stroke="#ed8d9a" strokeWidth="3" />
      </svg>
    );
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
  if (name === "Wild" || name === "Diamond")
    return (
      <svg
        className={"game-icon " + className}
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <path
          d={
            name === "Wild"
              ? "M20 2 38 15 31 37 9 37 2 15Z"
              : "M20 2 37 20 20 38 3 20Z"
          }
          fill="#e0e7f7"
          stroke="#c49c55"
          strokeWidth="2"
        />
        <path
          d="M20 3V37M3 20H37M7 9 33 31M7 31 33 9"
          stroke={name === "Wild" ? "#aa58bc" : "#5ba7bc"}
          strokeWidth="3"
        />
        <path
          d="M20 8 29 20 20 32 11 20Z"
          fill={name === "Wild" ? "#efb865" : "#b8e9ed"}
        />
      </svg>
    );
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
