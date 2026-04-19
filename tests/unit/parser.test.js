const {
  parseTimestamp,
  parseLine,
  parseErrorRequestContext,
  parseLogFile,
  parseAllLevels,
  detectLogTypeFromLine
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

// Regression: ISSUE-002 — simple logger format where [logger-class] message has no HTTP context
describe('parser - simple logger format (ISSUE-002)', () => {
  test('parseLine extracts logger from bracket in simple format', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [thread-1] *ERROR* [com.example.Component] Something went wrong');

    expect(entry).not.toBeNull();
    expect(entry.logger).toBe('com.example.Component');
    expect(entry.message).toBe('Something went wrong');
    expect(entry.level).toBe('ERROR');
    expect(entry.thread).toBe('thread-1');
    expect(entry.httpMethod).toBe('');
  });

  test('parseLine handles simple logger with dots in message', () => {
    const entry = parseLine('29.03.2026 00:00:01.000 [thread-1] *WARN* [com.example.Cache] Cache miss for /content/page');

    expect(entry.logger).toBe('com.example.Cache');
    expect(entry.message).toBe('Cache miss for /content/page');
  });

  test('parseLine handles simple logger with short class name', () => {
    const entry = parseLine('29.03.2026 00:00:02.000 [thread-2] *ERROR* [org.apache.sling.SlingServlet] Servlet error');

    expect(entry.logger).toBe('org.apache.sling.SlingServlet');
    expect(entry.message).toBe('Servlet error');
  });

  test('parseLine still handles HTTP context format correctly', () => {
    const entry = parseLine('09.02.2026 23:59:07.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547310] GET /content/site HTTP/1.1] com.example.Logger Something happened');

    expect(entry.logger).toBe('com.example.Logger');
    expect(entry.message).toBe('Something happened');
    expect(entry.httpMethod).toBe('GET');
    expect(entry.requestPath).toBe('/content/site');
  });

  test('parseLine parses mixed simple and HTTP context lines in same file', () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-parser-mixed-'));
    const tempFile = path.join(tempDir, 'mixed.log');
    const content = [
      '29.03.2026 00:00:00.000 [thread-1] *ERROR* [com.example.Component] Something went wrong',
      '09.02.2026 23:59:07.330 [author-pod-1] *ERROR* [208.127.46.120 [1770681547310] GET /content/site HTTP/1.1] com.example.Logger HTTP error',
      '29.03.2026 00:00:01.000 [thread-1] *WARN* [com.example.Cache] Cache miss'
    ].join('\n');

    fs.writeFileSync(tempFile, content, 'utf8');
    const entries = parseLogFile(tempFile);
    fs.rmSync(tempDir, { recursive: true, force: true });

    expect(entries.length).toBe(3);
    expect(entries[0].logger).toBe('com.example.Component');
    expect(entries[0].message).toBe('Something went wrong');
    expect(entries[1].logger).toBe('com.example.Logger');
    expect(entries[1].httpMethod).toBe('GET');
    expect(entries[2].logger).toBe('com.example.Cache');
    expect(entries[2].message).toBe('Cache miss');
  });

  test('parseLine handles logger with inner angle brackets', () => {
    const entry = parseLine('29.03.2026 00:00:00.000 [thread-1] *ERROR* [org.apache.jackrabbit.oak.plugins.index.AsyncIndexUpdate] Async indexer failed');

    expect(entry.logger).toBe('org.apache.jackrabbit.oak.plugins.index.AsyncIndexUpdate');
    expect(entry.message).toBe('Async indexer failed');
  });
});

describe('parser - ISO format support (AEMaaCS)', () => {
  test('parseLine handles ISO-8601 timestamps', () => {
    const entry = parseLine('2026-03-29T14:30:15.123Z *ERROR* com.example.Class Something failed');
    
    expect(entry).not.toBeNull();
    expect(entry.timestamp).toBe('2026-03-29T14:30:15.123Z');
    expect(entry.level).toBe('ERROR');
    expect(entry.logger).toBe('com.example.Class');
    expect(entry.message).toBe('Something failed');
  });

  test('detectLogTypeFromLine correctly identifies ISO error logs', () => {
    const line = '2026-03-29T14:30:15.123Z *ERROR* com.example.Class msg';
    expect(detectLogTypeFromLine(line)).toBe('error');
  });

  test('detectLogTypeFromLine returns null for malformed ISO-like line', () => {
    const line = '2026-03-29 Something *ERROR*';
    expect(detectLogTypeFromLine(line)).toBeNull();
  });
});

