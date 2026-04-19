const fs = require('fs');
const os = require('os');
const path = require('path');

const { analyzeAllInOnePass } = require('../../src/services/errorLogService');
const {
  analyzeLogBatch,
  analyzeLogBatchFilters,
  getLogBatchPage,
  analyzeMultiError,
  analyzeMergedErrorFilters,
  countAndExtractMultiErrorEntries
} = require('../../src/services/multiErrorAnalysisService');

function writeTempFile(dir, name, content) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

describe('multi-error analysis helpers', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-batch-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('analyzeMultiError merges multiple error logs into a correlation payload', async () => {
    const errorFileA = writeTempFile(tempDir, 'multi_error_a.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Failed request'
    ].join('\n'));
    const errorFileB = writeTempFile(tempDir, 'multi_error_b.log', [
      '16.03.2026 14:31:15.123 [qtp-2] *WARN* [com.example.B] Slow request'
    ].join('\n'));

    const result = await analyzeMultiError([errorFileA, errorFileB], {});

    expect(result.logType).toBe('multi-error');
    expect(result.summary.totalFiles).toBe(2);
    expect(result.sources).toHaveLength(2);
    expect(result.correlation.incidents.length).toBeGreaterThan(0);
    expect(result.levelCounts.ALL).toBe(2);
    expect(result.loggers).toBeDefined();
    expect(result.threads).toBeDefined();
  });

  test('countAndExtractMultiErrorEntries paginates merged error events without preloading everything', async () => {
    const errorFileA = writeTempFile(tempDir, 'lazy_multi_error_a.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] First failure',
      '16.03.2026 14:31:15.123 [qtp-1] *WARN* [com.example.A] Second warning'
    ].join('\n'));
    const errorFileB = writeTempFile(tempDir, 'lazy_multi_error_b.log', [
      '16.03.2026 14:30:30.123 [qtp-2] *ERROR* [com.example.B] Third failure',
      '16.03.2026 14:31:30.123 [qtp-2] *WARN* [com.example.B] Fourth warning'
    ].join('\n'));

    const pageOne = await countAndExtractMultiErrorEntries([errorFileA, errorFileB], {}, 1, 2);
    const pageTwo = await countAndExtractMultiErrorEntries([errorFileA, errorFileB], {}, 2, 2);

    expect(pageOne.total).toBe(4);
    expect(pageOne.entries).toHaveLength(2);
    expect(pageTwo.entries).toHaveLength(2);
    expect(pageOne.levelCounts.ALL).toBe(4);
  });

  test('analyzeMultiError rejects mixed log types', async () => {
    const mixedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-multi-'));
    try {
      const errorFile = writeTempFile(mixedDir, 'strict_multi_error.log', [
        '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Failed request'
      ].join('\n'));
      const cdnFile = writeTempFile(mixedDir, 'strict_multi_cdn.log', JSON.stringify({
        timestamp: '2026-03-16T14:31:15.123Z',
        status: 503,
        method: 'GET',
        url: '/content/site',
        cache: 'MISS',
        host: 'example.com',
        pop: 'sfo',
        ttfb: 200,
        ttlb: 250
      }) + '\n');

      await expect(analyzeMultiError([errorFile, cdnFile], {})).rejects.toThrow(/error logs only/i);
    } finally {
      fs.rmSync(mixedDir, { recursive: true, force: true });
    }
  });

  test('analyzeMergedErrorFilters remains available through multiErrorAnalysisService', async () => {
    const errorFileA = writeTempFile(tempDir, 'filter_multi_error_a.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] First failure'
    ].join('\n'));
    const errorFileB = writeTempFile(tempDir, 'filter_multi_error_b.log', [
      '16.03.2026 14:31:15.123 [qtp-2] *WARN* [com.example.B] Second warning'
    ].join('\n'));

    const result = await analyzeMergedErrorFilters([errorFileA, errorFileB], {});

    expect(result.results).toHaveLength(2);
    expect(result.levelCounts.ALL).toBe(2);
  });

  test('analyzeLogBatch supports homogeneous CDN files', async () => {
    const cdnFileA = writeTempFile(tempDir, 'multi_cdn_a.log', [
      JSON.stringify({
        timestamp: '2026-03-16T14:30:15.123Z',
        status: 200,
        method: 'GET',
        url: '/content/site-a',
        cache: 'HIT',
        host: 'example.com',
        pop: 'dfw',
        cli_country: 'US',
        ttfb: 40,
        ttlb: 80
      }),
      JSON.stringify({
        timestamp: '2026-03-16T14:31:15.123Z',
        status: 503,
        method: 'GET',
        url: '/content/site-b',
        cache: 'MISS',
        host: 'example.com',
        pop: 'iad',
        cli_country: 'US',
        ttfb: 120,
        ttlb: 140
      })
    ].join('\n'));
    const cdnFileB = writeTempFile(tempDir, 'multi_cdn_b.log', [
      JSON.stringify({
        timestamp: '2026-03-16T14:32:15.123Z',
        status: 200,
        method: 'POST',
        url: '/bin/replicate',
        cache: 'PASS',
        host: 'author.example.com',
        pop: 'sin',
        cli_country: 'IN',
        ttfb: 90,
        ttlb: 100
      })
    ].join('\n'));

    const result = await analyzeLogBatch([cdnFileA, cdnFileB], {});
    const filtered = await analyzeLogBatchFilters([cdnFileA, cdnFileB], {});
    const page = await getLogBatchPage([cdnFileA, cdnFileB], { page: 1, perPage: 10 });

    expect(result.logType).toBe('batch');
    expect(result.batchLogType).toBe('cdn');
    expect(result.summary.byType.cdn.files).toBe(2);
    expect(filtered.batchLogType).toBe('cdn');
    expect(filtered.methods).toMatchObject({ GET: 2, POST: 1 });
    expect(filtered.cacheStatuses).toMatchObject({ HIT: 1, MISS: 1, PASS: 1 });
    expect(page.events).toHaveLength(3);
    expect(page.filterOptions.cacheStatuses).toEqual(['HIT', 'MISS', 'PASS']);
  });

  test('analyzeLogBatch supports mixed log types with generic batch output', async () => {
    const errorFile = writeTempFile(tempDir, 'mixed_error.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Failed request'
    ].join('\n'));
    const cdnFile = writeTempFile(tempDir, 'mixed_cdn.log', [
      JSON.stringify({
        timestamp: '2026-03-16T14:31:15.123Z',
        status: 403,
        method: 'GET',
        url: '/content/site',
        cache: 'ERROR',
        host: 'example.com',
        pop: 'sfo',
        cli_country: 'US',
        ttfb: 200,
        ttlb: 250
      })
    ].join('\n'));

    const result = await analyzeLogBatch([errorFile, cdnFile], {});
    const filtered = await analyzeLogBatchFilters([errorFile, cdnFile], { logType: 'cdn' });
    const page = await getLogBatchPage([errorFile, cdnFile], { page: 1, perPage: 10, logType: 'cdn' });

    expect(result.batchLogType).toBe('mixed');
    expect(result.sourceTypes).toMatchObject({ error: 1, cdn: 1 });
    expect(filtered.batchLogType).toBe('mixed');
    expect(filtered.logTypes).toMatchObject({ cdn: 1 });
    expect(page.total).toBe(1);
    expect(page.events[0].logType).toBe('cdn');
  });

  test('analyzeAllInOnePass returns package-scoped pod and exception counts', async () => {
    const errorFile = writeTempFile(tempDir, 'package_scope_error.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.one.ServiceA] com.example.one.ServiceA Failed request',
      'Caused by: java.lang.IllegalStateException: boom',
      '16.03.2026 14:31:15.123 [qtp-2] *WARN* [com.other.two.ServiceB] com.other.two.ServiceB Another request failed',
      'Caused by: java.lang.RuntimeException: other'
    ].join('\n'));

    const analysis = await analyzeAllInOnePass(errorFile);

    expect(analysis.packageThreads['com.example.one']).toMatchObject({ 'qtp-1': 1 });
    expect(analysis.packageThreads['com.other.two']).toMatchObject({ 'qtp-2': 1 });
    expect(analysis.packageExceptions['com.example.one']['java.lang.IllegalStateException']).toBeGreaterThanOrEqual(1);
    expect(analysis.packageExceptions['com.other.two']['java.lang.RuntimeException']).toBeGreaterThanOrEqual(1);
  });
});
