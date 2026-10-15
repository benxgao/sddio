<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

## <!-- entry -->

id: DISC-003
type: question
status: open
refs: []

---

## `sddio init` target root, and a circular sentence in init_repo.md

init_repo.md states that `sddio init` creates "a new folder named as `sddio_workspace` which has the same folder/file structure like the `sddio_workspace` in the consumer project repo, which has installed the package `@sddio/cli`". The consumer repository _is_ the repository being initialized, so this reads as circular.

Questions:

- My reading: it means "same structure as `packages/cli/templates/sddio_workplace/`" (i.e. the template is the single source of truth). Confirm or correct.
- What exactly is "the root of the consumer project repo" when the command runs in: a monorepo sub-package, a directory that is not a git repository, or a home directory?
- Should the target be the current working directory, the nearest git root, the nearest `package.json` root, or configurable (`--cwd <path>` / positional argument)?

Answers:

- A folder `sddio_workspace` should be created at the root of the consumer project repo, and its content should be the same as that inside `packages/cli/templates/sddio_workspace/`. As it is going to bepackaged into the npm package, the templates/sddio_workspace paths may vary depends on the npm artefact, and the cli script should handle it well.

## <!-- entry -->

id: DISC-004
type: question
status: open
refs: []

---

## Two-root layout: why `.sddio/` **and** `sddio_workspace/`?

Current layout at the repository root:

- `.sddio/context/` — `config.json`, `instructions.md`, `instructions/*.md`, `principles.md`, `preferences.md`, `roadmap.md`, `routes/routes.md`
- `sddio_workspace/` — `spec/`, `adr/`, `discussions/`, `flow/`

Questions:

- Is the split intentional (hidden machine/config layer vs. visible human workspace)? What is the rationale?
- Which root do humans own, and which may the CLI overwrite on a future update (see DISC-010)?
- Which root is expected to be committed to the consumer repository (see DISC-020)?
- Could both live under a single root (e.g. `sddio_workspace/.sddio/`), or is the split a deliberate boundary?

Answers:

- The split is intentional, and the rationale is to separate the hidden machine/config layer (mainly controlled by sddio npm cli) vs. visible human workspace (mainly contrlled by the user and their coding agents). The CLI may overwrite the `.sddio/` root on a future update (npm version controlled). Both `.sddio/` and `sddio_workspace/` root are recommended to be committed to the consumer git repository.
- `sddio_workspace` is the human workspace root, and `.sddio` is the machine/config root.
- Potentially both could live under a single root, but the split is a deliberate boundary to separate machine/config layer vs human workspace layer, to reduce distraction and the risk of accidental overwrites and to make it clear which files are user-owned vs CLI-owned.

## <!-- entry -->

id: DISC-007
type: question
status: open
refs: []

---

## `flow/reconciliation/` and the reconciliation artifact

The template contains `templates/sddio_workplace/flow/reconciliation/template.md`, but this repository's `sddio_workspace/flow/` has no `reconciliation/` folder. `instructions/reconciliation.md` describes a process but never names a persistent artifact.

Questions:

- Is a reconciliation record a real artifact type (a fifth role besides SPEC/ADR/DISCUSSION/FLOW)?
- Does it need a schema (`.schema/reconciliation.md`), a routes entry, and an ID prefix (`RECON-*`)?
- Should `sddio init` create `flow/reconciliation/`, and should the placeholder be named `template.md` or follow the numbered convention (`reconciliation_100.md`)?
- `reconciliation.md` lists only SPEC/ADR/DISCUSSION/FLOW as artifacts to check — is the reconciliation folder stale?

Answers:

- reconciliation is similar like the execution/rollout plans in active flow, and it is not a persistent artifact type. It is a temporary artifact to record the reconciliation process, and it will be moved to the completed/reconciliation flow with files named like date_commit_5_digits.md.
- At some point, we would let config.json record the last processed commit, and the reconciliation flow will be used to reconcile the changes between the last processed commit and the current commit, and generate a execution plan to sync spec/adr/discussions/spec to get docs updated. The reconciliation flow is not a persistent artifact type, so it does not need a schema, routes entry, or ID prefix.

