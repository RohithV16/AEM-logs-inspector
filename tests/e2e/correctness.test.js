const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(PROJECT_ROOT, config.logs.directory);
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
const CDN_LOG = path.join(TEST_DATA_DIR, config.logs.cdn);

const {
  createTempErrorLog,
  createTempRequestLog,
  createTempCdnLog
} = require('./helpers');

test.describe('Correctness Tests - Exact Value Assertions', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-correctness-'));
  });

  test.afterEach(async ({ page }) => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Error log API returns exact error/warning counts', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 10,
      warningCount: 5
    });

    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: fixture.filePath }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary.totalErrors).toBe(10);
    expect(body.summary.totalWarnings).toBe(5);
  });

  test('Request log API returns total requests count', async ({ page }) => {
    const fixture = createTempRequestLog(tempDir, {
      methodCounts: { GET: 5, POST: 3, PUT: 2 }
    });

    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: fixture.filePath }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary.totalRequests).toBe(20);
  });

  test('Request log API returns response time metrics', async ({ page }) => {
    const fixture = createTempRequestLog(tempDir, {
      methodCounts: { GET: 10 },
      statusBuckets: { 200: 6, 404: 2, 500: 2 }
    });

    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: fixture.filePath }
    });

    const body = await response.json();
    expect(body.summary.avgResponseTime).toBeDefined();
    expect(body.summary.p50ResponseTime).toBeDefined();
    expect(body.summary.p95ResponseTime).toBeDefined();
  });

  test('CDN log API returns cache hit ratio', async ({ page }) => {
    const fixture = createTempCdnLog(tempDir, {
      cacheStatusCounts: { HIT: 7, MISS: 3 }
    });

    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: fixture.filePath }
    });

    const body = await response.json();
    expect(body.summary.totalRequests).toBe(10);
    expect(body.summary.cacheHits).toBe(7);
    expect(body.summary.cacheMisses).toBe(3);
    expect(body.summary.cacheHitRatio).toBe('70.0');
  });

  test('CDN log API returns cache metrics', async ({ page }) => {
    const fixture = createTempCdnLog(tempDir, {
      cacheStatusCounts: { HIT: 5, MISS: 3 }
    });

    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: fixture.filePath }
    });

    const body = await response.json();
    expect(body.summary.cacheHits).toBe(5);
    expect(body.summary.cacheMisses).toBe(3);
    expect(body.summary.cacheHitRatio).toBe('62.5');
  });

  test('Filter API returns filtered results', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 20,
      loggers: ['com.example.Component', 'com.example.Service', 'com.example.Cache']
    });

    await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: fixture.filePath }
    });

    const response = await page.request.post('http://localhost:3000/api/filter', {
      data: {
        filePath: fixture.filePath,
        filters: { logger: 'com.example.Component' }
      }
    });

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Real error log validates with actual counts', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: ERROR_LOG }
    });

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.logType).toBe('error');
    expect(body.summary.totalErrors).toBeGreaterThan(0);
    expect(body.summary.uniqueErrors).toBeGreaterThan(0);
  });

  test('Real request log validates with actual counts', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: REQUEST_LOG }
    });

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.logType).toBe('request');
    expect(body.summary.totalRequests).toBeGreaterThan(0);
    expect(body.summary.avgResponseTime).toBeDefined();
  });

  test('Real CDN log validates with actual counts', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/analyze', {
      data: { filePath: CDN_LOG }
    });

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.logType).toBe('cdn');
    expect(body.summary.totalRequests).toBeGreaterThan(0);
    expect(String(body.summary.cacheHitRatio)).toBe('33.3');
    expect(body.summary.cacheHits).toBeDefined();
    expect(body.summary.cacheMisses).toBeDefined();
  });
});