const fs = require('fs');
const { parseLine, isErrorOrWarn } = require('./parser');

function watchLogFile(filePath, onEntry) {
  let fileSize;
  try {
    fileSize = fs.statSync(filePath).size;
  } catch (e) {
    return { close: () => {}, error: e.message };
  }

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      try {
        const newSize = fs.statSync(filePath).size;
        if (newSize > fileSize) {
          const stream = fs.createReadStream(filePath, {
            start: fileSize, encoding: 'utf-8'
          });
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
              const parsed = parseLine(line);
              if (isErrorOrWarn(parsed)) onEntry(parsed);
            }
          });
          stream.on('end', () => { fileSize = newSize; });
        }
      } catch (e) {
        // File may have been rotated or deleted
      }
    }
  });

  return { close: () => watcher.close() };
}

module.exports = { watchLogFile };
