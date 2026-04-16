// Agent Suite CLI — Show full conversation replay
// Usage: npx tsx src/agent/admin/cli/show-conversation.ts <conversationId>

import 'dotenv/config';
import { ConversationRepo } from '../../storage/index.js';
import { header, runCommand, parseArgs, errorExit } from './_helpers/cli-utils.js';
import {
  color, bold, formatDate, formatMoney, formatDuration,
  formatStatusBadge, truncate, C,
} from './_helpers/formatters.js';

const ROLE_COLORS: Record<string, string> = {
  user: C.cyan,
  assistant: C.green,
  system: C.gray,
  tool: C.magenta,
};

function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const line of text.split('\n')) {
    if (line.length <= maxWidth) {
      lines.push(line);
    } else {
      for (let i = 0; i < line.length; i += maxWidth) {
        lines.push(line.slice(i, i + maxWidth));
      }
    }
  }
  return lines;
}

async function main() {
  const { positional } = parseArgs();
  const convId = positional[0];
  if (!convId) errorExit('Usage: show-conversation.ts <conversationId>');

  const conv = await ConversationRepo.getConversationById(convId);
  if (!conv) errorExit(`Conversation not found: ${convId}`);

  header(`Conversation ${truncate(conv.id, 20)}`);

  console.log();
  console.log(`  ${bold('Feature:')}    ${conv.featureKey}`);
  console.log(`  ${bold('Channel:')}    ${conv.channel}`);
  console.log(`  ${bold('Status:')}     ${formatStatusBadge(conv.status)}`);
  console.log(`  ${bold('Started:')}    ${formatDate(conv.startedAt)}`);
  console.log(`  ${bold('Closed:')}     ${formatDate(conv.closedAt)}`);
  console.log(`  ${bold('Identity:')}   ${conv.identityId ?? '—'}`);
  console.log();

  // Summary
  const totalToolCalls = conv.messages.reduce((sum, m) => sum + m.toolCalls.length, 0);
  console.log(`  ${bold('Messages:')}   ${conv.messageCount}    ${bold('Tool Calls:')} ${totalToolCalls}`);
  console.log(`  ${bold('Tokens:')}     ${conv.totalTokensUsed}    ${bold('Cost:')} ${formatMoney(conv.totalCostUsd)}`);
  console.log();
  console.log('  ' + '═'.repeat(56));
  console.log();

  // Message replay
  for (const msg of conv.messages) {
    const roleColor = ROLE_COLORS[msg.role] ?? C.white;
    const roleTag = `${roleColor}${C.bold}[${msg.role.toUpperCase()}]${C.reset}`;
    const timeStr = color(formatDate(msg.createdAt), 'gray');
    const metaStr = msg.provider
      ? color(` (${msg.provider}/${msg.model} — ${msg.tokensIn}+${msg.tokensOut} tok, ${formatMoney(msg.costUsd)})`, 'gray')
      : '';

    console.log(`  ${roleTag} ${timeStr}${metaStr}`);

    if (msg.content) {
      const lines = wrapText(msg.content, 100);
      for (const line of lines) {
        console.log(`    ${line}`);
      }
    }

    // Tool calls
    for (const tc of msg.toolCalls) {
      console.log();
      console.log(`    ${color('┌ Tool Call:', 'magenta')} ${bold(tc.toolName)}`);
      console.log(`    ${color('│', 'magenta')} Level: ${tc.autonomyLevelAtExecution}  Status: ${formatStatusBadge(tc.status)}  Duration: ${formatDuration(tc.durationMs)}`);
      console.log(`    ${color('│', 'magenta')} Args: ${color(truncate(JSON.stringify(tc.argsJson), 80), 'gray')}`);
      if (tc.resultJson) {
        console.log(`    ${color('│', 'magenta')} Result: ${color(truncate(JSON.stringify(tc.resultJson), 80), 'gray')}`);
      }
      if (tc.errorMessage) {
        console.log(`    ${color('│', 'magenta')} ${color('Error: ' + tc.errorMessage, 'red')}`);
      }
      console.log(`    ${color('└', 'magenta')}`);
    }

    console.log();
  }
}

runCommand('show-conversation', main);
