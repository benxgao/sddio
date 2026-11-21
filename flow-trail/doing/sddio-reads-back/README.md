# Card: sddio answers with sixty lines, not 285

sddio writes knowledge and never reads it back. Every session pays 9,069 bytes before the first useful
action; finding one entry is a grep plus a guess at where to stop; nothing ever says the knowledge has
gone stale; and bootstrap fills `SPEC` with what the code already says, which is the thing ADR-012 just
removed by hand.

This card gives sddio the half it is missing: a command that answers, a command that accuses, a
first-run that asks instead of copying, and a way to show the answer was worth having.

The target feeling is **no ceremony**: a session starts, something already knows what this change
touches, and nobody is asked a question or blocked by a wall. Every signal is informational — the
tool may be wrong, and the user is never made to fight it.

## Outcome

Targets, because nothing here exists yet. Every number is re-derived by the command in its row.

| Metric | Before | Target | Command |
| --- | --- | --- | --- |
| Context before the first edit | 9,069 B | ≤ 2,400 B | `cat .sddio/context/session.md .sddio/context/preferences.md \| wc -c` |
| Added at the writing moment | 0 (already paid) | ≤ 4,000 B, only then | `wc -c .sddio/context/writing.md` |
| Retrieval, top-3 hit rate | unmeasured | ≥ 80% of 12 | `bash evals/run.sh` |
| Commands that read knowledge back | 0 | 4 (`brief`, `check`, `diff`, `start`) | `npx sddio --help` |
| Staleness, detected by a command | never | one `stale` line, exit `0` | `npx sddio start` |
| Falsifiable claims, executed | 0 | ≥ 6, 0 drift | `npx sddio check --claims` |
| Bootstrap output | unmeasured; the SPEC it left here was 95 bullets | ≤ 6 entries, each `Not in the code` | P6 gate |
| Anchors a command can reproduce | 4 (git only, beside this card) | 8 | `bash scripts/snapshot.sh` |
| Command calls recorded | 0 | every `brief`/`check`/`diff`/`start` | `wc -l .sddio/evals/events.jsonl` |
| Prompts a user answers per session | 0 | 0 | judgement — invisibility is not a command |
| Tests | 29 pass | ≥ 55 pass | `cd packages/cli && npm test` |

## Contract

1. **`brief` answers with entries, not with the whole layer.** Sixty lines or fewer; every ID it
   prints resolves to an entry that exists.
   Gate: `npx sddio brief . | wc -l` → ≤ 60, and `bash evals/run.sh --ids` → `0 unknown`.
   *If broken*: it is a second `cat`, and the 9,069 bytes moved rather than shrank.
2. **`brief <path>` names the entry that names that path.**
   Gate: `npx sddio brief packages/cli/lib/init.ts | grep -c 'SPEC-003'` → `1`.
   *If broken*: the index answers by keyword, which is what `grep` already did.
3. **`check` turns staleness into an exit code.** `1` when the cursor is behind `HEAD`, `0` when it
   is current, on the same commit.
   Gate: `bash evals/check-exit.sh` → `behind=1 current=0`.
4. **`check` names the changes nobody wrote down.** Every changed file not named by any entry is
   listed under `unmentioned`, or the word is absent — never a silent zero.
   Gate: `npx sddio check | grep -c '^unmentioned'` → `1` when such a file exists.
5. **`AGENTS.md` points at the command, not at a directory of rules.** The snippet stays under six
   lines and contains `sddio brief`; a second `init` does not duplicate it.
   Gate: `grep -c 'sddio brief' AGENTS.md` → `1`; the existing snippet tests stay green.
6. **Bootstrap asks instead of copying.** A fresh run writes at most six `SPEC` entries, every one
   ending in `Not in the code:`, and at least one `DISCUSSION` naming what it could not recover.
   Gate: run `init` + bootstrap in a scratch clone of this repo; count entries and gate lines.
   *If broken*: the gate is skipped on day one, and the first impression is a paraphrase.
7. **A claim carries the command that can falsify it.** `Check:` is optional per bullet; when present,
   `check --claims` runs it, and a claim whose command fails exits non-zero.
   Gate: `npx sddio check --claims` → `0 drift`; then break one claim and re-run → exit `1`.
8. **The eval is a number, not an opinion.** Twelve questions with known entry IDs; the harness
   reports the hit rate for `grep` and for `brief` in the same run.
   Gate: `bash evals/run.sh` prints both rates and the byte counts.
9. **`start` informs, never blocks.** Behind by any number of commits, it still exits `0`; it says
   so in one line and prints the briefing anyway. There is no `--allow-stale`, because there is
   nothing to allow.
   Gate: `npx sddio start` on a behind clone → `stale` line present, exit `0`, output ≤ 10 lines.
   *If broken*: the first thing a new user meets is a wall, and the next thing they do is delete it.
