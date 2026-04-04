/* === File Size Limits === */

// Allowed file extensions for log analysis
// .gz included for compressed AEM log archives
const ALLOWED_LOG_EXTENSIONS = ['.log', '.txt', '.gz'];

// Maximum file size for path-mode analysis (5GB)
// Large files should use streaming to prevent memory exhaustion
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

// Threshold for switching to streaming mode (50MB)
// Files larger than this are processed line-by-line
const STREAM_THRESHOLD = 50 * 1024 * 1024;

/* === Regex Security === */

// Maximum length for user-provided regex patterns
// Prevents overly complex patterns that could cause performance issues
const MAX_REGEX_LENGTH = 100;

// Timeout for regex execution in milliseconds
// Protects against catastrophic backtracking attacks
const REGEX_TIMEOUT_MS = 100;

/* === Server Configuration === */

// Default port for the web dashboard
const PORT = 3000;

module.exports = {
  ALLOWED_LOG_EXTENSIONS,
  MAX_FILE_SIZE,
  STREAM_THRESHOLD,
  MAX_REGEX_LENGTH,
  REGEX_TIMEOUT_MS,
  PORT
};
