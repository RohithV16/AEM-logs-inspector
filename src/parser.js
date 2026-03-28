const fs = require('fs');
const readline = require('readline');

const LOG_PATTERN = /^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\.\d{3}) \[([^\]]+)\] \*(\w+)\* \[([^\]]+)\] ([a-zA-Z][a-zA-Z0-9_.]*) (.+)$/;

function parseTimestamp(timestampStr) {
  const [datePart, timePart] = timestampStr.split(' ');
  const [dd, mm, yyyy] = datePart.split('.');
  const [hh, min, ss] = timePart.split(':');
  return new Date(yyyy, mm - 1, dd, hh, min, ss);
}

function parseLine(line) {
  const match = line.match(LOG_PATTERN);
  if (!match) return null;

  // Groups: 1=timestamp, 2=instance-id, 3=level, 4=thread, 5=logger (Java class), 6=message
  const [, timestamp, instanceId, level, thread, logger, message] = match;
  return { timestamp, thread: instanceId, level, threadName: thread, logger, message };
}

function isErrorOrWarn(entry) {
  return entry && (entry.level === 'ERROR' || entry.level === 'WARN');
}

function parseLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const entries = [];
  let current = null;
  
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      if (current) entries.push(current);
      current = { ...parsed, stackTrace: '' };
    } else if (current && line.trim()) {
      current.stackTrace += (current.stackTrace ? '\n' : '') + line;
    }
  }
  if (current) entries.push(current);
  
  return entries.filter(e => isErrorOrWarn(e));
}

function parseAllLevels(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const entries = [];
  let current = null;
  
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      if (current) entries.push(current);
      current = { ...parsed, stackTrace: '' };
    } else if (current && line.trim()) {
      current.stackTrace += (current.stackTrace ? '\n' : '') + line;
    }
  }
  if (current) entries.push(current);
  
  return entries;
}

async function* createLogStream(filePath, options = {}) {
  const stream = fs.createReadStream(filePath, {
    encoding: 'utf-8',
    highWaterMark: 64 * 1024
  });
  
  const rl = readline.createInterface({ input: stream });
  const allLevels = options.levels === 'all';
  let current = null;
  
  for await (const line of rl) {
    const parsed = parseLine(line);
    if (parsed) {
      if (current && (allLevels || isErrorOrWarn(current))) {
        yield current;
      }
      current = { ...parsed, stackTrace: '' };
    } else if (current && line.trim()) {
      current.stackTrace += (current.stackTrace ? '\n' : '') + line;
    }
  }
  if (current && (allLevels || isErrorOrWarn(current))) {
    yield current;
  }
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

module.exports = { parseLine, parseLogFile, parseAllLevels, parseTimestamp, createLogStream, getFileSize, isErrorOrWarn };