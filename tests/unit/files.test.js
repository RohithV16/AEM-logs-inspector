const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  sanitizeErrorMessage,
  validateFilePath,
  shouldUseStream,
  collectLogFilesFromDirectory,
  resolveAnalysisTargets,
  isAllowedLogFile
} = require('../../src/utils/files');

const { ALLOWED_LOG_EXTENSIONS } = require('../../src/utils/constants');

describe('utils/files - sanitizeErrorMessage', () => {
  test('removes HTML angle brackets', () => {
    const result = sanitizeErrorMessage('<script>alert("xss")</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  test('removes double quotes', () => {
    const result = sanitizeErrorMessage('Error: "file not found"');
    expect(result).not.toContain('"');
  });

  test('removes single quotes', () => {
    const result = sanitizeErrorMessage("Error: 'connection failed'");
    expect(result).not.toContain("'");
  });

  test('removes ampersands', () => {
    const result = sanitizeErrorMessage('Error & warning');
    expect(result).not.toContain('&');
  });

  test('truncates long messages to 500 characters', () => {
    const longMessage = 'a'.repeat(600);
    const result = sanitizeErrorMessage(longMessage);
    expect(result.length).toBe(500);
  });

  test('handles short messages unchanged', () => {
    const shortMessage = 'Short error message';
    expect(sanitizeErrorMessage(shortMessage)).toBe(shortMessage);
  });

  test('handles empty string', () => {
    expect(sanitizeErrorMessage('')).toBe('');
  });

  test('handles unicode characters', () => {
    const unicode = 'Error with émojis 🎉 and unicode ñ';
    const result = sanitizeErrorMessage(unicode);
    expect(result).toContain('émojis');
    expect(result).toContain('🎉');
  });
});

describe('utils/files - validateFilePath', () => {
  let tempDir;
  let tempFile;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-validate-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('accepts valid .log file', () => {
    tempFile = path.join(tempDir, 'test.log');
    fs.writeFileSync(tempFile, 'test content');
    const result = validateFilePath(tempFile);
    expect(result).toBe(path.resolve(tempFile));
  });

  test('accepts valid .txt file', () => {
    tempFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(tempFile, 'test content');
    const result = validateFilePath(tempFile);
    expect(result).toBe(path.resolve(tempFile));
  });

  test('accepts valid .gz file', () => {
    tempFile = path.join(tempDir, 'test.log.gz');
    fs.writeFileSync(tempFile, 'test content');
    const result = validateFilePath(tempFile);
    expect(result).toBe(path.resolve(tempFile));
  });

  test('rejects invalid file extension', () => {
    tempFile = path.join(tempDir, 'test.pdf');
    fs.writeFileSync(tempFile, 'test content');
    expect(() => validateFilePath(tempFile)).toThrow('Invalid file type');
  });

  test('rejects non-existent file', () => {
    const nonExistent = path.join(tempDir, 'does_not_exist.log');
    expect(() => validateFilePath(nonExistent)).toThrow('File not found');
  });

  test('rejects directory path (extension check first)', () => {
    expect(() => validateFilePath(tempDir)).toThrow('Invalid file type');
  });

  test('rejects file exceeding MAX_FILE_SIZE', () => {
    tempFile = path.join(tempDir, 'huge.log');
    fs.writeFileSync(tempFile, 'small content');
    const originalStatSync = fs.statSync;
    jest.spyOn(fs, 'statSync').mockImplementation((filePath) => {
      if (filePath.includes('huge.log')) {
        return { isFile: () => true, size: 6 * 1024 * 1024 * 1024 };
      }
      return originalStatSync(filePath);
    });
    expect(() => validateFilePath(tempFile)).toThrow('File too large');
    fs.statSync.mockRestore();
  });

  test('handles case-insensitive extension matching', () => {
    tempFile = path.join(tempDir, 'test.LOG');
    fs.writeFileSync(tempFile, 'test content');
    const result = validateFilePath(tempFile);
    expect(result).toBe(path.resolve(tempFile));
  });
});

describe('utils/files - shouldUseStream', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-stream-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('returns false for small files', () => {
    const smallFile = path.join(tempDir, 'small.log');
    fs.writeFileSync(smallFile, 'small content');
    expect(shouldUseStream(smallFile)).toBe(false);
  });

  test('returns true for large files', () => {
    const { STREAM_THRESHOLD } = require('../../src/utils/constants');
    const largeFile = path.join(tempDir, 'large.log');
    fs.writeFileSync(largeFile, 'a'.repeat(STREAM_THRESHOLD + 1));
    expect(shouldUseStream(largeFile)).toBe(true);
  });
});

describe('utils/files - isAllowedLogFile', () => {
  test('returns true for .log files', () => {
    expect(isAllowedLogFile('/path/to/file.log')).toBe(true);
  });

  test('returns true for .txt files', () => {
    expect(isAllowedLogFile('/path/to/file.txt')).toBe(true);
  });

  test('returns true for .gz files', () => {
    expect(isAllowedLogFile('/path/to/file.log.gz')).toBe(true);
  });

  test('returns false for .pdf files', () => {
    expect(isAllowedLogFile('/path/to/file.pdf')).toBe(false);
  });

  test('returns false for .csv files', () => {
    expect(isAllowedLogFile('/path/to/file.csv')).toBe(false);
  });

  test('returns false for .json files', () => {
    expect(isAllowedLogFile('/path/to/file.json')).toBe(false);
  });

  test('handles case-insensitive extension matching', () => {
    expect(isAllowedLogFile('/path/to/file.LOG')).toBe(true);
    expect(isAllowedLogFile('/path/to/file.TXT')).toBe(true);
  });
});

