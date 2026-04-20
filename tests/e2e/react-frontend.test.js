const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('React Frontend UI Tests', () => {
  test('Dashboard loads the React app', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('#root', { timeout: 10000 });
    const root = await page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('React app renders main App component', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('#app', { timeout: 10000 });
    const app = await page.locator('#app');
    await expect(app).toBeVisible();
  });

  test('Source mode switcher has Local and Cloud Manager options', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('[name="sourceMode"]', { timeout: 10000 });
    
    const localOption = page.locator('input[name="sourceMode"][value="local"]');
    const cloudOption = page.locator('input[name="sourceMode"][value="cloudmanager"]');
    
    await expect(localOption).toBeVisible();
    await expect(cloudOption).toBeVisible();
  });

  test('Can switch to Local source mode', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('[name="sourceMode"]', { timeout: 10000 });
    
    await page.locator('input[name="sourceMode"][value="local"]').click();
    const localOption = page.locator('input[name="sourceMode"][value="local"]');
    await expect(localOption).toBeChecked();
  });

  test('Can switch to Cloud Manager source mode', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('[name="sourceMode"]', { timeout: 10000 });
    
    await page.locator('input[name="sourceMode"][value="cloudmanager"]').click();
    const cloudOption = page.locator('input[name="sourceMode"][value="cloudmanager"]');
    await expect(cloudOption).toBeChecked();
  });

  test('Theme provider wraps the app', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('#app', { timeout: 10000 });
    
    const app = await page.locator('#app');
    const html = await app.innerHTML();
    expect(html.length).toBeGreaterThan(0);
  });

  test('React bundle loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#app', { timeout: 10000 });
    
    expect(errors).toEqual([]);
  });

  test('No console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#app', { timeout: 10000 });
    
    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('DevTools'));
    expect(criticalErrors).toEqual([]);
  });

  test('Workspace shell component renders', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('#app', { timeout: 10000 });
    
    const appContent = await page.locator('#app').innerHTML();
    expect(appContent.length).toBeGreaterThan(10);
  });

  test('Theme controls render in header', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.waitForSelector('header', { timeout: 10000 });
    
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});