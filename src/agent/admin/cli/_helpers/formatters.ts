// Agent Suite — CLI formatting utilities (Phase 0 Prompt 6.5)

export const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

type ColorKey = keyof typeof C;

export function color(text: string, key: ColorKey): string {
  return `${C[key]}${text}${C.reset}`;
}

export function bold(text: string): string {
  return `${C.bold}${text}${C.reset}`;
}

export function formatMoney(value: unknown): string {
  if (value == null) return '$0.0000';
  const n = Number(value);
  if (isNaN(n)) return '$0.0000';
  return `$${n.toFixed(4)}`;
}

export function formatDuration(ms: unknown): string {
  if (ms == null) return '—';
  const n = Number(ms);
  if (isNaN(n)) return '—';
  if (n < 1000) return `${Math.round(n)}ms`;
  if (n < 60000) return `${(n / 1000).toFixed(2)}s`;
  return `${(n / 60000).toFixed(2)}m`;
}

export function formatDate(d: unknown): string {
  if (d == null) return '—';
  const date = typeof d === 'string' ? new Date(d) : d as Date;
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatRelativeTime(d: unknown): string {
  if (d == null) return '—';
  const date = typeof d === 'string' ? new Date(d) : d as Date;
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

// Strip ANSI escape codes for width calculations
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'right';
}

export function formatTable(columns: TableColumn[], rows: Record<string, string>[]): string {
  // Compute column widths
  const widths = columns.map((col) => {
    const headerLen = stripAnsi(col.label).length;
    const maxDataLen = rows.reduce(
      (max, row) => Math.max(max, stripAnsi(row[col.key] ?? '').length),
      0,
    );
    return col.width ?? Math.max(headerLen, maxDataLen) + 2;
  });

  function padCell(text: string, width: number, align: 'left' | 'right'): string {
    const visLen = stripAnsi(text).length;
    const pad = Math.max(0, width - visLen);
    return align === 'right' ? ' '.repeat(pad) + text : text + ' '.repeat(pad);
  }

  const lines: string[] = [];

  // Header
  const headerLine = columns
    .map((col, i) => color(padCell(col.label, widths[i], col.align ?? 'left'), 'bold'))
    .join('  ');
  lines.push(headerLine);

  // Separator
  lines.push(widths.map((w) => '─'.repeat(w)).join('──'));

  // Rows
  for (const row of rows) {
    const rowLine = columns
      .map((col, i) => padCell(row[col.key] ?? '', widths[i], col.align ?? 'left'))
      .join('  ');
    lines.push(rowLine);
  }

  return lines.join('\n');
}

export function formatStatusBadge(status: string): string {
  const s = status.toLowerCase();
  if (['pass', 'success', 'ready', 'active', 'executed'].includes(s)) {
    return color('✓ ' + status, 'green');
  }
  if (['warn', 'degraded', 'pending', 'proposed'].includes(s)) {
    return color('⚠ ' + status, 'yellow');
  }
  if (['fail', 'error', 'not_ready', 'escalated'].includes(s)) {
    return color('✗ ' + status, 'red');
  }
  return color('? ' + status, 'gray');
}
