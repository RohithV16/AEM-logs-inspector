const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { detectLogSignature } = require('../parser');
const { isAllowedLogFile } = require('../utils/files');

const AIO_BINARY = 'aio';
const DATE_TOKEN_PATTERN = /(\d{4}[-_]\d{2}[-_]\d{2}|\d{2}[-_]\d{2}[-_]\d{4})/;
const APP_DATA_DIR = getAppDataDirectory();
const CLOUD_MANAGER_CACHE_DIR = path.join(APP_DATA_DIR, 'cache');
const CLOUD_MANAGER_CACHE_FILE = path.join(CLOUD_MANAGER_CACHE_DIR, 'cloudmanager-metadata.json');
const CLOUD_MANAGER_SETUP_DIR = path.join(APP_DATA_DIR, 'setup');
const CLOUD_MANAGER_OAUTH_CONFIG_FILE = path.join(CLOUD_MANAGER_SETUP_DIR, 'cloudmanager-oauth-config.json');

function getAppDataDirectory() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.aem-log-analyzer');
}

function execAioRawCommand(args) {
  return new Promise((resolve, reject) => {
    execFile(AIO_BINARY, args, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject({
          error,
          stdout: String(stdout || '').trim(),
          stderr: String(stderr || '').trim()
        });
        return;
      }

      resolve({
        stdout: String(stdout || '').trim(),
        stderr: String(stderr || '').trim()
      });
    });
  });
}

async function execAioCommand(args) {
  try {
    return await execAioRawCommand(args);
  } catch (result) {
    throw createCloudManagerError(result.error, result.stderr || result.stdout);
  }
}

function stripAnsi(text) {
  return String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
}

function normalizeCloudManagerErrorText(error, output = '') {
  return stripAnsi(`${error && error.message ? error.message : ''}\n${output}`).trim();
}

function isNetworkCloudManagerFailure(text = '') {
  return /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|unable to resolve|network|certificate|TLS|SSL|socket hang up/i.test(text);
}

function isAuthCloudManagerFailure(text = '') {
  return /auth:login|not logged in|login required|expired token|invalid token|access token|unauthorized|401|ims/i.test(text);
}

function isConfigCloudManagerFailure(text = '') {
  return /cloudmanager_orgid|cloudmanager_programid|no org selected|organization context|program context|missing org|missing program|org:select/i.test(text);
}

function isPermissionCloudManagerFailure(text = '') {
  return /permission denied|insufficient privileges|not authorized|access denied|forbidden|403/i.test(text);
}

function createCloudManagerError(error, output = '') {
  const text = normalizeCloudManagerErrorText(error, output);

  if (error && error.code === 'ENOENT') {
    return new Error('Adobe aio CLI was not found. Install it first and make sure `aio` is available in PATH.');
  }
  if (/plugins:install|aio-cli-plugin-cloudmanager|command not found/i.test(text)) {
    return new Error('Adobe Cloud Manager plugin is missing. Run `aio plugins:install @adobe/aio-cli-plugin-cloudmanager` and try again.');
  }
  if (isNetworkCloudManagerFailure(text)) {
    return new Error('Unable to reach Adobe Cloud Manager. Check internet/VPN/proxy/DNS access to `cloudmanager.adobe.io` and try again.');
  }
  if (isAuthCloudManagerFailure(text)) {
    return new Error('Adobe aio CLI authentication for Cloud Manager is incomplete or expired. Run `aio auth:login` and try again.');
  }
  if (isConfigCloudManagerFailure(text)) {
    return new Error('Adobe aio CLI is missing Cloud Manager org or program configuration. Confirm your Cloud Manager org/program context and try again.');
  }
  if (isPermissionCloudManagerFailure(text)) {
    return new Error('Adobe Cloud Manager rejected this request. Confirm your account has permission to access the selected Cloud Manager resources.');
  }
  if (text) {
    return new Error(`Cloud Manager command failed: ${text.split('\n')[0]}`);
  }

  return new Error('Cloud Manager command failed.');
}

