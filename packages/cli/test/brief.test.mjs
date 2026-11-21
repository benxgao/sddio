import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderBrief, renderEntry } from '../dist/brief.js';
import { readEntries } from '../dist/repo.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('a path that an entry names returns that entry', () => {
  const { text, ids } = renderBrief(root, ['packages/cli/lib/init.ts']);

  assert.ok(ids.includes('SPEC-003'), ids.join(','));
  assert.match(text, /^spec\s+SPEC-003/m);
});

test('a base name is enough — the entry may not carry the full path', () => {
  const { ids } = renderBrief(root, ['packages/cli/lib/init.ts']);

  assert.ok(ids.includes('SPEC-003'));
});

test('a path nobody names says so instead of inventing a match', () => {
  const { text, ids } = renderBrief(root, ['packages/cli/lib/no-such-file.ts']);

  assert.deepEqual(ids, []);
  assert.match(text, /^none\s+packages\/cli\/lib\/no-such-file\.ts$/m);
});

test('no argument answers with the shape of the workspace, not its contents', () => {
  const { text, ids } = renderBrief(root, []);

  assert.ok(text.split('\n').length <= 60, 'brief exceeded its sixty-line budget');
  assert.match(text, /^entries \d+ SPEC, \d+ ADR, \d+ DISC$/m);
  assert.ok(ids.length > 0, 'a workspace with entries should name at least one');
});

test('every ID it prints resolves to an entry that exists', () => {
  const known = new Set(readEntries(root).map((entry) => entry.id));

  for (const ids of [renderBrief(root, []).ids, renderBrief(root, ['packages/cli/lib/init.ts']).ids]) {
    for (const id of ids) {
      assert.ok(known.has(id), `${id} is printed but does not exist`);
    }
  }
});

test('`.` means the whole workspace, not a file named dot', () => {
  const { text } = renderBrief(root, ['.']);

  assert.doesNotMatch(text, /^none\s+\.$/m);
});

test('show prints one entry, with its refs and body', () => {
  const entry = readEntries(root).find((candidate) => candidate.id === 'ADR-011');

  assert.ok(entry);
  const text = renderEntry(entry);

  assert.match(text, /^## ADR-011 /);
  assert.match(text, /refs: /);
  assert.ok(text.length > 200, 'the body should be printed, not just the title');
});
