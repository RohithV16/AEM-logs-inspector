const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { createLogStream } = require('../parser');
const { categorizeError } = require('../categorizer');
const { groupEntries, groupEntriesStream, getSummaryFromEntries, getSummaryStream, normalizeMessage } = require('../grouper');
const { getCached, setCached } = require('../utils/analysisCache');
const { STREAM_THRESHOLD } = require('../utils/constants');

/* === Exception Token Regex === */

const EXCEPTION_TOKEN_REGEX = /\b(?:[a-zA-Z_$][\w$]*\.)*[A-Z][\w$]*(?:Exception|Error)\b/g;

function extractExceptionNames(text) {
  if (!text) return [];
  const matches = String(text).match(EXCEPTION_TOKEN_REGEX);
  return matches ? [...new Set(matches)] : [];
}

function getEntryExceptionNames(entry) {
  const names = new Set();
  if (entry.message) {
    extractExceptionNames(entry.message).forEach(n => names.add(n));
  }
  if (entry.stackTrace) {
    extractExceptionNames(entry.stackTrace).forEach(n => names.add(n));
  }
  return [...names];
}

function matchesExceptionFilter(entry, exception) {
  if (!exception) return true;
  const filterLower = String(exception).toLowerCase();
  const extracted = getEntryExceptionNames(entry);

  for (const name of extracted) {
    if (name.toLowerCase() === filterLower) return true;
    const simpleName = name.split('.').pop();
    if (simpleName.toLowerCase() === filterLower) return true;
    if (name.toLowerCase().includes(filterLower)) return true;
  }

  const rawText = String(entry.message || '') + ' ' + String(entry.stackTrace || '');
  return rawText.toLowerCase().includes(filterLower);
}

/* === Package Derivation === */

function cleanLoggerName(logger) {
  if (!logger) return '';
  /* Strip common AEM/Sling thread prefixes that can be prepended to loggers in some configurations */
  return String(logger).replace(/^(?:sling-default-\d+-|qtp\d+-\d+-|oak-repository-executor-\d+-|\[[^\]]+\]\s+)/, '');
}

function derivePackageGroup(logger) {
  if (!logger) return null;
  const clean = cleanLoggerName(logger);
  const parts = clean.split('.');
  /* Standardize on first 3 segments for detailed categorization (e.g. com.adobe.cq) 
     Falls back to 2 or 1 if fewer segments are available. */
  if (parts.length >= 3) {
    return parts.slice(0, 3).join('.');
  }
  if (parts.length >= 2) {
    return parts.slice(0, 2).join('.');
  }
  return parts[0];
}

function matchesFilterText(actualValue, filterValue) {
  if (!filterValue) return true;
  if (Array.isArray(filterValue) && filterValue.length === 0) return true;

  const values = Array.isArray(filterValue) ? filterValue : [filterValue];
  const actualText = String(actualValue || '');

  return values.some((value) => {
    const pattern = String(value || '').trim();
    if (!pattern) return false;

    if (actualText === pattern || actualText.includes(pattern)) {
      return true;
    }

    try {
      return new RegExp(pattern, 'i').test(actualText);
    } catch {
      return false;
    }
  });
}

/* === Core Analysis === */

/**
 * Analyzes error logs in a single streaming pass, collecting comprehensive metrics.
 * @param {string} filePath - Path to the error log file
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Analysis results including summary, grouped errors, loggers, threads, packages, exceptions, and timeline
 */
function shouldUseWorkerForAnalysis(filePath, onProgress, options = {}) {
  if (options.disableWorker) return false;
  if (!filePath) return false;
  return fs.statSync(filePath).size > STREAM_THRESHOLD;
}

