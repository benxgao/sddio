# @sddio/cli

**Spec-driven development for coding agents, kept in your repo.**

`sddio` writes a context layer and a workspace into a project, then hands your agent the first instruction it needs. All of it is plain Markdown committed with your code: what the project requires (`SPEC`), why it's built this way (`ADR`), and what's still unresolved (`DISCUSSION`). Work in progress is deliberately not one of them — that belongs to your board.

[Repository](https://github.com/benxgao/sddio) · [FAQ](https://github.com/benxgao/sddio/blob/master/docs/faq.md) · [How it works](https://github.com/benxgao/sddio#readme) · Node ≥ 18 · MIT

![A session writes its decisions into the repository; the next session reads them instead of starting from zero](https://raw.githubusercontent.com/benxgao/sddio/master/assets/how-it-works.svg)

## Install

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

Then **paste the prompt `init` prints** into your coding agent. That step is what turns an empty scaffold into project knowledge. The files on their own do nothing.

```text
────────────────────────────────────────────────────────────────
Paste this into your coding agent
────────────────────────────────────────────────────────────────

Read `.sddio/context/instructions.md` and follow it.

This project has just been initialised with sddio. Before any other work:

1. Run the commit check in `.sddio/context/instructions/reconciliation.md`.
   `config.json` has no baseline yet, so the state is `unknown`.
2. Bootstrap as described in `instructions/bootstrap.md`, but do not describe the
   code back to me. Record only what the repository cannot say: a reversed
   decision and why, an outside constraint and its deadline, an abandoned path.
   At most six SPEC entries, each ending with `Not in the code:`.
3. Ask me up to three questions whose answers would change future work, and
   record at least one DISCUSSION (SPEC-016) for what stays open.
4. Report what you recorded, then set `reconcileCursor.lastProcessedCommit` to
   `HEAD` and `reconcileCursor.previousCommit` to `HEAD^` in
   `.sddio/context/config.json` (`null` at a root commit).

Then answer this: <your first task>
```

Finally, commit `.sddio/` and `sddio_docs/` together with your next change. That's the whole install. `init` writes nothing outside the project, doesn't touch an agent's config directory, and runs no git command.

## What `init` prints

| Situation | Prompt | Why |
| --------- | ------ | --- |
| First run, files created | bootstrap | the workspace is empty; the agent derives the first SPEC and records the first open question |
| Only `.sddio/` changed | reconcile | package upgrade; existing knowledge may now be stale |
| Nothing changed | none | already up to date |
| `--dry-run` | none | nothing was written, so there is nothing to hand over |

## Upgrading

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` is refreshed in place, and `sddio_docs/` is left alone. `init` then prints the reconcile prompt, so paste it in and let the agent update only the artefacts the upgrade affects. An upgrade resets the reconciliation cursor to `null`, so this step isn't optional. Without it the workspace stays `unknown` and every session re-checks from scratch.

One field survives the refresh: the `hooks` array in `.sddio/context/config.json`. An upgrade must not silently re-wire the project to a caller it abandoned, so `init` keeps the declared hooks and only replaces the rest of the file.

## Commands

```text
sddio init [--dir <path>] [--hook <name>] [--no-install] [--yes] [--force] [--dry-run]
sddio start [<path>...]      # cursor, hint and brief in one call
sddio brief [<path>...]      # entries that name those paths
sddio show <id>              # one entry, body included
sddio check [--json]         # behind HEAD? did a moved file go unrecorded?
sddio diff [--json]          # the worklist: what each moved file touches
```

| Command / flag | Effect |
| -------------- | ------ |
| `init` | Create `.sddio/`, `sddio_docs/` and the seed collections; register `AGENTS.md`; ask which hook to use; print the next step |
| `start` | The one call a hook makes: cursor state, a hint, and a brief, in ten lines or fewer |
| `brief` | Titles of the entries that name the given paths. Reads nothing else |
| `show` | One entry by ID, body included |
| `check` | Cursor state plus the files nobody wrote about. Exits 1 when behind, for CI |
| `diff` | Which entries name a moved file, and which files nobody named. Prints; never writes |
| `--dir <path>` | Target project root (default: current directory) |
| `--hook <name>` | `flow-trail` (default) or `none`. Naming one installs it unless `--no-install` is given |
| `--no-install` | Declare the hook in `config.json` without running its installer |
| `--yes` | Take the default hook without asking, and install it |
| `--force` | Overwrite existing files, including `sddio_docs/` seeds |
| `--dry-run` | Report what would change without writing |

With a terminal attached, `init` asks one question: which hook should keep the workspace current. The default is `flow-trail`, and choosing it runs flow-trail's own bootstrap in the target project — a card board in `flow-trail/`, a pointer in `AGENTS.md`. `--yes` gives the same answer without the question, so a script that wants the default spells it `--yes`; `--no-install` is the CI escape when the fetch must not happen. A project that has already answered is not asked again, and an upgrade never re-downloads the hook.

`.sddio/` belongs to the package and gets refreshed on init. `sddio_docs/` is yours and is only touched with `--force`. A run that finds everything up to date reports all files as skipped.

`--force` resets the workspace seeds to empty files — it is meant for re-initialising a project, not for merging.

## What lands in a project

```text
.sddio/                      # context layer, identical to the sddio repository's own .sddio/
  context/                   # instructions, schema, routes, preferences, roadmap, writing
sddio_docs/                  # the user's workspace: layout only, empty seeds
  spec/spec_100.md           #   → 0 bytes
  adr/adr_100.md             #   → 0 bytes
  discussions/discussions_100.md
AGENTS.md                    # sddio snippet appended, existing content preserved
```

The workspace ships no starter prose on purpose. It belongs to your project, and placeholder text would be rewritten immediately anyway. See ADR-005 in the sddio repository.

## Requirements

- Node ≥ 18. No Python, no global install.
- git optional: without a repository — or without the git binary — the commit check is skipped and the cursor is left untouched.

## Questions

**Does it need a specific agent?** No. `init` writes `AGENTS.md` and nothing else agent-specific; any agent that reads repository files works, and the prompt it prints is plain text. No skill is installed and no agent configuration directory is read or written.

**Does it send anything anywhere?** No account, no server, no telemetry, no update check. It reads and writes files inside the target directory and runs no git command.

**What does it not do?** It does not write code, search or index the workspace, or enforce its rules on its own. `check` can fail CI when knowledge falls behind `HEAD`, but nothing can decide whether an entry still says the right thing — that stays the agent's reading. Entries are Markdown; `grep` is the query language.

See [`docs/faq.md`](https://github.com/benxgao/sddio/blob/master/docs/faq.md) for the rest.

## Development

```bash
npm install
npm run build      # regenerates templates/.sddio, then compiles
npm test
npm pack
```

`templates/` is a build artefact, not source. `npm run sync` (run automatically by `build` and `pack`) recreates `templates/.sddio` from this repository's root `.sddio/`, which is the single source of truth. That way the shipped context can't drift from the one this repo dogfoods. The directory is git-ignored. The workspace layout lives in `lib/workspace.ts`.

The prompts printed by `init` live in `lib/prompt.ts`. The copies in this README and in the repository README are asserted against it by `test/prompt.test.mjs`, so they can't drift.

See `TESTING.md` for testing the packed tarball in another local project.
