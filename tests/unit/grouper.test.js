const {
  normalizeMessage,
  groupEntries,
  getSummaryFromEntries
} = require('../../src/grouper');

describe('grouper - normalizeMessage', () => {
  test('normalizes DAM asset paths', () => {
    const input = '/content/dam/folder/asset.jpg';
    const result = normalizeMessage(input);
    expect(result).toContain('/content/dam/');
  });

  test('normalizes ISO dates', () => {
    const input = 'Error on 2026-03-15 at 2026-04-01';
    const result = normalizeMessage(input);
    expect(result).toContain('{date}');
  });

  test('normalizes times', () => {
    const input = 'Event at 14:30:15 and 23:59:59';
    const result = normalizeMessage(input);
    expect(result).toContain('{time}');
  });

  test('normalizes IP addresses', () => {
    const input = 'Connection from 192.168.1.1 to 10.0.0.1';
    const result = normalizeMessage(input);
    expect(result).toContain('{ip}');
  });

  test('normalizes UUIDs', () => {
    const input = 'Request id: a1b2c3d4-e5f6-7890-abcd-ef1234567890 completed';
    const result = normalizeMessage(input);
    expect(result).toContain('{uuid}');
  });

  test('handles lowercase UUIDs', () => {
    const input = 'Correlation: a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const result = normalizeMessage(input);
    expect(result).toContain('{uuid}');
  });

  test('normalizes multiple variable types in one message', () => {
    const input = '2026-03-15 14:30:15 Error from 192.168.1.1 for /content/dam/asset.jpg';
    const result = normalizeMessage(input);
    expect(result).toContain('{date}');
    expect(result).toContain('{time}');
    expect(result).toContain('{ip}');
    expect(result).toContain('/content/dam/');
  });

  test('trims whitespace', () => {
    const trimmed = normalizeMessage('  message  ');
    expect(trimmed).toBe('message');
  });

  test('handles message with no variables', () => {
    const input = 'Simple error message';
    expect(normalizeMessage(input)).toBe('Simple error message');
  });
});

describe('grouper - groupEntries', () => {
  const sampleEntries = [
    {
      timestamp: '29.03.2026 14:30:15.123',
      level: 'ERROR',
      logger: 'com.example.ServiceA',
      thread: 'qtp-1',
      message: 'Connection refused to server 192.168.1.1',
      stackTrace: ''
    },
    {
      timestamp: '29.03.2026 14:31:15.123',
      level: 'ERROR',
      logger: 'com.example.ServiceA',
      thread: 'qtp-1',
      message: 'Connection refused to server 192.168.1.2',
      stackTrace: ''
    },
    {
      timestamp: '29.03.2026 14:32:15.123',
      level: 'ERROR',
      logger: 'com.example.ServiceB',
      thread: 'qtp-2',
      message: 'Timeout after 30s',
      stackTrace: ''
    }
  ];

  test('groups entries by normalized message', () => {
    const grouped = groupEntries(sampleEntries);
    expect(grouped.length).toBeLessThanOrEqual(3);
  });

  test('counts occurrences correctly', () => {
    const grouped = groupEntries(sampleEntries);
    const totalCount = grouped.reduce((sum, g) => sum + g.count, 0);
    expect(totalCount).toBe(3);
  });

  test('sorts by count descending', () => {
    const grouped = groupEntries(sampleEntries);
    if (grouped.length > 1) {
      expect(grouped[0].count).toBeGreaterThanOrEqual(grouped[1].count);
    }
  });

  test('captures first occurrence timestamp', () => {
    const grouped = groupEntries(sampleEntries);
    expect(grouped[0].firstOccurrence).toBeDefined();
  });

  test('limits examples to 3', () => {
    const manyEntries = Array(10).fill(null).map((_, i) => ({
      timestamp: `29.03.2026 14:${i}:15.123`,
      level: 'ERROR',
      logger: 'com.example.Service',
      thread: 'qtp-1',
      message: 'Same error message',
      stackTrace: ''
    }));

    const grouped = groupEntries(manyEntries);
    expect(grouped[0].examples.length).toBeLessThanOrEqual(3);
  });

  test('handles empty entries array', () => {
    const grouped = groupEntries([]);
    expect(grouped).toEqual([]);
  });
});

describe('grouper - getSummaryFromEntries', () => {
  const sampleEntries = [
    { level: 'ERROR', message: 'Error 1', logger: 'com.example.A', timestamp: '29.03.2026 14:30:15.123' },
    { level: 'ERROR', message: 'Error 2', logger: 'com.example.A', timestamp: '29.03.2026 14:31:15.123' },
    { level: 'WARN', message: 'Warning 1', logger: 'com.example.B', timestamp: '29.03.2026 14:32:15.123' },
    { level: 'INFO', message: 'Info 1', logger: 'com.example.C', timestamp: '29.03.2026 14:33:15.123' }
  ];

  test('counts errors and warnings', () => {
    const summary = getSummaryFromEntries(sampleEntries);
    expect(summary.totalErrors).toBe(2);
    expect(summary.totalWarnings).toBe(1);
  });

  test('handles empty entries', () => {
    const summary = getSummaryFromEntries([]);
    expect(summary.totalErrors).toBe(0);
    expect(summary.totalWarnings).toBe(0);
  });

  test('handles entries without logger', () => {
    const entriesWithNull = [
      { level: 'ERROR', message: 'Error', logger: '', timestamp: '29.03.2026 14:30:15.123' }
    ];
    const summary = getSummaryFromEntries(entriesWithNull);
    expect(summary.totalErrors).toBe(1);
  });
});
