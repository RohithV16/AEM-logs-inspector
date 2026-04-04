const {
  filterByDateRange,
  filterByLogger,
  filterByThread,
  filterByRegex,
  filterByPackage,
  getTimelineData,
  getLoggerDistribution,
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

describe('analyzer - filterByPackage', () => {
  const sampleEntries = [
    { logger: 'com.adobe.example.ClassA', message: 'Error 1' },
    { logger: 'com.adobe.example.ClassB', message: 'Error 2' },
    { logger: 'org.apache.sling.ClassC', message: 'Error 3' },
    { logger: 'com.other.ClassD', message: 'Error 4' }
  ];

  test('filters entries matching package pattern', () => {
    const result = filterByPackage(sampleEntries, ['com.adobe']);
    expect(result.entries.length).toBe(2);
    expect(result.error).toBeNull();
  });

  test('returns all entries when no package patterns', () => {
    const result = filterByPackage(sampleEntries, []);
    expect(result.entries.length).toBe(4);
  });

  test('returns all entries when package patterns is null', () => {
    const result = filterByPackage(sampleEntries, null);
    expect(result.entries.length).toBe(4);
  });

  test('filters with multiple package patterns', () => {
    const result = filterByPackage(sampleEntries, ['com.adobe', 'org.apache']);
    expect(result.entries.length).toBe(3);
  });

  test('handles entries without logger', () => {
    const entriesWithNull = [
      { message: 'Error 1' },
      { logger: 'com.adobe.test', message: 'Error 2' }
    ];
    const result = filterByPackage(entriesWithNull, ['com.adobe']);
    expect(result.entries.length).toBe(1);
  });

  test('handles subpackage matching', () => {
    const entries = [
      { logger: 'com.adobe.aem.core.Service', message: 'Error' }
    ];
    const result = filterByPackage(entries, ['com.adobe.aem']);
    expect(result.entries.length).toBe(1);
  });
});

describe('analyzer - getTimelineData', () => {
  const sampleEntries = [
    { timestamp: '2026-03-16T14:30:00.000Z', level: 'ERROR', message: 'Error 1' },
    { timestamp: '2026-03-16T14:45:00.000Z', level: 'ERROR', message: 'Error 2' },
    { timestamp: '2026-03-16T15:00:00.000Z', level: 'WARN', message: 'Warning 1' },
    { timestamp: '2026-03-16T15:30:00.000Z', level: 'INFO', message: 'Info 1' }
  ];

  test('builds timeline from entries', () => {
    const result = getTimelineData(sampleEntries);
    expect(result['2026-03-16 14']).toBeDefined();
    expect(result['2026-03-16 14'].ERROR).toBe(2);
    expect(result['2026-03-16 14'].total).toBe(2);
  });

  test('counts WARN entries', () => {
    const result = getTimelineData(sampleEntries);
    expect(result['2026-03-16 15'].WARN).toBe(1);
  });

  test('handles entries without timestamp', () => {
    const entries = [
      { level: 'ERROR', message: 'Error' },
      { timestamp: '2026-03-16T14:00:00.000Z', level: 'ERROR', message: 'Error 2' }
    ];
    const result = getTimelineData(entries);
    expect(Object.keys(result).length).toBe(1);
  });

  test('handles empty entries array', () => {
    const result = getTimelineData([]);
    expect(result).toEqual({});
  });
});

describe('analyzer - getLoggerDistribution', () => {
  const sampleEntries = [
    { logger: 'com.adobe.example.ClassA', message: 'Error 1' },
    { logger: 'com.adobe.example.ClassA', message: 'Error 2' },
    { logger: 'com.adobe.example.ClassB', message: 'Error 3' },
    { logger: 'org.apache.sling.ClassC', message: 'Error 4' }
  ];

  test('distributes loggers by count', () => {
    const result = getLoggerDistribution(sampleEntries);
    expect(result.length).toBe(3);
  });

  test('sorts by count descending', () => {
    const result = getLoggerDistribution(sampleEntries);
    expect(result[0].count).toBe(2);
    expect(result[0].logger).toBe('com.adobe.example.ClassA');
  });

  test('handles entries without logger', () => {
    const entries = [
      { message: 'Error 1' },
      { logger: 'com.test.Logger', message: 'Error 2' }
    ];
    const result = getLoggerDistribution(entries);
    expect(result.length).toBe(1);
  });

  test('handles empty entries array', () => {
    const result = getLoggerDistribution([]);
    expect(result).toEqual([]);
  });
});

describe('analyzer - derivePackageGroup', () => {
  test('derives package from logger name', () => {
    const logger = 'com.adobe.example.ServiceImpl';
    expect(derivePackageGroup(logger)).toBe('com.adobe');
  });

  test('returns null for empty logger', () => {
    expect(derivePackageGroup(null)).toBeNull();
    expect(derivePackageGroup('')).toBeNull();
  });

  test('returns null for logger without package', () => {
    expect(derivePackageGroup('ServiceName')).toBeNull();
  });
});

describe('analyzer - createEmptyErrorFilterStats', () => {
  test('creates empty stats structure', () => {
    const stats = createEmptyErrorFilterStats();
    expect(stats).toHaveProperty('totalErrors');
    expect(stats).toHaveProperty('totalWarnings');
    expect(stats).toHaveProperty('uniqueErrors');
    expect(stats).toHaveProperty('uniqueWarnings');
    expect(stats).toHaveProperty('byLevel');
    expect(stats).toHaveProperty('byCategory');
    expect(stats).toHaveProperty('byPackage');
    expect(stats).toHaveProperty('byThread');
    expect(stats).toHaveProperty('hourlyHeatmap');
  });

  test('initializes all counts to zero', () => {
    const stats = createEmptyErrorFilterStats();
    expect(stats.totalErrors).toBe(0);
    expect(stats.totalWarnings).toBe(0);
    expect(stats.uniqueErrors).toBe(0);
    expect(stats.uniqueWarnings).toBe(0);
  });
});

describe('analyzer - buildErrorFilterStats', () => {
  test('builds stats from entries', () => {
    const entries = [
      { level: 'ERROR', message: 'Error 1', logger: 'com.adobe.test', thread: 'qtp-1' }
    ];
    const stats = buildErrorFilterStats(entries);
    expect(stats.totalErrors).toBe(1);
    expect(stats.byLevel.ERROR).toBe(1);
  });

  test('handles empty entries array', () => {
    const stats = buildErrorFilterStats([]);
    expect(stats.totalErrors).toBe(0);
  });
});
