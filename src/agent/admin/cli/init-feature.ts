// Agent Suite CLI — Initialize a new feature
// Usage: npx tsx src/agent/admin/cli/init-feature.ts <featureKey> [--level L0] [--notes "text"]

import 'dotenv/config';
import type { AiAutonomyLevel } from '@prisma/client';
import { AutonomyRepo } from '../../storage/index.js';
import { header, runCommand, parseArgs, errorExit, success } from './_helpers/cli-utils.js';
import { bold } from './_helpers/formatters.js';

async function main() {
  const { positional, flags } = parseArgs();
  const featureKey = positional[0];
  const level = (flags['level'] ?? 'L0') as AiAutonomyLevel;
  const notes = flags['notes'] ?? '';

  if (!featureKey) errorExit('Usage: init-feature.ts <featureKey> [--level L0] [--notes "text"]');

  if (!['L0', 'L1'].includes(level)) {
    errorExit(`Starting level must be L0 or L1. Higher levels must be earned via promotion.`);
  }

  header(`Initialize Feature: ${featureKey}`);

  // Idempotent — creates at L0 if not exists
  const state = await AutonomyRepo.initializeFeature(featureKey);

  if (level === 'L1' && state.currentLevel === 'L0') {
    await AutonomyRepo.promoteLevel(featureKey, 'L1', 'cli-init', notes || 'Initialized at L1 via CLI');
  }

  // Update notes if provided and staying at L0
  if (notes && level === 'L0') {
    const { getPrisma } = await import('../../storage/prisma-client.js');
    await getPrisma().aiAutonomyState.update({
      where: { featureKey },
      data: { notes },
    });
  }

  const final = await AutonomyRepo.getCurrentLevel(featureKey);

  console.log();
  success(`Feature ${bold(featureKey)} initialized at ${bold(final)}`);
  console.log();
}

runCommand('init-feature', main);
