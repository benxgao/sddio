# Rollout Plan Template

Use this template when a user asks for a rollout plan, phased plan, migration plan, implementation plan, or any similar planning artifact.

## Style goals

- Write the plan as a decision-quality engineering document, not a short task note.
- Prefer explicit reasoning over vague bullets.
- Start with the smallest high-impact fix first when there is a confirmed root cause.
- Keep dependency boundaries clear.
- Make phases independently testable.
- Identify a minimum-viable hotfix path (usually first 1–2 phases) before progressive hardening.
- If a phase is too large for one safe commit, split it into sub-subphases that are independently reviewable, revertible, and verifiable.
- Prefer wording that makes the plan easy to execute incrementally in separate commits.
- At plan-creation time, check planned tasks/implementations against existing ADRs (`v1/spec/adr/YYYY-MM.md`); never plan execution against an accepted ADR unless the plan explicitly addresses the conflict and the corresponding open question is confirmed.

## Progress markers

Use these markers in the document itself:

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — completed and verified
- `[!]` — blocked

Only mark a sub-subphase as `[x]` after its work item is complete (execution-only checkboxes — no per-sub-subphase verification line).
Only mark a phase as `[x]` after all child items are `[x]` and the phase-level verification gate passes.

Verification is **single-pointed** (verify once, cite everywhere): one phase-level verification line per phase (ADR-0010 rule 3); the step that produces a fact verifies it, later consumers (Eval, lane gates) cite the result instead of re-running checks. The only re-runnable cross-phase gate is `scripts/validate.sh`, executed by CI on the phase's pull request (local runs are on demand — ADR-0031).

## Required structure

````markdown
# Rollout: <Short, specific title>

## Summary

<One or two paragraphs describing the problem, intent, and why this rollout exists.>

## Current Evaluation

### What already exists

- <existing component/system/pattern>
- <existing component/system/pattern>

### What is not centralized / stable / complete yet

#### 1. <Problem area>

- <evidence>
- <evidence>

Representative files:

- `<path>`
- `<path>`

#### 2. <Problem area>

- <evidence>
- <evidence>

### Risks in the current state

- [ ] <risk>
- [ ] <risk>
- [ ] <risk>

## Scope

- Estimated files to create: <n>
- Estimated files to modify: <n>
- Risk level: <Low | Medium | High>

### In scope

- <item>
- <item>

### Out of scope

- <item>
- <item>

## Minimum Viable Hotfix

- <Phase(s) that unblock users immediately>
- <Why these phases are safe/minimal>

## Docs Impact

> Complete this section at planning time — before writing any code.
> Load [`v1/spec/ai/guide.md`](../../spec/ai/guide.md) and [`v1/spec/ai/assistant-context-index.md`](../../spec/ai/assistant-context-index.md) to identify relevant docs, and scan the ADR logs in `v1/spec/adr/` (`YYYY-MM.md`) for accepted decisions that constrain the planned work.

### Docs checked during planning

| Doc                           | Relevant finding              |
| ----------------------------- | ----------------------------- |
| `v1/spec/<section>/<file>.md` | <what you found or confirmed> |

### Docs-First Retrieval Checklist

> Complete this section before writing any code. This checklist is **required** in every rollout plan.

- [ ] Loaded all primary docs for this task type from [`v1/spec/ai/guide.md`](../../spec/ai/guide.md).
- [ ] Reviewed existing ADRs in `v1/spec/adr/` (month logs `YYYY-MM.md`) — every planned action that touches an accepted decision is compliant, or the deviation is explicitly addressed in this plan.
- [ ] **Read the project strategy roadmap** (`spec/product/strategy-roadmap.md`) — the planning compass. A plan vision that conflicts with it is a **significant issue**: register a concern/ADR and resolve by updating the roadmap **or** the plan before execution (never both drifting).
- [ ] Reviewed the concerns register (`v1/spec/concerns/`, month logs `YYYY-MM.md`) for prior answers to this task's questions — no re-asking of answered concerns.
- [ ] **Archive/report exclusion (ADR-0019)**: `40-archive/` plans and `50-report/` reports are **on-demand, explicitly-cited references only** — not scanned by default while authoring this plan; any archive/report consulted is cited by path here or in `## Docs Impact`.
- [ ] Declared initial `Docs Needed` list before implementation planning.
- [ ] Assessed sufficiency — docs were **sufficient** / **insufficient** _(strike one)_.
  - If insufficient: docs that were missing, ambiguous, or outdated: `<list here>`
  - If insufficient: fallback code scan was used for this specific decision: `<describe here>`
  - If insufficient: docs were updated in this rollout or explicitly blocked with owner + due date: `<capture action>`
