/**
 * `sddio brief` — the answering half (P1).
 *
 * One screen, computed from the workspace: what the cursor says, which entries
 * name the paths in front of you, and which paths nobody has written about. It
 * reads; it never decides, and it never prints a body — `show <id>` is one
 * keystroke away and half of progressive disclosure is making that the default.
 */

import { cursor, describe } from './cursor.js';
import { entryNames, readConfig, readEntries, type Entry } from './repo.js';

const BUDGET = 60;
const PER_PATH = 3;
const WIDTH = 58;

export interface BriefResult {
  text: string;
  ids: string[];
}

function trimming(text: string, width = WIDTH): string {
  return text.length > width ? `${text.slice(0, width - 1)}…` : text;
}

function row(kind: string, entry: Entry): string {
  return `${kind.padEnd(8)}${entry.id.padEnd(10)}${trimming(entry.title)}`.trimEnd();
}

/** `load` on the first row of a group, blanks after it, so columns line up. */
function group(label: string, index: number, rest: string): string {
  return `${(index === 0 ? label : '').padEnd(8)}${rest}`.trimEnd();
}

function counts(entries: Entry[]): string {
  const spec = entries.filter((entry) => entry.kind === 'SPEC').length;
  const adr = entries.filter((entry) => entry.kind === 'ADR').length;
  const disc = entries.filter((entry) => entry.kind === 'DISC').length;

  return `${spec} SPEC, ${adr} ADR, ${disc} DISC`;
}

/** Entries with the most inbound references: the load-bearing ones. */
function loadBearing(entries: Entry[]): Entry[] {
  const inbound = new Map<string, number>();

  for (const entry of entries) {
    for (const ref of entry.refs) {
      inbound.set(ref, (inbound.get(ref) ?? 0) + 1);
    }
  }

  return [...inbound.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => entries.find((entry) => entry.id === id))
    .filter((entry): entry is Entry => entry !== undefined);
}

function openQuestions(entries: Entry[]): Entry[] {
  return entries.filter((entry) => entry.kind === 'DISC' && entry.status !== 'resolved').slice(0, 2);
}

export interface BriefOptions {
  /** First-column label; `start` reuses this renderer with its own name. */
  label?: string;
  /** Say where the worklist is, without printing it. */
  hint?: boolean;
  budget?: number;
}

export function renderBrief(root: string, paths: string[], options: BriefOptions = {}): BriefResult {
  const targets = paths.filter((path) => path !== '.' && path !== './');
  const entries = readEntries(root);
  const state = cursor(root, readConfig(root));
  const lines: string[] = [];
  const ids: string[] = [];
  const stale = state.state === 'behind' || state.state === 'rewritten' || state.state === 'lost';

  lines.push(`${(options.label ?? 'brief').padEnd(6)} ${targets.length === 0 ? '.' : targets.join(' ')}`);
  lines.push(`cursor  ${describe(state)}`);

  if (options.hint === true && stale) {
    lines.push('hint    sddio diff lists what moved and which entry names it');
  }

  if (targets.length === 0) {
    lines.push(`entries ${counts(entries)}`);

    for (const [index, entry] of loadBearing(entries).entries()) {
      const count = entry.refs.length;
      const refs = count === 0 ? '' : `  (${count} ref${count === 1 ? '' : 's'})`;
      lines.push(group('load', index, `${entry.id.padEnd(10)}${trimming(entry.title, 40)}${refs}`));
      ids.push(entry.id);
    }

    for (const [index, entry] of openQuestions(entries).entries()) {
      lines.push(group('open', index, `${entry.id.padEnd(10)}${trimming(entry.title, 44)}`));
      ids.push(entry.id);
    }

    if (entries.length > 0) {
      lines.push('');
      lines.push('read   `sddio brief <path>` for the files you are about to touch');
    }
  } else {
    const unnamed: string[] = [];

    for (const path of targets) {
      const matched = entries
        .filter((entry) => entryNames(entry, path))
        .filter((entry) => !ids.includes(entry.id))
        .slice(0, PER_PATH);

      if (matched.length === 0) {
        unnamed.push(path);
        continue;
      }

      for (const entry of matched) {
        lines.push(row(entry.kind.toLowerCase(), entry));
        ids.push(entry.id);
      }
    }

    for (const path of unnamed) {
      lines.push(`none    ${path}`);
    }

    if (ids.length === 0 && unnamed.length > 0) {
      lines.push('        nothing names these; if it matters, that is an entry nobody wrote');
    }
  }

  return { text: `${lines.slice(0, options.budget ?? BUDGET).join('\n')}\n`, ids };
}

export function renderEntry(entry: Entry): string {
  const refs = entry.refs.length === 0 ? '' : `refs: ${entry.refs.join(', ')}\n\n`;

  return `## ${entry.id} ${entry.title}\n\n${refs}${entry.body}\n`;
}
