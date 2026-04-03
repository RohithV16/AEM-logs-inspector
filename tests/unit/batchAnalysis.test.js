const fs = require('fs');
const os = require('os');
const path = require('path');

const { resolveAnalysisTargets } = require('../../src/utils/files');
const { analyzeAllInOnePass } = require('../../src/services/errorLogService');
const { analyzeBatch, countAndExtractBatchEntries } = require('../../src/services/batchAnalysisService');

function writeTempFile(dir, name, content) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

describe('batch analysis helpers', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-batch-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('resolveAnalysisTargets expands files from a directory', () => {
    writeTempFile(tempDir, 'author_error.log', '16.03.2026 14:30:15.123 [qtp] *ERROR* [com.example.A] Failed request\n');
    writeTempFile(tempDir, 'author_request.log', '16/Mar/2026:14:30:15 +0000 [123] -> GET /content/site HTTP/1.1 [pod1]\n');

    const files = resolveAnalysisTargets(tempDir);
    expect(files.length).toBe(2);
    expect(files.some(file => file.endsWith('author_error.log'))).toBe(true);
    expect(files.some(file => file.endsWith('author_request.log'))).toBe(true);
  });

  test('analyzeBatch merges multiple log types into a correlation payload', async () => {
    const errorFile = writeTempFile(tempDir, 'batch_error.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Failed request',
      'java.lang.RuntimeException: boom'
    ].join('\n'));
    const requestFile = writeTempFile(tempDir, 'batch_request.log', [
      '16/Mar/2026:14:31:15 +0000 [123] -> GET /content/site HTTP/1.1 [pod1]',
      '16/Mar/2026:14:31:16 +0000 [123] <- 500 text/html 123ms [pod1]'
    ].join('\n'));
    const cdnFile = writeTempFile(tempDir, 'batch_cdn.log', JSON.stringify({
      timestamp: '2026-03-16T14:32:15.123Z',
      status: 503,
      method: 'GET',
      url: '/content/site',
      cache: 'MISS',
      host: 'example.com',
      pop: 'sfo',
      ttfb: 200,
      ttlb: 250
    }) + '\n');

    const result = await analyzeBatch([errorFile, requestFile, cdnFile], {});

    expect(result.logType).toBe('batch');
    expect(result.summary.totalFiles).toBe(3);
    expect(result.summary.totalEvents).toBeGreaterThan(0);
    expect(result.sources).toHaveLength(3);
    expect(result.correlation.incidents.length).toBeGreaterThan(0);
    expect(result.events).toBeUndefined();
  });

  test('countAndExtractBatchEntries paginates merged batch events without preloading everything', async () => {
    const errorFile = writeTempFile(tempDir, 'lazy_batch_error.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] First failure',
      '16.03.2026 14:31:15.123 [qtp-1] *WARN* [com.example.A] Second warning'
    ].join('\n'));
    const requestFile = writeTempFile(tempDir, 'lazy_batch_request.log', [
      '16/Mar/2026:14:30:30 +0000 [123] -> GET /content/site HTTP/1.1 [pod1]',
      '16/Mar/2026:14:31:30 +0000 [123] <- 500 text/html 123ms [pod1]'
    ].join('\n'));

    const pageOne = await countAndExtractBatchEntries([errorFile, requestFile], {}, 1, 2);
    const pageTwo = await countAndExtractBatchEntries([errorFile, requestFile], {}, 2, 2);

    expect(pageOne.total).toBe(4);
    expect(pageOne.entries).toHaveLength(2);
    expect(pageTwo.entries).toHaveLength(2);
    expect(pageOne.entries[0].timestamp <= pageOne.entries[1].timestamp).toBe(true);
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
