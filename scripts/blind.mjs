#!/usr/bin/env node

/**
 * The blind run's measuring stick (9.3).
 *
 * Reads this machine's agent traces — never the workspace — and reports, per
 * session: how many tool calls happened before the first Edit, whether an sddio
 * command was called, and how many tokens the session burned.
 *
 *   node scripts/blind.mjs --since 2026-11-21T02:00 --match sddio
 *
 * Reading traces is tool-specific and local; it is the only source that records
 * what the agent actually did rather than what we hoped it would do.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TRACES = join(homedir(), '.workbuddy-ai/traces');

function flag(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const since = Date.parse(flag('since', '1970-01-01T00:00:00Z'));
const match = flag('match', '');

function files() {
  if (!existsSync(TRACES)) {
    return [];
  }

  return readdirSync(TRACES)
    .flatMap((directory) => {
      const folder = join(TRACES, directory);
      if (!statSync(folder).isDirectory()) return [];
      return readdirSync(folder)
        .filter((name) => name.endsWith('.json') || name.endsWith('.jsonl'))
        .map((name) => join(folder, name));
    })
    .filter((path) => statSync(path).size < 40 * 1024 * 1024);
}

/**
 * Two on-disk shapes: a single JSON object, or a JSONL stream of
 * `trace_start` / `span_start` / `span_end` records written while a session runs.
 */
function load(path) {
  const text = readFileSync(path, 'utf8');

  if (path.endsWith('.json')) {
    return JSON.parse(text);
  }

  const trace = { trace: null, spans: [] };

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;

    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    if (record.type === 'trace_start') trace.trace = record.trace;
    if (record.type === 'span_end') trace.spans.push(record.span);
  }

  return trace;
}

function summarise(path) {
  let trace;
  try {
    trace = load(path);
  } catch {
    return null;
  }

  if (trace.trace === null) return null;

  const started = Date.parse(trace.trace?.startedAt ?? '');
  if (Number.isNaN(started) || started < since) return null;

  const spans = trace.spans ?? [];
  const tools = spans.filter((span) => span.type === 'function' && span.toolName);

  if (match !== '') {
    const touched = tools.some((span) => `${span.toolInput ?? ''}${span.toolOutput ?? ''}`.includes(match));
    if (!touched) return null;
  }

  const firstEdit = tools.findIndex((span) => span.toolName === 'Edit' || span.toolName === 'Write');
  const sddio = tools.filter((span) => /sddio (start|brief|check|diff|show)/.test(span.toolInput ?? ''));

  return {
    file: path.split('/').slice(-1)[0].replace(/^trace_/, '').slice(0, 12),
    started: trace.trace?.startedAt ?? '',
    toolCalls: tools.length,
    beforeEdit: firstEdit === -1 ? tools.length : firstEdit,
    sddioCalls: sddio.length,
    tokens: trace.trace?.totalTokens || null,
  };
}

const rows = files()
  .map(summarise)
  .filter((row) => row !== null)
  .sort((a, b) => a.started.localeCompare(b.started));

if (rows.length === 0) {
  console.log('no sessions found — check --since and --match');
  process.exit(0);
}

const pad = (value, width) => String(value).padEnd(width);

console.log(`${pad('session', 14)}${pad('started', 22)}${pad('tools', 7)}${pad('before-edit', 13)}${pad('sddio', 7)}tokens`);
for (const row of rows) {
  console.log(
    `${pad(row.file, 14)}${pad(row.started.slice(0, 19), 22)}${pad(row.toolCalls, 7)}${pad(row.beforeEdit, 13)}${pad(
      row.sddioCalls,
      7,
    )}${row.tokens ?? 'n/a'}`,
  );
}

console.log('\nbefore-edit = tool calls before the first Edit/Write. Lower is not better on its own:');
console.log('a session that edits sooner may also have re-proposed a decision the workspace already records.');
