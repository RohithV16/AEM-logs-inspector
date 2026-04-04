const fs = require('fs');
const os = require('os');
const path = require('path');
const { extractExceptionNames, matchesExceptionFilter, derivePackageGroup, buildEntryFilter, countMatchingEntries, countMatchingEntriesWithLevels } = require('../../src/services/errorLogService');
const { clearCache } = require('../../src/utils/analysisCache');

describe('errorLogService - extractExceptionNames', () => {
  test('extracts exception names from message', () => {
    const text = 'javax.jcr.InvalidItemStateException occurred';
    const result = extractExceptionNames(text);
    expect(result).toContain('javax.jcr.InvalidItemStateException');
  });

  test('extracts multiple exceptions', () => {
    const text = 'Caused by: java.io.IOException at Service.java:42 Caused by: java.lang.RuntimeException';
    const result = extractExceptionNames(text);
    expect(result).toContain('java.io.IOException');
    expect(result).toContain('java.lang.RuntimeException');
  });

  test('extracts common exception types', () => {
    const text = 'NullPointerException IllegalStateException ArrayIndexOutOfBoundsException';
    const result = extractExceptionNames(text);
    expect(result).toContain('NullPointerException');
    expect(result).toContain('IllegalStateException');
    expect(result).toContain('ArrayIndexOutOfBoundsException');
  });

  test('deduplicates exceptions', () => {
    const text = 'NullPointerException NullPointerException NullPointerException';
    const result = extractExceptionNames(text);
    expect(result.filter(n => n === 'NullPointerException').length).toBe(1);
  });

  test('handles empty input', () => {
    expect(extractExceptionNames('')).toEqual([]);
    expect(extractExceptionNames(null)).toEqual([]);
    expect(extractExceptionNames(undefined)).toEqual([]);
  });

  test('handles text without exceptions', () => {
    const text = 'This is a normal log message';
    const result = extractExceptionNames(text);
    expect(result).toEqual([]);
  });

  test('extracts nested exception names', () => {
    const text = 'org.apache.sling.api.SlingException: message';
    const result = extractExceptionNames(text);
    expect(result).toContain('org.apache.sling.api.SlingException');
  });
});

describe('errorLogService - matchesExceptionFilter', () => {
  test('returns true when exception matches', () => {
    const entry = { message: 'NullPointerException occurred' };
    expect(matchesExceptionFilter(entry, 'NullPointerException')).toBe(true);
  });

  test('returns true for simple name match', () => {
    const entry = { message: 'javax.jcr.InvalidItemStateException occurred' };
    expect(matchesExceptionFilter(entry, 'InvalidItemStateException')).toBe(true);
  });

  test('returns true for partial match', () => {
    const entry = { message: 'ItemStateException occurred' };
    expect(matchesExceptionFilter(entry, 'ItemState')).toBe(true);
  });

  test('returns true when exception in stack trace', () => {
    const entry = {
      message: 'Error processing request',
      stackTrace: 'at java.base/java.lang.NullPointerException'
    };
    expect(matchesExceptionFilter(entry, 'NullPointerException')).toBe(true);
  });

  test('returns true when no exception filter specified', () => {
    const entry = { message: 'Some message' };
    expect(matchesExceptionFilter(entry, null)).toBe(true);
    expect(matchesExceptionFilter(entry, '')).toBe(true);
  });

  test('is case insensitive', () => {
    const entry = { message: 'NULLPOINTEREXCEPTION occurred' };
    expect(matchesExceptionFilter(entry, 'NullPointerException')).toBe(true);
  });
});

