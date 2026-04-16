// Agent Suite CLI — Autonomy dashboard
// Usage: npx tsx src/agent/admin/cli/dashboard.ts

import 'dotenv/config';
import { getAutonomyDashboardData } from '../../autonomy/index.js';
import { header, runCommand } from './_helpers/cli-utils.js';
import { formatTable, formatStatusBadge, color, bold } from './_helpers/formatters.js';
import type { TableColumn } from './_helpers/formatters.js';

async function main() {
  header('Autonomy Dashboard');

  const rows = await getAutonomyDashboardData();

  if (rows.length === 0) {
    console.log('\n  No features initialized yet.');
    console.log(`  Run: ${color('npx tsx src/agent/admin/cli/init-feature.ts <featureKey>', 'cyan')}\n`);
    return;
  }

  const columns: TableColumn[] = [
    { key: 'feature', label: 'Feature', width: 24 },
    { key: 'level', label: 'Level', width: 8 },
    { key: 'execs', label: 'Executions', width: 12, align: 'right' },
    { key: 'successPct', label: 'Success %', width: 12, align: 'right' },
    { key: 'eval', label: 'Eval', width: 8, align: 'right' },
    { key: 'nextStatus', label: 'Next Level', width: 18 },
  ];

  const tableRows = rows.map((row) => {
    const s = row.state;
    const successPct = s.totalExecutions > 0
      ? ((s.successCount / s.totalExecutions) * 100).toFixed(1) + '%'
      : '—';

    let nextStatus = '—';
    if (row.nextLevelEvaluation) {
      nextStatus = row.nextLevelEvaluation.canPromote
        ? formatStatusBadge('ready')
        : formatStatusBadge('pending');
    } else {
      nextStatus = color('MAX', 'gray');
    }

    return {
      feature: s.featureKey,
      level: bold(s.currentLevel),
      execs: String(s.totalExecutions),
      successPct,
      eval: Number(s.evalScoreAvg).toFixed(2),
      nextStatus,
    };
  });

  console.log();
  console.log(formatTable(columns, tableRows));
  console.log();

  // Promotion hints
  const promotable = rows.filter((r) => r.nextLevelEvaluation?.canPromote);
  if (promotable.length > 0) {
    console.log(bold('  Ready to promote:'));
    for (const row of promotable) {
      const next = row.state.currentLevel === 'L0' ? 'L1'
        : row.state.currentLevel === 'L1' ? 'L2'
        : 'L3';
      console.log(`    npx tsx src/agent/admin/cli/promote.ts ${row.state.featureKey} ${next}`);
    }
    console.log();
  }
}

runCommand('dashboard', main);
