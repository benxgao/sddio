# Instructions

## Startup

1. Read `principles.md`
2. Read `preferences.md`
3. Read `roadmap.md`
4. Read `routes/routes.md`
5. Run the commit check
6. Identify the current intent
7. Load only the minimum context required
8. Load detailed instructions only when required

If no usable `SPEC` exists, load `instructions/bootstrap.md`.

## Commit Tracking

`config.json` is the reconciliation cursor. Check it on every run.

```json
{
  "schemaVersion": 2,
  "lastProcessedCommit": "<sha>",
  "previousCommit": "<sha>"
}
```

- `lastProcessedCommit` — `HEAD` when reconciliation last completed.
- `previousCommit` — parent of `lastProcessedCommit`.
- Two commits are recorded so a rewritten or vanished tip still has an anchor.
- `null` means no baseline yet; the first run establishes one.

| State     | Cursor condition                      | Reconcile        |
| --------- | ------------------------------------- | ---------------- |
| current   | equals `HEAD`                         | nothing          |
| ahead     | ancestor of `HEAD`                    | `cursor..HEAD`   |
| rewritten | present, not an ancestor              | `cursor...HEAD`  |
| lost      | gone, `previousCommit` is an ancestor | `previous..HEAD` |
| unknown   | `null`, missing, or unresolvable      | current state    |

- Rows are ordered; the first match wins.
- Advance the cursor only after reconciliation completes.
- The cursor records commits, not uncommitted work.
- The cursor decides where to look; `sddio_workspace/` stays the source of truth.
- Procedure and edge cases: `instructions/reconciliation.md`.

## Core Loop

All work follows:

```text
Observe → Classify → Act → Reconcile
```

### Observe

Gather only the information required for the current task.

Prefer existing project artifacts before inspecting implementation.

### Classify

Classify durable information as:

```text
Requirement   → SPEC
Decision      → ADR
Uncertainty   → DISCUSSION
Work          → FLOW
Transient     → nothing
```

If multiple classifications apply, create only the artifacts that are necessary.

### Act

Load the relevant detailed instruction before creating or modifying an artifact.

Prefer updating existing artifacts over creating duplicates.

### Reconcile

After meaningful changes, verify that affected project knowledge remains accurate.

Update only stale or affected artifacts.

A resolved `DISCUSSION` is promoted into `SPEC` or `ADR`, then deleted — see `instructions/discussion.md`.

## Knowledge Rule

Record information only when it is likely to affect future work.

Do not record information merely because it was observed.

Prefer the smallest artifact that preserves future usefulness.

## Artifact Roles

- `SPEC` — confirmed system requirements
- `ADR` — important technical decisions
- `DISCUSSION` — unresolved knowledge
- `FLOW` — implementation work

Keep these roles distinct.

## Entry Style

Entry bodies are scannable lists, not prose.

1. One idea per line.
2. Bullets over paragraphs.
3. Keep lines under ~100 characters.
4. Facts only — no background, motivation, or history.
5. No filler: "clearly", "simply", "note that", "it is important".
6. Do not restate the title in the first bullet.
7. Reference other artifacts by ID; never repeat their content.
8. One level of nesting at most.
9. Omit a section that has nothing to say.
10. If a bullet needs two sentences, it is two bullets.

Shape test: every line is readable and actionable on its own.

## Detailed Instructions

Load only when needed:

| Need             | Instruction                      |
| ---------------- | -------------------------------- |
| Bootstrap        | `instructions/bootstrap.md`      |
| SPEC             | `instructions/spec.md`           |
| ADR              | `instructions/adr.md`            |
| DISCUSSION       | `instructions/discussion.md`     |
| FLOW             | `instructions/flow.md`           |
| Reconciliation   | `instructions/reconciliation.md` |
| Schema / entries | `instructions/entries.md`        |

## General Rules

- Do not invent requirements.
- Do not create artifacts for completeness.
- Do not duplicate existing knowledge.
- Do not load unrelated context.
- Do not rewrite accurate artifacts.
- Do not record transient implementation details.
- Write every entry body in Entry Style.
- A rule that can be checked names the command that checks it; a rule that cannot says it is judgement.
- Write a fact where it is read, and nowhere else.
- Prefer automatic, minimal, reversible actions.
- When intent cannot be determined safely, use `DISCUSSION`.
