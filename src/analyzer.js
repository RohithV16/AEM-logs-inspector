/* === Core Analysis Functions === */
const { parseLogFile, parseAllLevels, parseTimestamp, createLogStream, createRequestLogStream, createCDNLogStream, detectLogType } = require('./parser');
const { categorizeError } = require('./categorizer');
const fs = require('fs');

const { normalizeMessage, groupEntries, groupEntriesStream, getSummaryFromEntries, getSummaryStream } = require('./grouper');
const { exportToCSV, exportToJSON, generatePDFSummary } = require('./exporter');
const errorLogService = require('./services/errorLogService');
const { extractExceptionNames } = errorLogService;
const requestLogService = require('./services/requestLogService');
const cdnLogService = require('./services/cdnLogService');
const { isSafeRegex } = require('./utils/regex');

/**
 * Analyzes AEM error log file - shorthand for parse + group workflow
 * Filters to ERROR/WARN entries and groups by normalized message
 * @param {string} filePath - Path to error log
 * @returns {Array} Grouped error entries sorted by frequency
 */
function analyzeLogFile(filePath) {
  const entries = parseLogFile(filePath);
  return groupEntries(entries);
}

/**
 * Gets summary statistics for an error log file
 * @param {string} filePath - Path to error log
 * @returns {Object} Summary with error/warning counts
 */
function getSummary(filePath) {
  const entries = parseLogFile(filePath);
  return getSummaryFromEntries(entries);
}

/* === Filtering Functions === */

/**
 * Filters log entries by timestamp range
 * @param {Array} entries - Log entries to filter
 * @param {Date} startDate - Optional start of range
 * @param {Date} endDate - Optional end of range
 * @returns {Array} Filtered entries
 */
function filterByDateRange(entries, startDate, endDate) {
  if (!startDate && !endDate) return entries;
  
  return entries.filter(entry => {
    const entryDate = entry.timestamp ? new Date(entry.timestamp) : null;
    if (!entryDate) return false;
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });
}

/**
 * Filters entries by Java logger class name pattern
 * @param {Array} entries - Log entries
 * @param {string} loggerPattern - Regex pattern to match logger
 * @returns {Object} {entries, error} - Filtered results or error message
 */
function filterByLogger(entries, loggerPattern) {
  const validation = isSafeRegex(loggerPattern);
  if (validation && validation.error) {
    return { entries: [], error: validation.error };
  }
  
  const regex = new RegExp(loggerPattern, 'i');
  const filtered = entries.filter(e => e.logger && regex.test(e.logger));
  return { entries: filtered, error: null };
}

/**
 * Filters entries by thread name pattern
 * @param {Array} entries - Log entries
 * @param {string} threadPattern - Regex pattern to match thread
 * @returns {Object} {entries, error}
 */
function filterByThread(entries, threadPattern) {
  const validation = isSafeRegex(threadPattern);
  if (validation && validation.error) {
    return { entries: [], error: validation.error };
  }
  
  const regex = new RegExp(threadPattern, 'i');
  const filtered = entries.filter(e => e.thread && regex.test(e.thread));
  return { entries: filtered, error: null };
}

/**
 * Filters entries by message content using regex
 * @param {Array} entries - Log entries
 * @param {string} regexPattern - Regex to search in message
 * @returns {Object} {entries, error}
 */
function filterByRegex(entries, regexPattern) {
  const validation = isSafeRegex(regexPattern);
  if (validation && validation.error) {
    return { entries: [], error: validation.error };
  }
  
  const regex = new RegExp(regexPattern, 'i');
  const filtered = entries.filter(e => e.message && regex.test(e.message));
  return { entries: filtered, error: null };
}

/* === Package Grouping === */
// Extracts top-level package from fully-qualified Java class names
// e.g., "org.apache.sling.api.ServletResolver" -> "org.apache.sling"

function cleanLoggerName(logger) {
  if (!logger) return '';
  return String(logger).replace(/^(?:sling-default-\d+-|qtp\d+-\d+-|oak-repository-executor-\d+-|\[[^\]]+\]\s+)/, '');
}