## <!-- entry -->

id: DISC-008
type: question
status: open
refs: []

---

## Should init seed a SPEC entry file?

`adr/adr_100.md` and `discussions/discussions_100.md` exist (currently empty) in both this repository and the template, but `spec/` is empty in both.

Questions:

- Should `sddio init` create `spec/spec_100.md` so SPEC entries have a home file by convention?
- If not, where is the bootstrap SPEC (see DISC-017) supposed to be written — a new file created on demand, or `spec/spec_100.md`?
- Are empty placeholder files expected to be shipped to users at all, or should init create only directories plus the FLOW template?

Answers:

- `sddio init` should create `spec/spec_100.md` so SPEC entries have a home file by convention. The bootstrap SPEC will be written to `spec/spec_100.md` on demand. Empty placeholder files are expected to be shipped to users, but init should create only directories plus the FLOW template, and not create empty placeholder files.
- as well as discussions/discussions_100.md and adr/adr_100.md, init should create spec/spec_100.md as well.

## <!-- entry -->

id: DISC-009
type: question
status: open
refs: []

---

## Behaviour when targets already exist (data-safety default)

`init_repo.md` does not define what happens when `sddio_workspace/` or `.sddio/` already exist. `sddio_workspace/` holds user-authored artifacts (`adr/`, `discussions/`, `flow/`), so a blind copy is a data-loss risk.

Options:

- A — abort with a clear error and a hint to use `--force`
- B — create only missing files, never overwrite existing ones (default)
- C — overwrite everything
- D — merge: overwrite template-owned files only, leave user-owned files untouched

Questions:

- Which is the intended default? My recommendation is B as default, with `--force` (overwrite) and `--dry-run` (preview) flags.
- Can you confirm the file ownership split — which paths are template-owned (safe to update) vs user-owned (never touched)?
- Should the command print a per-file summary (created / skipped / overwritten) and a non-zero exit code on partial failure?

Answers:

- `.sddio` can be overwritten safely, but `sddio_workspace` should never be overwritten. The default behaviour should be B (create only missing files, never overwrite existing ones), with `--force` (overwrite) and `--dry-run` (preview) flags. The command should print a per-file summary (created / skipped / overwritten) and a non-zero exit code on partial failure.

## <!-- entry -->

id: DISC-010
type: question
status: open
refs: []

---

## Template drift: copy-once or an upgrade path?

Because `.sddio/context/*` is _copied_ into the consumer repository, every consumer's instructions will drift from later `@sddio/cli` releases.

Questions:

- Is there a planned `sddio update` / `sddio upgrade` (re-copy, diff-and-ask, or three-way merge), or is copy-once the accepted tradeoff and reconciliation is left to the AI?
- If no upgrade path exists yet, should `.sddio/context/config.json` record the CLI/template version so drift can be detected later?
- Should the shipped instructions be treated as user-editable (then never auto-updated) or as package-owned (then updatable)?

Answers:

- Whenever user upgrade @sddio/cli package version, reconciliation flow will be triggered to check the changes between the last processed commit and the current commit, and generate a execution plan to sync spec/adr/discussions/spec to get docs updated. The CLI will print a per-file summary (created / skipped / overwritten) and a non-zero exit code on partial failure.
- The shipped instructions should be treated as package-owned (then updatable), and the CLI will update the instructions when user upgrade @sddio/cli package version.

## <!-- entry -->

id: DISC-011
type: question
status: open
refs: []

---

## AGENTS.md registration: exact content, placement, idempotency

`packages/cli/lib/init.ts` is documented as "Ensure AGENTS.md has registered sddio instructions for the new project", but the content is undefined.

Questions:

