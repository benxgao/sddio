import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ensureAgentsSnippet } from '../dist/agents.js';
import { runInit } from '../dist/init.js';
import { WORKSPACE_SEEDS } from '../dist/workspace.js';

/** The repository that ships the CLI: its `.sddio` is the shipped copy. */
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

const EXPECTED_WORKSPACE_DIRS = ['adr', 'discussions', 'spec'];

const SEED_COUNT = 3;
const AGENTS = 1;

async function project(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sddio-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  return directory;
}

async function listFiles(root, prefix = '') {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
    } else {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function listDirs(root, prefix = '') {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const directories = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    directories.push(relativePath, ...(await listDirs(root, relativePath)));
  }

  return directories.sort();
}

/** `.sddio/evals/` is this machine's log (contract 12); it is never shipped. */
const shipped = async (root) => (await listFiles(root)).filter((file) => !file.startsWith('evals/'));

test('init creates both roots at the target, with the seeds and directories', async (t) => {
  const target = await project(t);
  const result = await runInit({ cwd: target });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.created.length, (await shipped(join(repositoryRoot, '.sddio'))).length + SEED_COUNT + AGENTS);

  for (const expected of [
    '.sddio/context/instructions.md',
    'sddio_docs/spec/spec_100.md',
    'sddio_docs/adr/adr_100.md',
    'sddio_docs/discussions/discussions_100.md',
    'AGENTS.md',
  ]) {
    assert.ok(existsSync(join(target, expected)), `${expected} should exist`);
  }

  for (const directory of [
    '.sddio/context/instructions/.schema',
    ...EXPECTED_WORKSPACE_DIRS.map((directory) => `sddio_docs/${directory}`),
  ]) {
    assert.ok(existsSync(join(target, directory)), `${directory} should exist`);
  }
});

test('.sddio is a byte-for-byte copy of the repository context', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const source = join(repositoryRoot, '.sddio');
  const installed = join(target, '.sddio');
  const sourceFiles = await shipped(source);

  assert.deepEqual(await listFiles(installed), sourceFiles);

  for (const relativePath of sourceFiles) {
    if (relativePath === 'context/config.json') {
      continue;
    }

    const expected = await readFile(join(source, relativePath));
    const actual = await readFile(join(installed, relativePath));

    assert.ok(actual.equals(expected), `.sddio/${relativePath} should match the repository copy`);
  }
});

test('the installed cursor is empty, so no repository inherits another repo history', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const source = JSON.parse(await readFile(join(repositoryRoot, '.sddio/context/config.json'), 'utf8'));
  const installed = JSON.parse(await readFile(join(target, '.sddio/context/config.json'), 'utf8'));

  assert.equal(installed.schemaVersion, source.schemaVersion);
  assert.equal(installed.schemaVersion, 1, 'the entry format is 1 until an entry changes shape');
  assert.equal(installed.reconcileCursor.lastProcessedCommit, null);
});

test('the shipped context carries no files about this repository', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  for (const relativePath of ['context/README.md', 'context/preferences.md', 'context/roadmap.md']) {
    assert.equal(
      existsSync(join(target, '.sddio', relativePath)),
      false,
      `.sddio/${relativePath} would hand a consumer this repository's own stack`,
    );
  }
});

test('the default is no hook, and a project choice replaces it', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const configPath = join(target, '.sddio/context/config.json');
  const installed = JSON.parse(await readFile(configPath, 'utf8'));

  assert.deepEqual(installed.hooks, [], 'a first run must not install or fetch anything');

  const chosen = [{ id: 'flow-trail', kind: 'external', events: ['knowledge.reconcile'] }];

  await writeFile(
    configPath,
    `${JSON.stringify(
      { ...installed, hooks: chosen, reconcileCursor: { lastProcessedCommit: 'abc1234' } },
      null,
      2,
    )}\n`,
    'utf8',
  );
  await runInit({ cwd: target });

  const refreshed = JSON.parse(await readFile(configPath, 'utf8'));

  assert.deepEqual(refreshed.hooks, chosen, 'a refresh must keep the hooks the project declared');
  assert.equal(
    refreshed.reconcileCursor.lastProcessedCommit,
    'abc1234',
    'a refresh keeps the cursor: it is this project history, not the package',
  );
});

