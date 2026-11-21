---
card: sddio-reads-back
status: open
phases:
  - { id: P0, name: "the observation scaffold, before anything to observe", code: "[ ]", verified: "[ ]" }
  - { id: P1, name: "brief: answer with entries, not with 285 lines", code: "[ ]", verified: "[ ]" }
  - { id: P2, name: "check: staleness as an exit code", code: "[ ]", verified: "[ ]" }
  - { id: P3, name: "diff: a worklist, never a draft", code: "[ ]", verified: "[ ]" }
  - { id: P4, name: "start: one line, no wall", code: "[ ]", verified: "[ ]" }
  - { id: P5, name: "AGENTS.md points at the command", code: "[ ]", verified: "[ ]" }
  - { id: P6, name: "bootstrap asks instead of copying", code: "[ ]", verified: "[ ]" }
  - { id: P7, name: "a claim carries its own command", code: "[ ]", verified: "[ ]" }
  - { id: P8, name: "progressive disclosure by file", code: "[ ]", verified: "[ ]" }
  - { id: P9, name: "snapshot: three ledgers, one screen", code: "[ ]", verified: "[ ]" }
  - { id: CL, name: "Close", code: "[ ]", verified: "[ ]" }
next: "Review this plan; P0 starts only after Ben's go"
---

# Progress: sddio-reads-back

## Baseline

Measured **2026-11-21, before the first edit**, at the repository root.

| Metric | Before | Command | Output |
| --- | --- | --- | --- |
| Context read before the first edit | 9,069 B / 285 lines | `cat .sddio/context/{instructions,principles,preferences,roadmap}.md .sddio/context/routes/routes.md \| wc -c` | `9069` |
| Of that, used only when writing | ~156 lines | `grep -c '' instructions.md principles.md` | `169 + 46` |
| Entries | 10 SPEC, 11 ADR, 7 DISC | `grep -c '<!-- entry -->' sddio_workspace/*/*.md` | `10 / 11 / 7` |
| Workspace size | 599 lines | `cat sddio_workspace/*/*.md \| wc -l` | `599` |
| Commands that read knowledge back | 0 of 4 | `npx sddio --help` | `init`, `skill` only |
| Falsifiable claims | 0 | `grep -rc 'Check:' sddio_workspace/spec/` | `0` |
| Tests | 29 pass | `cd packages/cli && npm test` | `# pass 29` |
| Retrieval hit rate | unmeasured | — | no harness exists yet |

## Phases

### P0 — the observation scaffold

**Goal**: record what actually happens, starting with what is already written down.

**Files**: `.gitignore` (done — `.sddio/evals/`); `packages/cli/lib/events.ts` (new) — the writer;
`scripts/history.sh` (new) — the git miner; `.sddio/evals/reports/2026-11.md` (new) — the baseline.

**Verify**:

```bash
bash scripts/history.sh                        # four anchors, no CLI needed
git check-ignore .sddio/evals/events.jsonl     # .sddio/evals/
```

**Checklist**:

- [ ] **0.1 — the directory**: created on demand, never written by `init`, ignored by git. A test
      asserts that a file under `.sddio/evals/` survives a re-run — today it survives by accident
      (the template carries no such path), and an accident is not a guarantee.
- [ ] **0.2 — the line**: `ts, v, cmd, args, cursor, out{lines,bytes,ids}, exit, ms`, one JSON per line.
- [ ] **0.3 — the writer never fails a command**: a broken append prints nothing and the exit code stands.
- [ ] **0.4 — the miner**: reconcile lag, unowned hot files, 30-day entry churn, superseded ratio.
- [ ] **0.5 — the baseline, measured today**: 23 commits, 20 touching code, lag median 1 (18 of 20
      paired, 2 never), 15 of 31 hot files named by no entry. Recorded, not remembered.
- [ ] **0.6 — the boundary**: nothing leaves the machine; `rm -rf .sddio/evals` costs the history only.

### P1 — `brief`: answer with entries, not with the whole layer

**Goal**: one command returns what this moment needs, in sixty lines.

**Files**: `packages/cli/lib/brief.ts` (new) — index, rank, render; `lib/cli.ts` (modify) — `brief`
and `show`; `test/brief.test.mjs` (new).

**Verify**:

```bash
cd packages/cli && npm test                                        # >= 34 tests
node dist/cli.js brief . | wc -l                                   # <= 60
node dist/cli.js brief packages/cli/lib/init.ts | grep -c SPEC-003  # 1
```

**Checklist**:

- [ ] **1.1 — the index**: every `## ` heading with its ID and body paths, from `sddio_workspace/**`.
- [ ] **1.2 — no argument**: cursor state, then five entries, then open `DISCUSSION` titles.
- [ ] **1.3 — with a path**: entries whose body names it, at most three. A path matches when the body
      names the file, its directory, or the repo-relative path — `init.ts` and `lib/init.ts` both count.
