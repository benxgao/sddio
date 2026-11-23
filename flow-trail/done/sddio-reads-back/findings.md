# Findings: sddio-reads-back

What this card learned. Conclusions live in [`README.md`](./README.md). Ordered by what it costs a
reader not to know. Each entry ends with what cites it.

## F1 — The observation log shipped itself into every new project

- **Saw** (2026-11-21, during P0) — `npm run build` copies `.sddio/` into `templates/`, and the log
  lived at `.sddio/evals/events.jsonl`. A consumer's first `init` would have received this machine's
  history, and the package would have carried a live log inside a package-owned directory.
- **Means** — the P0 test caught it, not a review: the temp project's log was non-empty before
  anything wrote to it. The test was written to prove `.sddio/evals/` survives a re-run, and it
  failed for the opposite reason.
- **Cost if unknown** — every `init` would leak the author's command history, and the byte-for-byte
  test would have gone green while doing it.
- **Not in the code because** — `cp` is silent about what should not travel. The exclusion is a
  decision about ownership, not a fact visible in the copy call.
- **Cited by** — `packages/cli/scripts/sync-templates.mjs :: const NOT_SHIPPED =` — the exclusion,
  since 2026-11-23 a list rather than an `rm` per path; and
  `packages/cli/test/init.test.mjs :: survives a re-run` — the test that found it.
- **Check** — `node -e "process.exit(require('fs').existsSync('packages/cli/templates/.sddio/evals')?1:0)"` — exit 0.
- **Status** — fixed; the template no longer carries the directory.

## F2 — The eval cannot rank the two retrievers

- **Saw** (2026-11-21, P9) — twelve questions, both retrievers at 12/12. `delta 0`.
- **Means** — the fixture is too easy: each question shares a word with its answer's title, so both
  rankers find it. A test that everything passes measures nothing.
- **Cost if unknown** — the number quoted to justify `brief` would be 100% either way, which reads as
  a triumph and means the opposite.
- **Not in the code because** — the difficulty of a fixture is not a property of the code; it is a
  property of how the questions were written, and nothing in the repository says which questions were
  hard.
- **Cited by** — nothing. The fixture and the eval script that read it were removed on 2026-11-23;
  what survives is this paragraph, which is why it is written as history, not as a pointer.
- **Check** — none: the script was removed on 2026-11-23, so there is nothing left to measure.
- **Status** — resolved by removal. The fixture compared two keyword rankers over questions, while
  `sddio brief` takes file paths: it measured a feature the product does not ship. By its own
  criterion — "if the delta is near zero, `brief` is a wrapper around `grep`" — the honest reading
  of `delta 0` is that `brief` is a formatted path lookup, which `brief.test.mjs` already asserts.

<!-- entry -->

## Receipts

| What | Command | Output | Date |
| --- | --- | --- | --- |
| Anchors before the work | `node scripts/history.mjs` | `23 commits, lag median 1, unowned 15/31` | 2026-11-21 |
| Anchors after | `node scripts/snapshot.mjs` | `calls 13, median 289 bytes` | 2026-11-21 |
| Retrieval delta | `node scripts/eval.mjs` | `grep 12/12, brief 12/12` | 2026-11-21 |
| Claims | `npx sddio check --claims` | `7 claims, 7 ok, 0 drift` | 2026-11-21 |
