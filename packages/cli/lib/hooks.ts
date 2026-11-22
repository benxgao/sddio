/**
 * Hook selection (SPEC-018).
 *
 * A hook decides when sddio is told to reconcile; sddio never calls one. `init`
 * records the choice in `config.json` and, for `flow-trail`, runs the same
 * bootstrap this repository uses — the integration is dogfooded or it is not
 * tested at all.
 *
 * Only `flow-trail` is offered today, and it is never the default: installing it
 * fetches and runs a script from the network, which a first run must not do
 * unasked (SPEC-018). The list exists so a second hook is a row rather than a
 * branch, and so the declared shape (`id`, `kind`, `events`) matches what is
 * actually consumed.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** What `config.json` records: identity, who owns the wiring, and the moments covered. */
export interface HookDeclaration {
  id: string;
  kind: 'external' | 'managed';
  events: string[];
}

export interface HookDefinition extends HookDeclaration {
  summary: string;
}

export const HOOKS: HookDefinition[] = [
  {
    id: 'flow-trail',
    kind: 'external',
    events: ['knowledge.reconcile'],
    summary: 'a board of folders in git; calls sddio when a card closes',
  },
];

export const DEFAULT_HOOK = 'none';

/** The paste block flow-trail publishes; kept verbatim so both routes install the same thing. */
export const FLOW_TRAIL_BOOTSTRAP =
  'bash -c "$(curl -fsSL https://raw.githubusercontent.com/benxgao/flow-trail/HEAD/scripts/bootstrap.sh)"';

export function hookEntry(id: string): HookDefinition {
  const hook = HOOKS.find((candidate) => candidate.id === id);

  if (hook === undefined) {
    throw new Error(`Unknown hook: ${id}. Known hooks: ${HOOKS.map((h) => h.id).join(', ')}, none`);
  }

  return hook;
}

export function declarationsFor(id: string): HookDeclaration[] {
  if (id === 'none') {
    return [];
  }

  const { id: hookId, kind, events } = hookEntry(id);

  return [{ id: hookId, kind, events }];
}

export interface InstallResult {
  ok: boolean;
  message: string;
}

/**
 * Has this project already answered? An empty array is an answer — "none" —
 * so the presence of the key decides, not its length.
 */
export function hasDeclaredHooks(cwd: string): boolean {
  try {
    const config = JSON.parse(
      readFileSync(join(cwd, '.sddio', 'context', 'config.json'), 'utf8'),
    ) as { hooks?: unknown };

    return Array.isArray(config.hooks);
  } catch {
    return false;
  }
}

/**
 * Runs the hook's own installer in the target project. `stdio: inherit` is
 * deliberate: the bootstrap prints every path it touches, and hiding that
 * behind a spinner would leave the user guessing what landed in their repo.
 */
export function installFlowTrail(cwd: string): InstallResult {
  const result = spawnSync('bash', ['-c', FLOW_TRAIL_BOOTSTRAP], { cwd, stdio: 'inherit' });

  if (result.error !== undefined) {
    return { ok: false, message: (result.error as Error).message };
  }

  if (result.status !== 0) {
    return { ok: false, message: `installer exited with ${String(result.status)}` };
  }

  return { ok: true, message: 'flow-trail installed' };
}
