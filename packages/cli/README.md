# @sddio/cli

Installs the sddio context layer and workspace into a project, then hands the coding agent the first instruction it needs.

## Usage

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

Then **paste the prompt `init` prints** into your coding agent. That step is what turns an empty scaffold into project knowledge — the files alone do nothing.

```text
────────────────────────────────────────────────────────────────
Paste this into your coding agent
────────────────────────────────────────────────────────────────

Read `.sddio/context/instructions.md` and follow it.

This project has just been initialised with sddio. Before any other work:

1. Run the commit check in `.sddio/context/instructions/reconciliation.md`.
   `config.json` has no baseline yet, so the state is `unknown`.
2. Bootstrap the workspace as described in `instructions/bootstrap.md`:
   derive the minimum SPEC from the existing code, configuration, tests and
   documentation. Do not ask me for facts the repository already contains.
3. Report what you recorded, then set `lastProcessedCommit` to `HEAD` and
   `previousCommit` to `HEAD^` in `.sddio/context/config.json`
   (`null` at a root commit).

Then answer this: <your first task>
```

Finally, commit `.sddio/` and `sddio_workspace/` together with your next change.

## What `init` prints

| Situation | Prompt | Why |
| --------- | ------ | --- |
| First run, files created | bootstrap | the workspace is empty; the SPEC has to be derived from the repository |
| Only `.sddio/` changed | reconcile | package upgrade; existing knowledge may now be stale |
| Nothing changed | none | already up to date |
| `--dry-run` | none | nothing was written, so there is nothing to hand over |

## Upgrading

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` is refreshed in place; `sddio_workspace/` is left untouched. `init` then prints the reconcile prompt — paste it so the agent updates only the artifacts the upgrade affects.

## Commands

```text
sddio init [--dir <path>] [--force] [--dry-run]
sddio skill --print
```

| Command / flag | Effect |
| -------------- | ------ |
| `init` | Create `.sddio/`, `sddio_workspace/` and the seed collections; register `AGENTS.md`; print the next step |
| `skill --print` | Print the agent skill to stdout. Writes nothing |
| `--dir <path>` | Target project root (default: current directory) |
| `--force` | Overwrite existing files, including `sddio_workspace/` seeds |
| `--dry-run` | Report what would change without writing |

`.sddio/` is package-owned and refreshed on init; `sddio_workspace/` is user-owned and only touched with `--force`. A run that finds everything up to date reports all files as skipped.

`--force` resets the workspace seeds to empty files — it is meant for re-initialising a project, not for merging.

## What lands in a project

```text
.sddio/                      # context layer, identical to the sddio repository's own .sddio/
  context/…                  # instructions, schema, routes, principles, preferences, roadmap
sddio_workspace/             # the user's workspace: layout only, empty seeds
  spec/spec_100.md           #   → 0 bytes
  adr/adr_100.md             #   → 0 bytes
  discussions/discussions_100.md
  flow/active/template.md
  flow/completed/            # empty directories, created explicitly
  flow/reconciliation/
AGENTS.md                    # sddio snippet appended, existing content preserved
```

The workspace carries no starter prose on purpose: it belongs to the user's project, and placeholder text would be rewritten immediately anyway. See ADR-005 in the sddio repository.

## Agent skill

Agents that support skills can discover sddio without reading `AGENTS.md` first. `skill --print` writes the skill to stdout and nothing else; hints go to stderr, so it can be redirected straight into a skills directory (`<skills>` differs per agent):

```bash
npx sddio skill --print > <skills>/sddio/SKILL.md
```

The skill is a router, not a copy of the rules. It names the paths, the invariants, and the `grep` that lists entries, then delegates the detail to `.sddio/context/instructions.md` — so an upgraded context layer does not invalidate it.

The CLI never scans or writes agent configuration directories, and never edits files outside the project. `init` also leaves the file at `.sddio/skill/SKILL.md`, so it can be copied without running anything.

## Development

```bash
npm install
npm run build      # regenerates templates/.sddio, then compiles
npm test
npm pack
```

`templates/` is a build artefact, not source. `npm run sync` (run automatically by `build` and `pack`) recreates `templates/.sddio` from this repository's root `.sddio/`, which is the single source of truth — so the shipped context can never drift from the one this repository dogfoods. The directory is git-ignored; the workspace layout lives in `lib/workspace.ts`.

The prompts printed by `init` live in `lib/prompt.ts`. The copies in this README and the repository README are asserted against it by `test/prompt.test.mjs`, so they cannot drift.

See `TESTING.md` for testing the packed tarball in another local project.
