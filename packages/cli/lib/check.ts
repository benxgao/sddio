/**
 * `sddio check` and `sddio diff` — the accusing half (P2, P3).
 *
 * Both read the same three facts: the cursor, the files that moved since it, and
 * the entries that name those files. `check` turns that into an exit code for CI;
 * `diff` turns it into a worklist and stops there. Neither writes.
 */

import { execFileSync } from 'node:child_process';

import { cursor, describe, type Cursor } from './cursor.js';
import { entryNames, readConfig, readEntries, type Entry } from './repo.js';

/** Files that are never "unmentioned": the workspace and the board document themselves. */
const NOT_CODE = /^(sddio_docs|flow-trail|\.sddio)\//;

export interface Inspection {
  cursor: Cursor;
  changed: string[];
  named: Array<{ entry: Entry; files: string[] }>;
  unmentioned: string[];
}

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** The commits a reconciliation should look at, given the cursor state. */
function range(root: string, state: Cursor, config: ReturnType<typeof readConfig>): string | null {
  const last = state.last;
  const previous = config.reconcileCursor?.previousCommit ?? null;

  switch (state.state) {
    case 'behind':
      return last === null ? null : `${last}..HEAD`;
    case 'rewritten':
      return last === null ? null : `${last}...HEAD`;
    case 'lost':
      return previous === null ? null : `${previous}..HEAD`;
    case 'unknown':
      return 'HEAD';
    default:
      return null;
  }
}

export function inspect(root: string): Inspection {
  const config = readConfig(root);
  const state = cursor(root, config);
  const entries = readEntries(root);
  const span = range(root, state, config);

  if (span === null) {
    return { cursor: state, changed: [], named: [], unmentioned: [] };
  }

  const changed = (git(root, ['diff', '--name-only', span]) ?? '')
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file !== '');

  const named: Array<{ entry: Entry; files: string[] }> = [];

  for (const entry of entries) {
    const files = changed.filter((file) => entryNames(entry, file));

    if (files.length > 0) {
      named.push({ entry, files });
    }
  }

  const owned = new Set(named.flatMap((group) => group.files));
  const unmentioned = changed.filter((file) => !owned.has(file) && !NOT_CODE.test(file) && file.includes('/'));

  return { cursor: state, changed, named, unmentioned };
}

export interface Rendered {
  text: string;
  ids: string[];
  exit: number;
}

export function renderCheck(report: Inspection): Rendered {
  const lines: string[] = [];
  const ids: string[] = [];

  lines.push(`cursor      ${describe(report.cursor)}`);

  if (report.changed.length === 0) {
    lines.push('changed     nothing');

    return { text: `${lines.join('\n')}\n`, ids, exit: 0 };
  }

  lines.push(`changed     ${report.changed.length} file${report.changed.length === 1 ? '' : 's'}`);

  const shown = report.named.slice(0, 5);
  const more = report.named.length - shown.length;
  const list = shown.map((group) => group.entry.id).join(', ');

  lines.push(
    `named by    ${report.named.length} entr${report.named.length === 1 ? 'y' : 'ies'}` +
      (list === '' ? '' : ` (${list}${more > 0 ? `, +${more} more` : ''})`),
  );

  for (const group of report.named) {
    ids.push(group.entry.id);
  }

  if (report.unmentioned.length > 0) {
    lines.push(`unmentioned ${report.unmentioned.length}: ${report.unmentioned.slice(0, 5).join(', ')}`);
  } else {
    lines.push('unmentioned none');
  }

  const exit = report.cursor.state === 'current' || report.cursor.state === 'nogit' ? 0 : 1;

  return { text: `${lines.join('\n')}\n`, ids, exit };
}

export function renderDiff(report: Inspection): Rendered {
  const lines: string[] = [`cursor ${describe(report.cursor)}`];
  const ids: string[] = [];
  const ordered = [...report.named].sort((a, b) => b.files.length - a.files.length);
  const updates = ordered.slice(0, 10);

  for (const group of updates) {
    lines.push(`update ${group.entry.id.padEnd(10)}${group.files.slice(0, 2).join(', ')}`);
    ids.push(group.entry.id);
  }

  if (ordered.length > updates.length) {
    lines.push(`…      ${ordered.length - updates.length} more entries name a moved file`);
  }

  for (const file of report.unmentioned.slice(0, 10)) {
    lines.push(`add    ${''.padEnd(10)}${file}`);
  }

  if (report.unmentioned.length > 10) {
    lines.push(`…      ${report.unmentioned.length - 10} more files nobody names`);
  }

  if (report.named.length === 0 && report.unmentioned.length === 0) {
    lines.push('none   nothing moved');
  }

  return { text: `${lines.join('\n')}\n`, ids, exit: 0 };
}
