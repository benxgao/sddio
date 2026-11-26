import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderBrief } from '../dist/brief.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('start keeps to ten lines, whatever the workspace holds', () => {
  const { text } = renderBrief(root, [], { label: 'start', hint: true, budget: 10 });

  assert.ok(text.trimEnd().split('\n').length <= 10, text);
});

test('start names itself, so a transcript says which command ran', () => {
  const { text } = renderBrief(root, [], { label: 'start', hint: true });

  assert.match(text, /^start\s/);
});

test('nothing it prints is a command that does not exist', () => {
  // `sddio` is not on PATH: the CLI runs from npm's cache under a scoped name.
  // A copyable `sddio brief ...` in the output is the same defect the 0.4.0
  // release was about, one layer down.
  const { text } = renderBrief(root, [], { label: 'start', hint: true });

  assert.doesNotMatch(text, /\bsddio (start|brief|check|diff|show|init)\b/);
});

test('a stale cursor earns a hint, and the hint names no work', () => {
  const withHint = renderBrief(root, [], { label: 'start', hint: true }).text;
  const without = renderBrief(root, [], { label: 'start' }).text;

  assert.ok(withHint.length >= without.length);
  assert.doesNotMatch(without, /^hint/m);
});

test('start with a path answers about that path', () => {
  const { text } = renderBrief(root, ['packages/cli/lib/init.ts'], { label: 'start', hint: true });

  assert.match(text, /^start\s+packages\/cli\/lib\/init\.ts$/m);
});

test('the budget is honoured before the content is, so a long answer is cut not spilled', () => {
  const { text } = renderBrief(root, [], { label: 'start', hint: true, budget: 3 });

  assert.equal(text.trimEnd().split('\n').length, 3);
});
