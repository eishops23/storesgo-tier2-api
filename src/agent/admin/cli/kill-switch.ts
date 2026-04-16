// Agent Suite CLI — Kill switch toggle
// Usage: npx tsx src/agent/admin/cli/kill-switch.ts --on | --off | --status

import * as fs from 'node:fs';
import * as path from 'node:path';
import { header, runCommand, parseArgs, confirm, errorExit, success, warn } from './_helpers/cli-utils.js';
import { bold, color } from './_helpers/formatters.js';

async function main() {
  const { flags } = parseArgs();
  const envPath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    errorExit('No .env file found. Create it first.');
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const currentMatch = content.match(/^AGENT_KILL_SWITCH=(.*)$/m);
  const currentValue = currentMatch ? currentMatch[1].trim() : 'not set';

  header('Agent Kill Switch');

  if (flags['status'] === 'true' || (!flags['on'] && !flags['off'])) {
    console.log();
    console.log(`  Current value: ${bold(currentValue)}`);
    console.log(`  Status: ${currentValue === 'true' ? color('ACTIVE — all features disabled', 'red') : color('Inactive — features running normally', 'green')}`);
    console.log();
    return;
  }

  if (flags['on'] === 'true') {
    const ok = await confirm('This will DISABLE ALL AGENT FEATURES. Continue?');
    if (!ok) { console.log('\n  Cancelled.\n'); return; }

    fs.writeFileSync(envPath + '.bak', content);
    const newContent = currentMatch
      ? content.replace(/^AGENT_KILL_SWITCH=.*$/m, 'AGENT_KILL_SWITCH=true')
      : content.trimEnd() + '\nAGENT_KILL_SWITCH=true\n';
    fs.writeFileSync(envPath, newContent);

    success('Kill switch ACTIVATED. All agent features are now disabled.');
    warn('Restart any running services for this change to take effect.');
    return;
  }

  if (flags['off'] === 'true') {
    const ok = await confirm('This will re-enable agent features. Continue?');
    if (!ok) { console.log('\n  Cancelled.\n'); return; }

    fs.writeFileSync(envPath + '.bak', content);
    const newContent = currentMatch
      ? content.replace(/^AGENT_KILL_SWITCH=.*$/m, 'AGENT_KILL_SWITCH=false')
      : content.trimEnd() + '\nAGENT_KILL_SWITCH=false\n';
    fs.writeFileSync(envPath, newContent);

    success('Kill switch DEACTIVATED. Agent features re-enabled.');
    warn('Restart any running services for this change to take effect.');
    return;
  }

  errorExit('Usage: kill-switch.ts --on | --off | --status');
}

runCommand('kill-switch', main);
