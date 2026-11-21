<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

<!-- entry -->
---
id: SPEC-003
type: requirement
status: active
refs: [ADR-001]
---

## Non-destructive init

- `sddio_docs/` is never overwritten without `--force`; assuming init merges is the usual way to lose a workspace.
- A partial run exits non-zero, so `sddio init && git add -A` cannot continue on a half-written tree.
- Not in the code: a reader of `init.ts` sees the rule, not what it costs to get it wrong.

- Check: node packages/cli/dist/cli.js --help → --force
<!-- entry -->
---
id: SPEC-004
type: requirement
status: active
refs: [ADR-001]
---

## `AGENTS.md` registration

- `AGENTS.md` is the only file sddio writes its entry point into; no other assistant's configuration is touched.
- The block stays delimited, so a later run replaces it instead of appending a second copy.
- Not in the code: one canonical entry point is a choice — writing into each agent's own directory also works, and was rejected (ADR-001).

- Check: node packages/cli/dist/cli.js init --dry-run --dir /tmp/sddio-claim-probe → AGENTS.md
<!-- entry -->
---
id: SPEC-005
type: constraint
status: active
refs: [ADR-002, ADR-010]
---

## Supported invocation modes

- Supported at this stage: `npx @sddio/cli` and a consumer `devDependency`.
- A global install is not claimed until it is tested.
- Not in the code: `package.json` says what is published, not which channels are promised.

<!-- entry -->
---
id: SPEC-006
type: requirement
status: active
refs: [ADR-001, ADR-005]
---

## Instructions are package-owned

- `.sddio/context/*` belongs to the package; an edit there is lost on the next upgrade.
- That includes `config.json` except its `hooks` array (ADR-011).
- Not in the code: ownership is invisible in the files — they read like ordinary Markdown in the repository.

- Check: grep -c 'Array.isArray(previous.hooks)' packages/cli/lib/init.ts → 1
<!-- entry -->
---
id: SPEC-007
type: requirement
status: active
refs: [ADR-006]
---

## Version control

- `sddio_docs/` must be committed; it is the only copy that survives the tool being removed.
- `init` runs no git command of its own — committing stays the user's step.
- The exception is a chosen hook: installing `flow-trail` runs its bootstrap, which uses git.
- Not in the code: the CLI never touches git, so nothing in the repository hints that its own knowledge has to be in it.

<!-- entry -->
---
id: SPEC-009
type: constraint
status: active
refs: [ADR-003]
---

## `packages/dashboard` stays empty

- No code lands there until someone can say what it is for.
- An empty package reads as "not started"; it must not be filled to look complete.
- Not in the code: an empty directory states neither the intent nor the prohibition.

<!-- entry -->
---
id: SPEC-010
type: requirement
status: active
refs: [ADR-006]
---

## The cursor must fail loudly

- An upgrade resets the cursor, so the first session after `npm i` reconciles once against the current state.
- A rewritten or vanished tip must keep its anchor in `previousCommit`.
- A missing cursor is `unknown`, never `current`: an absent baseline must not read as "nothing to do".
- Not in the code: the states and their order live in `instructions/reconciliation.md`; what is recorded here is the consequence of getting them wrong.

- Check: node packages/cli/dist/cli.js check → cursor
<!-- entry -->
---
id: SPEC-016
type: requirement
status: active
refs: [ADR-009]
---

## Bootstrap records at least one open question

- A first view of claims only overstates what the repository proves, so bootstrap writes at least one `DISCUSSION`.
- It is a floor, not a quota: a question invented to satisfy the rule is a defect.
- Not in the code: no command can tell an honest gap from a plausible one; the floor exists because silence reads as confidence.

- Check: grep -c DISCUSSION .sddio/context/instructions/bootstrap.md → 2
<!-- entry -->
---
id: SPEC-018
type: requirement
status: active
refs: [ADR-011]
---

## `init` declares a hook, and installs the one chosen

- The default is `flow-trail`, and choosing it installs it; a declaration with nothing behind it leaves a project looking wired when nothing calls it.
- An upgrade keeps `hooks` and re-downloads nothing — a second `init` must not re-wire a project that already answered.
- Not in the code: which hook a project chose is a human decision; the installer shows what ran, not why this project runs it.
- Check: node packages/cli/dist/cli.js --help → flow-trail
