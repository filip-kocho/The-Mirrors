# THE MIRRORS — COMPANION RELATIONSHIP UPDATE
## Focused correction prompt

Update the existing Companion implementation to reflect the latest approved relationship matrix.

IMPORTANT:
- This is a correction/update, not a full redesign.
- Do NOT change Companion IDs, names, Loyal/Stray rules, Follower/Carrier rules, Ghost Twins reunion logic, or other systems.
- Do NOT introduce Power Scores.
- Do NOT invent new relationships beyond the table below.
- Only update:
  - Companion relationship data
  - Validation rules
  - Conflict resolution behavior if needed
  - Tests affected by these relationship changes

---

## 1. Core relationship rules

Companions have four relationship lists:

- DREAD = characters this Companion fears and flees from
- HUNT = characters this Companion frightens and makes flee
- PREDATOR = characters this Companion eats
- PREY = characters that can eat this Companion

### Critical constraints

1. HUNT and PREDATOR must be different lists.
   - A Companion CANNOT both frighten and eat the same target.

2. DREAD and PREY must be different lists.
   - A Companion CANNOT both fear and be edible to the same target.

3. Every HUNT relation must have a reciprocal DREAD relation.

4. Every PREDATOR relation must have a reciprocal PREY relation.

5. A Companion cannot reference itself in any relationship list.

6. Use Companion IDs internally, not display names.

---

## 2. Approved Companion relationship matrix

### CO-01 — Rex the Dog
- DREAD: [CO-07]
- HUNT: [CO-02, CO-04]
- PREDATOR: []
- PREY: []

### CO-02 — Alexis the Cat
- DREAD: [CO-01, CO-07, CO-08]
- HUNT: [CO-09]
- PREDATOR: [CO-04]
- PREY: []

### CO-03 — Poe the Raven
- DREAD: [CO-08, CO-10]
- HUNT: []
- PREDATOR: [CO-09]
- PREY: []

### CO-04 — Roderick the Rat
- DREAD: [CO-01, CO-07]
- HUNT: []
- PREDATOR: []
- PREY: [CO-02, CO-08, CO-10]

### CO-05 — Madison the Ghost Sister Twin
- DREAD: [CO-07, CO-09]
- HUNT: []
- PREDATOR: []
- PREY: []

### CO-06 — Mason the Ghost Brother Twin
- DREAD: [CO-07, CO-09]
- HUNT: []
- PREDATOR: []
- PREY: []

### CO-07 — Mad Mara
- DREAD: []
- HUNT: [CO-01, CO-02, CO-04, CO-05, CO-06]
- PREDATOR: []
- PREY: []

### CO-08 — Mamba the Snake
- DREAD: []
- HUNT: [CO-02, CO-03]
- PREDATOR: [CO-04, CO-09]
- PREY: []

### CO-09 — Clementine the Spider
- DREAD: [CO-02]
- HUNT: [CO-05, CO-06]
- PREDATOR: []
- PREY: [CO-03, CO-08, CO-10]

### CO-10 — Julia the Venus
- DREAD: []
- HUNT: [CO-03]
- PREDATOR: [CO-04, CO-09]
- PREY: []

---

## 3. Meaning of the approved changes

Apply the following interpretation exactly:

- Rex the Dog does NOT eat Alexis or Roderick.
  - Rex only frightens Alexis and Roderick.

- Alexis the Cat does NOT get eaten by Rex.
  - Alexis fears Rex.
  - Alexis frightens Clementine.
  - Alexis eats Roderick only.

- Poe the Raven is NOT eaten by Julia.
  - Poe fears Julia.
  - Julia frightens Poe.
  - Poe eats Clementine.

- Roderick the Rat fears Rex and Mad Mara.
  - Roderick is not prey to Rex.

- Mamba the Snake must frighten someone.
  - Mamba frightens Alexis and Poe.
  - Mamba eats Roderick and Clementine.

- Clementine the Spider fears Alexis.
  - Clementine frightens Madison and Mason.
  - Clementine is prey to Poe, Mamba, and Julia.

---

## 4. Conflict resolution behavior

Keep the existing centralized conflict resolver, but ensure it behaves correctly with the new matrix.

### Required behavior

- If A is PREDATOR of B:
  - B is eaten
  - B is permanently removed from play
  - Do NOT also apply fear between that same pair

- If A HUNTS B:
  - B flees
  - B is NOT removed from play

### Important

Predation and fear are different relationship types.
Because the data is now exclusive, the same pair should never have both.

Do not infer extra logic from species or card names.
Only use the explicit matrix.

---

## 5. Validation rules to add/update

Add validation that checks:

1. No overlap between huntIds and predatorIds
2. No overlap between dreadIds and preyIds
3. Reciprocal Hunt/Dread relationships exist
4. Reciprocal Predator/Prey relationships exist
5. All referenced Companion IDs exist
6. No self-references
7. Exactly 10 Companion definitions exist

Fail validation if any rule is violated.

Suggested validation intent:

- If CO-08 hunts CO-03, then CO-03 must dread CO-08
- If CO-10 preys on CO-09, then CO-09 must list CO-10 in PREY
- If CO-01 hunts CO-02, then CO-01 must NOT also list CO-02 in PREDATOR

---

## 6. Files/scope

Update only the parts of the codebase affected by Companion relationship data and logic.

Likely affected areas:
- Companion catalog / definitions
- Relationship validation
- Conflict resolution engine
- Automated tests
- Optional UI relationship display if it reads from the catalog

Do NOT change:
- Companion movement system
- Follower/Carrier handling
- Ghost Twins linked behavior
- Secret system
- Item system
- Spell system
- Black Mirror catalog
- Companion abilities

---

## 7. Regression tests to add/update

Add/update tests to verify the approved relationships:

### Rex
- Rex hunts Alexis
- Rex hunts Roderick
- Rex does NOT eat Alexis
- Rex does NOT eat Roderick

### Alexis
- Alexis dreads Rex
- Alexis dreads Mad Mara
- Alexis dreads Mamba
- Alexis hunts Clementine
- Alexis eats Roderick
- Alexis is NOT prey to Rex

### Poe
- Poe dreads Mamba
- Poe dreads Julia
- Poe eats Clementine
- Poe is NOT prey to Julia

### Roderick
- Roderick dreads Rex
- Roderick dreads Mad Mara
- Roderick is prey to Alexis, Mamba, Julia
- Roderick is NOT prey to Rex

### Mamba
- Mamba hunts Alexis
- Mamba hunts Poe
- Mamba eats Roderick
- Mamba eats Clementine

### Clementine
- Clementine dreads Alexis
- Clementine hunts Madison
- Clementine hunts Mason
- Clementine is prey to Poe, Mamba, Julia

### Julia
- Julia hunts Poe
- Julia eats Roderick
- Julia eats Clementine
- Julia does NOT eat Poe

### Global validation
- No character has overlap between HUNT and PREDATOR
- No character has overlap between DREAD and PREY
- Reciprocal relationships are valid

---

## 8. Expected report after implementation

After applying the correction, report only:

1. Files modified
2. Relationship matrix updated
3. Validation rules added/updated
4. Tests updated and results

Do not expand the scope.

END OF UPDATE