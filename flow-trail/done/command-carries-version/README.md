# Card: the command carries the version, so the repository carries nothing

A Python repository has no `package.json`, and adding one to hold a Node tool is the kind of change
people decline — the tool then owns a file that has nothing to do with the project. sddio's value is
language-independent, but its install was not: the only documented path was
`npm install --save-dev @sddio/cli`, and the command every document already printed,
`npx sddio start`, resolved to a package that is not on npm.

Goal: the CLI lives on the machine, the files live in the project, and the experience inside the
project is what it was. `npx -y @sddio/cli@<version> start` works in a repository that owns nothing
of Node; same six commands, same three paths written, one prerequisite — Node ≥ 18 and a first run
that reaches the registry.

Detail behind these conclusions: [`findings.md`](./findings.md).

## Target

| Metric | Before | After | Command |
| --- | --- | --- | --- |
| `npx … --version` in a directory with no `package.json` | E404: `npx sddio` names no package | prints `0.4.0` — measured after the publish | `cd /tmp/empty && npx -y @sddio/cli@0.4.0 --version` |
| Files a Python repo gains | `package.json`, `package-lock.json`, `node_modules/` | `.sddio/`, `sddio_docs/`, `AGENTS.md` — measured | `ls -a` on the fixture |
| Commands proven there | 0 of 6 | 6 of 6 — measured | `packages/cli/test/non-node-project.test.mjs` |
| Documents prescribing `npm install` | 6 files | 0 outside the JS-repo sentence — measured | `grep -rn "npm i\|npm install --save" README*.md docs/ llms.txt packages/cli/README.md` |
| Tests | 75 pass | 80 pass — measured | `cd packages/cli && npm test` |

Measured 2026-11-27, on `v0.4.0` as published. The scaffold was first checked against `0.3.2` — the
release that had no correct command — and every row was re-run against `0.4.0` after the publish:
`init` in a directory holding only `pyproject.toml` and `app/` wrote `.sddio/`, `sddio_docs/` and
`AGENTS.md`, nothing else, and the block it wrote names `@0.4.0`.

## Contract

What must hold when this card closes, and be checked again after every release.

1. **The command is the lockfile.** `AGENTS.md` names exactly one pinned version, generated from
   `packages/cli/package.json` and never typed by hand — gate: the fixture test asserts the block
   carries `npx -y @sddio/cli@<version> start` with the version the package reports.
2. **Nothing resolves from the consumer's tree.** Templates, version and instructions come from the
   installed package, never from the working directory — gate: the fixture has no `package.json` and
   no `node_modules`, and all six commands pass there.
3. **`init` adds the same three things it always did.** No fourth file, no lockfile, no `.npmrc` —
   gate: the fixture's file list contains no `package.json` and no `node_modules/`.
4. **Node ≥ 18 is the only prerequisite.** No global install, no `npm init`, no project-level
   dependency — gate: the fixture runs the binary by absolute path, the way `npx` does.
5. **0.3.x users are not broken.** `@sddio/cli` keeps its name and its versions; a project holding
   it as a devDependency still has its local binary — gate: `npm view @sddio/cli version` still
   answers, and the upgrade paragraph names the migration.

## Decisions

| Decision | Why | Rejected alternative | Enforced by |
| --- | --- | --- | --- |
| Keep the scoped name `@sddio/cli` | A rename is a new npm identity, a deprecation to run, and a second history to explain; the scope costs ten characters | Publishing an unscoped `sddio` alias — shorter command, two packages to keep in step | `ADR-010`, `ADR-017` |
| The pin lives in `AGENTS.md`, one copy | The version needs a committed, reviewable home; `AGENTS.md` is the file every session reads | Pinning in `.sddio/context/instructions.md` too — two numbers that must stay equal | `lib/agents.ts`, fixture test |
| `-y` in the rendered command | An agent has no tty; npm's "Ok to proceed?" is a hang, not a question | Plain `npx`, documenting "press y" | snippet text, `ADR-017` |
| Upgrading stays `npx -y @sddio/cli@latest init` | `init` compares files, not versions; the workspace needs no version record | Adding a CLI version to `config.json` | `lib/init.ts` is structural |
| Release `0.4.0`, not `0.3.3` | The command people type changes, which is what a minor number is for on 0.x | A patch number, which would understate the migration | `DISC-027` |

## Residual

- **The first run needs the network.** A devDependency plus lockfile did not; this is the cost that
  buys the removed file. An air-gapped machine cannot run sddio, and no channel fixes that.
- **The npx cache keeps every version ever run.** Disk, not correctness, and it grows slowly.
- **0.3.x devDependency users see a mismatched pair** — `AGENTS.md` moves to the pinned command
  while their `package.json` still says `0.3.2`. One paragraph in the release note; the confusion is
  real anyway.
- **One fixture language.** Python stands in for every non-Node repository. The code has no
  language-shaped branch, which is an argument, not a measurement.
- **The pin is only as good as the file.** An agent that ignores `AGENTS.md` and runs `@latest`
  moves the tool under the project, and nothing detects it.
- **A JS repository that keeps the devDependency has two versions in play** — the one in
  `package.json` and the one the block names. Which one `npx` runs is unmeasured; if the local binary
  wins, the pin is advisory there. Where it went: nothing, and the release note does not claim it.
- **A scratch directory is not a real repository.** The post-publish run had a `pyproject.toml` and
  one file; a Python tree with a virtualenv, a committed history and an existing `AGENTS.md` is
  Ben's test, not this card's.

## Where the proof lives

| Question | Where |
| --- | --- |
| Does `npx` run it with no `package.json` in sight? | `packages/cli/test/non-node-project.test.mjs` |
| Does the block carry the package's own version? | `packages/cli/test/init.test.mjs`, "the injected command pins the release this copy is" |
| Why the version is in the command and not in a file | `ADR-017`, `sddio_docs/adr/adr_100.md` |
| What was run, and what came back | [`findings.md`](./findings.md) |
