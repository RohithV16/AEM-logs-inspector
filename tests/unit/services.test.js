const { categorizeError } = require('../../src/categorizer');
const { extractExceptionNames } = require('../../src/services/errorLogService');
const requestLogService = require('../../src/services/requestLogService');
const cdnLogService = require('../../src/services/cdnLogService');

describe('categorizer - categorizeError', () => {
  test('categorizes JCR errors', () => {
    const result = categorizeError('javax.jcr.InvalidItemStateException: message', 'com.adobe.Service');
    expect(result).toBe('JCR');
  });

  test('categorizes Sling errors', () => {
    const result = categorizeError('org.apache.sling.api.SlingException', '');
    expect(result).toBe('Sling');
  });

  test('categorizes Oak errors', () => {
    const result = categorizeError('org.apache.jackrabbit.oak.api.CommitFailedException', '');
    expect(result).toBe('Oak');
  });

  test('categorizes performance errors', () => {
    const result = categorizeError('Timeout after 30 seconds', '');
    expect(result).toBe('Performance');
  });

  test('categorizes security errors', () => {
    const result = categorizeError('User authentication failed', '');
    expect(result).toBe('Security');
  });

  test('categorizes replication errors', () => {
    const result = categorizeError('Replication failed for agent', '');
    expect(result).toBe('Replication');
  });

  test('categorizes workflow errors', () => {
    const result = categorizeError('Workflow processing error', '');
    expect(result).toBe('Workflow');
  });

  test('categorizes search errors', () => {
    const result = categorizeError('Query execution failed', '');
    expect(result).toBe('Search');
  });

  test('defaults to Other for unrecognized errors', () => {
    const result = categorizeError('Some random error message', '');
    expect(result).toBe('Other');
  });

  test('matches logger class patterns', () => {
    const result = categorizeError('Some error', 'org.apache.sling.api.ServletResolver');
    expect(result).toBe('Sling');
  });
});

describe('errorLogService - extractExceptionNames', () => {
  test('extracts simple exception names', () => {
    const line = 'java.lang.NullPointerException at line 42';
    const result = extractExceptionNames(line);
    expect(result).toContain('java.lang.NullPointerException');
  });

  test('extracts multiple exceptions', () => {
    const line = 'Caused by: java.io.IOException at Service.java:42 Caused by: java.lang.RuntimeException';
    const result = extractExceptionNames(line);
    expect(result).toContain('java.io.IOException');
    expect(result).toContain('java.lang.RuntimeException');
  });

  test('excludes common logger method names', () => {
    const line = 'handleError (5)java.lang.Exception (1)';
    const result = extractExceptionNames(line);
    expect(result).not.toContain('handleError');
  });

  test('handles exceptions with parentheses count notation', () => {
    const line = 'javax.jcr.InvalidItemStateException (1)org.apache.jackrabbit.oak.api.CommitFailedException (2)';
    const result = extractExceptionNames(line);
    expect(result).toContain('javax.jcr.InvalidItemStateException');
    expect(result).toContain('org.apache.jackrabbit.oak.api.CommitFailedException');
  });

  test('returns empty array for no exceptions', () => {
    const line = 'This is a normal log message without exceptions';
    const result = extractExceptionNames(line);
    expect(result).toEqual([]);
  });

  test('handles empty input', () => {
    expect(extractExceptionNames('')).toEqual([]);
    expect(extractExceptionNames(null)).toEqual([]);
  });
});

describe('requestLogService', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  let tempDir;
  let tempRequestLog;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-request-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('analyzeRequestLog parses request/response lines', async () => {
    tempRequestLog = path.join(tempDir, 'request.log');
    const content = [
      '29/Mar/2026:14:30:15 +0000 [12345] -> GET /content/site.html HTTP/1.1 [author-pod]',
      '29/Mar/2026:14:30:16 +0000 [12346] <- 200 text/html 150ms [author-pod]'
    ].join('\n');
    fs.writeFileSync(tempRequestLog, content, 'utf8');

    const result = await requestLogService.analyzeRequestLog(tempRequestLog);

    expect(result.summary.totalRequests).toBeGreaterThan(0);
    expect(result.methods).toBeDefined();
    expect(result.statuses).toBeDefined();
  });

  test('analyzeRequestLog handles empty file', async () => {
    tempRequestLog = path.join(tempDir, 'empty.log');
    fs.writeFileSync(tempRequestLog, '', 'utf8');

    const result = await requestLogService.analyzeRequestLog(tempRequestLog);

    expect(result.summary.totalRequests).toBe(0);
  });

  test('analyzeRequestLog calculates response time percentiles', async () => {
    tempRequestLog = path.join(tempDir, 'timing.log');
    const content = Array(100).fill(null).map((_, i) =>
      `29/Mar/2026:14:30:${String(i % 60).padStart(2, '0')} +0000 [${i}] <- 200 text/html ${100 + i}ms [pod]`
    ).join('\n');
    fs.writeFileSync(tempRequestLog, content, 'utf8');

    const result = await requestLogService.analyzeRequestLog(tempRequestLog);

    expect(result.summary.avgResponseTime).toBeGreaterThan(0);
    expect(result.summary.p50ResponseTime).toBeGreaterThanOrEqual(0);
    expect(result.summary.p95ResponseTime).toBeGreaterThanOrEqual(result.summary.p50ResponseTime);
    expect(result.summary.p99ResponseTime).toBeGreaterThanOrEqual(result.summary.p95ResponseTime);
  });
});

