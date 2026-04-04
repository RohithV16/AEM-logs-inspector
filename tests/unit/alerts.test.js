const { checkAlerts, DEFAULT_THRESHOLDS } = require('../../src/alerts');

describe('alerts - checkAlerts', () => {
  const baseSummary = {
    totalErrors: 0,
    totalWarnings: 0,
    uniqueErrors: 0,
    uniqueWarnings: 0
  };

  const baseResults = [];

  describe('error threshold checks', () => {
    test('triggers alert when totalErrors exceeds maxErrors', () => {
      const summary = { ...baseSummary, totalErrors: 100 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxErrors: 50 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].level).toBe('error');
      expect(alerts[0].message).toContain('100');
      expect(alerts[0].message).toContain('50');
    });

    test('triggers multiple alerts when multiple thresholds exceeded', () => {
      const summary = { ...baseSummary, totalErrors: 100, totalWarnings: 600 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxErrors: 50, maxWarnings: 500 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    test('triggers alert when uniqueErrors exceeds maxUniqueErrors', () => {
      const summary = { ...baseSummary, uniqueErrors: 30 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxUniqueErrors: 20 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      expect(alerts.some(a => a.message.includes('unique errors'))).toBe(true);
    });

    test('does not trigger alert when errors below threshold', () => {
      const summary = { ...baseSummary, totalErrors: 10 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxErrors: 50 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      const errorAlerts = alerts.filter(a => a.level === 'error');
      expect(errorAlerts.length).toBe(0);
    });
  });

  describe('warning threshold checks', () => {
    test('triggers warning when totalWarnings exceeds maxWarnings', () => {
      const summary = { ...baseSummary, totalWarnings: 600 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxWarnings: 500 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      expect(alerts.some(a => a.level === 'warning')).toBe(true);
    });

    test('does not trigger warning when warnings below threshold', () => {
      const summary = { ...baseSummary, totalWarnings: 100 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxWarnings: 500 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      const warningAlerts = alerts.filter(a => a.level === 'warning');
      expect(warningAlerts.length).toBe(0);
    });
  });

  describe('critical logger checks', () => {
    test('triggers alert when critical logger has errors', () => {
      const summary = { ...baseSummary, totalErrors: 1 };
      const results = [{
        count: 5,
        examples: [{ logger: 'com.adobe.granite.replication' }]
      }];
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        criticalLoggers: ['com.adobe.granite.replication']
      };

      const alerts = checkAlerts(summary, results, thresholds);

      expect(alerts.some(a => a.message.includes('com.adobe.granite.replication'))).toBe(true);
    });

    test('triggers alert for SlingMainServlet errors', () => {
      const summary = { ...baseSummary, totalErrors: 1 };
      const results = [{
        count: 3,
        examples: [{ logger: 'org.apache.sling.engine.impl.SlingMainServlet' }]
      }];
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        criticalLoggers: ['org.apache.sling.engine.impl.SlingMainServlet']
      };

      const alerts = checkAlerts(summary, results, thresholds);

      expect(alerts.some(a => a.message.includes('SlingMainServlet'))).toBe(true);
    });

    test('does not trigger alert when critical logger has no errors', () => {
      const summary = { ...baseSummary, totalErrors: 0 };
      const results = [{
        count: 5,
        examples: [{ logger: 'com.adobe.some.other' }]
      }];
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        criticalLoggers: ['com.adobe.granite.replication']
      };

      const alerts = checkAlerts(summary, results, thresholds);

      expect(alerts.filter(a => a.message.includes('critical')).length).toBe(0);
    });

    test('handles results without examples', () => {
      const summary = { ...baseSummary, totalErrors: 1 };
      const results = [{ count: 5 }];
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        criticalLoggers: ['com.adobe.granite.replication']
      };

      const alerts = checkAlerts(summary, results, thresholds);
      expect(alerts).toBeDefined();
    });

    test('handles results with null logger in examples', () => {
      const summary = { ...baseSummary, totalErrors: 1 };
      const results = [{
        count: 5,
        examples: [{ logger: null }, { logger: undefined }]
      }];
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        criticalLoggers: ['com.adobe.granite.replication']
      };

      const alerts = checkAlerts(summary, results, thresholds);
      expect(alerts).toBeDefined();
    });
  });

  describe('default threshold values', () => {
    test('DEFAULT_THRESHOLDS has maxErrors', () => {
      expect(DEFAULT_THRESHOLDS.maxErrors).toBe(50);
    });

    test('DEFAULT_THRESHOLDS has maxWarnings', () => {
      expect(DEFAULT_THRESHOLDS.maxWarnings).toBe(500);
    });

    test('DEFAULT_THRESHOLDS has maxUniqueErrors', () => {
      expect(DEFAULT_THRESHOLDS.maxUniqueErrors).toBe(20);
    });

    test('DEFAULT_THRESHOLDS has criticalLoggers array', () => {
      expect(Array.isArray(DEFAULT_THRESHOLDS.criticalLoggers)).toBe(true);
      expect(DEFAULT_THRESHOLDS.criticalLoggers.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('handles empty summary', () => {
      const alerts = checkAlerts({}, [], DEFAULT_THRESHOLDS);
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('handles undefined summary fields', () => {
      const summary = {};
      const alerts = checkAlerts(summary, [], DEFAULT_THRESHOLDS);
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('handles empty results array', () => {
      const summary = { ...baseSummary, totalErrors: 100 };
      const alerts = checkAlerts(summary, [], DEFAULT_THRESHOLDS);
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('handles undefined thresholds (uses defaults)', () => {
      const summary = { ...baseSummary, totalErrors: 100 };
      const alerts = checkAlerts(summary, baseResults, undefined);
      expect(alerts.some(a => a.level === 'error')).toBe(true);
    });

    test('handles partial thresholds', () => {
      const summary = { ...baseSummary, totalErrors: 100 };
      const customThresholds = { maxErrors: 10, maxWarnings: 500, maxUniqueErrors: 20, criticalLoggers: [] };
      const alerts = checkAlerts(summary, baseResults, customThresholds);
      expect(alerts.some(a => a.message.includes('100'))).toBe(true);
    });

    test('handles empty criticalLoggers array', () => {
      const summary = { ...baseSummary, totalErrors: 1 };
      const results = [{
        count: 5,
        examples: [{ logger: 'com.adobe.granite.replication' }]
      }];
      const thresholds = { ...DEFAULT_THRESHOLDS, criticalLoggers: [] };

      const alerts = checkAlerts(summary, results, thresholds);
      expect(alerts.filter(a => a.message.includes('critical')).length).toBe(0);
    });
  });

  describe('alert message format', () => {
    test('error alert includes count and threshold', () => {
      const summary = { ...baseSummary, totalErrors: 75 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxErrors: 50 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      const errorAlert = alerts.find(a => a.level === 'error');
      expect(errorAlert.message).toContain('75');
      expect(errorAlert.message).toContain('50');
    });

    test('warning alert includes count and threshold', () => {
      const summary = { ...baseSummary, totalWarnings: 600 };
      const thresholds = { ...DEFAULT_THRESHOLDS, maxWarnings: 500 };
      const alerts = checkAlerts(summary, baseResults, thresholds);

      const warningAlert = alerts.find(a => a.level === 'warning');
      expect(warningAlert.message).toContain('600');
      expect(warningAlert.message).toContain('500');
    });
  });
});
