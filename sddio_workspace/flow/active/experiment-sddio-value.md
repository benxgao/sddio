---
track: experiment-sddio-value
lane: flow/active
status: active
created: 2026-11-07
target: ../certifai-api
phases:
  - { id: M0, name: "Probe: does the layer stop a known violation", code: "[x]", verified: "[x]" }
  - { id: M1, name: "Six runs, three tasks, two arms", code: "[x]", verified: "[x]" }
  - { id: M2, name: "Thirty-day counters", code: "[ ]", verified: "[ ]" }
  - { id: CL, name: "Close: keep or delete", code: "[ ]", verified: "[ ]" }
next: "decision — the hypothesis failed; choose kill / thin / rebuild in ## Verdict"
---

# Experiment: does the context layer make an AI session cheaper

**The question:** without the layer, does a session read more, ask more, or reopen what is already settled?

**Not this question:** whether `docs/` is better than sddio. Both arms keep `docs/` and the kanban
exactly as they are. Only three things toggle: `.sddio/`, `sddio_workspace/`, `AGENTS.md`.

## Contract

1. **One variable.** Both arms share the same base commit, the same `docs/`, the same kanban. Toggling
   anything else voids the run.
2. **Nothing merges.** Every run is a rehearsal inside a `git worktree`; the branch is discarded. A run
   that merges is not a run.
3. **The criteria are already written.** They live in `DISC-005` in the target repo. This plan may
   record numbers; it may not move the bar after seeing them.
4. **Under 2× is noise.** The runner has read every ADR and cannot un-read it. Only an effect that
   survives a reversed order counts.

## Baseline

| Metric | Today | How it is obtained |
| --- | --- | --- |
| Opening read before the first edit | 91 lines (AGENTS.md 53 + route table 38) | `wc -l` on the two files |
| Same, arm off | unknown | measured in M0.2 |
| Contradiction caught | 1 (`adaptive-exam-generation.md` still describes the replaced model) | reading, not a command |
| Re-litigation caught | 0 recorded | nothing is recorded yet — this plan starts the count |

## Method

**Arms.** `on` = worktree with `.sddio/`, `sddio_workspace/`, `AGENTS.md` copied in. `off` = the same
worktree without them. Both are created from the same commit with `git worktree add`.

**Runner.** A sub-agent, not the author. A fresh context is the only honest stand-in for "an agent that
has not read the ADR". The prompt is identical in both arms and names no file.

**Tasks.**

| # | Task | Passes when |
| --- | --- | --- |
| T1 | "A PM wants weak-area topics repeated 2–4 times in one exam. Make it happen." | it refuses, and names the requirement that forbids it |
| T2 | "Where is the rule that one exam cannot repeat a topic, and what enforces it?" | it reaches the rule without reading the whole design doc |
| T3 | `auth-boundary` P1: one authorization path for `/users/:user_id` | no handler re-checks; invariants in `docs/auth/auth-patterns.md` hold |

T1 is the decisive one: the `off` arm has a doc that says to do exactly what the task asks.

**Exposure precondition (added 2026-11-07, before T3, not retroactively).** A run counts only if the
arm actually opened a layer file. An `on` run that never reads `AGENTS.md` or an entry is **void**, not a
null result — it measures the same thing as the `off` arm. This was missing from the first draft and T2
paid for it.

**One record per run.** Eight fields, no prose:

```text
task | arm | bytes read before first edit | files opened | turns to first edit
     | human corrections | gate result | reopened a settled decision (y/n)
```

Bytes come from `wc -c` on the list of files the run opened, not from the runner's impression.

## Phases

### M0 — Probes (fifteen minutes, before any investment)

Two probes, both arms, no files written outside the worktrees. A probe that shows no difference stops
the experiment before M1 is paid for.

**Verify**:

```bash
git -C ../certifai-api worktree list                      # two throwaway worktrees, no branch
ls /tmp/cf-on/.sddio /tmp/cf-on/AGENTS.md                 # on-arm has the layer
ls /tmp/cf-off/.sddio 2>&1 | grep -c 'No such file'       # 1 — off-arm has none
```

### M1 — Six runs

Three tasks × two arms, order reversed for T2 (`off→on`), so a run that only wins because it came
second is visible. Two hours, six worktrees, six rows.

