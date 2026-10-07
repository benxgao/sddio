# Rollout: <Short Title>

schema: 0.1.0

## Summary

- Problem: <what is wrong>
- Goal: <what this rollout achieves>
- Approach: <one-line approach>
- Risk: <Low | Medium | High>

## Context

### Existing

- <existing component / pattern>
- <existing component / pattern>

### Problems

- <problem> — `<path>` — <evidence>
- <problem> — `<path>` — <evidence>

### Related

- SPEC: `<id>`
- ADR: `<id>`
- DISCUSSION: `<id>`
- FLOW: `<id>`

## Scope

### In

- <item>
- <item>

### Out

- <item>
- <item>

### Files

| Action | Path     | Reason   |
| ------ | -------- | -------- |
| Create | `<path>` | <reason> |
| Modify | `<path>` | <reason> |
| Delete | `<path>` | <reason> |

## Constraints

- <constraint>
- <constraint>

## Decisions

| Decision   | Reason   | Source                      |
| ---------- | -------- | --------------------------- |
| <decision> | <reason> | `<SPEC / ADR / DISCUSSION>` |
| <decision> | <reason> | `<SPEC / ADR / DISCUSSION>` |

## Docs Check

- [ ] Relevant `SPEC` reviewed
- [ ] Relevant `ADR` reviewed
- [ ] Relevant `DISCUSSION` reviewed
- [ ] Relevant roadmap / strategy reviewed
- [ ] No unresolved decision blocks execution

### Docs Changes

- Create: `<path>` — <reason>
- Update: `<path>` — <reason>
- Remove: `<path>` — <reason>
- None: <if no documentation changes are required>

## Hotfix

- <minimum change that restores / unblocks the user>
- <why it is safe and sufficient>

## Phases

### Phase 1 — <Name>

Progress: `[ ]`

Goal: <one sentence>

Layer: `<dependency layer>`

Files:

- `<path>` — <create / modify / delete>
- `<path>` — <create / modify / delete>

Steps:

- [ ] 1.1 — <work item>
- [ ] 1.2 — <work item>

Verify:

- <verification>

Checkpoint:

- Goal: `[ ]`
- Drift: <none / description>
- Docs: <none / update>

---

### Phase 2 — <Name>

Progress: `[ ]`

Goal: <one sentence>

Layer: `<dependency layer>`

Files:

- `<path>` — <create / modify / delete>
- `<path>` — <create / modify / delete>

Steps:

- [ ] 2.1 — <work item>
- [ ] 2.2 — <work item>

Verify:

- <verification>

Checkpoint:

- Goal: `[ ]`
- Drift: <none / description>
- Docs: <none / update>

---

### Phase 3 — <Name>

Progress: `[ ]`

Goal: <one sentence>

Layer: `<dependency layer>`

Files:

- `<path>` — <create / modify / delete>

Steps:

- [ ] 3.1 — <work item>
- [ ] 3.2 — <work item>

Verify:

- <verification>

Checkpoint:

- Goal: `[ ]`
- Drift: <none / description>
- Docs: <none / update>

## Dependency

```text
<Phase 1>
    ↓
<Phase 2>
    ↓
<Phase 3>
```

## Verification

- Phase verification: verify once at the producing phase
- Cross-phase validation: `<validation command / CI>`
- User-visible verification: `<manual E2E path>`

## Success Criteria

- <observable criterion>
- <observable criterion>
- <observable criterion>

## Rollback

1. <rollback step>
2. <rollback step>

## Open Questions

- [ ] `C-XXXX` — <question>
- [ ] `C-XXXX` — <question>

> Blocking questions must be answered by the user before the dependent phase starts.
> The AI records the user's answer; it does not invent one.

## Completion

- [ ] All phases completed
- [ ] Verification passed
- [ ] Docs synchronized
- [ ] Open blocking questions resolved
- [ ] FLOW moved to `completed`

## Authoring Rules

- Keep the plan concise and execution-ready.
- Use evidence and exact paths where available.
- Keep each phase within one dependency layer.
- Split a phase when it is too large to review, revert, or verify safely.
- Do not execute against a conflicting accepted ADR.
- Remove sections that genuinely do not apply.
- Prefer explicit references over prose.
- Verify once; cite the result instead of repeating verification.
