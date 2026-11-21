/**
 * The cursor, resolved against git (SPEC-010).
 *
 * One implementation for `brief`, `check`, `diff` and `start`, so four commands
 * cannot disagree about whether the workspace is behind.
 */

import { execFileSync } from 'node:child_process';

import type { Config } from './repo.js';

export type CursorState = 'current' | 'behind' | 'rewritten' | 'lost' | 'unknown' | 'nogit';

export interface Cursor {
  state: CursorState;
  behind: number;
  last: string | null;
}

function run(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function ok(root: string, args: string[]): boolean {
  try {
    execFileSync('git', args, { cwd: root, stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function exists(root: string, sha: string): boolean {
  return ok(root, ['cat-file', '-e', `${sha}^{commit}`]);
}

export function cursor(root: string, config: Config): Cursor {
  const last = config.reconcileCursor?.lastProcessedCommit ?? null;
  const previous = config.reconcileCursor?.previousCommit ?? null;

  if (run(root, ['rev-parse', '--git-dir']) === null || run(root, ['rev-parse', 'HEAD']) === null) {
    return { state: 'nogit', behind: 0, last };
  }

  if (last === null) {
    return { state: 'unknown', behind: 0, last };
  }

  if (!exists(root, last)) {
    if (previous !== null && exists(root, previous) && ok(root, ['merge-base', '--is-ancestor', previous, 'HEAD'])) {
      return { state: 'lost', behind: 0, last };
    }

    return { state: 'unknown', behind: 0, last };
  }

  if (!ok(root, ['merge-base', '--is-ancestor', last, 'HEAD'])) {
    return { state: 'rewritten', behind: 0, last };
  }

  const behind = Number(run(root, ['rev-list', '--count', `${last}..HEAD`]) ?? '0');

  return { state: behind === 0 ? 'current' : 'behind', behind, last };
}

/** The one clause a command prints about the cursor. */
export function describe(state: Cursor): string {
  switch (state.state) {
    case 'current':
      return 'current';
    case 'behind':
      return `${state.behind} commit${state.behind === 1 ? '' : 's'} behind`;
    case 'rewritten':
      return 'history rewritten — reconcile both sides';
    case 'lost':
      return 'anchor lost — reconcile from previousCommit';
    case 'unknown':
      return 'no baseline';
    case 'nogit':
      return 'not a git repository';
  }
}
