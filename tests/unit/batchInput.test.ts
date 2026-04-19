import { parseBatchInput } from '../../frontend/src/features/analysis/useAnalysis';

describe('parseBatchInput', () => {
  it('parses comma-separated paths', () => {
    const result = parseBatchInput('/a.log, /b.log');
    expect(result.files).toEqual(['/a.log', '/b.log']);
  });

  it('detects log type from extension', () => {
    const result = parseBatchInput('/a.err, /b.access, /c.cdn');
    expect(result.logTypes).toEqual(['error', 'request', 'cdn']);
  });

  it('normalizes Windows paths', () => {
    const result = parseBatchInput('C:\\logs\\a.log');
    expect(result.files[0]).toBe('C:/logs/a.log');
  });
});