const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { detectLogSignature } = require('../parser');
const { isAllowedLogFile } = require('../utils/files');

const AIO_BINARY = 'aio';
const DATE_TOKEN_PATTERN = /(\d{4}[-_]\d{2}[-_]\d{2}|\d{2}[-_]\d{2}[-_]\d{4})/;
const CLOUD_MANAGER_CACHE_ROOT = path.join(os.homedir(), '.aem-logs');
const CLOUD_MANAGER_CACHE_INDEX = 'index.json';

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

function getCloudManagerCacheRoot() {
  fs.mkdirSync(CLOUD_MANAGER_CACHE_ROOT, { recursive: true });
  return CLOUD_MANAGER_CACHE_ROOT;
}

function getCloudManagerEnvironmentDirectory(programId, environmentId) {
  return path.join(
    getCloudManagerCacheRoot(),
    sanitizeSegment(programId),
    sanitizeSegment(environmentId)
  );
}

function getCloudManagerCacheIndexPath(programId, environmentId) {
  return path.join(getCloudManagerEnvironmentDirectory(programId, environmentId), CLOUD_MANAGER_CACHE_INDEX);
}

function sanitizeSegment(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function normalizeCloudManagerTier(service = '') {
  const value = String(service || '').toLowerCase();
  if (value.includes('author')) return 'author';
  if (value.includes('publish')) return 'publish';
  if (value.includes('dispatcher')) return 'dispatcher';
  return sanitizeSegment(value || 'other');
}

function normalizeExtractedDate(value = '') {
  const raw = String(value || '').replace(/_/g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('-');
    return `${year}-${month}-${day}`;
  }
  return '';
}

function extractDateFromFileName(fileName = '') {
  const match = String(fileName || '').match(DATE_TOKEN_PATTERN);
  return normalizeExtractedDate(match ? match[1] : '');
}

function getFileDateSegment(filePath) {
  const extracted = extractDateFromFileName(path.basename(filePath));
  if (extracted) return extracted;
  const stats = fs.statSync(filePath);
  return new Date(stats.mtimeMs).toISOString().slice(0, 10);
}

function createTempDownloadDirectory(environmentDirectory) {
  const directory = path.join(environmentDirectory, '.tmp', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(directory, { recursive: true });
  return directory;
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
    const extractedDate = extractDateFromFileName(fileName);
    return {
      filePath,
      fileName,
      extractedDate,
      modifiedAt: new Date(stats.mtimeMs).toISOString()
    };
  });
}

function moveFileIntoCache(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  if (fs.existsSync(destinationPath)) {
    fs.unlinkSync(destinationPath);
  }
  try {
    fs.renameSync(sourcePath, destinationPath);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    fs.copyFileSync(sourcePath, destinationPath);
    fs.unlinkSync(sourcePath);
  }
  return destinationPath;
}

function readCacheIndex(programId, environmentId) {
  const indexPath = getCloudManagerCacheIndexPath(programId, environmentId);
  if (!fs.existsSync(indexPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    return Array.isArray(parsed.files) ? parsed.files : [];
  } catch {
    return [];
  }
}

function writeCacheIndex(programId, environmentId, files = []) {
  const environmentDirectory = getCloudManagerEnvironmentDirectory(programId, environmentId);
  fs.mkdirSync(environmentDirectory, { recursive: true });
  const indexPath = getCloudManagerCacheIndexPath(programId, environmentId);
  fs.writeFileSync(indexPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    files
  }, null, 2));
}

async function rebuildCloudManagerCacheIndex(programId, environmentId) {
  const environmentDirectory = getCloudManagerEnvironmentDirectory(programId, environmentId);
  fs.mkdirSync(environmentDirectory, { recursive: true });
  const previousEntries = readCacheIndex(programId, environmentId);
  const previousByPath = new Map(previousEntries.map((entry) => [entry.filePath, entry]));
  const files = collectFilesRecursively(environmentDirectory)
    .filter((filePath) => !filePath.includes(`${path.sep}.tmp${path.sep}`))
    .filter(isAllowedLogFile);

  const described = [];
  for (const filePath of files) {
    const stats = fs.statSync(filePath);
    const previous = previousByPath.get(filePath) || {};
    const signature = await detectLogSignature(filePath);
    const relative = path.relative(environmentDirectory, filePath).split(path.sep).filter(Boolean);
    const tier = previous.tier || relative[0] || normalizeCloudManagerTier(previous.service || '');
    const extractedDate = previous.extractedDate || relative[1] || getFileDateSegment(filePath);
    described.push({
      filePath,
      fileName: path.basename(filePath),
      size: stats.size,
      modifiedAt: new Date(stats.mtimeMs).toISOString(),
      extractedDate,
      tier: tier || 'other',
      service: previous.service || tier || 'other',
      logName: previous.logName || path.basename(filePath),
      cached: true,
      logType: signature.logType,
      logFamily: signature.logFamily,
      supported: Boolean(signature.supported),
      unsupportedReason: signature.unsupportedReason || '',
      detectedBy: signature.detectedBy || ''
    });
  }

  described.sort((a, b) => {
    if (b.extractedDate !== a.extractedDate) return String(b.extractedDate).localeCompare(String(a.extractedDate));
    return b.modifiedAt.localeCompare(a.modifiedAt);
  });
  writeCacheIndex(programId, environmentId, described);
  return described;
}

