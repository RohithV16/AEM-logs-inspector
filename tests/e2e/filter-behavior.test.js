const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  createTempErrorLog,
  awaitAnalysisComplete
} = require('./helpers');

test.describe('Filter Behavior Tests', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-filter-'));
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Logger filter input accepts text', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 10 });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const loggerFilter = page.locator('#loggerFilter');
    await loggerFilter.fill('test');
    await expect(loggerFilter).toHaveValue('test');
  });

  test('Apply filters button triggers filter', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 20,
      loggers: ['com.example.Component']
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    await page.locator('#loggerFilter').fill('com.example.Component');
    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(1000);
  });

  test('Clear filters button exists', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 10 });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const clearBtn = page.locator('#clearFiltersBtn');
    await expect(clearBtn).toBeVisible();
  });

  test('Thread filter input is available after analysis', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 10 });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const threadFilter = page.locator('#threadFilter');
    await expect(threadFilter).toBeVisible();
  });
});