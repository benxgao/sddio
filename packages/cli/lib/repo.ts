/**
 * Where the workspace is, and what is in it.
 *
 * Every read-side command needs the same three things: the repository root, the
 * cursor, and the entries. They live here so `brief`, `check`, `diff` and `start`
 * cannot disagree about what an entry is.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { WORKSPACE_ROOT } from './workspace.js';

export interface HookDeclaration {
  id: string;
  kind: string;
  events: string[];
}

export interface Config {
  schemaVersion?: number;
  reconcileCursor?: { lastProcessedCommit: string | null; previousCommit: string | null };
  hooks?: HookDeclaration[];
}

export type EntryKind = 'SPEC' | 'ADR' | 'DISC';

export interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  body: string;
  file: string;
  refs: string[];
  status: string;
}

const COLLECTIONS: Array<{ dir: string; kind: EntryKind }> = [
  { dir: 'spec', kind: 'SPEC' },
  { dir: 'adr', kind: 'ADR' },
  { dir: 'discussions', kind: 'DISC' },
];

/** Walk up from `start` until a `.sddio/context/config.json` appears. */
export function findRoot(start: string): string | null {
  let current = resolve(start);

  for (;;) {
    if (existsSync(join(current, '.sddio', 'context', 'config.json'))) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

export function readConfig(root: string): Config {
  try {
    return JSON.parse(readFileSync(join(root, '.sddio', 'context', 'config.json'), 'utf8')) as Config;
  } catch {
    return {};
  }
}

function parseEntries(file: string, kind: EntryKind, text: string): Entry[] {
  const blocks = text.split(/^<!-- entry -->$/m).slice(1);

  return blocks
    .map((block) => {
      const id = /^id:\s*(\S+)\s*$/m.exec(block)?.[1];
      const title = /^##\s+(.+?)\s*$/m.exec(block)?.[1];

      if (id === undefined || title === undefined) {
        return null;
      }

      const start = block.indexOf('\n---', block.indexOf('---') + 1);
      const after = block.slice(start + 4).trim();
      const body = after.replace(/^##\s+.+?\s*$/m, '').trim();
      const refs = (block.match(/^refs:\s*\[([^\]]*)\]/m)?.[1] ?? '')
        .split(',')
        .map((ref) => ref.trim())
        .filter((ref) => ref !== '');
      const status = block.match(/^status:\s*(\S+)/m)?.[1] ?? '';

      return { id, kind, title, body, file, refs, status } satisfies Entry;
    })
    .filter((entry): entry is Entry => entry !== null);
}

/** Every entry, in collection order then file order. Unreadable files are skipped. */
export function readEntries(root: string): Entry[] {
  const entries: Entry[] = [];

  for (const { dir, kind } of COLLECTIONS) {
    const directory = join(root, WORKSPACE_ROOT, dir);

    if (!existsSync(directory)) {
      continue;
    }

    for (const name of readdirSync(directory).filter((file) => file.endsWith('.md')).sort()) {
      const file = `${WORKSPACE_ROOT}/${dir}/${name}`;

      try {
        entries.push(...parseEntries(file, kind, readFileSync(join(root, file), 'utf8')));
      } catch {
        // A collection that cannot be read is a missing collection, not a crash.
      }
    }
  }

  return entries;
}

/** Path-like tokens an entry body names: `packages/cli/lib/init.ts`, `init.ts`, `lib/`. */
export function pathsIn(body: string): string[] {
  const tokens = body.match(/[\w./-]*[A-Za-z0-9_-]+\.[A-Za-z0-9]+|\b[\w.-]+\/[\w./-]+/g) ?? [];

  return [...new Set(tokens.map((token) => token.replace(/[.,;:)]+$/, '')))].filter(
    (token) => token.includes('.') || token.includes('/'),
  );
}

/** Does `entry` name `target`? Full path, basename, or a directory prefix of it. */
export function entryNames(entry: Entry, target: string): boolean {
  const clean = target.replace(/^\.\//, '');

  return pathsIn(entry.body).some((token) => {
    if (clean === token || clean.endsWith(`/${token}`) || token.endsWith(`/${clean}`)) {
      return true;
    }

    return token.endsWith('/') && clean.startsWith(token);
  });
}