describe('cdnLogService', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  let tempDir;
  let tempCDNLog;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-cdn-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('analyzeCDNLog parses JSON lines format', async () => {
    tempCDNLog = path.join(tempDir, 'cdn.log');
    const content = [
      JSON.stringify({ timestamp: '2026-03-29T14:30:15.000Z', status: 200, method: 'GET', url: '/content/site', cache: 'HIT', host: 'example.com', pop: 'sfo', ttfb: 50, ttlb: 100 }),
      JSON.stringify({ timestamp: '2026-03-29T14:30:16.000Z', status: 200, method: 'GET', url: '/content/site', cache: 'MISS', host: 'example.com', pop: 'sfo', ttfb: 150, ttlb: 200 })
    ].join('\n');
    fs.writeFileSync(tempCDNLog, content, 'utf8');

    const result = await cdnLogService.analyzeCDNLog(tempCDNLog);

    expect(result.summary.totalRequests).toBe(2);
    expect(result.cacheStatuses).toBeDefined();
    expect(result.cacheStatuses.HIT).toBe(1);
    expect(result.cacheStatuses.MISS).toBe(1);
  });

  test('analyzeCDNLog handles empty file', async () => {
    tempCDNLog = path.join(tempDir, 'empty_cdn.log');
    fs.writeFileSync(tempCDNLog, '', 'utf8');

    const result = await cdnLogService.analyzeCDNLog(tempCDNLog);

    expect(result.summary.totalRequests).toBe(0);
  });

  test('analyzeCDNLog aggregates status codes', async () => {
    tempCDNLog = path.join(tempDir, 'status_codes.log');
    const content = [
      JSON.stringify({ timestamp: '2026-03-29T14:30:15.000Z', status: 200, method: 'GET', url: '/ok', cache: 'HIT', host: 'ex.com', pop: 'sfo', ttfb: 50, ttlb: 100 }),
      JSON.stringify({ timestamp: '2026-03-29T14:30:16.000Z', status: 404, method: 'GET', url: '/notfound', cache: 'MISS', host: 'ex.com', pop: 'sfo', ttfb: 10, ttlb: 10 }),
      JSON.stringify({ timestamp: '2026-03-29T14:30:17.000Z', status: 500, method: 'GET', url: '/error', cache: 'MISS', host: 'ex.com', pop: 'sfo', ttfb: 0, ttlb: 0 })
    ].join('\n');
    fs.writeFileSync(tempCDNLog, content, 'utf8');

    const result = await cdnLogService.analyzeCDNLog(tempCDNLog);

    expect(result.statuses[200]).toBe(1);
    expect(result.statuses[404]).toBe(1);
    expect(result.statuses[500]).toBe(1);
  });

  test('analyzeCDNLog calculates POP distribution', async () => {
    tempCDNLog = path.join(tempDir, 'pop_dist.log');
    const content = [
      JSON.stringify({ timestamp: '2026-03-29T14:30:15.000Z', status: 200, method: 'GET', url: '/1', cache: 'HIT', host: 'ex.com', pop: 'sfo', ttfb: 50, ttlb: 100 }),
      JSON.stringify({ timestamp: '2026-03-29T14:30:16.000Z', status: 200, method: 'GET', url: '/2', cache: 'HIT', host: 'ex.com', pop: 'sfo', ttfb: 50, ttlb: 100 }),
      JSON.stringify({ timestamp: '2026-03-29T14:30:17.000Z', status: 200, method: 'GET', url: '/3', cache: 'MISS', host: 'ex.com', pop: 'lax', ttfb: 50, ttlb: 100 })
    ].join('\n');
    fs.writeFileSync(tempCDNLog, content, 'utf8');

    const result = await cdnLogService.analyzeCDNLog(tempCDNLog);

    expect(result.pops).toBeDefined();
    expect(result.pops.sfo).toBe(2);
    expect(result.pops.lax).toBe(1);
  });
});
