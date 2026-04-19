const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { 
  createCloudManagerErrorLog, 
  createTempRequestLog,
  createTempCdnLog,
  createBatchFixtures,
  awaitAnalysisComplete,
  waitForRawEventsLoaded,
  awaitFilterApply
} = require('./helpers');

test.describe('Comprehensive Data Integrity Filters', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    page.on('response', async response => {
      if (response.url().includes('/api/logs/')) {
        try {
          const data = await response.json();
        } catch (e) {}
      }
    });
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-integrity-'));
    await page.goto('/');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ path: path.join(process.cwd(), `failure-${testInfo.title.replace(/\s+/g, '-')}.png`) });
    }
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  /* -------------------------------------------------------------------------- */
  /*  ERROR LOG SCENARIOS                                                       */
  /* -------------------------------------------------------------------------- */
  test.describe('Error Log Filters', () => {
    test('Verifies deep filtering logic for Cloud Manager errors', async ({ page }) => {
      const fixture = createCloudManagerErrorLog(tempDir, {
        errorCount: 15,
        pods: ['cm-p-author-primary', 'cm-p-author-secondary'],
        loggers: ['com.adobe.cq.MyService'],
        exceptions: ['java.lang.NullPointerException']
      });

      await page.locator('#filePath').fill(fixture.filePath);
      await page.locator('#analyzeBtn').click();
      await awaitAnalysisComplete(page);

      // 1. Verify Level Filter
      await page.locator('.level-chip[data-level="ERROR"]').click();
      await awaitFilterApply(page);
      const eventsCount = await page.locator('.raw-event').count();
      expect(eventsCount).toBeGreaterThan(0);

      // 2. Verify Pod Filter (Cloud format)
      await page.locator('#threadFilter').click();
      const podDropdown = await page.innerHTML('#threadSelect');
      expect(podDropdown).toContain('cm-p-author-primary');
      
      // 3. Verify Exception Filter
      await page.locator('#exceptionFilter').click();
      const exceptionDropdown = await page.innerHTML('#exceptionSelect');
      expect(exceptionDropdown).toContain('NullPointerException');

      // 4. Verify Package Grouping
      const packageOptions = await page.locator('#packageResults .token-picker-result').count().catch(() => 0);
      // If we use the tokens picker, results are in #packageResults
      // But let's check the global variable or the dropdown
      const packageTotalText = await page.evaluate(() => {
        return Object.keys(allPackages || {}).length;
      });
      expect(packageTotalText).toBeGreaterThan(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  REQUEST LOG SCENARIOS                                                     */
  /* -------------------------------------------------------------------------- */
  test.describe('Request Log Filters', () => {
    test('Verifies latency and status filters for request logs', async ({ page }) => {
      const fixture = createTempRequestLog(tempDir, {
        methodCounts: { GET: 10, POST: 5 },
        statusBuckets: { 200: 5, 404: 5, 500: 5 },
        avgLatency: 500
      });

      await page.locator('#filePath').fill(fixture.filePath);
      await page.locator('#analyzeBtn').click();
      await awaitAnalysisComplete(page);
      await waitForRawEventsLoaded(page);

      // 1. Verify Status Filter mapping
      await page.locator('#statusFilter').selectOption('200');
      await page.locator('#applyFiltersBtn').click();
      await awaitFilterApply(page);
      
      const visibleRows = await page.locator('.raw-event').count();
      expect(visibleRows).toBeGreaterThan(0);

      // 2. Verify Latency Range (Min/Max)
      await page.locator('#statusFilter').selectOption(''); // Clear status
      await page.locator('#minResponseTime').fill('100');
      await page.locator('#maxResponseTime').fill('1000');
      await page.locator('#applyFiltersBtn').click();
      await awaitFilterApply(page);
      
      const latencyFilterResults = await page.locator('.raw-event').count();
      expect(latencyFilterResults).toBeGreaterThan(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  CDN LOG SCENARIOS                                                         */
  /* -------------------------------------------------------------------------- */
  test.describe('CDN Log Filters', () => {
    test('Verifies cache hit and geographic filters for CDN logs', async ({ page }) => {
      const fixture = createTempCdnLog(tempDir, {
        cacheStatusCounts: { HIT: 8, MISS: 2 },
        countries: { US: 5, GB: 5 }
      });

      await page.locator('#filePath').fill(fixture.filePath);
      await page.locator('#analyzeBtn').click();
      await awaitAnalysisComplete(page);
      await waitForRawEventsLoaded(page);

      // 1. Verify Cache Filter
      await page.locator('#cacheStatusFilter').selectOption('HIT');
      await page.locator('#applyFiltersBtn').click();
      await awaitFilterApply(page);
      expect(await page.locator('.raw-event').count()).toBeGreaterThan(0);

      // 2. Verify Country Filter
      await page.locator('#cacheStatusFilter').selectOption(''); 
      await page.locator('#countryFilter').selectOption('US');
      await page.locator('#applyFiltersBtn').click();
      await awaitFilterApply(page);
      expect(await page.locator('.raw-event').count()).toBeGreaterThan(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  BATCH / COMBINED SCENARIOS                                                */
  /* -------------------------------------------------------------------------- */
  test.describe('Batch Mode Consistency', () => {
    test('Verifies that combined logs aggregate filters correctly', async ({ page }) => {
      const batch = createBatchFixtures(tempDir, 'error', 2, { errorCount: 10 });

      await page.locator('#filePath').fill(batch.input);
      await page.locator('#analyzeBtn').click();
      await awaitAnalysisComplete(page);
      await waitForRawEventsLoaded(page);

      // Verify that Pods from BOTH files appear in the filter
      await page.locator('#threadFilter').click();
      const dropdownHtml = await page.innerHTML('#threadSelect');
      expect(dropdownHtml).toContain('pod-batch-0');
      expect(dropdownHtml).toContain('pod-batch-1');
    });
  });
});
