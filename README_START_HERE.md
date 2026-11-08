# The Mirrors — Codex Starter Kit

This package includes the complete development prompt (`AGENTS.md` and `CODEX_IMPLEMENTATION_BRIEF.md`), the 155-card conceptual JSON catalog, the previous rulebook and anatomy reference, and design sketches.

## Get started in VS Code

1. Extract the contents of this ZIP into a **new** folder (for example, `the-mirrors`). Open that folder in VS Code.
2. Open **Codex** in VS Code, give it access to this workspace, and paste this message:

> Read AGENTS.md and all relevant files under reference/. Build the playable browser game "The Mirrors" according to the implementation brief. Start by inspecting the workspace, documenting provisional rules, and implementing Phase 1 immediately. Continue iteratively; run the project and tests after each phase. Do not stop at a plan or static mockup.

3. After Codex generates the application, run `pnpm install` and `pnpm dev` in the VS Code terminal, then open the local URL shown by Next.js.
4. For a longer task that cannot fit in one agent session, ask: "Continue with the next unfinished phase in AGENTS.md; check existing tests and RULES_STATUS before changing anything."

## Source-of-truth notes

- Follow CONFIRMED rules in AGENTS.md before older rulebook drafts.
- White Mirrors reveal **all** their printed discoveries. Any contradictory sample wording in illustrated card art is obsolete.
- Source file `reference/The_Mirrors_Conceptual_Card_Catalog_v0.2.json` contains **155 proposed cards**; treat individual abilities as provisional playtest content.
- The ZIP provides reference source data, NOT a prebuilt working game. Codex will implement the game using the instructions.