- How do we detect "already registered"? Exact-text match, or managed markers such as `<!-- sddio:begin -->` / `<!-- sddio:end -->` (safer for future updates)? Do you accept adding markers?

Answers:

- `init.ts` would be triggered when user run `sddio init` command after the package is installed, and it will ensure AGENTS.md has registered sddio instructions for the new project. The CLI will check if the AGENTS.md already contains the sddio snippet, and if not, it will append the snippet to the end of AGENTS.md. The CLI will add markers `<!-- sddio:begin -->` / `<!-- sddio:end -->` to indicate the start and end of the snippet, so that future updates can be done safely.

## <!-- entry -->

id: DISC-012
type: question
status: open
refs: []

---

## Registration scope: missing AGENTS.md and other assistant files

Questions:

- If `AGENTS.md` does not exist, should `sddio init` create it (containing only the sddio snippet) or skip with a warning?
- If `AGENTS.md` exists with unrelated content, should the snippet be appended, prepended, or written into a new section?
- Is `AGENTS.md` the single canonical entry point, or should init also register with other assistants? Root `.gitignore` ignores `.cursor/`, `.continue/`, `.windsurf/`, `.aider*`, `.clinerules`, `.cursorrules`, which suggests several tools are used.

Answers:

- If `AGENTS.md` does not exist, `sddio init` should create it (containing only the sddio snippet). If `AGENTS.md` exists with unrelated content, the snippet should be appended to the end of the file.
- `AGENTS.md` is the single canonical entry point, and init should not register with other assistants.

## <!-- entry -->

id: DISC-013
type: question
status: open
refs: []

---

## Scope of CLI scaffolding in this rollout

Current state: `packages/cli/lib/init.ts` is a comment-only stub, `packages/cli/package.json` is empty (no `bin`, no `files`, no `scripts`, no dependencies), and there is no `tsconfig.json`, build config, or test setup.

Questions:

- Does this rollout include the full CLI skeleton (`bin` entry, command dispatch, argument parsing, error handling, exit codes) or only the body of the init module?
- Language/build: TypeScript compiled to `dist/` or plain JS? ESM or CommonJS? If TypeScript, is `tsc` alone acceptable (zero runtime dependencies), or do you want a bundler?
- `preferences.md` says "avoid unnecessary dependencies" — may I use a small argument parser (e.g. `commander`), or must argument handling be dependency-free (`process.argv`)?
- What Node version range should `engines` declare, and must the CLI run via `npx` without a build step?

Answers:

- This rollout includes the full CLI skeleton, including `bin` entry, command dispatch, argument parsing, error handling, and exit codes. The CLI should be written in TypeScript compiled to `dist/` with ESM module format. `tsc` alone is acceptable, and a small argument parser (e.g. `commander`) may be used. The CLI should run via `npx` without a build step, and the Node version range should be declared in `engines` field of `package.json`.
- Node version range should be `>=18.0.0` to ensure compatibility with ESM and modern JavaScript features.

## <!-- entry -->

id: DISC-014
type: question
status: open
refs: []

---

## Template resolution and packaging

- Confirm the templates must ship inside the published npm tarball (`files` must include `templates/`), and that paths are resolved relative to the package root (`import.meta.url` / `__dirname`), never relative to `process.cwd()`.
- Should templates ever be fetched remotely or read from the consumer's own repository? (My assumption: no.)
- Must init work in all three invocation modes — `npx @sddio/cli`, a `devDependency` installed in the consumer repo, and a global install?
- Should the CLI verify template integrity (e.g. required files present) before copying, and fail loudly if the package is incomplete?

Answers:

- The templates must ship inside the published npm tarball, where the purpose of that is to ensure the templates can be copied to `.sddio` via running `sddio init` command.
- At this stage, `npx @sddio/cli` is a `devDependency` installed in the consumer repo. It is not expected to be a global install at this stage, but it should work in all three invocation modes.

## <!-- entry -->

id: DISC-015
type: question
status: open
refs: []

---

## Placeholder packages and monorepo tooling

