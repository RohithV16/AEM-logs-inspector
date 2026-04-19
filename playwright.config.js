const { defineConfig, devices } = require('@playwright/test');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Use 50% of available vCPUs on CI to leave headroom for the browser process.
     Locally, let Playwright decide based on the machine. */
  workers: process.env.CI ? '50%' : undefined,

  /* Blob reporter on CI enables shard merging in the e2e-report job.
     HTML reporter locally for the interactive report viewer. */
  reporter: process.env.CI ? [['blob'], ['dot']] : [['html']],

  /* Shared settings for all projects. See https://playwright.dev/docs/api/class-testoptions. */
  timeout: 60000,

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    headless: true,
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests.
     On CI, never reuse an existing server to avoid stale state between retries.
     Locally, reuse a running server to speed up the dev loop. */
  webServer: {
    command: 'pwd && DEBUG_FILTERS=true node src/server.js > /tmp/server.log 2>&1',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});