/**
 * `sddio init` — lay down `.sddio/` and `sddio_docs/` in a project.
 *
 * Ownership rules (ADR-001, SPEC-003):
 * - `.sddio/` is package-owned: refreshed on every run, so upgrades carry the
 *   current context layer.
 * - `sddio_docs/` is user-owned: created once, never overwritten unless
 *   `--force`.
 *
 * The two roots are produced differently on purpose (ADR-005). `.sddio/` is
 * copied from the tarball. `sddio_docs/` is only a layout — directories
 * plus empty seed files — so it is built from `lib/workspace.ts` rather than
 * from template files, and empty directories survive because they are created
 * explicitly rather than carried by the package.
 */

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { ensureAgentsSnippet } from './agents.js';
import { declarationsFor, installFlowTrail, type HookDeclaration, type InstallResult } from './hooks.js';
import { contextTemplateRoot, version } from './paths.js';
import { WORKSPACE_DIRS, WORKSPACE_SEEDS } from './workspace.js';

export interface InitOptions {
  cwd: string;
  /** Re-initialise: refresh `.sddio/` and reset the `sddio_docs/` seeds to empty. */
  force?: boolean;
  /** Remove the files this version no longer ships, and nothing else. */
  prune?: boolean;
  dryRun?: boolean;
  /** A hook id, or `none`. Absent means "keep what the project already declared". */
  hook?: string;
  /** Run the hook's own installer. Off unless the user asked for it. */
  install?: boolean;
}

/** A file the project has and this version does not ship, with where its content went. */
export interface Orphan {
  path: string;
  note: string;
}

export interface InitResult {
  target: string;
  dryRun: boolean;
  created: string[];
  skipped: string[];
  overwritten: string[];
  /** Present in the project, absent from the package. Reported, then removed only by a flag. */
  orphaned: Orphan[];
  /** Whether this run actually deleted them, so the report can stop advising it. */
  orphansRemoved: boolean;
  errors: string[];
  hook: string | null;
  /** Whether this run changes what the project declares. An unchanged hook is not reinstalled. */
  hookChanged: boolean;
  install: InstallResult | null;
}

function toSegments(relativePath: string): string[] {
  return relativePath.split('/');
}

