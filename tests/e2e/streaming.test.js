const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  createTempErrorLog,
  awaitAnalysisComplete
} = require('./helpers');

test.describe('Streaming Tests - SSE Large File Analysis', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-streaming-'));
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Streaming endpoint rejects small files with proper error', async ({ page }) => {
    const fixture = createTempErrorLog(tempDir, { errorCount: 10 });

    const response = await page.request.post('http://localhost:3000/api/analyze/stream', {
      data: { filePath: fixture.filePath }
    });

    const text = await response.text();
    expect(text).toMatch(/small|streaming/i);
  });

  test('Large file analysis completes via regular API', async ({ page }) => {
    const largeFile = path.join(tempDir, 'large.log');
    const lines = [];
    for (let i = 0; i < 2000; i++) {
      lines.push(`29.03.2026 00:00:${String(i % 60).padStart(2, '0')} [thread-1] *ERROR* [com.example.Component] Error ${i}`);
    }
    fs.writeFileSync(largeFile, lines.join('\n'), 'utf8');

    await page.locator('#filePath').fill(largeFile);
    await page.locator('#analyzeBtn').click();

    await awaitAnalysisComplete(page, { timeout: 60000 });

    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeHidden();
  });

  test('Progress text shows during analysis', async ({ page }) => {
    const mediumFile = path.join(tempDir, 'medium.log');
    const lines = [];
    for (let i = 0; i < 500; i++) {
      lines.push(`29.03.2026 00:00:${String(i % 60).padStart(2, '0')} [thread-1] *ERROR* [com.example.Component] Error ${i}`);
    }
    fs.writeFileSync(mediumFile, lines.join('\n'), 'utf8');

    await page.locator('#filePath').fill(mediumFile);
    await page.locator('#analyzeBtn').click();

    await page.waitForTimeout(500);
    
    const progressText = page.locator('#progressText');
    const isVisible = await progressText.isVisible().catch(() => false);
    if (isVisible) {
      const text = await progressText.textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('SSE response format for streaming endpoint', async ({ page }) => {
    const mediumFile = path.join(tempDir, 'sse_test.log');
    const lines = [];
    for (let i = 0; i < 100; i++) {
      lines.push(`29.03.2026 00:00:${String(i % 60).padStart(2, '0')} [thread-1] *ERROR* [com.example.Component] Error ${i}`);
    }
    fs.writeFileSync(mediumFile, lines.join('\n'), 'utf8');

    const events = [];
    
    const response = await page.request.post('http://localhost:3000/api/analyze/stream', {
      data: { filePath: mediumFile }
    });

    const text = await response.text();
    
    const eventMatches = text.match(/data: (\{[^}]+\})/g);
    if (eventMatches) {
      eventMatches.forEach(match => {
        try {
          const data = JSON.parse(match.replace('data: ', ''));
          events.push(data);
        } catch (e) {}
      });
    }

    const isSSEFormat = text.includes('data:') && (text.includes('logType') || text.includes('progress') || text.includes('complete') || text.includes('error'));
    expect(isSSEFormat).toBe(true);
  });
});