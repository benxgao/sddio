import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { renderCheck, renderDiff } from '../dist/check.js';

const run = promisify(execFile);
const cliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));

async function cli(args, options = {}) {
  return run(process.execPath, [cliPath, ...args], { encoding: 'utf8', ...options });
}

function inspection(overrides = {}) {
  return {
    cursor: { state: 'behind', behind: 3, last: 'abc' },
    changed: ['packages/cli/lib/init.ts'],
    named: [],
    unmentioned: [],
    ...overrides,
  };
}

test('check exits 1 when the cursor is behind, and names the range', () => {
  const { text, exit } = renderCheck(inspection());

  assert.equal(exit, 1);
  assert.match(text, /^cursor\s+3 commits behind/m);
});

test('check exits 0 when the cursor is current', () => {
  const { exit } = renderCheck(inspection({ cursor: { state: 'current', behind: 0, last: 'abc' }, changed: [] }));

  assert.equal(exit, 0);
});

test('a moved file nobody names is listed, not silently dropped', () => {
  const { text } = renderCheck(inspection({ unmentioned: ['packages/cli/lib/hooks.ts'] }));

  assert.match(text, /^unmentioned 1: packages\/cli\/lib\/hooks\.ts$/m);
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
  // A behind cursor exits 1 by design, so the JSON is read from either outcome.
  const outcome = await cli(['check', '--json'], { cwd: join(root, 'packages/cli') }).catch((error) => error);
  const report = JSON.parse(outcome.stdout);

  assert.ok(['current', 'behind', 'rewritten', 'lost', 'unknown'].includes(report.cursor.state));
});

test('a directory with no workspace fails clearly instead of guessing', async (t) => {
  const empty = await mkdtemp(join(tmpdir(), 'sddio-none-'));
  t.after(() => rm(empty, { recursive: true, force: true }));
  await writeFile(join(empty, 'README.md'), '', 'utf8');

  await assert.rejects(() => cli(['check'], { cwd: empty }), /no \.sddio\/context\/config\.json/);
});
