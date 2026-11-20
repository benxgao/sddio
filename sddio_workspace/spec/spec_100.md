<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

<!-- entry -->
---
id: SPEC-001
type: requirement
status: active
refs: []
---

## Project initialization layout

- `sddio init` creates `.sddio/` and `sddio_workspace/` at the repository root.
- `.sddio/` is a byte-for-byte copy of this repository's root `.sddio/`.
- Ships inside the package as `templates/.sddio/` (ADR-005).
- Paths resolve relative to the package artefact, not to fixed repository paths.
- `sddio_workspace/` mirrors this repository's layout: `spec/`, `adr/`, `discussions/`.
- Created from `lib/workspace.ts`, not copied from the package.

<!-- entry -->
---
id: SPEC-002
type: requirement
status: active
refs: []
---

## Seed files created by `sddio init`

- Seeds:
  - `spec/spec_100.md`, `adr/adr_100.md`, `discussions/discussions_100.md`
- Every seed is empty (0 bytes) — the workspace belongs to the consumer project.
- Apart from these seeds, init creates directories only.
- The bootstrap SPEC is written to `spec/spec_100.md` on demand.

<!-- entry -->
---
id: SPEC-003
type: requirement
status: active
refs: []
---

## Non-destructive init

- Default: create missing files only, never overwrite existing ones.
- `.sddio/` may be overwritten; `sddio_workspace/` is never overwritten.
- `--force` overwrites existing files.
- `--dry-run` previews the outcome.
- Prints a per-file summary: created / skipped / overwritten.
- Exits non-zero on partial failure.

<!-- entry -->
---
id: SPEC-004
type: requirement
status: active
refs: []
---

## `AGENTS.md` registration

- `AGENTS.md` is the single canonical entry point; no other assistant files are registered.
- Absent file: created with the snippet only.
- Existing file: snippet appended at the end.
- Delimiters: `<!-- sddio:begin -->` and `<!-- sddio:end -->`.
- Registration is detectable, idempotent, and updatable.

<!-- entry -->
---
id: SPEC-005
type: constraint
status: active
refs: []
---

## Template packaging and invocation modes

- Templates ship inside the published npm tarball — that is what `sddio init` copies.
- Required invocation modes: `npx @sddio/cli`, consumer `devDependency`, global install.
- Supported at this stage: `npx` and `devDependency`.

<!-- entry -->
---
id: SPEC-006
type: requirement
status: active
refs: []
---

## Instructions are package-owned

- Shipped `.sddio/context/*` instructions are package-owned, not user-editable.
- The CLI updates them when the consumer upgrades `@sddio/cli`.
- An upgrade also triggers reconciliation against changes since the last processed commit.
- Reconciliation plans how to bring project artifacts in line with the updated templates.

<!-- entry -->
---
id: SPEC-007
type: requirement
status: active
refs: []
---

## Version control

- `.sddio/` and `sddio_workspace/` are committed by default, unless the user decides otherwise.
- `sddio init` performs no git actions of its own, including no `.gitignore` edits.
- The one exception is a chosen hook: installing `flow-trail` runs its bootstrap, which uses git.
- Work in progress is committed in `flow-trail/`, by flow-trail's own rules (ADR-011).

<!-- entry -->
---
id: SPEC-008
type: requirement
status: active
refs: []
---

## Entry identifiers

- Prefixes: `SPEC-`, `ADR-`, `DISC-`.
- Format: zero-padded three digits — `SPEC-001`.
- Coding agents assign IDs; the CLI does not.
- Entries are append-only within a file and never renumbered.
- Numbering stays sequential across files.
- A new numbered file is created only when 100 entries are reached.
- `refs` contain IDs only — never file paths or prose.

<!-- entry -->
---
id: SPEC-009
type: constraint
status: active
refs: []
---

## Repository package placeholders

- `packages/dashboard` is an empty placeholder until there is a clear vision for it.
- No root workspace `package.json` at this stage.
- Each package `README.md` states its purpose in one sentence.

<!-- entry -->
---
id: SPEC-010
type: requirement
status: active
refs: [SPEC-006, SPEC-007, ADR-006]
---

## Commit cursor drives reconciliation

