const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { PassThrough } = require('stream');

jest.mock('os', () => {
  const actualOs = jest.requireActual('os');
  return {
    ...actualOs,
    homedir: () => actualOs.tmpdir()
  };
});

jest.mock('child_process', () => ({
  execFile: jest.fn(),
  spawn: jest.fn()
}));

const { execFile, spawn } = require('child_process');
const {
  getAioCommandPreview,
  getEstimatedDateRange,
  validateOutputDirectory,
  buildDownloadCommand,
  buildTailCommand,
  downloadLogs,
  describeDownloadedFiles,
  fetchProgramsFromCloudManager,
  fetchEnvironmentsFromCloudManager,
  listAvailableLogOptions,
  createCloudManagerTailSession
} = require('../../src/services/cloudManagerService');

function createMockProcess() {
  const proc = new EventEmitter();
  proc.stdout = new PassThrough();
  proc.stderr = new PassThrough();
  proc.killed = false;
  proc.kill = jest.fn((signal = 'SIGTERM') => {
    proc.killed = true;
    proc.emit('close', null, signal);
  });
  return proc;
}

describe('cloudManagerService', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-test-'));
    execFile.mockReset();
    spawn.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getAioCommandPreview', () => {
    test('builds command preview with aio prefix', () => {
      expect(getAioCommandPreview(['cloudmanager:list-programs'])).toBe('aio cloudmanager:list-programs');
    });

    test('handles multiple arguments', () => {
      expect(getAioCommandPreview(['config', 'get', 'key'])).toBe('aio config get key');
    });
  });

  describe('getEstimatedDateRange', () => {
    test('returns object with startDate, endDate, and label', () => {
      const result = getEstimatedDateRange(3);
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('label');
    });

    test('uses default days of 1 when not specified', () => {
      const result = getEstimatedDateRange();
      expect(result.startDate).toBeTruthy();
      expect(result.endDate).toBeTruthy();
    });
  });

  describe('validateOutputDirectory', () => {
    test('returns resolved path for valid directory', () => {
      const result = validateOutputDirectory(tempDir);
      expect(result).toBe(tempDir);
    });

    test('throws error for empty path', () => {
      expect(() => validateOutputDirectory('')).toThrow('Output directory is required');
      expect(() => validateOutputDirectory(null)).toThrow('Output directory is required');
      expect(() => validateOutputDirectory(undefined)).toThrow('Output directory is required');
    });

    test('throws error for non-existent directory', () => {
      expect(() => validateOutputDirectory('/nonexistent/path/abc')).toThrow('does not exist');
    });
  });

  describe('buildDownloadCommand', () => {
    test('builds command with all required elements', () => {
      const result = buildDownloadCommand({
        environmentId: 'env123',
        service: 'author',
        logName: 'error.log',
        days: 2,
        programId: 'prog456',
        outputDirectory: '/tmp/logs'
      });
      expect(result).toContain('cloudmanager');
      expect(result).toContain('download-logs');
      expect(result).toContain('env123');
      expect(result).toContain('author');
      expect(result).toContain('error.log');
      expect(result).toContain('--programId');
      expect(result).toContain('prog456');
      expect(result).toContain('2');
    });
  });

  describe('buildTailCommand', () => {
    test('builds tail command with required arguments', () => {
      expect(buildTailCommand({
        environmentId: 'env123',
        service: 'author',
        logName: 'aemerror'
      })).toEqual([
        'cloudmanager:environment:tail-log',
        'env123',
        'author',
        'aemerror'
      ]);
    });

    test('includes optional program and ims context flags', () => {
      expect(buildTailCommand({
        environmentId: 'env123',
        service: 'author',
        logName: 'aemerror',
        programId: 'prog456',
        imsContextName: 'alternate'
      })).toEqual([
        'cloudmanager:environment:tail-log',
        'env123',
        'author',
        'aemerror',
        '--programId',
        'prog456',
        '--imsContextName',
        'alternate'
      ]);
    });
  });

  describe('downloadLogs', () => {
    test('validates days must be positive integer', async () => {
      await expect(downloadLogs({
        days: -1,
        environmentId: 'env',
        service: 'author',
        logName: 'error',
        programId: 'prog'
      })).rejects.toThrow('Days must be a positive integer');
    });

    test('throws error when no log files produced', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, '', '');
      });

      await expect(downloadLogs({
        days: 1,
        environmentId: 'env',
        service: 'author',
        logName: 'error',
        programId: 'prog'
      })).rejects.toThrow('did not produce any downloadable log files');
    });
  });

  describe('describeDownloadedFiles', () => {
    test('processes downloaded files and returns file descriptions', async () => {
      const errorLog = path.join(tempDir, 'error.log');
      fs.writeFileSync(errorLog, '04.04.2026 00:00:00.000 [thread] *ERROR* [com.example.Logger] Test error\n');

      const result = await describeDownloadedFiles({
        downloadedFiles: [errorLog],
        fileDates: [{ filePath: errorLog, fileName: 'error.log', extractedDate: '2026-04-04' }]
      });

      expect(result).toHaveLength(1);
      expect(result[0].filePath).toBe(errorLog);
      expect(result[0].fileName).toBe('error.log');
      expect(result[0].extractedDate).toBe('2026-04-04');
    });
  });

  describe('fetchProgramsFromCloudManager', () => {
    test('fetches and normalizes programs', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, '{"programs": [{"id": "123", "name": "Test"}]}', '');
      });

      const result = await fetchProgramsFromCloudManager();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123');
      expect(result[0].name).toBe('Test');
    });
  });

  describe('fetchEnvironmentsFromCloudManager', () => {
    test('fetches and normalizes environments', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, '{"environments": [{"id": "env1", "name": "Dev"}]}', '');
      });

      const result = await fetchEnvironmentsFromCloudManager('123');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('env1');
    });
  });

  describe('listAvailableLogOptions', () => {
    test('fetches and normalizes log options', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, JSON.stringify([{ service: 'author', name: 'aemerror' }]), '');
      });

      const result = await listAvailableLogOptions('prog123', 'env456');
      expect(result).toHaveLength(1);
      expect(result[0].service).toBe('author');
      expect(result[0].name).toBe('aemerror');
    });
  });

  describe('createCloudManagerTailSession', () => {
    test('emits parsed tail entries and stops cleanly', async () => {
      const proc = createMockProcess();
      spawn.mockReturnValue(proc);
      const onStatus = jest.fn();
      const onEntry = jest.fn();
      const onStopped = jest.fn();

      const session = createCloudManagerTailSession({
        environmentId: 'env123',
        service: 'author',
        logName: 'aemerror',
        programId: 'prog456'
      }, { onStatus, onEntry, onStopped });

      session.start();
      proc.emit('spawn');
      proc.stdout.write('29.03.2026 14:30:15.123 [qtp-1] *ERROR* [com.example.Logger] Tail error\n');
      await new Promise((resolve) => setImmediate(resolve));

      expect(spawn).toHaveBeenCalledWith('aio', [
        'cloudmanager:environment:tail-log',
        'env123',
        'author',
        'aemerror',
        '--programId',
        'prog456'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ status: 'running' }));
      expect(onEntry).toHaveBeenCalledWith(expect.objectContaining({
        parsed: true,
        logType: 'error',
        level: 'ERROR',
        rawLine: expect.stringContaining('Tail error')
      }));

      session.stop();
      expect(proc.kill).toHaveBeenCalledWith('SIGTERM');
      expect(onStopped).toHaveBeenCalled();
    });

    test('maps aio failures to normalized Cloud Manager errors', async () => {
      const proc = createMockProcess();
      spawn.mockReturnValue(proc);
      const onError = jest.fn();
      const onStopped = jest.fn();

      const session = createCloudManagerTailSession({
        environmentId: 'env123',
        service: 'author',
        logName: 'aemerror'
      }, { onError, onStopped });

      session.start();
      proc.stderr.write('auth:login required\n');
      proc.emit('close', 1, null);
      await new Promise((resolve) => setImmediate(resolve));

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('aio auth:login')
      }));
      expect(onStopped).toHaveBeenCalled();
    });
  });
});
