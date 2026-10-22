/**
 * The sddio agent skill (ADR-008).
 *
 * The skill ships inside the package as `.sddio/skill/SKILL.md`, generated at
 * build time with the rest of the context layer. The CLI only reads it: nothing
 * is written into an agent's skills directory, because that would mean editing
 * files outside the repository with no reliable way to undo it.
 *
 * It is a router. It names paths and invariants, never the rules themselves, so
 * it keeps working when `.sddio/` is upgraded underneath it.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { contextTemplateRoot } from './paths.js';

export const skillPath = join(contextTemplateRoot, 'skill', 'SKILL.md');

export async function readSkill(): Promise<string> {
  return readFile(skillPath, 'utf8');
}
