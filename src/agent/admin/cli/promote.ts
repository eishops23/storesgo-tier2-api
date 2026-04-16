// Agent Suite CLI — Promote feature level
// Usage: npx tsx src/agent/admin/cli/promote.ts <featureKey> <targetLevel> [--reason "text"] [--force]

import 'dotenv/config';
import type { AiAutonomyLevel } from '@prisma/client';
import { checkPromotionReadiness, promoteFeatureLevel, PromotionError } from '../../autonomy/index.js';
import { header, runCommand, parseArgs, confirm, errorExit, success } from './_helpers/cli-utils.js';
import { bold, color, formatStatusBadge } from './_helpers/formatters.js';

const VALID_LEVELS: AiAutonomyLevel[] = ['L0', 'L1', 'L2', 'L3'];

async function main() {
  const { positional, flags } = parseArgs();
  const featureKey = positional[0];
  const targetLevel = positional[1] as AiAutonomyLevel;
  const reason = flags['reason'] ?? '';
  const force = flags['force'] === 'true';

  if (!featureKey || !targetLevel) {
    errorExit('Usage: promote.ts <featureKey> <targetLevel> [--reason "text"] [--force]');
  }
  if (!VALID_LEVELS.includes(targetLevel)) {
    errorExit(`Invalid level: ${targetLevel}. Must be one of: ${VALID_LEVELS.join(', ')}`);
  }

  header(`Promote: ${featureKey} → ${targetLevel}`);

  // Check readiness
  const evaluation = await checkPromotionReadiness(featureKey, targetLevel);

  console.log();
  console.log(`  ${bold('Current Metrics:')}`);
  console.log(`    Executions:  ${evaluation.currentMetrics.executions}`);
  console.log(`    Eval Score:  ${evaluation.currentMetrics.evalScore.toFixed(2)}`);
  console.log(`    Error Rate:  ${(evaluation.currentMetrics.errorRate * 100).toFixed(2)}%`);
  console.log();

  if (evaluation.requiredMetrics) {
    console.log(`  ${bold('Required for ' + targetLevel + ':')}`);
    console.log(`    Min Executions:  ${evaluation.requiredMetrics.minExecutions}`);
    console.log(`    Min Eval Score:  ${evaluation.requiredMetrics.minEvalScore}`);
    console.log(`    Max Error Rate:  ${(evaluation.requiredMetrics.maxErrorRate * 100).toFixed(2)}%`);
    console.log();
  }

  console.log(`  ${bold('Evaluation:')} ${formatStatusBadge(evaluation.canPromote ? 'pass' : 'fail')}`);
  for (const r of evaluation.reasons) {
    console.log(`    - ${r}`);
  }
  console.log();

  if (!evaluation.canPromote && !force) {
    errorExit(`Criteria not met. Use --force to override.`);
  }

  const ok = await confirm(`Promote ${featureKey} to ${targetLevel}?`);
  if (!ok) {
    console.log('\n  Cancelled.\n');
    return;
  }

  try {
    const result = await promoteFeatureLevel(featureKey, targetLevel, 'cli-admin', reason || undefined);
    success(`${featureKey} promoted to ${result.currentLevel}`);
  } catch (err) {
    if (err instanceof PromotionError) {
      errorExit(err.message);
    }
    throw err;
  }
}

runCommand('promote', main);
