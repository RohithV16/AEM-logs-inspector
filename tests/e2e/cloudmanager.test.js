const { test, expect } = require('@playwright/test');

test.describe('Cloud Manager Tests - UI Elements', () => {
  test('Cloud Manager source mode button exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#sourceModeCloudManager')).toBeVisible();
  });

  test('Switching to Cloud Manager mode shows panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sourceModeCloudManager').click();
    await expect(page.locator('#cloudManagerPanel')).toBeVisible();
  });

  test('Cloud Manager program select exists after switching', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sourceModeCloudManager').click();
    await expect(page.locator('#cmProgramSelect')).toBeVisible();
  });

  test('Cloud Manager environment select is disabled initially', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sourceModeCloudManager').click();
    await expect(page.locator('#cmEnvironmentSelect')).toBeDisabled();
  });

  test('Cloud Manager analyze button exists', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sourceModeCloudManager').click();
    await expect(page.locator('#cmAnalyzeBtn')).toBeVisible();
  });

  test('Cloud Manager tail buttons exist', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sourceModeCloudManager').click();
    await expect(page.locator('#cmTailBtn')).toBeVisible();
    await expect(page.locator('#cmTailStopBtn')).toBeHidden();
  });
});
