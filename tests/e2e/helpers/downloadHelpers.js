const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

async function downloadAndParse(page, buttonLocator, options = {}) {
  const { timeout = 30000 } = options;

  const downloadPromise = page.waitForEvent('download', { timeout });

  await page.locator(buttonLocator).click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  const filePath = path.join(process.env.TEMP || '/tmp', suggestedFilename);

  await download.saveAs(filePath);

  const content = fs.readFileSync(filePath, 'utf8');

  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    // Ignore cleanup errors
  }

  return {
    filename: suggestedFilename,
    content,
    filePath
  };
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    return row;
  });

  return { headers, rows };
}

function parseJSON(content) {
  try {
    const data = JSON.parse(content);
    return data;
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${e.message}`);
  }
}

function validateCSVHeaders(rows, expectedHeaders) {
  expect(rows.headers).toBeDefined();
  
  const missingHeaders = expectedHeaders.filter(h => 
    !rows.headers.some(hh => hh.toLowerCase() === h.toLowerCase())
  );
  
  expect(missingHeaders).toHaveLength(0);
}

function validateEventCount(rows, expectedCount) {
  expect(rows.rows.length).toBe(expectedCount);
}

function validatePDF(buffer) {
  expect(buffer).toBeDefined();
  expect(buffer.length).toBeGreaterThan(0);

  const pdfHeader = buffer.slice(0, 5).toString();
  expect(pdfHeader).toBe('%PDF-');
}

async function downloadCSV(page, options = {}) {
  return downloadAndParse(page, '#exportCsvBtn', options);
}

async function downloadJSON(page, options = {}) {
  return downloadAndParse(page, '#exportJsonBtn', options);
}

async function downloadPDF(page, options = {}) {
  return downloadAndParse(page, '#exportPdfBtn', options);
}

async function exportWithFilter(page, filterConfig, options = {}) {
  const { applyFilter = true } = options;

  if (applyFilter) {
    if (filterConfig.logger) {
      await page.locator('#loggerFilter').fill(filterConfig.logger);
    }
    if (filterConfig.search) {
      await page.locator('#searchInput').fill(filterConfig.search);
    }
    if (filterConfig.startDate) {
      await page.locator('#startDate').fill(filterConfig.startDate);
    }
    if (filterConfig.endDate) {
      await page.locator('#endDate').fill(filterConfig.endDate);
    }
    await page.locator('#applyFiltersBtn').click();
    await page.waitForTimeout(1000);
  }
}

async function verifyExportContent(page, type, expectedContent) {
  let download;
  
  switch (type) {
    case 'csv':
      download = await downloadCSV(page);
      break;
    case 'json':
      download = await downloadJSON(page);
      break;
    case 'pdf':
      download = await downloadPDF(page);
      break;
    default:
      throw new Error(`Unknown export type: ${type}`);
  }

  if (expectedContent.headers) {
    const parsed = type === 'csv' ? parseCSV(download.content) : { headers: Object.keys(expectedContent.headers[0] || {}), rows: expectedContent.headers };
    validateCSVHeaders(parsed, expectedContent.headers);
  }

  if (expectedContent.rowCount) {
    if (type === 'csv') {
      const parsed = parseCSV(download.content);
      expect(parsed.rows.length).toBe(expectedContent.rowCount);
    } else if (type === 'json') {
      const data = parseJSON(download.content);
      expect(Array.isArray(data) ? data.length : 1).toBe(expectedContent.rowCount);
    }
  }

  if (expectedContent.filenamePattern) {
    expect(download.filename).toMatch(expectedContent.filenamePattern);
  }

  return download;
}

module.exports = {
  downloadAndParse,
  parseCSV,
  parseJSON,
  validateCSVHeaders,
  validateEventCount,
  validatePDF,
  downloadCSV,
  downloadJSON,
  downloadPDF,
  exportWithFilter,
  verifyExportContent
};
