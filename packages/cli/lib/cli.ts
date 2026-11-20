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
import { packageRoot } from './paths.js';
import { renderNextStep, selectNextStep } from './prompt.js';
import { readSkill, skillPath } from './skill.js';

const USAGE = `sddio — spec-driven development artifacts for a project

Usage:
  sddio init [--dir <path>] [--hook <name>] [--no-install] [--yes]
             [--force] [--dry-run]
  sddio skill --print
  sddio --version
  sddio --help

Commands:
  init        Copy .sddio and sddio_workspace templates into the target project,
              register the sddio snippet in AGENTS.md, and record the hook that
              triggers reconciliation.
  skill       Print the sddio agent skill to stdout. Reads only: no file is
              written, and no agent directory is touched.

Options:
  --dir <path>   Target project root (default: current directory)
  --hook <name>  Hook to declare: flow-trail (default) or none. Naming one
                 installs it into the project unless --no-install is given.
  --no-install   Declare the hook without running its installer
  --yes          Take the default hook without asking, and install it
  --force        Overwrite existing files, including sddio_workspace
  --dry-run      Report what would happen without writing anything
  --print        Print the skill (skill only)
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
    console.log('  1) flow-trail (default) — a card board in `flow-trail/`; installed into this project');
    console.log('  2) none — nothing calls sddio; you run the check yourself');

    const answer = (await rl.question('Choose [1]: ')).trim().toLowerCase();

    return answer === '2' || answer === 'none' ? 'none' : 'flow-trail';
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

async function commandSkill(args: string[]): Promise<number> {
  for (const argument of args) {
    if (argument !== '--print') {
      throw new Error(`Unknown option for skill: ${argument}`);
    }
  }

  process.stdout.write(await readSkill());
  console.error(`No file was written. Source: ${skillPath}`);
  console.error('Save it as <skills>/sddio/SKILL.md, or copy .sddio/skill/SKILL.md from the project.');

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
      case 'skill':
        return await commandSkill(rest);
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
