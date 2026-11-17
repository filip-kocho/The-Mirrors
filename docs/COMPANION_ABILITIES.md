# Companion ability audit — 16 November 2026

All ten current Companion abilities now execute in the rules engine. Relationship, movement, eating, fleeing and Carrier-slot behavior continue to use the approved v0.6 system and relationship correction.

| Companion | Executable ability |
| --- | --- |
| Rex | Prevents 1 Courage loss on Occuldor arrival for his holder, without a round limit. |
| Alexis | Adds 1 movement to the holder's allowance. |
| Poe | Before mandatory movement, select one physically adjacent unexplored room on the map to privately inspect its Sigil color. No exploration, findings or curse reveal occurs. |
| Roderick | Once per round, prepare passage through one selected blocked adjacent corridor during mandatory movement. |
| Madison | Move a loose White Mirror from an adjacent room into the current room. |
| Mason | Move a loose Black Mirror from an adjacent room into the current room. Ghost Twins retain their linked Stray relationship. |
| Mara | Once per round, remove a selected Fear or Paralysis token. |
| Mamba | Once per round, remove a selected Hexlock. |
| Clementine | Move one Item or up to two Elements from one discovered room into the current room. |
| Julia | Reduce one Earth or Water learning requirement for a hero in her room, retaining at least one Element requirement. Applies to carried/local payment and never bypasses Tool or Knowledge requirements. |

Poe's action and private result appear beside his opened card. His owner's saved fragment visions retain the information after Poe transfers. Neither the next player nor the public log receives the result. Pre-movement timing, ownership, action windows, hidden targets, adjacency and one room per owner turn are validated by the engine.

Julia's discount appears in the learning payment dialog. Passive Companion inspectors now describe whether their benefit is available. Julia refreshes once per player turn by default; `companionPolicies.juliaRefresh` can instead be `ROUND`. This timing is PROVISIONAL because the catalog does not specify a refresh. Julia applies locally even if another hero holds her, matching the printed room-based ability. Her discount does not stack with Grimoire; Grimoire takes precedence without consuming her use. These choices are recorded in OPEN_DESIGN_DECISIONS.md.

Regression coverage includes private scouting, invalid targets, handoff, save/load, minimum learning payment, local Julia access, discount use tracking and actual browser interactions.
