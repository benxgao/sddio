/**
 * What `init` leaves the user with.
 *
 * The file list is not the useful output — the next action is. `init` cannot
 * perform it (the agent has to read and classify), so it hands over a prompt
 * meant to be pasted verbatim into whatever coding agent is in use.
 *
 * Three outcomes, because the right next step differs:
 * - `bootstrap` — this run created files, so the workspace is new.
 * - `reconcile` — only `.sddio/` changed, i.e. an upgrade; knowledge may be stale.
 * - `current` — nothing changed, so there is nothing to ask the agent to do.
 */

const RULE = '─'.repeat(64);

export const BOOTSTRAP_PROMPT = [
  'Read `.sddio/context/instructions.md` and follow it.',
  '',
  'This project has just been initialised with sddio. Before any other work:',
  '',
  '1. Run the commit check in `.sddio/context/instructions/reconciliation.md`.',
  '   `config.json` has no baseline yet, so the state is `unknown`.',
  '2. Bootstrap as described in `instructions/bootstrap.md`, but do not describe the',
  '   code back to me. Record only what the repository cannot say: a reversed',
  '   decision and why, an outside constraint and its deadline, an abandoned path.',
  '   At most six SPEC entries, each ending with `Not in the code:`.',
  '3. Ask me up to three questions whose answers would change future work, and',
  '   record at least one DISCUSSION (SPEC-016) for what stays open.',
  '4. Report what you recorded, then set `reconcileCursor.lastProcessedCommit` to',
  '   `HEAD` and `reconcileCursor.previousCommit` to `HEAD^` in',
  '   `.sddio/context/config.json` (`null` at a root commit).',
  '',
  'Then answer this: <your first task>',
].join('\n');

export const RECONCILE_PROMPT = [
  'Read `.sddio/context/instructions.md` and follow it.',
  '',
  'The sddio context layer in `.sddio/` was just refreshed by a package upgrade,',
  'and `config.json` now carries no baseline (`null`). Before any other work, run',
  'the commit check and reconcile: `.sddio/context/instructions/reconciliation.md`.',
  '',
  'The cursor state is `unknown`, so there is no range to diff: verify the existing',
  'artifacts against the current implementation. Do not rescan unrelated areas, and',
  'do not rewrite artifacts that are still accurate.',
  '',
  'Report what you understood and what you changed, then set',
  '`reconcileCursor.lastProcessedCommit` to `HEAD` and `reconcileCursor.previousCommit`',
  'to `HEAD^` in `.sddio/context/config.json` (`null` at a root commit), so the next',
  'session resumes from a baseline.',
  '',
  'Then answer this: <your first task>',
].join('\n');

export type NextStep = 'bootstrap' | 'reconcile' | 'current';

export function selectNextStep(created: number, overwritten: number): NextStep {
  if (created > 0) {
    return 'bootstrap';
  }

  return overwritten > 0 ? 'reconcile' : 'current';
}

export function renderNextStep(step: NextStep): string {
  if (step === 'current') {
    return 'Already up to date. Nothing to hand to your agent until the next change.';
  }

  const prompt = step === 'bootstrap' ? BOOTSTRAP_PROMPT : RECONCILE_PROMPT;

  return [RULE, 'Paste this into your coding agent', RULE, '', prompt].join('\n');
}
