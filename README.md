# sddio

A coding agent can read your code but not your judgement. sddio keeps that judgement in the repository, versioned with the code: what the project requires (`SPEC`), why it is built this way (`ADR`), what is still unresolved (`DISCUSSION`), and what is being worked on (`FLOW`).

Because it lives in the repository rather than in an assistant's memory, it survives session restarts, is reviewable in pull requests, and works with any agent — or with none.

## Quick start

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

`init` copies `.sddio/`, creates `sddio_workspace/`, registers `AGENTS.md`, and prints a prompt. **Paste that prompt into your coding agent** — the scaffold alone does nothing until the agent acts on it:

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

Commit `.sddio/` and `sddio_workspace/` with your next change.

## Layout

| Path | Owner | Rule |
| ---- | ----- | ---- |
| `.sddio/` | the CLI | context layer: instructions, schema, routes. Refreshed on `init`, so upgrades carry the current layer |
| `sddio_workspace/` | you and your agent | `spec/`, `adr/`, `discussions/`, `flow/`. Never overwritten |

Every session starts with a commit check: the cursor in `.sddio/context/config.json` is compared with `HEAD`, and only the range that moved is reconciled. See `.sddio/context/instructions/reconciliation.md`.

## Agent skill

Agents that support skills can be handed a short router instead of being pointed at `AGENTS.md`: `npx sddio skill --print` emits it on stdout and writes nothing. The file also ships inside the project at `.sddio/skill/SKILL.md`, so it can be copied by hand. See [`packages/cli/README.md`](packages/cli/README.md#agent-skill).

## Upgrading

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` is replaced, `sddio_workspace/` is left alone, and `init` prints a reconcile prompt to paste.

## Documentation

- [`packages/cli/README.md`](packages/cli/README.md) — commands, flags, what lands in a project
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) — testing the packed tarball locally
- [`sddio_workspace/spec/spec_100.md`](sddio_workspace/spec/spec_100.md) — the requirements this project holds itself to
- [`sddio_workspace/adr/adr_100.md`](sddio_workspace/adr/adr_100.md) — why it is built this way
