// Agent Suite CLI — Cost report
// Usage: npx tsx src/agent/admin/cli/cost-report.ts [--days 7] [--feature cs_chat]

import 'dotenv/config';
import { getPrisma } from '../../storage/prisma-client.js';
import { header, runCommand, parseArgs } from './_helpers/cli-utils.js';
import { formatTable, formatMoney, bold, color } from './_helpers/formatters.js';
import type { TableColumn } from './_helpers/formatters.js';

async function main() {
  const { flags } = parseArgs();
  const days = parseInt(flags['days'] ?? '7', 10);
  const featureKey = flags['feature'];

  header(`Cost Report — Last ${days} Days`);

  const prisma = getPrisma();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Per-feature aggregation
  const conversations = await prisma.aiConversation.findMany({
    where: {
      createdAt: { gte: since },
      ...(featureKey ? { featureKey } : {}),
    },
    select: { featureKey: true, totalCostUsd: true, totalTokensUsed: true, messageCount: true },
  });

  // Group by featureKey
  const byFeature = new Map<string, { cost: number; tokens: number; messages: number; count: number }>();
  for (const c of conversations) {
    const entry = byFeature.get(c.featureKey) ?? { cost: 0, tokens: 0, messages: 0, count: 0 };
    entry.cost += Number(c.totalCostUsd);
    entry.tokens += c.totalTokensUsed;
    entry.messages += c.messageCount;
    entry.count += 1;
    byFeature.set(c.featureKey, entry);
  }

  console.log();
  if (byFeature.size === 0) {
    console.log('  No conversations found in this period.\n');
    return;
  }

  // Feature table
  const featureColumns: TableColumn[] = [
    { key: 'feature', label: 'Feature', width: 24 },
    { key: 'convs', label: 'Convs', width: 8, align: 'right' },
    { key: 'msgs', label: 'Messages', width: 10, align: 'right' },
    { key: 'tokens', label: 'Tokens', width: 12, align: 'right' },
    { key: 'cost', label: 'Cost', width: 12, align: 'right' },
  ];

  let totalCost = 0;
  let totalTokens = 0;
  const featureRows = Array.from(byFeature.entries()).map(([key, val]) => {
    totalCost += val.cost;
    totalTokens += val.tokens;
    return {
      feature: key,
      convs: String(val.count),
      msgs: String(val.messages),
      tokens: val.tokens.toLocaleString(),
      cost: formatMoney(val.cost * 10000), // formatMoney expects cents-like, but we have dollars
    };
  });

  // Fix: formatMoney expects a dollar value, let's use it directly
  const featureRowsFixed = Array.from(byFeature.entries()).map(([key, val]) => ({
    feature: key,
    convs: String(val.count),
    msgs: String(val.messages),
    tokens: val.tokens.toLocaleString(),
    cost: `$${val.cost.toFixed(4)}`,
  }));

  console.log(bold('  By Feature:'));
  console.log();
  console.log(formatTable(featureColumns, featureRowsFixed));
  console.log();

  // Per-provider aggregation
  const byProvider = await prisma.aiMessage.groupBy({
    by: ['provider'],
    where: {
      createdAt: { gte: since },
      provider: { not: null },
      ...(featureKey ? { conversation: { featureKey } } : {}),
    },
    _sum: { costUsd: true, tokensIn: true, tokensOut: true },
    _count: true,
  });

  if (byProvider.length > 0) {
    const providerColumns: TableColumn[] = [
      { key: 'provider', label: 'Provider', width: 16 },
      { key: 'calls', label: 'Calls', width: 8, align: 'right' },
      { key: 'tokensIn', label: 'Tokens In', width: 12, align: 'right' },
      { key: 'tokensOut', label: 'Tokens Out', width: 12, align: 'right' },
      { key: 'cost', label: 'Cost', width: 12, align: 'right' },
    ];

    const providerRows = byProvider.map((p) => ({
      provider: p.provider ?? 'unknown',
      calls: String(p._count),
      tokensIn: (p._sum.tokensIn ?? 0).toLocaleString(),
      tokensOut: (p._sum.tokensOut ?? 0).toLocaleString(),
      cost: `$${Number(p._sum.costUsd ?? 0).toFixed(4)}`,
    }));

    console.log(bold('  By Provider:'));
    console.log();
    console.log(formatTable(providerColumns, providerRows));
    console.log();
  }

  console.log(`  ${bold('Grand Total:')} $${totalCost.toFixed(4)} across ${totalTokens.toLocaleString()} tokens`);
  console.log();
}

runCommand('cost-report', main);
