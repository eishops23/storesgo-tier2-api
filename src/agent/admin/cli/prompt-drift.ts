// Agent Suite — Prompt drift detection CLI (Phase 0.9)
// Usage: npx tsx src/agent/admin/cli/prompt-drift.ts [--feature <key>] [--days <n>]

import { parseArgs, header, runCommand } from './_helpers/cli-utils.js';
import { bold, color, formatDate, formatTable } from './_helpers/formatters.js';
import { getPrisma } from '../../storage/prisma-client.js';

runCommand('prompt-drift', async () => {
  const { flags } = parseArgs();
  const featureKey = flags['feature'];
  const days = parseInt(flags['days'] ?? '30', 10);

  const prisma = getPrisma();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.aiMessage.groupBy({
    by: ['promptHash'],
    where: {
      role: 'assistant',
      promptHash: { not: null },
      createdAt: { gte: since },
      ...(featureKey
        ? { conversation: { featureKey } }
        : {}),
    },
    _count: { id: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });

  header('Prompt Drift Report');
  console.log(`  Period: last ${days} days`);
  if (featureKey) console.log(`  Feature: ${bold(featureKey)}`);
  console.log();

  if (rows.length === 0) {
    console.log('  No assistant messages with prompt hashes found.\n');
    return;
  }

  const columns = [
    { key: 'hash', label: 'Prompt Hash', width: 18 },
    { key: 'count', label: 'Messages', width: 10 },
    { key: 'firstSeen', label: 'First Seen', width: 22 },
    { key: 'lastSeen', label: 'Last Seen', width: 22 },
  ];

  const tableRows = rows
    .sort((a, b) => (a._min.createdAt?.getTime() ?? 0) - (b._min.createdAt?.getTime() ?? 0))
    .map((r) => ({
      hash: r.promptHash ?? '—',
      count: String(r._count.id),
      firstSeen: formatDate(r._min.createdAt),
      lastSeen: formatDate(r._max.createdAt),
    }));

  console.log(formatTable(columns, tableRows));
  console.log();

  if (rows.length > 1) {
    console.log(color(`  ⚠ ${rows.length} distinct prompts detected — review for unintended drift`, 'yellow'));
  } else {
    console.log(color('  ✓ Single prompt hash — no drift detected', 'green'));
  }
  console.log();
});
