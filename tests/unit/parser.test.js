const {
  parseTimestamp,
  parseLine,
  parseErrorRequestContext,
  parseLogFile,
  parseAllLevels
} = require('../../src/parser');

describe('parser - timestamp parsing', () => {
  test('parseTimestamp parses DD.MM.YYYY HH:MM:SS.mmm format correctly', () => {
    const date = parseTimestamp('29.03.2026 14:30:15.123');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(29);
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
    expect(date.getSeconds()).toBe(15);
  });

  test('parseTimestamp handles single-digit months correctly', () => {
    const date = parseTimestamp('05.01.2026 00:00:00.000');
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
  });

  test('parseTimestamp returns JS Date object for valid input', () => {
    const date = parseTimestamp('01.12.2025 23:59:59.999');
    expect(date instanceof Date).toBe(true);
  });

  test('parseTimestamp handles different times of day', () => {
    const morning = parseTimestamp('01.01.2026 09:00:00.000');
    expect(morning.getHours()).toBe(9);

    const midday = parseTimestamp('01.01.2026 12:00:00.000');
    expect(midday.getHours()).toBe(12);

    const evening = parseTimestamp('01.01.2026 23:59:59.999');
    expect(evening.getHours()).toBe(23);
  });
});

describe('parser - error request context parsing', () => {
  test('parseErrorRequestContext extracts method and path', () => {
    const result = parseErrorRequestContext('208.127.46.120 [1770681547310] GET /editor.html/content/site HTTP/1.1');
    expect(result.httpMethod).toBe('GET');
    expect(result.requestPath).toBe('/editor.html/content/site');
  });

  test('parseErrorRequestContext handles POST requests', () => {
    const result = parseErrorRequestContext('208.127.46.120 [1770681547310] POST /bin/wcmcommand HTTP/1.1');
    expect(result.httpMethod).toBe('POST');
    expect(result.requestPath).toBe('/bin/wcmcommand');
  });

  test('parseErrorRequestContext returns empty for non-HTTP context', () => {
    const result = parseErrorRequestContext('qtp-1');
    expect(result.httpMethod).toBe('');
    expect(result.requestPath).toBe('');
  });

  test('parseErrorRequestContext handles null/undefined', () => {
    expect(parseErrorRequestContext(null)).toEqual({ httpMethod: '', requestPath: '' });
    expect(parseErrorRequestContext(undefined)).toEqual({ httpMethod: '', requestPath: '' });
  });
});

describe('parser - error log line parsing', () => {
  test('parseLine parses valid error log line correctly', () => {
    const entry = parseLine('29.03.2026 14:30:15.123 [qtp-1] *ERROR* [208.127.46.120 [1770681547310] GET /content/site HTTP/1.1] com.example.Logger Something happened');

    expect(entry.timestamp).toBe('29.03.2026 14:30:15.123');
    expect(entry.level).toBe('ERROR');
    expect(entry.logger).toBe('com.example.Logger');
    expect(entry.message).toContain('Something happened');
    expect(entry.httpMethod).toBe('GET');
  });

  test('parseLine handles WARN level', () => {
    const entry = parseLine('29.03.2026 14:30:15.123 [qtp-1] *WARN* [208.127.46.120 [1770681547310] POST /bin/command HTTP/1.1] com.example.Logger Warning message');
    expect(entry.level).toBe('WARN');
    expect(entry.httpMethod).toBe('POST');
  });

  test('parseLine handles DEBUG level', () => {
    const entry = parseLine('29.03.2026 14:30:15.123 [qtp-1] *DEBUG* [208.127.46.120 [1770681547310] GET /content HTTP/1.1] com.example.Logger Debug message');
    expect(entry.level).toBe('DEBUG');
  });

  test('parseLine handles INFO level', () => {
    const entry = parseLine('29.03.2026 14:30:15.123 [qtp-1] *INFO* [208.127.46.120 [1770681547310] GET /content HTTP/1.1] com.example.Logger Info message');
    expect(entry.level).toBe('INFO');
  });

  test('parseLine returns null for invalid format', () => {
    expect(parseLine('not a valid log line')).toBeNull();
    expect(parseLine('')).toBeNull();
    expect(parseLine('random garbage text')).toBeNull();
  });

  test('parseLine extracts http method and path', () => {
    const entry = parseLine('09.02.2026 23:59:07.330 [author-pod-1] *WARN* [208.127.46.120 [1770681547310] GET /content/site/page.html HTTP/1.1] com.example.Logger Something happened');
    expect(entry.httpMethod).toBe('GET');
    expect(entry.requestPath).toBe('/content/site/page.html');
  });
});

describe('parser - multi-line stack trace handling', () => {
  test('parseLogFile only returns ERROR and WARN entries', () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-parser-'));
    const tempFile = path.join(tempDir, 'mixed_levels.log');

    const content = [
      '29.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] Error message',
      '29.03.2026 14:30:16.123 [qtp-1] *WARN* [com.example.Logger] Warning message',
      '29.03.2026 14:30:17.123 [qtp-1] *INFO* [com.example.Logger] Info message',
      '29.03.2026 14:30:18.123 [qtp-1] *DEBUG* [com.example.Logger] Debug message'
    ].join('\n');

    fs.writeFileSync(tempFile, content, 'utf8');

    const entries = parseLogFile(tempFile);
    fs.rmSync(tempDir, { recursive: true, force: true });

    expect(entries.length).toBe(2);
    expect(entries.every(e => e.level === 'ERROR' || e.level === 'WARN')).toBe(true);
  });

  test('parseLogFile handles empty file', () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-parser-'));
    const tempFile = path.join(tempDir, 'empty.log');

    fs.writeFileSync(tempFile, '', 'utf8');

    const entries = parseLogFile(tempFile);
    fs.rmSync(tempDir, { recursive: true, force: true });

    expect(entries).toEqual([]);
  });
});
