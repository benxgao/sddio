# Reconciliation

Reconciliation keeps durable project knowledge consistent with implementation.

## Trigger

Run after meaningful implementation changes or when a conflict is discovered.

## Process

```text
Observe
→ Compare
→ Identify affected artifacts
→ Reconcile
```

Check only affected:

- `SPEC`
- `ADR`
- `DISCUSSION`
- `FLOW`

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
