const fs = require('fs');
const { detectLogTypeFromLine, parseLine, parseRequestLine, parseCDNLine } = require('./parser');

function normalizeTailEntry(line) {
  const rawLine = String(line || '').trim();
  if (!rawLine) return null;

  const logType = detectLogTypeFromLine(rawLine) || 'unknown';
  let parsed = null;

  if (logType === 'error') {
    parsed = parseLine(rawLine);
  } else if (logType === 'request') {
    parsed = parseRequestLine(rawLine);
  } else if (logType === 'cdn') {
    parsed = parseCDNLine(rawLine);
  }

  if (parsed) {
    return {
      ...parsed,
      parsed: true,
      logType,
      rawLine
    };
  }

  return {
    parsed: false,
    logType,
    rawLine,
    message: rawLine
  };
}

/* === File Watching === */

/**
 * Watches a log file for new entries and invokes callback for appended lines.
 * Uses file size tracking to read only new content and handles truncation.
 * @param {string} filePath - Path to the log file to watch
 * @param {Function} onEntry - Callback function for parsed or raw tail entries
 * @returns {Object} Watcher controller with close() method
 */
function watchLogFile(filePath, onEntry) {
  let fileSize;
  try {
    fileSize = fs.statSync(filePath).size;
  } catch (e) {
    return { close: () => {}, error: e.message };
  }

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType !== 'change') return;

    try {
      const newSize = fs.statSync(filePath).size;
      if (newSize < fileSize) {
        fileSize = newSize;
        return;
      }
      if (newSize === fileSize) {
        return;
      }

      const stream = fs.createReadStream(filePath, {
        start: fileSize,
        encoding: 'utf-8'
      });
      let buffer = '';

      stream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          const entry = normalizeTailEntry(line);
          if (entry) onEntry(entry);
        }
      });

      stream.on('end', () => {
        const entry = normalizeTailEntry(buffer);
        if (entry) onEntry(entry);
        fileSize = newSize;
      });
    } catch (e) {
      // File may have been rotated or removed between events.
    }
  });

  return { close: () => watcher.close() };
}

module.exports = { watchLogFile, normalizeTailEntry };
