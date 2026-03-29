const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

const LOG_PATTERN = /^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\.\d{3}) \[([^\]]+)\] \*(\w+)\* \[([^\]]+)\] ([a-zA-Z][a-zA-Z0-9_.]*) (.+)$/;

// Request log patterns
const REQUEST_PATTERN = /^(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}) \[(\d+)\] -> (HEAD|GET|POST|PUT|DELETE|PATCH|OPTIONS) (\S+) (HTTP\/[\d.]+) \[([^\]]+)\]$/;
const RESPONSE_PATTERN = /^(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}) \[(\d+)\] <- (\d{3}) (.+?) (\d+)ms \[([^\]]+)\]$/;

function parseTimestamp(timestampStr) {
  const [datePart, timePart] = timestampStr.split(' ');
  const [dd, mm, yyyy] = datePart.split('.');
  const [hh, min, ss] = timePart.split(':');
  return new Date(yyyy, mm - 1, dd, hh, min, ss);
}

function parseRequestTimestamp(ts) {
  // Format: 29/Mar/2026:00:00:00 +0000
  const match = ts.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/);
  if (!match) return null;
  const [, day, mon, year, hour, min, sec] = match;
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  return new Date(year, months[mon], parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
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

/* ============================================================
   Request Log Parsing
   ============================================================ */

function parseRequestLine(line) {
  // Try request line (->)
  let match = line.match(REQUEST_PATTERN);
  if (match) {
    return {
      type: 'request',
      timestamp: match[1],
      threadId: match[2],
      method: match[3],
      url: match[4],
      httpVersion: match[5],
      pod: match[6],
      direction: 'outbound'
    };
  }

  // Try response line (<-)
  match = line.match(RESPONSE_PATTERN);
  if (match) {
    return {
      type: 'response',
      timestamp: match[1],
      threadId: match[2],
      status: parseInt(match[3]),
      contentType: match[4],
      responseTime: parseInt(match[5]),
      pod: match[6],
      direction: 'inbound'
    };
  }

  return null;
}

async function* createRequestLogStream(filePath) {
  const isGz = filePath.endsWith('.gz');
  let stream;
  
  if (isGz) {
    const gzip = zlib.createGunzip();
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(gzip);
    stream = gzip;
  } else {
    stream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
  }
  
  const rl = readline.createInterface({ input: stream });
  
  for await (const line of rl) {
    const parsed = parseRequestLine(line);
    if (parsed) {
      yield parsed;
    }
  }
}

/* ============================================================
   CDN Log Parsing (JSON Lines)
   ============================================================ */

function parseCDNLine(line) {
  try {
    const obj = JSON.parse(line.trim());
    if (obj.timestamp && obj.status) {
      return {
        timestamp: obj.timestamp,
        ttfb: obj.ttfb,
        ttlb: obj.ttlb,
        clientIp: obj.cli_ip,
        clientCountry: obj.cli_country,
        clientRegion: obj.cli_region,
        requestId: obj.rid,
        userAgent: obj.req_ua,
        aemEnvKind: obj.aem_envKind,
        aemTenant: obj.aem_tenant,
        host: obj.host,
        url: obj.url,
        method: obj.method,
        contentType: obj.res_ctype,
        cache: obj.cache,
        debug: obj.debug,
        resAge: obj.res_age,
        status: obj.status,
        pop: obj.pop,
        rules: obj.rules,
        alerts: obj.alerts,
        sample: obj.sample,
        ddos: obj.ddos
      };
    }
  } catch (e) {
    // Not JSON
  }
  return null;
}

async function* createCDNLogStream(filePath) {
  const isGz = filePath.endsWith('.gz');
  let stream;
  
  if (isGz) {
    const gzip = zlib.createGunzip();
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(gzip);
    stream = gzip;
  } else {
    stream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
  }
  
  const rl = readline.createInterface({ input: stream });
  
  for await (const line of rl) {
    const parsed = parseCDNLine(line);
    if (parsed) {
      yield parsed;
    }
  }
}

/* ============================================================
   Log Type Detection
   ============================================================ */

function detectLogType(filePath) {
  const isGz = filePath.endsWith('.gz');
  const fileName = filePath.toLowerCase();
  
  // Try by filename first
  if (fileName.includes('aemerror') || fileName.includes('error') || fileName.includes('_error')) {
    return 'error';
  }
  if (fileName.includes('aemrequest') || fileName.includes('request') || fileName.includes('_request')) {
    return 'request';
  }
  if (fileName.includes('cdn') || isGz) {
    return 'cdn';
  }
  
  // Detect by content - read first few lines
  const stream = isGz 
    ? zlib.createGunzip() 
    : null;
  
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
    let linesRead = 0;
    const maxLines = 5;
    
    const checkLine = (line) => {
      linesRead++;
      if (line.trim().startsWith('{')) {
        readStream.destroy();
        resolve('cdn');
      } else if (line.match(/^\d{2}\/\w{3}\/\d{4}:/)) {
        readStream.destroy();
        resolve('request');
      } else if (line.match(/^\d{2}\.\d{2}\.\d{4}/)) {
        readStream.destroy();
        resolve('error');
      }
    };
    
    readStream.on('data', (chunk) => {
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          checkLine(line);
          if (linesRead >= maxLines) break;
        }
      }
    });
    
    readStream.on('end', () => {
      if (linesRead < maxLines) {
        resolve('error'); // Default to error
      }
    });
  });
}

module.exports = { 
  parseLine, 
  parseLogFile, 
  parseAllLevels, 
  parseTimestamp, 
  createLogStream, 
  getFileSize, 
  isErrorOrWarn,
  parseRequestLine,
  createRequestLogStream,
  parseCDNLine,
  createCDNLogStream,
  detectLogType
};