- [ ] **1.4 — titles only**: an entry contributes its ID, title and one clause. The body is `show <id>`.
- [ ] **1.5 — the budget**: sixty lines on this repository, measured, not asserted.
- [ ] **1.6 — no dangling IDs**: the test asserts every printed ID exists in a collection.

### P2 — `check`: staleness as an exit code

**Goal**: the command that says the knowledge is behind, and names what nobody wrote down.

**Files**: `packages/cli/lib/check.ts` (new); `lib/cli.ts` (modify); `test/check.test.mjs` (new).

**Verify**:

```bash
cd packages/cli && npm test
bash ../../evals/check-exit.sh      # behind=1 current=0
```

**Checklist**:

- [ ] **2.1 — cursor**: `git rev-list --count cursor..HEAD`; no git → `unknown`, exit 0.
- [ ] **2.2 — changed files**: `git diff --name-only` over the same range.
- [ ] **2.3 — named vs unmentioned**: a file no entry names is printed under `unmentioned`.
- [ ] **2.4 — exit codes**: `1` behind, `0` current, for CI only. `start` never uses the `1`.
- [ ] **2.5 — no write**: the command reads `git` and `config.json`, nothing else.

### P3 — `diff`: a worklist, never a draft

**Goal**: from "3 commits behind" to "these two entries, this one file". Prose stays with the agent.

**Files**: `lib/diff.ts` (new); `lib/cli.ts` (modify); `test/diff.test.mjs` (new).

**Verify**:

```bash
cd packages/cli && node dist/cli.js diff
node dist/cli.js diff | grep -vcE '^(SPEC|ADR|DISC)-[0-9]+|^add|^none|^cursor'   # 0
```

**Checklist**:

- [ ] **3.1 — three verdicts**: `update` (entry names a changed file), `add` (file named by nothing),
      `none` (nothing moved). No fourth state.
- [ ] **3.2 — no prose**: every line names an ID or the word `add`; the CLI writes no sentence.
- [ ] **3.3 — no write**: exit 0 always; it is a reading, not a reconciliation.

### P4 — `start`: one line, no wall

**Goal**: the hook's single call. It reports, it briefs, it never refuses.

**Files**: `lib/start.ts` (new); `lib/cli.ts` (modify) — `start`; `lib/hooks.ts` (modify) — the
`work.start` event; `test/start.test.mjs` (new).

**Verify**:

```bash
cd packages/cli && npm test
node dist/cli.js start | wc -l      # <= 10
node dist/cli.js start; echo $?     # 0, behind or not
```

**Checklist**:

- [ ] **4.1 — one line for state**: `stale 3 commits behind` or `current`, then the brief.
- [ ] **4.2 — exit 0 always**: behind, no git, no entries — every path returns `0`. No `--allow-stale`.
- [ ] **4.3 — the event**: `work.start` joins `context.request` / `knowledge.reconcile` /
      `session.start`; a hook covering it calls `start` and shows the output.
- [ ] **4.4 — silence is allowed**: a project with `hooks: []` loses nothing; `start` still works by hand.

### P5 — `AGENTS.md` points at the command

**Goal**: a new session calls `start` instead of reading a directory of rules.

**Files**: `packages/cli/lib/agents.ts` (modify) — the snippet; `test/init.test.mjs` (modify);
`README.md`, `README.zh-CN.md` (modify) — the paste block and the layout section.

**Verify**:

```bash
cd packages/cli && npm test
grep -c 'sddio start' AGENTS.md    # 1
```

**Checklist**:

- [ ] **5.1 — the snippet**: six lines or fewer, naming `sddio start`, still delimited.
- [ ] **5.2 — idempotent**: the replace-not-append tests stay green.
- [ ] **5.3 — the fallback**: the snippet still names `instructions.md` for an agent that cannot run it.

### P6 — bootstrap asks instead of copying

**Goal**: a fresh install stops producing a paraphrase of the code.

**Files**: `.sddio/context/instructions/bootstrap.md` (rewrite); `packages/cli/lib/prompt.ts`
(modify); `docs/faq.md`, `docs/faq.zh-CN.md` (modify) — the first-run promise.

**Verify**:

```bash
# in a scratch clone: init, paste the prompt, then
grep -c '^id: SPEC-' sddio_workspace/spec/spec_100.md          # <= 6
grep -c 'Not in the code:' sddio_workspace/spec/spec_100.md    # == the count above
```

**Checklist**:

- [ ] **6.1 — recover from git, not from a scan**: renames, deletions and rewrites of the last year.
- [ ] **6.2 — three questions, not thirty bullets**: what was rejected, who asked, what deadlines.
- [ ] **6.3 — the cap**: at most six `SPEC` entries, each with its `Not in the code:` line.
- [ ] **6.4 — one `DISCUSSION`**: naming what the repository could not settle (SPEC-016 stands).

### P7 — a claim carries its own command

**Goal**: "falsifiable" becomes something the CLI can run, not a writing style.

