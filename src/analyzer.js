const { parseLogFile, parseAllLevels, parseTimestamp, createLogStream, createRequestLogStream, createCDNLogStream, detectLogType } = require('./parser');
const { categorizeError } = require('./categorizer');

const MAX_REGEX_LENGTH = 100;
const REGEX_TIMEOUT_MS = 100;

function isSafeRegex(pattern) {
  if (!pattern || typeof pattern !== 'string') return null;
  if (pattern.length > MAX_REGEX_LENGTH) {
    return { error: 'Pattern too long (max 100 characters)' };
  }
  
  let depth = 0;
  for (const char of pattern) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (depth > 3) return { error: 'Pattern too complex' };
  }
  
  const dangerousPatterns = [
    /\([^)]*\*\)[*+]/,
    /\([^)]*\+\)[*+]/,
    /\(\.[*+]\)[*+]/,
    /\([^)]*[*+][^)]*\)[*+]/
  ];
  for (const dp of dangerousPatterns) {
    if (dp.test(pattern)) {
      return { error: 'Pattern may cause catastrophic backtracking' };
    }
  }
  
  try {
    const regex = new RegExp(pattern, 'i');
    const testInput = 'a'.repeat(50) + '!';
    const start = Date.now();
    regex.test(testInput);
    if (Date.now() - start > REGEX_TIMEOUT_MS) {
      return { error: 'Pattern too slow (execution timeout)' };
    }
    return { regex, error: null };
  } catch (e) {
    return { error: `Invalid regex: ${e.message}` };
  }
}

