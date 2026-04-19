const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  createTempErrorLog,
  awaitAnalysisComplete
} = require('./helpers');

test.describe('Pagination Tests', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-pagination-'));
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Analysis completes and shows results', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 50,
      warningCount: 10
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden();
  });

  test('Filter input is available after analysis', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 30,
      warningCount: 10
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const loggerFilter = page.locator('#loggerFilter');
    await expect(loggerFilter).toBeVisible();
  });

  test('Apply filters button works', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 30,
      warningCount: 10,
      loggers: ['com.example.Component']
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    await page.locator('#loggerFilter').fill('com.example.Component');
    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(1000);

    const progressHidden = await page.locator('#progressText').evaluate(el => el.classList.contains('hidden'));
    expect(progressHidden).toBe(true);
  });
});