10. **`diff` lists, never writes.** Every line names an entry ID or the word `add`; the CLI has no
    model and does not pretend to draft prose.
    Gate: `npx sddio diff | grep -vcE '^(SPEC|ADR|DISC)-[0-9]+|^add'` → `0`.
11. **Disclosure is by file, not by paragraph.** Session start reads `session.md` and
    `preferences.md`; `writing.md` is opened when an entry is about to be written, not before.
    Gate: `cat .sddio/context/session.md .sddio/context/preferences.md | wc -c` → ≤ 3,000, and
    `grep -c 'writing.md' .sddio/context/session.md` → `1` (named, never inlined).
12. **The log is local, and losing it loses nothing else.** `.sddio/evals/` is gitignored, `init`
    never writes into it, no command depends on it, and no byte leaves the machine.
    Gate: `git check-ignore .sddio/evals/events.jsonl` → prints a rule; then
    `rm -rf .sddio/evals && npx sddio start` → still exit `0`.

## Decisions

| Decision | Why | Rejected | Enforced by |
| --- | --- | --- | --- |
| `brief` matches paths and headings, no index | 599 lines is a grep, not a corpus | embedding index, sqlite | `evals/run.sh` |
| `check` reads git and `config.json` only | runs in CI, no daemon, no server | a watching service | contract 3 |
| `AGENTS.md` calls a command | computed context beats static context | keep the 9 KB pointer | contract 5 |
| Bootstrap may ask three questions | intent is not in the code | derive everything from code | contract 6 |
| `Check:` stays optional | falsifiability without ceremony on every bullet | mandatory on all bullets | contract 7 |
| Every signal is informational | a wall teaches people to reach for a flag | blocking exit `2` on a stale cursor | contract 9 |
| `diff` writes nothing | the CLI has no model and should not | auto-drafted prose | contract 10 |
| Three load tiers, not one file | 285 lines read every session, 110 used when writing | keep `instructions.md` whole | contract 11 |
| Observability ships with the command | a metric added later never matches the feature it measures | log after the fact | contract 12 |
| Data ignored, scripts committed | the machinery is reviewed; the observations stay private | commit the log, or ship no tooling | `.gitignore` |
| A digest is copied, a log never is | a number can be quoted; a log is a diary | publish the raw events | findings.md |

## Lessons

- None yet. The first one lands when a phase fails its own Verify.

## Residual

- **n=1 cannot prove an effect.** The blind run can find a failure (an agent re-proposing a rejected
  option); it cannot show a rate. It is a smoke test for the thesis, not evidence of the size.
- **This repository is author and subject.** Its median reconcile lag is already 1 commit, because the
  same person writes the code and the entry. That shows the mechanism works; it cannot show sddio
  caused it. Only a second repository, or a deliberate week without the tool, moves that line.
- **`.sddio/evals/` is the second exception to "package-owned".** `init` overwrites the context layer;
  this directory must survive it. The carve-out is `config.json`'s `hooks` field plus `evals/`, and
  both need to be stated in SPEC-006 or a future `init` erases a user's history.
- **`brief` matches literal strings.** A renamed file breaks the link silently until an entry is
  edited — the eval cannot see a rename it was not told about.
- **Claims rot by design.** A `Check:` whose command is deleted is worse than no check; contract 7
  only catches claims that fail, not claims that vanished.
- **A warning nobody reads is no warning.** `start` never blocks, so its one line competes with every
  other line in a session. The eval can count bytes and drift; it cannot see whether the hint landed.
- **The harness lands last, at P9.** It could go first and let each phase prove itself on arrival; going
  last risks a harness fitted to whatever shipped. Chosen this way because the first version of the
  metric must be written against real output, not an imagined one.
- **Not doing**: MCP server, search index, dashboard, auto-written entries. Each breaks a property
  already claimed in the README (no runtime, one dependency, deletion is uninstall).

## Where the proof lives

| Question | Where |
| --- | --- |
| Is the record still true? | `npx sddio check --claims`, then `bash scripts/snapshot.sh` |
| Can it be read back cheaply? | `scripts/snapshot.sh` — hit rate and bytes, both columns |
| Did anyone use it? | `.sddio/evals/events.jsonl`, one line per call |
| Was the hint right? | `flow-trail/usage.md`, the `verdict` column |
| Did the hint reach anyone? | `flow-trail/usage.md` rows whose `trigger` column names `start` |
| What did the blind run show? | `findings.md`, first row after P9 |
| What was the baseline? | `## Baseline` in `progress.md`, each row with its command |