function normalizeMessage(message) {
  return message
    .replace(/\/content\/dam\/[^/]+\//g, '/content/dam/{path}/')
    .replace(/\d{4}-\d{2}-\d{2}/g, '{date}')
    .replace(/\d{2}:\d{2}:\d{2}/g, '{time}')
    .replace(/\[.*?\]/g, '[{id}]')
    .trim();
}

function analyzeLogFile(filePath) {
  const entries = parseLogFile(filePath);
  
  const grouped = {};
  for (const entry of entries) {
    const normalized = normalizeMessage(entry.message);
    const key = `${entry.level}:${normalized}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        level: entry.level,
        message: normalized,
        originalMessage: entry.message,
        count: 0,
        firstOccurrence: entry.timestamp,
        examples: [],
        category: categorizeError(entry.message, entry.logger)
      };
    }

    grouped[key].count++;
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push({
        timestamp: entry.timestamp,
        logger: entry.logger,
        thread: entry.thread,
        stackTrace: entry.stackTrace || ''
      });
    }
  }

  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

function getSummary(filePath) {
  const entries = parseLogFile(filePath);
  
  return {
    totalErrors: entries.filter(e => e.level === 'ERROR').length,
    totalWarnings: entries.filter(e => e.level === 'WARN').length,
    uniqueErrors: new Set(entries.filter(e => e.level === 'ERROR').map(e => normalizeMessage(e.message))).size,
    uniqueWarnings: new Set(entries.filter(e => e.level === 'WARN').map(e => normalizeMessage(e.message))).size,
    totalLines: entries.length
  };
}

function filterByDateRange(entries, startDate, endDate) {
  if (!startDate && !endDate) return entries;
  
  return entries.filter(entry => {
    const entryDate = parseTimestamp(entry.timestamp);
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });
}

function filterByLogger(entries, loggerPattern) {
  if (!loggerPattern) return { entries, error: null };
  const check = isSafeRegex(loggerPattern);
  if (check.error) return { entries, error: check.error };
  return { entries: entries.filter(e => check.regex.test(e.logger)), error: null };
}

function filterByThread(entries, threadPattern) {
  if (!threadPattern) return { entries, error: null };
  const check = isSafeRegex(threadPattern);
  if (check.error) return { entries, error: check.error };
  return { entries: entries.filter(e => check.regex.test(e.thread)), error: null };
}

function filterByRegex(entries, regexPattern) {
  if (!regexPattern) return { entries, error: null };
  const check = isSafeRegex(regexPattern);
  if (check.error) return { entries, error: check.error };
  return { entries: entries.filter(e => check.regex.test(e.message)), error: null };
}

function exportToCSV(results) {
  const headers = ['Level', 'Count', 'Message', 'First Occurrence'];
  const rows = results.map(r => [
    r.level,
    r.count,
    `"${r.message.replace(/"/g, '""')}"`,
    r.firstOccurrence
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function exportToJSON(results) {
  return JSON.stringify(results, null, 2);
}

function generatePDFSummary(summary, results) {
  const content = [];
  content.push('AEM Log Analysis Summary');
  content.push('='.repeat(40));
  content.push(`Total Errors: ${summary.totalErrors}`);
  content.push(`Total Warnings: ${summary.totalWarnings}`);
  content.push(`Unique Errors: ${summary.uniqueErrors}`);
  content.push(`Unique Warnings: ${summary.uniqueWarnings}`);
  content.push('');
  content.push('Top Issues:');
  content.push('-'.repeat(40));
  
  results.slice(0, 20).forEach((r, i) => {
    content.push(`${i + 1}. [${r.level}] ${r.count}x - ${r.message.substring(0, 80)}`);
  });
  
  return content.join('\n');
}

function getTimelineData(entries) {
  const buckets = {};
  for (const entry of entries) {
    const date = entry.timestamp.split(' ')[0];
    if (!buckets[date]) buckets[date] = { ERROR: 0, WARN: 0 };
    buckets[date][entry.level]++;
  }
  return buckets;
}

function getLoggerDistribution(entries) {
  const distribution = {};
  for (const entry of entries) {
    if (!distribution[entry.logger]) distribution[entry.logger] = 0;
    distribution[entry.logger]++;
  }
  return distribution;
}

function analyzeEntries(entries) {
  const grouped = {};
  for (const entry of entries) {
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
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push({
        timestamp: entry.timestamp,
        logger: entry.logger,
        thread: entry.thread,
        stackTrace: entry.stackTrace || ''
      });
    }
  }

  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

function getSummaryFromEntries(entries) {
  return {
    totalErrors: entries.filter(e => e.level === 'ERROR').length,
    totalWarnings: entries.filter(e => e.level === 'WARN').length,
    uniqueErrors: new Set(entries.filter(e => e.level === 'ERROR').map(e => normalizeMessage(e.message))).size,
    uniqueWarnings: new Set(entries.filter(e => e.level === 'WARN').map(e => normalizeMessage(e.message))).size,
    totalLines: entries.length
  };
}

async function analyzeLogFileStream(stream) {
  const grouped = {};

  for await (const entry of stream) {
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
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push({
        timestamp: entry.timestamp,
        logger: entry.logger,
        thread: entry.thread,
        stackTrace: entry.stackTrace || ''
      });
    }
  }

  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

async function getSummaryStream(stream) {
  let totalErrors = 0;
  let totalWarnings = 0;
  const uniqueErrorMessages = new Set();
  const uniqueWarningMessages = new Set();
  let totalLines = 0;
  
  for await (const entry of stream) {
    totalLines++;
    if (entry.level === 'ERROR') {
      totalErrors++;
      uniqueErrorMessages.add(normalizeMessage(entry.message));
    } else if (entry.level === 'WARN') {
      totalWarnings++;
      uniqueWarningMessages.add(normalizeMessage(entry.message));
    }
  }
  
  return {
    totalErrors,
    totalWarnings,
    uniqueErrors: uniqueErrorMessages.size,
    uniqueWarnings: uniqueWarningMessages.size,
    totalLines
  };
}

async function getTimelineDataStream(stream) {
  const buckets = {};
  
  for await (const entry of stream) {
    const date = entry.timestamp.split(' ')[0];
    if (!buckets[date]) buckets[date] = { ERROR: 0, WARN: 0 };
    buckets[date][entry.level]++;
  }
  
  return buckets;
}

async function getLoggerDistributionStream(stream) {
  const distribution = {};
  
  for await (const entry of stream) {
    if (!distribution[entry.logger]) distribution[entry.logger] = 0;
    distribution[entry.logger]++;
  }
  
  return distribution;
}

function getHourlyHeatmap(entries) {
  const heatmap = {};
  for (const entry of entries) {
    const date = entry.timestamp.split(' ')[0];
    const timePart = entry.timestamp.split(' ')[1];
    const hour = timePart.split(':')[0];
    const key = `${date}_${hour}`;
    if (!heatmap[key]) heatmap[key] = { date, hour: parseInt(hour), count: 0 };
    heatmap[key].count++;
  }
  return Object.values(heatmap);
}

function getThreadDistribution(entries) {
  const dist = {};
  for (const entry of entries) {
    if (!dist[entry.thread]) dist[entry.thread] = 0;
    dist[entry.thread]++;
  }
  return dist;
}

async function filterAndAnalyzeStream(stream, filters = {}) {
  let entries = [];
  const uniqueErrorMessages = new Set();
  const uniqueWarningMessages = new Set();
  let filterError = null;
  
  for await (const entry of stream) {
    let include = true;
    
    if (filters.startDate || filters.endDate) {
      const entryDate = parseTimestamp(entry.timestamp);
      if (filters.startDate && entryDate < filters.startDate) include = false;
      if (filters.endDate && entryDate > filters.endDate) include = false;
    }
    
    if (include && filters.logger) {
      const check = isSafeRegex(filters.logger);
      if (check.error) {
        filterError = check.error;
      } else if (!check.regex.test(entry.logger)) {
        include = false;
      }
    }
    
    if (include && filters.thread) {
      const check = isSafeRegex(filters.thread);
      if (check.error) {
        filterError = check.error;
      } else if (!check.regex.test(entry.thread)) {
        include = false;
      }
    }
    
    if (include && filters.regex) {
      const check = isSafeRegex(filters.regex);
      if (check.error) {
        filterError = check.error;
      } else if (!check.regex.test(entry.message)) {
        include = false;
      }
    }
    
    if (include) {
      entries.push(entry);
      const normalized = normalizeMessage(entry.message);
      if (entry.level === 'ERROR') uniqueErrorMessages.add(normalized);
      else if (entry.level === 'WARN') uniqueWarningMessages.add(normalized);
    }
  }
  
  const grouped = {};
  for (const entry of entries) {
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
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push({
        timestamp: entry.timestamp,
        logger: entry.logger,
        thread: entry.thread,
        stackTrace: entry.stackTrace || ''
      });
    }
  }

  const results = Object.values(grouped).sort((a, b) => b.count - a.count);
  const summary = {
    totalErrors: entries.filter(e => e.level === 'ERROR').length,
    totalWarnings: entries.filter(e => e.level === 'WARN').length,
    uniqueErrors: uniqueErrorMessages.size,
    uniqueWarnings: uniqueWarningMessages.size,
    totalLines: entries.length
  };
  
  return { results, summary, filterError };
}

