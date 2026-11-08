# Companion system v0.6

Implemented 2026-11-08 from [the supplied specification](../reference/Companion_System_v0.6.md). This supersedes the earlier generic LOYAL default and selected conflict review rules. All ten stable IDs retain their physical identity; the original 155-card source JSON is unchanged.

## Confirmed implementation

- Exact names, Movement, Following, Dread, Hunt, Predator and Prey definitions for CO-01 through CO-10. Roderick, Mad Mara and Clementine replace the old names. No Resident/Wanderer classification is used.
- Loyal Companions follow their current holder. Strays transfer on validated departure, never entry or preview. Ordinary movement, Portal movement, forced moves and Spell teleports reuse `visitRoom` and `companionDeparture`.
- Followers occupy the free Companion area. Mamba, Clementine and Julia occupy the existing Equipment/Tool Item slots. Their slot use is derived from the same physical Companion tokens, not a second inventory copy. Transfer previews count their occupancy.
- Eating is resolved across a room before fear, in stable card-ID order. Eaten cards enter the removed pool and cannot be recruited. Fear uses one bounded encounter pass; there are no recursive arrival chains. A saved encounter key prevents repeated same-room fallback fleeing.
- Existing Locket and Spell conflict protection apply to the protected owner's Companions. They do not protect another owner's prey. Existing discovery rewards, sacrifice costs, abandonment, Spell recruitment/ownership changes, death drops, and Secret eligibility use the revised physical state.
- The Ghost Twins start as independent Loyal Followers. After reunion, both tokens carry the same persistent `linkedGroupId`, both become Stray, and their owner/location must match. Transfers, abandonment and fleeing move both cards together. Single-card Tool sacrifice excludes linked Twins rather than inventing a two-card cost or reward.
- Card inspectors show the four independent classifications and all relationships. Carrier cards appear only in Item slots, Follower cards only in their free area. Both reunited Twin cards display a shared link marker. Clementine uses a spider figurine.

## State model and persistence

Existing authoritative physical locations are retained: `decks.Companion` represents IN_DECK, `player.companions` ATTACHED, `room.objects` IN_ROOM, and `removed` REMOVED. `companionLocations` derives current owner and room from these containers. This avoids duplicated owner/location fields drifting apart.

`Token.originalDiscoverer` records initial discovery. The existing `discoverer` field now records the most recent holder, supporting detached Loyal recruitment rules; `originalDiscoverer` never changes. `behavior` is normalized from the exact v0.6 definition or linked-Twin override. New optional `linkedGroupId` and `fearEncounter` fields are validated and saved. Loading older saves migrates effective behavior and Carrier occupancy, without inventing a previously unrecorded reunion. Where the old save never recorded an original discoverer, its recorded holder is the best available migration default.

Reunion pending is derived from two unlinked Twins in the same room and survives saving through their physical locations. The card inspector shows this pending state. Duplicate physical identities and a split linked pair are rejected by state validation. An invalid game command acts on a cloned state and cannot transfer ownership in the live state.

## Provisional policies and open decisions

These are isolated under `rules.companionPolicies`; they are not new permanent Companion powers:

| Topic | Current default | Remaining designer decision |
| --- | --- | --- |
| Twin claim | `SAME_OWNER_IMMEDIATE`: reunite immediately if both share an owner; otherwise first departing hero claims both. `FIRST_DEPARTURE` can defer same-owner reunion too. | Final initial claim policy. |
| Flee destination | `EXPLORED_NEIGHBOR`: first connected explored room; if none, detach in the current room. `STAY` always detaches locally. | Destination choice, Hall/Portal eligibility, cascading encounters. |
| Carrier overflow | `LEAVE_CARRIER`: a newly discovered Carrier stays in the discoverer's room if no Item slot is free, retaining discovery identity. An automatic Stray transfer with no room leaves it with its previous holder/in its room. Explicit recruitment or Spell acquisition rejects insufficient capacity. Capacity loss detaches the last attached Carriers until their slot use is legal. | Whether to offer an exchange prompt instead of this deterministic fallback. |
| Protection | Preserve existing Item/Spell protection for each affected holder. No new protection powers. | Final general protection policy. |
| Multi-Companion conflicts | Stable card-ID ordering for eating; then one fear pass. No recursive fleeing encounters during the same call. | Simultaneous conflict/tie policy if desired. |
| Single-card targeting | Transfers/recruitment preserve the linked group; ordinary single-card sacrifice rejects linked Twins. | Any future explicit group-sacrifice effect must define its own cost/reward. |

The original proposed individual ability text remains visible and explicitly marked **not active**. No new abilities, numerical Power Scores, combat, or Companion Courage bonuses were implemented. Existing Item/Spell rewards remain unchanged.

## Files

- `src/game/cards/companions.ts`: exact definitions and relationships; `catalog.ts`: stable-ID overlay.
- `src/game/systems/companions.ts`: authoritative operations, capacity, departure, encounters, reunion and invariants; `companionConflicts.ts`: compatibility entry point.
- `domain/engine.ts`, `rules/gameRulesConfig.ts`: schema, migration, validation and policy defaults.
- `systems/blackMirrorRuntime.ts`, `mirrorPlacement.ts`, `inventoryCapacity.ts`, `itemActions.ts`, `spellActivation.ts`, `secrets.ts`: existing game integration.
- `components/Game.tsx`, `PlayerCollection.tsx`, `TokenIcon.tsx`, `CardFace.tsx`, `CompanionFigurine.tsx`, `HowToPlay.tsx`, `app/globals.css`: slots, inspectors, linked indicators, spider figurine and player guidance.
- `tests/companions.test.ts`, `tests/e2e/companions.spec.ts`: dedicated coverage; existing Item, Spell, Secret, curse and full-victory tests updated where v0.6 superseded old rules.

## Verification

Dedicated coverage includes all Predator/Prey pairs, non-eating Hunt/Dread pairs, matrix reciprocity, movement versus entry, invalid-command atomicity, Carrier occupancy and overflow, eating persistence, protection, Twin ownership and save/load, real White Mirror discovery, SP-33 linked transfer, forced teleportation and Black Mirror abandonment. Browser coverage checks Item-slot placement, absence of duplicate Carrier cards, relationship text and linked Twin card state.

Validation completed: 364 unit/component tests passed (including 38 dedicated Companion tests), all 39 browser tests passed, and the two Companion/collection browser scenarios passed again after final UI refinements. Type checking and production build passed. The Companion inspector screenshot was visually checked.