Empty (0-byte) files: root `package.json`, root `README.md`, `packages/cli/README.md`, `packages/cli/package.json`, `packages/dashboard/{README.md,package.json}`.

Questions:

- Keep `packages/dashboard` as an empty placeholder in this rollout (init_repo.md says it is not planned until there is a clear vision), or remove it until then?
- `preferences.md` says pnpm and monorepo are "not now, preferred later", yet `packages/*` already exists. Is a root workspace `package.json` (`private: true` + workspaces) in scope now, or explicitly later?
- If the root `package.json` is not created now, is that intentional (no root scripts, no shared tooling), and does the empty root `README.md` need content (overview, install, usage) as part of this rollout?
- Should `packages/*` have any minimal required shape even before implementation — e.g. a `README.md` with one sentence of purpose?

Answers:

- `packages/dashboard` should be kept as an empty placeholder in this rollout.
- A root workspace `package.json` is not in scope now, and the empty root `README.md` does not need content as part of this rollout.
- `packages/*` should have a minimal required shape even before implementation, with a `README.md` containing one sentence of purpose.

## <!-- entry -->

id: DISC-016
type: question
status: open
refs: []

---

## Ownership of `.sddio/context/config.json`

Contents: `schemaVersion: 1` and `lastProcessedCommit: "abc123..."` (an obvious placeholder).

Questions:

- Who writes `lastProcessedCommit` — the CLI at init time (recorded git HEAD) or the AI during reconciliation? When is it updated afterwards?
- Does the CLI read this file at this stage, or is it documentation-only for now?
- Should init write the real HEAD commit and the CLI version, or leave placeholders untouched?
- Is there a migration story when `schemaVersion` changes (who upgrades existing consumer configs — the CLI, or the AI)?

Answers:

- Ignore this question for now, as the reconciliation flow is to be planned.

## <!-- entry -->

id: DISC-017
type: question
status: open
refs: []

---

## Ordering: bootstrap SPEC and required ADR before executing init_repo

- `instructions.md` says: "If no usable `SPEC` exists, load `instructions/bootstrap.md`" — `spec/` is currently empty.
- `roadmap.md` says: "Before implementing a roadmap item, create the required discussion and ADR." `instructions/adr.md` says an ADR is required when a decision affects architecture, system boundaries, or major technology choices — "@sddio/cli initializes projects by copying templates" plausibly qualifies.

Questions:

- Do you want a bootstrap SPEC generated for this repository before executing `init_repo`?
- Should `init_repo.md` be executed as the active FLOW now, or only after the SPEC (and any required ADR) exists?
- Should an ADR be recorded first for the two architectural decisions implied here — (a) copy-based initialization vs. referencing templates at runtime, (b) `.sddio/` + `sddio_workspace/` two-root layout?
- Is executing `init_repo` itself expected to produce any new artifacts (ADR/SPEC) as part of its scope?

Answers:

- A bootstrap SPEC should be generated for this repository before executing `init_repo`.
- `init_repo.md` should not be executed as the active FLOW for now
- An ADR should be recorded only in `sddio_workspace/`, `.sddio/` is used for machine/config layer, and `sddio_workspace/` is used for human workspace layer. The two-root layout is a deliberate boundary to separate machine/config layer vs human workspace layer, to reduce distraction and the risk of accidental overwrites and to make it clear which files are user-owned vs CLI-owned.
- No new artifacts (ADR/SPEC) are expected to be produced as part of executing `init_repo` for now.

## <!-- entry -->

id: DISC-018
type: question
status: open
refs: []

---

## FLOW document conformance and naming

- `flow/active/init_repo.md` is titled "Rollout plan of init_repo"; `flow/active/template.md` is titled "Rollout: <Short Title>" and declares `schema: 0.1.0`.
- `init_repo.md` has no Summary, Scope, Phases, Verification, Success Criteria, or Rollback sections.

Questions:

