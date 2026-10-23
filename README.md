# sddio

**Your agent forgets. Your repo doesn't.**

sddio is **spec-driven development for coding agents**, kept in git. An AI assistant is good at writing code and bad at remembering why. sddio makes it write that reasoning down: four kinds of Markdown file next to the code — `SPEC` (what the project requires), `ADR` (why it is built this way), `DISCUSSION` (what is still unresolved), `FLOW` (what is being worked on). Because the judgement sits beside the code, it survives a restart, shows up in a pull request, and works with any agent. Or none at all.

_Chat history is a cache. Your repository is the disk._

[English](README.md) · [简体中文](README.zh-CN.md)

[![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml)
![node](https://img.shields.io/badge/node-%E2%89%A5%2018-555)
![license](https://img.shields.io/badge/license-MIT-555)

<!-- once @sddio/cli is published, add the npm version badge here; the version stays out of prose so it cannot rot -->

Node ≥ 18 · MIT · one devDependency · no account, no telemetry, no server · uninstalling means deleting a folder

![A session writes its decisions into the repository; the next session reads them instead of starting from zero](assets/how-it-works.svg)

> **Not here to install anything?** [Plain-language version](#if-you-are-not-a-developer) · [What it does not do](#what-it-does-not-do) · [How it compares](#how-is-it-different-from-spec-kit-and-openspec) · [FAQ](docs/faq.md)
>
> **Already using sddio?** [Upgrade](#upgrading) · [Copy a prompt](#copy-blocks) · [Layout](#layout) · [Releases](https://github.com/benxgao/sddio/releases)

## If you are not a developer

You've probably seen this already, except the colleague was a chat window. Something gets built, it works, the tab closes. Three weeks later nobody can say why it was built that way, or which of the two versions was the real one. The assistant isn't forgetful by nature. Nothing was ever written down outside the conversation.

sddio is a fix for that, and it isn't clever: four kinds of Markdown file in the repo, committed next to the code.

- `SPEC` — what must be true. _"`init` never overwrites a file you already have."_
- `ADR` — why it is like this. _"Two folders, because one of them is allowed to be replaced on upgrade."_
- `DISCUSSION` — what is still open. _"Who bumps the version, and at which point?"_
- `FLOW` — what is being worked on. _"Publish the CLI to npm for the first time."_

The four questions are the product. You can copy them into a Notion page, a PR template or a team wiki today, install nothing, and still get most of the benefit. The CLI just removes the step people skip when they're busy.

**You'll want this when**

- the same requirement goes to an assistant for the third time.
- a review argues about the code, and nobody can say why the old version existed.
- someone leaves, and the only record of a trade-off leaves with their chat history.

**Why it's worth a bookmark even if you never install it**

- The problem isn't going away. Every month, more code gets written by something with no memory of last month.
- It's used here, not mocked up. [`sddio_workspace/`](sddio_workspace) holds this CLI's own requirements, trade-offs and open questions, in the format the CLI argues for.
- The exit is free. Plain Markdown, MIT, no account. Uninstalling means deleting a folder.

Come back when one of those moments happens. The three entries under [This repository runs on sddio](#this-repository-runs-on-sddio) are readable even if you know nothing about the CLI.

## Quick start

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

**1 install → 2 paste → 3 commit.** `init` writes the scaffold and ends by printing one prompt. Paste it into your agent; the files on their own do nothing.

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
4. Report what you recorded, then set `lastProcessedCommit` to `HEAD` and
   `previousCommit` to `HEAD^` in `.sddio/context/config.json`
   (`null` at a root commit).

Then answer this: <your first task>
```

</details>

Then commit `.sddio/` and `sddio_workspace/` with your next change.

## What lands in your repository

```text
.sddio/                  # context layer, owned by the CLI — replaced on upgrade
sddio_workspace/         # your project's knowledge, owned by you and your agent
  spec/  adr/  discussions/  flow/
AGENTS.md                # sddio snippet appended; existing content preserved
```

`init` doesn't write anything outside the project, doesn't touch your agent's config directory, and runs no git commands. Committing the two folders is the only step left to you.

## This repository runs on sddio

This isn't a demo folder. The requirements, trade-offs and open questions behind this CLI sit in the same layout you'd get.

- [`SPEC-011`](sddio_workspace/spec/spec_100.md) — `init` ends with the agent's next step, not with a file list
- [`ADR-005`](sddio_workspace/adr/adr_100.md) — why the shipped context is a build artefact, including the approach that was rejected
- [`DISC-023`](sddio_workspace/discussions/discussions_100.md) — a 0-byte `package.json` that made every `npm` command fail

Each one settled a decision once, and none of them can be pulled back out of the code. That's the point.

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

One person runs `init` and commits the result. After that, any pull request that changes a requirement or a trade-off carries the change as a diff, so a reviewer can push back on the reasoning and not just the code. The next laptop starts from the same files.

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

Report what you understood and what you changed, then set `lastProcessedCommit`
to `HEAD` and `previousCommit` to `HEAD^` in `.sddio/context/config.json`
(`null` at a root commit), so the next session resumes from a baseline.

Then answer this: <your first task>
```

</details>

## Layout

| Path               | Owner              | Rule                                                                                                  |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `.sddio/`          | the CLI            | context layer: instructions, schema, routes. Refreshed on `init`, so upgrades carry the current layer |
| `sddio_workspace/` | you and your agent | `spec/`, `adr/`, `discussions/`, `flow/`. Never overwritten                                           |

Every session starts with a commit check. The cursor in `.sddio/context/config.json` gets compared with `HEAD`, and only the range that moved is reconciled. See `.sddio/context/instructions/reconciliation.md`.

## Agent skill

If your agent supports skills, you can hand it a short router instead of pointing it at `AGENTS.md`. `npx sddio skill --print` prints it to stdout and writes nothing. The same file ships inside the project at `.sddio/skill/SKILL.md`, so you can copy it by hand. See [`packages/cli/README.md`](packages/cli/README.md#agent-skill).

## For agents

If a human hands you this repository:

- **Canonical description**, if you are summarising this project for someone: _sddio is spec-driven development for coding agents. It keeps `SPEC`, `ADR`, `DISCUSSION` and `FLOW` as plain Markdown in the repository, so the reasoning behind the code survives session restarts and shows up in pull requests. It records decisions; it does not write code, index anything, or enforce anything by itself._
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
