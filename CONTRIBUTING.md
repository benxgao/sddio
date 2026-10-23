# Contributing

Thanks for looking. This is a small project with a narrow scope, so the fastest way to get a change merged is to keep it small and to say what it costs.

## Before you build

Node 20 or 22 — the versions CI runs. The package still installs on 18, but 18 is end-of-life and is not tested.

```bash
cd packages/cli
npm install
npm test
```

`npm test` builds first, regenerates `templates/` from the repository root `.sddio/`, and then runs the suite. It covers the CLI, the prompt copies in both READMEs, and the skill. It has to pass before you open a pull request.

`packages/cli/TESTING.md` covers testing the packed tarball against a real project — worth reading if you touch paths, templates or packaging.

## This repository runs on sddio

The repository uses the tool it ships; `AGENTS.md` is the entry point.

- Read `.sddio/context/instructions.md` before changing behaviour. The rules that govern the CLI are also the rules that govern contributions.
- A change that moves a guarantee needs an entry in `sddio_workspace/` in the same commit: a `SPEC` for a requirement, an `ADR` for a trade-off, a `DISCUSSION` for something the repository cannot settle.
- You do not have to fill every collection. An accurate `DISCUSSION` is worth more than a speculative `SPEC`.

## What gets merged

- Behaviour changes come with a test that fails without the change.
- Prompt text is edited in `lib/prompt.ts`. The copies in both READMEs are asserted against it, so editing the README alone will fail CI.
- One concern per pull request. A drive-by refactor next to a fix will be asked to split.
- If you are unsure whether something is in scope, open an issue before writing code.

## Out of scope

- A search or index command. It was built once and removed; the reasons are recorded in `sddio_workspace/discussions/`.
- A hosted service, an account system, or telemetry. These are permanent non-goals, not pending work.
- Agent-specific adapters. `AGENTS.md`, the printed prompt and the skill are the whole integration surface.

## Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
