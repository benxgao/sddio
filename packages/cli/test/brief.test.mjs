import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderBrief, renderEntry } from '../dist/brief.js';
import { entryNames, pathsIn, readEntries } from '../dist/repo.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));

/** An entry is five strings and a body; the matcher takes nothing else. */
function entryNaming(body) {
  return { id: 'X-001', kind: 'SPEC', title: 'shape', body, file: '', refs: [], status: '' };
}

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

test('a folder finds the entries that name the files inside it', () => {
  // ADR-005 names `lib/workspace.ts`, which is `packages/cli/lib/workspace.ts`
  // written the short way. The folder is the only thing standing between them.
  const { ids } = renderBrief(root, ['packages/cli/lib/']);

  assert.ok(ids.includes('ADR-005'), ids.join(','));
});

test('the trailing slash is a writing habit, not a meaning', () => {
  const withSlash = renderBrief(root, ['packages/cli/lib/']).ids;
  const without = renderBrief(root, ['packages/cli/lib']).ids;

  assert.deepEqual(without, withSlash);
  assert.ok(without.length > 0, 'a folder with a named file in it cannot be empty');
});

test('a one-segment folder is a path, not a word', () => {
  const entry = entryNaming('The board lives in `product-view/`, and the raw notes in `app/notes.md`.');

  assert.deepEqual(pathsIn(entry.body), ['product-view/', 'app/notes.md']);
  assert.equal(entryNames(entry, 'product-view'), true);
  assert.equal(entryNames(entry, 'product-view/'), true);
  assert.equal(entryNames(entry, 'app/notes.md'), true);
});

test('a folder does not match a token that merely starts the same way', () => {
  const entry = entryNaming('Written in `packages/cli/libx/init.ts` and `docs-site/README.md`.');

  assert.equal(entryNames(entry, 'packages/cli/lib/'), false);
  assert.equal(entryNames(entry, 'docs/'), false);
});

test('a filename nobody wrote still says so, even inside a named folder', () => {
  const { text, ids } = renderBrief(root, ['packages/cli/lib/no-such-file.ts']);

  assert.deepEqual(ids, []);
  assert.match(text, /^none\s+packages\/cli\/lib\/no-such-file\.ts$/m);
});