**Files**: `lib/claims.ts` (new); `lib/check.ts` (modify) — `--claims`;
`.sddio/context/instructions/spec.md` (modify) — the syntax;
`sddio_workspace/spec/spec_100.md` (modify) — six bullets retrofitted.

**Verify**:

```bash
cd packages/cli && node dist/cli.js check --claims    # 0 drift, exit 0
# then break one expected value
node dist/cli.js check --claims; echo $?              # 1
```

**Checklist**:

- [ ] **7.1 — the syntax**: `- Check: <command> → <expected>` on a bullet, optional, one line.
- [ ] **7.2 — execution**: each claim runs with a timeout; output compared as a substring.
- [ ] **7.3 — drift is loud**: a failing claim prints the command, the expected and the actual.
- [ ] **7.4 — six claims exist**: one per checkable `SPEC` bullet, added as they are written.

### P8 — progressive disclosure by file

**Goal**: session start stops paying for the rules only writing needs.

**Files**: `.sddio/context/session.md` (new, from `instructions.md`); `.sddio/context/writing.md`
(new, absorbs `principles.md`); `.sddio/context/instructions.md` (delete or reduce to a pointer);
`.sddio/context/routes/routes.md` (modify) — reached from `session.md`, not read at start;
`lib/agents.ts` (modify) — the snippet names both; `test/init.test.mjs` (modify).

**Verify**:

```bash
cat .sddio/context/session.md .sddio/context/preferences.md | wc -c   # <= 3000
grep -c 'writing.md' .sddio/context/session.md                        # 1
cd packages/cli && npm test
```

**Checklist**:

- [ ] **8.1 — three tiers, named once**: `session.md` lists what to read and when, including itself.
- [ ] **8.2 — writing never inlined**: `writing.md` is a pointer from `session.md`, opened on demand.
- [ ] **8.3 — `principles.md` absorbed**: its 46 lines become the opening of `writing.md`.
- [ ] **8.4 — `roadmap.md` and `routes.md` demoted**: named, not loaded, unless the brief points there.
- [ ] **8.5 — the fallback holds**: with no CLI, an agent that follows `session.md` alone still works.

### P9 — snapshot: three ledgers, one screen

**Goal**: when someone asks whether this works, one command answers with numbers from three sources
that were written independently of the question.

**Files**: `scripts/snapshot.sh` (new) — joins git, events and verdicts, prints eight anchors;
`scripts/traces.mjs` (new, local) — tokens and calls-before-first-edit from this machine's agent
traces, degrading to `n/a` when absent; `evals/questions.md` (new, committed) — twelve questions with
their expected entry IDs; `.sddio/evals/reports/` (new, ignored) — one digest per month;
`flow-trail/usage.md` (modify) — the `verdict` column; `findings.md` (new) — the blind run.

**Verify**:

```bash
bash scripts/snapshot.sh      # eight anchors, current values
bash scripts/history.sh       # the git half alone, no CLI required
```

**Checklist**:

- [ ] **9.1 — twelve questions**: each answerable only from an entry, each with the ID that holds it.
- [ ] **9.2 — two rates in one run**: the same script scores naive grep and `brief`.
- [ ] **9.3 — the blind run**: one real task, two fresh sessions, with and without the briefing.
      Counted: rejected options re-proposed, tool calls to the first correct edit.
- [ ] **9.4 — three ledgers**: git (lag, unowned, churn), events (calls, bytes, ids), verdicts
      (kept / ignored / wrong). A missing source prints `n/a`, never a guess.
- [ ] **9.5 — the digest is copied, the log is not**: a month worth quoting goes into `findings.md`.
- [ ] **9.6 — the negative**: if `brief` does not beat grep, say so in `findings.md` and stop.

### CL — Close

- [ ] Durable evidence moved to `findings.md`
- [ ] `## Outcome` carries Before, After and Command for every row
- [ ] Every decision has a `## Decisions` row with its rejected alternative
- [ ] `## Residual` written; "nothing" is valid, silence is not
- [ ] `git rm flow-trail/doing/sddio-reads-back/progress.md`
- [ ] `git mv flow-trail/doing/sddio-reads-back flow-trail/done/sddio-reads-back`

## Session notes

### 2026-11-21 — plan only

- Did: wrote this card; added `.sddio/evals/` to `.gitignore`; measured the git half of the anchors
  with a throwaway 40-line script (23 commits, lag median 1, 15 of 31 hot files unowned).
- Verified by: `node /tmp/history.mjs` — the numbers in `0.5` are its output, not an estimate.
- Tried and dropped: committing the raw log. Dropped — it is a diary, and a digest in `findings.md`
  carries the same number without the noise.
- Next: Ben reviews; then P0.
- Tried and dropped: blocking exit `2` on a stale cursor. Dropped because a wall is the first thing a
  new user would meet, and the first thing they would learn is the flag that removes it.
- Tried and dropped: putting the eval first. Dropped because the first metric has to be written
  against real output; a harness invented before the command measures the inventor's imagination.
- Next: Ben reviews; then P1.
- Blocked on: the review.
