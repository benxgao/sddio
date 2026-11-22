# Card: sddio answers with sixty lines, not 285

sddio wrote knowledge and never read it back: 9,069 bytes before the first useful action, a grep and a
guess to find one entry, nothing that ever said the knowledge was stale, and a bootstrap that filled
`SPEC` with what the code already says. This card gave it the reading half, and made the target feel
like no ceremony at all: a session starts, something knows what this change touches, nobody is asked a
question and nobody is blocked.

Detail and receipts: [`findings.md`](./findings.md).

## Outcome

| Metric | Before | After | Command |
| --- | --- | --- | --- |
| Context before the first edit | 9,069 B | 2,769 B | `cat .sddio/context/instructions.md .sddio/context/preferences.md \| wc -c` |
| Added at the writing moment | 0 (already paid) | 3,006 B, only then | `wc -c .sddio/context/writing.md` |
| Commands that read knowledge back | 0 | 4 | `npx sddio --help` |
| Staleness, detected by a command | never | one line, exit `0` | `npx sddio start` |
| Falsifiable claims, executed | 0 | 7, 0 drift | `npx sddio check --claims` |
| Anchors a command can reproduce | 4 | 8 | `node scripts/snapshot.mjs` |
| Command calls recorded | 0 | 13 on the day | `wc -l .sddio/evals/events.jsonl` |
| Tests | 29 pass | 55 pass | `cd packages/cli && npm test` |
| Retrieval, top-3 hit rate | unmeasured | 12/12 both — cannot rank (F2) | `node scripts/eval.mjs` |
| Bootstrap output | 95 bullets | six-entry ceiling, unexercised | `instructions/bootstrap.md` |
| Prompts a user answers per session | 0 | 0 | judgement — invisibility is not a command |

## Contract

1. **`brief` answers with entries, not with the whole layer.** Sixty lines or fewer; every ID it
   prints resolves.
   Gate: `npx sddio brief . | wc -l` → ≤ 60; `cd packages/cli && npm test` asserts resolution.
2. **`brief <path>` names the entry that names that path.**
   Gate: `npx sddio brief packages/cli/lib/init.ts | grep -c 'SPEC-003'` → `1`.
3. **`check` turns staleness into an exit code.** `1` behind, `0` current.
   Gate: `npx sddio check; echo $?` on a behind clone → `1`.
4. **`check` names the changes nobody wrote down.** A moved file no entry names is listed under
   `unmentioned`, never a silent zero.
   Gate: `npx sddio check` → an `unmentioned` line whenever such a file exists.
5. **`AGENTS.md` points at the command, not at a directory of rules.** Under six lines, still
   delimited, still idempotent.
   Gate: `grep -c 'sddio start' AGENTS.md` → `1`; the snippet tests stay green.
6. **Bootstrap asks instead of copying.** At most six `SPEC` entries, each ending in
   `Not in the code:`, and at least one `DISCUSSION`.
   Gate: run `init` + bootstrap in a scratch clone; count entries and gate lines.
7. **A claim carries the command that can falsify it.** `Check:` is optional per bullet; when present,
   `check --claims` runs it and a failing claim exits non-zero.
   Gate: `npx sddio check --claims` → `0 drift`; break one and re-run → exit `1`.
8. **The eval is a number, not an opinion.** Twelve questions, two retrievers, both rates in one run.
   Gate: `node scripts/eval.mjs` → prints `grep` and `brief` rates, and warns when they tie.
   *Retired 2026-11-23: it measured question search, which sddio does not ship. See F2.*
9. **`start` informs, never blocks.** Behind by any number of commits it still exits `0`, says so in
   one line, and prints the briefing anyway. There is no `--allow-stale`, because there is nothing to
   allow.
   Gate: `npx sddio start; echo $?` on a behind clone → `0`, output ≤ 10 lines.
10. **`diff` lists, never writes.** Every line is a verdict word, never a sentence.
    Gate: `npx sddio diff | grep -vcE '^(cursor|update|add|none|…)\s'` → `0`.
11. **Disclosure is by file, not by paragraph.** Session start reads `instructions.md` and
    `preferences.md`; `writing.md` opens when an entry is about to be written.
    Gate: `cat .sddio/context/instructions.md .sddio/context/preferences.md | wc -c` → ≤ 3,000;
    `grep -c 'writing.md' .sddio/context/instructions.md` → `2` (named, never inlined).
12. **The log is local, and losing it loses nothing else.** Gitignored, never written by `init`, never
    read to do work, never sent.
    Gate: `git check-ignore .sddio/evals/events.jsonl` prints a rule; after
    `rm -rf .sddio/evals`, `npx sddio start` still exits `0`.

## Decisions

| Decision | Why | Rejected | Enforced by |
| --- | --- | --- | --- |
| `brief` matches paths and headings, no index | 599 lines is a grep, not a corpus | embedding index, sqlite | `scripts/eval.mjs` |
| `check` reads git and `config.json` only | runs in CI, no daemon, no server | a watching service | contract 3 |
| `AGENTS.md` calls a command | computed context beats static context | keep the 9 KB pointer | contract 5 |
| Bootstrap may ask three questions | intent is not in the code | derive everything from code | contract 6 |
| `Check:` stays optional | falsifiability without ceremony on every bullet | mandatory on all bullets | contract 7 |
| Every signal is informational | a wall teaches people to reach for a flag | blocking exit `2` on a stale cursor | contract 9 |
| `diff` writes nothing | the CLI has no model and should not | auto-drafted prose | contract 10 |
| Data ignored, scripts committed | machinery is reviewed; observations stay private | commit the log, or ship no tooling | `.gitignore` |

## Lessons

- **A test written to prove survival can fail for the opposite reason.** The P0 test caught the log
  being copied into the template (F1); nobody was looking for a leak.
- **An easy fixture reads as a triumph.** Both retrievers scored 12/12 (F2), which proves nothing and
  looks like proof.

## Residual

- **The blind run was never run.** Parked in `flow-trail/backlog/blind-run/` with its trigger. Until it
  runs, nothing here shows sddio changes what an agent does — only that it can be asked.
- **`n=1` cannot prove an effect even when it runs.** It can find a failure, not a rate.
- **The bootstrap rewrite is unexercised.** The six-entry ceiling is a claim until a fresh clone goes
  through it.
- **This repository is author and subject.** Median lag is 1 commit because one person writes both
  sides; that shows the mechanism works, not that sddio caused it.
- **`.sddio/evals/` is a second exception to "package-owned".** `init` overwrites the context layer and
  must not take this directory with it; SPEC-006 has yet to say so.
- **A warning nobody reads is no warning.** `start` never blocks, so its one line competes with every
  other line in a session, and no command can see whether it landed.
- **Not doing**: MCP server, search index, dashboard, auto-written entries.

## Where the proof lives

| Question | Where |
| --- | --- |
| Is the record still true? | `npx sddio check --claims` → `7 claims, 0 drift` |
| Can it be read back cheaply? | `node scripts/snapshot.mjs` and `scripts/eval.mjs` |
| Did anyone use it? | `.sddio/evals/events.jsonl`, one line per call |
| Was the hint right? | `flow-trail/usage.md`, the `via: hook` rows |
| What did the blind run show? | not run — `flow-trail/backlog/blind-run/` |
| What was the baseline? | [`findings.md`](./findings.md) → Receipts |
