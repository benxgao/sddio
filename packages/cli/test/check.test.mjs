import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { entryMaterial, renderCheck, renderDiff } from '../dist/check.js';
import { runInit } from '../dist/init.js';

const run = promisify(execFile);
const cliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));

async function cli(args, options = {}) {
  return run(process.execPath, [cliPath, ...args], { encoding: 'utf8', ...options });
}

function git(directory, args) {
  return execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function inspection(overrides = {}) {
  return {
    cursor: {
      state: 'behind',
      behind: 3,
      from: 'abc1234',
      changed: ['packages/cli/lib/init.ts'],
      via: 'knowledge',
      subject: 'a commit',
      date: '2026-11-21',
    },
    changed: ['packages/cli/lib/init.ts'],
    named: [],
    unmentioned: [],
    ...overrides,
  };
}

test('check is informational: it names the baseline and does not gate', () => {
  const { text, strict } = renderCheck(inspection());

  assert.match(text, /^cursor\s+3 commits behind abc1234/m);
  assert.match(text, /^baseline\s+abc1234 a commit$/m);
  assert.equal(strict, 1, 'the report would fail a gate, but check itself exits 0');
});

test('a current report needs nothing and would pass a gate', () => {
  const { strict } = renderCheck(
    inspection({ cursor: { ...inspection().cursor, state: 'current', behind: 0 }, changed: [] }),
  );

  assert.equal(strict, 0);
});

test('a lost cursor is reported, not called a rewrite of history', () => {
  const { text } = renderCheck(inspection({ cursor: { ...inspection().cursor, state: 'recovered' } }));

  assert.match(text, /^note\s+the stored cursor no longer exists/m);
});

test('a moved file nobody names is listed, not silently dropped', () => {
  const { text } = renderCheck(inspection({ unmentioned: ['packages/cli/lib/hooks.ts'] }));

  assert.match(text, /^unmentioned 1: packages\/cli\/lib\/hooks\.ts$/m);
});

test('prose and assets are not entry material; source and config are', () => {
  assert.equal(entryMaterial('docs/faq.md'), false);
  assert.equal(entryMaterial('assets/how-it-works.svg'), false);
  assert.equal(entryMaterial('sddio_docs/spec/spec_100.md'), false);
  assert.equal(entryMaterial('packages/cli/lib/check.ts'), true);
  assert.equal(entryMaterial('package.json'), true);
  assert.equal(entryMaterial('.github/workflows/ci.yml'), true);
});

test('diff is a worklist: every line starts with a verdict word', () => {
  const { text } = renderDiff(
    inspection({
      named: [{ entry: { id: 'SPEC-003' }, files: ['packages/cli/lib/init.ts'] }],
      unmentioned: ['packages/cli/lib/hooks.ts'],
    }),
  );

  for (const line of text.trimEnd().split('\n')) {
    assert.match(line, /^(cursor|update|add|none|…)\s/, `unexpected line: ${line}`);
  }
});

test('diff never carries a sentence', () => {
  const { text } = renderDiff(inspection({ unmentioned: ['packages/cli/lib/hooks.ts'] }));

  assert.doesNotMatch(text, /[.!?]\s*$/m);
});

test('the CLI resolves the root and answers from a nested directory', async () => {
  const { stdout } = await cli(['check', '--json'], { cwd: join(root, 'packages/cli') });
  const report = JSON.parse(stdout);

  assert.ok(['current', 'behind', 'recovered', 'unknown', 'nogit'].includes(report.cursor.state));
});

test('check exits 0 on a behind workspace; --strict is the gate', async (t) => {
  const target = await mkdtemp(join(tmpdir(), 'sddio-gate-'));
  t.after(() => rm(target, { recursive: true, force: true }));

  await runInit({ cwd: target });
  git(target, ['init', '-q']);
  git(target, ['config', 'user.email', 'test@example.com']);
  git(target, ['config', 'user.name', 'Test']);
  await writeFile(join(target, 'sddio_docs/spec/spec_100.md'), 'a requirement\n', 'utf8');
  git(target, ['add', '-A']);
  git(target, ['commit', '-qm', 'knowledge']);
  const baseline = git(target, ['rev-parse', 'HEAD']);

  await mkdir(join(target, 'src'), { recursive: true });
  await writeFile(join(target, 'src/a.ts'), 'export const a = 1;\n', 'utf8');
  git(target, ['add', '-A']);
  git(target, ['commit', '-qm', 'code']);
  await writeFile(
    join(target, '.sddio/context/config.json'),
    `${JSON.stringify({ reconcileCursor: { lastProcessedCommit: baseline } }, null, 2)}\n`,
    'utf8',
  );

  const plain = await cli(['check'], { cwd: target });
  assert.equal(plain.stdout.includes('1 commit behind'), true, plain.stdout);

  await assert.rejects(() => cli(['check', '--strict'], { cwd: target }), (error) => error.code === 1);
});

test('a directory with no workspace fails clearly instead of guessing', async (t) => {
  const empty = await mkdtemp(join(tmpdir(), 'sddio-none-'));
  t.after(() => rm(empty, { recursive: true, force: true }));
  await writeFile(join(empty, 'README.md'), '', 'utf8');

  await assert.rejects(() => cli(['check'], { cwd: empty }), /no \.sddio\/context\/config\.json/);
});