- [ ] For each major decision, recorded a `Decision Evidence Log` row.
- [ ] Post-task docs update required: `[ ] Yes` — captured in Docs to update below | `[ ] No` — docs remain accurate after this change.

### Docs Needed (planning + implementation)

> **Mandatory gate**: no implementation work starts until this table is populated.

| Doc                           | Why needed                                         |
| ----------------------------- | -------------------------------------------------- |
| `v1/spec/<section>/<file>.md` | <decision dependency / contract this doc provides> |

### Planning Decision Evidence Log

> **Mandatory gate**: each major decision must have one row before phase execution begins.

| Decision             | Docs cited  | Sufficiency verdict       | Fallback code scan used? | Doc update action                                |
| -------------------- | ----------- | ------------------------- | ------------------------ | ------------------------------------------------ |
| <decision statement> | <doc paths> | <Sufficient/Insufficient> | <Yes/No>                 | <doc path to update, or blocked with owner+date> |

### ADR Conflict Check

> **Mandatory gate**: no implementation work starts until this table is populated.
> Scan `v1/spec/adr/` (month logs `YYYY-MM.md`) and check every planned phase/action against accepted decisions.

| ADR entry (`YYYY-MM-DD: title`) | Planned action that touches it  | Conflict?             | Explicitly addressed in plan? | Open question raised?   |
| ------------------------------- | ------------------------------- | --------------------- | ----------------------------- | ----------------------- |
| `<date: title>`                 | `<phase / sub-subphase action>` | <No / Yes — describe> | <Yes — where / No>            | <No / Yes — question #> |

**Rules**:

- A planned action "explicitly addresses" a conflicting ADR only when the plan states the deviation, names the affected ADR, and schedules the superseding/refining entry (e.g. a new dated entry in `v1/spec/adr/YYYY-MM.md`, recorded via Phase N+1.6).
- If a conflict is found and is **not** explicitly addressed, the AI **must** generate an open question in `## Open Questions` asking the user to confirm the conflict resolution before any execution begins.
- Execution must never proceed against an accepted ADR while an unresolved ADR-conflict open question is open.

### Docs to create

| File                          | Reason                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| `v1/spec/<section>/<file>.md` | <new pattern / new domain / new ADR entry in `v1/spec/adr/YYYY-MM.md`> |

### Docs to update

| File                          | What changes                                   |
| ----------------------------- | ---------------------------------------------- |
| `v1/spec/<section>/<file>.md` | <field, section, or entry that needs updating> |

### Docs to delete or archive

| File                          | Reason                            |
| ----------------------------- | --------------------------------- |
| `v1/spec/<section>/<file>.md` | <superseded by / removed feature> |

### No docs affected

- [ ] Confirmed: this plan introduces no new patterns, changes no existing conventions, and removes no documented features.
      _(Check this box only if all three conditions above are true.)_

## Context Map

### Files to modify first

| File     | Purpose   | Why it matters |
| -------- | --------- | -------------- |
| `<path>` | <purpose> | <reason>       |
| `<path>` | <purpose> | <reason>       |

### Likely files to create

| File     | Purpose   |
| -------- | --------- |
| `<path>` | <purpose> |
| `<path>` | <purpose> |

### Dependencies / related patterns

