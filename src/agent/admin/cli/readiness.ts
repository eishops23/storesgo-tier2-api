// Agent Suite CLI — Readiness check
// Usage: npx tsx src/agent/admin/cli/readiness.ts

import 'dotenv/config';
import { runReadinessCheck } from '../../readiness/index.js';
import { header, runCommand } from './_helpers/cli-utils.js';
import { formatStatusBadge, color, formatDate } from './_helpers/formatters.js';

async function main() {
  header('Agent Suite Readiness Check');

  const report = await runReadinessCheck();

  console.log();
  console.log(`  Overall: ${formatStatusBadge(report.status)}`);
  console.log(`  Checked: ${color(formatDate(report.timestamp), 'gray')}`);
  console.log();

  for (const check of report.checks) {
    const badge = formatStatusBadge(check.status);
    console.log(`  ${badge}  ${check.name}`);
    console.log(`         ${color(check.message, 'gray')}`);
    console.log();
  }

  if (report.status === 'not_ready') process.exit(1);
}

runCommand('readiness', main);