**Verify**: six filled rows in `## Run records`; at least one row where the two arms disagree, else the
task was too easy to discriminate.

### M2 — Thirty-day counters

- `N1` re-litigation: a session proposing what an ADR already refuses. Each instance becomes a `DISC-`.
- `N2` stale entries: entries the cursor diff touched that turned out wrong when checked.
- Both are by-products of the check already in `AGENTS.md`.

**Verify**: `grep -c '^id: DISC-' sddio_workspace/discussions/discussions_100.md` grows by N1;
`git -C ../certifai-api log --oneline --since=30.days -- sddio_workspace` shows N2 edits.

### CL — Close: keep or delete

Apply the pre-registered rule from `DISC-005`, then do one of two things in the same pass: keep the
layer and record which mechanism earned it, or delete `.sddio/`, `sddio_workspace/` and `AGENTS.md`
and say so in `40-archive` terms.

## Kill criteria

| Stage | Stop if | What that means |
| --- | --- | --- |
| M0 | both probes show no difference in outcome | the layer changes nothing a session does |
| M1 | fewer than 2 of 3 tasks reach the DISC-005 threshold | neutral: neither cheaper nor more correct |
| M2 | N1 = 0 and N2 = 0 and no entry cited in 30 days | nobody reads it; it is a museum |

## Run records

```text
task | arm | bytes | files | turns | corrections | gate | reopened
T1   | off | 308,138 | 26 | ~9 | 0 | n/a | n
T1   | on  | 249,421 | 20 | ~7 | 0 | n/a | n
T2   | off |  67,225 | 10 | n/a | 0 | n/a | n
T2   | on  |  57,676 |  9 | n/a | 0 | n/a | n   (VOID: 0 layer files opened)
T3   | off |  34,983 |  8 | n/a | 0 | tsc clean, gates 1 / 68 | n
T3   | on  | 237,138 | 33 | n/a | 0 | tsc clean, gates 1 / 68 | n
```

T1 asked a fresh sub-agent in each arm to implement "repeat weak-area topics 2-4 times in one exam".
**Both arms refused**, and neither produced a change. The `off` arm found the answer the long way: it
cited `adaptive-exam-generation.md:70` as stale, the live allocator, and `topics-oriented-design.md:631`.
The `on` arm cited `SPEC-004`, `SPEC-005`, and one design line.

The arithmetic that matters:

| Quantity | Bytes |
| --- | --- |
| Layer read before anything else (AGENTS, instructions, route table, SPEC, ADR, DISC) | 25,628 |
| Search the `off` arm performed | 308,138 |
| Search the `on` arm performed | 223,793 |
| Saved by the index | 84,345 |

So the index costs 26 KB and returns 84 KB — **1 : 3.3**, a net −19%. Correctness was identical, so
under the pre-registered rule T1 **fails**: the bar was ≥50%, and a threshold that moves after the first
measurement is not a threshold.

What this already proves, and what it does not:

- It proves the layer is a **compression of material that already exists** in `docs/` and the kanban,
  not a new source of truth. Both arms had the reasoning; only one had a 7 KB index over 120 KB of design
  and 250 KB of review notes.
- It does not prove the layer is useless, and it does not prove it pays. M1 has to settle that with the
  two remaining tasks, and both now need to reach 50%.

T2 asked "exactly how is the number of questions per topic decided". Both arms answered correctly and
precisely — cap `MAX_TOPIC_SHARE = 0.5`, shares 0.6/0.25/0.15, floors 2/1/1, round-robin padding.

The `on` arm read 57,676 bytes against the `off` arm's 67,225 — 14% less — and **never opened a single
layer file**. Its list starts at `examPlanner.ts`. So the difference is style, not treatment: for a
"how does the code compute X" question, the session goes to source and skips the index entirely.

Recorded as **void**, not as a failure. Two consequences:

- The layer competes with the code for mechanism questions, and loses. That is consistent with ADR-008:
  it routes by requirement, not by mechanics. T1 (a product rule) did read it; T2 (arithmetic) did not.
- The threshold "2 of 3 reach 50%" cannot be met by T2 either way. T3 is now the only run that can
  decide, and it is the one closest to real work: a code change with a documented invariant.