- `.sddio/context/config.json` is the reconciliation cursor, schema version 3.
- `reconcileCursor.lastProcessedCommit` is `HEAD` after a completed reconciliation.
- `reconcileCursor.previousCommit` is its parent, kept as the anchor for a rewritten tip.
- Every session compares the cursor with `HEAD` before doing work.
- Cursor equals `HEAD` — no reconciliation.
- Cursor is an ancestor — reconcile `reconcileCursor.lastProcessedCommit..HEAD`.
- Cursor exists, not an ancestor — reconcile the rewritten range.
- Cursor is gone — reconcile from `reconcileCursor.previousCommit`.
- No usable cursor — verify artifacts against the current implementation.
- The cursor advances only after reconciliation completes.
- Both fields ship as `null`; the first run establishes a baseline.
- `sddio init` overwrites `config.json` except `hooks`, so an upgrade resets the cursor.
- An upgrade is therefore followed by one baseline reconciliation (SPEC-006).

<!-- entry -->
---
id: SPEC-011
type: requirement
status: active
refs: [SPEC-002, SPEC-003, ADR-005]
---

## `init` ends with the agent's next step

- `init` prints a prompt framed `Paste this into your coding agent` when it changed anything.
- The prompt is self-contained: entry point, commit check, bootstrap, cursor update.
- Files created — bootstrap prompt; SPEC is derived from the repository.
- Only `.sddio/` refreshed — reconcile prompt; the cursor is `null`, so the state is `unknown`.
- Nothing changed — `Already up to date`, and no prompt.
- `--dry-run` — no prompt; it tells the user to re-run without the flag.
- Prompt text lives in `lib/prompt.ts`.
- `test/prompt.test.mjs` asserts the README copies stay identical to it.
- The prompt is text only; `init` never invokes an agent.

<!-- entry -->
---
id: SPEC-013
type: requirement
status: active
refs: [SPEC-001, SPEC-006, ADR-008]
---

## The agent skill is printed, never installed

- The skill ships as `.sddio/skill/SKILL.md` and travels with the package.
- `sddio skill --print` writes it to stdout and nothing else.
- Hints go to stderr, so a redirect captures only the skill.
- The CLI never scans an agent's configuration directories.
- The CLI never writes outside the target repository.
- The skill names paths and invariants only; rules and formats stay in `instructions.md`.
- The skill contains no sddio command.
- `init` copies the file into the project; that is the only installation step.

<!-- entry -->
---
id: SPEC-016
type: requirement
status: active
refs: [SPEC-011]
---

## Bootstrap records at least one open question

- Bootstrap always writes at least one `DISCUSSION` entry.
- It records the most material gap — the answer that would change future work.
- Further entries only when each changes a different decision; this is a floor, not a quota.
- No decorative question is recorded to satisfy the rule.
- Selection criteria live in `instructions/bootstrap.md` under "Honest First Screen".
- The bootstrap prompt carries the step before the cursor update (SPEC-011).
- Rationale: a first view of claims only overstates what the repository proves.


<!-- entry -->
---
id: SPEC-017
type: constraint
status: active
refs: [ADR-009]
---

## Evidence is a separate fact from the writing

- A shipped rule whose claim can be checked names the command and the expected value.
- A rule that cannot be checked says it is judgement, rather than inventing a command.
- A work record keeps a before-number and an after-number, each with the command that produced it.
- A phase is done when its command ran, not when its work was written.
- A closed work record names what it did not finish and who owes the remainder.
- A rule not followed in the last three records is deleted, not restated.

<!-- entry -->
---
id: SPEC-018
type: requirement
status: active
refs: [ADR-011]
---

## `init` declares a hook, and installs the one chosen

- `init` asks one question when stdin and stdout are both terminals: which hook triggers reconciliation.
- The default answer is `flow-trail`; the other answer is `none`.
- Choosing `flow-trail` installs it into the target project by running flow-trail's own bootstrap.
- `--hook <name>` answers without asking; `--no-install` declares without installing.
- `--yes` gives the default answer without asking, and installs like any other answer.
- Without a terminal and without `--yes`, the default is declared and nothing is installed.
- The answer is written to `hooks` in `.sddio/context/config.json`.
- A later `init` keeps the declared hooks instead of asking again.
- An installer failure is reported and does not roll back the declaration.
