const { downloadExport, exportToCsv, exportToJson } = require('../../frontend/src/shared/utils/useExport');

describe('Export utilities', () => {
  describe('exportToCsv', () => {
    it('returns empty string for empty array', () => {
      expect(exportToCsv([])).toBe('');
    });

    it('converts events to CSV format', () => {
      const events = [
        { level: 'ERROR', message: 'Test error' },
        { level: 'WARN', message: 'Test warning' }
      ];
      const result = exportToCsv(events);
      expect(result).toContain('level,message');
      expect(result).toContain('"ERROR"');
      expect(result).toContain('"Test error"');
    });

    it('handles null values', () => {
      const events = [{ level: null, message: '' }];
      const result = exportToCsv(events);
      expect(result).toContain(',');
    });
  });

  describe('exportToJson', () => {
    it('converts events to formatted JSON', () => {
      const events = [{ level: 'ERROR', message: 'Test' }];
      const result = exportToJson(events);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].level).toBe('ERROR');
    });
  });

  describe('downloadExport', () => {
    it('is a function', () => {
      expect(typeof downloadExport).toBe('function');
    });
  });
});