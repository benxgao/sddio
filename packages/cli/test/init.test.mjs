import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { ensureAgentsSnippet } from '../dist/agents.js';
import { runInit } from '../dist/init.js';

async function project(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sddio-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  return directory;
}

test('init creates both roots, the seeds and the workspace directories', async (t) => {
  const target = await project(t);
  const result = await runInit({ cwd: target });

  assert.deepEqual(result.errors, []);
  assert.equal(result.created.length, 22);

  for (const expected of [
    '.sddio/context/instructions.md',
    'sddio_workspace/spec/spec_100.md',
    'sddio_workspace/adr/adr_100.md',
    'sddio_workspace/discussions/discussions_100.md',
    'sddio_workspace/flow/active/template.md',
    'AGENTS.md',
  ]) {
    assert.ok(existsSync(join(target, expected)), `${expected} should exist`);
  }

  for (const directory of [
    'sddio_workspace/flow/completed',
    'sddio_workspace/flow/reconciliation',
    '.sddio/context/instructions/.schema',
  ]) {
    assert.ok(existsSync(join(target, directory)), `${directory} should exist`);
  }
});

test('a second run is idempotent and does not duplicate the AGENTS.md snippet', async (t) => {
  const target = await project(t);

  await runInit({ cwd: target });
  const agentsPath = join(target, 'AGENTS.md');
  const first = await readFile(agentsPath, 'utf8');

  const second = await runInit({ cwd: target });

  assert.equal(second.created.length, 0);
  assert.equal(second.overwritten.length, 0);
  assert.equal(second.skipped.length, 22);
  assert.equal(await readFile(agentsPath, 'utf8'), first);
  assert.equal(first.split('<!-- sddio:begin -->').length - 1, 1);
});

test('dry run writes nothing', async (t) => {
  const target = await project(t);
  const result = await runInit({ cwd: target, dryRun: true });

  assert.equal(result.dryRun, true);
  assert.equal(result.created.length, 22);
  assert.deepEqual(result.errors, []);
  assert.equal(existsSync(join(target, '.sddio')), false);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('user-owned workspace files survive, package-owned .sddio files are refreshed', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const workspaceFile = join(target, 'sddio_workspace/adr/adr_100.md');
  const packageFile = join(target, '.sddio/context/config.json');
  await writeFile(workspaceFile, 'user edit\n', 'utf8');
  await writeFile(packageFile, 'user edit\n', 'utf8');

  const result = await runInit({ cwd: target });

  assert.equal(await readFile(workspaceFile, 'utf8'), 'user edit\n');
  assert.notEqual(await readFile(packageFile, 'utf8'), 'user edit\n');
  assert.ok(result.skipped.includes('sddio_workspace/adr/adr_100.md'));
  assert.ok(result.overwritten.includes('.sddio/context/config.json'));
});

test('--force overwrites user-owned workspace files', async (t) => {
  const target = await project(t);
  await runInit({ cwd: target });

  const workspaceFile = join(target, 'sddio_workspace/adr/adr_100.md');
  await writeFile(workspaceFile, 'user edit\n', 'utf8');

  const result = await runInit({ cwd: target, force: true });

  assert.notEqual(await readFile(workspaceFile, 'utf8'), 'user edit\n');
  assert.ok(result.overwritten.includes('sddio_workspace/adr/adr_100.md'));
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
