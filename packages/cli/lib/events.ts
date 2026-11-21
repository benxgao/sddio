/**
 * Local observation log (contract 12).
 *
 * One JSON object per command call, appended to `.sddio/evals/events.jsonl`.
 * The file is gitignored, never leaves the machine, and nothing reads it to do
 * work — deleting it costs history and nothing else.
 *
 * Recording must never change what a command does. Every failure in here is
 * swallowed: an observation that can break a command is worse than a missing
 * observation.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface EventOutput {
  lines: number;
  bytes: number;
  ids: string[];
}

export interface SddioEvent {
  cmd: string;
  args?: Record<string, unknown>;
  cursor?: string;
  out?: EventOutput;
  exit?: number;
  ms?: number;
}

export function eventsPath(root: string): string {
  return join(root, '.sddio', 'evals', 'events.jsonl');
}

export function recordEvent(root: string, version: string, event: SddioEvent): void {
  if (process.env.SDDIO_NO_EVENTS === '1') {
    return;
  }

  try {
    const path = eventsPath(root);
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify({ ts: new Date().toISOString(), v: version, ...event })}\n`, 'utf8');
  } catch {
    // Silent by design; see the header.
  }
}

/** Measure an output before it is printed, so the log and the screen agree. */
export function measure(text: string, ids: string[]): EventOutput {
  return {
    lines: text.split('\n').length - (text.endsWith('\n') ? 1 : 0),
    bytes: Buffer.byteLength(text, 'utf8'),
    ids,
  };
}
