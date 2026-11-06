# Reconciliation

Reconciliation keeps durable project knowledge consistent with implementation.

## Trigger

- **Startup** — the commit check runs on every session, before any work.
- **After work** — after meaningful implementation changes.
- **Conflict** — when implementation and artifacts disagree.

## Commit Check

Read `.sddio/context/config.json`, then resolve the cursor with git.

- `HEAD` — `git rev-parse HEAD`
- Exists — `git cat-file -e <sha>^{commit}`
- Ancestor — `git merge-base --is-ancestor <sha> HEAD`

Evaluate in order; stop at the first match.

| State     | Condition                                | Range            |
| --------- | ---------------------------------------- | ---------------- |
| current   | `lastProcessedCommit` equals `HEAD`      | none             |
| ahead     | it is an ancestor of `HEAD`              | `last..HEAD`     |
| rewritten | it exists, is not an ancestor            | `last...HEAD`    |
| lost      | it is gone, `previousCommit` is ancestor | `previous..HEAD` |
| unknown   | `null`, absent, or unresolvable          | current state    |

- `current` — no reconciliation; continue with the request.
- `ahead` — reconcile only the new commits.
- `rewritten` — amended, rebased, or reset history; reconcile both sides.
- `lost` — the anchor survives but the tip does not; reconcile from the anchor.
- `unknown` — verify artifacts against the current implementation, not the whole repository.
- A shallow clone with a missing cursor commit is `unknown`, never `rewritten`.
- No git repository, or no git binary — skip the check, leave the cursor untouched.
- Report the state and the reconciled range; do not reconcile silently.

## Cursor Update

After reconciliation completes:

1. `previousCommit` ← `HEAD^`; `null` at a root commit.
2. `lastProcessedCommit` ← `HEAD`.
3. Preserve `schemaVersion`.
4. Write nothing when the state was `current`.

- Write only after the artifacts are updated.
- Do not advance the cursor when reconciliation is skipped, partial, or abandoned.
- The cursor holds commits only; uncommitted work is re-examined on the next run.

## Process

```text
Observe
→ Compare
→ Identify affected artifacts
→ Reconcile
→ Advance cursor
```

Check only affected:

- `SPEC`
- `ADR`
- `DISCUSSION`
- `FLOW`

Both sides of the range, by name:

```bash
git diff --name-only <range>
```

A changed file matters only if it is named by an entry body in `SPEC`, `ADR`, or `DISCUSSION`. A file no
entry names is not this layer's problem.

## Rules

- Do not rescan unrelated project areas.
- Do not rewrite accurate artifacts.
- Do not create artifacts merely because implementation changed.
- Update the smallest affected artifact.
- Remove or resolve stale information when appropriate.

## Conflict

When implementation and project artifacts disagree:

1. Determine whether the implementation or artifact is stale.
2. Preserve the confirmed requirement.
3. Update the stale representation.
4. If intent cannot be determined, create `DISCUSSION`.
