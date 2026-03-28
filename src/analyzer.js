const { parseLogFile, parseTimestamp } = require('./parser');

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
        examples: []
      };
    }
    
    grouped[key].count++;
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push({
        timestamp: entry.timestamp,
        logger: entry.logger,
        thread: entry.thread
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
  if (!loggerPattern) return entries;
  const regex = new RegExp(loggerPattern, 'i');
  return entries.filter(e => regex.test(e.logger));
}

function filterByThread(entries, threadPattern) {
  if (!threadPattern) return entries;
  const regex = new RegExp(threadPattern, 'i');
  return entries.filter(e => regex.test(e.thread));
}

function filterByRegex(entries, regexPattern) {
  if (!regexPattern) return entries;
  try {
    const regex = new RegExp(regexPattern, 'i');
    return entries.filter(e => regex.test(e.message));
  } catch {
    return entries;
  }
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

module.exports = { 
  analyzeLogFile, 
  getSummary, 
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
  parseTimestamp
};
