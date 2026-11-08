import { corridorGeometry, routeGeometry } from "../game/map/corridorGeometry";
import { portalPairs, portalColor } from "../game/systems/portals";
import { movement, publicRoom, State } from "../game/domain/engine";
import { roomGraph, Node } from "../game/map/roomGraph";
import { useId } from "react";
import { KaleidoscopeArt, gemOwnerColors } from "./KaleidoscopeBoard";
import { BoardIcon } from "./GameIcon";
import { CastleBackdrop } from "./CastleBackdrop";
import { BoardFigurine, PlacedMirrors } from "./BoardFigurine";
import { byId } from "../game/cards/catalog";
import { BoardCurseToken } from "./CurseTokenIcon";
import { RoomParty } from "./RoomParty";
import { castlePath, corridorIds } from "../game/map/castleConnections";
import { isImmobilized } from "../game/systems/blackMirrorRuntime";
function Door({ node, neighbor }: { node: Node; neighbor: Node }) {
  const angle = (-node.rotation * Math.PI) / 180,
    target = corridorGeometry(node, neighbor).control ?? neighbor,
    dx = target.x - node.x,
    dy = target.y - node.y,
    x = dx * Math.cos(angle) - dy * Math.sin(angle),
    y = dx * Math.sin(angle) + dy * Math.cos(angle),
    scale = 37 / Math.max(Math.abs(x), Math.abs(y)),
    px = x * scale,
    py = y * scale,
    vertical = Math.abs(x) > Math.abs(y);
  return (
    <line
      x1={px - (vertical ? 0 : 12)}
      y1={py - (vertical ? 12 : 0)}
      x2={px + (vertical ? 0 : 12)}
      y2={py + (vertical ? 12 : 0)}
      stroke="#080c13"
      strokeWidth="7"
    />
  );
}
export function CastleBoard({
  s,
  selected,
  onSelect,
  onOpenPuzzle,
  zoom,
  targets,
}: {
  s: State;
  selected: string;
  onSelect: (id: string) => void;
  onOpenPuzzle: () => void;
  zoom: number;
  targets?: {
    kind: "rooms" | "corridors";
    legal: string[];
    selected: string[];
    onToggle: (id: string) => void;
  };
}) {
  const artId = useId().replaceAll(":", "");
  const pairs = portalPairs(s);
  const p = s.players[s.active],
    path = castlePath(s, p.room, selected),
    legal =
      !targets &&
      !s.pending &&
      !s.moved &&
      !isImmobilized(s, p.id) &&
      path.length > 1 &&
      path.length - 1 <= movement(s);
  return (
    <svg
      className="castle castle-wings"
      viewBox="-36 -36 872 872"
      style={{
        width: `${zoom * 100}%`,
        minWidth: zoom === 1 ? 480 : 800 * zoom,
      }}
      aria-label="Circular castle with 35 rooms"
    >
      <CastleBackdrop id={artId} />
      {Object.values(roomGraph).flatMap((n) =>
        n.neighbors
          .filter((id) => id > n.id)
          .map((id) => (
            <g
              key={`${n.id}-${id}`}
              className="castle-corridor"
              pointerEvents="none"
            >
              <path
                d={corridorGeometry(n, roomGraph[id]).d}
                fill="none"
                stroke="#1b2429"
                strokeWidth="19"
              />
              <path
                d={corridorGeometry(n, roomGraph[id]).d}
                fill="none"
                stroke="#8a877a"
                strokeWidth="13"
              />
              <path
                d={corridorGeometry(n, roomGraph[id]).d}
                fill="none"
                stroke="#c0af89"
                strokeWidth="2"
                strokeDasharray="2 6"
              />
            </g>
          )),
      )}
      {legal && (
        <path
          d={routeGeometry(path)}
          fill="none"
          stroke="#f6d28b"
          strokeWidth="5"
          strokeDasharray="8 5"
        />
      )}
      {Object.values(roomGraph).map((n) => {
        const r = publicRoom(s, n.id),
          route = castlePath(s, p.room, n.id),
          reachable =
            !targets &&
            !s.pending &&
            !s.moved &&
            !isImmobilized(s, p.id) &&
            route.length > 1 &&
            route.length - 1 <= movement(s),
          stroke =
            selected === n.id ||
            (!!pairs[selected] && pairs[n.id] === pairs[selected])
              ? "#ffe3a6"
              : reachable
                ? "#bfcdbb"
                : "#83857e";
        return (
          <g
            key={n.id}
            data-room-id={n.id}
            className={`room-node square-room${targets?.kind === "rooms" ? (targets.legal.includes(n.id) ? " curse-legal-room" : " curse-invalid-room") : ""}${targets?.selected.includes(n.id) ? " curse-chosen-room" : ""}`}
            role="button"
            tabIndex={
              targets &&
              (targets.kind !== "rooms" || !targets.legal.includes(n.id))
                ? -1
                : 0
            }
            aria-pressed={
              targets?.kind === "rooms"
                ? targets.selected.includes(n.id)
                : undefined
            }
            aria-label={`${n.id}${r.explored ? " explored" : " unexplored"}${reachable ? " reachable" : ""}`}
            aria-disabled={
              targets
                ? targets.kind !== "rooms" || !targets.legal.includes(n.id)
                : undefined
            }
            onClick={() => {
              if (
                !targets ||
                (targets.kind === "rooms" && targets.legal.includes(n.id))
              )
                onSelect(n.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (
                  !targets ||
                  (targets.kind === "rooms" && targets.legal.includes(n.id))
                )
                  onSelect(n.id);
              }
            }}
            transform={`translate(${n.x},${n.y})`}
          >
            <title>
              {n.id} ·{" "}
              {r.explored
                ? (r.color ?? (n.id === "Hall" ? "Mirror Hall" : "Restored"))
                : "Unexplored"}
            </title>
            {n.id === "Hall" ? (
              <polygon
                points="0,-110 96,-40 59,74 -59,74 -96,-40"
                fill={`url(#${artId}-floor)`}
                stroke={stroke}
                strokeWidth="3"
              />
            ) : (
              <>
                <g transform={`rotate(${n.rotation})`}>
                  <rect
                    className="room-floor"
                    x="-37"
                    y="-37"
                    width="74"
                    height="74"
                    fill={
                      s.rooms[n.id].restored
                        ? "#000000"
                        : r.explored
                          ? `url(#${artId}-floor)`
                          : "#252d39"
                    }
                    stroke={stroke}
                    strokeWidth={
                      selected === n.id ||
                      (!!pairs[selected] && pairs[n.id] === pairs[selected])
                        ? 5
                        : 3
                    }
                  />
                  <rect
                    x="-31"
                    y="-31"
                    width="62"
                    height="62"
                    fill="none"
                    stroke={r.explored ? "#a39b83" : "#454e5b"}
                    strokeWidth="1"
                    opacity=".6"
                  />
                  {n.neighbors.map((id) => (
                    <Door key={id} node={n} neighbor={roomGraph[id]} />
                  ))}
                </g>
              </>
            )}
            <g
              className="room-contents"
              transform={`rotate(${n.id === "Hall" ? 0 : n.rotation + 180})`}
            >
              {(s.blackMirror.rooms[n.id]?.darkness ?? 0) > 0 && (
                <g
                  role="img"
                  aria-label={`${s.blackMirror.rooms[n.id].darkness} Darkness in ${n.id}`}
                >
                  <BoardCurseToken
                    type="DARKNESS"
                    x={-36}
                    y={-37}
                    count={s.blackMirror.rooms[n.id].darkness}
                  />
                </g>
              )}
              {s.blackMirror.rooms[n.id]?.portal && (
                <g
                  role="img"
                  className="portal-pulse"
                  data-portal-pair={pairs[n.id]}
                  aria-label={`Portal in ${n.id}`}
                >
                  <title>Portal pair {pairs[n.id]}</title>
                  <BoardCurseToken
                    type="PORTAL"
                    tint={portalColor(pairs[n.id])}
                    x={14}
                    y={-37}
                  />
                </g>
              )}
              {n.id !== "Hall" && (
                <>
                  {r.color ? (
                    <BoardIcon name={r.color} x={-13} y={-23} size={26} />
                  ) : (
                    !r.explored && (
                      <g aria-hidden="true">
                        <path
                          d="M-9 5V-10Q0-26 9-10V5Z"
                          fill="#111b25"
                          stroke="#8a8069"
                          strokeWidth="2"
                        />
                        <path d="M0-17V5M-7-3H7" stroke="#58564b" />
                        <path d="M4 0H6" stroke="#e0c587" strokeWidth="2" />
                      </g>
                    )
                  )}
                </>
              )}
              {n.id !== "Hall" && s.rooms[n.id].pair.length > 0 && (
                <PlacedMirrors blocked={s.occuldor === n.id} />
              )}
              {s.occuldor === n.id && (
                <g
                  transform={`translate(${n.id === "Hall" ? 76 : 24},${n.id === "Hall" ? -12 : -15}) scale(.8)`}
                >
                  <BoardFigurine name="Occuldor" color="#56257c" wizard />
                </g>
              )}
              <RoomParty s={s} roomId={n.id} />
              {s.magic.gems.some(g=>g.location==="ROOM"&&g.room===n.id) && <g aria-label="Diamond Gem in room"><BoardIcon name="Diamond" x={-9} y={20} size={18}/></g>}
              {r.objects.length > 0 && (
                <g
                  className="room-object-markers"
                  role="img"
                  aria-label={`${r.objects.length} objects in ${n.id}`}
                >
                  <title>
                    {r.objects
                      .map((t) =>
                        t.kind === "Black Mirror"
                          ? "Black Mirror"
                          : (t.element ?? byId[t.card!]?.name ?? t.kind),
                      )
                      .join(", ")}
                  </title>
                  {r.objects
                    .slice(0, r.objects.length > 5 ? 4 : 5)
                    .map((token, i) => (
                      <BoardIcon
                        key={token.id}
                        name={
                          token.element ??
                          (token.kind === "Item"
                            ? byId[token.card!]?.subtype
                            : token.kind) ??
                          token.kind
                        }
                        x={-30 + i * 12}
                        y={n.id === "Hall" ? 85 : 25}
                        size={11}
                      />
                    ))}
                  {r.objects.length > 5 && (
                    <text
                      x={19}
                      y={n.id === "Hall" ? 93 : 33}
                      fill="#fff0d0"
                      fontSize="7"
                      textAnchor="start"
                    >
                      +{r.objects.length - 4}
                    </text>
                  )}
                </g>
              )}
            </g>
          </g>
        );
      })}
      <g
        role="button"
        tabIndex={targets ? -1 : 0}
        aria-label="Open Kaleidoscope"
        className="hall-puzzle-portal"
        pointerEvents={targets ? "none" : undefined}
        transform="translate(400,400)"
        onClick={onOpenPuzzle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenPuzzle();
          }
        }}
      >
        <title>Click the center of the Hall to enlarge the Kaleidoscope</title>
        <polygon
          points="0,-82 67,-34 41,48 -41,48 -67,-34"
          fill="#c3a361"
          stroke="#f4d17b"
          strokeWidth="2"
        />
        <svg
          x="-49"
          y="-62"
          width="98"
          height="98"
          viewBox="0 0 876 881"
          pointerEvents="none"
        >
          <KaleidoscopeArt
            gemColors={gemOwnerColors(s)}
            mosaic={s.mosaic}
            labels={false}
          />
        </svg>
      </g>
      {corridorIds
        .filter(
          (id) =>
            s.blackMirror.thresholds.includes(id) ||
            (targets?.kind === "corridors" && targets.legal.includes(id)),
        )
        .map((id) => {
          const [a, b] = id.split("~").map((room) => roomGraph[room]),
            geometry = corridorGeometry(a, b),
            blocked = s.blackMirror.thresholds.includes(id),
            eligible = targets?.legal.includes(id),
            chosen = targets?.selected.includes(id);
          return (
            <g
              key={id}
              role={targets?.kind === "corridors" ? "button" : "img"}
              aria-label={`${blocked ? "Corridor Block" : "Corridor"} ${id}`}
              aria-disabled={targets ? !eligible : undefined}
              aria-pressed={eligible ? !!chosen : undefined}
              tabIndex={eligible ? 0 : undefined}
              className={`corridor-target ${eligible ? "eligible" : ""}`}
              onClick={() => {
                if (eligible) targets?.onToggle(id);
              }}
              onKeyDown={(e) => {
                if (eligible && ["Enter", " "].includes(e.key)) {
                  e.preventDefault();
                  targets?.onToggle(id);
                }
              }}
            >
              {eligible && (
                <path
                  d={geometry.d}
                  fill="none"
                  stroke={chosen ? "#fff1a0" : "#55d6db"}
                  strokeWidth="8"
                  opacity=".8"
                />
              )}
              <circle
                cx={geometry.mid.x}
                cy={geometry.mid.y}
                r="18"
                fill="transparent"
              />
              {chosen && (
                <circle
                  cx={geometry.mid.x}
                  cy={geometry.mid.y}
                  r="17"
                  fill="#f9da8540"
                  stroke="#ffe6a0"
                  strokeWidth="3"
                />
              )}
              <BoardCurseToken
                type="THRESHOLD_SEAL"
                x={geometry.mid.x - 13}
                y={geometry.mid.y - 13}
                size={26}
              />
            </g>
          );
        })}
    </svg>
  );
}
