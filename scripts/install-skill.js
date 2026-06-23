#!/usr/bin/env node
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
let targetArg = null;
let force = false;
let dryRun = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  }
  if (arg === '--force' || arg === '-f') {
    force = true;
    continue;
  }
  if (arg === '--dry-run') {
    dryRun = true;
    continue;
  }
  if (arg === '--target') {
    targetArg = args[++i];
    if (!targetArg) {
      console.error('Missing value for --target.');
      process.exit(1);
    }
    continue;
  }
  console.error(`Unknown argument: ${arg}`);
  printHelp();
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const sourceDir = path.join(repoRoot, 'skill');
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const targetDir = targetArg ? path.resolve(targetArg) : path.join(codexHome, 'skills', 'response-shaper');

async function exists(dir) {
  try {
    await access(dir, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (dryRun) {
    console.log(`Would install ${sourceDir}`);
    console.log(`Would target ${targetDir}`);
    return;
  }

  await mkdir(path.dirname(targetDir), { recursive: true });

  if (await exists(targetDir)) {
    if (!force) {
      console.error(`Target already exists: ${targetDir}`);
      console.error('Re-run with --force to replace it, or use --target to choose a different path.');
      process.exit(1);
    }
    await rm(targetDir, { recursive: true, force: true });
  }

  await cp(sourceDir, targetDir, { recursive: true });
  console.log(`Installed response-shaper skill to ${targetDir}`);
}

function printHelp() {
  console.log(`Usage:
  response-shaper-install [--target <path>] [--force] [--dry-run]

Options:
  --target <path>   Install to a custom path instead of the default Codex skills directory
  --force, -f       Replace an existing target directory
  --dry-run         Print the source and target paths without copying files
  --help, -h        Show this help message`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
