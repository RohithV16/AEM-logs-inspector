const {
  filterByDateRange,
  filterByLogger,
  filterByThread,
  filterByRegex,
  derivePackageGroup,
  createEmptyErrorFilterStats,
  buildErrorFilterStats
} = require('../../src/analyzer');

describe('analyzer - filterByDateRange', () => {
  const sampleEntries = [
    { timestamp: '2026-03-01T10:00:00.000Z', message: 'Error 1' },
    { timestamp: '2026-03-15T10:00:00.000Z', message: 'Error 2' },
    { timestamp: '2026-03-20T10:00:00.000Z', message: 'Error 3' },
    { timestamp: '2026-04-01T10:00:00.000Z', message: 'Error 4' }
  ];

  test('returns all entries when no date range specified', () => {
    const result = filterByDateRange(sampleEntries);
    expect(result.length).toBe(4);
  });

  test('filters by start date only', () => {
    const startDate = new Date('2026-03-15T00:00:00.000Z');
    const result = filterByDateRange(sampleEntries, startDate);
    expect(result.length).toBe(3);
  });

  test('filters by end date only', () => {
    const endDate = new Date('2026-03-16T00:00:00.000Z');
    const result = filterByDateRange(sampleEntries, null, endDate);
    expect(result.length).toBe(2);
  });

  test('filters by start and end date range', () => {
    const startDate = new Date('2026-03-10T00:00:00.000Z');
    const endDate = new Date('2026-03-21T00:00:00.000Z');
    const result = filterByDateRange(sampleEntries, startDate, endDate);
    expect(result.length).toBe(2);
  });

  test('returns empty array when no entries match', () => {
    const startDate = new Date('2026-05-01T00:00:00.000Z');
    const result = filterByDateRange(sampleEntries, startDate);
    expect(result.length).toBe(0);
  });

  test('handles entries without timestamp', () => {
    const entriesWithNull = [
      { message: 'Error 1' },
      { timestamp: '2026-03-15T10:00:00.000Z', message: 'Error 2' }
    ];
    const result = filterByDateRange(entriesWithNull, new Date('2026-03-10T00:00:00.000Z'));
    expect(result.length).toBe(1);
  });
});

describe('analyzer - filterByLogger', () => {
  const sampleEntries = [
    { logger: 'com.adobe.example.ClassA', message: 'Error 1' },
    { logger: 'com.adobe.example.ClassB', message: 'Error 2' },
    { logger: 'org.apache.sling.ClassC', message: 'Error 3' },
    { logger: 'com.other.ClassD', message: 'Error 4' }
  ];

  test('filters entries matching logger pattern', () => {
    const result = filterByLogger(sampleEntries, 'com.adobe.*');
    expect(result.entries.length).toBe(2);
    expect(result.error).toBeNull();
  });

  test('returns empty for non-matching pattern', () => {
    const result = filterByLogger(sampleEntries, 'notfound');
    expect(result.entries.length).toBe(0);
  });

  test('returns error for invalid regex', () => {
    const result = filterByLogger(sampleEntries, '(a+)+');
    expect(result.entries.length).toBe(0);
    expect(result.error).toBeDefined();
  });

  test('handles case-insensitive matching', () => {
    const result = filterByLogger(sampleEntries, 'ADOBE');
    expect(result.entries.length).toBe(2);
  });

  test('handles entries without logger', () => {
    const entriesWithNull = [
      { message: 'Error 1' },
      { logger: 'com.adobe.test', message: 'Error 2' }
    ];
    const result = filterByLogger(entriesWithNull, '.*');
    expect(result.entries.length).toBe(1);
  });
});

describe('analyzer - filterByThread', () => {
  const sampleEntries = [
    { thread: 'qtp-1', message: 'Error 1' },
    { thread: 'qtp-2', message: 'Error 2' },
    { thread: 'author-pod-1', message: 'Error 3' },
    { thread: 'publish-pod-1', message: 'Error 4' }
  ];

  test('filters entries matching thread pattern', () => {
    const result = filterByThread(sampleEntries, 'qtp.*');
    expect(result.entries.length).toBe(2);
    expect(result.error).toBeNull();
  });

  test('returns empty for non-matching pattern', () => {
    const result = filterByThread(sampleEntries, 'notfound');
    expect(result.entries.length).toBe(0);
  });

  test('returns error for invalid regex', () => {
    const result = filterByThread(sampleEntries, '***');
    expect(result.error).toBeDefined();
  });
});

describe('analyzer - filterByRegex', () => {
  const sampleEntries = [
    { message: 'Connection refused to server 192.168.1.1', level: 'ERROR' },
    { message: 'Connection timeout after 30s', level: 'ERROR' },
    { message: 'Successfully connected to database', level: 'INFO' },
    { message: 'Request completed in 150ms', level: 'INFO' }
  ];

  test('filters entries matching message regex', () => {
    const result = filterByRegex(sampleEntries, 'connection');
    expect(result.entries.length).toBe(2);
    expect(result.error).toBeNull();
  });

  test('returns empty for non-matching pattern', () => {
    const result = filterByRegex(sampleEntries, 'notfoundinthismessage');
    expect(result.entries.length).toBe(0);
  });

  test('returns error for catastrophic backtracking regex', () => {
    const result = filterByRegex(sampleEntries, '(a+)+');
    expect(result.error).toBeDefined();
  });

  test('handles case-insensitive matching', () => {
    const result = filterByRegex(sampleEntries, 'CONNECTION');
    expect(result.entries.length).toBe(2);
  });

  test('handles entries without message', () => {
    const entriesWithNull = [
      { level: 'ERROR' },
      { message: 'Valid message', level: 'ERROR' }
    ];
    const result = filterByRegex(entriesWithNull, '.*');
    expect(result.entries.length).toBe(1);
  });
});

describe('analyzer - filter functions', () => {
  test('filterByLogger handles empty pattern', () => {
    const entries = [{ logger: 'com.test.Logger', message: 'Error' }];
    const result = filterByLogger(entries, '');
    expect(result.entries.length).toBe(1);
  });

  test('filterByThread handles empty pattern', () => {
    const entries = [{ thread: 'qtp-1', message: 'Error' }];
    const result = filterByThread(entries, '');
    expect(result.entries.length).toBe(1);
  });

  test('filterByRegex handles empty pattern', () => {
    const entries = [{ message: 'Error message', level: 'ERROR' }];
    const result = filterByRegex(entries, '');
    expect(result.entries.length).toBe(1);
  });
});
