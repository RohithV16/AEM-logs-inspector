export type ExportFormat = 'csv' | 'json' | 'pdf';

export function downloadExport(data: any, format: ExportFormat, filename: string): void {
  const mimeTypes: Record<ExportFormat, string> = { csv: 'text/csv', json: 'application/json', pdf: 'application/pdf' };
  const ext: Record<ExportFormat, string> = { csv: 'csv', json: 'json', pdf: 'pdf' };
  const blob = new Blob([data], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${ext[format]}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCsv(events: any[]): string {
  if (events.length === 0) return '';
  const headers = Object.keys(events[0]);
  const rows = events.map(e => headers.map(h => JSON.stringify(e[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportToJson(events: any[]): string {
  return JSON.stringify(events, null, 2);
}