async function listFiles(root: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(join(root, ...toSegments(prefix)), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

/**
 * `config.json` is the one package-owned file that carries a user choice: the
 * hooks that call sddio, and the commit the project last reconciled against.
 * The template ships the cursor empty, but a refresh must keep what the project
 * already recorded — the cursor describes this project's history, and the
 * package knows nothing about it (ADR-013).
 */
const CONFIG_FILE = 'context/config.json';

function mergeConfig(
  existing: string | null,
  incoming: string,
  chosen: HookDeclaration[] | null,
): string {
  const template = JSON.parse(incoming) as Record<string, unknown>;

  if (existing === null) {
    return chosen === null
      ? incoming
      : `${JSON.stringify({ ...template, hooks: chosen }, null, 2)}\n`;
  }

  let previous: Record<string, unknown>;

  try {
    previous = JSON.parse(existing) as Record<string, unknown>;
  } catch {
    previous = {};
  }

  const declared = chosen ?? (Array.isArray(previous.hooks) ? previous.hooks : template.hooks);

  // The cursor is one commit, and only one. Copying the whole object would keep
  // a field the template stopped declaring, and then report the file as equal to
  // itself, so the shape a project inherits is the shape the package ships.
  const remembered = (previous.reconcileCursor ?? {}) as { lastProcessedCommit?: string | null };
  const cursor = { lastProcessedCommit: remembered.lastProcessedCommit ?? null };

  return `${JSON.stringify({ ...template, hooks: declared, reconcileCursor: cursor }, null, 2)}\n`;
}

/**
 * Files a version stopped shipping, and the one place their content still
 * belongs. Anything not listed is still reported, with no advice: the installer
 * knows what it ships, not what the user meant to keep.
 */
const SUCCESSORS: Record<string, string> = {
  'context/preferences.md': 'its lines belong in AGENTS.md or a SPEC constraint',
  'context/roadmap.md': 'a direction stays a DISCUSSION until it becomes a requirement',
  'context/README.md': 'nothing in it survived the five-artefact move; delete it',
};

/** This machine's observation log. Never shipped, never the installer's business. */
const LOCAL_ONLY = 'evals';

/**
 * What the project has and the package no longer ships.
 *
 * Structural on purpose: a version number cannot say which files the *previous*
 * release shipped, and a list of removals rots the moment it is edited in one
 * place only. The template is the answer, and the directory is the question.
 */
async function findOrphans(
  target: string,
  shipped: string[],
  remove: boolean,
  dryRun: boolean,
): Promise<Orphan[]> {
  const root = join(target, '.sddio');

  if (!existsSync(root)) {
    return [];
  }

  const expected = new Set(shipped);
  const orphaned: Orphan[] = [];

  for (const relativePath of await listFiles(root)) {
    if (expected.has(relativePath) || relativePath.split('/')[0] === LOCAL_ONLY) {
      continue;
    }

    orphaned.push({
      path: `.sddio/${relativePath}`,
      note: SUCCESSORS[relativePath] ?? 'this version does not ship it',
    });

    if (remove && !dryRun) {
      await rm(join(root, ...toSegments(relativePath)), { force: true });
    }
  }

  return orphaned;
}

/** `.sddio/` — package-owned, copied as `templates/.sddio/<path>` → `.sddio/<path>`. */
async function copyContext(
  target: string,
  dryRun: boolean,
  removeOrphans: boolean,
  chosen: HookDeclaration[] | null,
  result: InitResult,
): Promise<void> {
  const shipped = await listFiles(contextTemplateRoot);

  for (const relativePath of shipped) {
    const source = join(contextTemplateRoot, ...toSegments(relativePath));
    const destination = join(target, '.sddio', ...toSegments(relativePath));
    const exists = existsSync(destination);

    try {
      if (relativePath === CONFIG_FILE) {
        const current = exists ? await readFile(destination, 'utf8') : null;
        const merged = mergeConfig(current, await readFile(source, 'utf8'), chosen);

        if (current === merged) {
          result.skipped.push(`.sddio/${relativePath}`);
          continue;
        }

        if (!dryRun) {
          await mkdir(dirname(destination), { recursive: true });
          await writeFile(destination, merged, 'utf8');
        }

        (exists ? result.overwritten : result.created).push(`.sddio/${relativePath}`);
        continue;
      }

      if (exists && (await readFile(destination)).equals(await readFile(source))) {
        result.skipped.push(`.sddio/${relativePath}`);
        continue;
      }

      if (!dryRun) {
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
      }

      (exists ? result.overwritten : result.created).push(`.sddio/${relativePath}`);
    } catch (error) {
      result.errors.push(`.sddio/${relativePath}: ${(error as Error).message}`);
    }
  }

  result.orphaned.push(...(await findOrphans(target, shipped, removeOrphans, dryRun)));
  result.orphansRemoved = removeOrphans && !dryRun && result.orphaned.length > 0;
}

/** `sddio_docs/` — user-owned: directories plus empty seeds. */
async function seedWorkspace(
  target: string,
  options: InitOptions,
  result: InitResult,
): Promise<void> {
  const dryRun = options.dryRun === true;

  for (const directory of WORKSPACE_DIRS) {
    if (!dryRun) {
      await mkdir(join(target, ...toSegments(directory)), { recursive: true });
    }
  }

  for (const relativePath of WORKSPACE_SEEDS) {
    const destination = join(target, ...toSegments(relativePath));
    const exists = existsSync(destination);

    if (exists && options.force !== true) {
      result.skipped.push(relativePath);
      continue;
    }

    try {
      if (!dryRun) {
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, '', 'utf8');
      }

      (exists ? result.overwritten : result.created).push(relativePath);
    } catch (error) {
      result.errors.push(`${relativePath}: ${(error as Error).message}`);
    }
  }
}

async function registerAgents(target: string, dryRun: boolean, result: InitResult): Promise<void> {
  const agentsPath = join(target, 'AGENTS.md');
  const existing = existsSync(agentsPath) ? await readFile(agentsPath, 'utf8') : null;
  const snippet = ensureAgentsSnippet(existing, version);

  if (!snippet.changed) {
    result.skipped.push('AGENTS.md');
    return;
  }

  try {
    if (!dryRun) {
      await writeFile(agentsPath, snippet.content, 'utf8');
    }

    (existing === null ? result.created : result.overwritten).push('AGENTS.md');
  } catch (error) {
    result.errors.push(`AGENTS.md: ${(error as Error).message}`);
  }
}

/** What the project has recorded, or nothing when it has never answered. */
function recordedHooks(target: string): HookDeclaration[] {
  try {
    const config = JSON.parse(readFileSync(join(target, '.sddio', 'context', 'config.json'), 'utf8'));
    return Array.isArray(config.hooks) ? (config.hooks as HookDeclaration[]) : [];
  } catch {
    return [];
  }
}

function sameHooks(left: HookDeclaration[], right: HookDeclaration[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((hook, index) => {
    const other = right[index];

    if (other === undefined) {
      return false;
    }

    return (
      hook.id === other.id &&
      hook.kind === other.kind &&
      hook.events.join(',') === other.events.join(',')
    );
  });
}

export async function runInit(options: InitOptions): Promise<InitResult> {
  const target = resolve(options.cwd);
  const dryRun = options.dryRun === true;
  const chosen = options.hook === undefined ? null : declarationsFor(options.hook);
  const result: InitResult = {
    target,
    dryRun,
    created: [],
    skipped: [],
    overwritten: [],
    orphaned: [],
    orphansRemoved: false,
    errors: [],
    hook: options.hook ?? null,
    hookChanged: chosen !== null && !sameHooks(recordedHooks(target), chosen),
    install: null,
  };

  if (!existsSync(contextTemplateRoot)) {
    throw new Error(`Templates are missing from the package: ${contextTemplateRoot}`);
  }

  await copyContext(target, dryRun, options.force === true || options.prune === true, chosen, result);
  await seedWorkspace(target, options, result);
  await registerAgents(target, dryRun, result);

  // An upgrade is not a re-install. The installer runs when the project starts
  // calling something new, not because a flag was typed a second time.
  if (!dryRun && options.install === true && options.hook === 'flow-trail' && result.hookChanged) {
    result.install = installFlowTrail(target);

    if (!result.install.ok) {
      result.errors.push(`flow-trail: ${result.install.message}`);
    }
  }

  return result;
}
