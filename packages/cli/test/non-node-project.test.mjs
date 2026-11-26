/**
 * A project that owns nothing of Node.
 *
 * The install moved to the machine and out of the repository (ADR-017), so the
 * case that has to work is a Python (or Go, or Rust) tree where `package.json`
 * is not merely absent but would be unwelcome. The binary is invoked the way
 * `npx` invokes it — from outside, by absolute path, with the project as cwd —
 * because that is the only difference between this and a Node repository.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { version } from '../dist/paths.js';

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

async function pythonProject(t) {
  const root = await mkdtemp(join(tmpdir(), 'sddio-python-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await mkdir(join(root, 'app'), { recursive: true });
  await mkdir(join(root, '.venv', 'bin'), { recursive: true });
  await writeFile(join(root, 'pyproject.toml'), '[project]\nname = "demo"\n', 'utf8');
  await writeFile(join(root, 'app', 'main.py'), 'print("hello")\n', 'utf8');
  await writeFile(join(root, '.venv', 'bin', 'python'), '', 'utf8');

  return root;
}

function run(cwd, ...args) {
  return execFileSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

async function walk(dir, prefix = '') {
  const entries = await readdir(join(dir, prefix), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await walk(dir, relative)));
    } else {
      files.push(relative);
    }
  }

  return files;
}

test('init in a project with no package.json adds the scaffold and no Node file', async (t) => {
  const root = await pythonProject(t);

  run(root, 'init', '--yes');

  const files = await walk(root);

  assert.ok(files.includes('AGENTS.md'), 'AGENTS.md is the integration point');
  assert.ok(files.includes('.sddio/context/instructions.md'));
  assert.ok(files.includes('sddio_docs/spec/spec_100.md'));

  const nodeFiles = files.filter((file) => /(^|\/)package\.json$|(^|\/)node_modules\//.test(file));

  assert.deepEqual(nodeFiles, [], 'the project must not gain a Node manifest or a tree');
});

test('the command written into AGENTS.md pins the release that scaffolded it', async (t) => {
  const root = await pythonProject(t);

  run(root, 'init', '--yes');

  const agents = await readFile(join(root, 'AGENTS.md'), 'utf8');

  assert.ok(agents.includes(`npx -y @sddio/cli@${version} start`), agents);
});

test('every read command answers in that project, and finds it from a subdirectory', async (t) => {
  const root = await pythonProject(t);

  run(root, 'init', '--yes');

  for (const args of [['start'], ['brief', 'app/main.py'], ['check'], ['diff'], ['--version']]) {
    assert.doesNotThrow(() => run(root, ...args), `${args.join(' ')} should exit 0`);
  }

  const nested = run(join(root, 'app'), 'start');

  assert.match(nested, /^start/m, 'start still names itself from a subdirectory');
  assert.match(nested, /^cursor/m, 'the workspace is found by walking up, not by cwd');
});

test('a second init is a no-op, so an upgrade only happens when asked', async (t) => {
  const root = await pythonProject(t);

  run(root, 'init', '--yes');

  assert.match(run(root, 'init', '--yes'), /Already up to date/);
});
