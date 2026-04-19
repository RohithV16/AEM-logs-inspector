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

test.describe('Functional API Tests', () => {
  test('Analyze - Error log returns valid response', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.logType).toBe('error');
    expect(body.summary.totalErrors).toBeGreaterThan(0);
  });

  test('Analyze - Request log returns valid response', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: REQUEST_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.logType).toBe('request');
  });

  test('Analyze - CDN log returns valid response', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: CDN_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.logType).toBe('cdn');
  });

  test('Analyze - Returns grouped results', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });

    const body = await response.json();
    expect(body.results).toBeInstanceOf(Array);
    expect(body.results.length).toBeGreaterThan(0);
  });

  test('Analyze - Returns logger results', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });

    const body = await response.json();
    expect(body.loggers).toBeDefined();
  });

  test('Analyze - Returns error and warning counts', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });

    const body = await response.json();
    expect(body.summary.totalErrors).toBeDefined();
    expect(body.summary.totalWarnings).toBeDefined();
  });

  test('Filter - By date range returns filtered results', async ({ request }) => {
    const analyzeResponse = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });
    const analyzeBody = await analyzeResponse.json();

    const response = await request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: ERROR_LOG,
        startDate: analyzeBody.summary.firstOccurrence,
        endDate: analyzeBody.summary.lastOccurrence
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Filter - By logger pattern', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: ERROR_LOG,
        loggerPattern: 'com.adobe'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Filter - By level', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: ERROR_LOG,
        levels: ['ERROR']
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Filter - Request log by status code', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: REQUEST_LOG,
        statusCodes: ['200']
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Filter - Request log by method', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: REQUEST_LOG,
        methods: ['GET']
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Filter - CDN log by cache status', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: CDN_LOG,
        cacheStatuses: ['HIT']
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Raw Events - Paginated results', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        page: 1,
        pageSize: 10
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.events).toBeInstanceOf(Array);
  });

  test('Raw Events - Search returns filtered events', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        searchPattern: 'Replication'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.events).toBeInstanceOf(Array);
  });

  test('Trend - Returns comparison data', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/trend`, {
      data: {
        filePath: ERROR_LOG,
        days: 7
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Export - CSV format', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/export/csv`, {
      data: { filePath: ERROR_LOG }
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });

  test('Edge Case - Compressed gzip file', async ({ request }) => {
    const gzLog = path.join(TEST_DATA_DIR, 'author_aemerror_2026-03-29.log.gz');
    if (fs.existsSync(gzLog)) {
      const response = await request.post(`${BASE_URL}/api/analyze`, {
        data: { filePath: gzLog }
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('Edge Case - Empty search pattern', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        searchPattern: ''
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Edge Case - Invalid file path returns error', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: '/nonexistent/file.log' }
    });

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('Dashboard - Serves index.html', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/`);

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<!DOCTYPE html>');
  });

  test('Dashboard - Serves static JS assets', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/app.js`);

    expect(response.status()).toBe(200);
  });
});