const { buildEventMessage } = require('../../src/utils/eventMessage');

describe('buildEventMessage - event card display messages', () => {
  describe('error events', () => {
    test('shows message text', () => {
      expect(buildEventMessage({ message: 'NullPointerException in handler' }, 'error')).toBe('NullPointerException in handler');
    });

    test('falls back to title when message missing', () => {
      expect(buildEventMessage({ title: 'Connection timeout' }, 'error')).toBe('Connection timeout');
    });

    test('returns empty string when neither exists', () => {
      expect(buildEventMessage({ level: 'ERROR' }, 'error')).toBe('');
    });
  });

  describe('request events', () => {
    test('shows URL', () => {
      expect(buildEventMessage({ url: '/content/site.html', method: 'GET', status: 200 }, 'request')).toBe('/content/site.html');
    });

    test('returns empty string when url missing', () => {
      expect(buildEventMessage({ method: 'GET', status: 200 }, 'request')).toBe('');
    });
  });

  describe('cdn events', () => {
    test('shows full URL (host + path) when both present', () => {
      expect(buildEventMessage({ url: '/content/dam/image.png', method: 'GET', status: 200, host: 'cdn.example.com' }, 'cdn')).toBe('cdn.example.com/content/dam/image.png');
    });

    test('falls back to url when host missing', () => {
      expect(buildEventMessage({ url: '/content/dam/image.png', method: 'GET', status: 200 }, 'cdn')).toBe('/content/dam/image.png');
    });

    test('falls back to host when url missing', () => {
      expect(buildEventMessage({ method: 'GET', status: 200, host: 'cdn.example.com', pop: 'DEL' }, 'cdn')).toBe('cdn.example.com');
    });

    test('falls back to method + status when url and host missing', () => {
      expect(buildEventMessage({ method: 'POST', status: 403, cache: 'MISS' }, 'cdn')).toBe('POST 403');
    });

    test('returns empty string when all fields missing', () => {
      expect(buildEventMessage({ cache: 'HIT' }, 'cdn')).toBe('');
    });

    test('handles completely empty event', () => {
      expect(buildEventMessage({}, 'cdn')).toBe('');
    });
  });

  describe('batch events', () => {
    test('shows title for error-sourced batch event', () => {
      expect(buildEventMessage({ title: 'Server error', severity: 'ERROR', logType: 'error' }, 'batch')).toBe('Server error');
    });

    test('falls back to message when title missing', () => {
      expect(buildEventMessage({ message: 'Cache miss for /content', severity: 'WARN' }, 'batch')).toBe('Cache miss for /content');
    });

    test('falls back to url for CDN-sourced batch event', () => {
      expect(buildEventMessage({ url: '/api/data', method: 'GET', status: 200, logType: 'cdn' }, 'batch')).toBe('/api/data');
    });

    test('falls back to host for CDN-sourced batch event without url', () => {
      expect(buildEventMessage({ host: 'cdn.example.com', method: 'GET', status: 200, logType: 'cdn' }, 'batch')).toBe('cdn.example.com');
    });

    test('returns empty string when no fields available', () => {
      expect(buildEventMessage({ severity: 'INFO' }, 'batch')).toBe('');
    });
  });
});
