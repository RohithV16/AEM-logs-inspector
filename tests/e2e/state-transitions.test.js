const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  createTempErrorLog,
  createTempRequestLog,
  awaitAnalysisComplete
} = require('./helpers');

test.describe('State Transitions Tests', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-state-'));
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Switching log types shows different results', async ({ page }) => {
    const errorFixture = createTempErrorLog(tempDir, { errorCount: 10 });
    await page.locator('#filePath').fill(errorFixture.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    const requestFixture = createTempRequestLog(tempDir, { methodCounts: { GET: 5 } });
    await page.locator('#filePath').fill(requestFixture.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden();
  });

  test('Re-analyzing replaces previous results', async ({ page }) => {
    const fixture1 = createTempErrorLog(tempDir, { errorCount: 10 });
    await page.locator('#filePath').fill(fixture1.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    const fixture2 = createTempErrorLog(tempDir, { errorCount: 5 });
    await page.locator('#filePath').fill(fixture2.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden();
  });

  test('Successful analyze replaces previous results', async ({ page }) => {
    const fixture1 = createTempErrorLog(tempDir, { errorCount: 10 });
    await page.locator('#filePath').fill(fixture1.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    const fixture2 = createTempErrorLog(tempDir, { errorCount: 5 });
    await page.locator('#filePath').fill(fixture2.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden();
  });
});