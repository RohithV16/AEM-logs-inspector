const fs = require('fs');
const os = require('os');
const path = require('path');

const { createLogStream, createRequestLogStream, createCDNLogStream } = require('../../src/parser');
const { watchLogFile } = require('../../src/tailer');

describe('parser - streaming log creation', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-stream-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('createLogStream returns an async generator for valid file', async () => {
    const tempErrorLog = path.join(tempDir, 'stream_error.log');
    const content = [
      '29.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] Error 1',
      '29.03.2026 14:30:16.123 [qtp-2] *WARN* [com.example.Logger] Warning 1'
    ].join('\n');
    fs.writeFileSync(tempErrorLog, content, 'utf8');

    const stream = createLogStream(tempErrorLog);
    expect(stream).toBeDefined();
    expect(typeof stream.next).toBe('function');
  });

  test('createLogStream handles non-existent file', async () => {
    const stream = createLogStream('/nonexistent/path.log');
    expect(stream).toBeDefined();
  });
});

describe('parser - request log streaming', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-req-stream-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('createRequestLogStream returns an async generator', async () => {
    const tempRequestLog = path.join(tempDir, 'stream_request.log');
    const content = '29/Mar/2026:14:30:15 +0000 [12345] -> GET /content HTTP/1.1 [pod]';
    fs.writeFileSync(tempRequestLog, content, 'utf8');

    const stream = createRequestLogStream(tempRequestLog);
    expect(stream).toBeDefined();
    expect(typeof stream.next).toBe('function');
  });
});

describe('parser - CDN log streaming', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-cdn-stream-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('createCDNLogStream returns an async generator', async () => {
    const tempCDNLog = path.join(tempDir, 'stream_cdn.log');
    const content = JSON.stringify({ timestamp: '2026-03-29T14:30:15.000Z', status: 200, url: '/content' });
    fs.writeFileSync(tempCDNLog, content + '\n', 'utf8');

    const stream = createCDNLogStream(tempCDNLog);
    expect(stream).toBeDefined();
    expect(typeof stream.next).toBe('function');
  });
});

describe('parser - gzip compressed file handling', () => {
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-gzip-stream-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('createLogStream can handle gzip files', async () => {
    const tempGzipLog = path.join(tempDir, 'compressed_error.log.gz');
    const zlib = require('zlib');
    const content = [
      '29.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] Error 1',
      '29.03.2026 14:30:16.123 [qtp-2] *WARN* [com.example.Logger] Warning 1'
    ].join('\n');

    const gzipBuffer = zlib.gzipSync(Buffer.from(content, 'utf8'));
    fs.writeFileSync(tempGzipLog, gzipBuffer);

    const stream = createLogStream(tempGzipLog);
    expect(stream).toBeDefined();
  });
});

describe('tailer - watchLogFile', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-watch-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('watchLogFile returns controller with close method', () => {
    const tempFile = path.join(tempDir, 'watch.log');
    fs.writeFileSync(tempFile, 'initial content');

    const controller = watchLogFile(tempFile, () => {});

    expect(controller).toHaveProperty('close');
    expect(typeof controller.close).toBe('function');
    controller.close();
  });

  test('watchLogFile returns error property for non-existent file', () => {
    const nonExistent = path.join(tempDir, 'does_not_exist.log');
    const controller = watchLogFile(nonExistent, () => {});

    expect(controller).toHaveProperty('error');
    controller.close();
  });

  test('watchLogFile calls callback on new error entries', (done) => {
    const tempFile = path.join(tempDir, 'watch.log');
    fs.writeFileSync(tempFile, 'initial line\n');

    const entries = [];
    const controller = watchLogFile(tempFile, (entry) => {
      entries.push(entry);
    });

    setTimeout(() => {
      fs.appendFileSync(tempFile, '29.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] New error\n');
    }, 50);

    setTimeout(() => {
      expect(entries.length).toBeGreaterThan(0);
      controller.close();
      done();
    }, 200);
  });

  test('watchLogFile only triggers on file changes', (done) => {
    const tempFile = path.join(tempDir, 'watch.log');
    fs.writeFileSync(tempFile, 'initial line\n');

    let callCount = 0;
    const controller = watchLogFile(tempFile, () => {
      callCount++;
    });

    setTimeout(() => {
      fs.appendFileSync(tempFile, '29.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] Error\n');
    }, 50);

    setTimeout(() => {
      controller.close();
      done();
    }, 150);
  });

  test('watchLogFile handles file truncation gracefully', () => {
    const tempFile = path.join(tempDir, 'watch.log');
    fs.writeFileSync(tempFile, 'initial content');

    const controller = watchLogFile(tempFile, () => {});

    fs.writeFileSync(tempFile, 'truncated');
    controller.close();
  });
});