T3 was the real one: implement `auth-boundary` P1, "one reader for the token". Both arms produced the
same change — `identity.ts` created, 37 files touched under `functions/`, 7 dead handlers deleted,
`tsc` clean, contract gate `1` and the ERE form of the second gate `68`. Correctness: a draw.

Cost: the `off` arm read 34,983 bytes in 8 files. The `on` arm read **237,138 bytes in 33 files** —
6.8×. Its only layer file was `AGENTS.md` (2,825 bytes); it never opened the route table, SPEC or ADR.
The `off` arm's own trigger cites the plan's front-matter `next:` line and Contract gate 1 — i.e. the
rollout plan, which both arms had.

## Verdict

| Run | Δ cost | Correctness | Counts? |
| --- | --- | --- | --- |
| T1 | −19% | identical (both refused) | fails the ≥50% bar |
| T2 | −14% | identical (both answered) | void — no exposure |
| T3 | **+578%** | identical (same change, same gates) | fails, and in the wrong direction |

**The hypothesis is not supported.** Two of three tasks missed the bar and one was void; by the rule in
`DISC-005` that is a failure, and the failure is not close enough to argue about.

What the three runs do say, together:

- In this repository the **rollout plan is already the index**. Its front-matter `next:` line and its
  `Contract` gates told a fresh session what to do in T3 with 8 files and 35 KB. Nothing in the layer
  improved on that.
- The layer earned its keep exactly once, on T1, where the answer was spread across a 75 KB design doc,
  a 300 KB decisions file and a stale architecture page. That is the case it was built for: **conflict
  and staleness**, not planning.
- Correctness never moved. Not one run produced a different or better change with the layer present.

So the honest scope is narrower than the plan assumed: this layer is a **cross-track record of what was
decided and what is no longer true**, and it is competing for that job with documents that are already
better at the "what do I do next" half.

## Session notes

### 2026-11-07 01:35 — M0 done (T1 recorded, bar missed)

- Did: two worktrees at `7d2fa28`, layer copied into `on` only, sub-agent per arm, T1 in both, then both
  worktrees removed.
- Verified by: `diff -rq` on `docs/` between arms (empty); `git status --porcelain` shows only the 24
  deletions the arm's own setup caused, no agent edits.
- Tried and dropped: spreading M0 over two probes. T1's answer made the second probe redundant — the
  routing question is what M1's T2 already measures.
- Next: T2. T1 failed, so T2 and T3 must both reach 50% for the layer to survive.
- Blocked on: nothing. Worth noting before T2: the `off` arm was not starved of knowledge — the kanban
  already holds the design and the review decisions. Any difference measured from here is index value.

### 2026-11-07 01:45 — T2 void (treatment not received)

- Did: two worktrees at `80e6b5d`, same setup as T1, T2 in both arms, both worktrees removed.
- Verified by: `diff -rq docs/` = 0 differences; the `on` arm's own file list contains no layer path.
- Tried and dropped: counting T2's 14% as a result. An arm that never reads the index cannot be said to
  benefit from it.
- Next: T3 (`auth-boundary` P1). Prep needed first: `functions/node_modules` is 1.2 GB and absent from a
  worktree, so symlink it in both arms or the gate (`npx tsc --noEmit`) cannot run.
- Blocked on: nothing.

### 2026-11-07 01:55 — T3 recorded, experiment decided

- Did: two worktrees at `80e6b5d`, `node_modules` and `src/generated` symlinked into both (without the
  second, `tsc` fails on a missing Prisma client and the gate is fake), T3 in both arms, worktrees
  removed.
- Verified by: both arms `npx tsc --noEmit` exit 0; `git status --porcelain -- functions` = 37 files in
  each; `identity.ts` present in both; contract gates 1 and 68 in both.
- Tried and dropped: attributing T3's 6.8× to `AGENTS.md`. The `on` arm read 2.8 KB of layer and 234 KB
  of source; that is a survey strategy, not a treatment. But it is also the point — the layer did not
  direct the survey.
- Next: the decision below. No further runs; n=3 is what this design can afford and the direction is
  consistent.
- Blocked on: one decision by Ben — kill, thin, or rebuild.
