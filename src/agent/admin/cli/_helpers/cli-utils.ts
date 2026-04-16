// Agent Suite — CLI utility functions (Phase 0 Prompt 6.5)

import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { C, color } from './formatters.js';
import { disconnectPrisma } from '../../../storage/prisma-client.js';

export interface ParsedArgs {
  flags: Record<string, string>;
  positional: string[];
}

export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          flags[arg.slice(2)] = next;
          i++;
        } else {
          flags[arg.slice(2)] = 'true';
        }
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

export async function confirm(question: string, defaultNo = true): Promise<boolean> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const suffix = defaultNo ? ' (y/N) ' : ' (Y/n) ';
  try {
    const answer = await rl.question(color(question + suffix, 'yellow'));
    const normalized = answer.trim().toLowerCase();
    if (defaultNo) return normalized === 'y' || normalized === 'yes';
    return normalized !== 'n' && normalized !== 'no';
  } finally {
    rl.close();
  }
}

export function errorExit(message: string, code = 1): never {
  console.error(`\n${C.red}✗ Error:${C.reset} ${message}\n`);
  process.exit(code);
}

export function success(message: string): void {
  console.log(`${C.green}✓${C.reset} ${message}`);
}

export function warn(message: string): void {
  console.log(`${C.yellow}⚠${C.reset} ${message}`);
}

export function header(title: string): void {
  const line = '─'.repeat(60);
  console.log(`\n${C.cyan}${line}${C.reset}`);
  console.log(`${C.cyan}${C.bold}  ${title}${C.reset}`);
  console.log(`${C.cyan}${line}${C.reset}`);
}

export async function runCommand(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (process.env['DEBUG']) {
      console.error(err);
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n${C.red}✗ ${name} failed:${C.reset} ${msg}\n`);
    process.exit(1);
  } finally {
    await disconnectPrisma().catch(() => {});
  }
}