function runAnalysisWorker(service, filePath, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../workers/analyzeWorker.js'), {
      workerData: { service, filePath }
    });

    worker.on('message', (message) => {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'progress' && onProgress) {
        onProgress(message.payload || {});
        return;
      }
      if (message.type === 'result') {
        resolve(message.payload);
      }
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Analysis worker exited with code ${code}`));
      }
    });
  });
}

async function analyzeAllInOnePassFromStream(stream, filePath, onProgress) {
  if (!onProgress) {
    const cached = getCached(filePath);
    if (cached) return cached;
  }

  const fileSize = fs.statSync(filePath).size;

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalLines = 0;
  const uniqueErrorMessages = new Set();
  const uniqueWarningMessages = new Set();
  const grouped = {};
  const loggers = {};
  const threads = {};
  const pods = {};
  const packages = {};
  const exceptions = {};
  const categories = {};
  const httpMethods = {};
  const packageThreads = {};
  const packageExceptions = {};
  const timeline = {};
  const levelCounts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };

  for await (const entry of stream) {
    totalLines++;

    if (entry.level && levelCounts[entry.level] !== undefined) {
      levelCounts[entry.level]++;
    }

    if (entry.level === 'ERROR') {
      totalErrors++;
      uniqueErrorMessages.add(normalizeMessage(entry.message));
    } else if (entry.level === 'WARN') {
      totalWarnings++;
      uniqueWarningMessages.add(normalizeMessage(entry.message));
    }

    /* Group errors/warnings by normalized message to identify recurring issues.
       Normalization collapses whitespace and removes dynamic values that would
       otherwise fragment the same error into multiple groups. */
    if (entry.level === 'ERROR' || entry.level === 'WARN') {
      const normalized = normalizeMessage(entry.message);
      const key = `${entry.level}:${normalized}`;

      if (!grouped[key]) {
        grouped[key] = {
          level: entry.level,
          message: normalized,
          count: 0,
          firstOccurrence: entry.timestamp,
          examples: [],
          /* Categorize using both message and logger - some errors are context-dependent */
          category: categorizeError(entry.message, entry.logger)
        };
      }

      grouped[key].count++;
      /* Collect up to 3 examples for debugging - these provide concrete instances
         of the error with full context (timestamp, logger, thread, stack trace) */
      if (grouped[key].examples.length < 3) {
        grouped[key].examples.push({
          timestamp: entry.timestamp,
          logger: entry.logger,
          thread: entry.thread,
          stackTrace: entry.stackTrace || ''
        });
      }

      const cat = categorizeError(entry.message, entry.logger);
      categories[cat] = (categories[cat] || 0) + 1;
    }

    const pkg = entry.logger ? derivePackageGroup(entry.logger) : null;

    if (entry.logger) {
      
      loggers[entry.logger] = (loggers[entry.logger] || 0) + 1;
      if (pkg) {
        packages[pkg] = (packages[pkg] || 0) + 1;
      }
    }
    if (entry.httpMethod) {
      httpMethods[entry.httpMethod] = (httpMethods[entry.httpMethod] || 0) + 1;
    }
    const packageToken = entry.instanceId || entry.thread;
    if (packageToken) {
      if (entry.thread) threads[entry.thread] = (threads[entry.thread] || 0) + 1;
      if (pkg) {
        if (!packageThreads[pkg]) packageThreads[pkg] = {};
        packageThreads[pkg][packageToken] = (packageThreads[pkg][packageToken] || 0) + 1;
      }
    }
    if (entry.instanceId) {
      pods[entry.instanceId] = (pods[entry.instanceId] || 0) + 1;
    }

    const exceptionNames = getEntryExceptionNames(entry);
    exceptionNames.forEach(name => {
      exceptions[name] = (exceptions[name] || 0) + 1;
      if (pkg) {
        if (!packageExceptions[pkg]) packageExceptions[pkg] = {};
        packageExceptions[pkg][name] = (packageExceptions[pkg][name] || 0) + 1;
      }
    });

    /* Build hourly timeline for identifying error bursts or patterns over time.
       Using hour granularity balances detail with memory efficiency for large logs. */
    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { ERROR: 0, WARN: 0, total: 0 };
      timeline[hour].total++;
      if (entry.level === 'ERROR') timeline[hour].ERROR++;
      if (entry.level === 'WARN') timeline[hour].WARN++;
    }

    if (onProgress && totalLines % 100000 === 0) {
      onProgress({ fileSize, totalLines, percent: 0 });
    }
  }

  if (onProgress) {
    onProgress({ fileSize, totalLines, percent: 100 });
  }

  const result = {
    summary: {
      totalErrors,
      totalWarnings,
      uniqueErrors: uniqueErrorMessages.size,
      uniqueWarnings: uniqueWarningMessages.size,
      totalLines
    },
    results: Object.values(grouped).sort((a, b) => b.count - a.count),
    loggers,
    threads,
    pods,
    packages,
    exceptions,
    categories,
    httpMethods,
    packageThreads,
    packageExceptions,
    timeline,
    levelCounts: { ...levelCounts, ALL: levelCounts.ERROR + levelCounts.WARN + levelCounts.INFO + levelCounts.DEBUG }
  };

  if (!onProgress) {
    setCached(filePath, result);
  }

  return result;
}

async function analyzeAllInOnePass(filePath, onProgress, options = {}) {
  if (shouldUseWorkerForAnalysis(filePath, onProgress, options)) {
    return runAnalysisWorker('error', filePath, onProgress);
  }

  const stream = createLogStream(filePath, { levels: 'all' });
  return analyzeAllInOnePassFromStream(stream, filePath, onProgress);
}

/* === Filter Functions === */

/**
 * Builds a filter function for error log entries based on multiple criteria.
 * @param {Object} filters - Filter parameters
 * @param {string} filters.level - Log level (ERROR, WARN, INFO, etc.)
 * @param {string} filters.search - Regex search pattern for message content
 * @param {string} filters.from - Start date filter (ISO string or log format)
 * @param {string} filters.to - End date filter
 * @param {string|string[]} filters.logger - Logger name or pattern match
 * @param {string|string[]} filters.thread - Thread or pod name or pattern match
 * @param {string[]} filters.package - Array of package prefixes to match
 * @param {string} filters.exception - Exception type to search for in stack traces
 * @param {string} filters.category - Error category from categorizer
 * @param {string} filters.httpMethod - HTTP method extracted from error log request context
 * @param {string} filters.requestPath - Request path extracted from error log request context
 * @returns {function} Filter function that returns true for matching entries
 */
function buildEntryFilter(filters = {}) {
  const { level, search, from, to, logger, thread, pod, package: pkg, exception, category, httpMethod, requestPath } = filters;
  const packages = Array.isArray(pkg) ? pkg : (pkg ? [pkg] : []);
  let searchRegex = null;

  /* Safely compile user-provided regex - invalid patterns should not crash the service */
  if (search) {
    try {
      searchRegex = new RegExp(search, 'i');
    } catch (e) {
      /* Invalid regex, skip - filter will not apply text matching */
    }
  }

  /* Pre-normalize date filters to ensure consistent clock-time comparison regardless of timezone.
     AEM logs usually reflect server local time, so we treat filter bounds as local if possible. */
  const parseFilterDate = (dateStr) => {
    if (!dateStr) return null;
    // If no timezone/Z, append Z to match how we parse log timestamps
    const normalized = dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+') 
      ? dateStr + 'Z' 
      : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const fromDate = parseFilterDate(from);
  const toDate = parseFilterDate(to);

  /* AEM logs use DD.MM.YYYY HH:mm:ss format which JavaScript Date doesn't parse natively.
     This handles both the log format and returns a Date object. */
  /**
   * Robustly parses log timestamps into Date objects.
   * Handles AEM format (DD.MM.YYYY HH:mm:ss.SSS) and ISO format.
   * Forced into UTC (Z) to match UI bounds.
   */
  function parseLogTimestamp(ts) {
    if (!ts) return null;
    const tsStr = String(ts).trim();
    
    // AEM format: DD.MM.YYYY HH:mm:ss[.SSS]
    const match = tsStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})(?:\.(\d{3}))?/);
    if (match) {
      const ms = match[5] || '000';
      return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}.${ms}Z`);
    }

    // Fallback for ISO format (CDN)
    const d = new Date(tsStr);
    if (!isNaN(d.getTime())) {
      // If no timezone, force UTC
      if (tsStr.includes('T') && !tsStr.includes('Z') && !tsStr.includes('+')) {
        return new Date(tsStr + 'Z');
      }
      return d;
    }
    return null;
  }

  /* Returns a filter function that tests each log entry against all criteria.
     Uses early returns for efficiency - fails fast on first non-match. */
  return (entry) => {
    if (process.env.DEBUG_FILTERS) console.log('Filtering Error Entry:', entry.timestamp, 'Filters:', JSON.stringify(filters));
    if (level && level !== 'ALL' && entry.level !== level) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: level', entry.level, '!==', level);
      return false;
    }
    if (searchRegex) {
      const searchText = [entry.message, entry.logger, entry.threadName, entry.stackTrace]
        .filter(Boolean).join(' ');
      if (!searchRegex.test(searchText)) {
        if (process.env.DEBUG_FILTERS) console.log('Mismatch: search');
        return false;
      }
    }
    if (fromDate || toDate) {
      const entryDate = parseLogTimestamp(entry.timestamp);
      if (entryDate) {
        const entryTime = entryDate.getTime();
        if (fromDate && entryTime < fromDate.getTime()) {
           if (process.env.DEBUG_FILTERS) console.log('Mismatch: fromDate', entryDate.toISOString(), '<', fromDate.toISOString());
           return false;
        }
        if (toDate && entryTime > toDate.getTime()) {
           if (process.env.DEBUG_FILTERS) console.log('Mismatch: toDate', entryDate.toISOString(), '>', toDate.toISOString());
           return false;
        }
      } else {
        if (process.env.DEBUG_FILTERS) console.log('Mismatch: entryDate unparseable', entry.timestamp);
      }
    }
    if (!matchesFilterText(entry.logger, logger)) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: logger');
      return false;
    }
    if (!matchesFilterText(entry.thread, thread)) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: thread');
      return false;
    }
    if (pod && entry.instanceId !== pod && entry.thread !== pod) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: pod');
      return false;
    }
    if (httpMethod && String(entry.httpMethod || '').toUpperCase() !== String(httpMethod).toUpperCase()) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: httpMethod');
      return false;
    }
    if (requestPath && !String(entry.requestPath || '').toLowerCase().includes(String(requestPath).toLowerCase())) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: requestPath');
      return false;
    }
    if (packages.length > 0) {
      if (!entry.logger) return false;
      const matches = packages.some(p => {
        return entry.logger === p || entry.logger.startsWith(p + '.');
      });
      if (!matches) {
        if (process.env.DEBUG_FILTERS) console.log('Mismatch: package');
        return false;
      }
    }
    if (!matchesExceptionFilter(entry, exception)) {
      if (process.env.DEBUG_FILTERS) console.log('Mismatch: exception');
      return false;
    }
    if (category) {
      const entryCategory = categorizeError(entry.message, entry.logger);
      if (entryCategory !== category) {
        if (process.env.DEBUG_FILTERS) console.log('Mismatch: category');
        return false;
      }
    }
    return true;
  };
}