function getTrendComparison(entries, days = 7) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  let recent = 0, previous = 0;
  for (const entry of entries) {
    try {
      const date = parseTimestamp(entry.timestamp);
      if (date >= cutoff) recent++;
      else previous++;
    } catch (e) { /* skip unparseable */ }
  }
  const change = previous > 0 ? ((recent - previous) / previous * 100).toFixed(1) : 0;
  return { recent, previous, change: parseFloat(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
}

/* ============================================================
   Single-Pass Analysis for Large Files (5GB+)
   ============================================================ */

const fs = require('fs');

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

  // Exception regex
  const exceptionRegex = /^([a-zA-Z][a-zA-Z0-9_.]*(?:Exception|Error))/;
  const causedByRegex = /Caused by:\s*([a-zA-Z][a-zA-Z0-9_.]*(?:Exception|Error))/g;

  for await (const entry of stream) {
    totalLines++;

    // Summary
    if (entry.level === 'ERROR') {
      totalErrors++;
      uniqueErrorMessages.add(normalizeMessage(entry.message));
    } else if (entry.level === 'WARN') {
      totalWarnings++;
      uniqueWarningMessages.add(normalizeMessage(entry.message));
    }

    // Grouped results (ERROR/WARN only)
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
      if (grouped[key].examples.length < 3) {
        grouped[key].examples.push({
          timestamp: entry.timestamp,
          logger: entry.logger,
          thread: entry.thread,
          stackTrace: entry.stackTrace || ''
        });
      }
    }

    // Filter options
    if (entry.logger) {
      loggers[entry.logger] = (loggers[entry.logger] || 0) + 1;
      const parts = entry.logger.split('.');
      if (parts.length > 1) {
        const pkg = parts.slice(0, -1).join('.');
        packages[pkg] = (packages[pkg] || 0) + 1;
      }
    }
    if (entry.thread) {
      threads[entry.thread] = (threads[entry.thread] || 0) + 1;
    }

    // Exceptions
    if (entry.message) {
      const msgMatch = entry.message.match(exceptionRegex);
      if (msgMatch) {
        exceptions[msgMatch[1]] = (exceptions[msgMatch[1]] || 0) + 1;
      }
    }
    if (entry.stackTrace) {
      causedByRegex.lastIndex = 0; // Reset regex state (g flag causes state leak)
      let match;
      while ((match = causedByRegex.exec(entry.stackTrace)) !== null) {
        exceptions[match[1]] = (exceptions[match[1]] || 0) + 1;
      }
    }

    // Timeline bucket (hourly)
    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { errors: 0, warnings: 0, total: 0 };
      timeline[hour].total++;
      if (entry.level === 'ERROR') timeline[hour].errors++;
      if (entry.level === 'WARN') timeline[hour].warnings++;
    }

    // Progress callback every 100k lines
    if (onProgress && totalLines % 100000 === 0) {
      onProgress({ fileSize, totalLines, percent: 0 });
    }
  }

  // Final progress
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
    timeline
  };
}

