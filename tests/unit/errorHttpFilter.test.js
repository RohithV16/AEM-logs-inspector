const { parseLine, parseErrorRequestContext } = require('../../src/parser');
const { buildEntryFilter, analyzeAllInOnePass, extractExceptionNames } = require('../../src/services/errorLogService');
const { buildErrorFilterStats } = require('../../src/analyzer');
const fs = require('fs');
const os = require('os');
const path = require('path');

function writeTempFile(dir, name, content) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

describe('error log HTTP request filters', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-error-http-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('parseErrorRequestContext extracts method and path from error log request context', () => {
    expect(parseErrorRequestContext('208.127.46.120 [1770681547310] GET /editor.html/content/site HTTP/1.1')).toEqual({
      httpMethod: 'GET',
      requestPath: '/editor.html/content/site'
    });
  });

  test('parseLine keeps Java logger separate from HTTP request metadata', () => {
    const entry = parseLine('09.02.2026 23:59:07.330 [author-pod-1] *WARN* [208.127.46.120 [1770681547310] POST /bin/wcmcommand HTTP/1.1] com.example.Logger Something happened');

    expect(entry.logger).toBe('com.example.Logger');
    expect(entry.httpMethod).toBe('POST');
    expect(entry.requestPath).toBe('/bin/wcmcommand');
  });

  test('parseLine extracts logger from simple logger format', () => {
    const entry = parseLine('16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.mandg.core.utils.ArticleUtils] as without in from which the asset failed');

    expect(entry.logger).toBe('com.mandg.core.utils.ArticleUtils');
    expect(entry.message).toBe('as without in from which the asset failed');
  });

  test('buildEntryFilter supports httpMethod and requestPath for error logs', () => {
    const entry = parseLine('09.02.2026 23:59:07.330 [author-pod-1] *WARN* [208.127.46.120 [1770681547310] GET /content/site/page.html HTTP/1.1] com.example.Logger Something happened');
    const matchingFilter = buildEntryFilter({ httpMethod: 'GET', requestPath: '/content/site' });
    const nonMatchingFilter = buildEntryFilter({ httpMethod: 'POST' });

    expect(matchingFilter(entry)).toBe(true);
    expect(nonMatchingFilter(entry)).toBe(false);
  });

  test('error log analysis and stats expose http method distribution', async () => {
    const filePath = writeTempFile(tempDir, 'http_filter_error.log', [
      '09.02.2026 23:59:07.330 [author-pod-1] *WARN* [208.127.46.120 [1770681547310] GET /content/site/page.html HTTP/1.1] com.example.Logger One',
      '09.02.2026 23:59:08.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547311] POST /bin/wcmcommand HTTP/1.1] com.example.Logger Two'
    ].join('\n'));

    const analysis = await analyzeAllInOnePass(filePath);
    const stats = buildErrorFilterStats([
      parseLine('09.02.2026 23:59:07.330 [author-pod-1] *WARN* [208.127.46.120 [1770681547310] GET /content/site/page.html HTTP/1.1] com.example.Logger One'),
      parseLine('09.02.2026 23:59:08.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547311] POST /bin/wcmcommand HTTP/1.1] com.example.Logger Two')
    ]);

    expect(analysis.httpMethods).toMatchObject({ GET: 1, POST: 1 });
    expect(stats.httpMethods).toMatchObject({ GET: 1, POST: 1 });
  });

  test('extractExceptionNames correctly identifies Java exception patterns and excludes handleError', () => {
    const line = 'handleError (5)javax.jcr.InvalidItemStateException (1)org.apache.jackrabbit.oak.api.CommitFailedException (1)';
    const extracted = extractExceptionNames(line);

    expect(extracted).toContain('javax.jcr.InvalidItemStateException');
    expect(extracted).toContain('org.apache.jackrabbit.oak.api.CommitFailedException');
    expect(extracted).not.toContain('handleError');
  });

  test('exception extraction in message and stackTrace produces consistent results', async () => {
    const filePath = writeTempFile(tempDir, 'exception_extraction.log', [
      '09.02.2026 23:59:07.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547310] GET /content/site HTTP/1.1] com.example.Logger handleError (5)javax.jcr.InvalidItemStateException (1)org.apache.jackrabbit.oak.api.CommitFailedException'
    ].join('\n'));

    const analysis = await analyzeAllInOnePass(filePath);
    const entry = parseLine('09.02.2026 23:59:07.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547310] GET /content/site HTTP/1.1] com.example.Logger handleError (5)javax.jcr.InvalidItemStateException (1)org.apache.jackrabbit.oak.api.CommitFailedException');

    expect(Object.keys(analysis.exceptions)).toContain('javax.jcr.InvalidItemStateException');
    expect(Object.keys(analysis.exceptions)).toContain('org.apache.jackrabbit.oak.api.CommitFailedException');
    expect(Object.keys(analysis.exceptions)).not.toContain('handleError');

    const stats = buildErrorFilterStats([entry]);
    expect(Object.keys(stats.exceptions)).toContain('javax.jcr.InvalidItemStateException');
    expect(Object.keys(stats.exceptions)).toContain('org.apache.jackrabbit.oak.api.CommitFailedException');
  });

  test('buildEntryFilter exception filter matches extracted exceptions', () => {
    const entry = parseLine('09.02.2026 23:59:07.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547310] GET /content/site HTTP/1.1] com.example.Logger handleError (5)javax.jcr.InvalidItemStateException (1)org.apache.jackrabbit.oak.api.CommitFailedException');

    const filterByFullName = buildEntryFilter({ exception: 'javax.jcr.InvalidItemStateException' });
    expect(filterByFullName(entry)).toBe(true);

    const filterBySimpleName = buildEntryFilter({ exception: 'InvalidItemStateException' });
    expect(filterBySimpleName(entry)).toBe(true);

    const filterByNonExistent = buildEntryFilter({ exception: 'NonExistentException' });
    expect(filterByNonExistent(entry)).toBe(false);
  });
});

// Regression: ISSUE-003 — search should match across all fields, not just message
describe('error log search field coverage (ISSUE-003)', () => {
  test('buildEntryFilter search matches logger name', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [thread-1] *ERROR* [com.example.Component] Something went wrong');

    const filter = buildEntryFilter({ search: 'Component' });
    expect(filter(entry)).toBe(true);
  });

  test('buildEntryFilter search matches full logger package', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [thread-1] *ERROR* [com.example.Component] Something went wrong');

    const filter = buildEntryFilter({ search: 'com\\.example' });
    expect(filter(entry)).toBe(true);
  });

  test('buildEntryFilter search matches thread name', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [qtp-worker-42] *ERROR* [com.example.Component] Something went wrong');

    const filter = buildEntryFilter({ search: 'qtp-worker' });
    expect(filter(entry)).toBe(true);
  });

  test('buildEntryFilter search still matches message', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [thread-1] *ERROR* [com.example.Component] NullPointerException in handler');

    const filter = buildEntryFilter({ search: 'NullPointer' });
    expect(filter(entry)).toBe(true);
  });

  test('buildEntryFilter search returns false for non-matching term', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [thread-1] *ERROR* [com.example.Component] Something went wrong');

    const filter = buildEntryFilter({ search: 'NoSuchElementException' });
    expect(filter(entry)).toBe(false);
  });
});
