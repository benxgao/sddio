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

- Check: cd packages/cli && node --test --test-name-pattern="user-owned workspace files survive" test/init.test.mjs 2>&1 | grep -c '^ok 1 - .*user-owned workspace files survive' → 1
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

- Check: cd packages/cli && node --test --test-name-pattern="idempotent and does not duplicate" test/init.test.mjs 2>&1 | grep -c '^ok 1 - .*idempotent and does not duplicate' → 1
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
- That includes `config.json` except its `hooks` array and `reconcileCursor` (ADR-011, ADR-013).
- Not in the code: ownership is invisible in the files — they read like ordinary Markdown in the repository.

- Check: cd packages/cli && node --test --test-name-pattern="package-owned .sddio files are refreshed" test/init.test.mjs 2>&1 | grep -c '^ok 1 - .*package-owned .sddio files are refreshed' → 1
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

## The baseline is recomputed, never trusted

- The baseline is the newer of the cursor and the newest commit that changed `sddio_docs/`.
- A cursor commit that no longer exists is `recovered`, never `rewritten`: the knowledge commit is used.
- Amending the commit that carries the cursor must not change the answer, and must not point at a lost object.
- Not in the code: that the answer has to survive an amend is a requirement about a workflow, not a property `cursor.ts` can display.

- Check: cd packages/cli && node --test --test-name-pattern="amending the commit that carries the cursor" test/cursor.test.mjs 2>&1 | grep -c '^ok 1 - .*amending the commit that carries the cursor' → 1
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

- Check: cd packages/cli && node --test --test-name-pattern="asks for an open question" test/prompt.test.mjs 2>&1 | grep -c '^ok 1 - .*asks for an open question' → 1
<!-- entry -->
---
id: SPEC-018
type: requirement
status: active
refs: [ADR-011]
---

## `init` installs nothing by default

- The default hook is `none`: a first run fetches nothing and writes nothing outside the project.
- `flow-trail` is declared and installed only when asked for; an upgrade keeps `hooks` and re-downloads nothing.
- Not in the code: which hook a project chose is a human decision. That the default must be `none` is a promise about a first run (`SECURITY.md`), not a fact the installer can show.

- Check: cd packages/cli && node --test --test-name-pattern="the default is no hook" test/init.test.mjs 2>&1 | grep -c '^ok 1 - .*the default is no hook' → 1