function extractJsonPayload(text) {
  const cleaned = stripAnsi(text).trim();
  if (!cleaned) return '';

  const directStart = cleaned[0];
  if (directStart === '{' || directStart === '[') {
    return cleaned;
  }

  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');
  const candidates = [firstObject, firstArray].filter(index => index >= 0).sort((a, b) => a - b);

  for (const start of candidates) {
    const snippet = cleaned.slice(start).trim();
    try {
      JSON.parse(snippet);
      return snippet;
    } catch {
      // Try the next candidate.
    }
  }

  return cleaned;
}

function parseJsonOutput(output, label) {
  const jsonText = extractJsonPayload(output);
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Cloud Manager returned invalid ${label} data.`);
  }
}

function ensureCloudManagerCacheDir() {
  fs.mkdirSync(CLOUD_MANAGER_CACHE_DIR, { recursive: true });
}

function ensureCloudManagerSetupDir() {
  fs.mkdirSync(CLOUD_MANAGER_SETUP_DIR, { recursive: true });
}

function getEmptyCloudManagerCache() {
  return {
    refreshedAt: '',
    programs: [],
    environmentsByProgram: {},
    environmentErrors: []
  };
}

function readCloudManagerMetadataCache() {
  if (!fs.existsSync(CLOUD_MANAGER_CACHE_FILE)) {
    return getEmptyCloudManagerCache();
  }

  try {
    const raw = fs.readFileSync(CLOUD_MANAGER_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      refreshedAt: parsed.refreshedAt || '',
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
      environmentsByProgram: parsed.environmentsByProgram && typeof parsed.environmentsByProgram === 'object'
        ? parsed.environmentsByProgram
        : {},
      environmentErrors: Array.isArray(parsed.environmentErrors) ? parsed.environmentErrors : []
    };
  } catch {
    return getEmptyCloudManagerCache();
  }
}

function writeCloudManagerMetadataCache(payload) {
  ensureCloudManagerCacheDir();
  fs.writeFileSync(CLOUD_MANAGER_CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

function normalizePrograms(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.programs)
      ? payload.programs
      : [];

  return list.map((program) => ({
    id: String(program.id ?? program.programId ?? ''),
    name: String(program.name ?? program.programName ?? `Program ${program.id ?? ''}`),
    enabled: Boolean(program.enabled ?? program.isEnabled ?? true)
  })).filter(program => program.id);
}

function normalizeEnvironments(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.environments)
      ? payload.environments
      : [];

  return list.map((environment) => ({
    id: String(environment.id ?? environment.environmentId ?? ''),
    name: String(environment.name ?? environment.environmentName ?? `Environment ${environment.id ?? ''}`),
    type: String(environment.type ?? environment.environmentType ?? ''),
    status: String(environment.status ?? environment.programStatus ?? '')
  })).filter(environment => environment.id);
}

function normalizeLogOptions(payload) {
  const options = [];
  const seen = new Set();

  function visit(node) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node !== 'object') return;

    const service = node.service || node.serviceName || node.tier || node.environmentService;
    const name = node.name || node.logName || node.filename || node.fileName;

    if (service && name) {
      const key = `${service}::${name}`;
      if (!seen.has(key)) {
        seen.add(key);
        options.push({
          service: String(service),
          name: String(name),
          label: `${service} / ${name}`
        });
      }
    }

    Object.values(node).forEach(visit);
  }

  visit(payload);

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function validateOutputDirectory(outputDirectory) {
  if (!outputDirectory || !String(outputDirectory).trim()) {
    throw new Error('Output directory is required.');
  }

  const resolved = path.resolve(String(outputDirectory).trim());

  if (!fs.existsSync(resolved)) {
    throw new Error('Output directory does not exist.');
  }

  const stats = fs.statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error('Output directory must be a directory.');
  }

  return resolved;
}

function createDownloadRunDirectory(baseDirectory, metadata) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDirectory = path.join(
    baseDirectory,
    'cloudmanager',
    sanitizeSegment(metadata.programId),
    sanitizeSegment(metadata.environmentId),
    sanitizeSegment(metadata.service),
    sanitizeSegment(metadata.logName),
    timestamp
  );

  fs.mkdirSync(runDirectory, { recursive: true });
  return runDirectory;
}

function sanitizeSegment(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function collectFilesRecursively(directoryPath) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(directoryPath);
  return files;
}

function pickNewestFile(files) {
  return [...files].sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
}

function getAioCommandPreview(args) {
  return ['aio', ...args].join(' ');
}

function quoteShellArg(value) {
  const stringValue = String(value ?? '');
  if (!stringValue) return "''";
  if (/^[a-zA-Z0-9._/:=-]+$/.test(stringValue)) {
    return stringValue;
  }
  return `'${stringValue.replace(/'/g, `'\\''`)}'`;
}

