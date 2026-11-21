/**
 * AGENTS.md registration (SPEC-004).
 *
 * The snippet is delimited so registration is detectable, idempotent and
 * updatable: a changed snippet replaces the existing block instead of being
 * appended a second time.
 */

export const AGENTS_BEGIN = '<!-- sddio:begin -->';
export const AGENTS_END = '<!-- sddio:end -->';

export const AGENTS_SNIPPET = [
  AGENTS_BEGIN,
  'This project uses sddio: the repository keeps what the code cannot say.',
  'Run `npx sddio start` before changing code — it prints the entries that constrain this work.',
  'Read only what it names. No command? Read `.sddio/context/instructions.md` instead.',
  AGENTS_END,
].join('\n');

export interface SnippetResult {
  content: string;
  changed: boolean;
}

export function ensureAgentsSnippet(existing: string | null): SnippetResult {
  if (existing === null || existing.trim() === '') {
    return { content: `${AGENTS_SNIPPET}\n`, changed: true };
  }

  const start = existing.indexOf(AGENTS_BEGIN);

  if (start === -1) {
    return { content: `${existing.trimEnd()}\n\n${AGENTS_SNIPPET}\n`, changed: true };
  }

  const end = existing.indexOf(AGENTS_END, start);

  if (end === -1) {
    return { content: `${existing.trimEnd()}\n\n${AGENTS_SNIPPET}\n`, changed: true };
  }

  const block = existing.slice(start, end + AGENTS_END.length);

  if (block === AGENTS_SNIPPET) {
    return { content: existing, changed: false };
  }

  const content = existing.slice(0, start) + AGENTS_SNIPPET + existing.slice(end + AGENTS_END.length);

  return { content, changed: true };
}
