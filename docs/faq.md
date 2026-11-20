# sddio FAQ

> sddio is spec-driven development for coding agents. `npx sddio init` writes a small context layer and a workspace into your repository, then prints one prompt to paste into your agent. Everything it produces is plain Markdown committed with your code, so the reasoning behind the code survives session restarts.

These are the questions the project actually gets asked. A few of them are objections that arrived with a question mark attached, and they get answered with the same patience. Every answer stands on its own, so you can quote one without the rest of the page.

中文速览：[`faq.zh-CN.md`](faq.zh-CN.md)。

Last reviewed: October 2026. Everything here describes `@sddio/cli` at its current release. If an answer and the [README](../README.md) disagree, the README wins.

## What is sddio?

A small command-line tool, and the habit it's trying to make easy. The habit is this: keep the reasoning about a project in the repository, beside the code, instead of in a chat window that closes. It records three kinds of Markdown file (`SPEC`, `ADR`, `DISCUSSION`), commits them alongside the code, and leaves your agent a short instruction to read when a session starts. It's MIT-licensed, needs Node ≥ 18, and has one devDependency. There isn't anything cleverer in it than that.

## What is spec-driven development?

Writing down what a change has to be true about before writing the code that makes it true, so the requirement can be argued about on its own, by someone who isn't staring at a diff. That idea is older than any of these tools; sddio just applies it at the project level rather than per feature: one standing set of requirements, decisions and open questions, kept roughly current against `HEAD`. It doesn't build a new spec tree for every feature. That part is usually where people quietly give up.

## Which coding agents does sddio work with?

Any agent that can read files in the repo, which is most of them: Claude Code, Codex, Cursor, Copilot, or a local model with the repo in front of it. It doesn't write agent-specific configuration and stays out of an agent's config directory. It registers itself through `AGENTS.md`, which most agents already glance at, and if yours understands skills you can hand it a short router instead with `npx sddio skill --print`. If your tool supports none of that, the files are still just Markdown. You can read them yourself, which is rather the point.

## What is the difference between SPEC, ADR and DISCUSSION?

A rough way to hold it in your head:

- `SPEC` — what has to be true of the product. Testable statements, not plans.
- `ADR` — why the implementation is the way it is, including the option you turned down.
- `DISCUSSION` — what's still unresolved, written down while it's still open, which is the only time it's cheap to write.

All three are knowledge. All three are plain Markdown headings, so `grep` is the query language and there's nothing new to learn. What is being worked on right now is not one of them: that belongs to a board, or to [flow-trail](https://github.com/benxgao/flow-trail), which sddio names as its default hook.

## Is sddio a skill? How does it relate to Claude Code skills?

No, and it isn't trying to replace one. A skill tells an agent how to do a piece of work, and it is written to apply in every repository; sddio records what one particular project has already decided and why. Complementary rather than competing: the skill is the part that travels between projects, sddio is the part that only makes sense in one. There is a small `SKILL.md` in the box, but it's a router rather than a rulebook: check that `.sddio/context/instructions.md` is there, list entries with `grep`, read about 25 lines around a hit, then hand the format back to the context layer. Because it holds no rules of its own, an upgrade to the context layer can't leave it claiming something stale. Agents without skills just use `AGENTS.md`, and lose very little. The [README](../README.md#how-is-it-different-from-a-skill) has the side-by-side.

## Do two different agents share what they learned?

Yes, and that's the part worth having. An agent's own memory is scoped to the tool, the account and often the machine, so the second agent starts cold and re-derives decisions that were already settled — sometimes to a different conclusion. The workspace is one directory of Markdown in git with no per-agent state: whatever the first agent wrote, the second reads at session start. Moving from Claude Code to Codex, running both on the same repository, or handing the repo to a colleague on a different tool all cost about the same nothing. One honest caveat, and it's about the agent rather than the design: a cache only counts if something reads it, so an agent that ignores `AGENTS.md` learns nothing from any of this.

## Is this just AGENTS.md with extra steps?

Partly, and it's worth being honest about which part. If a rulebook is all you need, `AGENTS.md` is enough, and sddio adds three lines to it and stops there. The difference is the other half, the half that rots. A hand-written `AGENTS.md` keeps claiming the same things year after year, and nobody notices when it drifts. `sddio_workspace/` gets compared with `HEAD` at the start of a session, so the entries that recent commits made stale are the ones the agent re-reads. If that kind of decay has never bitten you, keep the single file and be happy with it.

## Does it run on its own, or do I maintain it by hand?

