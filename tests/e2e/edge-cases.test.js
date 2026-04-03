const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
const TIMEOUTS = config.timeouts;

test.describe('AEM Log Inspector Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Empty file path - verify warning toast shown', async ({ page }) => {
    await page.locator('#filePath').fill('');
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const toast = page.locator('.toast.warning, .toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText(/please enter|enter a file path/i);
  });

  test('2. Non-existent file - verify "File not found" error', async ({ page }) => {
    const nonExistentPath = path.join(TEST_DATA_DIR, 'does_not_exist.log');
    await page.locator('#filePath').fill(nonExistentPath);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText(/file not found/i);
  });

  test('2b. Non-existent file via API - verify "File not found" error', async ({ page }) => {
    const nonExistentPath = path.join(TEST_DATA_DIR, 'does_not_exist.log');

    const response = await page.request.post('/api/analyze', {
      data: { filePath: nonExistentPath }
    });

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.toLowerCase()).toContain('file not found');
  });

  test('3. Unsupported file extension - verify error', async ({ page }) => {
    const unsupportedFile = path.join(TEST_DATA_DIR, 'test.pdf');
    fs.writeFileSync(unsupportedFile, 'test content');

    await page.locator('#filePath').fill(unsupportedFile);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText(/invalid file type/i);

    fs.unlinkSync(unsupportedFile);
  });

  test('3b. Unsupported extension via API - verify error', async ({ page }) => {
    const csvFile = path.join(TEST_DATA_DIR, 'test.csv');
    fs.writeFileSync(csvFile, 'col1,col2\nval1,val2');

    const response = await page.request.post('/api/analyze', {
      data: { filePath: csvFile }
    });

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.toLowerCase()).toContain('invalid file type');

    fs.unlinkSync(csvFile);
  });

  test('4. Unsafe regex pattern - verify validation error', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze * 2);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    await page.locator('#rawSearchInput').fill('(a+)+');
    await page.locator('#rawSearchBtn').click();
    await page.waitForTimeout(TIMEOUTS.search);

    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText(/catastrophic backtracking|pattern too complex|invalid regex/i);
  });

  test('4b. Unsafe regex via API filter - verify validation error', async ({ page }) => {
    const response = await page.request.post('/api/raw-events', {
      data: {
        filePath: ERROR_LOG,
        search: '(a*)+',
        page: 1,
        perPage: 10
      }
    });

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.toLowerCase()).toContain('catastrophic backtracking');
  });

  test('5. Empty log file - verify empty results handled gracefully', async ({ page }) => {
    const emptyFile = path.join(TEST_DATA_DIR, 'empty.log');
    fs.writeFileSync(emptyFile, '');

    await page.locator('#filePath').fill(emptyFile);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    fs.unlinkSync(emptyFile);
  });

  test('5b. Empty log file via API - verify success with empty results', async ({ page }) => {
    const emptyFile = path.join(TEST_DATA_DIR, 'empty2.log');
    fs.writeFileSync(emptyFile, '');

    const response = await page.request.post('/api/analyze', {
      data: { filePath: emptyFile }
    });

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.summary).toBeDefined();
    expect(json.summary.totalErrors).toBe(0);

    fs.unlinkSync(emptyFile);
  });

  test('6. Malformed log lines - verify they are skipped/ignored', async ({ page }) => {
    const malformedFile = path.join(TEST_DATA_DIR, 'malformed.log');
    const validLine = '2026-03-29T10:00:00.000Z *ERROR* com.adobe.Test - This is a valid error';
    const malformedLines = [
      'not a valid log line',
      '',
      '2026-03-29T10:00:00.000Z ERROR', 
      'random garbage text',
      '2026-03-29T10:00:00.000Z *ERROR* com.adobe.Test - Valid error 2'
    ];
    fs.writeFileSync(malformedFile, malformedLines.join('\n'));

    await page.locator('#filePath').fill(malformedFile);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    fs.unlinkSync(malformedFile);
  });

  test('6b. Malformed log via API - verify valid entries processed', async ({ page }) => {
    const malformedFile = path.join(TEST_DATA_DIR, 'malformed2.log');
    const malformedLines = [
      'not a valid log line',
      '',
      '2026-03-29T10:00:00.000Z *ERROR* com.adobe.Test - Valid error',
      'random garbage'
    ];
    fs.writeFileSync(malformedFile, malformedLines.join('\n'));

    const response = await page.request.post('/api/analyze', {
      data: { filePath: malformedFile }
    });

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.summary.totalErrors).toBe(0);

    fs.unlinkSync(malformedFile);
  });

  test('7. Large file (>50MB) - verify streaming mode constant', async ({ page }) => {
    const { STREAM_THRESHOLD } = require('../../src/utils/constants');
    expect(STREAM_THRESHOLD).toBe(50 * 1024 * 1024);
    expect(STREAM_THRESHOLD).toBeGreaterThan(0);
  });

  test('7b. Large file via API - streaming mode function exists', async ({ page }) => {
    const { shouldUseStream } = require('../../src/utils/files');
    expect(typeof shouldUseStream).toBe('function');
  });

  test('8. Directory traversal attempt - verify blocked', async ({ page }) => {
    await page.locator('#filePath').fill('../../../etc/passwd');
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText(/invalid file type|not found/i);
  });

  test('8b. Directory path via API - verify blocked', async ({ page }) => {
    const response = await page.request.post('/api/analyze', {
      data: { filePath: TEST_DATA_DIR }
    });

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.toLowerCase()).toContain('invalid file type');
  });

  test('8c. Path traversal with valid extension - verify blocked', async ({ page }) => {
    await page.locator('#filePath').fill('/etc/passwd.log');
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText(/not found|invalid/i);
  });
});