function derivePackageGroup(logger) {
  if (!logger) return null;
  const clean = cleanLoggerName(logger);
  
  /* Handle hostnames and pod names as packages */
  if (clean.includes('.')) {
    const parts = clean.split('.');
    /* If it looks like a reverse DNS (com.example...) or hostname (example.com) */
    if (parts.length >= 3) {
      return parts.slice(0, 3).join('.');
    }
    return parts.slice(0, 2).join('.');
  }
  
  /* If it's a pod name or simple string, take it as is or first segment if hyphenated */
  if (clean.includes('-')) {
    return clean.split('-').slice(0, 2).join('-');
  }
  
  return clean;
}

function createEmptyErrorFilterStats() {
  return {
    loggers: {},
    threads: {},
    packages: {},
    exceptions: {},
    httpMethods: {},
    packageThreads: {},
    packageExceptions: {},
    categories: {},
    pods: {},
    timeline: {},
    hourlyHeatmap: {
      heatmap: {},
      days: new Set()
    }
  };
}

function addCount(bucket, key, amount = 1) {
  if (!key) return;
  bucket[key] = (bucket[key] || 0) + amount;
}

function collectErrorFilterStats(stats, entry) {
  const pkg = derivePackageGroup(entry.logger);
  
  if (entry.logger) {
    addCount(stats.loggers, entry.logger);
    if (pkg) addCount(stats.packages, pkg);
  } else if (entry.pod) {
    addCount(stats.loggers, entry.pod);
    const podPkg = derivePackageGroup(entry.pod);
    if (podPkg) addCount(stats.packages, podPkg);
  } else if (entry.host) {
    addCount(stats.loggers, entry.host);
    const hostPkg = derivePackageGroup(entry.host);
    if (hostPkg) addCount(stats.packages, hostPkg);
  }

  if (entry.httpMethod || entry.method) {
    addCount(stats.httpMethods, entry.httpMethod || entry.method);
  }

  const threadToken = entry.thread || entry.threadId;
  if (threadToken) addCount(stats.threads, threadToken);
  
  const podToken = entry.instanceId || entry.pod;
  if (podToken) addCount(stats.pods, podToken);

  if (pkg && threadToken) {
    if (!stats.packageThreads[pkg]) stats.packageThreads[pkg] = {};
    addCount(stats.packageThreads[pkg], threadToken);
  }

  const exceptionNames = [
    ...(entry.message ? extractExceptionNames(entry.message) : []),
    ...(entry.stackTrace ? extractExceptionNames(entry.stackTrace) : [])
  ];
  const uniqueExceptions = [...new Set(exceptionNames)];

  uniqueExceptions.forEach((exceptionName) => {
    addCount(stats.exceptions, exceptionName);
    if (pkg) {
      if (!stats.packageExceptions[pkg]) stats.packageExceptions[pkg] = {};
      addCount(stats.packageExceptions[pkg], exceptionName);
    }
  });

  if (entry.level === 'ERROR' || entry.level === 'WARN') {
    const category = categorizeError(entry.message || '', entry.logger || '');
    addCount(stats.categories, category);
  }

  if (entry.timestamp) {
    // Safely extract the hour bucket key based on timestamp format
    let hour = entry.timestamp.substring(0, 13);
    if (entry.timestamp.includes('/') && entry.timestamp.includes(':')) {
      // Request log (CLF): DD/Mon/YYYY:HH:mm:ss -> DD/Mon/YYYY:HH
      hour = entry.timestamp.substring(0, 14);
    } else if (entry.timestamp.includes('T')) {
      // ISO/CDN: YYYY-MM-DDTHH:mm:ss -> YYYY-MM-DDTHH
      hour = entry.timestamp.substring(0, 13);
    }

    if (!stats.timeline[hour]) stats.timeline[hour] = { ERROR: 0, WARN: 0, total: 0, INFO: 0 };
    stats.timeline[hour].total++;
    const level = entry.level || 'INFO';
    if (stats.timeline[hour][level] !== undefined) {
      stats.timeline[hour][level]++;
    } else {
      stats.timeline[hour][level] = 1;
    }

    const date = entry.timestamp.substring(0, 10);
    const hourNumber = parseInt(entry.timestamp.includes(' ') ? entry.timestamp.substring(11, 13) : entry.timestamp.substring(11, 13), 10);
    stats.hourlyHeatmap.days.add(date);
    if (!stats.hourlyHeatmap.heatmap[hourNumber]) stats.hourlyHeatmap.heatmap[hourNumber] = {};
    if (!stats.hourlyHeatmap.heatmap[hourNumber][date]) stats.hourlyHeatmap.heatmap[hourNumber][date] = 0;
    stats.hourlyHeatmap.heatmap[hourNumber][date]++;
  }
}

