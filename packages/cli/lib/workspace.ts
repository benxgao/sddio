/**
 * `sddio_docs/` layout (ADR-001, ADR-005).
 *
 * The workspace is user-owned, so init reproduces the layout and nothing else:
 * the directories plus empty seed files. Seeds ship empty on purpose — they
 * are the user's project, not ours, and placeholder prose is immediately
 * rewritten anyway.
 *
 * Empty directories cannot travel through `npm pack`, so the layout is
 * declared here instead of being carried by the tarball.
 */

export const WORKSPACE_ROOT = 'sddio_docs';

/** Created unconditionally, including the empty ones a template cannot carry. */
export const WORKSPACE_DIRS = [
  WORKSPACE_ROOT,
  `${WORKSPACE_ROOT}/spec`,
  `${WORKSPACE_ROOT}/adr`,
  `${WORKSPACE_ROOT}/discussions`,
];

/** Entry home files: one numbered collection per artifact type (ADR-004). */
export const WORKSPACE_SEEDS = [
  `${WORKSPACE_ROOT}/spec/spec_100.md`,
  `${WORKSPACE_ROOT}/adr/adr_100.md`,
  `${WORKSPACE_ROOT}/discussions/discussions_100.md`,
];

/**
 * `.sddio/.gitignore` — the one file the context layer needs that npm will never
 * pack, because `.gitignore` is on npm's unconditional ignore list. Declared here
 * for the reason the empty directories are (ADR-005): a tarball cannot carry it.
 *
 * The repository's own `.sddio/.gitignore` holds the same bytes, and a test keeps
 * the two identical; that copy is what keeps this checkout clean without running
 * the installer.
 */
export const CONTEXT_IGNORE = '.gitignore';

export const CONTEXT_IGNORE_BODY = `# sddio's own observation log: local, private, deletable. Digests are copied into
# a card's findings.md when a number is worth sharing; the raw log never is.
evals/
`;
