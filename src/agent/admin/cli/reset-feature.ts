// Agent Suite CLI — Reset feature to L0
// Usage: npx tsx src/agent/admin/cli/reset-feature.ts <featureKey> [--reason "text"]

import 'dotenv/config';
import { getPrisma } from '../../storage/prisma-client.js';
import { header, runCommand, parseArgs, confirm, errorExit, success } from './_helpers/cli-utils.js';
import { bold, color, formatDate } from './_helpers/formatters.js';

async function main() {
  const { positional, flags } = parseArgs();
  const featureKey = positional[0];
  const reason = flags['reason'] ?? '';

  if (!featureKey) errorExit('Usage: reset-feature.ts <featureKey> [--reason "text"]');

  const prisma = getPrisma();
  const state = await prisma.aiAutonomyState.findUnique({ where: { featureKey } });

  if (!state) errorExit(`Feature not found: ${featureKey}`);

  header(`Reset Feature: ${featureKey}`);

  console.log();
  console.log(`  ${bold('Current State:')}`);
  console.log(`    Level:        ${bold(state.currentLevel)}`);
  console.log(`    Executions:   ${state.totalExecutions}`);
  console.log(`    Success:      ${state.successCount}`);
  console.log(`    Errors:       ${state.errorCount}`);
  console.log(`    Eval Score:   ${Number(state.evalScoreAvg).toFixed(2)}`);
  console.log(`    Last Promote: ${formatDate(state.lastPromotedAt)}`);
  console.log(`    Promoted By:  ${state.promotedBy ?? '—'}`);
  console.log();

  const ok = await confirm(
    `This will RESET ${featureKey} to L0 and clear all counters. Past conversations/audit will be preserved. Continue?`,
  );
  if (!ok) { console.log('\n  Cancelled.\n'); return; }

  await prisma.aiAutonomyState.update({
    where: { featureKey },
    data: {
      currentLevel: 'L0',
      totalExecutions: 0,
      successCount: 0,
      errorCount: 0,
      evalScoreAvg: 0,
      lastPromotedAt: null,
      promotedBy: 'cli-reset',
      notes: reason ? `Reset: ${reason}` : 'Reset via CLI',
    },
  });

  success(`${featureKey} reset to L0. All counters cleared.`);
  console.log(color('  Conversations and audit trail are preserved.\n', 'gray'));
}

runCommand('reset-feature', main);