/* ============================================================
   Streaming Pagination Helpers
   ============================================================ */

function buildEntryFilter(filters = {}) {
  const { level, search, from, to, logger, thread, package: pkg, exception, category } = filters;
  let searchRegex = null;

  if (search) {
    const validation = isSafeRegex(search);
    if (validation && !validation.error) {
      searchRegex = validation.regex;
    }
  }

  return (entry) => {
    // Level filter
    if (level && level !== 'ALL' && entry.level !== level) return false;

    // Search filter
    if (searchRegex && !searchRegex.test(entry.message) && !searchRegex.test(entry.stackTrace || '')) return false;

    // Date filter
    if (from || to) {
      const ts = parseAEMTimestamp(entry.timestamp);
      if (from && ts < new Date(from)) return false;
      if (to && ts > new Date(to)) return false;
    }

    // Logger filter
    if (logger && entry.logger !== logger) return false;

    // Thread filter
    if (thread && entry.thread !== thread) return false;

    // Package filter
    if (pkg && (!entry.logger || !entry.logger.startsWith(pkg))) return false;

    // Exception filter
    if (exception) {
      const hasException = (entry.message && entry.message.includes(exception)) ||
                          (entry.stackTrace && entry.stackTrace.includes(exception));
      if (!hasException) return false;
    }

    // Category filter
    if (category) {
      const entryCategory = categorizeError(entry.message, entry.logger);
      if (entryCategory !== category) return false;
    }

    return true;
  };
}

function parseAEMTimestamp(ts) {
  const [d, t] = ts.split(' ');
  const [dd, mm, yyyy] = d.split('.');
  const [hh, min, ss] = t.split(':');
  return new Date(yyyy, mm - 1, dd, hh, min, parseInt(ss));
}

async function countMatchingEntries(filePath, filter) {
  const stream = createLogStream(filePath, { levels: 'all' });
  let count = 0;
  for await (const entry of stream) {
    if (filter(entry)) count++;
  }
  return count;
}

async function countMatchingEntriesWithLevels(filePath, filter) {
  const stream = createLogStream(filePath, { levels: 'all' });
  let count = 0;
  const levelCounts = { ALL: 0 };
  for await (const entry of stream) {
    levelCounts.ALL++;
    levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
    if (filter(entry)) count++;
  }
  return { total: count, levelCounts };
}

async function extractPage(filePath, filter, skip, take) {
  const stream = createLogStream(filePath, { levels: 'all' });
  const results = [];
  let skipped = 0;

  for await (const entry of stream) {
    if (!filter(entry)) continue;
    if (skipped < skip) { skipped++; continue; }
    results.push(entry);
    if (results.length >= take) break;
  }

  return results;
}

/* ============================================================
   Request Log Filter Builders
   ============================================================ */

function buildRequestFilter(filters = {}) {
  const { search, from, to, method, httpStatus, minResponseTime, maxResponseTime, pod } = filters;
  let searchRegex = null;

  if (search) {
    const validation = isSafeRegex(search);
    if (validation && !validation.error) {
      searchRegex = validation.regex;
    }
  }

  return (entry) => {
    if (searchRegex && !searchRegex.test(entry.url || '') && !searchRegex.test(entry.status || '')) return false;

    if (from || to) {
      const ts = entry.timestamp ? new Date(entry.timestamp.replace(/:/, ' ')) : null;
      if (ts) {
        if (from && ts < new Date(from)) return false;
        if (to && ts > new Date(to)) return false;
      }
    }

    if (method && entry.method !== method) return false;
    if (httpStatus && String(entry.status) !== String(httpStatus)) return false;
    if (minResponseTime && (entry.responseTime || 0) < Number(minResponseTime)) return false;
    if (maxResponseTime && (entry.responseTime || 0) > Number(maxResponseTime)) return false;
    if (pod && entry.pod !== pod) return false;

    return true;
  };
}

