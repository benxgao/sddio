#!/usr/bin/env node

/**
 * The git half of the observation ledger (P0).
 *
 * Reads only what the repository already records, so it runs before any command
 * exists and produces the same numbers every time. Four anchors:
 *
 *   reconcile lag   commits of code between a change and the entry that explains it
 *   unowned files   hot files no entry names
 *   churn           share of knowledge lines ever removed, legitimate deletions included
 *   superseded      decisions that were replaced, not corrected
 *
 *   node scripts/history.mjs [--json]
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
process.chdir(root);

const sh = (command) =>
  execSync(command, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).trim();

const WINDOW = 10;
const HOT = 3;

function commits() {
  const lines = sh(`git log --no-merges --format='%H|%cs' --name-only`).split('\n');
  const out = [];
  let current = null;

  for (const line of lines) {
    if (/^[0-9a-f]{40}\|/.test(line)) {
      const [hash, date] = line.split('|');
      current = { hash, date, files: [] };
      out.push(current);
    } else if (line !== '' && current !== null) {
      current.files.push(line);
    }
  }

  return out;
}

const isKnowledge = (file) => file.startsWith('sddio_workspace/');
const isCodeFile = (file) =>
  /^(packages|docs|scripts|\.sddio|\.github)\//.test(file) || /^[A-Z][A-Za-z.-]*\.md$/.test(file);

function entryText() {
  const text = [];

  for (const collection of ['spec', 'adr', 'discussions']) {
    const directory = join(root, 'sddio_workspace', collection);

    if (!existsSync(directory)) {
      continue;
    }

    for (const name of readdirSync(directory).filter((file) => file.endsWith('.md'))) {
      text.push(readFileSync(join(directory, name), 'utf8'));
    }
  }

  return text.join('\n');
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

const log = commits();
const code = log.filter((commit) => commit.files.some(isCodeFile));
const knowledge = log.filter((commit) => commit.files.some(isKnowledge));

const lags = [];
for (let index = 0; index < log.length; index += 1) {
  if (!log[index].files.some(isCodeFile)) {
    continue;
  }

  let lag = null;

  for (let ahead = 1; ahead <= WINDOW && index + ahead < log.length; ahead += 1) {
    if (log[index + ahead].files.some(isKnowledge)) {
      lag = ahead;
      break;
    }
  }

  lags.push(lag);
}

const paired = lags.filter((lag) => lag !== null);
const distribution = paired.reduce((counts, lag) => {
  counts[lag] = (counts[lag] ?? 0) + 1;
  return counts;
}, {});

const entries = entryText();
const touches = new Map();
for (const commit of log) {
  for (const file of commit.files.filter(isCodeFile)) {
    touches.set(file, (touches.get(file) ?? 0) + 1);
  }
}

const hot = [...touches.entries()].filter(([, count]) => count >= HOT).sort((a, b) => b[1] - a[1]);
const unowned = hot.filter(([file]) => {
  const base = file.split('/').pop();
  return !entries.includes(file) && !entries.includes(base);
});

const numstat = sh(`git log --no-merges --numstat --format= -- sddio_workspace`).split('\n');
let added = 0;
let removed = 0;
for (const line of numstat) {
  const [plus, minus] = line.split('\t');
  if (/^\d+$/.test(plus ?? '')) added += Number(plus);
  if (/^\d+$/.test(minus ?? '')) removed += Number(minus);
}

const entryCount = (entries.match(/^id: /gm) ?? []).length;
const superseded = (entries.match(/^status: superseded$/gm) ?? []).length;

const report = {
  date: new Date().toISOString().slice(0, 10),
  commits: log.length,
  codeCommits: code.length,
  knowledgeCommits: knowledge.length,
  lag: {
    median: median(paired),
    paired: paired.length,
    never: lags.length - paired.length,
    window: WINDOW,
    distribution,
  },
  hotFiles: hot.length,
  unowned: unowned.length,
  unownedTop: unowned.slice(0, 5).map(([file, count]) => ({ file, count })),
  entries: entryCount,
  superseded,
  rewrite: { added, removed, ratio: added === 0 ? 0 : Math.round((removed / added) * 100) },
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const pad = (label) => label.padEnd(22);
  console.log(`sddio history ${report.date}\n`);
  console.log(`  ${pad('commits')}${report.commits} (${report.codeCommits} code, ${report.knowledgeCommits} knowledge)`);
  console.log(
    `  ${pad('reconcile lag')}median ${report.lag.median ?? 'n/a'} — ${report.lag.paired} paired, ${report.lag.never} never within ${WINDOW}`,
  );
  console.log(`  ${pad('lag distribution')}${Object.entries(distribution).map(([k, v]) => `${k}:${v}`).join(' ') || 'none'}`);
  console.log(`  ${pad(`hot files (>=${HOT})`)}${report.hotFiles}, unowned ${report.unowned} (${Math.round((report.unowned / (report.hotFiles || 1)) * 100)}%)`);

  for (const { file, count } of report.unownedTop) {
    console.log(`  ${pad('')}${count}x ${file}`);
  }

  console.log(`  ${pad('entries')}${report.entries}, superseded ${report.superseded}`);
  console.log(`  ${pad('knowledge churn')}${report.rewrite.removed} of ${report.rewrite.added} lines removed (${report.rewrite.ratio}%)`);
}