function buildErrorFilterStats(entries = []) {
  const stats = createEmptyErrorFilterStats();
  for (const entry of entries) {
    collectErrorFilterStats(stats, entry);
  }
  return {
    ...stats,
    hourlyHeatmap: {
      heatmap: stats.hourlyHeatmap.heatmap,
      days: Array.from(stats.hourlyHeatmap.days).sort()
    }
  };
}

/**
 * Filters entries by Java package (supports subpackages via prefix matching)
 * @param {Array} entries - Log entries
 * @param {Array} packagePatterns - Array of package names to match
 * @returns {Object} {entries, error}
 */
function filterByPackage(entries, packagePatterns) {
  if (!packagePatterns || packagePatterns.length === 0) {
    return { entries, error: null };
  }
  
  const filtered = entries.filter(e => {
    if (!e.logger) return false;
    const entryPkg = derivePackageGroup(e.logger);
    if (!entryPkg) return false;
    // Support both exact match and subpackage matching (org.apache matches org.apache.sling)
    return packagePatterns.some(p => entryPkg === p || entryPkg.startsWith(p + '.'));
  });
  
  return { entries: filtered, error: null };
}

/* === Distribution & Timeline Analysis === */

/**
 * Generates hourly timeline of errors/warnings for trend analysis
 * @param {Array} entries - Log entries
 * @returns {Object} Timeline keyed by hour (YYYY-MM-DD HH)
 */
function getTimelineData(entries) {
  const timeline = {};
  
  for (const entry of entries) {
    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { ERROR: 0, WARN: 0, total: 0 };
      timeline[hour].total++;
      if (entry.level === 'ERROR') timeline[hour].ERROR++;
      if (entry.level === 'WARN') timeline[hour].WARN++;
    }
  }
  
  return timeline;
}

/**
 * Gets distribution of log entries by logger class
 * Useful for identifying which components generate most errors
 * @param {Array} entries - Log entries
 * @returns {Array} Sorted array of {logger, count}
 */
function getLoggerDistribution(entries) {
  const loggers = {};
  
  for (const entry of entries) {
    if (entry.logger) {
      loggers[entry.logger] = (loggers[entry.logger] || 0) + 1;
    }
  }
  
  return Object.entries(loggers)
    .map(([logger, count]) => ({ logger, count }))
    .sort((a, b) => b.count - a.count);
}

/* === Streaming Analysis === */

/**
 * Analyzes large log files with progress callback
 * Processes in streaming fashion to avoid memory issues
 * @param {string} filePath - Path to log file
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Array} All parsed entries
 */
async function analyzeLogFileStream(filePath, onProgress) {
  const stream = createLogStream(filePath);
  const fileSize = fs.statSync(filePath).size;
  let totalLines = 0;
  const results = [];

  for await (const entry of stream) {
    totalLines++;
    results.push(entry);
    // Report progress every 100k lines to balance overhead with responsiveness
    if (onProgress && totalLines % 100000 === 0) {
      onProgress({ fileSize, totalLines, percent: Math.round((totalLines / fileSize) * 100) });
    }
  }

  if (onProgress) {
    onProgress({ fileSize, totalLines, percent: 100 });
  }

  return results;
}

