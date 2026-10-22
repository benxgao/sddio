/**
 * `sddio init` — lay down `.sddio/` and `sddio_workspace/` in a project.
 *
 * Ownership rules (ADR-001, SPEC-003):
 * - `.sddio/` is package-owned: refreshed on every run, so upgrades carry the
 *   current context layer.
 * - `sddio_workspace/` is user-owned: created once, never overwritten unless
 *   `--force`.
 *
 * The two roots are produced differently on purpose (ADR-005). `.sddio/` is
 * copied from the tarball. `sddio_workspace/` is only a layout — directories
 * plus empty seed files — so it is built from `lib/workspace.ts` rather than
 * from template files, and empty directories survive because they are created
 * explicitly rather than carried by the package.
 */

import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { ensureAgentsSnippet } from './agents.js';
import { contextTemplateRoot } from './paths.js';
import { WORKSPACE_DIRS, WORKSPACE_SEEDS } from './workspace.js';

export interface InitOptions {
  cwd: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface InitResult {
  target: string;
  dryRun: boolean;
  created: string[];
  skipped: string[];
  overwritten: string[];
  errors: string[];
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

/** `.sddio/` — package-owned, copied as `templates/.sddio/<path>` → `.sddio/<path>`. */
async function copyContext(target: string, dryRun: boolean, result: InitResult): Promise<void> {
  for (const relativePath of await listFiles(contextTemplateRoot)) {
    const source = join(contextTemplateRoot, ...toSegments(relativePath));
    const destination = join(target, '.sddio', ...toSegments(relativePath));
    const exists = existsSync(destination);

    try {
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
}

/** `sddio_workspace/` — user-owned: directories plus empty seeds. */
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
  const snippet = ensureAgentsSnippet(existing);

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

export async function runInit(options: InitOptions): Promise<InitResult> {
  const target = resolve(options.cwd);
  const dryRun = options.dryRun === true;
  const result: InitResult = { target, dryRun, created: [], skipped: [], overwritten: [], errors: [] };

  if (!existsSync(contextTemplateRoot)) {
    throw new Error(`Templates are missing from the package: ${contextTemplateRoot}`);
  }

  await copyContext(target, dryRun, result);
  await seedWorkspace(target, options, result);
  await registerAgents(target, dryRun, result);

  return result;
}
