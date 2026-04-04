const path = require('path');
const fs = require('fs');
const { ALLOWED_LOG_EXTENSIONS, MAX_FILE_SIZE, STREAM_THRESHOLD } = require('./constants');

/* === Input Sanitization === */

/**
 * Sanitizes error messages for safe display in API responses.
 * Removes HTML/script injection characters and limits length.
 * @param {string} message - Raw error message
 * @returns {string} Sanitized message safe for JSON response
 */
function sanitizeErrorMessage(message) {
  return message
    // Remove HTML special characters to prevent XSS when rendered
    .replace(/[<>"'&]/g, '')
    .substring(0, 500);
}

/* === File Validation === */

/**
 * Validates a file path for log analysis.
 * Checks extension, existence, type, and size limits.
 * @param {string} filePath - Path to validate
 * @returns {string} Resolved absolute path if valid
 * @throws {Error} If file fails any validation check
 */
function validateFilePath(filePath) {
  const resolved = path.resolve(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Only allow specific log file extensions to prevent arbitrary file access
  if (!ALLOWED_LOG_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file type. Only .log, .txt, and .gz files are allowed.');
  }

  if (!fs.existsSync(resolved)) {
    throw new Error('File not found.');
  }

  const stats = fs.statSync(resolved);
  if (!stats.isFile()) {
    throw new Error('Path is not a file.');
  }

  // Enforce size limit to prevent memory exhaustion on large files
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5GB.');
  }

  return resolved;
}

/* === Stream Processing Decision === */

/**
 * Determines whether a file should be processed with streaming.
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file should use streaming mode
 */
function shouldUseStream(filePath) {
  const stats = fs.statSync(filePath);
  // Use streaming for large files to avoid loading entire file into memory
  return stats.size > STREAM_THRESHOLD;
}

/* === Batch Analysis Helpers === */

function isAllowedLogFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_LOG_EXTENSIONS.includes(ext);
}

function collectLogFilesFromDirectory(directoryPath) {
  const resolved = path.resolve(directoryPath);

  if (!fs.existsSync(resolved)) {
    throw new Error('Directory not found.');
  }

  const stats = fs.statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory.');
  }

  const results = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!isAllowedLogFile(fullPath)) continue;
      const fileStats = fs.statSync(fullPath);
      if (fileStats.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 5GB: ${fullPath}`);
      }
      results.push(fullPath);
    }
  }

  walk(resolved);
  return results;
}

function resolveAnalysisTargets(input) {
  const queue = [];

  if (Array.isArray(input)) {
    queue.push(...input);
  } else if (typeof input === 'string') {
    queue.push(...input.split(','));
  } else if (input && typeof input === 'object') {
    if (input.filePath) queue.push(input.filePath);
    if (Array.isArray(input.filePaths)) queue.push(...input.filePaths);
    if (input.directory) queue.push(input.directory);
    if (Array.isArray(input.directories)) queue.push(...input.directories);
  }

  const files = [];
  const seen = new Set();

  for (const item of queue) {
    const trimmed = String(item || '').trim();
    if (!trimmed) continue;

    const resolved = path.resolve(trimmed);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File or directory not found: ${trimmed}`);
    }

    const stats = fs.statSync(resolved);
    if (stats.isDirectory()) {
      const dirFiles = collectLogFilesFromDirectory(resolved);
      for (const file of dirFiles) {
        if (!seen.has(file)) {
          seen.add(file);
          files.push(file);
        }
      }
      continue;
    }

    if (!stats.isFile()) {
      throw new Error(`Path is not a file or directory: ${trimmed}`);
    }

    if (!isAllowedLogFile(resolved)) {
      throw new Error('Invalid file type. Only .log, .txt, and .gz files are allowed.');
    }

    if (stats.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size is 5GB.');
    }

    if (!seen.has(resolved)) {
      seen.add(resolved);
      files.push(resolved);
    }
  }

  if (!files.length) {
    throw new Error('No valid log files found.');
  }

  return files;
}

module.exports = {
  sanitizeErrorMessage,
  validateFilePath,
  shouldUseStream,
  collectLogFilesFromDirectory,
  resolveAnalysisTargets,
  isAllowedLogFile
};
