const { expect } = require('@playwright/test');

const DEFAULT_PROGRAMS = [
  { id: 'prog-1', name: 'AEM Author Stage', description: 'AEM Author environment' },
  { id: 'prog-2', name: 'AEM Publish Prod', description: 'AEM Publish production' }
];

const DEFAULT_ENVIRONMENTS = [
  { id: 'env-1', name: 'author', type: 'author', programId: 'prog-1' },
  { id: 'env-2', name: 'publish', type: 'publish', programId: 'prog-1' }
];

const DEFAULT_LOG_OPTIONS = [
  { service: 'aemerror', name: 'Error Log', description: 'AEM error log', supported: true },
  { service: 'aemrequest', name: 'Request Log', description: 'AEM request log', supported: true },
  { service: 'aemaccess', name: 'Access Log', description: 'AEM access log', supported: true }
];

function createMockPrograms(programs = DEFAULT_PROGRAMS) {
  return {
    success: true,
    programs
  };
}

function createMockEnvironments(environments = DEFAULT_ENVIRONMENTS) {
  return {
    success: true,
    environments
  };
}

function createMockLogOptions(logOptions = DEFAULT_LOG_OPTIONS) {
  return {
    success: true,
    logOptions
  };
}

function createMockDownload(files = []) {
  return {
    success: true,
    source: 'cloudmanager',
    downloadedFiles: files.map(f => f.filePath),
    downloadedFilesDetailed: files.map(f => ({
      ...f,
      service: f.service || 'aemerror',
      logName: f.logName || 'error.log'
    })),
    downloads: files.map(f => ({
      service: f.service || 'aemerror',
      logName: f.logName || 'error.log',
      filePath: f.filePath,
      fileSize: f.fileSize || 1024
    }))
  };
}

function createMockCommandPreview(command = 'aio cloudmanager:logs:download') {
  return {
    success: true,
    mode: 'download',
    commands: [{ service: 'author', logName: 'aemerror', command }],
    estimatedDateRange: { label: 'Estimated range: 2026-04-06 to 2026-04-07' }
  };
}

function createMockError(scenario) {
  const errors = {
    unavailable: {
      success: false,
      error: 'Adobe I/O CLI (aio) is not installed. Please install it to use Cloud Manager features.'
    },
    auth_failure: {
      success: false,
      error: 'Authentication failed. Please run "aio auth login" to authenticate.'
    },
    malformed: {
      success: false,
      error: 'Failed to parse Cloud Manager response. Please check your aio version.'
    },
    not_found: {
      success: false,
      error: 'Cloud Manager resource not found. Please verify your program and environment IDs.'
    },
    network: {
      success: false,
      error: 'Network error connecting to Cloud Manager. Please check your connection.'
    }
  };

  return errors[scenario] || errors.unavailable;
}

async function mockPrograms(page, programs = DEFAULT_PROGRAMS) {
  await page.route('**/api/cloudmanager/programs', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockPrograms(programs))
    });
  });
}

async function mockEnvironmentsForProgram(page, programId, environments = DEFAULT_ENVIRONMENTS) {
  const filteredEnvs = environments.filter(e => e.programId === programId || !e.programId);
  await page.route(`**/api/cloudmanager/programs/*/environments`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockEnvironments(filteredEnvs))
    });
  });
}

async function mockLogOptionsForEnvironment(page, environmentId, logOptions = DEFAULT_LOG_OPTIONS) {
  await page.route(`**/api/cloudmanager/environments/*/log-options`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockLogOptions(logOptions))
    });
  });
}

async function mockLogOptions(page, logOptions = DEFAULT_LOG_OPTIONS) {
  await page.route(`**/api/cloudmanager/environments/*/log-options`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockLogOptions(logOptions))
    });
  });
}

async function mockDownload(page, files = []) {
  await page.route('**/api/cloudmanager/download', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockDownload(files))
    });
  });
}

async function mockCommandPreview(page, command) {
  await page.route('**/api/cloudmanager/command-preview', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockCommandPreview(command))
    });
  });
}

async function mockError(page, endpoint, scenario) {
  await page.route(`**/api/cloudmanager/${endpoint}`, async route => {
    const error = createMockError(scenario);
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(error)
    });
  });
}

async function setupCloudManagerMocks(page, options = {}) {
  const { programs, environments, logOptions, files } = options;

  await mockPrograms(page, programs);
  await mockEnvironmentsForProgram(page, 'prog-1', environments);
  await mockLogOptions(page, logOptions);
  await mockDownload(page, files);
}

async function waitForCloudManagerPanel(page) {
  await page.waitForSelector('#cloudManagerPanel', { timeout: 10000 });
}

async function selectProgram(page, programIndex = 0) {
  const programSelect = page.locator('#cmProgramSelect');
  await programSelect.selectOption(programIndex);
  await page.waitForTimeout(500);
}

async function selectEnvironment(page, envIndex = 0) {
  const envSelect = page.locator('#cmEnvironmentSelect');
  await envSelect.selectOption(envIndex);
  await page.waitForTimeout(500);
}

async function selectLogOption(page, optionIndex = 0) {
  const options = page.locator('.cm-log-option-checkbox, [data-cm-log-option]');
  await options.nth(optionIndex).check();
  await page.waitForTimeout(300);
}

async function clickDownloadButton(page) {
  await page.locator('#cmAnalyzeBtn').click();
  await page.waitForTimeout(1000);
}

async function clickAnalyzeDownloadedButton(page) {
  await page.locator('#cmAnalyzeBtn').click();
  await page.waitForTimeout(2000);
}

async function verifyCloudManagerError(page, expectedMessage) {
  const errorEl = page.locator('.toast.error, .cm-error-message');
  await expect(errorEl).toBeVisible();
  
  if (expectedMessage) {
    await expect(errorEl).toContainText(expectedMessage);
  }
}

async function verifyProgramLoaded(page, programCount) {
  const programSelect = page.locator('#cmProgramSelect');
  const options = await programSelect.locator('option').count();
  expect(options).toBeGreaterThan(programCount);
}

async function verifyEnvironmentLoaded(page, envCount) {
  const envSelect = page.locator('#cmEnvironmentSelect');
  const options = await envSelect.locator('option').count();
  expect(options).toBeGreaterThan(envCount);
}

async function verifyLogOptionsLoaded(page, optionCount) {
  const options = page.locator('.cm-log-option-checkbox, [data-cm-log-option]');
  await expect(options).toHaveCount(optionCount);
}

module.exports = {
  DEFAULT_PROGRAMS,
  DEFAULT_ENVIRONMENTS,
  DEFAULT_LOG_OPTIONS,
  createMockPrograms,
  createMockEnvironments,
  createMockLogOptions,
  createMockDownload,
  createMockCommandPreview,
  createMockError,
  mockPrograms,
  mockEnvironmentsForProgram,
  mockLogOptionsForEnvironment,
  mockLogOptions,
  mockDownload,
  mockCommandPreview,
  mockError,
  setupCloudManagerMocks,
  waitForCloudManagerPanel,
  selectProgram,
  selectEnvironment,
  selectLogOption,
  clickDownloadButton,
  clickAnalyzeDownloadedButton,
  verifyCloudManagerError,
  verifyProgramLoaded,
  verifyEnvironmentLoaded,
  verifyLogOptionsLoaded
};