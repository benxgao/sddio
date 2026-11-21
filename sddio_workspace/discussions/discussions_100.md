<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

## <!-- entry -->

id: DISC-001
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

<!-- entry -->
---
id: DISC-027
type: concern
status: open
refs: [SPEC-005]
---

## Who bumps the version

Undefined today. The version lives in `packages/cli/package.json`; there is no changesets setup; a `v*` tag
is what publishes, and it has to match the file.

Options:

1. **Manual bump in the release PR** — explicit, reviewable, no write-back token.
2. **CI bump and commit** — needs `contents: write`, writes to master, complicates branch protection.

Recommendation: option 1. CI asserts the version is greater than the published one, and tags `v<x.y.z>` only after a successful publish.

<!-- entry -->
---
id: DISC-028
type: concern
status: open
refs: [ADR-002, ADR-003]
---

## Template resolution from `dist/` breaks easily

`ADR-002` publishes prebuilt `dist/` output; `ADR-003` requires templates to be resolved relative to the package root, never from the consumer repo. The two combine awkwardly:

- ESM has no `__dirname`, so the root must be derived from `import.meta.url` — which yields the *location of the executing file*.
- If `tsc` emits nested files (`dist/commands/init.js`), a naive `../templates` resolves to `dist/templates` and init fails only at runtime, only in the packed artefact.
- If `bin/sddio.js` is a separate wrapper outside `dist/`, its depth differs again.
- `files` must include `templates`, or the path exists in development and vanishes when packed.

Unit tests over `lib/` cannot catch any of this.

Recommendation: a single module that computes the package root once, every other module importing it; plus a CI step that runs `sddio init --dry-run` in a scratch directory from the *packed tarball*, not from source.

<!-- entry -->
---
id: DISC-030
type: concern
status: open
refs: [ADR-002]
---

## Packing behaviour for dot directories and empty directories (verified)

Verified with a real `npm pack` on a synthetic package using `files: ["templates"]`:

- Dot directories survive — `templates/.sddio/...` and the nested `.schema/` both land in the tarball. The layout this project depends on is packable.
- Nested `.gitignore` files are **silently dropped**; only a root `.gitignore` is renamed to `.npmignore`.
- `.DS_Store` is dropped automatically.
- `README.md` and `LICENSE` are included even when absent from `files`.
- Empty directories cannot be represented, so any structure held open by 0-byte files or `.gitkeep` disappears — which is why the workspace layout is created in code, not shipped as files.

Implication: a green build does not prove the artefact is correct. CI should assert packed contents (`tar -tzf` must contain `package/templates/.sddio/context/instructions/.schema/adr.md`), and the local manual must exercise the `.tgz` rather than `npm link`.

<!-- entry -->
---
id: DISC-031
type: concern
status: open
refs: [SPEC-005, SPEC-009, ADR-002]
---

## Publication metadata is missing

- `packages/cli/package.json` is 0 bytes: no `name`, `version`, `bin`, `files`, `engines`, `repository`, `license`. `ADR-002` already decided the values (TypeScript to `dist/`, ESM, `node >=18`, `bin` on `dist/`), but none are written down in a manifest yet.
- `SPEC-009` requires each package `README.md` to state its purpose in one sentence; `packages/cli/README.md` is 0 bytes.
- No `LICENSE` anywhere in the repo. A public package without one is a licensing gap and npm shows it as unlicensed.
- `.gitignore` does not cover `*.tgz`, so local tarball testing leaves untracked artefacts.
- `packages/dashboard/` holds two 0-byte files, which is what `SPEC-009` calls a placeholder — acceptable, but it must stay out of any build matrix.

Recommendation: fill the manifest from `ADR-002` with `files: ["dist", "templates"]` and `publishConfig.access: public`, add an MIT `LICENSE`, write the one-sentence README, and add `*.tgz` to `.gitignore`.

<!-- entry -->
---
id: DISC-032
type: concern
status: open
refs: [SPEC-010]
---

## `config.json` declares `schemaVersion: 1`, the instructions declare 2

- `instructions.md` and `SPEC-010` both describe cursor schema version 2.
- The tracked `.sddio/context/config.json` still says `"schemaVersion": 1`.
- Both cursor fields are present, so nothing breaks today — only the declaration disagrees.
- No migration exists: `sync-templates.mjs` copies the field verbatim into `templates/.sddio`.
- Options: bump the file to 2, or lower the documented version back to 1.
- Recommendation: bump the file, and have `sync` write the documented version instead of copying it.


<!-- entry -->
---
id: DISC-033
type: question
status: open
refs: [ADR-009]
---

## Does every rule need a command, or one check command

- ADR-009 makes a command the price of a rule and leaves `sddio check` unbuilt.
- `docs/distribution.md` still lists "no `check` command" as the known gap: a drifted workspace cannot
  fail CI.
- Option 1: keep it unbuilt — the cursor diff in `reconciliation.md` is the whole check, two lines.
- Option 2: a `check` subcommand printing the cursor diff and the dead references; one command, no daemon.
- Cost of option 2: a maintenance surface in a package that otherwise only writes files.
- Either way closes when a consumer reports a drift a command would have caught.
