const fs = require('fs');
const { createLogStream } = require('../parser');
const { categorizeError } = require('../categorizer');
const { groupEntries, groupEntriesStream, getSummaryFromEntries, getSummaryStream, normalizeMessage } = require('../grouper');

/* === Package Derivation === */

const packageRegex = /^([a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*)\./;

function derivePackageGroup(logger) {
  if (!logger) return null;
  const match = logger.match(packageRegex);
  return match ? match[1] : null;
}

/* === Core Analysis === */

/**
 * Analyzes error logs in a single streaming pass, collecting comprehensive metrics.
 * @param {string} filePath - Path to the error log file
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Analysis results including summary, grouped errors, loggers, threads, packages, exceptions, and timeline
 */
async function analyzeAllInOnePass(filePath, onProgress) {
  const stream = createLogStream(filePath, { levels: 'all' });
  const fileSize = fs.statSync(filePath).size;

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalLines = 0;
  const uniqueErrorMessages = new Set();
  const uniqueWarningMessages = new Set();
  const grouped = {};
  const loggers = {};
  const threads = {};
  const packages = {};
  const exceptions = {};
  const timeline = {};
  const levelCounts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };

  /* Regex patterns for extracting exception types from log messages and stack traces.
     Using [a-zA-Z] prefix ensures we match valid Java class names, avoiding false positives
     from embedded exceptions in strings. */
  const exceptionRegex = /^([a-zA-Z][a-zA-Z0-9_.]*(?:Exception|Error))/;
  const causedByRegex = /Caused by:\s*([a-zA-Z][a-zA-Z0-9_.]*(?:Exception|Error))/g;

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
    }

    if (entry.logger) {
      loggers[entry.logger] = (loggers[entry.logger] || 0) + 1;
      const pkg = derivePackageGroup(entry.logger);
      if (pkg) {
        packages[pkg] = (packages[pkg] || 0) + 1;
      }
    }
    if (entry.thread) {
      threads[entry.thread] = (threads[entry.thread] || 0) + 1;
    }

    /* Extract exception types from both log message and stack trace.
       Stack traces may contain "Caused by:" chains showing the root exception,
       which is critical for understanding the actual failure point. */
    if (entry.message) {
      const msgMatch = entry.message.match(exceptionRegex);
      if (msgMatch) {
        exceptions[msgMatch[1]] = (exceptions[msgMatch[1]] || 0) + 1;
      }
    }
    if (entry.stackTrace) {
      /* Reset regex lastIndex - necessary because 'g' flag persists across calls */
      causedByRegex.lastIndex = 0;
      let match;
      while ((match = causedByRegex.exec(entry.stackTrace)) !== null) {
        exceptions[match[1]] = (exceptions[match[1]] || 0) + 1;
      }
    }

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

  return {
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
    packages,
    exceptions,
    timeline,
    levelCounts: { ...levelCounts, ALL: levelCounts.ERROR + levelCounts.WARN + levelCounts.INFO + levelCounts.DEBUG }
  };
}

/* === Filter Functions === */

/**
 * Builds a filter function for error log entries based on multiple criteria.
 * @param {Object} filters - Filter parameters
 * @param {string} filters.level - Log level (ERROR, WARN, INFO, etc.)
 * @param {string} filters.search - Regex search pattern for message content
 * @param {string} filters.from - Start date filter (ISO string or log format)
 * @param {string} filters.to - End date filter
 * @param {string} filters.logger - Exact logger name match
 * @param {string} filters.thread - Thread name match
 * @param {string[]} filters.package - Array of package prefixes to match
 * @param {string} filters.exception - Exception type to search for in stack traces
 * @param {string} filters.category - Error category from categorizer
 * @returns {function} Filter function that returns true for matching entries
 */
function buildEntryFilter(filters = {}) {
  const { level, search, from, to, logger, thread, package: pkg, exception, category } = filters;
  let searchRegex = null;

  /* Safely compile user-provided regex - invalid patterns should not crash the service */
  if (search) {
    try {
      searchRegex = new RegExp(search, 'i');
    } catch (e) {
      /* Invalid regex, skip - filter will not apply text matching */
    }
  }

  /* Pre-parse date filters to avoid repeated parsing during stream iteration */
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  /* AEM logs use DD.MM.YYYY HH:mm:ss format which JavaScript Date doesn't parse natively.
     This handles both the log format and ISO strings from API requests. */
  function parseLogTimestamp(ts) {
    if (!ts) return null;
    const match = ts.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    if (match) {
      return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}`);
    }
    return new Date(ts);
  }

  /* Returns a filter function that tests each log entry against all criteria.
     Uses early returns for efficiency - fails fast on first non-match. */
  return (entry) => {
    if (level && level !== 'ALL' && entry.level !== level) return false;
    if (searchRegex && !searchRegex.test(entry.message)) return false;
    if (fromDate) {
      const entryDate = parseLogTimestamp(entry.timestamp);
      if (entryDate && entryDate < fromDate) return false;
    }
    if (toDate) {
      const entryDate = parseLogTimestamp(entry.timestamp);
      if (entryDate && entryDate > toDate) return false;
    }
    if (logger && logger.length > 0) {
      const loggerArray = Array.isArray(logger) ? logger : [logger];
      if (!loggerArray.some(l => entry.logger === l)) return false;
    }
    if (thread && entry.thread !== thread) return false;
    /* Package matching supports hierarchical matching - "com.example" matches "com.example.service" */
    if (pkg && pkg.length > 0) {
      const entryPkg = derivePackageGroup(entry.logger);
      if (!entryPkg || !pkg.some(p => entryPkg === p || entryPkg.startsWith(p + '.'))) {
        return false;
      }
    }
    /* Exception filter checks stack trace since message may not contain full exception name */
    if (exception && (!entry.stackTrace || !entry.stackTrace.includes(exception))) return false;
    if (category) {
      const entryCategory = categorizeError(entry.message, entry.logger);
      if (entryCategory !== category) return false;
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

  for await (const entry of stream) {
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

module.exports = {
  analyzeAllInOnePass,
  buildEntryFilter,
  countMatchingEntries,
  countMatchingEntriesWithLevels,
  extractPage,
  groupEntries,
  groupEntriesStream,
  getSummaryFromEntries,
  getSummaryStream
};