| File     | Relationship   |
| -------- | -------------- |
| `<path>` | <relationship> |
| `<path>` | <relationship> |

### Risks

- [ ] <risk>
- [ ] <risk>

## Recommended Architecture

### Principle 1: <name>

<explanation>

### Principle 2: <name>

<explanation>

## Dependency Rule

> **Each phase must touch exactly one dependency layer unless the user explicitly asks for a looser plan.**

<Explain the dependency chain and why mixed-layer phases are risky.>

## Phase Sequencing Rule

> **Default sequencing: root-cause fix → data recovery/backfill → contract hardening → UX/message polish → tests.**

If user asks for minimal change first, move architecture refactors and retry redesign behind the immediate hotfix phases.

## Commit Slicing Rule

> **A phase may be split into sub-subphases when the file count, review surface, or QA burden is too large for one safe commit.**

### Rules for sub-subphases

- Each sub-subphase should be independently reviewable and revertible.
- Each sub-subphase should end with a local verification step.
- If a missing prerequisite appears, add or revise an earlier-layer sub-subphase instead of patching around it downstream.
- Do not split a phase in a way that creates temporary broken imports between commits.

## Progress Markers

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — completed and verified
- `[!]` — blocked

## Progress Dashboard

- [ ] Phase 1 — <name>
- [ ] Phase 2 — <name>
- [ ] Phase 3 — <name>

## Phases

### Phase 1: <name>

**Progress**: `[ ]`

**Layer**: `<scope boundary>`

**Goal**: <what this phase accomplishes>

**Files**:

- `<path>` — create/modify — <reason>
- `<path>` — create/modify — <reason>

**Verification gate** (must pass before Phase 2 starts):

- <TypeScript / grep / QA / test check>
- <TypeScript / grep / QA / test check>

**Sub-subphase checklist**:

- [ ] **1.1 — <name>**: <work item>
- [ ] **1.2 — <name>**: <work item>

> Sub-subphase items are execution-only checkboxes; verification is captured once in the phase-level **Verification gate** above (verify once, cite everywhere — ADR-0010 rule 3). A sub-subphase may keep one inline spot-check line only as an explicit, marked exception.

### Phase Checkpoint

