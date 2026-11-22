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
  '   `config.json` has no baseline yet, so the cursor is `unknown`.',
  '2. Bootstrap as described in `instructions/bootstrap.md`, but do not describe the',
  '   code back to me. Record only what the repository cannot say: a reversed',
  '   decision and why, an outside constraint and its deadline, an abandoned path.',
  '   At most six SPEC entries, each ending with `Not in the code:`.',
  '3. Ask me up to three questions whose answers would change future work, and',
  '   record at least one DISCUSSION (SPEC-016) for what stays open.',
  '',
  'Report what you recorded, then set `reconcileCursor.lastProcessedCommit` in',
  '`.sddio/context/config.json` to `HEAD` and commit it with the entries.',
  'Amending that commit is safe: the baseline is recomputed from history each run.',
  '',
  'Then answer this: <your first task>',
].join('\n');

export const RECONCILE_PROMPT = [
  'Read `.sddio/context/instructions.md` and follow it.',
  '',
  'The sddio context layer in `.sddio/` was just replaced by a package upgrade.',
  'The cursor was kept, so nothing is stale merely because of the upgrade.',
  '',
  'If the new rules change what an existing entry is allowed to say, fix that',
  'entry only. Do not rescan the repository, and do not rewrite entries that are',
  'still accurate.',
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
