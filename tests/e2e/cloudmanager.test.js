const { test, expect } = require('@playwright/test');

const {
  mockPrograms
} = require('./helpers');

test.describe('Cloud Manager Tests - UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Cloud Manager source mode button exists', async ({ page }) => {
    const cmButton = page.locator('#sourceModeCloudManager');
    await expect(cmButton).toBeVisible();
  });

  test('Switching to Cloud Manager mode shows panel', async ({ page }) => {
    await page.locator('#sourceModeCloudManager').click();
    await page.waitForTimeout(500);

    const cmPanel = page.locator('#cloudManagerPanel');
    await expect(cmPanel).toBeVisible();
  });

  test('Cloud Manager program select exists after switching', async ({ page }) => {
    await page.locator('#sourceModeCloudManager').click();
    await page.waitForTimeout(300);

    const programSelect = page.locator('#cmProgramSelect');
    await expect(programSelect).toBeVisible();
  });

  test('Cloud Manager environment select is disabled initially', async ({ page }) => {
    await page.locator('#sourceModeCloudManager').click();
    await page.waitForTimeout(300);

    const envSelect = page.locator('#cmEnvironmentSelect');
    const isDisabled = await envSelect.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('Cloud Manager analyze button exists', async ({ page }) => {
    await page.locator('#sourceModeCloudManager').click();
    await page.waitForTimeout(300);

    const analyzeBtn = page.locator('#cmAnalyzeBtn');
    await expect(analyzeBtn).toBeVisible();
  });
});