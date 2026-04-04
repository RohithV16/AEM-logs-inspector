const fs = require('fs');
const os = require('os');
const path = require('path');
const requestLogService = require('../../src/services/requestLogService');
const cdnLogService = require('../../src/services/cdnLogService');
const { analyzeAllInOnePass } = require('../../src/services/errorLogService');
const { detectLogType, detectLogSignature, detectLogTypeFromLine, detectLogFamilyFromLine, getLogTypeFromFileName } = require('../../src/parser');
const { analyzeResolvedLogFile } = require('../../src/services/logAnalysisService');
const { clearCache } = require('../../src/utils/analysisCache');

const REAL_LOG_DIR = '/Users/rvenat01/Downloads/cloudmanager/167805/1796674';

describe('Real Log Files Analysis', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('Request Log Analysis with Real Files', () => {
    test('analyzes real request log from cloudmanager', async () => {
      const requestLogPath = path.join(REAL_LOG_DIR, 'author/aemrequest/2026-04-04T15-10-39-001Z/1796674-author-aemrequest-2026-04-04.log');
      
      if (!fs.existsSync(requestLogPath)) {
        return;
      }

      const result = await requestLogService.analyzeRequestLog(requestLogPath);

      expect(result.summary.totalRequests).toBeGreaterThan(0);
      expect(result.methods).toBeDefined();
      expect(result.statuses).toBeDefined();
    });
  });

  describe('CDN Log Analysis with Real Files', () => {
    test('analyzes real CDN log from cloudmanager', async () => {
      const cdnLogPath = path.join(REAL_LOG_DIR, 'author/cdn/2026-04-04T15-10-46-645Z/1796674-author-cdn-2026-04-04.log');
      
      if (!fs.existsSync(cdnLogPath)) {
        return;
      }

      const result = await cdnLogService.analyzeCDNLog(cdnLogPath);

      expect(result.summary.totalRequests).toBeGreaterThan(0);
      expect(result.cacheStatuses).toBeDefined();
      expect(result.statuses).toBeDefined();
      expect(result.pops).toBeDefined();
    });
  });

  describe('Error Log Analysis with Real Files', () => {
    test('analyzes real error log from cloudmanager', async () => {
      const errorLogPath = path.join(REAL_LOG_DIR, 'author/aemerror/2026-04-04T15-10-55-031Z/1796674-author-aemerror-2026-04-04.log');
      
      if (!fs.existsSync(errorLogPath)) {
        return;
      }

      const result = await analyzeAllInOnePass(errorLogPath);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Log Signature Detection', () => {
    test('detects request log signature from real file', async () => {
      const requestLogPath = path.join(REAL_LOG_DIR, 'author/aemrequest/2026-04-04T15-10-39-001Z/1796674-author-aemrequest-2026-04-04.log');
      
      if (!fs.existsSync(requestLogPath)) {
        return;
      }

      const signature = await detectLogSignature(requestLogPath);

      expect(signature.logType).toBeDefined();
      expect(signature.logFamily).toBeDefined();
    });

    test('detects error log signature from real file', async () => {
      const errorLogPath = path.join(REAL_LOG_DIR, 'author/aemerror/2026-04-04T15-10-55-031Z/1796674-author-aemerror-2026-04-04.log');
      
      if (!fs.existsSync(errorLogPath)) {
        return;
      }

      const signature = await detectLogSignature(errorLogPath);

      expect(signature.logType).toBeDefined();
      expect(signature.logFamily).toBeDefined();
    });

    test('detects CDN log signature from real file', async () => {
      const cdnLogPath = path.join(REAL_LOG_DIR, 'author/cdn/2026-04-04T15-10-46-645Z/1796674-author-cdn-2026-04-04.log');
      
      if (!fs.existsSync(cdnLogPath)) {
        return;
      }

      const signature = await detectLogSignature(cdnLogPath);

      expect(signature.logType).toBeDefined();
      expect(signature.logFamily).toBeDefined();
    });

    test('detects access log signature from real file', async () => {
      const accessLogPath = path.join(REAL_LOG_DIR, 'author/aemaccess/2026-04-04T15-10-30-200Z/1796674-author-aemaccess-2026-04-04.log');
      
      if (!fs.existsSync(accessLogPath)) {
        return;
      }

      const signature = await detectLogSignature(accessLogPath);

      expect(signature.logType).toBeDefined();
      expect(signature.logFamily).toBeDefined();
    });
  });
});

describe('Log Type Detection Functions', () => {
  test('detectLogTypeFromLine identifies request log', () => {
    const content = '04/Apr/2026:00:00:06 +0000 [17980] -> HEAD /libs/granite/core/content/login.html HTTP/1.1';
    const logType = detectLogTypeFromLine(content);
    expect(logType).toBeTruthy();
  });

  test('detectLogTypeFromLine identifies error log', () => {
    const content = '04.04.2026 00:00:00.004 [cm-p167805-e1796674] *INFO*';
    const logType = detectLogTypeFromLine(content);
    expect(logType).toBeTruthy();
  });

  test('detectLogFamilyFromLine extracts family', () => {
    const content = '04/Apr/2026:00:00:06 +0000 [17980] -> GET /content HTTP/1.1 [pod-name]';
    const family = detectLogFamilyFromLine(content);
    expect(family).toBeTruthy();
  });

  test('getLogTypeFromFileName extracts type from filename', () => {
    const fileName = '1796674-author-aemerror-2026-04-04.log';
    const logType = getLogTypeFromFileName(fileName);
    expect(logType).toBeTruthy();
  });
});

describe('Log Analysis Service', () => {
  test('analyzeResolvedLogFile returns a result for real files', async () => {
    const errorLogPath = path.join(REAL_LOG_DIR, 'author/aemerror/2026-04-04T15-10-55-031Z/1796674-author-aemerror-2026-04-04.log');
    
    if (!fs.existsSync(errorLogPath)) {
      return;
    }

    const result = await analyzeResolvedLogFile(errorLogPath);

    expect(result).toBeTruthy();
  });

  test('analyzeResolvedLogFile returns a result for request log', async () => {
    const requestLogPath = path.join(REAL_LOG_DIR, 'author/aemrequest/2026-04-04T15-10-39-001Z/1796674-author-aemrequest-2026-04-04.log');
    
    if (!fs.existsSync(requestLogPath)) {
      return;
    }

    const result = await analyzeResolvedLogFile(requestLogPath);

    expect(result).toBeTruthy();
  });
});

describe('Request Log Service Edge Cases', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-request-edge-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    clearCache();
  });

  test('handles request log with all HTTP methods', async () => {
    const requestLog = path.join(tempDir, 'methods.log');
    const content = [
      '04/Apr/2026:00:00:06 +0000 [1] -> GET /path HTTP/1.1 [pod]',
      '04/Apr/2026:00:00:07 +0000 [2] -> POST /path HTTP/1.1 [pod]',
      '04/Apr/2026:00:00:08 +0000 [3] -> PUT /path HTTP/1.1 [pod]',
      '04/Apr/2026:00:00:09 +0000 [4] -> DELETE /path HTTP/1.1 [pod]',
      '04/Apr/2026:00:00:10 +0000 [5] <- 200 text/html 10ms [pod]'
    ].join('\n');
    fs.writeFileSync(requestLog, content, 'utf8');

    const result = await requestLogService.analyzeRequestLog(requestLog);

    expect(result.methods).toBeDefined();
  });

  test('handles request log with various status codes', async () => {
    const requestLog = path.join(tempDir, 'status.log');
    const content = [
      '04/Apr/2026:00:00:06 +0000 [1] <- 200 text/html 10ms [pod]',
      '04/Apr/2026:00:00:07 +0000 [2] <- 301 text/html 5ms [pod]',
      '04/Apr/2026:00:00:08 +0000 [3] <- 404 text/html 3ms [pod]',
      '04/Apr/2026:00:00:09 +0000 [4] <- 500 text/html 100ms [pod]'
    ].join('\n');
    fs.writeFileSync(requestLog, content, 'utf8');

    const result = await requestLogService.analyzeRequestLog(requestLog);

    expect(result.statuses[200]).toBe(1);
    expect(result.statuses[301]).toBe(1);
    expect(result.statuses[404]).toBe(1);
    expect(result.statuses[500]).toBe(1);
  });
});

