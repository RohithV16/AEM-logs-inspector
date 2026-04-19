const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(PROJECT_ROOT, config.logs.directory);
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
const CDN_LOG = path.join(TEST_DATA_DIR, config.logs.cdn);

const { awaitAnalysisComplete, awaitFilterApply } = require('./helpers');

const TIMEOUTS = config.timeouts;

test.describe('AEM Log Inspector E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should analyze error log file', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('should filter error log by logger', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('#loggerFilter').fill(config.filters.logger_pattern);
    await page.locator('#applyFiltersBtn').click();
    await awaitFilterApply(page);
  });

  test('should display timeline chart after analysis', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(500);
    
    const chartsTab = page.locator('#chartsTab');
    await expect(chartsTab).toBeVisible();
    
    const canvas = page.locator('canvas#timelineChart');
    await expect(canvas).toBeVisible();
  });

  test('should handle invalid file path gracefully', async ({ page }) => {
    await page.locator('#filePath').fill('/nonexistent/file.log');
    await page.locator('#analyzeBtn').click();
    
    const toast = page.locator('.toast.error');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  });

  test('should analyze request log', async ({ page }) => {
    await page.locator('#filePath').fill(REQUEST_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('should analyze CDN log', async ({ page }) => {
    await page.locator('#filePath').fill(CDN_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden({ timeout: 10000 });
  });

  test('should filter by date range', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('#startDate').fill(config.filters.date.start);
    await page.locator('#endDate').fill(config.filters.date.end);
    await page.locator('#applyFiltersBtn').click();
    await awaitFilterApply(page);
  });

  test('should toggle between log level filters', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('button[data-level="ERROR"]').click();
    await awaitFilterApply(page);
    
    const errorChip = page.locator('button[data-level="ERROR"]');
    await expect(errorChip).toHaveClass(/active/);
  });

  test('should search raw events with regex', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('#rawSearchInput').fill(config.filters.regex_search);
    await page.locator('#rawSearchBtn').click();
    await awaitFilterApply(page);
  });

  test('should toggle log level visibility', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('button[data-level="ERROR"]').click();
    await awaitFilterApply(page);
    
    const warnChip = page.locator('button[data-level="WARN"]');
    await warnChip.click();
    await awaitFilterApply(page);
    
    await expect(warnChip).toHaveClass(/active/);
  });

  test('should display timeline with hourly buckets', async ({ page }) => {
    await page.locator('#filePath').fill(ERROR_LOG);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);
    
    await page.locator('#chartsToggleBtn').click();
    await page.waitForTimeout(500);
    
    const timelineChart = page.locator('canvas#timelineChart');
    await expect(timelineChart).toBeVisible();
  });
});
