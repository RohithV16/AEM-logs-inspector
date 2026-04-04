const { buildAdvancedMatcher, getEntryFieldValue } = require('../../src/services/searchBuilder');

describe('searchBuilder - getEntryFieldValue', () => {
  test('returns level field', () => {
    const entry = { level: 'ERROR' };
    expect(getEntryFieldValue(entry, 'level')).toBe('ERROR');
  });

  test('returns message field', () => {
    const entry = { message: 'Test message' };
    expect(getEntryFieldValue(entry, 'message')).toBe('Test message');
  });

  test('returns logger field', () => {
    const entry = { logger: 'com.example.Service' };
    expect(getEntryFieldValue(entry, 'logger')).toBe('com.example.Service');
  });

  test('returns thread field', () => {
    const entry = { thread: 'qtp-1' };
    expect(getEntryFieldValue(entry, 'thread')).toBe('qtp-1');
  });

  test('returns threadName as fallback for thread', () => {
    const entry = { threadName: 'qtp-1' };
    expect(getEntryFieldValue(entry, 'thread')).toBe('qtp-1');
  });

  test('returns package from logger', () => {
    const entry = { logger: 'com.example.Service.impl' };
    expect(getEntryFieldValue(entry, 'package')).toBe('com.example');
  });

  test('returns stackTrace for exception', () => {
    const entry = { stackTrace: 'at java.base/java.lang.NullPointerException' };
    expect(getEntryFieldValue(entry, 'exception')).toContain('NullPointerException');
  });

  test('returns message as fallback for exception', () => {
    const entry = { message: 'NullPointerException' };
    expect(getEntryFieldValue(entry, 'exception')).toBe('NullPointerException');
  });

  test('returns method field', () => {
    const entry = { method: 'GET' };
    expect(getEntryFieldValue(entry, 'method')).toBe('GET');
  });

  test('returns status as number', () => {
    const entry = { status: 200 };
    expect(getEntryFieldValue(entry, 'status')).toBe(200);
  });

  test('returns status as number from string', () => {
    const entry = { status: '200' };
    expect(getEntryFieldValue(entry, 'status')).toBe(200);
  });

  test('returns cache field', () => {
    const entry = { cache: 'HIT' };
    expect(getEntryFieldValue(entry, 'cache')).toBe('HIT');
  });

  test('returns clientCountry for country', () => {
    const entry = { clientCountry: 'US' };
    expect(getEntryFieldValue(entry, 'country')).toBe('US');
  });

  test('returns pop field', () => {
    const entry = { pop: 'DFW' };
    expect(getEntryFieldValue(entry, 'pop')).toBe('DFW');
  });

  test('returns host field', () => {
    const entry = { host: 'example.com' };
    expect(getEntryFieldValue(entry, 'host')).toBe('example.com');
  });

  test('returns responseTime as number', () => {
    const entry = { responseTime: 150 };
    expect(getEntryFieldValue(entry, 'responseTime')).toBe(150);
  });

  test('returns responseTime as number from string', () => {
    const entry = { responseTime: '150' };
    expect(getEntryFieldValue(entry, 'responseTime')).toBe(150);
  });

  test('returns ttfb as number', () => {
    const entry = { ttfb: 50 };
    expect(getEntryFieldValue(entry, 'ttfb')).toBe(50);
  });

  test('returns ttlb as number', () => {
    const entry = { ttlb: 100 };
    expect(getEntryFieldValue(entry, 'ttlb')).toBe(100);
  });

  test('returns requestId field', () => {
    const entry = { requestId: 'req-123' };
    expect(getEntryFieldValue(entry, 'requestId')).toBe('req-123');
  });

  test('returns sourceFile field', () => {
    const entry = { sourceFile: '/path/to/log.log' };
    expect(getEntryFieldValue(entry, 'sourceFile')).toBe('/path/to/log.log');
  });

  test('returns logType field', () => {
    const entry = { logType: 'error' };
    expect(getEntryFieldValue(entry, 'logType')).toBe('error');
  });

  test('returns severity or level as severity', () => {
    const entry = { severity: 'WARN' };
    expect(getEntryFieldValue(entry, 'severity')).toBe('WARN');
  });

  test('returns level as fallback for severity', () => {
    const entry = { level: 'ERROR' };
    expect(getEntryFieldValue(entry, 'severity')).toBe('ERROR');
  });

  test('returns timestamp field', () => {
    const entry = { timestamp: '2024-01-01 00:00:00' };
    expect(getEntryFieldValue(entry, 'timestamp')).toBe('2024-01-01 00:00:00');
  });

  test('returns url field', () => {
    const entry = { url: '/content/page' };
    expect(getEntryFieldValue(entry, 'url')).toBe('/content/page');
  });

  test('returns unknown field as-is', () => {
    const entry = { customField: 'customValue' };
    expect(getEntryFieldValue(entry, 'customField')).toBe('customValue');
  });

  test('handles missing field', () => {
    const entry = {};
    expect(getEntryFieldValue(entry, 'level')).toBeUndefined();
  });

  test('handles entry with undefined fields', () => {
    const entry = {};
    expect(getEntryFieldValue(entry, 'level')).toBeUndefined();
    expect(getEntryFieldValue(entry, 'message')).toBe('');
  });

  test('filters entries with contains operator (case insensitive)', () => {
    const rules = [{ field: 'message', operator: 'contains', value: 'error' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'An error occurred' })).toBe(true);
    expect(matcher({ message: 'An ERROR occurred' })).toBe(true);
    expect(matcher({ message: 'Some text only' })).toBe(false);
  });

  test('filters entries with contains operator', () => {
    const rules = [{ field: 'message', operator: 'contains', value: 'error' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'An error occurred' })).toBe(true);
    expect(matcher({ message: 'Some text' })).toBe(false);
  });
});