- Must every FLOW file follow the template structure exactly, and should `init_repo.md` be rewritten to conform before or during execution?
- Does FLOW need its own schema file (`.schema/flow.md`)? `entries.md` defines schemas only for ADR, DISCUSSION, and SPEC.
- What is the FLOW file naming convention? `routes.md` mentions a `FLOW-*` ID, but actual files are slug-based (`init_repo.md`). Confirm slug naming (`<slug>.md`), and whether FLOW entries need IDs at all.
- Who may start a FLOW — the AI automatically, or only after user confirmation?
- Is `init_repo.md` considered a FLOW or a "rollout plan" (a distinct artifact type)? Its title suggests the latter.

Answers:

- Every FLOW file does not have to follow the template structure exactly.
- FLOW does not need its own schema file, and the FLOW entries do not need IDs at all. The slug naming convention is confirmed.
- flow files should not be referred in the spec system including routes.md. as flow files are not considered as a persistent artifact type, and they are not expected to be referred in the spec system.
- The AI may start a FLOW automatically, but user confirmation is preferred.
- flow files are considered as a rollout plan.

## <!-- entry -->

id: DISC-019
type: question
status: open
refs: []

---

## FLOW "Open Questions" vs DISCUSSION IDs

The FLOW template's Open Questions section uses a `C-XXXX` ID scheme and states that blocking questions must be answered by the user before the dependent phase starts.

Questions:

- Should those questions live as DISCUSSION entries (referenced via `refs`) instead, so there is only one question-ID system?
- If both are kept, what is the boundary: `C-*` for phase-blocking questions only, `DISC-*` for durable open knowledge?
- In this repository, should the questions in this file be referenced from `init_repo.md` (e.g. `refs: [DISC-001..DISC-022]`), or left unlinked?

## <!-- entry -->

id: DISC-020
type: question
status: open
refs: []

---

## Git and version-control policy for generated folders

Neither `.sddio/` nor `sddio_workspace/` is ignored by root `.gitignore` (which currently ignores `.history/`, and several AI-tool folders).

Questions:

- Confirm both `.sddio/` and `sddio_workspace/` are meant to be committed in a consumer repository.
- Should `sddio init` ever touch `.gitignore` (for example to add `.history/`), or perform no git-related action at all?
- Is `.history/` (editor-generated snapshots) expected to appear in consumer projects too, or is it specific to this authoring repository?
- Are FLOW files committed while active and moved to `flow/completed/` in the same change that finishes the work?

Answers:

- Both `.sddio/` and `sddio_workspace/` are recommended to be committed in a consumer repository by default, unless the users specify otherwise.
- `.history/` is specific to this authoring repository, and it is not expected to appear in consumer projects.
- FLOW files are committed while active and moved to `flow/completed/` in the same change that finishes the work.

## <!-- entry -->

id: DISC-022
type: question
status: open
refs: []

---

## Entry IDs: format, ownership, ordering

- `entries.md` examples show `adr_100.md → ADR 001–100` and `discussions_100.md → DISC 001–100`.
- `routes/routes.md` lists prefixes `SPEC-*`, `ADR-*`, `DISC-*`, `FLOW-*`.

Questions:

- Confirm the ID format is zero-padded three digits (`DISC-001`, `ADR-001`, `SPEC-001`), and confirm the prefix spelling.
- Who assigns IDs — the AI, or the CLI? `init_repo.md` describes a CLI that only copies files, so I assume the AI assigns IDs.
- Confirm entries are append-only within a file, never renumbered, and that the next numbered file is created only when 100 entries are reached.
- Should `refs` contain IDs only (never file paths or prose)?
- Since this file has no entries yet, is entry numbering independent per file (in which case it stays sequential across files)?

Answers:

- The ID format is zero-padded three digits (`DISC-001`, `ADR-001`, `SPEC-001`), and the prefix spelling is confirmed.
- Coding agents.
- IDs only, never file paths or prose.
- It stays sequential across files.
