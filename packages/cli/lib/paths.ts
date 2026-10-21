/**
 * Resolve the package root and template location.
 *
 * Templates ship inside the published tarball, so they are always resolved
 * relative to the package artefact — never to the consumer's repository
 * (ADR-003). The executing file lives in `dist/`, which carries no
 * `package.json`, so the root is found by walking up.
 */

import { existsSync } from 'node:fs';
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

export const templatesRoot = join(packageRoot, 'templates');
