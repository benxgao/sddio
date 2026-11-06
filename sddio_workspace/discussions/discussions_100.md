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
id: DISC-023
type: concern
status: open
refs: [SPEC-009]
---

## Root `package.json` is invalid JSON and blocks every npm command

The tracked root `package.json` is a 0-byte file, so it is not valid JSON. Every Node and npm invocation started inside the repository aborts before doing any work:

```text
Error: Invalid package config /Users/benxgao/workspace/sddio/package.json
code: 'ERR_INVALID_PACKAGE_CONFIG'
```

Reproduced with `npm view` and `node -e`. It is not scoped to `packages/cli`.

This collides with `SPEC-009` ("no root workspace `package.json` is introduced at this stage") in an unexpected way: the SPEC forbids a *workspace root*, but the file that currently exists is worse than either option — its mere presence breaks the toolchain.

Options:

1. Delete the tracked file. No root manifest until the monorepo/pnpm step (see `preferences.md`).
2. Make it valid but non-workspace: `{ "name": "sddio", "private": true }`.

Recommendation: option 1.
It matches `SPEC-009` most literally, and CI then runs entirely inside `packages/cli` with its own lockfile. Option 2 only helps if something needs to run at the root — nothing does today.

Impact if unchanged: the publish workflow fails at its first npm step, and the local tarball procedure in the manual fails on the user's machine for reasons unrelated to the package.

<!-- entry -->
---
id: DISC-024
type: concern
status: open
refs: [SPEC-005, DISC-023]
---

## `@sddio` scope ownership and public access

`@sddio/cli` is a scoped name. Publishing requires:

- the `sddio` org to exist on npmjs, with the publishing account as a member holding write rights;
- public access granted explicitly — scoped packages default to restricted, so a missing `--access public` yields `E402`, or `E404` when the scope is unknown to the account.

Current availability is unverified: registry lookups fail from inside the repo because of `DISC-023`.

Why it matters: both failures appear only after the approval gate is passed, at the last step of a release.

Recommendation: confirm or create the org before wiring CI, and set `publishConfig: { "access": "public" }` in `packages/cli/package.json` so a later workflow edit cannot drop the flag.

<!-- entry -->
---
id: DISC-025
type: concern
status: open
refs: [DISC-024]
---

## Which credential the publish workflow uses

Two mechanisms, with different failure modes:

1. **Granular access token** in `secrets.NPM_TOKEN`, scoped to `@sddio`, read/write, with an expiry. Classic automation tokens are deprecated; an expiring token means the release workflow rots months later, and the symptom (`E401`) looks like a code problem.
2. **Trusted publishing (OIDC)**: `id-token: write`, no stored secret, configured on npmjs against this repository. Preferred long term, but needs a public repository and one-time npm-side setup.

Recommendation: wire `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` with `setup-node`'s `registry-url`, as requested (placeholder only), structured so switching to OIDC means deleting one `env` block. Record the token expiry in the manual.

<!-- entry -->
---
id: DISC-026
type: concern
status: open
refs: [DISC-024]
---

## Approval gate mechanics and repeat publishes

Three interacting details:

- Environment protection with **required reviewers** exists for public repositories, and for private ones only on GitHub Pro/Team/Enterprise. On a free private repo the gate silently does not exist — publishing would be unguarded.
- Publishing *on push to master* parks a run per merge awaiting approval. Two merges produce two queued runs; the second targets a version that already exists and dies with `E403`, which reads like an incident.
- Re-running a completed release run fails for the same reason.

Recommendation: `on: push: branches: [master]` plus `environment: npm-publish`, as asked, plus:

- `concurrency: { group: npm-publish, cancel-in-progress: false }`;
- a pre-flight step that exits green when `npm view @sddio/cli@<version>` already resolves, so approval is only requested for a genuinely new version.

<!-- entry -->
---
id: DISC-027
type: concern
status: open
refs: [DISC-026]
---

## Who bumps the version

Undefined today. The version lives in `packages/cli/package.json`; there is no changesets setup; CI publishes on merge.

Options:

1. **Manual bump in the release PR** — explicit, reviewable, no write-back token.
2. **CI bump and commit** — needs `contents: write`, writes to master, complicates branch protection.

Recommendation: option 1. CI asserts the version is greater than the published one, and tags `v<x.y.z>` only after a successful publish.

<!-- entry -->
---
id: DISC-028
type: concern
status: open
refs: [SPEC-001, ADR-002, ADR-003]
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
id: DISC-029
type: concern
status: open
refs: [SPEC-001, SPEC-002, SPEC-008]
---

## Templates do not satisfy `SPEC-002`

`SPEC-002` states init creates `spec/spec_100.md`, `adr/adr_100.md`, `discussions/discussions_100.md` and the FLOW template, and otherwise creates directories only with no other empty placeholder files.

Current state of `packages/cli/templates/`:

- no `spec/` directory at all, so an initialised project lacks the artifact type that `instructions.md` routes to;
- `adr/adr_100.md` and `discussions/discussions_100.md` are 0-byte files — they contradict "no empty placeholder files", and give the consumer an entry collection with no schema header;
- `flow/completed/template.md` and `flow/reconciliation/template.md` are 0-byte files, which are also unpublishable as directory markers (`DISC-030`);
- `templates/.sddio/context/config.json` keeps the placeholder `"lastProcessedCommit": "abc123..."`, which lands in consumer repos verbatim.

Related: `SPEC-008` defines entry formatting, but this repo's own seeded `discussions_100.md` uses `## <!-- entry -->` with unfenced frontmatter instead of `.schema/discussion.md`'s fenced shape. Whatever the seeds contain becomes the consumer's format, so this needs settling now.

Recommendation: bring templates in line with `SPEC-002` — add `spec/spec_100.md`, seed each collection with the schema header plus one exemplar entry, and let init create `flow/completed/` and `flow/reconciliation/` as directories instead of shipping 0-byte templates.

<!-- entry -->
---
id: DISC-030
type: concern
status: open
refs: [SPEC-002, ADR-002, DISC-029]
---

## Packing behaviour for dot directories and empty directories (verified)

Verified with a real `npm pack` on a synthetic package using `files: ["templates"]`:

- Dot directories survive — `templates/.sddio/...` and the nested `.schema/` both land in the tarball. The layout this project depends on is packable.
- Nested `.gitignore` files are **silently dropped**; only a root `.gitignore` is renamed to `.npmignore`.
- `.DS_Store` is dropped automatically.
- `README.md` and `LICENSE` are included even when absent from `files`.
- Empty directories cannot be represented, so any structure held open by 0-byte files or `.gitkeep` disappears — which is why `SPEC-002`'s "creates directories only" must be implemented in code.

Implication: a green build does not prove the artefact is correct. CI should assert packed contents (`tar -tzf` must contain `package/templates/.sddio/context/instructions/.schema/adr.md` and `package/templates/sddio_workspace/flow/active/template.md`), and the local manual must exercise the `.tgz` rather than `npm link`.

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
refs: [ADR-009, SPEC-017]
---

## Does every rule need a command, or one check command

- ADR-009 makes a command the price of a rule and leaves `sddio check` unbuilt.
- `docs/distribution.md` still lists "no `check` command" as the known gap: a drifted workspace cannot
  fail CI.
- Option 1: keep it unbuilt — the cursor diff in `reconciliation.md` is the whole check, two lines.
- Option 2: a `check` subcommand printing the cursor diff and the dead references; one command, no daemon.
- Cost of option 2: a maintenance surface in a package that otherwise only writes files.
- Either way closes when a consumer reports a drift a command would have caught.
