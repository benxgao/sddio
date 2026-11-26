# Migrating a 0.3.x project to 0.4.0

A repository scaffolded by any 0.3.x release carries one line that no longer works:

```text
Run `npx sddio start` before changing code — it prints the entries that constrain this work.
```

`npx sddio` is a 404. No package by that name has ever been published — the package is
`@sddio/cli`, and only its binary is called `sddio`. From 0.4.0 the command names both, and carries
a version. Everything else in the workspace is unchanged: same three paths, same six commands, same
cursor.

This page is written to be executed by an agent. A human only needs the summary: one `init`, one
`uninstall` if the project had a dependency, and a check that `start` still prints what it printed.

## What changes

| Path | Before | After |
| --- | --- | --- |
| `AGENTS.md` | the block runs `npx sddio start` | the block runs `npx -y @sddio/cli@0.4.0 start` |
| `.sddio/` | 0.3.x rules | 0.4.0 rules, same layout |
| `sddio_docs/` | your knowledge | untouched — never overwritten by an upgrade |
| `.sddio/context/config.json` | cursor and hooks | both kept |
| `package.json` | may list `@sddio/cli` as a devDependency | the entry goes away; nothing replaces it |
| `.sddio/evals/events.jsonl` | local log | untouched |

## For the agent

Run these from the repository root, in this order. Stop and report if a gate fails.

### 0. Confirm it is a 0.3.x workspace

```bash
grep -n "npx sddio" AGENTS.md .sddio/context/instructions.md
grep -n '"@sddio/cli"' package.json 2>/dev/null || echo "no package.json entry"
```

The first command printing a hit means this page applies. The second tells you whether step 2 has
anything to remove — a Python, Go or Rust project usually answers "no package.json entry", and then
step 2 is skipped entirely.

### 1. Refresh the workspace with 0.4.0

```bash
npx -y @sddio/cli@0.4.0 init
```

This overwrites `.sddio/`, replaces the block in `AGENTS.md` in place, and prints one prompt. If it
prints one, hand it to the session the way `init` describes: it is the reconcile pass, and it is the
whole reason the rules can change without the knowledge going stale.

Do not pass `--force`: it also resets the `sddio_docs/` seeds to empty. Do not pass `--hook` unless
the project already declares one — `init` keeps the existing declaration, including its absence.

Gate: `grep -n "npx" AGENTS.md` now shows `npx -y @sddio/cli@0.4.0 start`.

### 2. Stop the project from carrying the CLI

Only if step 0 found a `package.json` entry:

```bash
npm uninstall @sddio/cli
```

The dependency disappears from `package.json` and the lockfile. `node_modules/@sddio` may remain as
an empty directory; it is harmless and `rm -rf node_modules/@sddio` is fine if you want it gone.

Nothing takes its place. The CLI now lives in npm's cache, and the version lives in `AGENTS.md` —
that is the whole migration.

### 3. Verify

```bash
npx -y @sddio/cli@0.4.0 --version     # 0.4.0
npx -y @sddio/cli@0.4.0 start         # the same output the project had before
git status --short                    # .sddio/, AGENTS.md, and the lockfile only
```

`sddio_docs/` must not appear in `git status`. If it does, something ran with `--force`; restore it
with `git checkout -- sddio_docs`.

## The global install

`npm install -g @sddio/cli@0.4.0` is not part of this migration, and it changes nothing about what
the agent runs. The block names a version explicitly, so `npx` runs that version whether or not a
copy sits on `PATH`.

What a global install buys is a bare `sddio` for a human's fingers. What it costs is a write outside
the project, a permission prompt on the Node installs that live in a system prefix, and a version
recorded nowhere in any repository. Do it only if the user asks, and never in CI — the explicit
command works there with nothing installed.

Measured 2026-11-27, with `@sddio/cli@0.3.2` installed in the project:

| Command | Prints |
| --- | --- |
| `npx -y @sddio/cli@0.4.0 --version` | `0.4.0` — the named version wins |
| `npx @sddio/cli --version` | `0.3.2` — the local copy shadows the unversioned form |
| `./node_modules/.bin/sddio --version` | `0.3.2` |

So the order above is safe: step 1 can run while the old dependency is still installed, and it is
the pin that decides which code runs.

## What not to do

- **Do not hand-edit the block in `AGENTS.md`.** The version is generated from the package; a typo
  makes the line point at a release that does not exist, which is the state being migrated away from.
- **Do not hand-edit `.sddio/`.** It is package-owned and replaced on the next `init`.
- **Do not delete `.sddio/` to start clean.** The cursor and the hooks are in `config.json`; deleting
  the folder forgets which commit the knowledge was reconciled against.
- **Do not add `@sddio/cli` back as a devDependency** to "pin" it. The pin is the command.

## Rollback

```bash
git checkout -- .sddio AGENTS.md
npm install --save-dev @sddio/cli@0.3.2
```

That restores the previous state exactly, including the 404: the old block runs `npx sddio start`,
which only works for someone who already has the binary installed locally.

## The prompt to paste

```text
This project was scaffolded by sddio 0.3.x, and the command in its AGENTS.md block
(`npx sddio start`) is a 404 — no package by that name exists. Migrate it:

1. `npx -y @sddio/cli@0.4.0 init` at the repository root. If it prints a prompt, that
   prompt belongs in this session: paste it and do what it asks.
2. If `package.json` lists `@sddio/cli`, run `npm uninstall @sddio/cli`. Nothing
   replaces it, and a project with no `package.json` skips this step.
3. Verify: `npx -y @sddio/cli@0.4.0 start` prints what `start` printed before, and
   `git status --short` shows only `.sddio/`, `AGENTS.md` and the lockfile.

Full procedure: https://github.com/benxgao/sddio/blob/master/docs/migrate-0.4.md

Do not install anything globally unless I ask. Do not hand-edit `.sddio/` or the block
in `AGENTS.md`, and do not run `init --force`.
```