/**
 * Streaming version of getTimelineData for large files
 * @param {AsyncIterator} stream - Log entry stream
 * @returns {Object} Timeline data keyed by hour
 */
async function getTimelineDataStream(stream) {
  const timeline = {};
  
  for await (const entry of stream) {
    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { ERROR: 0, WARN: 0, total: 0 };
      timeline[hour].total++;
      if (entry.level === 'ERROR') timeline[hour].ERROR++;
      if (entry.level === 'WARN') timeline[hour].WARN++;
    }
  }
  
  return timeline;
}

/**
 * Streaming version of getLoggerDistribution
 * @param {AsyncIterator} stream - Log entry stream
 * @returns {Array} Sorted logger distribution
 */
async function getLoggerDistributionStream(stream) {
  const loggers = {};
  
  for await (const entry of stream) {
    if (entry.logger) {
      loggers[entry.logger] = (loggers[entry.logger] || 0) + 1;
    }
  }
  
  return Object.entries(loggers)
    .map(([logger, count]) => ({ logger, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Combined filter and analysis in single stream pass
 * Optimizes performance by avoiding multiple file iterations
 * @param {AsyncIterator} stream - Log entry stream
 * @param {Object} filters - Filter options (level, logger, dateRange, etc.)
 * @returns {Object} Grouped results with summary stats
 */
async function filterAndAnalyzeStream(stream, filters = {}) {
  const grouped = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  const uniqueErrorMessages = new Set();
  const uniqueWarningMessages = new Set();
  let filterError = null;
  const stats = createEmptyErrorFilterStats();

  // Build compound filter once for efficiency
  const filter = filters ? errorLogService.buildEntryFilter(filters) : null;

  for await (const entry of stream) {
    if (filter && !filter(entry)) continue;

    collectErrorFilterStats(stats, entry);

    if (entry.level === 'ERROR') {
      totalErrors++;
      uniqueErrorMessages.add(normalizeMessage(entry.message));
    } else if (entry.level === 'WARN') {
      totalWarnings++;
      uniqueWarningMessages.add(normalizeMessage(entry.message));
    }

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
          category: categorizeError(entry.message, entry.logger)
        };
      }

      grouped[key].count++;
      // Limit examples to 3 per group to keep response size manageable
      if (grouped[key].examples.length < 3) {
        grouped[key].examples.push({
          timestamp: entry.timestamp,
          logger: entry.logger,
          thread: entry.thread,
          stackTrace: entry.stackTrace || ''
        });
      }
    }
  }

  return {
    results: Object.values(grouped).sort((a, b) => b.count - a.count),
    summary: {
      totalErrors,
      totalWarnings,
      uniqueErrors: uniqueErrorMessages.size,
      uniqueWarnings: uniqueWarningMessages.size
    },
    filterError,
    ...stats,
    hourlyHeatmap: {
      heatmap: stats.hourlyHeatmap.heatmap,
      days: Array.from(stats.hourlyHeatmap.days).sort()
    }
  };
}

/* === Visualization Data Helpers === */

/**
 * Generates hourly heatmap data for day/hour visualization
 * @param {Array} entries - Log entries
 * @returns {Object} {heatmap: {hour: {date: count}}, days: array of dates}
 */
function getHourlyHeatmap(entries) {
  const heatmap = {};
  const days = new Set();
  
  for (const entry of entries) {
    if (entry.timestamp) {
      const date = entry.timestamp.substring(0, 10);
      const hour = parseInt(entry.timestamp.substring(11, 13));
      days.add(date);
      
      if (!heatmap[hour]) heatmap[hour] = {};
      if (!heatmap[hour][date]) heatmap[hour][date] = 0;
      heatmap[hour][date]++;
    }
  }
  
  return { heatmap, days: Array.from(days).sort() };
}

/**
 * Gets distribution of errors/warnings by thread
 * Helps identify problematic thread pools or request handlers
 * @param {Array} entries - Log entries
 * @returns {Array} Sorted array of {thread, count}
 */
function getThreadDistribution(entries) {
  const threads = {};
  
  for (const entry of entries) {
    if (entry.thread) {
      threads[entry.thread] = (threads[entry.thread] || 0) + 1;
    }
  }
  
  return Object.entries(threads)
    .map(([thread, count]) => ({ thread, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Compares error trends over specified number of days
 * @param {string} filePath - Path to log file
 * @param {number} days - Number of days to analyze (default 7)
 * @returns {Object} {trend: daily counts, totalErrors, totalWarnings}
 */
async function getTrendComparison(filePath, days = 7) {
  const stream = createLogStream(filePath);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().substring(0, 10);
  
  const daily = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for await (const entry of stream) {
    // Only count entries within the time window
    if (entry.timestamp && entry.timestamp >= cutoffStr) {
      const date = entry.timestamp.substring(0, 10);
      if (!daily[date]) daily[date] = { errors: 0, warnings: 0 };
      
      if (entry.level === 'ERROR') {
        daily[date].errors++;
        totalErrors++;
      } else if (entry.level === 'WARN') {
        daily[date].warnings++;
        totalWarnings++;
      }
    }
  }
  
  const trend = Object.entries(daily)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return { trend, totalErrors, totalWarnings };
}

/* === Re-exports from Services === */
// Convenience re-exports for unified API surface
const analyzeEntries = groupEntries;
const analyzeAllInOnePass = errorLogService.analyzeAllInOnePass;
const buildEntryFilter = errorLogService.buildEntryFilter;
const countMatchingEntries = errorLogService.countMatchingEntries;
const countMatchingEntriesWithLevels = errorLogService.countMatchingEntriesWithLevels;
const extractPage = errorLogService.extractPage;
const buildRequestFilter = requestLogService.buildRequestFilter;
const countMatchingRequestEntries = requestLogService.countMatchingRequestEntries;
const extractRequestPage = requestLogService.extractRequestPage;
const countAndExtractRequestEntries = requestLogService.countAndExtractRequestEntries;
const buildCDNFilter = cdnLogService.buildCDNFilter;
const countMatchingCDNEntries = cdnLogService.countMatchingCDNEntries;
const extractCDNPage = cdnLogService.extractCDNPage;
const countAndExtractCDNEntries = cdnLogService.countAndExtractCDNEntries;
const analyzeRequestLog = requestLogService.analyzeRequestLog;
const analyzeCDNLog = cdnLogService.analyzeCDNLog;

/**
 * AEM Log Analyzer Module
 * Provides filtering, grouping, and analysis for error/request/cdn logs
 * @module analyzer
 */
module.exports = {
  analyzeLogFile,
  getSummary,
  parseAllLevels,
  normalizeMessage,
  filterByDateRange,
  filterByLogger,
  filterByThread,
  filterByRegex,
  filterByPackage,
  exportToCSV,
  exportToJSON,
  generatePDFSummary,
  getTimelineData,
  getLoggerDistribution,
  parseTimestamp,
  analyzeEntries,
  getSummaryFromEntries,
  analyzeLogFileStream,
  getSummaryStream,
  getTimelineDataStream,
  getLoggerDistributionStream,
  filterAndAnalyzeStream,
  getHourlyHeatmap,
  getThreadDistribution,
  getTrendComparison,
  isSafeRegex,
  buildErrorFilterStats,
  analyzeAllInOnePass,
  buildEntryFilter,
  countMatchingEntries,
  countMatchingEntriesWithLevels,
  extractPage,
  buildRequestFilter,
  countMatchingRequestEntries,
  extractRequestPage,
  countAndExtractRequestEntries,
  buildCDNFilter,
  countMatchingCDNEntries,
  extractCDNPage,
  countAndExtractCDNEntries,
  analyzeRequestLog,
  analyzeCDNLog,
  detectLogType
};
