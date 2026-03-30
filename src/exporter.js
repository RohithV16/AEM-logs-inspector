/* === Export Functions === */

/**
 * Converts analysis results to CSV format.
 * @param {Array} results - Array of log analysis results
 * @returns {string} CSV formatted string
 */
function exportToCSV(results) {
  const headers = ['Level', 'Count', 'Message', 'First Occurrence'];
  const rows = results.map(r => [
    r.level,
    r.count,
    // Escape double quotes by doubling them (CSV standard for quoted fields)
    `"${r.message.replace(/"/g, '""')}"`,
    r.firstOccurrence
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
  content.push(`Total Errors: ${summary.totalErrors}`);
  content.push(`Total Warnings: ${summary.totalWarnings}`);
  content.push(`Unique Errors: ${summary.uniqueErrors}`);
  content.push(`Unique Warnings: ${summary.uniqueWarnings}`);
  content.push('');
  content.push('Top Issues:');
  content.push('-'.repeat(40));

  // Limit output to top 20 issues for readability
  results.slice(0, 20).forEach((r, i) => {
    content.push(`${i + 1}. [${r.level}] ${r.count}x - ${r.message.substring(0, 80)}`);
  });

  return content.join('\n');
}

module.exports = {
  exportToCSV,
  exportToJSON,
  generatePDFSummary
};
