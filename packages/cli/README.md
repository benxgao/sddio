# @sddio/cli

Copies the sddio `.sddio/` context and `sddio_workspace/` scaffolding into a project and registers the sddio snippet in `AGENTS.md`.

## Usage

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

```text
sddio init [--dir <path>] [--force] [--dry-run]
```

| Command / flag | Effect                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| `init`         | Create `.sddio/`, `sddio_workspace/` and the seed collections; register `AGENTS.md` |
| `--dir <path>` | Target project root (default: current directory)                                    |
| `--force`      | Overwrite existing files, including `sddio_workspace/` seeds                        |
| `--dry-run`    | Report what would change without writing                                            |

`.sddio/` is package-owned and refreshed on init; `sddio_workspace/` is user-owned and only touched with `--force`. A run that finds everything already up to date reports all files as skipped.

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

## Development

```bash
npm install
npm run build      # regenerates templates/.sddio, then compiles
npm test
npm pack
```

`templates/` is a build artefact, not source. `npm run sync` (run automatically by `build` and `pack`) recreates `templates/.sddio` from this repository's root `.sddio/`, which is the single source of truth — so the shipped context can never drift from the one this repository dogfoods. The directory is git-ignored; the workspace layout lives in `lib/workspace.ts`.

See `TESTING.md` for testing the packed tarball in another local project.
