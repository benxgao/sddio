import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { renderNextStep, selectNextStep, BOOTSTRAP_PROMPT } from '../dist/prompt.js';

const run = promisify(execFile);
const cliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

async function project(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sddio-prompt-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  return directory;
}

function cli(args) {
  return run(process.execPath, [cliPath, ...args], { encoding: 'utf8' });
}

test('the next step follows what the run actually changed', () => {
  assert.equal(selectNextStep(22, 0), 'bootstrap');
  assert.equal(selectNextStep(3, 17), 'bootstrap');
  assert.equal(selectNextStep(0, 17), 'reconcile');
  assert.equal(selectNextStep(0, 0), 'current');
});

test('the bootstrap prompt is self-contained and framed for pasting', () => {
  const output = renderNextStep('bootstrap');

  assert.ok(output.includes('Paste this into your coding agent'));
  assert.ok(output.includes('instructions.md'));
  assert.ok(output.includes('reconciliation.md'));
  assert.ok(output.includes('bootstrap.md'));
  assert.ok(output.includes('lastProcessedCommit'));
  assert.ok(!output.includes('undefined'));
});

test('the bootstrap prompt asks for an open question, not only for claims', () => {
  assert.ok(BOOTSTRAP_PROMPT.includes('at least one DISCUSSION'));
  assert.ok(
    BOOTSTRAP_PROMPT.indexOf('DISCUSSION') < BOOTSTRAP_PROMPT.indexOf('lastProcessedCommit'),
    'the DISCUSSION step has to precede the cursor update, or it reads as optional',
  );
});

test('the bootstrap instructions carry the same rule', async () => {
  const instructions = await readFile(
    new URL('../../../.sddio/context/instructions/bootstrap.md', import.meta.url),
    'utf8',
  );

  assert.ok(instructions.includes('DISCUSSION'));
});

test('an up-to-date project gets no prompt to paste', () => {
  const output = renderNextStep('current');

  assert.ok(!output.includes('Paste this'));
  assert.ok(output.includes('Already up to date'));
});

test('init prints the prompt after a fresh run', async (t) => {
  const target = await project(t);
  const { stdout } = await cli(['init', '--dir', target]);

  assert.ok(stdout.includes('Paste this into your coding agent'));
  assert.ok(stdout.includes('Bootstrap as described'));
});

test('a dry run never prints a prompt to paste', async (t) => {
  const target = await project(t);
  const { stdout } = await cli(['init', '--dir', target, '--dry-run']);

  assert.ok(!stdout.includes('Paste this'));
  assert.ok(stdout.includes('run again without --dry-run'));
});

test('rerunning init on an initialised project reports nothing to do', async (t) => {
  const target = await project(t);

  await cli(['init', '--dir', target]);
  const { stdout } = await cli(['init', '--dir', target]);

  assert.ok(stdout.includes('Already up to date'));
  assert.ok(!stdout.includes('Paste this'));
});

test('a changed context layer is treated as an upgrade, not a first run', async (t) => {
  const target = await project(t);

  await cli(['init', '--dir', target]);
  await writeFile(join(target, '.sddio/context/instructions.md'), 'stale\n', 'utf8');

  const { stdout } = await cli(['init', '--dir', target]);

  assert.ok(stdout.includes('package upgrade'));
  assert.ok(stdout.includes('cursor was kept'));
  assert.ok(!stdout.includes('Bootstrap as described'));
});

test('the prompt copies in the READMEs match the CLI', async () => {
  const readmes = [
    new URL('../README.md', import.meta.url),
    new URL('../../../README.md', import.meta.url),
  ];

  for (const readme of readmes) {
    const contents = await readFile(readme, 'utf8');

    assert.ok(contents.includes(BOOTSTRAP_PROMPT), `${readme.pathname} is out of date`);
  }
});
