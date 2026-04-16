// Agent Suite CLI — Recent tool call errors
// Usage: npx tsx src/agent/admin/cli/recent-errors.ts [--limit 20] [--feature cs_chat]

import 'dotenv/config';
import { getPrisma } from '../../storage/prisma-client.js';
import { header, runCommand, parseArgs } from './_helpers/cli-utils.js';
import { formatTable, formatRelativeTime, formatDuration, truncate, color } from './_helpers/formatters.js';
import type { TableColumn } from './_helpers/formatters.js';

async function main() {
  const { flags } = parseArgs();
  const featureKey = flags['feature'];
  const limit = parseInt(flags['limit'] ?? '20', 10);

  header('Recent Tool Call Errors');

  const prisma = getPrisma();
  const errors = await prisma.aiToolCall.findMany({
    where: {
      status: 'error',
      ...(featureKey
        ? { message: { conversation: { featureKey } } }
        : {}),
    },
    include: {
      message: {
        include: {
          conversation: {
            select: { featureKey: true, channel: true, id: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  if (errors.length === 0) {
    console.log('\n  No errors found. That\'s good!\n');
    return;
  }

  const columns: TableColumn[] = [
    { key: 'tool', label: 'Tool', width: 22 },
    { key: 'feature', label: 'Feature', width: 16 },
    { key: 'channel', label: 'Channel', width: 10 },
    { key: 'error', label: 'Error Message', width: 50 },
    { key: 'duration', label: 'Duration', width: 10 },
    { key: 'when', label: 'When', width: 10 },
  ];

  const rows = errors.map((e) => ({
    tool: e.toolName,
    feature: e.message.conversation.featureKey,
    channel: e.message.conversation.channel,
    error: truncate(e.errorMessage ?? '—', 48),
    duration: formatDuration(e.durationMs),
    when: formatRelativeTime(e.createdAt),
  }));

  console.log();
  console.log(formatTable(columns, rows));
  console.log();
  console.log(color('  For full context: npx tsx src/agent/admin/cli/show-conversation.ts <conversationId>', 'gray'));
  console.log();
}

runCommand('recent-errors', main);
