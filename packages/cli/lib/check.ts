/**
 * `sddio check` and `sddio diff` — the accusing half.
 *
 * Both read the same three facts: the cursor, the files that moved since it, and
 * the entries that name those files. `check` prints and stays out of the way;
 * `--strict` turns the same report into an exit code for CI. `diff` turns it
 * into a worklist and stops there. Neither writes.
 *
 * The accusation is deliberately narrower than "a file moved". Prose, images and
 * the layers that document themselves are not entry material, and listing them
 * is how a signal becomes a wall (ADR-010).
 */

import { cursor, describe, type Cursor } from './cursor.js';
import { entryNames, readConfig, readEntries, type Entry } from './repo.js';

/** Files that are never "unmentioned": the workspace and the board document themselves. */
const NOT_CODE = /^(sddio_docs|flow-trail|\.sddio)\//;

/** Prose and assets: an entry about them would restate the diff (ADR-012). */
const PROSE = /\.(md|mdx|txt|svg|png|jpe?g|gif|webp|ico)$/i;

/** Can an entry be written about this path at all? */
export function entryMaterial(file: string): boolean {
  return !NOT_CODE.test(file) && !PROSE.test(file);
}

export interface Inspection {
  cursor: Cursor;
  changed: string[];
  named: Array<{ entry: Entry; files: string[] }>;
  unmentioned: string[];
}

export function inspect(root: string): Inspection {
  const state = cursor(root, readConfig(root));
  const entries = readEntries(root);
  const changed = state.changed;

  if (changed.length === 0) {
    return { cursor: state, changed, named: [], unmentioned: [] };
  }

  const named: Array<{ entry: Entry; files: string[] }> = [];

  for (const entry of entries) {
    const files = changed.filter((file) => entryNames(entry, file));

    if (files.length > 0) {
      named.push({ entry, files });
    }
  }

  const owned = new Set(named.flatMap((group) => group.files));
  const unmentioned = changed.filter((file) => !owned.has(file) && entryMaterial(file));

  return { cursor: state, changed, named, unmentioned };
}

export interface Rendered {
  text: string;
  ids: string[];
  /** `1` when the report would fail a gate. `check` ignores it unless `--strict`. */
  strict: number;
}

export function renderCheck(report: Inspection): Rendered {
  const lines: string[] = [];
  const ids: string[] = [];

  lines.push(`cursor      ${describe(report.cursor)}`);

  if (report.cursor.from !== null && report.cursor.subject !== '') {
    lines.push(`baseline    ${report.cursor.from.slice(0, 7)} ${report.cursor.subject}`);
  }

  if (report.cursor.state === 'recovered') {
    lines.push('note        the stored cursor no longer exists; the knowledge commit was used');
  }

  if (report.changed.length === 0) {
    lines.push('changed     nothing');

    return { text: `${lines.join('\n')}\n`, ids, strict: 0 };
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

  const strict = report.cursor.state === 'current' && report.unmentioned.length === 0 ? 0 : 1;

  return { text: `${lines.join('\n')}\n`, ids, strict };
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

  return { text: `${lines.join('\n')}\n`, ids, strict: 0 };
}
