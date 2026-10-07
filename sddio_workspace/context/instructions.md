# Instructions

## Startup

1. Read `principles.md`
2. Read `preferences.md`
3. Read `roadmap.md`
4. Read `routes/routes.md`
5. Identify the current intent
6. Load only the minimum context required
7. Load detailed instructions only when required

If no usable `SPEC` exists, load `instructions/bootstrap.md`.

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
- Prefer automatic, minimal, reversible actions.
- When intent cannot be determined safely, use `DISCUSSION`.
