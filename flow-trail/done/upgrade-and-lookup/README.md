# Card: a directory query finds its entries, and an upgrade leaves nothing behind

Asking `sddio brief` about a directory answers "nobody wrote about this" even when an entry names a
file inside it, and a 0.2.x repository that upgrades keeps three files the new version no longer
ships, including a README that describes artefacts that no longer exist. Both are the same failure
in different places: the tool reports a clean state it has not checked.

Detail behind these conclusions: [`findings.md`](./findings.md).

## Outcome

Measured 2026-11-23. A directory query now returns the entries that name what is inside it, whether
it is written with a slash or without; an upgrade names every file it stopped shipping and where the
content belongs. Both numbers below were wrong on the same tree a day earlier.

| Metric | Before | After | Command | Verify |
| --- | --- | --- | --- | --- |
| Directory queries answered | 0 of 2 | 2 of 2 | `node packages/cli/dist/cli.js brief packages/cli/lib/` | `node packages/cli/dist/cli.js brief packages/cli/lib/ \| grep -q ADR-005` |
| Files an upgrade leaves without saying so | 3 | 0 | `node packages/cli/dist/cli.js init --dry-run --dir <a 0.2.x tree>` | `node packages/cli/dist/cli.js init --dry-run --dir <tree> \| grep -q '^  orphaned  \.sddio/context/preferences.md'` |
| `schemaVersion` values in one install | 2 (`3`, `1.0.0`) | 1 | `grep -rho 'schemaVersion": [0-9]*' .sddio \| sort -u \| wc -l` | `test $(grep -rho 'schemaVersion": [0-9]*' packages/cli/templates/.sddio \| sort -u \| wc -l) -eq 1` |
| Tests | 64 pass | 74 pass | `cd packages/cli && npm test` | `cd packages/cli && npm test` |

## Contract

What must hold when this card closes, and be checked again after every release.

1. **A query has no required form.** File or directory, trailing slash or not, returns the entries
   that name it — gate: `node packages/cli/dist/cli.js brief packages/cli/lib/ | grep -c ADR-005` → `1`.
2. **An upgrade reports what it drops.** Every file under `.sddio/` the template does not ship is
   named on one `orphaned` line, with where its content belongs — gate: `init --dry-run` on a 0.2.x
   fixture, in `packages/cli/test/init.test.mjs`.
3. **One version, one meaning.** `schemaVersion` is `1` and describes the entry shape; a release that
   changes only rules does not touch it — gate: `grep -rn schemaVersion packages/cli/templates` → `1`.
4. **A refresh never reaches the network.** The hook installer runs only when the declaration changes
   — gate: the init test asserts `install === null` on a second run.

## Decisions

| Decision | Why | Rejected alternative | Enforced by |
| --- | --- | --- | --- |
| `schemaVersion` is the entry format, fixed at `1` | Two numbers in one install teach nobody which one matters | Bumping it per release — it went 1 → 2 → 3 in three releases of rule changes | `.sddio/context/config.json` (`ADR-015`) |
| Orphan detection is structural, not versioned | A version says nothing about which files the *previous* release shipped | Gating removal on a version comparison | `packages/cli/lib/init.ts` |
| The installer diffs the directory against the template; it carries no list | `sync-templates` runs before `dist/` exists, so a shared constant would end up duplicated anyway | Sharing the build script's `NOT_SHIPPED` | `packages/cli/lib/init.ts` |
| A folder finds what is below it; a file does not find its folder | A misspelled filename must still answer "nobody wrote this", or `brief` stops being a check | Symmetric ancestor matching — a typo then matched every entry that names the directory | `packages/cli/lib/repo.ts` |
| Normalise slashes instead of documenting one form | People type both, and a read path cannot ask which they meant | Tell users to write directories without a trailing slash | `packages/cli/lib/repo.ts` |

## Lessons

- **A test can hold a number in the wrong place.** The shipped version was asserted as a literal in
  three tests; two of them were about replacement, not about versions. Next time: assert against the
  shipped config, and keep one literal, in the test that states the policy.
- **A test can reach the network.** The install path is only reachable with `install: true`, so the
  suite asserts `hookChanged` and the one end-to-end run stayed manual, in `/tmp`. Next time: the same
  split — assert the decision, prove the wiring by hand once, and write down that it was by hand.

## Residual

- **Re-meaning `3` as `1` in consumer repositories** — the file changes on their next `init` with no
  announcement. Where it went: P3, and one line in the release note.
- **`sddio_docs/` is deliberately out of scope** — it is user-owned, so a stale `spec_100.md` is not
  the installer's problem. Unproven: whether that is the same class of failure wearing another name.
- **One consumer measured** — the upgrade half rests on `small-talk-agents` alone. A second 0.2.x
  tree with a hand-edited `preferences.md` may show a case the fixture does not.
- **`diff` has no directory-shaped test** — it selects entries with the same function, so it inherits
  the fix and none of the coverage. Where it went: nothing yet; it is the next thing to break quietly.

## Where the proof lives

| Question | Where |
| --- | --- |
| Does a directory query work? | `packages/cli/test/brief.test.mjs` |
| Does an upgrade leave files behind? | `packages/cli/test/init.test.mjs` |
| Why is the version fixed at 1? | `## Decisions` above, and the ADR P3.4 writes |
| What was measured, on which tree? | [`findings.md`](./findings.md) |
