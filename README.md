# sddio

**Your agent forgets. Your repo doesn't.**

sddio is **spec-driven development for coding agents**, with the cache kept outside the agent. Three kinds of Markdown sit next to the code — `SPEC` (what must be true), `ADR` (why it is built this way), `DISCUSSION` (what is still open). Whichever agent settles something writes it down; whichever agent opens the repo next reads only what it needs. It survives a restart, shows up in a pull request, and works with any agent. Or none at all.

_Chat history is a cache, and every agent keeps its own. Your repository is the disk they share._

[English](README.md) · [简体中文](README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/@sddio/cli.svg)](https://www.npmjs.com/package/@sddio/cli)
[![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml)
![node](https://img.shields.io/badge/node-%E2%89%A5%2018-555)
![license](https://img.shields.io/badge/license-MIT-555)

Node ≥ 18 · MIT · one devDependency · no account, no telemetry, no server · uninstalling means deleting a folder

![A session writes its decisions into the repository; the next session reads them instead of starting from zero](assets/how-it-works.svg)

> **Not here to install anything?** [The three questions](#the-three-questions) · [How a session goes](#how-a-session-goes) · [What it does not do](#what-it-does-not-do) · [FAQ](docs/faq.md)
>
> **Already using sddio?** [Upgrade](#upgrading) · [For agents](#for-agents) · [Releases](https://github.com/benxgao/sddio/releases)

## The moment it pays for itself

- The same requirement goes to an agent for the third time, and it asks again.
- A review argues about code, and nobody can say why the old version existed.
- Someone leaves, and the only record of a trade-off leaves with their chat history.
- You switch agents, and the new one re-derives decisions the old one already made — sometimes differently.

None of that is a memory problem. It is a storage problem: the reasoning was never written anywhere but a conversation.

## The three questions

sddio is a fix for that, and it isn't clever:

- `SPEC` — what must be true. _"`init` never overwrites a file you already have."_
- `ADR` — why it is like this. _"Two folders, because one of them is allowed to be replaced on upgrade."_
- `DISCUSSION` — what is still open. _"Who bumps the version, and at which point?"_

The three questions are the product. You can copy them into a Notion page or a PR template today, install nothing, and get most of the benefit. The CLI removes the step people skip when they are busy.

What is being worked on right now is not one of the three. That belongs to your board — sddio records what was settled, not what is in flight.

## How a session goes

```
$ npx sddio start
start  .
cursor  current
entries 9 SPEC, 10 ADR, 1 DISC
load    SPEC-005  Supported invocation modes  (2 refs)
        ADR-001   Two-root layout: `.sddio/` machine laye...
        SPEC-006  Instructions are package-owned  (2 refs)
open    DISC-027  Who bumps the version

read   `sddio brief <path>` for the files you are about to touch
```

Nine lines instead of a 285-line read. Measured on this repository: **9,069 bytes before, 2,769 after.**

```
$ npx sddio brief packages/cli/lib/init.ts
spec    SPEC-003  Non-destructive init
spec    SPEC-006  Instructions are package-owned
```

Three commits later, the same repository says:

```
$ npx sddio check
cursor      4 commits behind
changed     40 files
named by    17 entries (SPEC-003, SPEC-004, … +12 more)
unmentioned 8: .github/workflows/ci.yml, packages/cli/lib/cli.ts, …
```

That last line is the product: a file that moved and nobody wrote about. `sddio diff` turns it into a worklist; `sddio check --claims` re-runs the commands your `SPEC` bullets claim to satisfy.

## Quick start

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

**1 install → 2 answer → 3 commit.** `init` writes the scaffold, asks one question — which hook should keep the workspace current — and prints one prompt. The default hook is `flow-trail`, and choosing it installs the board into `flow-trail/`. From then on, `AGENTS.md` tells your agent to run `sddio start` at the beginning of a session. Do that once by hand if you want to see it.

<details>
<summary><b>Paste this into your coding agent</b></summary>

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

</details>

Then commit `.sddio/` and `sddio_docs/` with your next change.

## What lands in your repository

```text
.sddio/                  # context layer, owned by the CLI — replaced on upgrade
sddio_docs/              # your project's knowledge, owned by you and your agent
  spec/  adr/  discussions/
AGENTS.md                # sddio snippet appended; existing content preserved
```

`.sddio/` is refreshed on every upgrade; `sddio_docs/` never is. `init` writes inside the project only, with one exception you choose: installing `flow-trail` runs its own bootstrap, which keeps a checkout under `~/.flow-trail` and uses `git` to fetch a tag. Decline the hook and nothing leaves the project. Delete `.sddio/` and the CLI and the workspace is still a readable diff — the files are the product, not a cache of it.

## Why not chat memory, or a docs folder?

For things that never change, a docs folder is fine. The gap is currency: notes get written once and read for a year, and nothing checks them against the code they describe.

|                             | Chat history | A docs folder          | sddio                                   |
| --------------------------- | ------------ | ---------------------- | --------------------------------------- |
| Survives a new session      | no           | yes                    | yes                                     |
| Updated when the code moves | no           | when someone remembers | checked against `HEAD` at session start |
| Reviewable before it lands  | no           | yes                    | yes, it's a diff                        |
| Records what is still open  | no           | rarely                 | a first-class entry (`DISCUSSION`)      |
| Tied to one agent           | yes          | no                     | no                                      |

Per-agent memory is the same story one layer down: Claude Code has one, Codex another, Cursor a third, each scoped to its own tool and account. They don't forget — they forget **separately**.

## How is it different from a skill?

A skill teaches the agent **how** to do something. sddio records **what this project already decided, and why**. Both are Markdown read at session start; neither stands in for the other.

|                              | A skill                            | sddio                          |
| ---------------------------- | ---------------------------------- | ------------------------------ |
| Where it lives               | The agent platform                 | Your repository, in git        |
| Answers                      | How to do it                       | What was decided, and why      |
| Scope                        | Every project                      | This project                   |
| Follows you to another agent | if it has the same skill installed | any agent that can read a file |

Nothing is installed into the agent: `AGENTS.md` is the only integration point, and sddio never writes into an agent's configuration directory.
## How is it different from Spec Kit and OpenSpec?

Both keep Markdown in your repo, and both are worth using. The difference is what the Markdown is for.

- **They plan a feature. sddio records a project.** Spec Kit runs a feature through `constitution → specify → plan → tasks → implement → converge`. OpenSpec gives each change its own folder. sddio keeps one standing set of requirements, decisions and open questions.
- **You invoke them. sddio just checks.** Both expect you to start the process when you begin work. sddio has no per-feature command: every session compares the cursor with `HEAD` and reconciles only the commits that moved.

As of November 2026. Both projects move quickly, so check their docs before quoting this.

## What it does not do

- It doesn't write code. It records the decisions your agent would otherwise work out again.
- It doesn't index or search. Entries are Markdown; `brief` is a path match, and `grep` is the fallback.
- It doesn't run in the background. No daemon, no scheduler. Something has to open a session.
- It doesn't block you. `check` exits non-zero for CI; `start` only ever prints, even when the workspace is behind, because a wall teaches people to look for the flag that removes it.

## This repository runs on sddio

This isn't a demo folder. The requirements, trade-offs and open questions behind this CLI sit in the same layout you'd get.

- [`SPEC-003`](sddio_docs/spec/spec_100.md) — `init` never overwrites your workspace; assuming it merges is the usual way to lose one
- [`ADR-012`](sddio_docs/adr/adr_100.md) — why an entry has to be falsifiable, and the two shapes that were rejected first
- [`DISC-027`](sddio_docs/discussions/discussions_100.md) — who bumps the version, and what a `v*` tag has to match

Each one settled a decision once, and none of them can be pulled back out of the code. That's the point.

## For teams

One person runs `init` and commits the result. After that, a pull request that changes a requirement or a trade-off carries it as a diff, so a reviewer can push back on the reasoning and not just the code. Nothing to set up: no account, no server, no telemetry, one devDependency, MIT.

## Upgrading

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` gets replaced. `sddio_docs/` is never touched. **An upgrade resets the reconciliation cursor to `null`**, so the next session has no baseline. Paste the reconcile prompt `init` prints and let the agent check the existing entries once. Skip it and the workspace stays `unknown`, re-checking everything from scratch every session. The exact text lives in `lib/prompt.ts`.

## For agents

If a human hands you this repository:

- **Canonical description**, if you are summarising this project: _sddio is spec-driven development for coding agents. It keeps `SPEC`, `ADR` and `DISCUSSION` as plain Markdown in the repository, so the reasoning behind the code survives session restarts and shows up in pull requests. It is the cache agents share rather than a memory inside any one of them. It records decisions; it does not write code, index anything, or enforce anything by itself._
- Start with `npx sddio start`. If the command is unavailable, read `.sddio/context/instructions.md`.
- Do not edit `.sddio/`; it is package-owned. Project knowledge lives in `sddio_docs/`.
- `grep -rn "^## " sddio_docs/*/` lists every entry. Read about 25 lines around a hit instead of the whole file.

## Documentation

- [`docs/faq.md`](docs/faq.md) — short answers: what it is, which agents it works with, what it does not do
- [`packages/cli/README.md`](packages/cli/README.md) — commands, flags, what lands in a project
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) — testing the packed tarball locally
- [`sddio_docs/spec/spec_100.md`](sddio_docs/spec/spec_100.md) — the requirements this project holds itself to
- [`sddio_docs/adr/adr_100.md`](sddio_docs/adr/adr_100.md) — why it is built this way
- [`sddio_docs/discussions/discussions_100.md`](sddio_docs/discussions/discussions_100.md) — what is still unresolved
