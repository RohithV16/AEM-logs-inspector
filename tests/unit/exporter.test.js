const {
  exportToCSV,
  exportToJSON,
  generatePDFSummary
} = require('../../src/exporter');

describe('exporter - exportToCSV', () => {
  test('exports results to CSV format', () => {
    const results = [
      { level: 'ERROR', count: 5, message: 'Connection refused' },
      { level: 'WARN', count: 3, message: 'Timeout' }
    ];

    const csv = exportToCSV(results);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Level,Count,Message,First Occurrence');
    expect(lines[1]).toContain('ERROR');
    expect(lines[1]).toContain('5');
    expect(lines[1]).toContain('Connection refused');
  });

  test('escapes double quotes in CSV', () => {
    const results = [
      { level: 'ERROR', count: 1, message: 'Message with "quotes"' }
    ];

    const csv = exportToCSV(results);
    expect(csv).toContain('""');
  });

  test('handles missing fields gracefully', () => {
    const results = [
      { level: 'ERROR' },
      { message: 'Only message' },
      {}
    ];

    const csv = exportToCSV(results);
    expect(csv).toBeDefined();
    expect(typeof csv).toBe('string');
  });

  test('handles alternative field names', () => {
    const results = [
      { severity: 'ERROR', count: 1, title: 'Error title', timestamp: '2026-03-15' },
      { severity: 'WARN', count: 2, url: 'http://example.com' }
    ];

    const csv = exportToCSV(results);
    expect(csv).toContain('ERROR');
    expect(csv).toContain('Error title');
  });

  test('handles empty results array', () => {
    const csv = exportToCSV([]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Level,Count,Message,First Occurrence');
    expect(lines.length).toBe(1);
  });

  test('converts non-string values to strings', () => {
    const results = [
      { level: 'ERROR', count: 10, message: 'Test' }
    ];

    const csv = exportToCSV(results);
    expect(csv).toContain('10');
  });
});

describe('exporter - exportToJSON', () => {
  test('exports results to JSON format', () => {
    const results = [
      { level: 'ERROR', count: 5, message: 'Connection refused' },
      { level: 'WARN', count: 3, message: 'Timeout' }
    ];

    const json = exportToJSON(results);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].level).toBe('ERROR');
    expect(parsed[1].level).toBe('WARN');
  });

  test('formats JSON with indentation', () => {
    const results = [{ level: 'ERROR' }];
    const json = exportToJSON(results);

    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });

  test('handles empty array', () => {
    const json = exportToJSON([]);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([]);
  });

  test('handles complex nested objects', () => {
    const results = [
      {
        level: 'ERROR',
        examples: [
          { timestamp: '2026-03-15', logger: 'com.example.Test' }
        ],
        category: { type: 'network', severity: 'high' }
      }
    ];

    const json = exportToJSON(results);
    const parsed = JSON.parse(json);

    expect(parsed[0].examples).toHaveLength(1);
    expect(parsed[0].category.type).toBe('network');
  });
});

describe('exporter - generatePDFSummary', () => {
  const sampleSummary = {
    totalErrors: 100,
    totalWarnings: 50,
    uniqueErrors: 10,
    uniqueWarnings: 5
  };

  const sampleResults = [
    { level: 'ERROR', count: 25, message: 'Connection refused to server' },
    { level: 'ERROR', count: 20, message: 'Timeout after 30 seconds' },
    { level: 'WARN', count: 15, message: 'Slow response detected' },
    { level: 'ERROR', count: 10, message: 'Null pointer exception' }
  ];

  test('generates plain text summary', () => {
    const summary = generatePDFSummary(sampleSummary, sampleResults);

    expect(summary).toContain('AEM Log Analysis Summary');
    expect(summary).toContain('Total Errors: 100');
    expect(summary).toContain('Total Warnings: 50');
    expect(summary).toContain('Unique Errors: 10');
    expect(summary).toContain('Unique Warnings: 5');
  });

  test('includes top issues section', () => {
    const summary = generatePDFSummary(sampleSummary, sampleResults);

    expect(summary).toContain('Top Issues:');
    expect(summary).toContain('1. [ERROR] 25x - Connection refused to server');
    expect(summary).toContain('2. [ERROR] 20x - Timeout after 30 seconds');
  });

  test('limits issues to top 20', () => {
    const manyResults = Array(30).fill(null).map((_, i) => ({
      level: 'ERROR',
      count: i + 1,
      message: `Error message ${i}`
    }));

    const summary = generatePDFSummary(sampleSummary, manyResults);
    const lines = summary.split('\n');
    const issueLines = lines.filter(l => l.match(/^\d+\.\s/));

    expect(issueLines.length).toBeLessThanOrEqual(20);
  });

  test('handles empty results', () => {
    const summary = generatePDFSummary(sampleSummary, []);

    expect(summary).toContain('AEM Log Analysis Summary');
    expect(summary).toContain('Top Issues:');
  });

  test('handles missing summary fields', () => {
    const summary = generatePDFSummary({}, sampleResults);

    expect(summary).toContain('Total Errors: 0');
    expect(summary).toContain('Total Warnings: 0');
  });

  test('handles alternative field names', () => {
    const altSummary = { totalFiles: 3, totalEvents: 500 };
    const altResults = [
      { severity: 'ERROR', count: 10, title: 'Error title' }
    ];

    const summary = generatePDFSummary(altSummary, altResults);

    expect(summary).toContain('Total Files: 3');
    expect(summary).toContain('Total Events: 500');
    expect(summary).toContain('[ERROR] 10x - Error title');
  });

  test('truncates long messages to 80 chars', () => {
    const longMessage = 'A very long error message that exceeds eighty characters and should be truncated in the summary output';
    const results = [{ level: 'ERROR', count: 5, message: longMessage }];

    const summary = generatePDFSummary(sampleSummary, results);
    const issueLine = summary.split('\n').find(l => l.includes('truncated'));

    expect(issueLine.length).toBeLessThanOrEqual(100);
  });
});
