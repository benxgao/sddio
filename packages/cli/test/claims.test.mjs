import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { readClaims, renderClaims, runClaim } from '../dist/claims.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('claims are read from SPEC entries and nothing else', () => {
  const claims = readClaims(root);

  assert.ok(claims.length >= 6, `expected at least six claims, found ${claims.length}`);
  assert.ok(claims.every((claim) => claim.id.startsWith('SPEC-')));
  assert.ok(claims.every((claim) => claim.command !== '' && claim.expected !== ''));
});

test('a claim whose output contains the expected text holds', () => {
  const result = runClaim(root, { id: 'X', command: 'echo sddio', expected: 'sddio' });

  assert.equal(result.ok, true);
});

test('a claim whose output misses it is drift, not an exception', () => {
  const result = runClaim(root, { id: 'X', command: 'echo sddio', expected: 'flow-trail' });

  assert.equal(result.ok, false);
  assert.match(result.actual, /sddio/);
});

test('a command that exits non-zero is judged on its output', () => {
  const result = runClaim(root, { id: 'X', command: 'echo moved; exit 1', expected: 'moved' });

  assert.equal(result.ok, true);
});

test('drift is loud and returns a failing exit code', () => {
  const { text, exit, drift } = renderClaims([
    { id: 'SPEC-999', command: 'echo a', expected: 'a', ok: true, actual: 'a' },
    { id: 'SPEC-998', command: 'echo b', expected: 'c', ok: false, actual: 'b' },
  ]);

  assert.equal(drift, 1);
  assert.equal(exit, 1);
  assert.match(text, /^2 claims, 1 ok, 1 drift$/m);
  assert.match(text, /drift {2}SPEC-998/);
});

test('no claims is not a failure — it is a missing habit', () => {
  const { text, exit } = renderClaims([]);

  assert.equal(exit, 0);
  assert.match(text, /no claims/);
});