async function countMatchingRequestEntries(filePath, filter) {
  const stream = createRequestLogStream(filePath);
  let count = 0;
  for await (const entry of stream) {
    if (filter(entry)) count++;
  }
  return count;
}

async function extractRequestPage(filePath, filter, skip, take) {
  const stream = createRequestLogStream(filePath);
  const results = [];
  let skipped = 0;

  for await (const entry of stream) {
    if (!filter(entry)) continue;
    if (skipped < skip) { skipped++; continue; }
    results.push(entry);
    if (results.length >= take) break;
  }

  return results;
}

/* ============================================================
   CDN Log Filter Builders
   ============================================================ */

function buildCDNFilter(filters = {}) {
  const { search, from, to, method, httpStatus, cache, country, pop, host, minTtfb, maxTtfb } = filters;
  let searchRegex = null;

  if (search) {
    const validation = isSafeRegex(search);
    if (validation && !validation.error) {
      searchRegex = validation.regex;
    }
  }

  return (entry) => {
    if (searchRegex && !searchRegex.test(entry.url || '') && !searchRegex.test(entry.status || '')) return false;

    if (from || to) {
      const ts = entry.timestamp ? new Date(entry.timestamp) : null;
      if (ts) {
        if (from && ts < new Date(from)) return false;
        if (to && ts > new Date(to)) return false;
      }
    }

    if (method && entry.method !== method) return false;
    if (httpStatus && String(entry.status) !== String(httpStatus)) return false;
    if (cache && entry.cache !== cache) return false;
    if (country && entry.clientCountry !== country) return false;
    if (pop && entry.pop !== pop) return false;
    if (host && entry.host !== host) return false;
    if (minTtfb && (entry.ttfb || 0) < Number(minTtfb)) return false;
    if (maxTtfb && (entry.ttfb || 0) > Number(maxTtfb)) return false;

    return true;
  };
}

async function countMatchingCDNEntries(filePath, filter) {
  const stream = createCDNLogStream(filePath);
  let count = 0;
  for await (const entry of stream) {
    if (filter(entry)) count++;
  }
  return count;
}

async function extractCDNPage(filePath, filter, skip, take) {
  const stream = createCDNLogStream(filePath);
  const results = [];
  let skipped = 0;

  for await (const entry of stream) {
    if (!filter(entry)) continue;
    if (skipped < skip) { skipped++; continue; }
    results.push(entry);
    if (results.length >= take) break;
  }

  return results;
}

/* ============================================================
   Request Log Analysis
   ============================================================ */

async function analyzeRequestLog(filePath, onProgress) {
  const stream = createRequestLogStream(filePath);
  const fileSize = require('fs').statSync(filePath).size;

  const methods = {};
  const statuses = {};
  const pods = {};
  const urls = {};
  const responseTimes = [];
  let totalRequests = 0;
  let totalResponseTime = 0;
  let slowRequests = 0;
  const timeline = {};

  for await (const entry of stream) {
    totalRequests++;

    if (entry.method) {
      methods[entry.method] = (methods[entry.method] || 0) + 1;
    }

    if (entry.status) {
      statuses[entry.status] = (statuses[entry.status] || 0) + 1;
      responseTimes.push(entry.responseTime);
      totalResponseTime += entry.responseTime;
      if (entry.responseTime > 1000) slowRequests++;
    }

    if (entry.pod) {
      pods[entry.pod] = (pods[entry.pod] || 0) + 1;
    }

    if (entry.url) {
      const urlKey = entry.url.split('?')[0];
      urls[urlKey] = (urls[urlKey] || 0) + 1;
    }

    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, slow: 0 };
      timeline[hour].requests++;
      if (entry.status >= 400) timeline[hour].errors++;
      if (entry.responseTime > 1000) timeline[hour].slow++;
    }

    if (onProgress && totalRequests % 10000 === 0) {
      onProgress({ fileSize, totalRequests, percent: 0 });
    }
  }

  if (onProgress) onProgress({ fileSize, totalRequests, percent: 100 });

  responseTimes.sort((a, b) => a - b);
  const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / responseTimes.length) : 0;
  const p50 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.5)] : 0;
  const p95 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;
  const p99 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0;

  return {
    summary: {
      totalRequests,
      avgResponseTime,
      slowRequests,
      p50ResponseTime: p50,
      p95ResponseTime: p95,
      p99ResponseTime: p99
    },
    filterOptions: {
      methods: Object.keys(methods).sort(),
      statuses: Object.keys(statuses).map(s => parseInt(s)).sort((a, b) => a - b),
      pods: Object.keys(pods).sort()
    },
    results: Object.entries(urls).map(([url, count]) => ({ url, count })).sort((a, b) => b.count - a.count),
    methods,
    statuses,
    pods,
    timeline
  };
}

