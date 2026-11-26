/**
 * Resolve the package root and template location.
 *
 * Templates ship inside the published tarball, so they are always resolved
 * relative to the package artefact — never to the consumer's repository
 * (ADR-003). The executing file lives in `dist/`, which carries no
 * `package.json`, so the root is found by walking up.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function findPackageRoot(start: string): string {
  let current = start;

  for (;;) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      return start;
    }

    current = parent;
  }
}

export const packageRoot = findPackageRoot(here);

/**
 * The release this copy belongs to.
 *
 * One read, because three things must agree: `--version`, the event log, and the
 * command written into `AGENTS.md` (ADR-017). That command is the only record of
 * which release a project was scaffolded with, so it cannot be typed by hand.
 */
export const version = (JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
  version: string;
}).version;

/**
 * `templates/.sddio` — the context layer, generated at build time from the
 * repository root `.sddio/` (ADR-005).
 */
export const contextTemplateRoot = join(packageRoot, 'templates', '.sddio');
