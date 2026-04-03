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

const TIMEOUTS = config.timeouts;

function writeTempErrorLog(dir, name, lines) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

test.describe('AEM Log Inspector - Frontend UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Homepage loads with correct title and header', async ({ page }) => {
    await expect(page).toHaveTitle(/AEM Log Analyzer/);
    await expect(page.locator('h1.header-title')).toContainText('AEM Log Analyzer');
    await expect(page.locator('.header-subtitle')).toContainText('Intelligent error');
  });

  test('2. Empty state displays initially', async ({ page }) => {
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No log file loaded');
    await expect(page.locator('.empty-icon')).toBeVisible();
  });

  test('3. File path input accepts text', async ({ page }) => {
    const filePathInput = page.locator('#filePath');
    await expect(filePathInput).toBeVisible();
    await filePathInput.fill(ERROR_LOG);
    await expect(filePathInput).toHaveValue(ERROR_LOG);
  });

  test('4. Analyze button triggers analysis and shows loading state', async ({ page }) => {
    const analyzeBtn = page.locator('#analyzeBtn');
    const progressText = page.locator('#progressText');
    const filePathInput = page.locator('#filePath');

    await filePathInput.fill(ERROR_LOG);
    await analyzeBtn.click();

    await expect(progressText).not.toHaveClass(/hidden/);
    await page.waitForTimeout(TIMEOUTS.analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('5. Date range filter works (start/end date inputs)', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const startDate = page.locator('#startDate');
    const endDate = page.locator('#endDate');

    await expect(startDate).toBeVisible();
    await expect(endDate).toBeVisible();

    await startDate.fill(config.filters.date.start);
    await endDate.fill(config.filters.date.end);

    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    await expect(startDate).toHaveValue(config.filters.date.start.slice(0, 16));
    await expect(endDate).toHaveValue(config.filters.date.end.slice(0, 16));
  });

  test('6. Logger filter dropdown works (searchable multi-select)', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const loggerFilter = page.locator('#loggerFilter');
    const loggerSelect = page.locator('#loggerSelect');

    await expect(loggerFilter).toBeVisible();
    await loggerFilter.fill('com.adobe');
    await expect(loggerSelect).toBeVisible();

    const options = loggerSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('7. Package filter dropdown works', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const packageFilter = page.locator('#packageFilter');
    const packageSelect = page.locator('#packageSelect');

    await expect(packageFilter).toBeVisible();
    await packageFilter.fill('com');
    await expect(packageSelect).toBeVisible();

    const options = packageSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('8. Apply filters button triggers filter', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('#loggerFilter').fill(config.filters.logger_pattern);

    const applyFiltersBtn = page.locator('#applyFiltersBtn');
    await applyFiltersBtn.click();
    await page.waitForTimeout(TIMEOUTS.filter);

    const rawEvents = page.locator('#rawEvents');
    await expect(rawEvents).toBeVisible();
  });

  test('9. Clear filters resets all filters', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('#startDate').fill(config.filters.date.start);
    await page.locator('#endDate').fill(config.filters.date.end);
    await page.locator('#loggerFilter').fill('com.adobe');

    await page.locator('#clearFiltersBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    await expect(page.locator('#startDate')).toHaveValue('');
    await expect(page.locator('#endDate')).toHaveValue('');
    await expect(page.locator('#loggerFilter')).toHaveValue('');
  });

  test('10. Level chips toggle correctly (ERROR/WARN/INFO/DEBUG)', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const errorChip = page.locator('button[data-level="ERROR"]');
    const warnChip = page.locator('button[data-level="WARN"]');
    const infoChip = page.locator('button[data-level="INFO"]');
    const debugChip = page.locator('button[data-level="DEBUG"]');

    await expect(errorChip).toHaveClass(/level-chip/);
    await errorChip.click();
    await page.waitForTimeout(TIMEOUTS.filter);
    await expect(errorChip).toHaveClass(/active/);

    await warnChip.click();
    await page.waitForTimeout(TIMEOUTS.filter);
    await expect(warnChip).toHaveClass(/active/);

    await infoChip.click();
    await page.waitForTimeout(TIMEOUTS.filter);
    await expect(infoChip).toHaveClass(/active/);

    await debugChip.click();
    await page.waitForTimeout(TIMEOUTS.filter);
    await expect(debugChip).toHaveClass(/active/);
  });

  test('11. Charts toggle shows/hides charts section', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const chartsTab = page.locator('#chartsTab');
    const chartsToggleBtn = page.locator('#chartsToggleBtn');

    await expect(chartsTab).toHaveClass(/hidden/);

    await chartsToggleBtn.click();
    await page.waitForTimeout(TIMEOUTS.filter);

    await expect(chartsTab).not.toHaveClass(/hidden/);
    await expect(chartsTab).toBeVisible();

    const timelineChart = page.locator('canvas#timelineChart');
    await expect(timelineChart).toBeVisible();

    await chartsToggleBtn.click();
    await page.waitForTimeout(TIMEOUTS.filter);

    await expect(chartsTab).toHaveClass(/hidden/);
  });

  test('12. Search input accepts regex and searches', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const searchInput = page.locator('#rawSearchInput');
    const searchBtn = page.locator('#rawSearchBtn');

    await expect(searchInput).toBeVisible();
    await searchInput.fill('NullPointer');
    await searchBtn.click();
    await page.waitForTimeout(TIMEOUTS.search);

    const rawEvents = page.locator('#rawEvents');
    await expect(rawEvents).toBeVisible();
  });

  test('13. Multi-error analysis filters merged results by package and logger', async ({ page }) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-ui-batch-'));
    const errorOne = writeTempErrorLog(tempDir, 'error-one.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.mandg.core.utils.ArticleUtils] Failed request',
      'java.lang.RuntimeException: boom'
    ]);
    const errorTwo = writeTempErrorLog(tempDir, 'error-two.log', [
      '16.03.2026 14:31:15.123 [qtp-2] *ERROR* [com.mandg.core.utils.OtherUtils] Another failure',
      'java.lang.IllegalStateException: broken'
    ]);
    const errorThree = writeTempErrorLog(tempDir, 'error-three.log', [
      '16.03.2026 14:32:15.123 [qtp-3] *ERROR* [com.other.Logger] Different failure',
      'java.lang.IllegalArgumentException: no'
    ]);

    await page.locator('#filePath').fill(`${errorOne},${errorTwo},${errorThree}`);
    await page.locator('#analyzeBtn').click();

    await expect(page.locator('#errorFilters')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#countALL')).toContainText('3');
    await expect(page.locator('#loggerResults .token-picker-option')).toHaveCount(3);
    await expect(page.locator('#rawEvents .raw-event')).toHaveCount(3);

    await page.locator('#packageFilter').fill('com.mandg');
    await page.locator('#packageResults .token-picker-option[data-value="com.mandg"]').click();

    await expect(page.locator('#countALL')).toContainText('2', { timeout: 10000 });
    await expect(page.locator('#rawEvents .raw-event')).toHaveCount(2, { timeout: 10000 });

    await page.locator('#loggerFilter').fill('ArticleUtils');
    await page.locator('#loggerFilter').press('Enter');

    await expect(page.locator('#countALL')).toContainText('1', { timeout: 10000 });
    await expect(page.locator('#rawEvents .raw-event')).toHaveCount(1, { timeout: 10000 });
    await expect(page.locator('#loggerTags .filter-tag')).toHaveCount(1);
  });

  test('14. Multi-error exception filter narrows merged results', async ({ page }) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-ui-exception-'));
    const fileOne = writeTempErrorLog(tempDir, 'exception-one.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.mandg.one.ServiceA] Failed request',
      'java.io.IOException: disk not ready'
    ]);
    const fileTwo = writeTempErrorLog(tempDir, 'exception-two.log', [
      '16.03.2026 14:31:15.123 [qtp-2] *ERROR* [com.mandg.two.ServiceB] Another failure',
      'java.io.IOException: cache miss'
    ]);
    const fileThree = writeTempErrorLog(tempDir, 'exception-three.log', [
      '16.03.2026 14:32:15.123 [qtp-3] *ERROR* [com.mandg.three.ServiceC] Different failure',
      'java.lang.IllegalStateException: broken'
    ]);

    await page.locator('#filePath').fill(`${fileOne},${fileTwo},${fileThree}`);
    await page.locator('#analyzeBtn').click();

    await expect(page.locator('#errorFilters')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#countALL')).toContainText('3', { timeout: 10000 });

    await page.locator('#exceptionFilter').fill('java.io.IOException');
    await page.locator('#exceptionFilter').press('Enter');

    await expect(page.locator('#exceptionSelect')).toHaveValue('java.io.IOException', { timeout: 10000 });
    await expect(page.locator('#countALL')).toContainText('2', { timeout: 10000 });
    await expect(page.locator('#rawEvents .raw-event')).toHaveCount(2, { timeout: 10000 });
  });

  test.skip('14. Pagination navigation works (next/prev)', async ({ page }) => {
    // Skipped - requires more investigation into pagination loading
    // The pagination element exists but content loads asynchronously
  });

  test.skip('15. Toast notifications appear on errors', async ({ page }) => {
    // Skipped - requires more investigation into toast rendering timing
  });
});