test('a chosen hook replaces the default, and none clears it', async (t) => {
  const declared = await project(t);
  await runInit({ cwd: declared, hook: 'flow-trail' });

  const kept = JSON.parse(await readFile(join(declared, '.sddio/context/config.json'), 'utf8'));

  assert.equal(kept.hooks.length, 1);
  assert.equal(kept.hooks[0].id, 'flow-trail');

  await runInit({ cwd: declared, hook: 'none' });
  const cleared = JSON.parse(await readFile(join(declared, '.sddio/context/config.json'), 'utf8'));

  assert.deepEqual(cleared.hooks, []);

  await assert.rejects(() => runInit({ cwd: declared, hook: 'nope' }), /Unknown hook/);
});

test('a broken config.json is replaced rather than trusted', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const configPath = join(target, '.sddio/context/config.json');
  await writeFile(configPath, '{ not json', 'utf8');
  await runInit({ cwd: target });

  const refreshed = JSON.parse(await readFile(configPath, 'utf8'));
  const shipped = JSON.parse(await readFile(join(repositoryRoot, '.sddio/context/config.json'), 'utf8'));

  assert.equal(refreshed.schemaVersion, shipped.schemaVersion);
  assert.ok(Array.isArray(refreshed.hooks));
});

test('the workspace mirrors the repository layout and ships empty seeds', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const workspace = join(target, 'sddio_docs');
  const directories = await listDirs(workspace);

  assert.deepEqual(directories, EXPECTED_WORKSPACE_DIRS);
  assert.deepEqual(
    await listFiles(workspace),
    WORKSPACE_SEEDS.map((seed) => seed.replace('sddio_docs/', '')).sort(),
  );

  for (const relativePath of await listFiles(workspace)) {
    assert.equal(
      await readFile(join(workspace, relativePath), 'utf8'),
      '',
      `sddio_docs/${relativePath} should be empty`,
    );
  }

  for (const directory of await listDirs(join(repositoryRoot, 'sddio_docs'))) {
    assert.ok(
      directories.includes(directory),
      `sddio_docs/${directory} exists in this repository but not in the CLI layout`,
    );
  }
});

test('the observation log under .sddio/evals survives a re-run', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const log = join(target, '.sddio/evals/events.jsonl');
  await mkdir(join(target, '.sddio/evals'), { recursive: true });
  await writeFile(log, '{"cmd":"start"}\n', 'utf8');

  await runInit({ cwd: target });

  assert.equal(await readFile(log, 'utf8'), '{"cmd":"start"}\n');
});

test('a second run is idempotent and does not duplicate the AGENTS.md snippet', async (t) => {
  const target = await project(t);

  const first = await runInit({ cwd: target });
  const agentsPath = join(target, 'AGENTS.md');
  const agents = await readFile(agentsPath, 'utf8');

  const second = await runInit({ cwd: target });

  assert.equal(second.created.length, 0);
  assert.equal(second.overwritten.length, 0);
  assert.equal(second.skipped.length, first.created.length);
  assert.equal(await readFile(agentsPath, 'utf8'), agents);
  assert.equal(agents.split('<!-- sddio:begin -->').length - 1, 1);
});

test('dry run writes nothing', async (t) => {
  const target = await project(t);
  const result = await runInit({ cwd: target, dryRun: true });

  assert.equal(result.dryRun, true);
  assert.ok(result.created.length > 0);
  assert.deepEqual(result.errors, []);
  assert.equal(existsSync(join(target, '.sddio')), false);
  assert.equal(existsSync(join(target, 'sddio_docs')), false);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('user-owned workspace files survive, package-owned .sddio files are refreshed', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const workspaceFile = join(target, 'sddio_docs/adr/adr_100.md');
  const packageFile = join(target, '.sddio/context/config.json');
  await writeFile(workspaceFile, 'user edit\n', 'utf8');
  await writeFile(packageFile, 'user edit\n', 'utf8');

  const result = await runInit({ cwd: target });

  assert.equal(await readFile(workspaceFile, 'utf8'), 'user edit\n');
  assert.notEqual(await readFile(packageFile, 'utf8'), 'user edit\n');
  assert.ok(result.skipped.includes('sddio_docs/adr/adr_100.md'));
  assert.ok(result.overwritten.includes('.sddio/context/config.json'));
});

test('--force resets user-owned workspace seeds', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const workspaceFile = join(target, 'sddio_docs/adr/adr_100.md');
  await writeFile(workspaceFile, 'user edit\n', 'utf8');

  const result = await runInit({ cwd: target, force: true });

  assert.equal(await readFile(workspaceFile, 'utf8'), '');
  assert.ok(result.overwritten.includes('sddio_docs/adr/adr_100.md'));
});