describe('utils/files - collectLogFilesFromDirectory', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-collect-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('collects log files from directory', () => {
    fs.writeFileSync(path.join(tempDir, 'error1.log'), 'error 1');
    fs.writeFileSync(path.join(tempDir, 'error2.log'), 'error 2');
    fs.writeFileSync(path.join(tempDir, 'readme.txt'), 'readme');

    const results = collectLogFilesFromDirectory(tempDir);
    expect(results.length).toBe(3);
  });

  test('recursively collects from subdirectories', () => {
    const subDir = path.join(tempDir, 'subdir');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(tempDir, 'root.log'), 'root');
    fs.writeFileSync(path.join(subDir, 'nested.log'), 'nested');

    const results = collectLogFilesFromDirectory(tempDir);
    expect(results.length).toBe(2);
  });

  test('throws for non-existent directory', () => {
    expect(() => collectLogFilesFromDirectory('/nonexistent/path')).toThrow('Directory not found');
  });

  test('throws when path is a file', () => {
    const filePath = path.join(tempDir, 'file.log');
    fs.writeFileSync(filePath, 'content');
    expect(() => collectLogFilesFromDirectory(filePath)).toThrow('Path is not a directory');
  });

  test('skips files exceeding MAX_FILE_SIZE', () => {
    const hugeFile = path.join(tempDir, 'huge.log');
    fs.writeFileSync(hugeFile, 'small content');
    fs.writeFileSync(path.join(tempDir, 'small.log'), 'small');
    const originalStatSync = fs.statSync;
    jest.spyOn(fs, 'statSync').mockImplementation((filePath) => {
      if (filePath.includes('huge.log')) {
        return { isFile: () => true, size: 6 * 1024 * 1024 * 1024 };
      }
      return originalStatSync(filePath);
    });
    expect(() => collectLogFilesFromDirectory(tempDir)).toThrow('File too large');
    fs.statSync.mockRestore();
  });

  test('skips non-log files', () => {
    fs.writeFileSync(path.join(tempDir, 'data.pdf'), 'pdf');
    fs.writeFileSync(path.join(tempDir, 'data.csv'), 'csv');
    fs.writeFileSync(path.join(tempDir, 'data.log'), 'log');

    const results = collectLogFilesFromDirectory(tempDir);
    expect(results.length).toBe(1);
    expect(results[0]).toContain('data.log');
  });
});

describe('utils/files - resolveAnalysisTargets', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-resolve-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('resolves single file path string', () => {
    const file = path.join(tempDir, 'test.log');
    fs.writeFileSync(file, 'content');
    const results = resolveAnalysisTargets(file);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(path.resolve(file));
  });

  test('resolves comma-separated file paths', () => {
    const file1 = path.join(tempDir, 'test1.log');
    const file2 = path.join(tempDir, 'test2.log');
    fs.writeFileSync(file1, 'content1');
    fs.writeFileSync(file2, 'content2');
    const results = resolveAnalysisTargets(`${file1},${file2}`);
    expect(results).toHaveLength(2);
  });

  test('resolves array of file paths', () => {
    const file1 = path.join(tempDir, 'test1.log');
    const file2 = path.join(tempDir, 'test2.log');
    fs.writeFileSync(file1, 'content1');
    fs.writeFileSync(file2, 'content2');
    const results = resolveAnalysisTargets([file1, file2]);
    expect(results).toHaveLength(2);
  });

  test('resolves object with filePath property', () => {
    const file = path.join(tempDir, 'test.log');
    fs.writeFileSync(file, 'content');
    const results = resolveAnalysisTargets({ filePath: file });
    expect(results).toHaveLength(1);
  });

  test('resolves object with filePaths array', () => {
    const file1 = path.join(tempDir, 'test1.log');
    const file2 = path.join(tempDir, 'test2.log');
    fs.writeFileSync(file1, 'content1');
    fs.writeFileSync(file2, 'content2');
    const results = resolveAnalysisTargets({ filePaths: [file1, file2] });
    expect(results).toHaveLength(2);
  });

  test('resolves directory and collects log files', () => {
    fs.writeFileSync(path.join(tempDir, 'test.log'), 'content');
    const results = resolveAnalysisTargets({ directory: tempDir });
    expect(results.length).toBeGreaterThan(0);
  });

  test('deduplicates file paths', () => {
    const file = path.join(tempDir, 'test.log');
    fs.writeFileSync(file, 'content');
    const results = resolveAnalysisTargets([file, file]);
    expect(results).toHaveLength(1);
  });

  test('throws for non-existent file', () => {
    expect(() => resolveAnalysisTargets('/nonexistent/path.log')).toThrow('File or directory not found');
  });

  test('throws when no valid log files found', () => {
    fs.writeFileSync(path.join(tempDir, 'test.pdf'), 'pdf content');
    expect(() => resolveAnalysisTargets({ directory: tempDir })).toThrow('No valid log files found');
  });

  test('skips empty strings in input', () => {
    const file = path.join(tempDir, 'test.log');
    fs.writeFileSync(file, 'content');
    const results = resolveAnalysisTargets(['', file, '']);
    expect(results).toHaveLength(1);
  });

  test('handles whitespace-only strings', () => {
    const file = path.join(tempDir, 'test.log');
    fs.writeFileSync(file, 'content');
    const results = resolveAnalysisTargets(['   ', file]);
    expect(results).toHaveLength(1);
  });
});
