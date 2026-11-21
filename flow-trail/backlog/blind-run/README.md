# Backlog: run the blind test

The card closed with the measuring stick built and one arm never run. `scripts/blind.mjs` already
reports tool calls, calls before the first edit and sddio calls per session; nobody has yet done the
same task twice, once with the workspace and once without it.

- **Trigger** — a task of twenty to forty minutes that touches an existing decision, and an hour to
  spend doing it twice.
- **Sketch** — arm A in this repository; arm B in `git worktree add /tmp/sddio-blind-b HEAD` with
  `.sddio`, `sddio_docs`, `AGENTS.md` and `flow-trail` deleted. Both discarded, never committed.
  `node scripts/blind.mjs --since <start> --match sddio` prints both.
- **Waits on** — nothing but the hour. The harness is written and has run against real traces.

## Decisions

| Decision | Why | Rejected alternative |
| --- | --- | --- |
| Two arms, same task | one arm can only find a crash, not an effect | ask the agent afterwards whether it would have been wrong |
| Both arms discarded | the point is behaviour, not a shipped change | keep arm A's commit and compare shipped code |
| `n=1` is written down as a limit | it falsifies, it does not measure | report it as if it were a rate |
