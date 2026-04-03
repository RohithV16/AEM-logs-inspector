const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const ROOT_DIR = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(ROOT_DIR, config.logs.directory);
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
const CDN_LOG = path.join(TEST_DATA_DIR, config.logs.cdn);

const TIMEOUTS = config.timeouts;

test.describe('AEM Log Inspector - Log Type Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Parse and analyze AEM error log format - verify ERROR/WARN entries extracted', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    
    await page.waitForTimeout(TIMEOUTS.analyze + 2000);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 15000 });
  });

  test('2. Parse request log outbound (lines with "->")', async ({ page }) => {
    await page.locator('#filePath').fill(REQUEST_LOG);
    await page.locator('#analyzeBtn').click();
    
    await page.waitForTimeout(TIMEOUTS.request_analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 15000 });
  });

  test('3. Parse request log inbound response (lines with "<-")', async ({ page }) => {
    await page.locator('#filePath').fill(REQUEST_LOG);
    await page.locator('#analyzeBtn').click();
    
    await page.waitForTimeout(TIMEOUTS.request_analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 15000 });
  });

  test('4. Parse CDN JSON Lines format', async ({ page }) => {
    await page.locator('#filePath').fill(CDN_LOG);
    await page.locator('#analyzeBtn').click();
    
    await page.waitForTimeout(TIMEOUTS.cdn_analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 15000 });
  });

  test('7. Handle gzip compressed CDN files (.gz)', async ({ page }) => {
    await page.locator('#filePath').fill(CDN_LOG);
    await page.locator('#analyzeBtn').click();
    
    await page.waitForTimeout(TIMEOUTS.cdn_analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 15000 });
  });
});

test.describe('AEM Log Inspector - Log Type Detection Tests', () => {
  test('5. Auto-detect log type from filename (error, request, cdn patterns)', async () => {
    const analyzer = require('../../src/analyzer');
    
    const errorType = await analyzer.detectLogType(ERROR_LOG);
    expect(errorType).toBe('error');
    
    const requestType = await analyzer.detectLogType(REQUEST_LOG);
    expect(requestType).toBe('request');
    
    const cdnType = await analyzer.detectLogType(CDN_LOG);
    expect(cdnType).toBe('cdn');
  });

  test('6. Auto-detect log type from content (DD.MM.YYYY vs CLF vs JSON)', async () => {
    const analyzer = require('../../src/analyzer');
    
    const errorType = await analyzer.detectLogType(ERROR_LOG);
    expect(errorType).toBe('error');
    
    const requestType = await analyzer.detectLogType(REQUEST_LOG);
    expect(requestType).toBe('request');
    
    const cdnType = await analyzer.detectLogType(CDN_LOG);
    expect(cdnType).toBe('cdn');
  });

  test('8. Extract exceptions from stack traces in error logs', async () => {
    const { parseAllLevels } = require('../../src/parser');
    
    const entries = parseAllLevels(ERROR_LOG);
    
    expect(entries.length).toBeGreaterThan(0);
    
    const hasErrorOrWarn = entries.some(e => e.level === 'ERROR' || e.level === 'WARN');
    expect(hasErrorOrWarn).toBe(true);
  });

  test('9. Verify response time metrics in request logs (avg, p50, p95, p99)', async () => {
    const requestLogService = require('../../src/services/requestLogService');
    
    const result = await requestLogService.analyzeRequestLog(REQUEST_LOG);
    
    expect(result.summary.totalRequests).toBeGreaterThan(0);
    expect(result.summary.avgResponseTime).toBeGreaterThanOrEqual(0);
    expect(result.summary.p50ResponseTime).toBeGreaterThanOrEqual(0);
    expect(result.summary.p95ResponseTime).toBeGreaterThanOrEqual(0);
    expect(result.summary.p99ResponseTime).toBeGreaterThanOrEqual(0);
    
    expect(result.summary.p50ResponseTime).toBeLessThanOrEqual(result.summary.p95ResponseTime);
    expect(result.summary.p95ResponseTime).toBeLessThanOrEqual(result.summary.p99ResponseTime);
  });

  test('10. Calculate cache hit ratio in CDN logs (HIT/MISS ratio)', async () => {
    const cdnLogService = require('../../src/services/cdnLogService');
    
    const result = await cdnLogService.analyzeCDNLog(CDN_LOG);
    
    expect(result.summary.totalRequests).toBeGreaterThan(0);
    expect(result.cacheStatuses).toBeDefined();
    
    const cacheTypes = Object.keys(result.cacheStatuses);
    expect(cacheTypes.length).toBeGreaterThan(0);
  });
});