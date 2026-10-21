/**
 * `sddio init` — copy the shipped templates into a project.
 *
 * Ownership rules (ADR-001, SPEC-003):
 * - `.sddio/` is package-owned and may be overwritten.
 * - `sddio_workspace/` is user-owned and never overwritten unless `--force`.
 *
 * Directories are created explicitly rather than being carried by template
 * files: empty directories cannot survive `npm pack` (DISC-030).
 */

import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { ensureAgentsSnippet } from './agents.js';
import { templatesRoot } from './paths.js';

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

const REQUIRED_DIRS = [
  '.sddio',
  'sddio_workspace',
  'sddio_workspace/spec',
  'sddio_workspace/adr',
  'sddio_workspace/discussions',
  'sddio_workspace/flow',
  'sddio_workspace/flow/active',
  'sddio_workspace/flow/completed',
  'sddio_workspace/flow/reconciliation',
];

function toSegments(relativePath: string): string[] {
  return relativePath.split('/');
}

async function listTemplateFiles(root: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(join(root, ...toSegments(prefix)), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await listTemplateFiles(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

function isWorkspaceOwned(relativePath: string): boolean {
  return relativePath === 'sddio_workspace' || relativePath.startsWith('sddio_workspace/');
}

export async function runInit(options: InitOptions): Promise<InitResult> {
  const target = resolve(options.cwd);
  const dryRun = options.dryRun === true;
  const result: InitResult = { target, dryRun, created: [], skipped: [], overwritten: [], errors: [] };

  if (!existsSync(templatesRoot)) {
    throw new Error(`Templates are missing from the package: ${templatesRoot}`);
  }

  for (const directory of REQUIRED_DIRS) {
    if (!dryRun) {
      await mkdir(join(target, ...toSegments(directory)), { recursive: true });
    }
  }

  for (const relativePath of await listTemplateFiles(templatesRoot)) {
    const source = join(templatesRoot, ...toSegments(relativePath));
    const destination = join(target, ...toSegments(relativePath));
    const mayOverwrite = options.force === true || !isWorkspaceOwned(relativePath);
    const exists = existsSync(destination);

    if (exists && !mayOverwrite) {
      result.skipped.push(relativePath);
      continue;
    }

    try {
      if (exists && (await readFile(destination)).equals(await readFile(source))) {
        result.skipped.push(relativePath);
        continue;
      }

      if (!dryRun) {
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
      }

      (exists ? result.overwritten : result.created).push(relativePath);
    } catch (error) {
      result.errors.push(`${relativePath}: ${(error as Error).message}`);
    }
  }

  const agentsPath = join(target, 'AGENTS.md');
  const existingAgents = existsSync(agentsPath) ? await readFile(agentsPath, 'utf8') : null;
  const snippet = ensureAgentsSnippet(existingAgents);

  if (!snippet.changed) {
    result.skipped.push('AGENTS.md');
  } else {
    try {
      if (!dryRun) {
        await writeFile(agentsPath, snippet.content, 'utf8');
      }

      (existingAgents === null ? result.created : result.overwritten).push('AGENTS.md');
    } catch (error) {
      result.errors.push(`AGENTS.md: ${(error as Error).message}`);
    }
  }

  return result;
}
