#!/usr/bin/env node

/**
 * Generate `templates/.sddio` from this repository's own `.sddio`.
 *
 * The repository root `.sddio/` is the single source of truth for the context
 * layer. `packages/cli/templates/` is a build artefact, never committed: it is
 * recreated from scratch on every build, so the shipped context cannot drift
 * from the one this repository dogfoods.
 *
 * `sddio_docs/` is not generated here. It is user-owned and its layout is
 * declared in `lib/workspace.ts` (ADR-005).
 */

import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));

const source = join(repositoryRoot, '.sddio');
const templatesRoot = join(packageRoot, 'templates');
const destination = join(templatesRoot, '.sddio');

async function countFiles(root, prefix = '') {
  const entries = await readdir(prefix === '' ? root : join(root, prefix), { withFileTypes: true });
  let total = 0;

  for (const entry of entries) {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    total += entry.isDirectory() ? await countFiles(root, relativePath) : 1;
  }

  return total;
}

if (!existsSync(join(source, 'context', 'instructions.md'))) {
  throw new Error(`No usable .sddio context at ${source}; run from a full checkout of the repository.`);
}

await rm(templatesRoot, { recursive: true, force: true });
await mkdir(templatesRoot, { recursive: true });
await cp(source, destination, { recursive: true });

// Two kinds of file stay behind. `.sddio/evals/` is this machine's observation
// log (contract 12). The rest describe *this* repository rather than the tool:
// its preferences, its roadmap, and a README about sddio itself. Shipping those
// hands a consumer somebody else's stack, and `instructions.md` then tells its
// agent to read them as if they were the project's (ADR-012).
const NOT_SHIPPED = ['evals', 'context/README.md', 'context/preferences.md', 'context/roadmap.md'];

for (const relativePath of NOT_SHIPPED) {
  await rm(join(destination, relativePath), { recursive: true, force: true });
}

// `config.json` carries this repository's cursor and its declared hooks. Neither
// belongs to a consumer: the cursor points at commits their repository has never
// seen, and this repository runs flow-trail while theirs may run nothing. The
// template ships an empty baseline and no hook, so a first run installs nothing
// until the user asks for it (SPEC-018).
const configPath = join(destination, 'context', 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));

await writeFile(
  configPath,
  `${JSON.stringify(
    { ...config, reconcileCursor: { lastProcessedCommit: null }, hooks: [] },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`templates/.sddio ← .sddio (${await countFiles(destination)} files)`);
