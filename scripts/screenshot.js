const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait a little bit for rendering
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
  console.log('Screenshot taken!');
})();
