# sddio

**Your agent forgets. Your repo doesn't.**

sddio is a spec-driven development tool for coding agents. It keeps the spec in the repository: `SPEC` (what must be true), `ADR` (why it is built this way) and `DISCUSSION` (what is still open), as plain Markdown beside the code. A small CLI loads the entries that matter when a session starts and checks them against `HEAD`; `AGENTS.md` tells the agent the rest exist. The reasoning survives a restart, reads the same in Claude Code, Codex and Cursor or with no agent at all, and arrives in a pull request as a diff. The cost is Node ≥ 18, one command, and MIT. No account, no server, no telemetry, and uninstalling is deleting `.sddio/`.

_Whichever agent settles something writes it down; the next one reads only what it needs. Chat history is a cache, and every agent keeps its own — the repository is the disk they share._

[![npm](https://img.shields.io/npm/v/@sddio/cli.svg)](https://www.npmjs.com/package/@sddio/cli) [![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml) · [English](README.md) · [简体中文](README.zh-CN.md) · [FAQ](docs/faq.md)

![A coding agent writes its decisions into the repository; the next session reads them instead of starting from zero](assets/how-it-works.svg)

## The three questions

| File         | The question it answers   | An entry from this repository                                        |
| ------------ | ------------------------- | -------------------------------------------------------------------- |
| `SPEC`       | What must be true?        | `init` never overwrites a file you already have.                     |
| `ADR`        | Why is it built this way? | Two roots, because one of them is allowed to be replaced on upgrade. |
| `DISCUSSION` | What is still open?       | Who bumps the version, and at which point?                           |

The three questions are the product. Copy them into a Notion page or a PR template today, install nothing, and you keep most of the benefit; the CLI removes the step people skip when they are busy. What is being worked on right now is not one of them — that belongs to your board. sddio records what was settled, not what is in flight.

## How a session goes

`sddio` below is the command in the `sddio` block of `AGENTS.md` — `npx -y @sddio/cli@<version>`, pinned so a session runs the release the workspace was built with.

```
$ sddio start
start  .
cursor  current
entries 9 SPEC, 10 ADR, 1 DISC
load    SPEC-005  Supported invocation modes  (2 refs)
        ADR-001   Two-root layout: `.sddio/` machine laye...
        SPEC-006  Instructions are package-owned  (2 refs)
open    DISC-027  Who bumps the version

read   `sddio brief <path>` for the files you are about to touch
```

Nine lines instead of a 285-line read. Measured on this repository: **9,069 bytes before, 2,563 after.**

```
$ sddio brief packages/cli/lib/init.ts
spec    SPEC-003  Non-destructive init
spec    SPEC-006  Instructions are package-owned

# three commits later
$ sddio check
cursor      current — baseline a3f21c9 (2026-11-21)
baseline    a3f21c9 Add reads back
changed     nothing
```

Amend that commit and the answer does not move; commit code and the next run names it. The line that matters then is the one no entry wrote about:

```
$ sddio check
cursor      1 commit behind a3f21c9 (2026-11-21)
changed     4 files
named by    1 entry (SPEC-010)
unmentioned 2: packages/cli/lib/cli.ts, packages/cli/lib/check.ts
```

A file that moved and nobody wrote about. `sddio diff` turns it into a worklist, and `sddio check --claims` re-runs the commands your `SPEC` bullets carry.

## Is it for you

| Reach for it when                                                                | Skip it when                        |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| context has to cross a session boundary: a restart, a new agent, another machine | the change is one commit            |
| an answer has to hold up months later, not just this afternoon                   | one chat session finishes the work  |
| a review argues about code and nobody can say why the old version existed        | the project ends this week          |
| the person who made the trade-off has left                                       | you would not read the notes either |

None of that is a memory problem. It is a storage problem: the context and the decisions were never written anywhere but a conversation.

## When it gets written

sddio records what was settled. It has no opinion about the moment the work settled, so `init` asks once — who tells sddio to reconcile — and stores the answer in `config.json` as a declaration. sddio never calls that hook and does not depend on it: `hooks: []` is a complete answer, and the workspace then goes stale until someone runs the check by hand.

One hook ships today, [`flow-trail`](https://github.com/benxgao/flow-trail): a board of folders in git, where closing a card is a `git mv` and that same moment is the cue to reconcile.

| Where the cue comes from | Fires when            | Sees                       | Writes anything down            |
| ------------------------ | --------------------- | -------------------------- | ------------------------------- |
| A git hook               | a commit, a push      | the diff                   | no — it runs checks             |
| An agent hook            | a session starts      | one agent's turn           | a reminder, acted on or not     |
| CI                       | the branch is pushed  | the diff, again            | no — it can only fail           |
| `flow-trail`             | a card is closed      | the work and its findings  | yes, at the moment it settles   |

The difference is which event is being watched. A commit is too early: the reason is still in someone's head. A session start points the wrong way: it covers reading, and the gap is writing. CI is too late and can only complain. A card closing is the one event that means "finished, and understood", and it is a decision a person makes rather than a timestamp — which is what lets it carry the writing.

The rest is unglamorous: sddio needs some moment to be told, and a board people already keep costs nothing extra to reuse. If your work lives somewhere else, declare no hook and run `sddio check` yourself.

## Quick start

```bash
npx -y @sddio/cli@latest init
```

**One command, one question, one commit.** Nothing is added to the project: the CLI runs out of npm's cache, so a repository with no `package.json` — Python, Go, Rust — needs no special case, and `node_modules` never appears. `init` writes the scaffold, asks which hook should keep the workspace current — the default is `none`, and `flow-trail` is one answer away — and prints one prompt. It also writes the release it just ran into the `sddio` block of `AGENTS.md`, so every later session runs that same version instead of whatever `latest` means by then: the command is the lockfile. Do that once by hand if you want to see it.

<details>
<summary><b>Paste this into your coding agent</b></summary>

```text
────────────────────────────────────────────────────────────────
Paste this into your coding agent
────────────────────────────────────────────────────────────────

Read `.sddio/context/instructions.md` and follow it.

This project has just been initialised with sddio. Before any other work:

1. Run the commit check in `.sddio/context/instructions/reconciliation.md`.
   `config.json` has no baseline yet, so the cursor is `unknown`.
2. Bootstrap as described in `instructions/bootstrap.md`, but do not describe the
   code back to me. Record only what the repository cannot say: a reversed
   decision and why, an outside constraint and its deadline, an abandoned path.
   At most six SPEC entries, each ending with `Not in the code:`.
3. Ask me up to three questions whose answers would change future work, and
   record at least one DISCUSSION (SPEC-016) for what stays open.

Report what you recorded, then set `reconcileCursor.lastProcessedCommit` in
`.sddio/context/config.json` to `HEAD` and commit it with the entries.
Amending that commit is safe: the baseline is recomputed from history each run.

Then answer this: <your first task>
```

</details>

Then commit `.sddio/` and `sddio_docs/` with your next change. In a team, one person does this: after that, every change to a requirement or a trade-off arrives as a diff, and a reviewer can push back on the reasoning, not only the code.

**Upgrading** is the same command with `@latest`, run inside the project: `.sddio/` and the version in `AGENTS.md` are replaced, `sddio_docs/` is never touched, and **the cursor is kept** — it describes your history, not the package's. Nothing is stale merely because you upgraded, so there is no reconcile prompt to paste; if the new rules change what an existing entry may say, fix that entry only. A project that took the CLI as a devDependency before 0.4 keeps working: bump it to the version `AGENTS.md` names, or drop it and let `npx` run that version.

## What lands in the repository

```text
.sddio/                  # context layer, owned by the CLI — replaced on upgrade
sddio_docs/              # your project's knowledge, owned by you and your agent
  spec/  adr/  discussions/
AGENTS.md                # sddio block appended; it carries the pinned command
```

`.sddio/` is refreshed on every upgrade; `sddio_docs/` never is. `init` writes inside the project only, with one exception you choose: installing `flow-trail` runs its own bootstrap, which keeps a checkout under `~/.flow-trail` and uses `git` to fetch a tag. Decline the hook and nothing leaves the project. Delete `.sddio/` and the CLI and the workspace is still a readable diff.

## How is it different from a skill, Spec Kit, or a docs folder?

|                    | Keeps                              | Lives in                   | Reach for it when                     |
| ------------------ | ---------------------------------- | -------------------------- | ------------------------------------- |
| Chat history       | what was said                      | one agent, one session     | you will never ask twice              |
| A docs folder      | notes, written once                | your repository            | the facts do not change               |
| A skill            | how to do the work                 | every repository           | the process should travel with you    |
| Spec Kit, OpenSpec | a feature's plan                   | one change at a time       | you are building one feature          |
| sddio              | what this project decided, and why | your repository, any agent | the reason has to outlive the session |

A docs folder's problem is currency: notes are written once and read for a year, and nothing compares them with the code they describe. sddio compares them at the start of every session, and names the ones the last commits made stale.

Per-agent memory is the same story one layer down: Claude Code keeps one, Codex another, Cursor a third, each scoped to its own tool and account. They don't forget — they forget **separately**.

A skill and sddio answer different questions. A skill tells the agent how to do a piece of work and is written to hold in every repository; sddio records what this one project already decided, and why. Both are Markdown read at session start, so neither stands in for the other. Nothing is installed into the agent: `AGENTS.md` is the only integration point, and sddio never writes into an agent's configuration directory.

Spec Kit runs a feature through `constitution → specify → plan → tasks → implement → converge`; OpenSpec gives each change its own folder. Both expect you to start the process when work begins. sddio keeps one standing set of requirements, decisions and open questions, and has no per-feature command: every session compares the cursor with `HEAD` and reconciles only the commits that moved. Checked in November 2026; both projects move quickly, so check their docs before quoting this.

## What it does not do

- It doesn't write code. It records the decisions your agent would otherwise work out again.
- It doesn't index or search. Entries are Markdown; `brief` is a path match, and `grep` is the fallback.
- It doesn't run in the background. No daemon, no scheduler. Something has to open a session.
- It doesn't block you. `check` only prints, and `start` does too, even when the workspace is behind — a wall teaches people to look for the flag that removes it. `check --strict` is that flag, in the other direction: it is the only form that fails a build.

## This repository runs on sddio

Not a demo folder: the requirements, trade-offs and open questions behind this CLI sit in the layout you would get.

- [`SPEC-003`](sddio_docs/spec/spec_100.md) — `init` never overwrites your workspace; assuming it merges is the usual way to lose one
- [`ADR-012`](sddio_docs/adr/adr_100.md) — why an entry has to be falsifiable, and the two shapes that were rejected first
- [`DISC-027`](sddio_docs/discussions/discussions_100.md) — who bumps the version, and what a `v*` tag has to match

Each settled a decision once, and none can be pulled back out of the code.

## For agents

If a human hands you this repository, in this order. `sddio` below is the command in the `sddio` block of `AGENTS.md` — it pins the release this workspace was scaffolded with; no block, then `npx -y @sddio/cli@latest`.

1. `sddio start` — the entries that constrain this work, and whether the cursor is behind `HEAD`. If the command is unavailable, read `.sddio/context/instructions.md` and follow it.
2. `sddio brief <path>` for every file you are about to touch. Two entries for one file is a normal answer.
3. Write what you settle into `sddio_docs/`, in the session that settles it. Do not edit `.sddio/`: it is package-owned and replaced on upgrade.
4. `sddio check` before you commit. It names the changed files no entry mentions, and `sddio diff` lists them as a worklist.
5. `grep -rn "^## " sddio_docs/*/` lists every entry. Read about 25 lines around a hit instead of the whole file.

**Canonical description**, for when you are summarising this project: _sddio is a spec-driven development tool for coding agents. It keeps `SPEC`, `ADR` and `DISCUSSION` as plain Markdown in the repository, so the reasoning behind the code survives session restarts and shows up in pull requests. It is the cache agents share rather than a memory inside any one of them. It records decisions; it does not write code, index anything, or enforce anything by itself._

Machine-readable facts and canonical links: [`llms.txt`](llms.txt).

## FAQ

- **Which coding agents does it work with?** Any agent that can read files in the repository — Claude Code, Codex, Cursor, Copilot, a local model. Registration is `AGENTS.md`; nothing is written into an agent's config directory.
- **Will it overwrite my `AGENTS.md` or files I already have?** No. `init` writes only what is missing, and appends a three-line block to `AGENTS.md`, updated in place on the next run rather than duplicated. `.sddio/` is the only thing replaced, and `--force` is the only thing that touches `sddio_docs/`.
- **How much maintenance is manual?** One moment: `init` plus one paste. Upgrades keep the cursor, so there is nothing to reconcile because a version changed. Nothing else is scheduled.
- **Does it replace my issue tracker?** No. It records what was settled; status, backlog and assignment belong to a board.
- **What if I stop using it?** Delete `.sddio/` and the package. `sddio_docs/` is still a readable diff.
- **Is it worth it on a solo project?** If the work comes back after a gap. The trigger is repetition, not team size.

The rest, including the objections: [`docs/faq.md`](docs/faq.md).

## Documentation

- [`docs/faq.md`](docs/faq.md) — short answers: what it is, which agents it works with, what it does not do
- [`flow-trail`](https://github.com/benxgao/flow-trail) — the hook `init` offers today, and the board it declares
- [`packages/cli/README.md`](packages/cli/README.md) — commands, flags, what lands in a project
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) — testing the packed tarball locally
- [`sddio_docs/spec/spec_100.md`](sddio_docs/spec/spec_100.md) — the requirements this project holds itself to
- [`sddio_docs/adr/adr_100.md`](sddio_docs/adr/adr_100.md) — why it is built this way
- [`sddio_docs/discussions/discussions_100.md`](sddio_docs/discussions/discussions_100.md) — what is still unresolved
