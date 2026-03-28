const fs = require('fs');

const LOG_PATTERN = /^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\.\d{3}) \[([^\]]+)\] \*(\w+)\* \[([^\]]+)\] (.+)$/;

function parseTimestamp(timestampStr) {
  const [datePart, timePart] = timestampStr.split(' ');
  const [dd, mm, yyyy] = datePart.split('.');
  const [hh, min, ss] = timePart.split(':');
  return new Date(yyyy, mm - 1, dd, hh, min, ss);
}

function parseLine(line) {
  const match = line.match(LOG_PATTERN);
  if (!match) return null;

  const [, timestamp, thread, level, logger, message] = match;
  return { timestamp, thread, level, logger, message };
}

function parseLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const entries = [];
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed && (parsed.level === 'ERROR' || parsed.level === 'WARN')) {
      entries.push(parsed);
    }
  }
  
  return entries;
}

module.exports = { parseLine, parseLogFile, parseTimestamp };
