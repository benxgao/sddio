/**
 * `sddio_workspace/` layout (SPEC-002, ADR-005).
 *
 * The workspace is user-owned, so init reproduces the layout and nothing else:
 * the directories plus empty seed files. Seeds ship empty on purpose — they
 * are the user's project, not ours, and placeholder prose is immediately
 * rewritten anyway.
 *
 * Empty directories cannot travel through `npm pack`, so the layout is
 * declared here instead of being carried by the tarball.
 */

export const WORKSPACE_ROOT = 'sddio_workspace';

/** Created unconditionally, including the empty ones a template cannot carry. */
export const WORKSPACE_DIRS = [
  WORKSPACE_ROOT,
  `${WORKSPACE_ROOT}/spec`,
  `${WORKSPACE_ROOT}/adr`,
  `${WORKSPACE_ROOT}/discussions`,
  `${WORKSPACE_ROOT}/flow`,
  `${WORKSPACE_ROOT}/flow/active`,
  `${WORKSPACE_ROOT}/flow/completed`,
  `${WORKSPACE_ROOT}/flow/reconciliation`,
];

/** Entry home files (ADR-004: FLOW files are slug-named, not numbered). */
export const WORKSPACE_SEEDS = [
  `${WORKSPACE_ROOT}/spec/spec_100.md`,
  `${WORKSPACE_ROOT}/adr/adr_100.md`,
  `${WORKSPACE_ROOT}/discussions/discussions_100.md`,
  `${WORKSPACE_ROOT}/flow/active/template.md`,
];
