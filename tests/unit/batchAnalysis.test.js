const fs = require('fs');
const os = require('os');
const path = require('path');

const { analyzeAllInOnePass } = require('../../src/services/errorLogService');
const {
  analyzeMultiError,
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-multi-error-'));
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

  test('analyzeAllInOnePass returns package-scoped pod and exception counts', async () => {
    const errorFile = writeTempFile(tempDir, 'package_scope_error.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.one.ServiceA] com.example.one.ServiceA Failed request',
      'Caused by: java.lang.IllegalStateException: boom',
      '16.03.2026 14:31:15.123 [qtp-2] *WARN* [com.other.two.ServiceB] com.other.two.ServiceB Another request failed',
      'Caused by: java.lang.RuntimeException: other'
    ].join('\n'));

    const analysis = await analyzeAllInOnePass(errorFile);

    expect(analysis.packageThreads['com.example']).toMatchObject({ 'qtp-1': 1 });
    expect(analysis.packageThreads['com.other']).toMatchObject({ 'qtp-2': 1 });
    expect(analysis.packageExceptions['com.example']['java.lang.IllegalStateException']).toBeGreaterThanOrEqual(1);
    expect(analysis.packageExceptions['com.other']['java.lang.RuntimeException']).toBeGreaterThanOrEqual(1);
  });
});