/**
 * Counts log entries matching the given filters without loading them into memory.
 * Uses streaming for memory efficiency with large log files.
 * @param {string} filePath - Path to the error log file
 * @param {Object} filters - Filter criteria (see buildEntryFilter)
 * @returns {Promise<number>} Count of matching entries
 */
async function countMatchingEntries(filePath, filters = {}) {
  const stream = createLogStream(filePath, { levels: 'all' });
  const filter = buildEntryFilter(filters);
  let count = 0;

  for await (const entry of stream) {
    if (filter(entry)) count++;
  }

  return count;
}

/**
 * Counts entries at specific log levels - optimized version that skips parsing.
 * @param {string} filePath - Path to the error log file
 * @param {string[]} levels - Array of log levels to count (default: ['ERROR', 'WARN'])
 * @returns {Promise<number>} Count of entries matching the levels
 */
async function countMatchingEntriesWithLevels(filePath, levels = ['ERROR', 'WARN']) {
  const stream = createLogStream(filePath, { levels });
  let count = 0;

  for await (const _entry of stream) {
    count++;
  }

  return count;
}

/**
 * Extracts a paginated subset of matching log entries.
 * @param {string} filePath - Path to the error log file
 * @param {Object|function} filters - Filter criteria or pre-built filter function
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of entries per page
 * @returns {Promise<Object>} Object with entries array, total count, and level counts
 */
