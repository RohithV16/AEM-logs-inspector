/* === Alert Configuration === */

// Default thresholds for AEM error monitoring
// These values are tuned for typical AEM production environments
const DEFAULT_THRESHOLDS = {
  maxErrors: 50,
  maxWarnings: 500,
  maxUniqueErrors: 20,
  // Critical AEM components that indicate serious issues when logging errors
  criticalLoggers: ['com.adobe.granite.replication', 'org.apache.sling.engine.impl.SlingMainServlet']
};

/* === Alert Checking === */

/**
 * Checks log analysis results against thresholds to generate alerts.
 * @param {Object} summary - Aggregated statistics from log analysis
 * @param {Array} results - Array of log analysis results with details
 * @param {Object} thresholds - Custom threshold values (optional)
 * @returns {Array} Array of alert objects with level and message
 */
function checkAlerts(summary, results, thresholds = DEFAULT_THRESHOLDS) {
  const alerts = [];

  // High error count indicates acute issues requiring immediate attention
  if (summary.totalErrors > thresholds.maxErrors) {
    alerts.push({ level: 'error', message: `High error count: ${summary.totalErrors} (threshold: ${thresholds.maxErrors})` });
  }

  // Warnings above threshold may indicate degrading system health
  if (summary.totalWarnings > thresholds.maxWarnings) {
    alerts.push({ level: 'warning', message: `High warning count: ${summary.totalWarnings} (threshold: ${thresholds.maxWarnings})` });
  }

  // Many unique errors suggest systemic issues rather than isolated incidents
  if (summary.uniqueErrors > thresholds.maxUniqueErrors) {
    alerts.push({ level: 'warning', message: `Many unique errors: ${summary.uniqueErrors} (threshold: ${thresholds.maxUniqueErrors})` });
  }

  // Check for errors from critical AEM components
  // Replication failures and Sling engine errors directly impact content delivery
  for (const logger of thresholds.criticalLoggers) {
    const match = results.find(r => r.examples && r.examples.some(ex => ex.logger && ex.logger.includes(logger)));
    if (match) {
      alerts.push({ level: 'error', message: `Critical logger error: ${logger} (${match.count}x)` });
    }
  }

  return alerts;
}

module.exports = { checkAlerts, DEFAULT_THRESHOLDS };
