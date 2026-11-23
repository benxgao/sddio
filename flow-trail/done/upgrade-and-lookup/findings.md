# Findings: upgrade-and-lookup

What this card learned. Conclusions live in [`README.md`](./README.md). Ordered by what it costs a
reader **not** to know — not by when it was found. Each entry ends with what cites it, so a claim
that has stopped mattering can be found and retired instead of outliving its usefulness.

## F1 — A directory query answers "nobody wrote about this" while the entry exists

- **Saw** (2026-11-23, this repository, built from `9af8e38`) — `brief packages/cli/lib/` and
  `brief packages/cli/lib` both print `nothing names these`; `brief packages/cli/lib/init.ts`
  prints `spec SPEC-003`. The entry names the file, which sits in that directory.
- **Means** — the read path's most natural question is a directory, and it fails silently in the
  direction that costs the most: a session concludes nothing was written and writes it again.
- **Cost if unknown** — one duplicated SPEC, and a `brief` nobody runs after the second time.
- **Not in the code because** — the code shows a comparison; which query a person types is history.
- **Cited by** — `packages/cli/test/brief.test.mjs :: a path that an entry names returns that entry`
- **Check** — `node packages/cli/dist/cli.js brief packages/cli/lib/ | grep -c SPEC-003` → `1`

## F2 — `pathsIn` discards a one-segment path that ends in a slash

- **Saw** (2026-11-23, `dist/repo.js`) — `pathsIn('x `product-view/` y')` → `[]`;
  `pathsIn('x `product-view/sub/` y')` → `["product-view/sub/"]`; `product-view/README.md` → kept.
- **Means** — the token dies before `entryNames` sees it, so a fix confined to the comparison leaves
  every one-segment directory broken — `docs/`, `src/`, `app/`.
- **Cost if unknown** — a fix that passes its own test and misses the case that prompted it.
- **Not in the code because** — the regex reads plural; only a one-segment tail exposes the gap.
- **Cited by** — `packages/cli/lib/repo.ts :: token.endsWith('/') && descendsInto(named, clean)`
- **Check** — `node --input-type=module -e "import {pathsIn} from './packages/cli/dist/repo.js'; if (!pathsIn('x product-view/ y').includes('product-view/')) process.exit(1)"`

## F3 — An upgrade keeps three files a fresh install never has

- **Saw** (2026-11-23, `small-talk-agents`, 0.2.1 → 0.3.0) — after the upgrade: 17 files under
  `.sddio/`; a fresh 0.3.0 install in `/tmp`: 13. The three extras are `context/README.md`,
  `context/preferences.md`, `context/roadmap.md`. No command ever mentions them again.
- **Means** — the withhold list is a build-time decision with no install-time counterpart, so the
  files are withheld from new consumers and left in existing ones.
- **Cost if unknown** — an agent lists the directory, opens `README.md`, and reads that sddio keeps
  SPEC, ADR, DISCUSSION, ROADMAP and PREFERENCES — two of which no longer exist.
- **Not in the code because** — the repository shows the list that prevents shipping; the state it
  leaves in someone else's tree is history.
- **Cited by** — `packages/cli/scripts/sync-templates.mjs :: const NOT_SHIPPED =` and
  `packages/cli/test/init.test.mjs :: the shipped context carries no files about this repository`
- **Dies when** — `init` prints an `orphaned` line for `context/preferences.md` on a 0.2.x tree.

## F4 — `config.json` keeps a field the template stopped declaring

- **Saw** (2026-11-23, `small-talk-agents`) — after the upgrade the file still carries
  `reconcileCursor.previousCommit`, and `init --dry-run` reports the file **skipped**, not rewritten.
- **Means** — `mergeConfig` copies the whole cursor object and then compares the result with the
  file, so the copy equals the original and the file never converges on the shipped shape.
- **Cost if unknown** — a key nobody can explain, surviving every future release, and a strict
  reader one day refusing it.
- **Not in the code because** — every test upgrades a config the template would produce; none adds a
  key the template dropped.
- **Cited by** — `packages/cli/lib/init.ts :: const remembered = (previous.reconcileCursor ?? {})`
- **Dies when** — `mergeConfig` rebuilds the cursor from `lastProcessedCommit` alone.

## Receipts

| What | Command | Output | Date |
| --- | --- | --- | --- |
| Suite before the first edit | `cd packages/cli && npm test` | `# pass 64`, `# fail 0` | 2026-11-23 |
| Entries in this repository | `node packages/cli/dist/cli.js start` | `entries 9 SPEC, 12 ADR, 1 DISC` | 2026-11-23 |
| Files, fresh install | `find .sddio -type f \| wc -l` (in `/tmp/sddio-fresh`) | `13` | 2026-11-23 |
| Files, after upgrading | same, in `small-talk-agents` | `17` | 2026-11-23 |
| Version numbers in one install | `grep -rn 'schemaVersion\|schema version:' .sddio` | `3` in `config.json`, `1.0.0` in `.schema/` | 2026-11-23 |
| Suite after P4 | `cd packages/cli && npm test` | `# pass 74`, `# fail 0` | 2026-11-23 |
| Orphans reported on an upgraded tree | `init --dry-run --dir /tmp/pv-upgrade` | `orphaned 3`, `skipped 16` | 2026-11-23 |
| Version numbers after P3 | `grep -rho 'schemaVersion": [0-9]*' packages/cli/templates` | `1` | 2026-11-23 |
