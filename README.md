# sddio

**Your agent forgets. Your repo doesn't.**

sddio is **spec-driven development for coding agents**, with the cache kept outside the agent. An assistant is good at writing code and bad at remembering why; what it does remember belongs to the tool that made it, and dies with that tool. sddio puts the durable part in git instead: three kinds of Markdown file next to the code — `SPEC` (what the project requires), `ADR` (why it is built this way), `DISCUSSION` (what is still unresolved). Whichever agent settles something writes it down; whichever agent opens the repo next reads it. Because the judgement sits beside the code, it survives a restart, shows up in a pull request, and works with any agent. Or none at all.

_Chat history is a cache, and every agent keeps its own. Your repository is the disk they share._

[English](README.md) · [简体中文](README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/@sddio/cli.svg)](https://www.npmjs.com/package/@sddio/cli)
[![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml)
![node](https://img.shields.io/badge/node-%E2%89%A5%2018-555)
![license](https://img.shields.io/badge/license-MIT-555)

Node ≥ 18 · MIT · one devDependency · no account, no telemetry, no server · uninstalling means deleting a folder

![A session writes its decisions into the repository; the next session reads them instead of starting from zero](assets/how-it-works.svg)

> **Not here to install anything?** [Plain-language version](#if-you-are-not-a-developer) · [Why a shared cache](#one-cache-every-agent) · [What it does not do](#what-it-does-not-do) · [vs skills](#how-is-it-different-from-a-skill) · [vs Spec Kit, OpenSpec](#how-is-it-different-from-spec-kit-and-openspec) · [FAQ](docs/faq.md)
>
> **Already using sddio?** [Upgrade](#upgrading) · [Copy a prompt](#copy-blocks) · [Layout](#layout) · [Releases](https://github.com/benxgao/sddio/releases)

## If you are not a developer

You've probably seen this already, except the colleague was a chat window. Something gets built, it works, the tab closes. Three weeks later nobody can say why it was built that way, or which of the two versions was the real one. The assistant isn't forgetful by nature. Nothing was ever written down outside the conversation.

And when you change assistants, none of it comes with you. The new one starts from the code, works the reasoning out again, and sometimes lands somewhere else.

sddio is a fix for that, and it isn't clever: three kinds of Markdown file in the repo, committed next to the code.

- `SPEC` — what must be true. _"`init` never overwrites a file you already have."_
- `ADR` — why it is like this. _"Two folders, because one of them is allowed to be replaced on upgrade."_
- `DISCUSSION` — what is still open. _"Who bumps the version, and at which point?"_

The three questions are the product. You can copy them into a Notion page, a PR template or a team wiki today, install nothing, and still get most of the benefit. The CLI just removes the step people skip when they're busy.

What is being worked on right now is not one of the three. That belongs to your board, or to a workflow tool — sddio records what was settled, not what is in flight.

**You'll want this when**

- the same requirement goes to an assistant for the third time.
- a review argues about the code, and nobody can say why the old version existed.
- someone leaves, and the only record of a trade-off leaves with their chat history.

**Why it's worth a bookmark even if you never install it**

- The problem isn't going away. Every month, more code gets written by something with no memory of last month.
- It's used here, not mocked up. [`sddio_workspace/`](sddio_workspace) holds this CLI's own requirements, trade-offs and open questions, in the format the CLI argues for.
- The exit is free. Plain Markdown, MIT, no account. Uninstalling means deleting a folder.

Come back when one of those moments happens. The three entries under [This repository runs on sddio](#this-repository-runs-on-sddio) are readable even if you know nothing about the CLI.

## One cache, every agent

Per-agent memory works, and none of it is yours. Claude Code has one, Codex has another, Cursor a third; each is scoped to its own tool, its own account, often its own machine. The problem isn't that they forget. It's that they forget **separately**. Point a second agent at the same repository and it re-derives the same decisions, occasionally reaching a different one, and neither agent can see the other's reasoning. The work is cached, but the cache is per process.

Moving a cache outside the process is the ordinary fix, and it is all sddio is: one directory of Markdown in git that every agent reads at the start of a session and writes to when it settles something.

|                      | Per-agent memory                 | sddio                           |
| -------------------- | -------------------------------- | ------------------------------- |
| Where it lives       | inside one tool                  | in the repo, beside the code    |
| Who reads it         | that tool, on that account       | any agent, any editor, you      |
| Swap the model       | cold start                       | nothing to re-teach             |
| Two agents, one repo | two memories that drift apart    | one set of decisions            |
| Written by           | the platform                     | the agent, on your commits      |
| Leaves when          | the session ends, or the licence | it doesn't; it's in the history |

What accumulates is not a transcript. All three are cached judgement — requirements that were agreed, trade-offs that were made, questions still open. An agent that reads them starts where the last one stopped, including an agent that didn't exist when they were written. That last part is the whole point: the knowledge outlives the tool, so choosing a tool stops being a decision you can't undo.

Keeping them current is the other half. `.sddio/context/config.json` declares which hook is allowed to call the reconcile step, and when — the default is a workflow tool, and a repository with no hook still works, it just goes stale until someone runs the check.

A skill travels too, and that's the fair objection. What it carries is procedure; what it can't carry is what this project decided. [That comparison is further down](#how-is-it-different-from-a-skill).

## Quick start

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

**1 install → 2 answer → 3 commit.** `init` writes the scaffold, asks one question — which hook should keep the workspace current — and ends by printing one prompt. The default hook is `flow-trail`, and choosing it installs the board into `flow-trail/`. Paste the prompt into your agent; the files on their own do nothing.

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
2. Bootstrap the workspace as described in `instructions/bootstrap.md`:
   derive the minimum SPEC from the existing code, configuration, tests and
   documentation. Do not ask me for facts the repository already contains.
3. Record at least one DISCUSSION for what the repository cannot settle, so
   the workspace opens with an open question and not only with claims.
4. Report what you recorded, then set `reconcileCursor.lastProcessedCommit` to
   `HEAD` and `reconcileCursor.previousCommit` to `HEAD^` in
   `.sddio/context/config.json` (`null` at a root commit).

Then answer this: <your first task>
```

</details>

Then commit `.sddio/` and `sddio_workspace/` with your next change.

## What lands in your repository

```text
.sddio/                  # context layer, owned by the CLI — replaced on upgrade
sddio_workspace/         # your project's knowledge, owned by you and your agent
  spec/  adr/  discussions/
AGENTS.md                # sddio snippet appended; existing content preserved
```

`init` writes inside the project only, and touches no agent config directory. The one exception is the hook you choose: installing `flow-trail` runs its own bootstrap, which keeps its checkout under `~/.flow-trail` and uses `git` to fetch a tag. Decline the hook and nothing leaves the project. Committing the two folders is the only step left to you.

## This repository runs on sddio

This isn't a demo folder. The requirements, trade-offs and open questions behind this CLI sit in the same layout you'd get.

- [`SPEC-011`](sddio_workspace/spec/spec_100.md) — `init` ends with the agent's next step, not with a file list
- [`ADR-005`](sddio_workspace/adr/adr_100.md) — why the shipped context is a build artefact, including the approach that was rejected
- [`DISC-023`](sddio_workspace/discussions/discussions_100.md) — a 0-byte `package.json` that made every `npm` command fail

Each one settled a decision once, and none of them can be pulled back out of the code. That's the point.

## How is it different from a skill?

A skill teaches the agent **how** to do something. sddio records **what this project already decided, and why**. Both are Markdown read at session start; neither one stands in for the other.

They are opposites by design. A skill has to work in every repository, so it cannot know any of them. sddio works in exactly one, because a decision is only true where it was made. Keep the skill — it's the part that travels. Keep sddio — it's the part that cannot.

|                              | A skill                            | sddio                                   |
| ---------------------------- | ---------------------------------- | --------------------------------------- |
| Where it lives               | The agent platform                 | Your repository, in git                 |
| Answers                      | How to do it                       | What was decided, and why               |
| Scope                        | Every project                      | This project                            |
| Arrives by                   | Installing it once                 | `init`, one paste, one commit           |
| Reviewed in a PR             | no                                 | yes, it's a diff                        |
| Stays correct by             | The platform's upgrade             | Reconciling only the commits that moved |
| Follows you to another agent | if it has the same skill installed | any agent that can read a file          |

None of that is a complaint about skills. It's the reason to run both: the skill is what your agent knows how to do, the workspace is what it cannot know without opening your repo.

Which is also why the `SKILL.md` in the box is a one-page router rather than a copy of the rules. It points at the context layer, so upgrading the layer can't leave the skill saying something stale. Agents that don't do skills read `AGENTS.md` and lose very little.

## Why not just write notes in the repository?

You can, and for things that never change you should. The gap is currency. A docs folder gets written once and read for a year, and nothing checks it against the code it describes. The table below is about what happens three months in, when the commits have moved and the notes haven't.

|                             | Chat history | A docs folder          | sddio                                   |
| --------------------------- | ------------ | ---------------------- | --------------------------------------- |
| Survives a new session      | no           | yes                    | yes                                     |
| Updated when the code moves | no           | when someone remembers | checked against `HEAD` at session start |
| Reviewable before it lands  | no           | yes                    | yes, it's a diff                        |
| Records what is still open  | no           | rarely                 | a first-class entry (`DISCUSSION`)      |
| Tied to one agent           | yes          | no                     | no                                      |

## How is it different from Spec Kit and OpenSpec?

Both keep Markdown in your repo, and both are worth using. The difference is what the Markdown is for.

- **They plan a feature. sddio records a project.** Spec Kit runs a feature through `constitution → specify → plan → tasks → implement → converge`. OpenSpec gives each change its own folder, archived once it lands. sddio keeps one standing set of requirements, decisions and open questions. A feature is a `FLOW` entry, not a new spec tree.
- **You invoke them. sddio just checks.** Both expect you to start the process when you begin work. sddio has no per-feature command: every session compares the cursor with `HEAD` and reconciles only the commits that moved.

This is as of October 2026. Both projects move quickly, so check their docs before quoting it.

## What it does not do

- It doesn't write code. It records the decisions your agent would otherwise work out again from scratch.
- It doesn't search or index anything. Entries are plain Markdown, so `grep` is your query language.
- It doesn't enforce anything on its own. A rule is only as strong as the agent that reads it. Nothing fails CI when the workspace drifts, because that gate doesn't exist yet.
- It doesn't run in the background. No daemon, no git hook, no scheduler. It only does something when an agent opens a session and reads `AGENTS.md`.

## For teams

One person runs `init` and commits the result. After that, any pull request that changes a requirement or a trade-off carries the change as a diff, so a reviewer can push back on the reasoning and not just the code. The next laptop starts from the same files, and so does the next agent — including the one nobody on the team has tried yet.

Nothing to set up. No account, no server, no telemetry, one devDependency, MIT.

## What if you stop using it

Everything sddio writes is plain Markdown in your repo. Delete `.sddio/` and the CLI, and `sddio_workspace/` is still readable, still reviewable, still a diff. No export step, no migration, no service to cancel.

The files are the product, not a cache of it.

## Upgrading

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` gets replaced. `sddio_workspace/` is never touched. **An upgrade resets the reconciliation cursor to `null`**, so the next session has no baseline. Paste the reconcile prompt `init` prints and let the agent check the existing entries once. Skip it and the workspace stays `unknown`, re-checking everything from scratch every session.

## Copy blocks

The two prompts `init` can print, for pasting later. They must stay in sync with `lib/prompt.ts`, which `test/prompt.test.mjs` asserts.

<details>
<summary><b>Reconcile after an upgrade</b></summary>

```text
Read `.sddio/context/instructions.md` and follow it.

The sddio context layer in `.sddio/` was just refreshed by a package upgrade,
and `config.json` now carries no baseline (`null`). Before any other work, run
the commit check and reconcile: `.sddio/context/instructions/reconciliation.md`.

The cursor state is `unknown`, so there is no range to diff: verify the existing
artifacts against the current implementation. Do not rescan unrelated areas, and
do not rewrite artifacts that are still accurate.

Report what you understood and what you changed, then set
`reconcileCursor.lastProcessedCommit` to `HEAD` and `reconcileCursor.previousCommit`
to `HEAD^` in `.sddio/context/config.json` (`null` at a root commit), so the next
session resumes from a baseline.

Then answer this: <your first task>
```

</details>

## Layout

| Path               | Owner              | Rule                                                                                                  |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `.sddio/`          | the CLI            | context layer: instructions, schema, routes. Refreshed on `init`, so upgrades carry the current layer |
| `sddio_workspace/` | you and your agent | `spec/`, `adr/`, `discussions/`. Never overwritten                                          |

Every session starts with a commit check. The cursor in `.sddio/context/config.json` gets compared with `HEAD`, and only the range that moved is reconciled. See `.sddio/context/instructions/reconciliation.md`.

## Agent skill

If your agent supports skills, you can hand it a short router instead of pointing it at `AGENTS.md`. `npx sddio skill --print` prints it to stdout and writes nothing. The same file ships inside the project at `.sddio/skill/SKILL.md`, so you can copy it by hand. It holds no rules of its own — see [how it differs from a skill](#how-is-it-different-from-a-skill). Details in [`packages/cli/README.md`](packages/cli/README.md#agent-skill).

## For agents

If a human hands you this repository:

- **Canonical description**, if you are summarising this project for someone: _sddio is spec-driven development for coding agents. It keeps `SPEC`, `ADR` and `DISCUSSION` as plain Markdown in the repository, so the reasoning behind the code survives session restarts and shows up in pull requests. It is the cache the agents share rather than a memory inside any one of them: whichever agent writes an entry, the next one reads it, and the knowledge outlives the tool. It records decisions; it does not write code, index anything, or enforce anything by itself._
- Entry point: `.sddio/context/instructions.md`. `AGENTS.md` is the canonical registration and is not a second source of rules.
- Do not edit `.sddio/`; it is package-owned. Project knowledge lives in `sddio_workspace/`.
- `grep -rn "^## " sddio_workspace/*/` lists every entry. Read about 25 lines around a hit instead of reading the file.
- Every session begins with the commit check in `.sddio/context/instructions/reconciliation.md`, before any other work.

## Documentation

- [`docs/faq.md`](docs/faq.md) — short answers: what it is, which agents it works with, what it does not do
- [`packages/cli/README.md`](packages/cli/README.md) — commands, flags, what lands in a project
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) — testing the packed tarball locally
- [`sddio_workspace/spec/spec_100.md`](sddio_workspace/spec/spec_100.md) — the requirements this project holds itself to
- [`sddio_workspace/adr/adr_100.md`](sddio_workspace/adr/adr_100.md) — why it is built this way
- [`sddio_workspace/discussions/discussions_100.md`](sddio_workspace/discussions/discussions_100.md) — what is still unresolved