describe('errorLogService - buildEntryFilter', () => {
  test('filters by level', () => {
    const filter = buildEntryFilter({ level: 'ERROR' });
    expect(filter({ level: 'ERROR' })).toBe(true);
    expect(filter({ level: 'WARN' })).toBe(false);
  });

  test('filters by search regex', () => {
    const filter = buildEntryFilter({ search: 'error' });
    expect(filter({ message: 'An error occurred' })).toBe(true);
    expect(filter({ message: 'Success' })).toBe(false);
  });

  test('handles invalid regex gracefully', () => {
    const filter = buildEntryFilter({ search: '[invalid' });
    expect(filter({ message: 'Anything' })).toBe(true);
  });

  test('filters by from date', () => {
    const filter = buildEntryFilter({ from: '2026-03-16T14:00:00' });
    expect(filter({ timestamp: '16.03.2026 14:30:15.123', message: 'e' })).toBe(true);
    expect(filter({ timestamp: '16.03.2026 13:00:00.000', message: 'e' })).toBe(false);
  });

  test('filters by to date', () => {
    const filter = buildEntryFilter({ to: '2026-03-16T15:00:00' });
    expect(filter({ timestamp: '16.03.2026 14:30:15.123', message: 'e' })).toBe(true);
    expect(filter({ timestamp: '16.03.2026 16:00:00.000', message: 'e' })).toBe(false);
  });

  test('filters by logger', () => {
    const filter = buildEntryFilter({ logger: 'com.example.Service' });
    expect(filter({ logger: 'com.example.Service' })).toBe(true);
  });

  test('filters by thread', () => {
    const filter = buildEntryFilter({ thread: 'qtp-1' });
    expect(filter({ thread: 'qtp-1' })).toBe(true);
    expect(filter({ thread: 'qtp-2' })).toBe(false);
  });

  test('filters by package', () => {
    const filter = buildEntryFilter({ package: ['com.example'] });
    expect(filter({ logger: 'com.example.Service' })).toBe(true);
    expect(filter({ logger: 'com.other.Service' })).toBe(false);
  });

  test('filters by httpMethod', () => {
    const filter = buildEntryFilter({ httpMethod: 'GET' });
    expect(filter({ httpMethod: 'GET' })).toBe(true);
    expect(filter({ httpMethod: 'POST' })).toBe(false);
  });

  test('filters by requestPath', () => {
    const filter = buildEntryFilter({ requestPath: '/api/users' });
    expect(filter({ requestPath: '/api/users/123' })).toBe(true);
    expect(filter({ requestPath: '/api/posts' })).toBe(false);
  });

  test('filters by exception', () => {
    const filter = buildEntryFilter({ exception: 'NullPointerException' });
    expect(filter({ message: 'NullPointerException' })).toBe(true);
    expect(filter({ message: 'Other error' })).toBe(false);
  });

  test('filters by category', () => {
    const filter = buildEntryFilter({ category: 'JCR' });
    expect(filter({ message: 'javax.jcr.InvalidItemStateException', logger: '' })).toBe(true);
    expect(filter({ message: 'Other error', logger: '' })).toBe(false);
  });

  test('combines multiple filters with AND logic', () => {
    const filter = buildEntryFilter({ level: 'ERROR', logger: 'com.example' });
    expect(filter({ level: 'ERROR', logger: 'com.example.Service' })).toBe(true);
    expect(filter({ level: 'ERROR', logger: 'com.other.Service' })).toBe(false);
    expect(filter({ level: 'WARN', logger: 'com.example.Service' })).toBe(false);
  });

  test('handles ALL level', () => {
    const filter = buildEntryFilter({ level: 'ALL' });
    expect(filter({ level: 'ERROR' })).toBe(true);
    expect(filter({ level: 'WARN' })).toBe(true);
    expect(filter({ level: 'INFO' })).toBe(true);
  });
});

describe('errorLogService - countMatchingEntries', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  let tempDir;
  let tempErrorLog;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-error-count-'));
    tempErrorLog = path.join(tempDir, 'error.log');
    const content = [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Error 1',
      '16.03.2026 14:31:15.123 [qtp-1] *ERROR* [com.example.A] Error 2',
      '16.03.2026 14:32:15.123 [qtp-2] *WARN* [com.example.B] Warning 1',
      '16.03.2026 14:33:15.123 [qtp-2] *INFO* [com.example.B] Info 1'
    ].join('\n');
    fs.writeFileSync(tempErrorLog, content, 'utf8');
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    clearCache();
  });

  test('counts all entries with no filters', async () => {
    const count = await countMatchingEntries(tempErrorLog, {});
    expect(count).toBe(4);
  });

  test('counts entries filtered by level', async () => {
    const count = await countMatchingEntries(tempErrorLog, { level: 'ERROR' });
    expect(count).toBe(2);
  });
});

describe('errorLogService - countMatchingEntriesWithLevels', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  let tempDir;
  let tempErrorLog;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-error-levels-'));
    tempErrorLog = path.join(tempDir, 'error.log');
    const content = [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Error 1',
      '16.03.2026 14:31:15.123 [qtp-1] *ERROR* [com.example.A] Error 2',
      '16.03.2026 14:32:15.123 [qtp-2] *WARN* [com.example.B] Warning 1',
      '16.03.2026 14:33:15.123 [qtp-2] *INFO* [com.example.B] Info 1'
    ].join('\n');
    fs.writeFileSync(tempErrorLog, content, 'utf8');
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    clearCache();
  });

  test('counts entries with default levels', async () => {
    const count = await countMatchingEntriesWithLevels(tempErrorLog);
    expect(count).toBe(3);
  });

  test('counts entries with custom levels', async () => {
    const count = await countMatchingEntriesWithLevels(tempErrorLog, ['ERROR']);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('counts entries with multiple custom levels', async () => {
    const count = await countMatchingEntriesWithLevels(tempErrorLog, ['ERROR', 'WARN']);
    expect(count).toBe(3);
  });
});
