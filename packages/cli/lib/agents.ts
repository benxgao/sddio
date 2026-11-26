/**
 * AGENTS.md registration (SPEC-004).
 *
 * The snippet is delimited so registration is detectable, idempotent and
 * updatable: a changed snippet replaces the existing block instead of being
 * appended a second time.
 */

export const AGENTS_BEGIN = '<!-- sddio:begin -->';
export const AGENTS_END = '<!-- sddio:end -->';

/**
 * The command carries the version (ADR-017).
 *
 * Nothing else in a project records which release scaffolded it, so this line
 * does: `npx` runs the version named here instead of whatever `latest` is today,
 * and upgrading means regenerating this block. Unscoped `npx sddio` would name a
 * package that does not exist, and a bare `npx @sddio/cli` would move under the
 * project's feet, which is what a lockfile exists to prevent.
 */
export function agentsSnippet(version: string): string {
  return [
    AGENTS_BEGIN,
    'This project uses sddio: the repository keeps what the code cannot say.',
    `Run \`npx -y @sddio/cli@${version} start\` before changing code — it prints the entries that constrain this work.`,
    'Read only what it names. No command? Read `.sddio/context/instructions.md` instead.',
    AGENTS_END,
  ].join('\n');
}

export interface SnippetResult {
  content: string;
  changed: boolean;
}

export function ensureAgentsSnippet(existing: string | null, version: string): SnippetResult {
  const snippet = agentsSnippet(version);

  if (existing === null || existing.trim() === '') {
    return { content: `${snippet}\n`, changed: true };
  }

  const start = existing.indexOf(AGENTS_BEGIN);

  if (start === -1) {
    return { content: `${existing.trimEnd()}\n\n${snippet}\n`, changed: true };
  }

  const end = existing.indexOf(AGENTS_END, start);

  if (end === -1) {
    return { content: `${existing.trimEnd()}\n\n${snippet}\n`, changed: true };
  }

  const block = existing.slice(start, end + AGENTS_END.length);

  if (block === snippet) {
    return { content: existing, changed: false };
  }

  const content = existing.slice(0, start) + snippet + existing.slice(end + AGENTS_END.length);

  return { content, changed: true };
}