function getShellCommandPreview(args) {
  return ['aio', ...args].map(quoteShellArg).join(' ');
}

function normalizeSetupMode(mode) {
  return String(mode || '').trim().toLowerCase() === 'oauth' ? 'oauth' : 'browser';
}

function normalizeScopes(scopesInput) {
  const rawScopes = Array.isArray(scopesInput)
    ? scopesInput
    : String(scopesInput || '').split(/[\n,]+/);

  return rawScopes
    .map(scope => String(scope || '').trim())
    .filter(Boolean);
}

function getCloudManagerOAuthConfigPreviewPath() {
  return '~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json';
}

function extractPastedJsonText(value = '') {
  const text = String(value || '').trim().replace(/^\uFEFF/, '');
  if (!text) return '';

  const fencedMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace >= firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

function parseOauthSetupConfig(payload = {}) {
  const rawConfig = payload.oauthConfig && typeof payload.oauthConfig === 'object'
    ? payload.oauthConfig
    : payload.oauthConfigJson
      ? JSON.parse(extractPastedJsonText(payload.oauthConfigJson))
      : payload;

  const clientSecrets = Array.isArray(rawConfig.CLIENT_SECRETS)
    ? rawConfig.CLIENT_SECRETS
    : Array.isArray(rawConfig.client_secrets)
      ? rawConfig.client_secrets
      : [];

  return {
    clientId: String(rawConfig.CLIENT_ID || rawConfig.client_id || rawConfig.clientId || '').trim(),
    clientSecret: String(clientSecrets[0] || rawConfig.CLIENT_SECRET || rawConfig.client_secret || rawConfig.clientSecret || '').trim(),
    technicalAccountId: String(rawConfig.TECHNICAL_ACCOUNT_ID || rawConfig.technical_account_id || rawConfig.technicalAccountId || '').trim(),
    technicalAccountEmail: String(rawConfig.TECHNICAL_ACCOUNT_EMAIL || rawConfig.technical_account_email || rawConfig.technicalAccountEmail || '').trim(),
    imsOrgId: String(rawConfig.ORG_ID || rawConfig.IMS_ORG_ID || rawConfig.ims_org_id || rawConfig.imsOrgId || '').trim(),
    scopes: normalizeScopes(rawConfig.SCOPES || rawConfig.scopes || rawConfig.scope || [])
  };
}

function validateSetupPayload(payload = {}) {
  const mode = normalizeSetupMode(payload.mode);
  const programId = String(payload.programId || '').trim();

  if (mode === 'browser') {
    const orgId = String(payload.orgId || '').trim();
    if (!orgId) {
      throw new Error('Cloud Manager org ID is required for browser-based setup.');
    }

    return {
      mode,
      orgId,
      programId
    };
  }

  let oauthConfig;
  try {
    oauthConfig = parseOauthSetupConfig(payload);
  } catch (error) {
    throw new Error(`Invalid OAuth JSON: ${error.message}`);
  }

  const clientId = oauthConfig.clientId;
  const clientSecret = oauthConfig.clientSecret;
  const technicalAccountId = oauthConfig.technicalAccountId;
  const technicalAccountEmail = oauthConfig.technicalAccountEmail;
  const imsOrgId = oauthConfig.imsOrgId;
  const scopes = oauthConfig.scopes;
  const missingFields = [];

  if (!imsOrgId) missingFields.push('ORG_ID');
  if (!clientId) missingFields.push('CLIENT_ID');
  if (!clientSecret) missingFields.push('CLIENT_SECRETS[0]');
  if (!technicalAccountId) missingFields.push('TECHNICAL_ACCOUNT_ID');
  if (!technicalAccountEmail) missingFields.push('TECHNICAL_ACCOUNT_EMAIL');
  if (!scopes.length) missingFields.push('SCOPES');

  if (missingFields.length) {
    throw new Error(`OAuth setup JSON is missing required fields: ${missingFields.join(', ')}.`);
  }

  return {
    mode,
    clientId,
    clientSecret,
    technicalAccountId,
    technicalAccountEmail,
    imsOrgId,
    scopes,
    programId
  };
}

function buildOAuthConfig(payload) {
  return {
    client_id: payload.clientId,
    client_secrets: [payload.clientSecret],
    technical_account_id: payload.technicalAccountId,
    technical_account_email: payload.technicalAccountEmail,
    ims_org_id: payload.imsOrgId,
    scopes: payload.scopes,
    oauth_enabled: true
  };
}

function buildCloudManagerSetupPreview(payload = {}) {
  const normalized = validateSetupPayload(payload);
  const steps = [];
  let configJson = '';
  let configPath = '';

  if (normalized.mode === 'browser') {
    steps.push({
      id: 'login',
      label: 'Authenticate with Adobe',
      command: getShellCommandPreview(['auth:login'])
    });
    steps.push({
      id: 'org',
      label: 'Set Cloud Manager org',
      command: getShellCommandPreview(['config:set', 'cloudmanager_orgid', normalized.orgId, '--global'])
    });
    if (normalized.programId) {
      steps.push({
        id: 'program',
        label: 'Set default program',
        command: getShellCommandPreview(['config:set', 'cloudmanager_programid', normalized.programId, '--global'])
      });
    }
  } else {
    configPath = getCloudManagerOAuthConfigPreviewPath();
    configJson = JSON.stringify(buildOAuthConfig(normalized), null, 2);
    steps.push({
      id: 'oauth-config',
      label: 'Store OAuth config JSON',
      command: `Write OAuth config to ${configPath}`
    });
    steps.push({
      id: 'ims-context',
      label: 'Register Cloud Manager IMS context',
      command: getShellCommandPreview(['config:set', 'ims.contexts.aio-cli-plugin-cloudmanager', configPath, '--file', '--json', '--global'])
    });
    steps.push({
      id: 'org',
      label: 'Set Cloud Manager org',
      command: getShellCommandPreview(['config:set', 'cloudmanager_orgid', normalized.imsOrgId, '--global'])
    });
    if (normalized.programId) {
      steps.push({
        id: 'program',
        label: 'Set default program',
        command: getShellCommandPreview(['config:set', 'cloudmanager_programid', normalized.programId, '--global'])
      });
    }
  }

  steps.push({
    id: 'cache',
    label: 'Refresh Cloud Manager cache',
    command: 'Create Cloud Manager metadata cache from aio after setup succeeds'
  });

  return {
    mode: normalized.mode,
    configPath,
    configJson,
    steps
  };
}

async function runAioSetupStep(id, label, args) {
  try {
    const result = await execAioRawCommand(args);
    return {
      id,
      label,
      ok: true,
      detail: stripAnsi(result.stdout || result.stderr || getShellCommandPreview(args)),
      command: getShellCommandPreview(args)
    };
  } catch (result) {
    const error = createCloudManagerError(result.error, result.stderr || result.stdout);
    return {
      id,
      label,
      ok: false,
      detail: error.message,
      command: getShellCommandPreview(args)
    };
  }
}

async function setupCloudManager(payload = {}) {
  const normalized = validateSetupPayload(payload);
  const preview = buildCloudManagerSetupPreview(normalized);
  const steps = [];
  let configPath = '';

  if (normalized.mode === 'oauth') {
    ensureCloudManagerSetupDir();
    const oauthConfig = buildOAuthConfig(normalized);
    configPath = CLOUD_MANAGER_OAUTH_CONFIG_FILE;
    fs.writeFileSync(configPath, `${JSON.stringify(oauthConfig, null, 2)}\n`, 'utf8');
    steps.push({
      id: 'oauth-config',
      label: 'Store OAuth config JSON',
      ok: true,
      detail: configPath,
      command: `Write OAuth config to ${configPath}`
    });

    const imsContextStep = await runAioSetupStep(
      'ims-context',
      'Register Cloud Manager IMS context',
      ['config:set', 'ims.contexts.aio-cli-plugin-cloudmanager', configPath, '--file', '--json', '--global']
    );
    steps.push(imsContextStep);
    if (!imsContextStep.ok) {
      return {
        ok: false,
        error: imsContextStep.detail,
        steps,
        configPath,
        preview
      };
    }

    const orgStep = await runAioSetupStep(
      'org',
      'Set Cloud Manager org',
      ['config:set', 'cloudmanager_orgid', normalized.imsOrgId, '--global']
    );
    steps.push(orgStep);
    if (!orgStep.ok) {
      return {
        ok: false,
        error: orgStep.detail,
        steps,
        configPath,
        preview
      };
    }
  } else {
    const loginStep = await runAioSetupStep('login', 'Authenticate with Adobe', ['auth:login']);
    steps.push(loginStep);
    if (!loginStep.ok) {
      return {
        ok: false,
        error: loginStep.detail,
        steps,
        preview
      };
    }

    const orgStep = await runAioSetupStep(
      'org',
      'Set Cloud Manager org',
      ['config:set', 'cloudmanager_orgid', normalized.orgId, '--global']
    );
    steps.push(orgStep);
    if (!orgStep.ok) {
      return {
        ok: false,
        error: orgStep.detail,
        steps,
        preview
      };
    }
  }

  if (normalized.programId) {
    const programStep = await runAioSetupStep(
      'program',
      'Set default program',
      ['config:set', 'cloudmanager_programid', normalized.programId, '--global']
    );
    steps.push(programStep);
    if (!programStep.ok) {
      return {
        ok: false,
        error: programStep.detail,
        steps,
        configPath,
        preview
      };
    }
  }

  let prerequisites = null;
  try {
    prerequisites = await checkPrerequisites();
  } catch (error) {
    prerequisites = {
      ok: false,
      summary: error.message,
      checks: []
    };
  }

  try {
    const cache = await refreshCloudManagerMetadataCache();
    const environmentErrors = Array.isArray(cache.environmentErrors) ? cache.environmentErrors : [];
    steps.push({
      id: 'cache',
      label: 'Refresh Cloud Manager cache',
      ok: true,
      detail: environmentErrors.length
        ? `Loaded ${cache.programs.length} program(s) into the user-profile cache, but ${environmentErrors.length} program(s) could not load environments.`
        : `Loaded ${cache.programs.length} program(s) into the user-profile cache.`,
      command: preview.steps.find(step => step.id === 'cache')?.command || ''
    });

    return {
      ok: true,
      steps,
      configPath,
      preview,
      prerequisites,
      cache: {
        refreshedAt: cache.refreshedAt,
        totalPrograms: cache.programs.length,
        totalEnvironments: Object.values(cache.environmentsByProgram || {}).reduce((sum, list) => sum + list.length, 0),
        environmentErrors
      }
    };
  } catch (error) {
    const cacheError = error instanceof Error ? error.message : String(error || 'Failed to refresh Cloud Manager cache.');
    steps.push({
      id: 'cache',
      label: 'Refresh Cloud Manager cache',
      ok: false,
      detail: cacheError,
      command: preview.steps.find(step => step.id === 'cache')?.command || ''
    });

    return {
      ok: false,
      error: cacheError,
      steps,
      configPath,
      preview,
      prerequisites,
      cache: {
        refreshedAt: '',
        totalPrograms: 0,
        totalEnvironments: 0
      }
    };
  }
}

function getPrerequisiteRemediation(errorMessage = '') {
  if (/not found/i.test(errorMessage)) {
    return 'Install Adobe aio CLI and ensure `aio` is available in PATH.';
  }
  if (/plugin/i.test(errorMessage)) {
    return 'Run `aio plugins:install @adobe/aio-cli-plugin-cloudmanager`.';
  }
  if (isNetworkCloudManagerFailure(errorMessage) || /Unable to reach Adobe Cloud Manager|internet|VPN|proxy|DNS|cloudmanager\.adobe\.io/i.test(errorMessage)) {
    return 'Check internet, VPN, proxy, DNS, and firewall access to `cloudmanager.adobe.io`.';
  }
  if (isAuthCloudManagerFailure(errorMessage) || /authentication for Cloud Manager is incomplete or expired/i.test(errorMessage)) {
    return 'Run `aio auth:login` and verify the current Adobe identity has Cloud Manager access.';
  }
  if (isConfigCloudManagerFailure(errorMessage) || /org or program configuration|program context/i.test(errorMessage)) {
    return 'Verify `cloudmanager_orgid` and `cloudmanager_programid`, or select the correct Cloud Manager context.';
  }
  if (isPermissionCloudManagerFailure(errorMessage) || /rejected this request|Cloud Manager resources/i.test(errorMessage)) {
    return 'Confirm your Adobe identity has permission to access the target Cloud Manager program and environment.';
  }
  return 'Review the Cloud Manager CLI setup and try again.';
}

function extractDatesFromDownloadedFiles(files = []) {
  return files.map((filePath) => {
    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const match = fileName.match(DATE_TOKEN_PATTERN);
    return {
      filePath,
      fileName,
      extractedDate: match ? match[1].replace(/_/g, '-') : '',
      modifiedAt: new Date(stats.mtimeMs).toISOString()
    };
  });
}

async function checkPrerequisites() {
  const checks = [];

  try {
    const versionResult = await execAioRawCommand(['--version']);
    checks.push({
      id: 'aio',
      label: 'Adobe aio CLI',
      ok: true,
      detail: stripAnsi(versionResult.stdout || versionResult.stderr || 'aio detected'),
      remediationCommand: ''
    });
  } catch (result) {
    const message = createCloudManagerError(result.error, result.stderr || result.stdout).message;
    checks.push({
      id: 'aio',
      label: 'Adobe aio CLI',
      ok: false,
      detail: message,
      remediationCommand: getPrerequisiteRemediation(message)
    });

    return {
      ok: false,
      checks,
      summary: 'Adobe aio CLI is not available.'
    };
  }

  try {
    await execAioRawCommand(['cloudmanager:list-programs', '--help']);
    checks.push({
      id: 'plugin',
      label: 'Cloud Manager plugin',
      ok: true,
      detail: '@adobe/aio-cli-plugin-cloudmanager commands are available',
      remediationCommand: ''
    });
  } catch (result) {
    const message = createCloudManagerError(result.error, result.stderr || result.stdout).message;
    checks.push({
      id: 'plugin',
      label: 'Cloud Manager plugin',
      ok: false,
      detail: message,
      remediationCommand: getPrerequisiteRemediation(message)
    });

    return {
      ok: false,
      checks,
      summary: 'Cloud Manager plugin is not available.'
    };
  }

  try {
    const orgIdResult = await execAioRawCommand(['config', 'get', 'cloudmanager_orgid']);
    const orgValue = stripAnsi(orgIdResult.stdout || '').trim();
    checks.push({
      id: 'org',
      label: 'Cloud Manager org config',
      ok: Boolean(orgValue),
      detail: orgValue || 'cloudmanager_orgid is not configured.',
      remediationCommand: orgValue ? '' : 'Set the Cloud Manager org context or authenticate again with `aio auth:login`.'
    });
  } catch (result) {
    const message = stripAnsi(result.stderr || result.stdout || 'cloudmanager_orgid is not configured.');
    checks.push({
      id: 'org',
      label: 'Cloud Manager org config',
      ok: false,
      detail: message,
      remediationCommand: 'Set the Cloud Manager org context or authenticate again with `aio auth:login`.'
    });
  }

  try {
    const programIdResult = await execAioRawCommand(['config', 'get', 'cloudmanager_programid']);
    const programValue = stripAnsi(programIdResult.stdout || '').trim();
    checks.push({
      id: 'program-config',
      label: 'Default program config',
      ok: Boolean(programValue),
      detail: programValue || 'cloudmanager_programid is not configured.',
      remediationCommand: programValue ? '' : 'Select a program in the UI or set `cloudmanager_programid` in aio config.'
    });
  } catch (result) {
    const message = stripAnsi(result.stderr || result.stdout || 'cloudmanager_programid is not configured.');
    checks.push({
      id: 'program-config',
      label: 'Default program config',
      ok: false,
      detail: message,
      remediationCommand: 'Select a program in the UI or set `cloudmanager_programid` in aio config.'
    });
  }

  try {
    const whereResult = await execAioRawCommand(['where']);
    checks.push({
      id: 'aio-context',
      label: 'aio context',
      ok: true,
      detail: stripAnsi(whereResult.stdout || whereResult.stderr || ''),
      remediationCommand: ''
    });
  } catch (result) {
    const message = stripAnsi(result.stderr || result.stdout || 'Unable to read current aio context.');
    checks.push({
      id: 'aio-context',
      label: 'aio context',
      ok: false,
      detail: message,
      remediationCommand: 'Run `aio where` locally to inspect the active context.'
    });
  }

  try {
    const programs = await fetchProgramsFromCloudManager();
    checks.push({
      id: 'auth',
      label: 'Cloud Manager access',
      ok: true,
      detail: programs.length
        ? `Authenticated and able to list ${programs.length} program(s)`
        : 'Authenticated, but no Cloud Manager programs were returned',
      remediationCommand: ''
    });
  } catch (error) {
    checks.push({
      id: 'auth',
      label: 'Cloud Manager access',
      ok: false,
      detail: error.message,
      remediationCommand: getPrerequisiteRemediation(error.message)
    });
  }

  const ok = checks.every((check) => check.ok);
  return {
    ok,
    checks,
    summary: ok
      ? 'All Cloud Manager prerequisites are available.'
      : 'One or more Cloud Manager prerequisites are missing or not configured.'
  };
}

async function fetchProgramsFromCloudManager() {
  const { stdout, stderr } = await execAioCommand(['cloudmanager:list-programs', '--json']);
  return normalizePrograms(parseJsonOutput(stdout || stderr, 'program'));
}

async function fetchEnvironmentsFromCloudManager(programId) {
  const { stdout, stderr } = await execAioCommand(['cloudmanager:program:list-environments', '--json', '-p', String(programId)]);
  return normalizeEnvironments(parseJsonOutput(stdout || stderr, 'environment'));
}

async function refreshCloudManagerMetadataCache() {
  const programs = await fetchProgramsFromCloudManager();
  const environmentsByProgram = {};
  const environmentErrors = [];

  for (const program of programs) {
    try {
      environmentsByProgram[program.id] = await fetchEnvironmentsFromCloudManager(program.id);
    } catch (error) {
      environmentsByProgram[program.id] = [];
      environmentErrors.push({
        programId: program.id,
        programName: program.name,
        error: error.message
      });
    }
  }

  return writeCloudManagerMetadataCache({
    refreshedAt: new Date().toISOString(),
    programs,
    environmentsByProgram,
    environmentErrors
  });
}

function getCachedPrograms() {
  const cache = readCloudManagerMetadataCache();
  if (!cache.programs.length) {
    throw new Error('Cloud Manager cache is empty. Refresh the cache first.');
  }

  return {
    programs: cache.programs,
    refreshedAt: cache.refreshedAt
  };
}

function getCachedEnvironments(programId) {
  const cache = readCloudManagerMetadataCache();
  const environments = cache.environmentsByProgram[String(programId)] || [];
  if (!cache.programs.length) {
    throw new Error('Cloud Manager cache is empty. Refresh the cache first.');
  }

  return {
    environments,
    refreshedAt: cache.refreshedAt
  };
}

async function listAvailableLogOptions(programId, environmentId) {
  const { stdout, stderr } = await execAioCommand([
    'cloudmanager:environment:list-available-log-options',
    String(environmentId),
    '--json',
    '-p',
    String(programId)
  ]);

  return normalizeLogOptions(parseJsonOutput(stdout || stderr, 'log option'));
}

function buildDownloadCommand(options = {}) {
  return [
    'cloudmanager',
    'environment',
    'download-logs',
    String(options.environmentId),
    String(options.service),
    String(options.logName),
    String(options.days || 1),
    '--programId',
    String(options.programId),
    '--outputDirectory',
    String(options.outputDirectory)
  ];
}

async function downloadLogs(options) {
  const baseDirectory = validateOutputDirectory(options.outputDirectory);
  const days = Number(options.days || 1);

  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('Days must be a positive integer.');
  }

  const runDirectory = createDownloadRunDirectory(baseDirectory, options);
  const downloadCommand = buildDownloadCommand({
    ...options,
    days,
    outputDirectory: runDirectory
  });
  await execAioCommand(downloadCommand);

  const downloadedFiles = collectFilesRecursively(runDirectory).filter(isAllowedLogFile);
  if (!downloadedFiles.length) {
    throw new Error('Cloud Manager did not produce any downloadable log files.');
  }

  const analyzedFile = pickNewestFile(downloadedFiles);

  return {
    outputDirectory: runDirectory,
    downloadedFiles,
    analyzedFile,
    fileDates: extractDatesFromDownloadedFiles(downloadedFiles),
    commandPreview: getAioCommandPreview(downloadCommand)
  };
}

