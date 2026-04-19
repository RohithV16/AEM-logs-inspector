const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { 
  createCloudManagerErrorLog, 
  awaitAnalysisComplete 
} = require('./helpers');

test.describe('Regression: Pods and Exception Filter Data Integrity', () => {
  let tempDir;

  test.beforeEach(async ({ page }) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-reg-'));
    await page.goto('/');
  });

  test.afterEach(async () => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  });

  test('Cloud Manager log correctly identifies Pod IDs vs Threads', async ({ page }) => {
    const fixture = createCloudManagerErrorLog(tempDir, {
      pods: ['cm-p123-e456-author-1', 'cm-p123-e456-author-2'],
      errorCount: 10
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    // Open the Pods filter
    await page.locator('#threadFilter').click();
    
    // Assert that the dropdown contains the Pod IDs, not the thread names
    const dropdownHtml = await page.innerHTML('#threadSelect');
    expect(dropdownHtml).toContain('cm-p123-e456-author-1');
    expect(dropdownHtml).toContain('cm-p123-e456-author-2');
    expect(dropdownHtml).not.toContain('sling-default-0-thread');
  });

  test('Exception filter extracts exceptions from stack traces', async ({ page }) => {
    const fixture = createCloudManagerErrorLog(tempDir, {
      exceptions: ['com.example.SpecialValidationException'],
      errorCount: 5
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    // Open the Exception filter
    await page.locator('#exceptionFilter').click();
    
    // Assert that the dropdown contains the specific exception
    const dropdownHtml = await page.innerHTML('#exceptionSelect');
    expect(dropdownHtml).toContain('com.example.SpecialValidationException');
  });

  test('Filtering by Java Package cascades correctly to Pods', async ({ page }) => {
    const fixture = createCloudManagerErrorLog(tempDir, {
      loggers: ['com.adobe.cq.MyComponent'],
      pods: ['cm-p-target-pod'],
      errorCount: 5
    });

    await page.locator('#filePath').fill(fixture.filePath);
    await page.locator('#analyzeBtn').click();
    await awaitAnalysisComplete(page);

    // Select the package
    await page.locator('#packageFilter').fill('com.adobe.cq');
    await page.keyboard.press('Enter');

    // Verify Pods dropdown is updated and contains the correct pod
    await page.locator('#threadFilter').click();
    const dropdownHtml = await page.innerHTML('#threadSelect');
    expect(dropdownHtml).toContain('cm-p-target-pod');
  });
});
