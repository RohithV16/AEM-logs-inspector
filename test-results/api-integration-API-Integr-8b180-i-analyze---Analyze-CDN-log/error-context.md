# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-integration.test.js >> API Integration Tests >> 3. POST /api/analyze - Analyze CDN log
- Location: tests/e2e/api-integration.test.js:41:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const path = require('path');
  3   | const fs = require('fs');
  4   | const yaml = require('js-yaml');
  5   | 
  6   | const CONFIG_PATH = path.join(__dirname, 'config.yaml');
  7   | const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));
  8   | 
  9   | const BASE_URL = 'http://localhost:3000';
  10  | const PROJECT_ROOT = path.join(__dirname, '..', '..');
  11  | const TEST_DATA_DIR = path.join(PROJECT_ROOT, config.logs.directory);
  12  | const ERROR_LOG = path.join(TEST_DATA_DIR, config.logs.error);
  13  | const REQUEST_LOG = path.join(TEST_DATA_DIR, config.logs.request);
  14  | const CDN_LOG = path.join(TEST_DATA_DIR, config.logs.cdn);
  15  | 
  16  | test.describe('API Integration Tests', () => {
  17  |   test('1. POST /api/analyze - Analyze error log', async ({ page }) => {
  18  |     const response = await page.request.post(`${BASE_URL}/api/analyze`, {
  19  |       data: { filePath: ERROR_LOG }
  20  |     });
  21  | 
  22  |     expect(response.status()).toBe(200);
  23  |     const body = await response.json();
  24  |     expect(body.success).toBe(true);
  25  |     expect(body.summary).toHaveProperty('totalErrors');
  26  |     expect(body.logType).toBe('error');
  27  |   });
  28  | 
  29  |   test('2. POST /api/analyze - Analyze request log', async ({ page }) => {
  30  |     const response = await page.request.post(`${BASE_URL}/api/analyze`, {
  31  |       data: { filePath: REQUEST_LOG }
  32  |     });
  33  | 
  34  |     expect(response.status()).toBe(200);
  35  |     const body = await response.json();
  36  |     expect(body.success).toBe(true);
  37  |     expect(body.summary).toHaveProperty('totalRequests');
  38  |     expect(body.logType).toBe('request');
  39  |   });
  40  | 
  41  |   test('3. POST /api/analyze - Analyze CDN log', async ({ page }) => {
  42  |     const response = await page.request.post(`${BASE_URL}/api/analyze`, {
  43  |       data: { filePath: CDN_LOG }
  44  |     });
  45  | 
  46  |     expect(response.status()).toBe(200);
  47  |     const body = await response.json();
> 48  |     expect(body.success).toBe(true);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  49  |     expect(body.summary).toHaveProperty('totalRequests');
  50  |     expect(body.logType).toBe('cdn');
  51  |   });
  52  | 
  53  |   test('4. POST /api/filter - Filter by date range', async ({ page }) => {
  54  |     const response = await page.request.post(`${BASE_URL}/api/filter`, {
  55  |       data: {
  56  |         filePath: ERROR_LOG,
  57  |         filters: {
  58  |           startDate: config.filters.date.start,
  59  |           endDate: config.filters.date.end
  60  |         }
  61  |       }
  62  |     });
  63  | 
  64  |     expect(response.status()).toBe(200);
  65  |     const body = await response.json();
  66  |     expect(body.success).toBe(true);
  67  |     expect(body.summary).toBeDefined();
  68  |   });
  69  | 
  70  |   test('5. POST /api/filter - Filter by logger regex', async ({ page }) => {
  71  |     const response = await page.request.post(`${BASE_URL}/api/filter`, {
  72  |       data: {
  73  |         filePath: ERROR_LOG,
  74  |         filters: {
  75  |           logger: config.filters.logger_pattern
  76  |         }
  77  |       }
  78  |     });
  79  | 
  80  |     expect(response.status()).toBe(200);
  81  |     const body = await response.json();
  82  |     expect(body.success).toBe(true);
  83  |   });
  84  | 
  85  |   test('6. POST /api/filter - Filter by package', async ({ page }) => {
  86  |     const response = await page.request.post(`${BASE_URL}/api/filter`, {
  87  |       data: {
  88  |         filePath: ERROR_LOG,
  89  |         filters: {
  90  |           package: 'com.adobe'
  91  |         }
  92  |       }
  93  |     });
  94  | 
  95  |     expect(response.status()).toBe(200);
  96  |     const body = await response.json();
  97  |     expect(body.success).toBe(true);
  98  |   });
  99  | 
  100 |   test('7. POST /api/raw-events - Get raw events with pagination', async ({ page }) => {
  101 |     const response = await page.request.post(`${BASE_URL}/api/raw-events`, {
  102 |       data: {
  103 |         filePath: ERROR_LOG,
  104 |         page: 1,
  105 |         limit: 50
  106 |       }
  107 |     });
  108 | 
  109 |     expect(response.status()).toBe(200);
  110 |     const body = await response.json();
  111 |     expect(body.success).toBe(true);
  112 |     expect(body.events).toBeDefined();
  113 |     expect(Array.isArray(body.events)).toBe(true);
  114 |   });
  115 | 
  116 |   test('8. POST /api/raw-events - Search events with regex', async ({ page }) => {
  117 |     const response = await page.request.post(`${BASE_URL}/api/raw-events`, {
  118 |       data: {
  119 |         filePath: ERROR_LOG,
  120 |         search: config.filters.regex_search
  121 |       }
  122 |     });
  123 | 
  124 |     expect(response.status()).toBe(200);
  125 |     const body = await response.json();
  126 |     expect(body.success).toBe(true);
  127 |   });
  128 | 
  129 |   test('9. POST /api/trend - Get trend comparison', async ({ page }) => {
  130 |     const response = await page.request.post(`${BASE_URL}/api/trend`, {
  131 |       data: {
  132 |         filePath: ERROR_LOG,
  133 |         days: 7
  134 |       }
  135 |     });
  136 | 
  137 |     expect(response.status()).toBe(200);
  138 |     const body = await response.json();
  139 |     expect(body.success).toBe(true);
  140 |     expect(body.trend).toBeDefined();
  141 |   });
  142 | 
  143 |   test('10. POST /api/export/csv - Export to CSV', async ({ page }) => {
  144 |     const response = await page.request.post(`${BASE_URL}/api/analyze`, {
  145 |       data: { filePath: ERROR_LOG }
  146 |     });
  147 |     const body = await response.json();
  148 | 
```