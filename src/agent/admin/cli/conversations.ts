// Agent Suite CLI — List recent conversations
// Usage: npx tsx src/agent/admin/cli/conversations.ts [--feature cs_chat] [--limit 20]

import 'dotenv/config';
import { getPrisma } from '../../storage/prisma-client.js';
import { header, runCommand, parseArgs } from './_helpers/cli-utils.js';
import { formatTable, formatRelativeTime, formatMoney, truncate, color } from './_helpers/formatters.js';
import type { TableColumn } from './_helpers/formatters.js';

async function main() {
  const { flags } = parseArgs();
  const featureKey = flags['feature'];
  const limit = parseInt(flags['limit'] ?? '20', 10);

  header('Recent Conversations');

  const prisma = getPrisma();
  const conversations = await prisma.aiConversation.findMany({
    where: { ...(featureKey ? { featureKey } : {}) },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
  });

  if (conversations.length === 0) {
    console.log('\n  No conversations found.\n');
    return;
  }

  const columns: TableColumn[] = [
    { key: 'id', label: 'ID', width: 14 },
    { key: 'channel', label: 'Channel', width: 10 },
    { key: 'status', label: 'Status', width: 12 },
    { key: 'feature', label: 'Feature', width: 18 },
    { key: 'msgs', label: 'Msgs', width: 6, align: 'right' },
    { key: 'cost', label: 'Cost', width: 10, align: 'right' },
    { key: 'lastMsg', label: 'Last Message', width: 14 },
  ];

  const rows = conversations.map((c) => ({
    id: truncate(c.id, 12),
    channel: c.channel,
    status: c.status,
    feature: c.featureKey,
    msgs: String(c.messageCount),
    cost: formatMoney(c.totalCostUsd),
    lastMsg: formatRelativeTime(c.lastMessageAt),
  }));

  console.log();
  console.log(formatTable(columns, rows));
  console.log();
  console.log(color(`  To see full details: npx tsx src/agent/admin/cli/show-conversation.ts <id>`, 'gray'));
  console.log();
}

runCommand('conversations', main);
