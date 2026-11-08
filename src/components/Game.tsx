"use client";
import { roomActionsBlocked } from "../game/systems/spellModifiers";
import { InventorySlots, HexlockOverlay } from "./InventorySlots";
import { banishmentPlan } from "../game/systems/banishment";
import { ItemControls } from "./ItemControls";
import { useEffect, useRef, useState } from "react";
import { SpellPrompts } from "./SpellPrompts";
import { RemoteMirrorControls } from "./RemoteMirrorControls";
import { visibleSpellColors } from "../game/systems/spellActivation";
import { SignaturePanel } from "./SignaturePanel";
import { PenaltyDialog } from "./PenaltyDialog";
import { CastleBoard } from "./CastleBoard";
import { KaleidoscopeBoard } from "./KaleidoscopeBoard";
import { GameIcon } from "./GameIcon";
import { TokenIcon, tokenLabel } from "./TokenIcon";
import { CardCatalog } from "./CardCatalog";
import { HowToPlay } from "./HowToPlay";
import { SpellActivationControls } from "./SpellActivationControls";
import { SpellCastGuide } from "./SpellCastGuide";
import { CardFace } from "./CardFace";
import { MirrorPlacementDialog } from "./MirrorPlacementDialog";
import { MirrorActionIcon } from "./MirrorActionIcon";
import { SecretControls } from "./SecretControls";
import { CompletedSecrets } from "./CompletedSecrets";
import { PlayerCollection, PlayerSigils } from "./PlayerCollection";
import { SpellAction } from "./SpellAction";
import { ActionIcon } from "./ActionIcon";
import { cardEffects } from "../game/cards/cardEffects";
import { useGameStore } from "../stores/useGameStore";
import { byId, Card } from "../game/cards/catalog";
import {
  capacities,
  movement,
  publicRoom,
  planTransfer,
  Token,
} from "../game/domain/engine";
import { castlePath } from "../game/map/castleConnections";
import {
  darkness,
  isImmobilized,
  knowledgeSealed,
  statusOf,
} from "../game/systems/blackMirrorRuntime";
import { CurseChoiceDialog } from "./CurseChoiceDialog";
import { CurseTokenIcon } from "./CurseTokenIcon";
import { CurseStatus } from "./CurseStatus";
import type { CSSProperties } from "react";
import { tier } from "../game/rules/gameRulesConfig";
const tint: Record<string, string> = {
  Scarlet: "#f57579",
  Emerald: "#72d8ae",
  Amber: "#f2c76e",
  Fuchsia: "#e08bce",
  Amethyst: "#b29afa",
};
const heroColors = ["#efc77b", "#84c5da", "#d69ed7", "#9acf9e", "#f19b87"];
const label = tokenLabel;
export function Game() {
  const {
    game: s,
    error,
    notice,
    start,
    dispatch,
    resume,
    save,
    home,
  } = useGameStore();
  const [names, setNames] = useState(["Rowan", "Elara"]),
    [catalogFamily, setCatalogFamily] = useState("All"),
    [selected, setSelected] = useState("Hall"),
    [zoom, setZoom] = useState(1),
    [help, setHelp] = useState(false),
    [catalog, setCatalog] = useState(false),
    [inspected, setInspected] = useState<Card | null>(null),
    [inspectedToken, setInspectedToken] = useState<Token | null>(null),
    [puzzleOpen, setPuzzleOpen] = useState(false),
    [placementOpen, setPlacementOpen] = useState(false),
    [search, setSearch] = useState("");
  const [spellActionHost, setSpellActionHost] = useState<HTMLDivElement | null>(
    null,
  );
  const boardRef = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (s) setSelected(s.players[s.active].room);
  }, [s?.active, s?.players[s?.active ?? 0]?.room]);
  useEffect(() => {
    setInspected(null);
    setInspectedToken(null);
    setPlacementOpen(false);
  }, [s?.active, s?.privacy]);
  useEffect(() => {
    if (help || catalog || inspected || inspectedToken)
      dialog.current?.showModal();
    else dialog.current?.close();
  }, [help, catalog, inspected, inspectedToken]);
  useEffect(() => {
    if (!s || s.privacy || s.outcome !== "playing") {
      setPuzzleOpen(false);
      return;
    }
    if (s.pending?.stage === "placement") setPuzzleOpen(true);
    else if (s.pending?.stage === "after" || s.blackMirror.resolution)
      setPuzzleOpen(false);
  }, [s?.pending?.stage, s?.privacy, s?.outcome]);
  const close = () => {
    setHelp(false);
    setCatalog(false);
    setInspected(null);
    setInspectedToken(null);
    setPlacementOpen(false);
  };
  const overlay = (
    <dialog
      ref={dialog}
      className={
        inspected
          ? "card-inspector-dialog"
          : catalog
            ? "catalog-dialog"
            : help
              ? "guide-dialog"
              : undefined
      }
      aria-label={inspected ? `${inspected.name} card inspector` : undefined}
      onCancel={close}
    >
      <button className="close" onClick={close} aria-label="Close dialog">
        ×
      </button>
      {help ? (
        <HowToPlay />
      ) : inspectedToken ? (
        <>
          <p className="eyebrow">{inspectedToken.kind}</p>
          <h2>{inspectedToken.element}</h2>
          <div className="card-art">
            <GameIcon name={inspectedToken.element ?? inspectedToken.kind} />
          </div>
          <p>
            A physical Element used to learn Spells. It can be carried or left
            in a room for another hero.
          </p>
        </>
      ) : inspected ? (
        <>
          {catalog && (
            <button className="catalog-back" onClick={() => setInspected(null)}>
              Back to collection
            </button>
          )}
          <CardFace
            card={inspected}
            state={s ?? undefined}
            spellActions={
              s &&
              !catalog &&
              inspected.family === "Spell" &&
              s.players[s.active].spellSlots.includes(inspected.id) ? (
                <SpellActivationControls
                  key={inspected.id}
                  s={s}
                  spell={inspected.id}
                  actionHost={spellActionHost}
                  dispatch={dispatch}
                />
              ) : undefined
            }
            controls={
              s && inspected.family === "Item" ? (
                <ItemControls
                  key={inspected.id}
                  s={s}
                  id={inspected.id}
                  dispatch={dispatch}
                />
              ) : s && !catalog && inspected.family === "Secret" ? (
                <SecretControls
                  key={inspected.id}
                  s={s}
                  id={inspected.id}
                  dispatch={dispatch}
                />
              ) : undefined
            }
            action={
              s &&
              !s.privacy &&
              inspected.family === "Spell" &&
              !s.players[s.active].spellSlots.includes(inspected.id) ? (
                <SpellAction s={s} spellId={inspected.id} dispatch={dispatch} />
              ) : undefined
            }
          />
          {s &&
            !catalog &&
            inspected.family === "Spell" &&
            s.players[s.active].spellSlots.includes(inspected.id) && (
              <div
                ref={setSpellActionHost}
                className="spell-action-panel"
                aria-label="Spell actions outside card"
              />
            )}

          {!["White Mirror", "Item", "Secret"].includes(inspected.family) && (
            <p className="callout">
              {inspected.family === "White Mirror"
                ? "All discoveries appear when you confirm placement. Companions join you; Secrets are private."
                : cardEffects[inspected.id].kind === "curse"
                  ? "On Collide, resolve this curse and choose its targets before receiving the Sigil. Deferred effects follow fragment placement."
                  : inspected.family === "Item"
                    ? "Item abilities are automated while carried or accessible in your current room. Tools require confirmation and can be used once per hero per round."
                    : inspected.family === "Spell"
                      ? "Learn in an unlocked Knowledge slot, then assign matching Sigils to activate Quick or Permanent abilities. Unavailable effects explain their missing requirements."
                      : inspected.family === "Companion"
                        ? "Loyal Companions follow their holder. Strays follow the first hero departing their room. Abandoned Companions remain available for recruitment; Rex/Coco/Mamba and Alexis/Julius conflicts use review rules; other printed abilities are not active."
                        : "This proposed ability is not yet automated."}
            </p>
          )}
        </>
      ) : catalog ? (
        <CardCatalog
          family={catalogFamily}
          onFamily={setCatalogFamily}
          search={search}
          onSearch={setSearch}
          onInspect={setInspected}
        />
      ) : null}
    </dialog>
  );
  if (!s)
    return (
      <main className="landing mirror-landing">
        <nav>
          <span className="brand">✧ THE MIRRORS</span>
          <button onClick={() => setHelp(true)}>How to play</button>
        </nav>
        <section className="intro">
          <div className="mirror-duet" aria-hidden="true">
            <div className="landing-mirror light-mirror">
              <GameIcon name="White Mirror" />
              <span>THE GIFT</span>
            </div>
            <div className="mirror-duet-sigil">
              <GameIcon name="Amethyst" />
            </div>
            <div className="landing-mirror dark-mirror">
              <GameIcon name="Black Mirror" />
              <span>THE CURSE</span>
            </div>
          </div>
          <p className="eyebrow">
            A competitive cooperative tabletop adventure
          </p>
          <h1>
            Every mirror
            <br />
            holds <em>two fates.</em>
          </h1>
          <p>
            The White Mirror offers a gift. The Black Mirror demands a price.
            Enter Occuldor's castle, brave its secrets, and piece together the
            prison you broke.
          </p>
          <div className="intro-tags">
            <span>2–5 local heroes</span>
            <span>35 hidden rooms</span>
            <span>One broken prison</span>
          </div>
        </section>
        <section className="setup">
          <div className="ornament">✧</div>
          <p className="eyebrow">Your story begins at the Drunken Pony</p>
          <h2>Gather the party</h2>
          <p>Pass-and-play on one screen.</p>
          <div className="name-fields">
            {names.map((name, i) => (
              <label key={i}>
                <span style={{ color: heroColors[i] }}>● Hero {i + 1}</span>
                <input
                  aria-label={`Hero ${i + 1} name`}
                  maxLength={30}
                  value={name}
                  onChange={(e) =>
                    setNames(
                      names.map((n, j) => (i === j ? e.target.value : n)),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <div className="button-row">
            <button
              disabled={names.length >= 5}
              onClick={() => setNames([...names, `Hero ${names.length + 1}`])}
            >
              + Add hero
            </button>
            <button
              disabled={names.length <= 2}
              onClick={() => setNames(names.slice(0, -1))}
            >
              Remove hero
            </button>
          </div>
          <button className="primary wide" onClick={() => start(names, "")}>
            Enter the castle <span>→</span>
          </button>
          <button className="wide" onClick={resume}>
            Resume saved expedition
          </button>
          <p className="build-note">
            Core loop · 35 Black Mirror curses
            <br />
            Explore, place mirrors, lure Occuldor and restore the Kaleidoscope.
            Full card abilities remain in development.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </section>
        <footer>
          <span>THE MIRRORS · LOCAL PLAYTEST</span>
          <button onClick={() => setCatalog(true)}>
            Browse the original 155-card catalog ↗
          </button>
        </footer>
        {overlay}
      </main>
    );
  const p = s.players[s.active],
    room = publicRoom(s, selected),
    current = s.rooms[p.room],
    path = castlePath(s, p.room, selected),
    legal =
      !s.moved &&
      !isImmobilized(s, p.id) &&
      !s.pending &&
      !s.blackMirror.resolution &&
      path.length > 1 &&
      path.length - 1 <= movement(s),
    cap = capacities(
      p.inventory,
      current.objects,
      statusOf(s, p.id).hexlocks,
      s,
      p.id,
    );
  let banishReason = "";
  try {
    banishmentPlan(s);
  } catch (e) {
    banishReason = (e as Error).message;
  }
  const canUseMirrors =
    s.outcome === "playing" &&
    !s.pending &&
    !s.blackMirror.resolution &&
    !roomActionsBlocked(s, p.room) &&
    !p.dead &&
    p.room !== "Hall" &&
    !current.restored;
  const canPlaceMirrors =
    canUseMirrors &&
    !current.pair.length &&
    [...p.inventory, ...current.objects].some(
      (t) => t.kind === "White Mirror",
    ) &&
    [...p.inventory, ...current.objects].some(
      (t) => t.kind === "Black Mirror",
    ) &&
    (!s.installed || !s.rules.onePairPlacementAndOneFlipPerTurn);
  const unguardedPair = current.pair.length === 2 && s.occuldor !== current.id;
  const canCollide =
    canUseMirrors &&
    unguardedPair &&
    (!s.flipped || !s.rules.onePairPlacementAndOneFlipPerTurn);
  const act = (command: Parameters<typeof dispatch>[0]) => dispatch(command);
  const showToken = (t: Token) => {
    setInspectedToken(null);
    setInspected(null);
    if (t.kind === "Element") setInspectedToken(t);
    else if (t.card) setInspected(byId[t.card]);
  };
  const objectAction = (t: Token, carry: boolean) => {
    if (!carry && selected !== p.room) return null;
    if (t.kind === "Spell")
      return <SpellAction s={s} spellId={t.card!} dispatch={dispatch} />;
    if (t.kind === "Companion" && !carry)
      return (
        <button
          aria-label={`Recruit ${label(t)}`}
          title="Recruit Companion"
          disabled={
            !!s.pending ||
            !!s.blackMirror.resolution ||
            !!darkness(s, p.room) ||
            p.dead ||
            s.outcome !== "playing"
          }
          onClick={() =>
            dispatch({ type: "RECRUIT", playerId: p.id, tokenId: t.id })
          }
        >
          <ActionIcon name="take" />
        </button>
      );
    if (["Companion", "Secret"].includes(t.kind)) return null;
    let reason = "";
    try {
      planTransfer(s, t.id, carry ? "leave" : "take");
    } catch (error) {
      reason = (error as Error).message;
    }
    return (
      <button
        aria-label={`${carry ? "Leave" : "Take"} ${label(t)}`}
        title={
          reason || `${carry ? "Leave in room" : "Take from room"}: ${label(t)}`
        }
        disabled={!!reason || !!s.pending || s.outcome !== "playing" || p.dead}
        onClick={() =>
          act({
            type: "TRANSFER",
            playerId: p.id,
            tokenId: t.id,
            direction: carry ? "leave" : "take",
          })
        }
      >
        <ActionIcon name={carry ? "leave" : "take"} />
      </button>
    );
  };
  const tokenRow = (t: Token) => (
    <div
      className={`token ${t.kind.endsWith("Mirror") ? "mirror-token" : ""}`}
      key={t.id}
      data-token-id={t.id}
    >
      <TokenIcon
        token={t}
        onInspect={showToken}
        context="room"
        action={objectAction(t, false)}
      />
    </div>
  );
  if (s.privacy)
    return (
      <main className="privacy">
        <div className="ornament">◇</div>
        <p className="eyebrow">The castle keeps its secrets</p>
        <h1>Pass to {p.name}</h1>
        <p>Only the next hero should reveal their character board.</p>
        <button
          className="primary"
          onClick={() => act({ type: "REVEAL", playerId: p.id })}
        >
          I am {p.name} · Reveal turn
        </button>
      </main>
    );
  return (
    <main className="table">
      <header>
        <div>
          <span className="brand">✧ THE MIRRORS</span>
          <small>THE MIRROR CASTLE · SEED {s.seed}</small>
        </div>
        <div className="button-row">
          <button onClick={() => setHelp(true)}>Rules</button>
          <button onClick={save}>Save</button>
          <button
            onClick={() => {
              save();
              home();
              close();
            }}
          >
            Leave table
          </button>
        </div>
      </header>
      <div className="turn-banner">
        <div>
          <span className="turn-number">{String(s.turn).padStart(2, "0")}</span>
          <div>
            <small>ACTIVE HERO</small>
            <strong style={{ color: heroColors[s.active] }}>{p.name}</strong>
          </div>
        </div>
        <p>
          {isImmobilized(s, p.id)
            ? "Paralysis prevents leaving. You may use accessible objects or end your turn."
            : s.moved
              ? "Explore your findings, then pass the turn."
              : `Choose your path · move 1–${movement(s)} connected rooms.`}
        </p>
        <span className="phase">
          {isImmobilized(s, p.id)
            ? "PARALYZED"
            : s.moved
              ? "POST-MOVE ACTIONS"
              : "PREPARE · MOVEMENT REQUIRED"}
        </span>
      </div>
      {(error || notice) && (
        <div
          className={error ? "message error" : "message"}
          role={error ? "alert" : "status"}
        >
          {error || notice}
        </div>
      )}

      <div className="table-grid">
        <aside className="character panel">
          <p className="eyebrow">Your character board</p>
          <h2>{p.name}</h2>
          <button
            className="primary wide end-turn"
            disabled={
              (!s.moved && !p.dead && !isImmobilized(s, p.id)) ||
              !!s.pending ||
              !!s.blackMirror.resolution ||
              s.outcome !== "playing"
            }
            onClick={() => {
              close();
              act({ type: "END", playerId: p.id });
            }}
          >
            End turn →
          </button>
          <div className="elements-area">
            <small>
              ELEMENTS ·{" "}
              {p.inventory.filter((t) => t.kind === "Element").length}/
              {cap.elements}
            </small>
            <div className="slots">
              <InventorySlots
                s={s}
                slot="elements"
                tokens={p.inventory.filter((t) => t.kind === "Element")}
                icon="Empty"
                context="element slot"
                onInspect={showToken}
                action={(t) => objectAction(t, true)}
              />
            </div>
          </div>
          <div className="portrait-row">
            <div className="side-slots">
              <small>MIRRORS</small>
              <InventorySlots
                s={s}
                slot="mirrors"
                tokens={p.inventory.filter((t) => t.kind.endsWith("Mirror"))}
                icon="White Mirror"
                context="mirror slot"
                onInspect={showToken}
                action={(t) => objectAction(t, true)}
              />
              <button
                className={`mirror-placement-button primary${canCollide ? " collide-ready" : ""}`}
                aria-label={unguardedPair ? "Collide" : "Place"}
                disabled={unguardedPair ? !canCollide : !canPlaceMirrors}
                onClick={() =>
                  unguardedPair
                    ? dispatch({ type: "COLLIDE", playerId: p.id })
                    : setPlacementOpen(true)
                }
                title={
                  current.restored
                    ? "This room's Sigil has already been restored"
                    : current.pair.length && s.occuldor === current.id
                      ? "Occuldor blocks this pair"
                      : unguardedPair
                        ? "Collide: flip the Black Mirror and receive the room's Sigil"
                        : "Place: choose a White and Black Mirror from your hand or this room"
                }
              >
                <MirrorActionIcon
                  action={unguardedPair ? "collide" : "place"}
                />
              </button>
            </div>
            <div className="portrait" style={{ color: heroColors[s.active] }}>
              {(statusOf(s, p.id).paralysis.length > 0 ||
                statusOf(s, p.id).immobilized) && (
                <span
                  className="portrait-paralysis"
                  role="img"
                  aria-label="Paralysis on character"
                  title={
                    isImmobilized(s, p.id)
                      ? "Paralysis prevents movement"
                      : "Brooch suppresses Paralysis"
                  }
                >
                  <CurseTokenIcon type="PARALYSIS" size={48} />
                  <b>{statusOf(s, p.id).paralysis.length || 1}</b>
                </span>
              )}
              <svg
                className="hero-portrait-art"
                viewBox="0 0 100 120"
                aria-label="Hooded adventurer"
              >
                <path
                  d="M18 110Q14 45 50 12Q86 45 82 110L65 92L50 104L35 92Z"
                  fill="currentColor"
                  opacity=".3"
                />
                <path
                  d="M30 66Q32 32 50 25Q68 32 70 66L62 90L50 99L38 90Z"
                  fill="#171c24"
                  stroke="currentColor"
                />
                <path
                  d="M37 63L45 67M55 67L63 63M43 83Q50 88 57 83"
                  fill="none"
                  stroke="currentColor"
                />
              </svg>
              <div className="relic-fields">
                <InventorySlots
                  s={s}
                  slot="relics"
                  tokens={p.inventory.filter(
                    (t) => t.card && byId[t.card]?.subtype === "Relic",
                  )}
                  icon="Relic"
                  context="relic slot"
                  onInspect={showToken}
                  action={(t) => objectAction(t, true)}
                />
              </div>
            </div>
            <div className="side-slots">
              <small>ITEMS</small>
              <InventorySlots
                s={s}
                slot="items"
                tokens={p.inventory.filter(
                  (t) =>
                    t.kind === "Item" && byId[t.card!]?.subtype !== "Relic",
                )}
                icon="Item"
                context="item slot"
                onInspect={showToken}
                action={(t) => objectAction(t, true)}
              />
            </div>
          </div>
          <div className="courage">
            <div>
              <span>{tier(p.courage)}</span>
              <strong>
                {p.courage}
                <small> / 35</small>
              </strong>
            </div>
            <meter min={0} max={35} value={p.courage} aria-label="Courage" />
            <small>Relic capacity: {cap.relics}.</small>
            <small>Courage determines movement · {movement(s)} steps</small>
          </div>
          <CurseStatus s={s} />
          <PlayerSigils player={p} state={s} />
          {visibleSpellColors(s).length > 0 && (
            <details>
              <summary>Private fragment visions</summary>
              {visibleSpellColors(s).map((id) => (
                <p key={id}>
                  {id}: {s.rooms[id].color}
                </p>
              ))}
            </details>
          )}
          <h3>Spell Knowledge</h3>
          <div className="knowledge">
            {["1 Sigil", "3 colors", "3 matching", "5 colors"].map(
              (text, i) => (
                <div
                  key={text}
                  className={`knowledge-slot${knowledgeSealed(s, p.id, i) ? " hexlocked-slot" : p.knowledge[i] ? " unlocked-slot" : ""}`}
                  aria-label={`Spell slot ${i + 1}: ${knowledgeSealed(s, p.id, i) ? "Hexlocked" : p.spellSlots[i] ? "learned" : p.knowledge[i] ? "unlocked, empty" : "locked"}`}
                >
                  {!p.knowledge[i] && !knowledgeSealed(s, p.id, i) && (
                    <span className="slot-state" title="Locked">
                      <ActionIcon name="locked" />
                    </span>
                  )}
                  {knowledgeSealed(s, p.id, i) && (
                    <HexlockOverlay
                      count={
                        statusOf(s, p.id).hexlocks.filter(
                          (h) => h.slot === "knowledge" && h.index === i,
                        ).length
                      }
                    />
                  )}
                  <div className="spell-space">
                    {p.spellSlots[i] ? (
                      <TokenIcon
                        token={p.inventory.find(
                          (t) => t.id === p.spellSlots[i],
                        )!}
                        onInspect={showToken}
                        context="knowledge slot"
                        action={
                          <SpellAction
                            s={s}
                            spellId={p.spellSlots[i]!}
                            dispatch={dispatch}
                          />
                        }
                      />
                    ) : (
                      <span className="vacant-spell-space" />
                    )}
                  </div>
                  {p.spellSlots[i] ? (
                    <SpellCastGuide s={s} spellId={p.spellSlots[i]!} />
                  ) : (
                    <>
                      <small>{text}</small>
                      <b>
                        {knowledgeSealed(s, p.id, i)
                          ? "Hexlocked"
                          : p.knowledge[i]
                            ? "Unlocked"
                            : "Locked"}
                      </b>
                    </>
                  )}
                  {i === 3 && (
                    <button
                      className="banish-hand"
                      aria-label="Banish Occuldor"
                      title={
                        banishReason ||
                        "Spend five different Sigils to send Occuldor to the Hall"
                      }
                      disabled={!!banishReason}
                      onClick={() =>
                        dispatch({ type: "BANISH_OCCULDOR", playerId: p.id })
                      }
                    >
                      <svg viewBox="0 0 64 64" aria-hidden="true">
                        <path
                          d="M19 55 10 35q-2-6 3-6l9 10V14q0-7 5-5v23V7q3-6 6 0v25V10q4-5 6 1v22-16q5-4 6 2v25l-9 11Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
          <PlayerCollection player={p} onInspect={showToken} state={s} />
        </aside>
        <div className="castle-column">
          <section className="map-panel panel">
            <section className="panel room-inspector">
              <div className="room-summary">
                <p className="eyebrow">Room inspector</p>
                <h2>
                  {selected === "Hall"
                    ? "Mirror Hall"
                    : `Chamber ${selected.slice(1)}`}
                </h2>
                <span className="badge">
                  {selected === p.room
                    ? "YOU ARE HERE"
                    : room.explored
                      ? "EXPLORED"
                      : "UNEXPLORED"}
                </span>
                <div
                  className="room-symbol"
                  style={{ color: room.color ? tint[room.color] : "#ad9471" }}
                >
                  {room.color ? (
                    <GameIcon name={room.color} />
                  ) : s.rooms[selected].restored ? (
                    <span
                      className="restored-room-swatch"
                      role="img"
                      aria-label="Restored room"
                    />
                  ) : (
                    "⌑"
                  )}
                </div>
                {room.explored ? (
                  <p>
                    {s.rooms[selected].restored
                      ? "Fragment restored to the Kaleidoscope."
                      : room.color
                        ? `${room.color} fragment · unrestored`
                        : "The broken prison of Occuldor."}
                  </p>
                ) : (
                  <p>
                    The door is sealed in shadow.
                    <br />
                    End your movement here to reveal its findings.
                  </p>
                )}
                {selected !== p.room && (
                  <>
                    <p className="route">
                      Route: {path.join(" → ")}
                      <br />
                      {path.length - 1} steps · allowance {movement(s)}
                    </p>
                    <button
                      className="primary wide"
                      disabled={!legal}
                      onClick={() =>
                        act({ type: "MOVE", playerId: p.id, path })
                      }
                    >
                      {s.moved
                        ? "Movement complete"
                        : legal
                          ? "Move here →"
                          : "Beyond your reach"}
                    </button>
                  </>
                )}
              </div>
              <div className="room-findings">
                {darkness(s, selected) > 0 && (
                  <div className="room-curse">
                    <CurseTokenIcon type="DARKNESS" />
                    <strong>Darkness: {darkness(s, selected)}</strong>
                    <p>
                      Pay 1 Courage per token to use this room. You may leave
                      without paying.
                    </p>
                    {selected === p.room && (
                      <button
                        disabled={
                          !!s.pending ||
                          !!s.blackMirror.resolution ||
                          p.dead ||
                          s.outcome !== "playing"
                        }
                        onClick={() =>
                          dispatch({ type: "CLEAR_DARKNESS", playerId: p.id })
                        }
                      >
                        Clear one Darkness (-1 Courage)
                      </button>
                    )}
                  </div>
                )}
                {s.blackMirror.rooms[selected]?.portal && (
                  <p className="room-curse">
                    <CurseTokenIcon type="PORTAL" />
                    Portal: travel to its matching-color partner in one movement
                    step.
                  </p>
                )}
                <RemoteMirrorControls
                  s={s}
                  roomId={selected}
                  dispatch={dispatch}
                />
                {s.rooms[selected].pair.length > 0 && (
                  <>
                    <h3>Paired Mirrors</h3>
                    <div className="token-grid">
                      {s.rooms[selected].pair.map((token) => (
                        <div className="token mirror-token" key={token.id}>
                          <TokenIcon
                            token={token}
                            onInspect={showToken}
                            context="paired in room"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <h3>Room findings</h3>
                {room.objects.length ? (
                  <div className="token-grid">
                    {room.objects.map((t) => tokenRow(t))}
                  </div>
                ) : (
                  <p className="empty">
                    {room.explored
                      ? "No loose objects here."
                      : "Four findings await discovery."}
                  </p>
                )}
                <small>
                  Room objects are public: every hero can inspect them. Only
                  heroes physically here may collect resources or learn Spells.
                </small>
              </div>
            </section>
            <div className="map-toolbar">
              <small>
                {s.mosaic.filter(Boolean).length}/35 fragments restored
              </small>
              <div>
                <button
                  aria-label="Zoom out"
                  onClick={() => setZoom(Math.max(0.75, zoom - 0.25))}
                >
                  −
                </button>
                <button onClick={() => setZoom(1)}>
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  aria-label="Zoom in"
                  onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="map-scroll" ref={boardRef}>
              <CastleBoard
                s={s}
                selected={selected}
                onSelect={setSelected}
                onOpenPuzzle={() => setPuzzleOpen(true)}
                zoom={zoom}
              />
            </div>

            <div className="map-legend">
              <span>⌑ Unexplored</span>
              <span>◇ Revealed fragment</span>
              <span>
                <i className="restored-room-swatch" aria-hidden="true" />{" "}
                Restored room
              </span>
              <span className="gold">┄ Legal route</span>
            </div>
            <div className="party-strip">
              {s.players.map((hero, i) => (
                <div key={hero.id} className={s.active === i ? "active" : ""}>
                  <b style={{ color: heroColors[i] }}>● {hero.name}</b>
                  <small>
                    {hero.room} · Courage {hero.courage}
                  </small>
                </div>
              ))}
            </div>
          </section>
          <section className="panel occuldor-panel">
            <p className="eyebrow">Occuldor</p>
            <div className="rage-heading">
              <h2>Guarding {s.occuldor}</h2>
              <strong>
                {s.rage}
                <small> / 35</small>
              </strong>
            </div>
            {s.occuldor === p.room &&
              current.pair.length === 2 &&
              Object.values(s.rooms).filter(
                (r) => r.id !== "Hall" && !r.restored,
              ).length === 1 && (
                <button
                  disabled={!!s.pending || p.dead || s.outcome !== "playing"}
                  onClick={() => dispatch({ type: "CONFRONT", playerId: p.id })}
                >
                  Confront Occuldor · -{s.rules.confrontCost} Courage
                  (provisional)
                </button>
              )}
            <div className="rage-track">
              {Array.from({ length: 35 }, (_, i) => (
                <i
                  key={i}
                  style={{ background: i < s.rage ? "#c8787e" : undefined }}
                />
              ))}
            </div>
            <small>
              Each successful collision raises Rage once. Arrival affects only
              heroes present.
            </small>
          </section>
          <section
            className="panel party-fear"
            aria-label="All players Fear and Courage"
          >
            <h3>The party</h3>
            {s.players.map((hero, i) => (
              <div className="party-fear-row" key={hero.id}>
                <strong style={{ color: heroColors[i] }}>
                  {hero.name}{" "}
                  <small title="Movement from Courage level">
                    +
                    {hero.dead
                      ? 0
                      : s.rules.movement[
                          Math.max(
                            0,
                            Math.min(4, Math.floor((hero.courage - 1) / 7)),
                          )
                        ]}
                  </small>
                  {hero.dead ? " - Fallen" : ""}
                </strong>
                <span>
                  {tier(hero.courage)} - {hero.courage}/35
                </span>
                <meter
                  style={
                    {
                      "--fear-color": [
                        "#c85f79",
                        "#d6936a",
                        "#dfc477",
                        "#8dc99a",
                        "#91cce5",
                      ][
                        Math.max(
                          0,
                          Math.min(4, Math.floor((hero.courage - 1) / 7)),
                        )
                      ],
                    } as CSSProperties
                  }
                  min={0}
                  max={35}
                  value={hero.courage}
                  aria-label={hero.name + " Courage"}
                />
              </div>
            ))}
          </section>
          <CompletedSecrets s={s} onInspect={showToken} />
          <section className="panel log">
            <p className="eyebrow">Castle chronicle</p>
            <div role="log" aria-label="Game events">
              {s.log
                .slice(-20)
                .reverse()
                .map((event) => (
                  <p key={event.id}>
                    <small>TURN {event.turn}</small>
                    {event.text}
                  </p>
                ))}
            </div>
          </section>
        </div>
      </div>
      <SpellPrompts s={s} dispatch={dispatch} />
      <SignaturePanel key={`${p.id}-${s.turn}`} s={s} />
      {s.blackMirror.resolution?.choice && (
        <CurseChoiceDialog s={s} dispatch={dispatch} error={error} />
      )}
      {s.pending?.stage === "penalty" && !s.blackMirror.resolution && (
        <PenaltyDialog s={s} dispatch={dispatch} error={error} />
      )}
      {puzzleOpen &&
        s.pending?.stage !== "penalty" &&
        !s.blackMirror.resolution && (
          <KaleidoscopeBoard
            s={s}
            dispatch={dispatch}
            onClose={() => setPuzzleOpen(false)}
          />
        )}
      {placementOpen && (
        <MirrorPlacementDialog
          s={s}
          dispatch={dispatch}
          onClose={() => setPlacementOpen(false)}
          error={error}
        />
      )}
      <footer>
        <span>CORE TABLETOP PLAYTEST</span>
        <span>Local only · No account required</span>
      </footer>
      {overlay}
    </main>
  );
}
