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

`sddio init` creates `.sddio/` and `sddio_workspace/` at the root of the consumer project repository.

`sddio_workspace/` has the same folder and file structure as `packages/cli/templates/sddio_workspace/`; `.sddio/` is copied from `packages/cli/templates/.sddio/`.

Because the templates ship inside the published npm package, template paths are resolved relative to the package artefact rather than assumed to be fixed repository paths.

<!-- entry -->
---
id: SPEC-002
type: requirement
status: active
refs: []
---

## Seed files created by `sddio init`

Init creates the entry home files `spec/spec_100.md`, `adr/adr_100.md`, and `discussions/discussions_100.md`, plus the FLOW template. It otherwise creates directories only and ships no other empty placeholder files.

The bootstrap SPEC is written to `spec/spec_100.md` on demand.

<!-- entry -->
---
id: SPEC-003
type: requirement
status: active
refs: []
---

## Non-destructive init

By default `sddio init` creates only missing files and never overwrites existing ones. `.sddio/` may be overwritten; `sddio_workspace/` is never overwritten.

`--force` overwrites existing files and `--dry-run` previews the outcome. The command prints a per-file summary (created / skipped / overwritten) and exits non-zero on partial failure.

<!-- entry -->
---
id: SPEC-004
type: requirement
status: active
refs: []
---

## `AGENTS.md` registration

`AGENTS.md` is the single canonical entry point; no other assistant files are registered.

Init ensures the file contains the sddio snippet: when `AGENTS.md` is absent it is created with only the snippet, otherwise the snippet is appended to the end. The snippet is delimited by `<!-- sddio:begin -->` and `<!-- sddio:end -->`, so registration is detectable, idempotent, and updatable.

<!-- entry -->
---
id: SPEC-005
type: constraint
status: active
refs: []
---

## Template packaging and invocation modes

Templates ship inside the published npm tarball, which is what allows `sddio init` to copy them into `.sddio/` and `sddio_workspace/`.

The CLI must work when invoked as `npx @sddio/cli`, as a `devDependency` of the consumer repository, and as a global install. `npx` and `devDependency` are the supported modes at this stage.

<!-- entry -->
---
id: SPEC-006
type: requirement
status: active
refs: []
---

## Instructions are package-owned

The shipped `.sddio/context/*` instructions are package-owned, not user-editable: the CLI updates them when the consumer upgrades `@sddio/cli`.

An upgrade also triggers reconciliation, which compares the changes since the last processed commit and plans how to bring project artifacts in line with the updated templates.

<!-- entry -->
---
id: SPEC-007
type: requirement
status: active
refs: []
---

## Version control

Both `.sddio/` and `sddio_workspace/` are committed to the consumer repository by default, unless the user decides otherwise. `sddio init` performs no git actions, including no `.gitignore` edits.

FLOW files are committed while active and moved to `flow/completed/` in the same change that completes the work.

<!-- entry -->
---
id: SPEC-008
type: requirement
status: active
refs: []
---

## Entry identifiers

IDs use fixed prefixes with zero-padded three digits: `SPEC-001`, `ADR-001`, `DISC-001`. Coding agents assign IDs; the CLI does not.

Entries are append-only within a file and never renumbered. Numbering stays sequential across files, and a new numbered file is created only when 100 entries are reached. `refs` contain IDs only, never file paths or prose.

<!-- entry -->
---
id: SPEC-009
type: constraint
status: active
refs: []
---

## Repository package placeholders

`packages/dashboard` is retained as an empty placeholder until there is a clear vision for it. No root workspace `package.json` is introduced at this stage.

Each package carries a `README.md` stating its purpose in one sentence.