async function extractPage(filePath, filters = {}, page = 1, pageSize = 50) {
  const stream = createLogStream(filePath, { levels: 'all' });
  return extractPageFromStream(stream, filters, page, pageSize);
}

async function extractPageFromStream(stream, filters = {}, page = 1, pageSize = 50) {
  const filter = typeof filters === 'function' ? filters : buildEntryFilter(filters);
  const entries = [];
  const levelCounts = { ALL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
  let skipped = (page - 1) * pageSize;
  let pageCount = 0;

  for await (const entry of stream) {
    if (filter(entry)) {
      levelCounts.ALL++;
      if (entry.level) levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
      
      if (skipped > 0) {
        skipped--;
      } else if (entries.length < pageSize) {
        entries.push(entry);
      }
      pageCount++;
    }
  }

  return { entries, total: pageCount, levelCounts };
}

async function extractPageWithBaseCounts(filePath, activeFilters = {}, page = 1, pageSize = 50) {
  const stream = createLogStream(filePath, { levels: 'all' });
  const filtered = typeof activeFilters === 'function' ? activeFilters : buildEntryFilter(activeFilters);
  const baseFilters = { ...(activeFilters || {}) };
  delete baseFilters.level;
  delete baseFilters.severity;
  const baseFilter = buildEntryFilter(baseFilters);
  const entries = [];
  const levelCounts = { ALL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
  const uniqueLoggers = new Set();
  const uniquePackages = new Set();
  const uniqueThreads = new Set();
  const uniqueExceptions = new Set();
  let skipped = (page - 1) * pageSize;
  let total = 0;

  for await (const entry of stream) {
    if (baseFilter(entry)) {
      levelCounts.ALL++;
      if (entry.level) levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
    }

    if (entry.logger) uniqueLoggers.add(entry.logger);
    if (entry.threadName) uniqueThreads.add(entry.threadName);
    if (entry.exception) uniqueExceptions.add(entry.exception);
    if (entry.logger) {
      const pkg = derivePackageGroup(entry.logger);
      if (pkg) uniquePackages.add(pkg);
    }

    if (!filtered(entry)) continue;

    total++;
    if (skipped > 0) {
      skipped--;
    } else if (entries.length < pageSize) {
      entries.push(entry);
    }
  }

  return { 
    entries, 
    total, 
    levelCounts,
    loggers: Array.from(uniqueLoggers).sort(),
    packages: Array.from(uniquePackages).sort(),
    threads: Array.from(uniqueThreads).sort(),
    exceptions: Array.from(uniqueExceptions).sort()
  };
}

module.exports = {
  analyzeAllInOnePass,
  analyzeAllInOnePassFromStream,
  buildEntryFilter,
  countMatchingEntries,
  countMatchingEntriesWithLevels,
  extractPage,
  extractPageFromStream,
  extractPageWithBaseCounts,
  groupEntries,
  groupEntriesStream,
  getSummaryFromEntries,
  getSummaryStream,
  extractExceptionNames,
  getEntryExceptionNames,
  matchesExceptionFilter
};