test('existing AGENTS.md content is preserved and the snippet is appended once', () => {
  const existing = '# House rules\n\nBe brief.\n';
  const first = ensureAgentsSnippet(existing);

  assert.equal(first.changed, true);
  assert.ok(first.content.startsWith(existing.trimEnd()));
  assert.equal(first.content.split('<!-- sddio:begin -->').length - 1, 1);

  const second = ensureAgentsSnippet(first.content);
  assert.equal(second.changed, false);
  assert.equal(second.content, first.content);
});

test('a stale snippet is replaced in place rather than appended', () => {
  const stale = 'before\n\n<!-- sddio:begin -->\nold text\n<!-- sddio:end -->\n\nafter\n';
  const result = ensureAgentsSnippet(stale);

  assert.equal(result.changed, true);
  assert.ok(!result.content.includes('old text'));
  assert.equal(result.content.split('<!-- sddio:begin -->').length - 1, 1);
});

test('a file the package stopped shipping is named, and kept', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const stray = join(target, '.sddio/context/preferences.md');
  await writeFile(stray, 'pnpm, monorepo, direct\n', 'utf8');

  const result = await runInit({ cwd: target });

  assert.deepEqual(
    result.orphaned.map((orphan) => orphan.path),
    ['.sddio/context/preferences.md'],
  );
  assert.match(result.orphaned[0].note, /AGENTS\.md/);
  assert.equal(existsSync(stray), true, 'reporting is not deleting');
});

test('an orphan is removed only by --force, and never by a dry run', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const stray = join(target, '.sddio/context/preferences.md');
  await writeFile(stray, 'x\n', 'utf8');

  const dry = await runInit({ cwd: target, force: true, dryRun: true });
  assert.equal(dry.orphaned.length, 1);
  assert.equal(existsSync(stray), true, 'a dry run writes nothing, including deletions');

  const forced = await runInit({ cwd: target, force: true });
  assert.equal(forced.orphaned.length, 1);
  assert.equal(existsSync(stray), false);
});

test('the local observation log is not an orphan', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  await mkdir(join(target, '.sddio/evals'), { recursive: true });
  await writeFile(join(target, '.sddio/evals/events.jsonl'), '{}\n', 'utf8');

  const result = await runInit({ cwd: target });

  assert.deepEqual(result.orphaned, []);
});

test('a cursor field the template stopped declaring does not survive a refresh', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const configPath = join(target, '.sddio/context/config.json');
  const installed = JSON.parse(await readFile(configPath, 'utf8'));

  await writeFile(
    configPath,
    `${JSON.stringify(
      { ...installed, reconcileCursor: { lastProcessedCommit: 'abc1234', previousCommit: 'def5678' } },
      null,
      2,
    )}\n`,
    'utf8',
  );

  await runInit({ cwd: target });

  const refreshed = JSON.parse(await readFile(configPath, 'utf8'));

  assert.deepEqual(refreshed.reconcileCursor, { lastProcessedCommit: 'abc1234' });
});

test('a hook is installed when it is new, and not when it is already declared', async (t) => {
  const target = await project(t);

  const first = await runInit({ cwd: target, hook: 'flow-trail' });
  assert.equal(first.hookChanged, true, 'a project that declared nothing is changing');

  // Same declaration, second run: no reason to reach for the network.
  const second = await runInit({ cwd: target, hook: 'flow-trail' });
  assert.equal(second.hookChanged, false);
  assert.equal(second.install, null);

  const third = await runInit({ cwd: target, hook: 'none' });
  assert.equal(third.hookChanged, true, 'clearing a hook is a change');
  assert.equal(third.install, null, 'only flow-trail installs anything');
});

test('--prune removes an orphan and leaves every entry alone', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const entry = join(target, 'sddio_docs/adr/adr_100.md');
  await writeFile(entry, 'user entry\n', 'utf8');

  const stray = join(target, '.sddio/context/preferences.md');
  await writeFile(stray, 'x\n', 'utf8');

  const result = await runInit({ cwd: target, prune: true });

  assert.equal(existsSync(stray), false, 'the orphan is gone');
  assert.equal(await readFile(entry, 'utf8'), 'user entry\n', 'pruning is not re-initialising');
  assert.ok(!result.overwritten.includes('sddio_docs/adr/adr_100.md'));
});
