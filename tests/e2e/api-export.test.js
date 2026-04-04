const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

const BASE_URL = 'http://localhost:3000';
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(PROJECT_ROOT, config.logs.directory);
const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);

test.describe('API - Export Endpoints', () => {
  test('POST /api/export/pdf - Generate PDF summary', async ({ page }) => {
    const analyzeResponse = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: ERROR_LOG }
    });
    const analyzeBody = await analyzeResponse.json();

    const pdfResponse = await page.request.post(`${BASE_URL}/api/export/pdf`, {
      data: {
        summary: analyzeBody.summary || { totalErrors: 0 },
        results: analyzeBody.results || []
      }
    });

    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()['content-type']).toContain('application/pdf');
  });

  test('POST /api/export/pdf - Returns PDF buffer', async ({ page }) => {
    const pdfResponse = await page.request.post(`${BASE_URL}/api/export/pdf`, {
      data: {
        summary: { totalErrors: 10, totalWarnings: 5 },
        results: []
      }
    });

    const buffer = await pdfResponse.body();
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  test('POST /api/export/pdf - Handles empty results', async ({ page }) => {
    const pdfResponse = await page.request.post(`${BASE_URL}/api/export/pdf`, {
      data: {
        summary: { totalErrors: 0 },
        results: []
      }
    });

    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()['content-type']).toContain('application/pdf');
  });
});

test.describe('API - Filter Endpoints', () => {
  test('POST /api/filter - Filter request log by method', async ({ page }) => {
    const requestLog = path.join(TEST_DATA_DIR, config.logs.request);

    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: requestLog,
        filters: {
          method: 'GET'
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/filter - Filter request log by status code', async ({ page }) => {
    const requestLog = path.join(TEST_DATA_DIR, config.logs.request);

    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: requestLog,
        filters: {
          statusCode: 200
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/filter - Filter CDN log by cache status', async ({ page }) => {
    const cdnLog = path.join(TEST_DATA_DIR, config.logs.cdn);

    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: cdnLog,
        filters: {
          cacheStatus: 'HIT'
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/filter - Filter CDN log by POP', async ({ page }) => {
    const cdnLog = path.join(TEST_DATA_DIR, config.logs.cdn);

    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: cdnLog,
        filters: {
          pop: 'sfo'
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/filter - Filter CDN log by URL pattern', async ({ page }) => {
    const cdnLog = path.join(TEST_DATA_DIR, config.logs.cdn);

    const response = await page.request.post(`${BASE_URL}/api/filter`, {
      data: {
        filePath: cdnLog,
        filters: {
          url: '/content'
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('API - Trend Endpoint', () => {
  test('POST /api/trend - Get trend with valid days', async ({ page }) => {
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

  test('POST /api/trend - Get trend with 30 days', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/trend`, {
      data: {
        filePath: ERROR_LOG,
        days: 30
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/trend - Missing file path returns error', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/trend`, {
      data: {
        days: 7
      }
    });

    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

test.describe('API - Alert Check Endpoint', () => {
  test('POST /api/alerts/check - Check alerts within thresholds', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/alerts/check`, {
      data: {
        summary: { totalErrors: 10, totalWarnings: 50, uniqueErrors: 5 },
        results: [],
        thresholds: { maxErrors: 50, maxWarnings: 100, maxUniqueErrors: 20, criticalLoggers: [] }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.alerts).toHaveLength(0);
  });

  test('POST /api/alerts/check - Triggers alert when exceeding thresholds', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/alerts/check`, {
      data: {
        summary: { totalErrors: 100, totalWarnings: 600, uniqueErrors: 30 },
        results: [],
        thresholds: { maxErrors: 50, maxWarnings: 500, maxUniqueErrors: 20, criticalLoggers: [] }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.alerts.length).toBeGreaterThan(0);
  });

  test('POST /api/alerts/check - Triggers critical logger alert', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/alerts/check`, {
      data: {
        summary: { totalErrors: 1, totalWarnings: 0, uniqueErrors: 1 },
        results: [{
          count: 5,
          examples: [{ logger: 'com.adobe.granite.replication' }]
        }],
        thresholds: {
          maxErrors: 50,
          maxWarnings: 500,
          maxUniqueErrors: 20,
          criticalLoggers: ['com.adobe.granite.replication']
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.alerts.some(a => a.message.toLowerCase().includes('critical'))).toBe(true);
  });

  test('POST /api/alerts/check - Uses default thresholds when not provided', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/alerts/check`, {
      data: {
        summary: { totalErrors: 100, totalWarnings: 0, uniqueErrors: 0 },
        results: []
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.alerts.some(a => a.message.includes('100'))).toBe(true);
  });

  test('POST /api/alerts/check - Handles missing summary fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/alerts/check`, {
      data: {
        summary: {},
        results: []
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('API - Edge Cases', () => {
  test('POST /api/analyze - Handles compressed gzip file', async ({ page }) => {
    const zlib = require('zlib');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-api-gzip-'));
    const gzFile = path.join(tempDir, 'error.gz');

    const content = '16.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] Gzip test error\n';
    const compressed = zlib.gzipSync(Buffer.from(content, 'utf8'));
    fs.writeFileSync(gzFile, compressed);

    const response = await page.request.post(`${BASE_URL}/api/analyze`, {
      data: { filePath: gzFile }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('POST /api/raw-events - Handles page pagination', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        page: 1,
        perPage: 10
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.total).toBeDefined();
  });

  test('POST /api/raw-events - Handles empty search', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/raw-events`, {
      data: {
        filePath: ERROR_LOG,
        search: ''
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
