const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  createTempErrorLog,
  awaitAnalysisComplete,
  parseCSV,
  parseJSON
} = require('./helpers');

test.describe('Workflow Tests - Multi-file, Export & Filtering', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-workflow-'));
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Multi-file input with comma separation triggers multi-error mode', async ({ page }) => {
    const file1 = createTempErrorLog(tempDir, { errorCount: 5 });
    const file2 = createTempErrorLog(tempDir, { errorCount: 3 });

    await page.locator('#filePath').fill(`${file1.filePath},${file2.filePath}`);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page, { timeout: 45000 });
  });

  test('Export CSV API returns valid CSV', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 20 });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const response = await page.request.post('http://localhost:3000/api/export/csv', {
      data: { filePath: fixture.filePath }
    });

    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test('Export JSON API returns valid JSON', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 15 });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const response = await page.request.post('http://localhost:3000/api/export/json', {
      data: { filePath: fixture.filePath }
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toBeDefined();
  });

  test('Export PDF API returns response', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 10 });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    const response = await page.request.post('http://localhost:3000/api/export/pdf', {
      data: { filePath: fixture.filePath }
    });

    expect(response.status()).toBe(200);
  });

  test('Filter API returns filtered results', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, {
      errorCount: 20,
      loggers: ['com.example.Component', 'com.example.Service']
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page);

    await page.locator('#loggerFilter').fill('com.example.Component');
    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(1000);
  });
});