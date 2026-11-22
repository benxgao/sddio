#!/usr/bin/env node

/**
 * Entry point. Compiled to `dist/cli.js`, which is what `bin` points at, so
 * `npx @sddio/cli` runs prebuilt output with no build step on the consumer
 * side (ADR-002).
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

import { runInit } from './init.js';
import { DEFAULT_HOOK, hasDeclaredHooks } from './hooks.js';
import { renderBrief, renderEntry } from './brief.js';
import { inspect, renderCheck, renderDiff } from './check.js';
import { readClaims, renderClaims, runClaims } from './claims.js';
import { measure, recordEvent } from './events.js';
import { findRoot, readEntries } from './repo.js';
import { packageRoot } from './paths.js';
import { renderNextStep, selectNextStep } from './prompt.js';

const USAGE = `sddio — spec-driven development artifacts for a project

Usage:
  sddio init [--dir <path>] [--hook <name>] [--no-install] [--yes]
             [--force] [--dry-run]
  sddio brief [<path>...]
  sddio show <id>
  sddio check [--json] [--strict] [--claims]
  sddio diff [--json]
  sddio start [<path>...]
  sddio --version
  sddio --help

Commands:
  init        Copy .sddio and sddio_docs templates into the target project,
              register the sddio snippet in AGENTS.md, and record the hook that
              triggers reconciliation.
  brief       What the workspace knows about the paths in front of you. Titles
              only; use show for a body. Reads nothing else.
  show        Print one entry by ID.
  check       Is the workspace behind HEAD, and did any moved file go unrecorded.
              Prints, exits 0. --strict exits 1 when it would gate; --claims
              runs the checks a SPEC bullet carries.
  diff        The worklist: which entries name a moved file, and which files
              nobody has written about. Prints; never writes.
  start       One call for a hook: the cursor, a hint, and the brief.

Options:
  --dir <path>   Target project root (default: current directory)
  --hook <name>  Hook to declare: none (default) or flow-trail. Naming
                 flow-trail installs it unless --no-install is given.
  --no-install   Declare the hook without running its installer
  --yes          Take the default hook (none) without asking
  --force        Overwrite existing files, including sddio_docs
  --dry-run      Report what would happen without writing anything
  -h, --help     Show this help
  -v, --version  Show the version
`;

interface InitArgs {
  cwd: string;
  force: boolean;
  dryRun: boolean;
  hook?: string;
  yes: boolean;
  noInstall: boolean;
}

function readVersion(): string {
  const manifest = readFileSync(join(packageRoot, 'package.json'), 'utf8');

  return (JSON.parse(manifest) as { version: string }).version;
}

function parseInitArgs(args: string[]): InitArgs {
  const parsed: InitArgs = { cwd: process.cwd(), force: false, dryRun: false, yes: false, noInstall: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--force') {
      parsed.force = true;
    } else if (argument === '--dry-run') {
      parsed.dryRun = true;
    } else if (argument === '--yes') {
      parsed.yes = true;
    } else if (argument === '--no-install') {
      parsed.noInstall = true;
    } else if (argument === '--hook') {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error('--hook requires a name: flow-trail or none');
      }

      parsed.hook = value;
      index += 1;
    } else if (argument === '--dir') {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error('--dir requires a path');
      }

      parsed.cwd = resolve(value);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${String(argument)}`);
    }
  }

  return parsed;
}

function report(result: Awaited<ReturnType<typeof runInit>>): void {
  const label = (value: string) => value.padEnd(12);

  console.log(`sddio init ${readVersion()}${result.dryRun ? ' (dry run)' : ''}`);
  console.log(`target: ${result.target}\n`);

  for (const file of result.overwritten) {
    console.log(`  ${label('overwritten')}${file}`);
  }

  for (const file of result.created) {
    console.log(`  ${label('created')}${file}`);
  }

  for (const file of result.skipped) {
    console.log(`  ${label('skipped')}${file}`);
  }

  console.log(
    `\ncreated ${result.created.length}, overwritten ${result.overwritten.length}, skipped ${result.skipped.length}`,
  );

  if (result.hook !== null) {
    console.log(`hook: ${result.hook}${result.install === null ? ' (declared, not installed)' : ''}`);
  }

  if (result.dryRun) {
    console.log('dry run: nothing was written');
  }

  for (const error of result.errors) {
    console.error(`error: ${error}`);
  }
}

/**
 * One question, one default. The alternative is a flag nobody reads, and the
 * choice has to be written into `config.json` either way. A project that has
 * already answered is not asked again: an upgrade is not a re-interview.
 */
async function askHook(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('\nWhich hook should trigger reconciliation?');
    console.log('  1) none (default) — nothing calls sddio; you run the check yourself');
    console.log('  2) flow-trail — a card board in `flow-trail/`; installed into this project');

    const answer = (await rl.question('Choose [1]: ')).trim().toLowerCase();

    return answer === '2' || answer === 'flow-trail' ? 'flow-trail' : 'none';
  } finally {
    rl.close();
  }
}

