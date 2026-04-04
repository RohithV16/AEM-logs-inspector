const fs = require('fs');
const { parseLine, isErrorOrWarn } = require('./parser');

/* === File Watching === */

/**
 * Watches a log file for new entries and invokes callback for errors/warnings.
 * Uses file size tracking to read only new content (handles log rotation).
 * @param {string} filePath - Path to the log file to watch
 * @param {Function} onEntry - Callback function for parsed log entries
 * @returns {Object} Watcher controller with close() method
 */
function watchLogFile(filePath, onEntry) {
  let fileSize;
  try {
    fileSize = fs.statSync(filePath).size;
  } catch (e) {
    // Return no-op controller if file doesn't exist yet
    return { close: () => {}, error: e.message };
  }

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      try {
        const newSize = fs.statSync(filePath).size;
        // Only read if file grew (new content appended)
        if (newSize > fileSize) {
          const stream = fs.createReadStream(filePath, {
            start: fileSize, encoding: 'utf-8'
          });
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            // Keep incomplete line in buffer for next chunk
            buffer = lines.pop();
            for (const line of lines) {
              const parsed = parseLine(line);
              if (isErrorOrWarn(parsed)) onEntry(parsed);
            }
          });
          stream.on('end', () => { fileSize = newSize; });
        }
      } catch (e) {
        // File may have been rotated or deleted between watch events
        // Silently ignore - next event will handle recovery
      }
    }
  });

  return { close: () => watcher.close() };
}

module.exports = { watchLogFile };
