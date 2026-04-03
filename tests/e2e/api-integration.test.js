const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const BASE_URL = 'http://localhost:3000';
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(PROJECT_ROOT, config.logs.directory);
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
const CDN_LOG = path.join(TEST_DATA_DIR, config.logs.cdn);

test.describe('API Integration Tests', () => {
  test('1. POST /api/analyze - Analyze error log', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary).toHaveProperty('totalErrors');
    expect(body.logType).toBe('error');
  });

  test('2. POST /api/analyze - Analyze request log', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: REQUEST_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary).toHaveProperty('totalRequests');
    expect(body.logType).toBe('request');
  });

  test('3. POST /api/analyze - Analyze CDN log', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: CDN_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary).toHaveProperty('totalRequests');
    expect(body.logType).toBe('cdn');
  });

  test('4. POST /api/filter - Filter by date range', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: ERROR_LOG,
        filters: {
          startDate: config.filters.date.start,
          endDate: config.filters.date.end
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary).toBeDefined();
  });

  test('5. POST /api/filter - Filter by logger regex', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: ERROR_LOG,
        filters: {
          logger: config.filters.logger_pattern
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('6. POST /api/filter - Filter by package', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: ERROR_LOG,
        filters: {
          package: 'com.adobe'
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('7. POST /api/raw-events - Get raw events with pagination', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        page: 1,
        limit: 50
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.events).toBeDefined();
    expect(Array.isArray(body.events)).toBe(true);
  });

  test('8. POST /api/raw-events - Search events with regex', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        search: config.filters.regex_search
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('9. POST /api/trend - Get trend comparison', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/trend`, {
      data: {
        filePath: ERROR_LOG,
        days: 7
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.trend).toBeDefined();
  });

  test('10. POST /api/export/csv - Export to CSV', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });
    const body = await response.json();

    const exportResponse = await page.request.post(`${BASE_URL}/api/export/csv`, {
      data: { results: body.results || [] }
    });

    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()['content-type']).toContain('text/csv');
  });

  test('11. POST /api/export/json - Export to JSON', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });
    const body = await response.json();

    const exportResponse = await page.request.post(`${BASE_URL}/api/export/json`, {
      data: { results: body.results || [] }
    });

    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()['content-type']).toContain('application/json');
  });

  test('12. POST /api/alerts/check - Check alerts with thresholds', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/alerts/check`, {
      data: {
        summary: { totalErrors: 100, totalWarnings: 50, uniqueErrors: 10 },
        results: [],
        thresholds: { maxErrors: 10, maxWarnings: 20, maxUniqueErrors: 5, criticalLoggers: [] }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
