/* eslint-disable */
// ---------------------------------------------------------
// StoresGo Phase 10 Scaffolding (Remapped)
// Generated: 2025-10-26T05:27:03.730802
// ---------------------------------------------------------

export function parseCSV(text: string): any[] {
  // Naive CSV parser: header row + comma-separated values, quotes not fully supported (scaffold)
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const obj: any = {};
    headers.forEach((h, idx) => obj[h] = cols[idx]);
    rows.push(obj);
  }
  return rows;
}
