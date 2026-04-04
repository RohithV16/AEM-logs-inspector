/* === Export Functions === */

/**
 * Converts analysis results to CSV format.
 * @param {Array} results - Array of log analysis results
 * @returns {string} CSV formatted string
 */
function exportToCSV(results) {
  const headers = ['Level', 'Count', 'Message', 'First Occurrence'];
  const rows = results.map(r => [
    r.level || r.severity || '',
    r.count ?? 1,
    // Escape double quotes by doubling them (CSV standard for quoted fields)
    `"${String(r.message || r.title || r.url || r.sourceName || '').replace(/"/g, '""')}"`,
    r.firstOccurrence || r.timestamp || ''
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Converts analysis results to JSON format.
 * @param {Array} results - Array of log analysis results
 * @returns {string} JSON formatted string
 */
function exportToJSON(results) {
  return JSON.stringify(results, null, 2);
}

/**
 * Generates a plain-text PDF summary for printing/saving.
 * @param {Object} summary - Aggregated statistics from log analysis
 * @param {Array} results - Array of log analysis results
 * @returns {string} Plain-text summary content
 */
function generatePDFSummary(summary, results) {
  const content = [];
  content.push('AEM Log Analysis Summary');
  content.push('='.repeat(40));
  content.push(`Total Errors: ${summary.totalErrors || 0}`);
  content.push(`Total Warnings: ${summary.totalWarnings || 0}`);
  content.push(`Unique Errors: ${summary.uniqueErrors || 0}`);
  content.push(`Unique Warnings: ${summary.uniqueWarnings || 0}`);
  if (summary.totalFiles) {
    content.push(`Total Files: ${summary.totalFiles}`);
  }
  if (summary.totalEvents) {
    content.push(`Total Events: ${summary.totalEvents}`);
  }
  content.push('');
  content.push('Top Issues:');
  content.push('-'.repeat(40));

  // Limit output to top 20 issues for readability
  results.slice(0, 20).forEach((r, i) => {
    const label = r.level || r.severity || r.logType || 'INFO';
    const count = r.count ?? 1;
    const message = String(r.message || r.title || r.url || r.sourceName || '').substring(0, 80);
    content.push(`${i + 1}. [${label}] ${count}x - ${message}`);
  });

  return content.join('\n');
}

module.exports = {
  exportToCSV,
  exportToJSON,
  generatePDFSummary
};
