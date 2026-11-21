/**
 * `sddio check --claims` — falsifiability, executed (P7).
 *
 * A `SPEC` bullet may carry one line:
 *
 *   - Check: <command> → <expected substring>
 *
 * The command runs at the repository root; the claim holds when the output
 * contains the expected text. A claim whose command fails is drift, not an
 * error — the whole point is that the knowledge says so before a person does.
 */

import { execSync } from 'node:child_process';

import { readEntries } from './repo.js';

export interface Claim {
  id: string;
  command: string;
  expected: string;
}

export interface ClaimResult extends Claim {
  ok: boolean;
  actual: string;
}

const LINE = /^-\s+Check:\s*(.+?)\s*(?:→|->)\s*(.+?)\s*$/;

export function readClaims(root: string): Claim[] {
  const claims: Claim[] = [];

  for (const entry of readEntries(root)) {
    if (entry.kind !== 'SPEC') {
      continue;
    }

    for (const line of entry.body.split('\n')) {
      const match = LINE.exec(line.trim());

      if (match !== null) {
        claims.push({ id: entry.id, command: match[1] ?? '', expected: match[2] ?? '' });
      }
    }
  }

  return claims;
}

export function runClaim(root: string, claim: Claim): ClaimResult {
  try {
    const output = execSync(claim.command, {
      cwd: root,
      encoding: 'utf8',
      timeout: 20_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return { ...claim, ok: output.includes(claim.expected), actual: output.trim() };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message?: string };
    const output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`.trim() || (failure.message ?? '');

    return { ...claim, ok: output.includes(claim.expected), actual: output.split('\n')[0] ?? '' };
  }
}

export function runClaims(root: string, claims: Claim[]): ClaimResult[] {
  return claims.map((claim) => runClaim(root, claim));
}

export interface ClaimsRendered {
  text: string;
  exit: number;
  drift: number;
}

export function renderClaims(results: ClaimResult[]): ClaimsRendered {
  if (results.length === 0) {
    return { text: 'no claims — a SPEC bullet may carry one: `- Check: <command> → <expected>`\n', exit: 0, drift: 0 };
  }

  const drift = results.filter((result) => !result.ok);
  const lines = [`${results.length} claims, ${results.length - drift.length} ok, ${drift.length} drift`];

  for (const result of drift) {
    lines.push(`drift  ${result.id}  ${result.command}`);
    lines.push(`       expect "${result.expected}"  actual "${result.actual.slice(0, 60)}"`);
  }

  return { text: `${lines.join('\n')}\n`, exit: drift.length === 0 ? 0 : 1, drift: drift.length };
}