async function describeDownloadedFiles(download) {
  const fileDates = Array.isArray(download.fileDates) ? download.fileDates : [];
  const items = [];

  for (const filePath of download.downloadedFiles || []) {
    const signature = await detectLogSignature(filePath);
    const fileDate = fileDates.find((entry) => entry.filePath === filePath) || {};
    items.push({
      filePath,
      fileName: path.basename(filePath),
      extractedDate: fileDate.extractedDate || '',
      modifiedAt: fileDate.modifiedAt || '',
      logType: signature.logType,
      logFamily: signature.logFamily,
      supported: Boolean(signature.supported),
      unsupportedReason: signature.unsupportedReason || '',
      detectedBy: signature.detectedBy || ''
    });
  }

  return items;
}

function getEstimatedDateRange(days = 1) {
  const parsedDays = Number(days || 1);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - Math.max(parsedDays - 1, 0));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
    label: `Estimated range: ${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)}`
  };
}

module.exports = {
  buildCloudManagerSetupPreview,
  checkPrerequisites,
  buildDownloadCommand,
  getAioCommandPreview,
  getEstimatedDateRange,
  readCloudManagerMetadataCache,
  refreshCloudManagerMetadataCache,
  getCachedPrograms,
  getCachedEnvironments,
  fetchProgramsFromCloudManager,
  fetchEnvironmentsFromCloudManager,
  listAvailableLogOptions,
  downloadLogs,
  describeDownloadedFiles,
  setupCloudManager,
  validateOutputDirectory
};
