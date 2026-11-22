/**
 * The baseline, resolved against git (SPEC-010).
 *
 * The baseline is the commit the knowledge was last reconciled against. Two
 * facts can name it, and the baseline is whichever is newer:
 *
 * - the newest commit that changed `sddio_docs/` — the record of a reconcile;
 * - the cursor, for the case where a reconcile found nothing to write.
 *
 * Taking the newer one is what makes an amend a non-event. Writing `HEAD` into
 * the cursor and committing makes that commit the newest knowledge commit, and
 * its parent the stored cursor; the comparison then starts at the commit itself,
 * not one behind it, and amending it changes neither side of that comparison.
 *
 * Nothing is verified for existence before it is used. A cursor whose object is
 * gone — rebase, `gc`, a fresh clone — falls back to the knowledge commit and
 * says so, instead of reporting rewritten history (ADR-013).
 */

import { execFileSync } from 'node:child_process';

import type { Config } from './repo.js';

export type CursorState = 'current' | 'behind' | 'recovered' | 'unknown' | 'nogit';

export const KNOWLEDGE = 'sddio_docs/';

/** The context layer documents itself; a commit touching only it is not a change. */
const CONTEXT = ':(exclude).sddio';

export interface Cursor {
  state: CursorState;
  /** Commits between the baseline and `HEAD`. */
  behind: number;
  /** The commit the knowledge was last reconciled against. */
  from: string | null;
  /** Files that moved between `from` and `HEAD`. */
  changed: string[];
  subject: string;
  date: string;
}

function run(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function exists(root: string, sha: string): boolean {
  return run(root, ['cat-file', '-e', `${sha}^{commit}`]) !== null;
}

function isAncestor(root: string, older: string, newer: string): boolean {
  return run(root, ['merge-base', '--is-ancestor', older, newer]) !== null;
}

function lines(text: string | null): string[] {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

export function cursor(root: string, config: Config): Cursor {
  const base: Cursor = {
    state: 'unknown',
    behind: 0,
    from: null,
    changed: [],
    subject: '',
    date: '',
  };

  if (run(root, ['rev-parse', '--git-dir']) === null) {
    return { ...base, state: 'nogit' };
  }

  const head = run(root, ['rev-parse', 'HEAD']);

  if (head === null) {
    return { ...base, state: 'nogit' };
  }

  const knowledge = run(root, ['log', '-1', '--format=%H', '--', KNOWLEDGE]);

  if (knowledge === null) {
    return base;
  }

  const stored = config.reconcileCursor?.lastProcessedCommit ?? null;

  if (stored === null) {
    return base;
  }

  const resolvable = exists(root, stored);
  const from = !resolvable
    ? knowledge
    : isAncestor(root, stored, knowledge)
      ? knowledge
      : isAncestor(root, knowledge, stored)
        ? stored
        : knowledge;
  const [subject = '', date = ''] = lines(run(root, ['log', '-1', '--format=%s%n%cs', from]));
  const span = `${from}..${head}`;
  // A commit that only moves the cursor changed nothing to reconcile. The
  // context layer documents itself, so it is not part of the accusation.
  const behind = Number(run(root, ['rev-list', '--count', span, '--', '.', CONTEXT]) ?? '0');

  return {
    state: !resolvable ? 'recovered' : behind === 0 ? 'current' : 'behind',
    behind,
    from,
    changed: lines(run(root, ['diff', '--name-only', from, head, '--', '.', CONTEXT])),
    subject,
    date,
  };
}

/** One clause, used by `brief` and `start` where the screen is tight. */
export function describe(state: Cursor): string {
  const at = state.from === null ? '' : `${state.from.slice(0, 7)}${state.date === '' ? '' : ` (${state.date})`}`;

  switch (state.state) {
    case 'current':
      return at === '' ? 'current' : `current — baseline ${at}`;
    case 'behind':
      return `${state.behind} commit${state.behind === 1 ? '' : 's'} behind ${at}`;
    case 'recovered':
      return `cursor gone — using ${at}`;
    case 'unknown':
      return 'no baseline yet';
    case 'nogit':
      return 'not a git repository';
  }
}
