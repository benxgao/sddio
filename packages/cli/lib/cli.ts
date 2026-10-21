#!/usr/bin/env node

/**
 * Entry point. Compiled to `dist/cli.js`, which is what `bin` points at, so
 * `npx @sddio/cli` runs prebuilt output with no build step on the consumer
 * side (ADR-002).
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { runInit } from './init.js';
import { packageRoot } from './paths.js';

const USAGE = `sddio — spec-driven development artifacts for a project

Usage:
  sddio init [--dir <path>] [--force] [--dry-run]
  sddio --version
  sddio --help

Commands:
  init        Copy .sddio and sddio_workspace templates into the target project
              and register the sddio snippet in AGENTS.md.

Options:
  --dir <path>   Target project root (default: current directory)
  --force        Overwrite existing files, including sddio_workspace
  --dry-run      Report what would happen without writing anything
  -h, --help     Show this help
  -v, --version  Show the version
`;

interface InitArgs {
  cwd: string;
  force: boolean;
  dryRun: boolean;
}

function readVersion(): string {
  const manifest = readFileSync(join(packageRoot, 'package.json'), 'utf8');

  return (JSON.parse(manifest) as { version: string }).version;
}

function parseInitArgs(args: string[]): InitArgs {
  const parsed: InitArgs = { cwd: process.cwd(), force: false, dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--force') {
      parsed.force = true;
    } else if (argument === '--dry-run') {
      parsed.dryRun = true;
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

  if (result.dryRun) {
    console.log('dry run: nothing was written');
  }

  for (const error of result.errors) {
    console.error(`error: ${error}`);
  }
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

  if (command !== 'init') {
    console.error(`Unknown command: ${command}\n`);
    console.log(USAGE);
    return 1;
  }

  try {
    const result = await runInit(parseInitArgs(rest));
    report(result);

    return result.errors.length > 0 ? 1 : 0;
  } catch (error) {
    console.error(`error: ${(error as Error).message}`);
    return 1;
  }
}

const exitCode = await main(process.argv.slice(2));

process.exitCode = exitCode;