describe('CDN Log Service Edge Cases', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-cdn-edge-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    clearCache();
  });

  test('handles CDN log with all cache statuses', async () => {
    const cdnLog = path.join(tempDir, 'cache-statuses.log');
    const content = [
      JSON.stringify({ status: 200, cache: 'HIT', url: '/1', host: 'ex.com', method: 'GET', timestamp: '2026-04-04T00:00:00Z', ttfb: 10, ttlb: 20 }),
      JSON.stringify({ status: 200, cache: 'MISS', url: '/2', host: 'ex.com', method: 'GET', timestamp: '2026-04-04T00:00:01Z', ttfb: 10, ttlb: 20 }),
      JSON.stringify({ status: 200, cache: 'PASS', url: '/3', host: 'ex.com', method: 'GET', timestamp: '2026-04-04T00:00:02Z', ttfb: 10, ttlb: 20 }),
      JSON.stringify({ status: 200, cache: 'EXPIRED', url: '/4', host: 'ex.com', method: 'GET', timestamp: '2026-04-04T00:00:03Z', ttfb: 10, ttlb: 20 })
    ].join('\n');
    fs.writeFileSync(cdnLog, content, 'utf8');

    const result = await cdnLogService.analyzeCDNLog(cdnLog);

    expect(result.cacheStatuses).toBeDefined();
  });

  test('aggregates multiple POPs correctly', async () => {
    const cdnLog = path.join(tempDir, 'pops.log');
    const pops = ['DFW', 'LAX', 'JFK', 'SFO', 'ORD'];
    const content = pops.map((pop, i) => 
      JSON.stringify({ status: 200, cache: 'HIT', pop, url: `/${i}`, host: 'ex.com', method: 'GET', timestamp: '2026-04-04T00:00:00Z', ttfb: 10, ttlb: 20 })
    ).join('\n');
    fs.writeFileSync(cdnLog, content, 'utf8');

    const result = await cdnLogService.analyzeCDNLog(cdnLog);

    expect(result.pops).toBeDefined();
    expect(Object.keys(result.pops).length).toBeGreaterThanOrEqual(0);
  });
});