async function commandInit(args: string[]): Promise<number> {
  const options = parseInitArgs(args);
  const alreadyDeclared = hasDeclaredHooks(options.cwd);
  const interactive =
    options.hook === undefined &&
    !options.yes &&
    !alreadyDeclared &&
    process.stdin.isTTY === true &&
    process.stdout.isTTY === true;

  if (interactive) {
    options.hook = await askHook();
  }

  // `--yes` takes the same default the question offers. On an upgrade the
  // question is not asked and the existing declaration stands, so a second
  // `--yes` does not re-download anything.
  if (options.hook === undefined && options.yes && !alreadyDeclared) {
    options.hook = DEFAULT_HOOK;
  }

  const result = await runInit({
    cwd: options.cwd,
    force: options.force,
    dryRun: options.dryRun,
    hook: options.hook,
    install: options.hook !== undefined && !options.noInstall,
  });

  report(result);

  if (result.errors.length > 0) {
    return 1;
  }

  if (result.dryRun) {
    console.log('dry run: run again without --dry-run to initialise, then paste the prompt it prints');
    return 0;
  }

  console.log(`\n${renderNextStep(selectNextStep(result.created.length, result.overwritten.length))}`);

  return 0;
}

/** Every read-side command starts here: no workspace, no output, one message. */
function workspaceRoot(): string | null {
  return findRoot(process.cwd());
}

async function commandBrief(args: string[]): Promise<number> {
  const root = workspaceRoot();

  if (root === null) {
    console.error('no .sddio/context/config.json above this directory');
    return 1;
  }

  const started = Date.now();
  const { text, ids } = renderBrief(root, args);
  process.stdout.write(text);
  recordEvent(root, readVersion(), {
    cmd: 'brief',
    args: { paths: args },
    out: measure(text, ids),
    exit: 0,
    ms: Date.now() - started,
  });

  return 0;
}

async function commandShow(args: string[]): Promise<number> {
  const root = workspaceRoot();

  if (root === null) {
    console.error('no .sddio/context/config.json above this directory');
    return 1;
  }

  const id = args[0];

  if (id === undefined) {
    throw new Error('show requires an entry ID, for example: sddio show ADR-012');
  }

  const entry = readEntries(root).find((candidate) => candidate.id.toLowerCase() === id.toLowerCase());

  if (entry === undefined) {
    console.error(`no entry with ID ${id}`);
    return 1;
  }

  const started = Date.now();
  const text = renderEntry(entry);
  process.stdout.write(text);
  recordEvent(root, readVersion(), {
    cmd: 'show',
    args: { id: entry.id },
    out: measure(text, [entry.id]),
    exit: 0,
    ms: Date.now() - started,
  });

  return 0;
}

async function commandCheck(args: string[]): Promise<number> {
  const root = workspaceRoot();

  if (root === null) {
    console.error('no .sddio/context/config.json above this directory');
    return 1;
  }

  const started = Date.now();
  const report = inspect(root);

  if (args.includes('--claims')) {
    const results = runClaims(root, readClaims(root));
    const rendered = renderClaims(results);
    process.stdout.write(rendered.text);
    recordEvent(root, readVersion(), {
      cmd: 'check --claims',
      cursor: report.cursor.state,
      out: measure(rendered.text, results.map((result) => result.id)),
      exit: rendered.exit,
      ms: Date.now() - started,
    });

    return rendered.exit;
  }

  if (args.includes('--json')) {
    const text = `${JSON.stringify(report, null, 2)}\n`;
    process.stdout.write(text);
    recordEvent(root, readVersion(), {
      cmd: 'check --json',
      cursor: report.cursor.state,
      out: measure(text, []),
      exit: args.includes('--strict') ? renderCheck(report).strict : 0,
      ms: Date.now() - started,
    });

    return args.includes('--strict') ? renderCheck(report).strict : 0;
  }

  const { text, ids, strict } = renderCheck(report);
  const exit = args.includes('--strict') ? strict : 0;
  process.stdout.write(text);
  recordEvent(root, readVersion(), {
    cmd: 'check',
    cursor: report.cursor.state,
    out: measure(text, ids),
    exit,
    ms: Date.now() - started,
  });

  return exit;
}

async function commandDiff(args: string[]): Promise<number> {
  const root = workspaceRoot();

  if (root === null) {
    console.error('no .sddio/context/config.json above this directory');
    return 1;
  }

  const started = Date.now();
  const report = inspect(root);

  if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  }

  const { text, ids } = renderDiff(report);
  process.stdout.write(text);
  recordEvent(root, readVersion(), {
    cmd: 'diff',
    cursor: report.cursor.state,
    out: measure(text, ids),
    exit: 0,
    ms: Date.now() - started,
  });

  return 0;
}

async function commandStart(args: string[]): Promise<number> {
  const root = workspaceRoot();

  if (root === null) {
    console.error('no .sddio/context/config.json above this directory');
    return 1;
  }

  const started = Date.now();
  const { text, ids } = renderBrief(root, args, { label: 'start', hint: true, budget: 10 });
  process.stdout.write(text);
  recordEvent(root, readVersion(), {
    cmd: 'start',
    args: { paths: args },
    out: measure(text, ids),
    exit: 0,
    ms: Date.now() - started,
  });

  return 0;
}

async function main(args: string[]): Promise<number> {
  if (args.includes('-h') || args.includes('--help')) {
    console.log(USAGE);
    return 0;
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(readVersion());
    return 0;
  }

  const [command, ...rest] = args;

  if (command === undefined) {
    console.log(USAGE);
    return 1;
  }

  try {
    switch (command) {
      case 'init':
        return await commandInit(rest);
      case 'brief':
        return await commandBrief(rest);
      case 'show':
        return await commandShow(rest);
      case 'check':
        return await commandCheck(rest);
      case 'diff':
        return await commandDiff(rest);
      case 'start':
        return await commandStart(rest);
      default:
        console.error(`Unknown command: ${command}\n`);
        console.log(USAGE);
        return 1;
    }
  } catch (error) {
    console.error(`error: ${(error as Error).message}`);
    return 1;
  }
}

const exitCode = await main(process.argv.slice(2));

process.exitCode = exitCode;
