# Evals

Two directories, deliberately: the questions are committed and reviewed; the log is not.

| Path | What | In git |
| --- | --- | --- |
| `evals/questions.md` | twelve questions whose answers live in one entry each | yes |
| `.sddio/evals/` | one JSON line per command call, and a monthly digest | no |

`node scripts/eval.mjs` scores two retrievers on the same questions:

- **grep** — any entry whose body contains a keyword, ranked by count (what an agent does without
  the CLI).
- **brief** — the same index `sddio brief` uses, title-weighted, top three.

The delta is the number. If it is near zero, `brief` is a wrapper around `grep` and should be deleted.
