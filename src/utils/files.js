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
    throw new Error('Invalid file type. Only .log and .txt files are allowed.');
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

module.exports = {
  sanitizeErrorMessage,
  validateFilePath,
  shouldUseStream
};