/* ============================================================
   CDN Log Analysis
   ============================================================ */

async function analyzeCDNLog(filePath, onProgress) {
  const stream = createCDNLogStream(filePath);
  const fileSize = require('fs').statSync(filePath).size;

  const methods = {};
  const statuses = {};
  const cacheStatuses = {};
  const countries = {};
  const pops = {};
  const hosts = {};
  const ttfbTimes = [];
  const ttlbTimes = [];
  let totalRequests = 0;
  let totalTtfb = 0;
  let totalTtlb = 0;
  const timeline = {};

  for await (const entry of stream) {
    totalRequests++;

    if (entry.method) {
      methods[entry.method] = (methods[entry.method] || 0) + 1;
    }

    if (entry.status) {
      statuses[entry.status] = (statuses[entry.status] || 0) + 1;
    }

    if (entry.cache) {
      cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
    }

    if (entry.clientCountry) {
      countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
    }

    if (entry.pop) {
      pops[entry.pop] = (pops[entry.pop] || 0) + 1;
    }

    if (entry.host) {
      hosts[entry.host] = (hosts[entry.host] || 0) + 1;
    }

    if (entry.ttfb) {
      ttfbTimes.push(entry.ttfb);
      totalTtfb += entry.ttfb;
    }
    if (entry.ttlb) {
      ttlbTimes.push(entry.ttlb);
      totalTtlb += entry.ttlb;
    }

    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
      timeline[hour].requests++;
      if (entry.status >= 400) timeline[hour].errors++;
      if (entry.cache === 'HIT') timeline[hour].cacheHits++;
    }

    if (onProgress && totalRequests % 10000 === 0) {
      onProgress({ fileSize, totalRequests, percent: 0 });
    }
  }

  if (onProgress) onProgress({ fileSize, totalRequests, percent: 100 });

  ttfbTimes.sort((a, b) => a - b);
  ttlbTimes.sort((a, b) => a - b);
  const avgTtfb = totalRequests > 0 ? Math.round(totalTtfb / ttfbTimes.length) : 0;
  const avgTtlb = totalRequests > 0 ? Math.round(totalTtlb / ttlbTimes.length) : 0;

  const cacheHits = (cacheStatuses['HIT'] || 0) + (cacheStatuses['TCP_HIT'] || 0);
  const cacheMisses = (cacheStatuses['MISS'] || 0) + (cacheStatuses['TCP_MISS'] || 0);
  const cacheHitRatio = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : 0;

  return {
    summary: {
      totalRequests,
      avgTtfb,
      avgTtlb,
      cacheHitRatio,
      cacheHits,
      cacheMisses
    },
    filterOptions: {
      methods: Object.keys(methods).sort(),
      statuses: Object.keys(statuses).map(s => parseInt(s)).sort((a, b) => a - b),
      cacheStatuses: Object.keys(cacheStatuses).sort(),
      countries: Object.keys(countries).sort(),
      pops: Object.keys(pops).sort(),
      hosts: Object.keys(hosts).sort()
    },
    methods,
    statuses,
    cacheStatuses,
    countries,
    pops,
    hosts,
    timeline
  };
}

module.exports = {
  analyzeLogFile,
  getSummary,
  parseAllLevels,
  normalizeMessage,
  filterByDateRange,
  filterByLogger,
  filterByThread,
  filterByRegex,
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
  analyzeAllInOnePass,
  buildEntryFilter,
  countMatchingEntries,
  countMatchingEntriesWithLevels,
  extractPage,
  buildRequestFilter,
  countMatchingRequestEntries,
  extractRequestPage,
  buildCDNFilter,
  countMatchingCDNEntries,
  extractCDNPage,
  analyzeRequestLog,
  analyzeCDNLog,
  detectLogType
};
