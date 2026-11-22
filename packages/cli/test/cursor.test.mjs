import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import { cursor } from '../dist/cursor.js';

function git(directory, args) {
  return execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function sha(directory, revision = 'HEAD') {
  return git(directory, ['rev-parse', revision]);
}

async function write(directory, relativePath, content) {
  const target = join(directory, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

async function commit(directory, message) {
  git(directory, ['add', '-A']);
  git(directory, ['commit', '-qm', message]);

  return sha(directory);
}

async function repo(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sddio-cursor-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  git(directory, ['init', '-q']);
  git(directory, ['config', 'user.email', 'test@example.com']);
  git(directory, ['config', 'user.name', 'Test']);

  return directory;
}

/** Knowledge commit K, with the cursor written into K — the shape a reconcile leaves. */
async function reconciled(t) {
  const directory = await repo(t);

  await write(directory, 'README.md', 'init\n');
  await commit(directory, 'init');
  await write(directory, 'sddio_docs/spec/spec_100.md', 'first\n');
  await commit(directory, 'knowledge');
  await write(directory, 'src/a.ts', 'export const a = 1;\n');
  const baseline = await commit(directory, 'code');

  await write(directory, 'sddio_docs/spec/spec_100.md', 'first\nsecond\n');
  await write(
    directory,
    '.sddio/context/config.json',
    JSON.stringify({ reconcileCursor: { lastProcessedCommit: baseline } }),
  );
  await commit(directory, 'knowledge and cursor');

  return { directory, baseline };
}

const config = (lastProcessedCommit) => ({ reconcileCursor: { lastProcessedCommit } });

test('the commit that carries the cursor is the baseline, not one behind it', async (t) => {
  const { directory } = await reconciled(t);
  const state = cursor(directory, config(sha(directory, 'HEAD^')));

  assert.equal(state.state, 'current');
  assert.equal(state.behind, 0);
  assert.equal(state.from, sha(directory, 'HEAD'), 'the record covers its own commit');
});

test('amending the commit that carries the cursor changes nothing', async (t) => {
  const { directory, baseline } = await reconciled(t);

  git(directory, ['commit', '-q', '--amend', '-m', 'knowledge and cursor, reworded']);

  const state = cursor(directory, config(baseline));

  assert.equal(state.state, 'current');
  assert.equal(state.behind, 0);
  assert.equal(state.from, sha(directory), 'the baseline moved with the amend');
});

test('a code commit after the knowledge commit is counted and listed', async (t) => {
  const { directory, baseline } = await reconciled(t);
  await write(directory, 'src/b.ts', 'export const b = 2;\n');
  await commit(directory, 'more code');

  const state = cursor(directory, config(baseline));

  assert.equal(state.state, 'behind');
  assert.equal(state.behind, 1);
  assert.ok(state.changed.includes('src/b.ts'), state.changed.join(','));
});

test('amending that code commit still lists its file', async (t) => {
  const { directory, baseline } = await reconciled(t);
  await write(directory, 'src/b.ts', 'export const b = 2;\n');
  await commit(directory, 'more code');
  await write(directory, 'src/b.ts', 'export const b = 3;\n');
  git(directory, ['commit', '-q', '--amend', '-am', 'more code, reworded']);

  const state = cursor(directory, config(baseline));

  assert.equal(state.behind, 1);
  assert.ok(state.changed.includes('src/b.ts'), state.changed.join(','));
});

test('the reconcile commit is the record, not a change', async (t) => {
  const { directory, baseline } = await reconciled(t);
  const state = cursor(directory, config(baseline));

  assert.deepEqual(state.changed, [], 'entries written with the commit describe it, so it is not accused');
});

test('a cursor older than the newest knowledge commit does not win', async (t) => {
  const { directory, baseline } = await reconciled(t);

  // A second knowledge write, with the cursor left where it was: the record is
  // newer than the cursor, so the record is the baseline.
  await write(directory, 'sddio_docs/adr/adr_100.md', 'a decision\n');
  await commit(directory, 'more knowledge');

  const state = cursor(directory, config(baseline));

  assert.equal(state.state, 'current');
});

test('a commit that only moves the cursor is not behind', async (t) => {
  const { directory, baseline } = await reconciled(t);

  // Reconciled, nothing to write: only the cursor moves.
  await write(
    directory,
    '.sddio/context/config.json',
    `${JSON.stringify({ reconcileCursor: { lastProcessedCommit: baseline } }, null, 2)}\n`,
  );
  await commit(directory, 'reconciled, nothing to write');

  const state = cursor(directory, config(baseline));

  assert.equal(state.state, 'current');
  assert.deepEqual(state.changed, []);
});

test('a rewritten commit is reported, not called a rewrite of history', async (t) => {
  const { directory, baseline } = await reconciled(t);

  git(directory, ['reset', '-q', '--hard', `${baseline}^`]);
  await write(directory, 'src/a.ts', 'export const a = 99;\n');
  await commit(directory, 'code, rewritten');

  const state = cursor(directory, config(baseline));

  assert.equal(state.state, 'behind');
  assert.ok(state.changed.includes('src/a.ts'), state.changed.join(','));
});

test('a cursor whose object is gone is recovered from the knowledge commit', async (t) => {
  const { directory, baseline } = await reconciled(t);

  git(directory, ['reset', '-q', '--hard', `${baseline}^`]);
  await write(directory, 'src/a.ts', 'export const a = 99;\n');
  await commit(directory, 'code, rewritten');
  git(directory, ['reflog', 'expire', '--expire=now', '--all']);
  git(directory, ['gc', '-q', '--prune=now']);

  const state = cursor(directory, config(baseline));

  assert.equal(state.state, 'recovered');
  assert.equal(state.from, sha(directory, 'HEAD^'), 'the newest knowledge commit becomes the baseline');
  assert.ok(state.changed.includes('src/a.ts'), state.changed.join(','));
});

test('no cursor is unknown, never current', async (t) => {
  const directory = await repo(t);
  await write(directory, 'sddio_docs/spec/spec_100.md', 'first\n');
  await commit(directory, 'knowledge');

  assert.equal(cursor(directory, config(null)).state, 'unknown');
});

test('a directory that is not a repository is reported as such', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'sddio-cursor-nogit-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  assert.equal(cursor(directory, config('abc')).state, 'nogit');
});
