#!/usr/bin/env node

/**
 * Twelve questions, two retrievers, one delta (P9).
 *
 *   node scripts/eval.mjs
 *
 * `grep` is what an agent does today: every entry whose body contains a question
 * keyword, ranked by how many keywords it hits. `brief` is the index behind
 * `sddio brief`: the same entries, weighted toward the title, top three.
 *
 * If the two rates are the same, the CLI is a wrapper and the card should stop.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readEntries } from '../packages/cli/dist/repo.js';

const root = dirname(fileURLToPath(new URL('.', import.meta.url)));
const raw = readFileSync(join(root, 'evals/questions.md'), 'utf8');

const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'it', 'its',
  'why', 'does', 'do', 'be', 'with', 'into', 'than', 'that', 'this', 'instead', 'one', 'not',
]);

const questions = raw
  .split('\n')
  .filter((line) => line.startsWith('- ') && line.includes('→'))
  .map((line) => {
    const [question, answer] = line.replace(/^-\s*/, '').split('→');
    return { question: question.trim(), expected: answer.trim() };
  });

const entries = readEntries(root);

function words(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function score(entry, keywords, weightTitle) {
  const title = entry.title.toLowerCase();
  const body = entry.body.toLowerCase();

  return keywords.reduce((total, keyword) => {
    const inTitle = title.includes(keyword);
    const inBody = body.includes(keyword);

    return total + (inTitle ? (weightTitle ? 3 : 1) : 0) + (inBody ? 1 : 0);
  }, 0);
}

function hitRate(weightTitle) {
  let hits = 0;

  for (const { question, expected } of questions) {
    const keywords = words(question);
    const ranked = entries
      .map((entry) => ({ entry, score: score(entry, keywords, weightTitle) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (ranked.some((row) => row.entry.id === expected)) {
      hits += 1;
    }
  }

  return { hits, total: questions.length };
}

const grep = hitRate(false);
const brief = hitRate(true);
const percent = (rate) => `${Math.round((rate.hits / rate.total) * 100)}%`;

console.log(`questions ${questions.length}`);
console.log(`grep  top-3 ${grep.hits}/${grep.total} (${percent(grep)})`);
console.log(`brief top-3 ${brief.hits}/${brief.total} (${percent(brief)})`);
console.log(`delta ${brief.hits - grep.hits} question(s)`);

if (brief.hits <= grep.hits) {
  console.log('\nthe two retrievers agree — brief earns nothing yet, say so in findings.md');
}
