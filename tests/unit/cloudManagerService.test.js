const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('child_process');
const { execFile } = require('child_process');

describe('cloudManagerService - Exported Functions', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-test-'));
    execFile.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getAioCommandPreview', () => {
    const { getAioCommandPreview } = require('../../src/services/cloudManagerService');

    test('builds command preview with aio prefix', () => {
      expect(getAioCommandPreview(['cloudmanager:list-programs'])).toBe('aio cloudmanager:list-programs');
    });

    test('handles multiple arguments', () => {
      expect(getAioCommandPreview(['config', 'get', 'key'])).toBe('aio config get key');
    });
  });

  describe('getEstimatedDateRange', () => {
    const { getEstimatedDateRange } = require('../../src/services/cloudManagerService');

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

    test('label contains date range', () => {
      const result = getEstimatedDateRange(5);
      expect(result.label).toContain('Estimated range');
    });
  });

  describe('validateOutputDirectory', () => {
    const { validateOutputDirectory } = require('../../src/services/cloudManagerService');

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

    test('throws error when path is a file', () => {
      const filePath = path.join(tempDir, 'file.txt');
      fs.writeFileSync(filePath, 'content');
      expect(() => validateOutputDirectory(filePath)).toThrow('must be a directory');
    });
  });

  describe('buildDownloadCommand', () => {
    const { buildDownloadCommand } = require('../../src/services/cloudManagerService');

    test('builds command with all required elements', () => {
      const options = {
        environmentId: 'env123',
        service: 'author',
        logName: 'error.log',
        days: 2,
        programId: 'prog456',
        outputDirectory: '/tmp/logs'
      };
      const result = buildDownloadCommand(options);
      expect(result).toContain('cloudmanager');
      expect(result).toContain('download-logs');
      expect(result).toContain('env123');
      expect(result).toContain('author');
      expect(result).toContain('error.log');
      expect(result).toContain('--programId');
      expect(result).toContain('prog456');
      expect(result).toContain('2');
    });

    test('defaults days to 1 if not specified', () => {
      const options = {
        environmentId: 'env',
        service: 'author',
        logName: 'error.log',
        programId: 'prog'
      };
      const result = buildDownloadCommand(options);
      expect(result).toContain('1');
    });
  });

  describe('downloadLogs', () => {
    const { downloadLogs } = require('../../src/services/cloudManagerService');

    test('validates days must be positive integer', async () => {
      await expect(downloadLogs({
        outputDirectory: tempDir,
        days: -1,
        environmentId: 'env',
        service: 'author',
        logName: 'error',
        programId: 'prog'
      })).rejects.toThrow('Days must be a positive integer');
    });

    test('validates output directory exists', async () => {
      await expect(downloadLogs({
        outputDirectory: '/nonexistent',
        days: 1,
        environmentId: 'env',
        service: 'author',
        logName: 'error',
        programId: 'prog'
      })).rejects.toThrow('does not exist');
    });

    test('throws error when no log files produced', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, '', '');
      });

      await expect(downloadLogs({
        outputDirectory: tempDir,
        days: 1,
        environmentId: 'env',
        service: 'author',
        logName: 'error',
        programId: 'prog'
      })).rejects.toThrow('did not produce any downloadable log files');
    });
  });

  describe('describeDownloadedFiles', () => {
    const { describeDownloadedFiles } = require('../../src/services/cloudManagerService');

    test('processes downloaded files and returns file descriptions', async () => {
      const errorLog = path.join(tempDir, 'error.log');
      fs.writeFileSync(errorLog, '04.04.2026 00:00:00.000 *ERROR* Test error\n');

      const download = {
        downloadedFiles: [errorLog],
        fileDates: [{ filePath: errorLog, fileName: 'error.log', extractedDate: '2026-04-04' }]
      };

      const result = await describeDownloadedFiles(download);
      expect(result).toHaveLength(1);
      expect(result[0].filePath).toBe(errorLog);
      expect(result[0].fileName).toBe('error.log');
      expect(result[0].extractedDate).toBe('2026-04-04');
    });

    test('handles empty downloadedFiles array', async () => {
      const download = {
        downloadedFiles: [],
        fileDates: []
      };

      const result = await describeDownloadedFiles(download);
      expect(result).toEqual([]);
    });
  });

  describe('fetchProgramsFromCloudManager', () => {
    const { fetchProgramsFromCloudManager } = require('../../src/services/cloudManagerService');

    test('fetches and normalizes programs', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, '{"programs": [{"id": "123", "name": "Test"}]}', '');
      });

      const result = await fetchProgramsFromCloudManager();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123');
      expect(result[0].name).toBe('Test');
    });

    test('throws error on command failure', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(new Error('ENOENT'), '', 'aio not found');
      });

      await expect(fetchProgramsFromCloudManager()).rejects.toThrow();
    });
  });

  describe('fetchEnvironmentsFromCloudManager', () => {
    const { fetchEnvironmentsFromCloudManager } = require('../../src/services/cloudManagerService');

    test('fetches and normalizes environments', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, '{"environments": [{"id": "env1", "name": "Dev"}]}', '');
      });

      const result = await fetchEnvironmentsFromCloudManager('123');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('env1');
    });

    test('throws error on command failure', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(new Error('failed'), '', 'error');
      });

      await expect(fetchEnvironmentsFromCloudManager('123')).rejects.toThrow();
    });
  });

  describe('listAvailableLogOptions', () => {
    const { listAvailableLogOptions } = require('../../src/services/cloudManagerService');

    test('fetches and normalizes log options', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(null, JSON.stringify([{ service: 'author', name: 'error.log' }]), '');
      });

      const result = await listAvailableLogOptions('prog123', 'env456');
      expect(result).toHaveLength(1);
      expect(result[0].service).toBe('author');
      expect(result[0].name).toBe('error.log');
    });
  });

});
