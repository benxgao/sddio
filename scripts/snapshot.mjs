#!/usr/bin/env node

/**
 * One screen, three ledgers (P9).
 *
 *   git     what the repository already records
 *   events  what sddio was asked to do, from .sddio/evals/events.jsonl
 *   usage   what a later task actually used, from flow-trail/usage.md
 *
 * A missing ledger prints `n/a`. It never prints a zero, because a zero and an
 * absence mean different things and only one of them is evidence.
 *
 *   node scripts/snapshot.mjs [--json]
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

function history() {
  try {
    return JSON.parse(
      execFileSync(process.execPath, [join(root, 'scripts/history.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
  } catch {
    return null;
  }
}

function events() {
  const path = join(root, '.sddio/evals/events.jsonl');

  if (!existsSync(path)) {
    return null;
  }

  const rows = readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((row) => row !== null);

  const byCommand = {};
  for (const row of rows) {
    byCommand[row.cmd] = (byCommand[row.cmd] ?? 0) + 1;
  }

  const bytes = rows.map((row) => row.out?.bytes ?? 0).filter((size) => size > 0);
  const lines = rows.map((row) => row.out?.lines ?? 0).filter((size) => size > 0);

  return {
    calls: rows.length,
    byCommand,
    medianBytes: bytes.length === 0 ? null : bytes.sort((a, b) => a - b)[Math.floor(bytes.length / 2)],
    medianLines: lines.length === 0 ? null : lines.sort((a, b) => a - b)[Math.floor(lines.length / 2)],
    last: rows.at(-1)?.ts ?? null,
  };
}

function usage() {
  const path = join(root, 'flow-trail/usage.md');

  if (!existsSync(path)) {
    return null;
  }

  const rows = readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => /^\| \d{4}-\d{2}-\d{2} \|/.test(line))
    .map((line) => line.split('|').map((cell) => cell.trim()));

  const kind = {};
  const via = {};
  for (const cells of rows) {
    kind[cells[4]] = (kind[cells[4]] ?? 0) + 1;
    via[cells[5]] = (via[cells[5]] ?? 0) + 1;
  }

  return { rows: rows.length, kind, via };
}

const git = history();
const log = events();
const use = usage();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ git, events: log, usage: use }, null, 2));
} else {
  const pad = (label) => label.padEnd(9);
  const na = 'n/a';

  console.log(`sddio snapshot ${new Date().toISOString().slice(0, 10)}\n`);

  console.log(
    `  ${pad('git')}lag ${git?.lag.median ?? na} (${git?.lag.paired ?? na}/${git?.codeCommits ?? na})` +
      `  unowned ${git?.unowned ?? na}/${git?.hotFiles ?? na}` +
      `  entries ${git?.entries ?? na}  churn ${git?.rewrite.ratio ?? na}%`,
  );

  console.log(
    `  ${pad('events')}calls ${log?.calls ?? na}` +
      `  bytes/median ${log?.medianBytes ?? na}  lines/median ${log?.medianLines ?? na}` +
      `  last ${log?.last ?? na}`,
  );

  const via = use === null ? na : Object.entries(use.via).map(([key, count]) => `${key}:${count}`).join(' ') || 'none';
  console.log(`  ${pad('usage')}rows ${use?.rows ?? na}  via ${via}`);

  if (log !== null) {
    console.log(`  ${pad('')}${Object.entries(log.byCommand).map(([key, count]) => `${key}:${count}`).join(' ')}`);
  }

  console.log('\n  anchors that decide anything: lag, unowned, calls, median bytes, usage rows.');
  console.log('  An anchor with no data is `n/a`, not zero — silence and absence are different.');
}
