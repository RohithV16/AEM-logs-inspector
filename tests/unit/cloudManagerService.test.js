const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('child_process');
const { execFile } = require('child_process');

describe('cloudManagerService - Exported Functions', () => {
  let tempDir;
  let tempCacheDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-test-'));
    tempCacheDir = path.join(tempDir, 'cache');
    execFile.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('buildCloudManagerSetupPreview', () => {
    const { buildCloudManagerSetupPreview } = require('../../src/services/cloudManagerService');

    test('generates browser mode steps with login, org, program, and cache', () => {
      const payload = {
        mode: 'browser',
        orgId: 'org123',
        programId: 'prog123'
      };
      const result = buildCloudManagerSetupPreview(payload);
      expect(result.mode).toBe('browser');
      expect(result.steps).toHaveLength(4);
      expect(result.steps.map(s => s.id)).toEqual(['login', 'org', 'program', 'cache']);
    });

    test('generates browser mode without programId', () => {
      const payload = {
        mode: 'browser',
        orgId: 'org123'
      };
      const result = buildCloudManagerSetupPreview(payload);
      expect(result.steps).toHaveLength(3);
      expect(result.steps.map(s => s.id)).toEqual(['login', 'org', 'cache']);
    });

    test('generates oauth mode steps with oauth-config, ims-context, org, and cache', () => {
      const payload = {
        mode: 'oauth',
        clientId: 'client123',
        clientSecret: 'secret123',
        technicalAccountId: 'tech123',
        technicalAccountEmail: 'tech@example.com',
        imsOrgId: 'org123',
        scopes: ['openid', 'AdobeID']
      };
      const result = buildCloudManagerSetupPreview(payload);
      expect(result.mode).toBe('oauth');
      expect(result.configJson).toContain('client_id');
      expect(result.configJson).toContain('oauth_enabled');
      expect(result.steps.map(s => s.id)).toEqual(['oauth-config', 'ims-context', 'org', 'cache']);
    });

    test('oauth mode includes program step when programId provided', () => {
      const payload = {
        mode: 'oauth',
        clientId: 'client123',
        clientSecret: 'secret123',
        technicalAccountId: 'tech123',
        technicalAccountEmail: 'tech@example.com',
        imsOrgId: 'org123',
        scopes: ['openid'],
        programId: 'prog123'
      };
      const result = buildCloudManagerSetupPreview(payload);
      const stepIds = result.steps.map(s => s.id);
      expect(stepIds).toContain('program');
      expect(stepIds).toEqual(['oauth-config', 'ims-context', 'org', 'program', 'cache']);
    });

    test('throws error for browser mode without orgId', () => {
      const payload = { mode: 'browser' };
      expect(() => buildCloudManagerSetupPreview(payload)).toThrow('org ID is required');
    });

    test('throws error for oauth mode with missing fields', () => {
      const payload = {
        mode: 'oauth',
        clientId: 'client123'
      };
      expect(() => buildCloudManagerSetupPreview(payload)).toThrow();
    });
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

  describe('readCloudManagerMetadataCache', () => {
    test('returns empty cache structure with correct properties', () => {
      const { readCloudManagerMetadataCache } = require('../../src/services/cloudManagerService');
      const result = readCloudManagerMetadataCache();
      expect(result).toHaveProperty('programs');
      expect(result).toHaveProperty('environmentsByProgram');
      expect(result).toHaveProperty('environmentErrors');
      expect(result).toHaveProperty('refreshedAt');
      expect(Array.isArray(result.programs)).toBe(true);
      expect(typeof result.environmentsByProgram).toBe('object');
      expect(Array.isArray(result.environmentErrors)).toBe(true);
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

  describe('getCachedPrograms', () => {
    test('throws error when cache is empty', () => {
      const { getCachedPrograms } = require('../../src/services/cloudManagerService');
      expect(() => getCachedPrograms()).toThrow('cache is empty');
    });
  });

  describe('getCachedEnvironments', () => {
    test('throws error when cache is empty', () => {
      const { getCachedEnvironments } = require('../../src/services/cloudManagerService');
      expect(() => getCachedEnvironments('any')).toThrow('cache is empty');
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

  describe('refreshCloudManagerMetadataCache', () => {
    const { refreshCloudManagerMetadataCache } = require('../../src/services/cloudManagerService');

    test('fetches programs and environments', async () => {
      let callCount = 0;
      execFile.mockImplementation((cmd, args, opts, cb) => {
        callCount++;
        if (cmd === 'aio' && args[0] === 'cloudmanager:list-programs') {
          cb(null, '{"programs": [{"id": "123", "name": "Test"}]}', '');
        } else if (cmd === 'aio' && args[0] === 'cloudmanager:program:list-environments') {
          cb(null, '{"environments": []}', '');
        } else {
          cb(null, '', '');
        }
      });

      const result = await refreshCloudManagerMetadataCache();
      expect(result.programs).toHaveLength(1);
      expect(result.refreshedAt).toBeTruthy();
    });

    test('handles environment fetch errors gracefully', async () => {
      let callCount = 0;
      execFile.mockImplementation((cmd, args, opts, cb) => {
        callCount++;
        if (cmd === 'aio' && args[0] === 'cloudmanager:list-programs') {
          cb(null, '{"programs": [{"id": "123", "name": "Test"}]}', '');
        } else {
          cb(new Error('failed'), '', 'error');
        }
      });

      const result = await refreshCloudManagerMetadataCache();
      expect(result.environmentErrors).toHaveLength(1);
    });
  });

  describe('checkPrerequisites', () => {
    const { checkPrerequisites } = require('../../src/services/cloudManagerService');

    test('checks all prerequisites successfully', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        if (args[0] === '--version') {
          cb(null, 'aio 1.0.0', '');
        } else if (args[0] === 'cloudmanager:list-programs' && args[1] === '--help') {
          cb(null, 'help output', '');
        } else if (args[1] === 'get' && args[2] === 'cloudmanager_orgid') {
          cb(null, 'org123', '');
        } else if (args[1] === 'get' && args[2] === 'cloudmanager_programid') {
          cb(null, 'prog123', '');
        } else if (args[0] === 'where') {
          cb(null, '/path/to/config', '');
        } else if (args[0] === 'cloudmanager:list-programs') {
          cb(null, '{"programs": []}', '');
        } else {
          cb(null, '', '');
        }
      });

      const result = await checkPrerequisites();
      expect(result.checks.length).toBeGreaterThan(0);
    });

    test('returns failure when aio is not found', async () => {
      execFile.mockImplementation((cmd, args, opts, cb) => {
        cb(new Error('ENOENT'), '', '');
      });

      const result = await checkPrerequisites();
      expect(result.ok).toBe(false);
    });
  });

  describe('setupCloudManager', () => {
    const { setupCloudManager } = require('../../src/services/cloudManagerService');

    test('browser mode sets up via auth:login', async () => {
      let callCount = 0;
      execFile.mockImplementation((cmd, args, opts, cb) => {
        callCount++;
        if (args[0] === 'auth:login') {
          cb(null, 'logged in', '');
        } else if (args[1] === 'cloudmanager_orgid') {
          cb(null, 'set', '');
        } else if (args[1] === 'cloudmanager_programid') {
          cb(null, 'set', '');
        } else if (args[0] === '--version') {
          cb(null, 'aio 1.0', '');
        } else if (args[0] === 'cloudmanager:list-programs' && args[1] === '--help') {
          cb(null, 'help', '');
        } else if (args[1] === 'get' && args[2] === 'cloudmanager_orgid') {
          cb(null, 'org', '');
        } else if (args[1] === 'get' && args[2] === 'cloudmanager_programid') {
          cb(null, 'prog', '');
        } else if (args[0] === 'where') {
          cb(null, 'context', '');
        } else if (args[0] === 'cloudmanager:list-programs') {
          cb(null, '{"programs": []}', '');
        } else {
          cb(null, '', '');
        }
      });

      const result = await setupCloudManager({ mode: 'browser', orgId: 'org123', programId: 'prog123' });
      expect(result.steps).toBeDefined();
    });

    test('oauth mode writes config file', async () => {
      let callCount = 0;
      execFile.mockImplementation((cmd, args, opts, cb) => {
        callCount++;
        if (args[1] === 'ims.contexts.aio-cli-plugin-cloudmanager') {
          cb(null, 'set', '');
        } else if (args[1] === 'cloudmanager_orgid') {
          cb(null, 'set', '');
        } else if (args[1] === 'cloudmanager_programid') {
          cb(null, 'set', '');
        } else if (args[0] === '--version') {
          cb(null, 'aio 1.0', '');
        } else if (args[0] === 'cloudmanager:list-programs' && args[1] === '--help') {
          cb(null, 'help', '');
        } else if (args[1] === 'get' && args[2] === 'cloudmanager_orgid') {
          cb(null, 'org', '');
        } else if (args[1] === 'get' && args[2] === 'cloudmanager_programid') {
          cb(null, 'prog', '');
        } else if (args[0] === 'where') {
          cb(null, 'context', '');
        } else if (args[0] === 'cloudmanager:list-programs') {
          cb(null, '{"programs": []}', '');
        } else {
          cb(null, '', '');
        }
      });

      const result = await setupCloudManager({
        mode: 'oauth',
        clientId: 'client123',
        clientSecret: 'secret123',
        technicalAccountId: 'tech123',
        technicalAccountEmail: 'tech@example.com',
        imsOrgId: 'org123',
        scopes: ['openid']
      });
      expect(result.configPath).toBeTruthy();
    });
  });
});
