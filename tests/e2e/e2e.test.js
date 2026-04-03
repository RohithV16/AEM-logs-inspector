const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const TEST_DATA_DIR = path.join(__dirname, config.logs.directory);
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
const CDN_LOG = path.join(TEST_DATA_DIR, config.logs.cdn);

const TIMEOUTS = config.timeouts;

test.describe('AEM Log Inspector E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the dashboard homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Log/);
    await expect(page.locator('h1')).toContainText(/Log Analyzer/i);
  });

  test('should analyze error log file', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('should filter error log by logger', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    await page.locator('#loggerFilter').fill(config.filters.logger_pattern);
    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);
  });

  test('should display timeline chart after analysis', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);
    
    const chartsTab = page.locator('#chartsTab');
    await expect(chartsTab).toBeVisible();
    
    const canvas = page.locator('canvas#timelineChart');
    await expect(canvas).toBeVisible();
  });

  test('should handle invalid file path gracefully', async ({ page }) => {
    await page.locator('#filePath').fill('/nonexistent/file.log');
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  });

  test('should analyze request log', async ({ page }) => {
    await page.locator('#filePath').fill(REQUEST_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.request_analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('should analyze CDN log', async ({ page }) => {
    await page.locator('#filePath').fill(CDN_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.cdn_analyze);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('should filter by date range', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    await page.locator('#startDate').fill(config.filters.date.start);
    await page.locator('#endDate').fill(config.filters.date.end);
    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(TIMEOUTS.filter);
  });

  test('should toggle between log level filters', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    await page.locator('button[data-level="ERROR"]').click();
    await page.waitForTimeout(TIMEOUTS.filter);
    
    const errorChip = page.locator('button[data-level="ERROR"]');
    await expect(errorChip).toHaveClass(/active/);
  });

  test('should search raw events with regex', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await page.waitForTimeout(TIMEOUTS.analyze);
    
    await page.locator('#rawSearchInput').fill(config.filters.regex_search);
    await page.locator('#rawSearchBtn').click();
    await page.waitForTimeout(TIMEOUTS.search);
  });
});