async function getCloudManagerCacheView(programId, environmentId) {
  const environmentDirectory = getCloudManagerEnvironmentDirectory(programId, environmentId);
  const files = await rebuildCloudManagerCacheIndex(programId, environmentId);
  const grouped = {};

  files.forEach((file) => {
    const tier = file.tier || normalizeCloudManagerTier(file.service);
    const date = file.extractedDate || 'Unknown date';
    if (!grouped[tier]) grouped[tier] = {};
    if (!grouped[tier][date]) grouped[tier][date] = [];
    grouped[tier][date].push(file);
  });

  const tierOrder = { author: 0, publish: 1, dispatcher: 2 };
  const tiers = Object.entries(grouped)
    .sort((a, b) => (tierOrder[a[0]] ?? 99) - (tierOrder[b[0]] ?? 99) || a[0].localeCompare(b[0]))
    .map(([tier, dates]) => ({
      tier,
      totalFiles: Object.values(dates).reduce((count, entries) => count + entries.length, 0),
      supportedFiles: Object.values(dates).reduce((count, entries) => count + entries.filter((entry) => entry.supported !== false).length, 0),
      dates: Object.entries(dates)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, entries]) => ({
          date,
          totalFiles: entries.length,
          files: entries.sort((a, b) => a.fileName.localeCompare(b.fileName))
        }))
    }));

  return {
    cacheRoot: getCloudManagerCacheRoot(),
    environmentDirectory,
    tiers,
    summary: {
      totalFiles: files.length,
      supportedFiles: files.filter((file) => file.supported !== false).length,
      tierCount: tiers.length
    }
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
  const environmentDirectory = getCloudManagerEnvironmentDirectory(options.programId, options.environmentId);
  fs.mkdirSync(environmentDirectory, { recursive: true });
  const days = Number(options.days || 1);

  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('Days must be a positive integer.');
  }

  const runDirectory = createTempDownloadDirectory(environmentDirectory);
  const downloadCommand = buildDownloadCommand({
    ...options,
    days,
    outputDirectory: runDirectory
  });
  try {
    await execAioCommand(downloadCommand);

    const downloadedFiles = collectFilesRecursively(runDirectory).filter(isAllowedLogFile);
    if (!downloadedFiles.length) {
      throw new Error('Cloud Manager did not produce any downloadable log files.');
    }

    const cacheTier = normalizeCloudManagerTier(options.service);
    const cachedFiles = downloadedFiles.map((filePath) => {
      const dateSegment = getFileDateSegment(filePath);
      const destinationPath = path.join(
        environmentDirectory,
        cacheTier,
        sanitizeSegment(dateSegment || 'unknown-date'),
        path.basename(filePath)
      );
      return moveFileIntoCache(filePath, destinationPath);
    });

    const previousEntries = readCacheIndex(options.programId, options.environmentId);
    const entryMap = new Map(previousEntries.map((entry) => [entry.filePath, entry]));
    cachedFiles.forEach((filePath) => {
      const fileName = path.basename(filePath);
      const existing = entryMap.get(filePath) || {};
      entryMap.set(filePath, {
        ...existing,
        filePath,
        fileName,
        extractedDate: existing.extractedDate || extractDateFromFileName(fileName),
        tier: cacheTier,
        service: options.service,
        logName: options.logName,
        cached: true
      });
    });
    writeCacheIndex(options.programId, options.environmentId, Array.from(entryMap.values()));

    const analyzedFile = pickNewestFile(cachedFiles);

    return {
      cacheRoot: getCloudManagerCacheRoot(),
      outputDirectory: environmentDirectory,
      environmentDirectory,
      downloadedFiles: cachedFiles,
      analyzedFile,
      fileDates: extractDatesFromDownloadedFiles(cachedFiles),
      commandPreview: getAioCommandPreview(downloadCommand)
    };
  } finally {
    fs.rmSync(runDirectory, { recursive: true, force: true });
  }
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
  validateOutputDirectory,
  getCloudManagerCacheRoot,
  getCloudManagerEnvironmentDirectory,
  getCloudManagerCacheView
};
