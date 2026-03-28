const DEFAULT_THRESHOLDS = {
  maxErrors: 50,
  maxWarnings: 500,
  maxUniqueErrors: 20,
  criticalLoggers: ['com.adobe.granite.replication', 'org.apache.sling.engine.impl.SlingMainServlet']
};

function checkAlerts(summary, results, thresholds = DEFAULT_THRESHOLDS) {
  const alerts = [];
  if (summary.totalErrors > thresholds.maxErrors) {
    alerts.push({ level: 'error', message: `High error count: ${summary.totalErrors} (threshold: ${thresholds.maxErrors})` });
  }
  if (summary.totalWarnings > thresholds.maxWarnings) {
    alerts.push({ level: 'warning', message: `High warning count: ${summary.totalWarnings} (threshold: ${thresholds.maxWarnings})` });
  }
  if (summary.uniqueErrors > thresholds.maxUniqueErrors) {
    alerts.push({ level: 'warning', message: `Many unique errors: ${summary.uniqueErrors} (threshold: ${thresholds.maxUniqueErrors})` });
  }
  for (const logger of thresholds.criticalLoggers) {
    const match = results.find(r => r.examples && r.examples.some(ex => ex.logger && ex.logger.includes(logger)));
    if (match) {
      alerts.push({ level: 'error', message: `Critical logger error: ${logger} (${match.count}x)` });
    }
  }
  return alerts;
}

module.exports = { checkAlerts, DEFAULT_THRESHOLDS };
