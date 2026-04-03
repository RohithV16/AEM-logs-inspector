const { parseLine, parseErrorRequestContext } = require('../../src/parser');
const { buildEntryFilter, analyzeAllInOnePass } = require('../../src/services/errorLogService');
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
});
