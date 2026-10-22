import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const cliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const packagedSkill = fileURLToPath(new URL('../templates/.sddio/skill/SKILL.md', import.meta.url));

async function cli(args) {
  try {
    const { stdout, stderr } = await run(process.execPath, [cliPath, ...args], { encoding: 'utf8' });

    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

test('skill --print writes the skill to stdout and nothing else', async () => {
  const expected = await readFile(packagedSkill, 'utf8');
  const { code, stdout } = await cli(['skill', '--print']);

  assert.equal(code, 0);
  assert.equal(stdout, expected, 'stdout must be redirectable as-is');
});

test('hints go to stderr so a redirect stays clean', async () => {
  const { stderr } = await cli(['skill', '--print']);

  assert.ok(stderr.includes('No file was written'));
  assert.ok(stderr.includes('SKILL.md'));
});

test('the skill carries its own trigger metadata', async () => {
  const skill = await readFile(packagedSkill, 'utf8');

  assert.ok(skill.startsWith('---\nname: sddio\n'));
  assert.ok(skill.includes('description:'));
  assert.ok(skill.includes('.sddio/'));
});

test('the skill stays a router: no CLI commands, no copied rules', async () => {
  const skill = await readFile(packagedSkill, 'utf8');

  assert.ok(!skill.includes('npx sddio'), 'the skill must not depend on the CLI being invocable');
  assert.ok(!skill.includes('sddio index'), 'retrieval lives in the instructions, not the skill');
  assert.ok(skill.includes('grep'), 'reading uses the agent’s own tools');
  assert.ok(skill.includes('instructions.md'), 'rules are delegated by path');
});

test('an unknown option fails instead of silently printing', async () => {
  const { code, stderr } = await cli(['skill', '--write-home']);

  assert.equal(code, 1);
  assert.ok(stderr.includes('Unknown option'));
});

test('init leaves the skill inside the project for copying', async (t) => {
  const target = await mkdtemp(join(tmpdir(), 'sddio-skill-'));
  t.after(() => rm(target, { recursive: true, force: true }));

  await cli(['init', '--dir', target]);

  const copied = await readFile(join(target, '.sddio/skill/SKILL.md'), 'utf8');
  const packaged = await readFile(packagedSkill, 'utf8');

  assert.equal(copied, packaged);
});
