---
name: sddio
description: Read and maintain this repository's sddio project knowledge (SPEC, ADR, DISCUSSION) when answering why something is built this way, recording a decision, or changing an existing convention. Applies only when the repository root contains .sddio/.
---

# sddio

The authoritative content lives in the repository. This file only points at it.

## Check that it applies

- Continue only if `.sddio/context/instructions.md` exists at the repository root.
- If it does not, ignore this skill: the project does not use sddio.

## Read

- List entries: `grep -rn "^## " sddio_workspace/*/` gives one ID and title per entry.
- Read one entry by its surrounding 25 lines. Do not read a whole collection to find one entry.
- Load `.sddio/context/instructions.md` only when the format or the procedure matters.

## Write

- Classify before writing: requirement, decision, unresolved, or work in progress.
- Append a new entry. Never rewrite an earlier one.
- The one sanctioned removal: an entry promoted into a `SPEC` or `ADR` is deleted, and its ID is burned.
- IDs increase and are never reused, including IDs that were removed.
- After reconciliation completes, record the commit in `.sddio/context/config.json`.

## Boundaries

- Do not copy project facts into this skill.
- Do not create entries for completeness or symmetry.
- Do not advance the cursor when reconciliation was skipped or partial.