It doesn't run on its own, and that's deliberate: no daemon, no git hook, no background job, no network call. It works when an agent opens a session and reads `AGENTS.md`. The commit check is an instruction the agent then follows, not a process watching your repository. Manual work comes at two moments: `init` plus one paste, and after a package upgrade, pasting the reconcile prompt it prints. Nothing else is scheduled. The honest cost: if your agent never reads `AGENTS.md`, or you work in an editor with no agent in it, nothing happens at all. The files sit there, quietly correct and unused.

## Does it overwrite AGENTS.md or files I already have?

No, and it's careful about this. Without `--force`, `init` only writes files that aren't there yet. An existing `AGENTS.md` is left alone, with a three-line block appended between `<!-- sddio:begin -->` and `<!-- sddio:end -->`; run it again and that block is updated in place rather than duplicated. The one thing replaced on purpose is `.sddio/`, which belongs to the package and gets refreshed on every init and upgrade. `sddio_workspace/` is only touched by `--force`, and `--force` resets it to empty seeds. That flag is for starting over, not for merging. So please don't try it on a folder you care about.

## Doesn't it add context to every session?

Yes, a little, and the design tries to keep that "a little" honest: startup reads four short files and runs the commit check, the detailed instructions wait until they're needed, entries are bullet lists rather than paragraphs, and the skill asks the agent to `grep` headings and read around a hit instead of reading a whole collection. No token benchmark has been published, so please don't trust any number you see about this, including ours. The comparison worth making is with what it replaces: an agent working the same reasoning out again from the code, usually worse and always from scratch.

## Is it worth it on a solo project?

It depends on how long the project lives, and I'd rather say that than sell you something. For a weekend script: no. Three kinds of file cost more attention than the memory they save, and the repo says as much. It starts paying off when the work comes back after a gap: you return in three weeks, or two agents touch the same code in turn, or you explain the same trade-off for the third time and hear yourself getting tired of your own voice. The trigger is repetition, not team size. One person working on something for two years needs this more than a team that ships once and moves on.

## Does it replace my issue tracker?

No, and it doesn't try. sddio records what was settled; it has no concept of a task, a status, a backlog, an assignee or a notification. Work tracking is a different job, and it belongs in a different tool. If you want that tool to live in the repo too, [flow-trail](https://github.com/benxgao/flow-trail) is the one this project uses — three folders, a card per piece of work — and the `hooks` field in `.sddio/context/config.json` names it by default. Issues, sprints and roadmaps still belong in whatever your team opens every morning.

## Does sddio send my code anywhere?

No. There's no account, no server, no telemetry, no analytics, no update check. The CLI reads and writes files inside the project directory you point it at, and runs no git commands of its own — with one exception you have to ask for: choosing a hook installs it, and installing `flow-trail` curls its bootstrap, which fetches a tag with `git` and keeps its checkout in `~/.flow-trail`. Answer "none" and nothing leaves the project. Committing the two new folders is yours to do, at your own pace. Uninstalling is deleting `.sddio/` and the package, and nothing is left behind to phone home.

## Does it work in an existing project or a monorepo?

Yes, and this is the case most people arrive with. `sddio init --dir <path>` targets any directory, so you can initialise the repo root or a single package; each location gets its own `.sddio/` and `sddio_workspace/`. On an existing project the first prompt asks the agent to derive a minimum `SPEC` from the code, tests, config and docs already there, rather than asking you to sit down and retell what you built. It will get some of it wrong. You fix that, and the fix is the first thing worth committing.

## What happens if I stop using sddio?

Nothing much, which is the point. `SPEC`, `ADR` and `DISCUSSION` are ordinary Markdown files in your repo. Delete `.sddio/` and the package, and `sddio_workspace/` is still readable, still reviewable, still a diff. No export step, no migration, and nothing holding your notes hostage.

## How is sddio different from Spec Kit and OpenSpec?

Spec Kit and OpenSpec plan features. Both get invoked when you start work, and both build a per-feature structure to hold the plan. sddio records a project: one standing set of requirements and decisions, reconciled at session start against whatever commits moved since last time, with no per-feature command to remember. Which is better depends on what you're doing. For a large feature starting from a clean slate, the per-feature tools are a fair fit. For the long middle of a project, the thing that keeps failing is memory. None of the three collects usage data; sddio sends nothing at all. The [comparison section](../README.md#how-is-it-different-from-spec-kit-and-openspec) has the detail, checked in October 2026.

## Can I use the method without the CLI?

Yes, and the repo says so on purpose. The three questions are the product; the CLI is scaffolding around them. Copy them into a Notion page, a PR template or a team wiki and you keep most of the benefit for none of the install. What the CLI removes is the one step people skip when they're busy: opening the files at the start of a session, and updating the ones the last commits made stale. That step is boring. Which is exactly why a tool does it better than a well-meaning person does.