> Filled after the phase's verification gate passes (loop-level reflection, ADR-0023).
> A checkpoint is **gate state, not a session note** (ADR-0018): it records status with an
> identifiable consumer (next phase's planning, Docs Sync, Eval N+4) and never re-runs
> verification (verify once, cite everywhere — ADR-0010 rule 3).

- [ ] Goal met as specified
- Drift / assumption change observed: <one line, or "none">
- Doc update action required: <one line, or "none">

---

### Phase 2: <name>

**Progress**: `[ ]`

**Layer**: `<scope boundary>`

**Goal**: <what this phase accomplishes>

**Files**:

- `<path>` — create/modify — <reason>

**Verification gate** (must pass before Phase 3 starts):

- <check>
- <check>

**Sub-subphase checklist**:

- [ ] **2.1 — <name>**: <work item>

---

## Dependency Graph

```text
<upstream layer>
  ↓
<next layer>
  ↓
<next layer>
```

Each arrow means "depends on". A phase should not modify a node that a lower layer already imports from.

## Suggested Implementation Order

1. <phase or sub-subphase order>
2. <phase or sub-subphase order>
3. <phase or sub-subphase order>

If a gap is found during a downstream phase, add an isolated earlier-layer fix instead of patching the gap inline in the downstream file.

## Progress Checks (Resume-at-any-time protocol)

At the end of each working session:

1. Update **Progress Dashboard** and active phase `Progress` marker.
2. Mark sub-subphase `[x]` when its work item is complete (execution-only; the phase-level verification gate validates the phase).
3. **No session notes** — questions/uncertainties surfacing during the session escalate to the concerns register (`v1/spec/concerns/YYYY-MM.md`, registered as `C-XXXX` per ADR-0014); the dashboard update is the record (no-consumer-no-content).
4. If blocked, mark item `[!]` and record unblock dependency.
5. After each phase's verification gate passes, fill that phase's `Phase Checkpoint` (3 lines, gate state only).

## Essential Implementation Details

- Define one canonical cross-layer error envelope if the task spans backend + frontend contracts.
- Prefer machine-readable error identifiers (`error_code`) over message-string parsing.
- Document idempotency assumptions for retries/backfills.
- Keep business-rule changes explicit; if unchanged, state that clearly.
- Include at least one data-recovery/backfill note when users may already be affected.
- Never execute planned actions that contradict an existing accepted ADR unless the plan explicitly addresses the conflict and the corresponding open question is confirmed.

## Success Criteria

- <criterion>
- <criterion>
- <criterion>

## Rollback Plan

1. <rollback step>
2. <rollback step>
3. <rollback step>

## Open Questions

> **AI behavior at plan-creation time**: every ADR conflict found by the `### ADR Conflict Check` gate that is not explicitly resolved in the plan MUST be surfaced here as an open question for user confirmation. Do not start implementation while an ADR-conflict open question is unresolved.

**Concern rules** — every question below is registered as a numbered concern in `v1/spec/concerns/YYYY-MM.md` (the concerns register). **The AI raises and registers questions only; the user answers them; the AI checks that answers have been placed before executing a phase that depends on a concern**:

- (a) **Register**: every AI-raised question / unclear point is registered in `v1/spec/concerns/YYYY-MM.md` with its `C-` id; the `## Open Questions` list maps each question to its `C-` id. Registration is the AI's job; answering is the user's.
- (b) **Dedupe**: the AI checks the concerns register **before** adding a question — never re-ask an already-answered concern.
- (c) **Gate**: the AI must **check that the user's answer has been placed** for every concern a phase's decision depends on — that concern must be **Answered by the user** before the phase executes (mirroring the ADR-conflict rule; only _blocking_ concerns gate — non-blocking concerns are answered at phase-close review). Never proceed on an unanswered blocking concern, and never substitute an AI-written answer.
- (d) **Phase-close review**: every phase's closing review marks its concerns Answered (by the user) / Resolved / Deferred (with owner + date); Docs Sync resolves and promotes them (see N+1.7).

**Answer format** (default, C-0004): the **user** answers; the AI records the user's answer as **short key points** (concise bullet summary); the user confirms it; the confirmed text is the asset recorded in the concern's `## Answer`. The AI never writes the answer itself — an unanswered concern stays Open until the user answers.

1. <question>
2. <question>

## Recommendation

<Recommended execution order and why it is the safest/default path.>
````

## Authoring rules

- Keep headings concrete and short.
- Prefer evidence-backed observations tied to real files.
- Reference exact failure signals when available (logs, status code, schema parse error, stack signature).
- When relevant, include concrete verification such as:
  - `npx tsc --noEmit`
  - `grep -r ...`
  - targeted visual QA routes
  - lint/test checks that are appropriate for the repo
- Include at least one manual end-to-end verification path that validates user-visible recovery.
- Keep each phase to one dependency layer unless explicitly marked as contract-alignment phase.
- Use the template as the default structure, but trim sections that truly do not apply.
- If the user asks for a lighter or shorter plan, compress the structure rather than abandoning it entirely.
- **Verify once, cite everywhere**: a fact is verified at the step that produces it; later phases and lane gates cite the result instead of re-running checks. One phase-level verification line per phase (ADR-0010 rule 3); `scripts/validate.sh` is the only re-runnable cross-phase gate, executed by CI on the phase's pull request (local runs on demand — ADR-0031).
- **No consumer, no content**: generated artifacts must have an identifiable consumer (future AI session, user, or gate). Session notes are not generated — session questions/uncertainties escalate to the concerns register (`C-XXXX`); Progress Dashboard updates are the record.
- If a sub-subphase genuinely needs a spot-check beyond the phase-level gate, keep one inline verification line as an explicit, marked exception — not the default.