describe('searchBuilder - buildAdvancedMatcher', () => {
  test('returns matcher that matches all when no rules', () => {
    const matcher = buildAdvancedMatcher([]);
    const entry = { message: 'anything' };
    expect(matcher(entry)).toBe(true);
  });

  test('returns matcher that matches all when rules is not array', () => {
    const matcher = buildAdvancedMatcher(null);
    const entry = { message: 'anything' };
    expect(matcher(entry)).toBe(true);
  });

  test('filters entries with contains operator (case insensitive)', () => {
    const rules = [{ field: 'message', operator: 'contains', value: 'error' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'An error occurred' })).toBe(true);
    expect(matcher({ message: 'An ERROR occurred' })).toBe(true);
    expect(matcher({ message: 'Some text only' })).toBe(false);
  });

  test('filters entries with equals operator', () => {
    const rules = [{ field: 'level', operator: 'equals', value: 'ERROR' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ level: 'ERROR' })).toBe(true);
    expect(matcher({ level: 'WARN' })).toBe(false);
  });

  test('filters entries with startsWith operator', () => {
    const rules = [{ field: 'message', operator: 'startsWith', value: 'java' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'java.lang.NullPointerException' })).toBe(true);
    expect(matcher({ message: 'something java else' })).toBe(false);
  });

  test('filters entries with endsWith operator', () => {
    const rules = [{ field: 'message', operator: 'endsWith', value: 'Exception' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'NullPointerException' })).toBe(true);
    expect(matcher({ message: 'Exception handling' })).toBe(false);
  });

  test('filters entries with in operator', () => {
    const rules = [{ field: 'level', operator: 'in', value: 'ERROR,WARN' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ level: 'ERROR' })).toBe(true);
    expect(matcher({ level: 'WARN' })).toBe(true);
    expect(matcher({ level: 'INFO' })).toBe(false);
  });

  test('filters entries with gt operator', () => {
    const rules = [{ field: 'status', operator: 'gt', value: '400' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ status: 500 })).toBe(true);
    expect(matcher({ status: 200 })).toBe(false);
  });

  test('filters entries with gte operator', () => {
    const rules = [{ field: 'status', operator: 'gte', value: '400' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ status: 400 })).toBe(true);
    expect(matcher({ status: 399 })).toBe(false);
  });

  test('filters entries with lt operator', () => {
    const rules = [{ field: 'responseTime', operator: 'lt', value: '100' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ responseTime: 50 })).toBe(true);
    expect(matcher({ responseTime: 150 })).toBe(false);
  });

  test('filters entries with lte operator', () => {
    const rules = [{ field: 'responseTime', operator: 'lte', value: '100' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ responseTime: 100 })).toBe(true);
    expect(matcher({ responseTime: 101 })).toBe(false);
  });

  test('filters entries with regex operator', () => {
    const rules = [{ field: 'message', operator: 'regex', value: 'Error\\s+\\d+' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'Error 123' })).toBe(true);
    expect(matcher({ message: 'ErrorABC' })).toBe(false);
  });

  test('handles invalid regex gracefully', () => {
    const rules = [{ field: 'message', operator: 'regex', value: '[invalid' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'anything' })).toBe(false);
  });

  test('combines multiple rules with AND logic', () => {
    const rules = [
      { field: 'level', operator: 'equals', value: 'ERROR' },
      { field: 'message', operator: 'contains', value: 'NullPointer' }
    ];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ level: 'ERROR', message: 'NullPointerException' })).toBe(true);
    expect(matcher({ level: 'ERROR', message: 'Other error' })).toBe(false);
    expect(matcher({ level: 'WARN', message: 'NullPointerException' })).toBe(false);
  });

  test('ignores rules with missing field', () => {
    const rules = [{ field: '', operator: 'contains', value: 'error' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'anything' })).toBe(true);
  });

  test('ignores rules with missing value', () => {
    const rules = [{ field: 'message', operator: 'contains', value: '' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'anything' })).toBe(true);
  });

  test('ignores null/undefined rules', () => {
    const rules = [null, { field: 'level', operator: 'equals', value: 'ERROR' }, undefined];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ level: 'ERROR' })).toBe(true);
  });

  test('handles rule without operator (defaults to contains)', () => {
    const rules = [{ field: 'message', value: 'error' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ message: 'An error occurred' })).toBe(true);
  });

  test('is case insensitive for text operators', () => {
    const rules = [{ field: 'level', operator: 'equals', value: 'error' }];
    const matcher = buildAdvancedMatcher(rules);
    expect(matcher({ level: 'ERROR' })).toBe(true);
  });
});
