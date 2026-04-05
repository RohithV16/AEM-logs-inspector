const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { detectLogSignature } = require('../parser');
const { isAllowedLogFile } = require('../utils/files');

const AIO_BINARY = 'aio';
const DATE_TOKEN_PATTERN = /(\d{4}[-_]\d{2}[-_]\d{2}|\d{2}[-_]\d{2}[-_]\d{4})/;

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

async function fetchProgramsFromCloudManager() {
  const { stdout, stderr } = await execAioCommand(['cloudmanager:list-programs', '--json']);
  return normalizePrograms(parseJsonOutput(stdout || stderr, 'program'));
}

async function fetchEnvironmentsFromCloudManager(programId) {
  const { stdout, stderr } = await execAioCommand(['cloudmanager:program:list-environments', '--json', '-p', String(programId)]);
  return normalizeEnvironments(parseJsonOutput(stdout || stderr, 'environment'));
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
  buildDownloadCommand,
  getAioCommandPreview,
  getEstimatedDateRange,
  fetchProgramsFromCloudManager,
  fetchEnvironmentsFromCloudManager,
  listAvailableLogOptions,
  downloadLogs,
  describeDownloadedFiles,
  validateOutputDirectory
};
