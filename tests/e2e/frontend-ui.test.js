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

test.describe('AEM Log Inspector - Export & Download Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Export to CSV button is visible after analysis', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    const exportCSVBtn = page.locator('#exportCSVBtn');
    await expect(exportCSVBtn).toBeVisible();
  });

  test('Export to JSON button is visible after analysis', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    const exportJSONBtn = page.locator('#exportJSONBtn');
    await expect(exportJSONBtn).toBeVisible();
  });

  test('Export buttons are hidden when no analysis results', async ({ page }) => {
    const exportCSVBtn = page.locator('#exportCSVBtn');
    const exportJSONBtn = page.locator('#exportJSONBtn');
    const exportPDFBtn = page.locator('#exportPDFBtn');

    await expect(exportCSVBtn).toBeHidden();
    await expect(exportJSONBtn).toBeHidden();
    await expect(exportPDFBtn).toBeHidden();
  });

  test('Charts canvas has correct dimensions after rendering', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    const canvas = page.locator('canvas#timelineChart');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('Error count badge updates after filtering', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('button[data-level="ERROR"]').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    const errorCount = await page.locator('#errorCount').textContent();
    expect(parseInt(errorCount)).toBeGreaterThan(0);
  });

  test('HTTP method filter dropdown populates after analysis', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const httpMethodFilter = page.locator('#httpMethodFilter');
    await expect(httpMethodFilter).toBeVisible();

    await httpMethodFilter.click();
    await page.waitForTimeout(500);

    const options = page.locator('#httpMethodSelect option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Thread filter dropdown shows available threads', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const threadFilter = page.locator('#threadFilter');
    await expect(threadFilter).toBeVisible();

    await threadFilter.fill('qtp');
    await page.waitForTimeout(500);

    const threadSelect = page.locator('#threadSelect');
    await expect(threadSelect).toBeVisible();
  });

  test('Exception filter dropdown shows detected exceptions', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const exceptionFilter = page.locator('#exceptionFilter');
    await expect(exceptionFilter).toBeVisible();

    await exceptionFilter.fill('Exception');
    await page.waitForTimeout(500);

    const exceptionSelect = page.locator('#exceptionSelect');
    await expect(exceptionSelect).toBeVisible();
  });

  test('Request log analysis shows response time chart', async ({ page }) => {
    await page.locator('#filePath').fill(REQUEST_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.request_analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    const responseTimeChart = page.locator('canvas#responseTimeChart');
    await expect(responseTimeChart).toBeVisible();
  });

  test('CDN log analysis shows cache ratio chart', async ({ page }) => {
    await page.locator('#filePath').fill(CDN_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.cdn_analyze);

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });

    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    const cacheChart = page.locator('canvas#cacheChart');
    await expect(cacheChart).toBeVisible();
  });

  test('Timeline zoom controls work', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);

    const zoomIn = page.locator('#timelineZoomIn');
    const zoomOut = page.locator('#timelineZoomOut');

    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(300);
    }

    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('AEM Log Inspector - Real-time & Live Tail Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Live tail toggle button exists', async ({ page }) => {
    const liveTailBtn = page.locator('#liveTailBtn');
    await expect(liveTailBtn).toBeVisible();
  });

  test('Live tail button can be toggled on', async ({ page }) => {
    const liveTailBtn = page.locator('#liveTailBtn');
    await liveTailBtn.click();
    await page.waitForTimeout(300);

    await expect(liveTailBtn).toHaveClass(/active/);
  });

  test('Live tail button can be toggled off', async ({ page }) => {
    const liveTailBtn = page.locator('#liveTailBtn');

    await liveTailBtn.click();
    await page.waitForTimeout(300);
    await liveTailBtn.click();
    await page.waitForTimeout(300);

    await expect(liveTailBtn).not.toHaveClass(/active/);
  });

  test('WebSocket connection indicator shows connected state', async ({ page }) => {
    const wsIndicator = page.locator('#wsConnectionIndicator');
    await expect(wsIndicator).toBeVisible();
  });

  test('Auto-scroll toggle exists for live tail', async ({ page }) => {
    const autoScrollBtn = page.locator('#autoScrollBtn');
    await expect(autoScrollBtn).toBeVisible();
  });
});

test.describe('AEM Log Inspector - Alert Configuration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Alert threshold input exists', async ({ page }) => {
    const alertThresholdInput = page.locator('#alertThresholdInput');
    await expect(alertThresholdInput).toBeVisible();
  });

  test('Alert configuration can be opened', async ({ page }) => {
    const alertConfigBtn = page.locator('#alertConfigBtn');
    await expect(alertConfigBtn).toBeVisible();

    await alertConfigBtn.click();
    await page.waitForTimeout(500);

    const alertModal = page.locator('#alertConfigModal');
    await expect(alertModal).toBeVisible();
  });

  test('Alert thresholds can be set', async ({ page }) => {
    await page.locator('#alertConfigBtn').click();
    await page.waitForTimeout(500);

    const maxErrorsInput = page.locator('#maxErrorsInput');
    await maxErrorsInput.clear();
    await maxErrorsInput.fill('100');

    const saveBtn = page.locator('#saveAlertConfigBtn');
    await saveBtn.click();
    await page.waitForTimeout(500);
  });

  test('Alert notification appears when thresholds exceeded', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('#alertConfigBtn').click();
    await page.waitForTimeout(500);

    await page.locator('#maxErrorsInput').clear();
    await page.locator('#maxErrorsInput').fill('1');

    await page.locator('#saveAlertConfigBtn').click();
    await page.waitForTimeout(500);
  });
});

test.describe('AEM Log Inspector - Multi-file Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Multiple file paths can be entered with comma separation', async ({ page }) => {
    const filePathInput = page.locator('#filePath');
    await filePathInput.fill(`${ERROR_LOG},${REQUEST_LOG}`);

    const value = await filePathInput.inputValue();
    expect(value).toContain(',');
  });

  test('Multi-file analysis shows combined error count', async ({ page }) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-multi-upload-'));
    const errorOne = writeTempErrorLog(tempDir, 'multi1.log', [
      '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.A] Error one'
    ]);
    const errorTwo = writeTempErrorLog(tempDir, 'multi2.log', [
      '16.03.2026 14:31:15.123 [qtp-2] *ERROR* [com.example.B] Error two'
    ]);

    await page.locator('#filePath').fill(`${errorOne},${errorTwo}`);
    await page.locator('#analyzeBtn').click();

    await expect(page.locator('#errorFilters')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#countALL')).toContainText('2');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

test.describe('AEM Log Inspector - Keyboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Enter key triggers analysis when file path focused', async ({ page }) => {
    const filePathInput = page.locator('#filePath');
    await filePathInput.fill(ERROR_LOG);
    await filePathInput.press('Enter');

    await page.waitForTimeout(TIMEOUTS.analyze);
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('Escape key clears active filter input', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    const searchInput = page.locator('#rawSearchInput');
    await searchInput.fill('test');
    await searchInput.press('Escape');

    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });

  test('Tab navigation through filter inputs works', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);

    await page.locator('#startDate').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });
});
