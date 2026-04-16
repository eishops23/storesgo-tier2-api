// Agent Suite CLI — List pending tool call proposals
// Usage: npx tsx src/agent/admin/cli/proposals.ts [--feature cs_chat] [--limit 20]

import 'dotenv/config';
import { getPrisma } from '../../storage/prisma-client.js';
import { header, runCommand, parseArgs } from './_helpers/cli-utils.js';
import { formatTable, formatRelativeTime, truncate, color } from './_helpers/formatters.js';
import type { TableColumn } from './_helpers/formatters.js';

async function main() {
  const { flags } = parseArgs();
  const featureKey = flags['feature'];
  const limit = parseInt(flags['limit'] ?? '20', 10);

  header('Pending Tool Call Proposals');

  const prisma = getPrisma();
  const tenSecondsAgo = new Date(Date.now() - 10_000);

  const proposals = await prisma.aiToolCall.findMany({
    where: {
      status: 'pending',
      autonomyLevelAtExecution: { in: ['L0', 'L1'] },
      createdAt: { lt: tenSecondsAgo },
      ...(featureKey
        ? { message: { conversation: { featureKey } } }
        : {}),
    },
    include: {
      message: {
        include: {
          conversation: { select: { featureKey: true, id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  if (proposals.length === 0) {
    console.log('\n  No pending proposals found.\n');
    return;
  }

  const columns: TableColumn[] = [
    { key: 'tool', label: 'Tool', width: 22 },
    { key: 'feature', label: 'Feature', width: 16 },
    { key: 'convId', label: 'Conversation', width: 14 },
    { key: 'args', label: 'Args Preview', width: 40 },
    { key: 'level', label: 'Level', width: 6 },
    { key: 'when', label: 'When', width: 10 },
  ];

  const rows = proposals.map((p) => ({
    tool: p.toolName,
    feature: p.message.conversation.featureKey,
    convId: truncate(p.message.conversation.id, 12),
    args: truncate(JSON.stringify(p.argsJson), 38),
    level: p.autonomyLevelAtExecution,
    when: formatRelativeTime(p.createdAt),
  }));

  console.log();
  console.log(formatTable(columns, rows));
  console.log();
}

runCommand('proposals', main);
