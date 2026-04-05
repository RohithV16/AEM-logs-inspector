/* === Message Normalization === */
// Normalizes log messages to group similar errors despite variable data
// Critical for reducing noise and finding patterns in AEM logs

const { categorizeError } = require('./categorizer');

const RX_DAM_PATH = /\/content\/dam\/[^/]+\//g;
const RX_DATE = /\d{4}-\d{2}-\d{2}/g;
const RX_TIME = /\d{2}:\d{2}:\d{2}/g;
const RX_IP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
const RX_UUID = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;

/**
 * Normalizes log message by replacing variable data with placeholders
 * Groups similar errors despite timestamps, paths, UUIDs, IPs
 * @param {string} message - Raw log message
 * @returns {string} Normalized message for grouping
 */
function normalizeMessage(message) {
  return message
    // Normalize DAM paths - asset names vary but structure is consistent
    .replace(RX_DAM_PATH, '/content/dam/{path}/')
    // Normalize dates in ISO format
    .replace(RX_DATE, '{date}')
    // Normalize times
    .replace(RX_TIME, '{time}')
    // Normalize IP addresses
    .replace(RX_IP, '{ip}')
    // Normalize UUIDs (correlation IDs, request IDs)
    .replace(RX_UUID, '{uuid}')
    .trim();
}

/* === Entry Grouping === */

/**
 * Groups log entries by normalized message to find patterns
 * Combines same errors occurring multiple times into single grouped entry
 * @param {Array} entries - Log entries to group
 * @returns {Array} Grouped entries sorted by frequency (most common first)
 */
function groupEntries(entries) {
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
    // Store up to 3 examples for debugging without overwhelming response
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

/**
 * Streaming version of groupEntries for memory-efficient processing
 * Yields single result after consuming entire stream
 * @param {AsyncIterator} stream - Log entry stream
 * @yields {Array} Grouped entries when stream completes
 */
async function* groupEntriesStream(stream) {
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

  yield Object.values(grouped).sort((a, b) => b.count - a.count);
}

/* === Summary Statistics === */

/**
 * Generates summary statistics from log entries
 * @param {Array} entries - Log entries
 * @returns {Object} Summary with counts and unique message counts
 */
function getSummaryFromEntries(entries) {
  return {
    totalErrors: entries.filter(e => e.level === 'ERROR').length,
    totalWarnings: entries.filter(e => e.level === 'WARN').length,
    // Unique counts use normalized messages to group similar errors
    uniqueErrors: new Set(entries.filter(e => e.level === 'ERROR').map(e => normalizeMessage(e.message))).size,
    uniqueWarnings: new Set(entries.filter(e => e.level === 'WARN').map(e => normalizeMessage(e.message))).size,
    totalLines: entries.length
  };
}

/**
 * Streaming version of getSummaryFromEntries for large files
 * @param {AsyncIterator} stream - Log entry stream
 * @returns {Object} Summary statistics
 */
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

/**
 * Log Entry Grouper Module
 * Normalizes messages and groups entries for pattern detection
 * @module grouper
 */
module.exports = {
  normalizeMessage,
  groupEntries,
  groupEntriesStream,
  getSummaryFromEntries,
  getSummaryStream
};
