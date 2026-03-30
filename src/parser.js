/* === AEM Error Log Parsing === */
const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

/**
 * Matches AEM error log format: 29.03.2026 00:00:00.000 [thread-id] *LEVEL* [logger-class] message
 * Captures: timestamp, instance-id, level, thread, logger (Java class), message
 */
const LOG_PATTERN = /^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\.\d{3}) \[([^\]]+)\] \*(\w+)\* \[([^\]]+)\] ([a-zA-Z][a-zA-Z0-9_.]*) (.+)$/;

/* === Request Log Patterns === */
/**
 * Outbound request line: timestamp [thread-id] -> METHOD URL HTTP/version [pod]
 * Used by AEM request logs to track outgoing requests from dispatcher/publish
 */
const REQUEST_PATTERN = /^(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}) \[(\d+)\] -> (HEAD|GET|POST|PUT|DELETE|PATCH|OPTIONS) (\S+) (HTTP\/[\d.]+) \[([^\]]+)\]$/;
/**
 * Inbound response line: timestamp [thread-id] <- STATUS content-type response-time-ms [pod]
 * Used to capture response status and timing from AEM instances
 */
const RESPONSE_PATTERN = /^(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}) \[(\d+)\] <- (\d{3}) (.+?) (\d+)ms \[([^\]]+)\]$/;

/**
 * Parses AEM error log timestamp format: DD.MM.YYYY HH:MM:SS.mmm
 * Note: Java months are 1-indexed, JS Date expects 0-indexed months
 * @param {string} timestampStr - Timestamp in DD.MM.YYYY HH:MM:SS.mmm format
 * @returns {Date} Parsed JavaScript Date object
 */
function parseTimestamp(timestampStr) {
  const [datePart, timePart] = timestampStr.split(' ');
  const [dd, mm, yyyy] = datePart.split('.');
  const [hh, min, ss] = timePart.split(':');
  // Subtract 1 from month because Java uses 1-12, JS uses 0-11
  return new Date(yyyy, mm - 1, dd, hh, min, ss);
}

/**
 * Parses Apache/common log format timestamp with timezone: 29/Mar/2026:00:00:00 +0000
 * @param {string} ts - Timestamp in CLF format
 * @returns {Date|null} Parsed Date or null if invalid
 */
function parseRequestTimestamp(ts) {
  const match = ts.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/);
  if (!match) return null;
  const [, day, mon, year, hour, min, sec] = match;
  // Month name to number mapping required since CLF uses named months
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  return new Date(year, months[mon], parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
}

/**
 * Parses a single AEM error log line into structured entry
 * @param {string} line - Raw log line
 * @returns {Object|null} Parsed entry or null if line doesn't match pattern
 */
function parseLine(line) {
  const match = line.match(LOG_PATTERN);
  if (!match) return null;

  // Extract groups: 1=timestamp, 2=instance-id, 3=level, 4=thread, 5=logger (Java class), 6=message
  const [, timestamp, instanceId, level, thread, logger, message] = match;
  // Normalize field names for consistency across log types
  return { timestamp, thread: instanceId, level, threadName: thread, logger, message };
}

/**
 * Filters entries to focus on actionable issues - errors and warnings
 * @param {Object} entry - Log entry with level field
 * @returns {boolean} True if entry is ERROR or WARN
 */
function isErrorOrWarn(entry) {
  return entry && (entry.level === 'ERROR' || entry.level === 'WARN');
}

/**
 * Synchronously parses AEM error log file, extracting ERROR/WARN entries with stack traces
 * Uses in-memory approach - suitable for files under ~50MB
 * @param {string} filePath - Path to log file
 * @returns {Array} Array of error/warning entries with stack traces
 */
function parseLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const entries = [];
  let current = null;
  
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      // New log entry starts - flush previous entry with accumulated stack trace
      if (current) entries.push(current);
      current = { ...parsed, stackTrace: '' };
    } else if (current && line.trim()) {
      // Continuation line (stack trace or multi-line message) - append to current entry
      current.stackTrace += (current.stackTrace ? '\n' : '') + line;
    }
  }
  // Don't forget the last entry still in progress
  if (current) entries.push(current);
  
  // Focus analysis on actionable entries only
  return entries.filter(e => isErrorOrWarn(e));
}

/**
 * Parses entire log file including all log levels (INFO, DEBUG, etc.)
 * Used when complete log analysis is needed, not just errors
 * @param {string} filePath - Path to log file
 * @returns {Array} All log entries regardless of level
 */
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

/**
 * Creates async generator for streaming large log files efficiently
 * Uses generator to avoid loading entire file into memory
 * @param {string} filePath - Path to log file
 * @param {Object} options - Options: levels='all' to include INFO/DEBUG
 * @yields {Object} Log entries with stack traces
 */
async function* createLogStream(filePath, options = {}) {
  const stream = fs.createReadStream(filePath, {
    encoding: 'utf-8',
    highWaterMark: 64 * 1024  // 64KB chunks balance memory and throughput
  });
  
  const rl = readline.createInterface({ input: stream });
  const allLevels = options.levels === 'all';
  let current = null;
  
  for await (const line of rl) {
    const parsed = parseLine(line);
    if (parsed) {
      // Yield previous entry when new one starts (handles multi-line stack traces)
      if (current && (allLevels || isErrorOrWarn(current))) {
        yield current;
      }
      current = { ...parsed, stackTrace: '' };
    } else if (current && line.trim()) {
      // Accumulate continuation lines as stack trace
      current.stackTrace += (current.stackTrace ? '\n' : '') + line;
    }
  }
  // Yield final accumulated entry
  if (current && (allLevels || isErrorOrWarn(current))) {
    yield current;
  }
}

/**
 * Gets file size in bytes for progress calculations
 * @param {string} filePath - Path to file
 * @returns {number} File size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/* === Request Log Parsing === */
// Request logs track HTTP requests going through AEM dispatcher/publish
// Format: bidirectional with -> (outbound) and <- (inbound) markers

/**
 * Parses AEM request log lines (both outbound requests and inbound responses)
 * Distinguishes by direction marker: -> for requests, <- for responses
 * @param {string} line - Raw request log line
 * @returns {Object|null} Parsed request/response or null if not matched
 */
function parseRequestLine(line) {
  // Try request line (->) - outbound from AEM
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

  // Try response line (<-) - inbound to AEM (includes timing)
  match = line.match(RESPONSE_PATTERN);
  if (match) {
    return {
      type: 'response',
      timestamp: match[1],
      threadId: match[2],
      status: parseInt(match[3]),
      contentType: match[4],
      responseTime: parseInt(match[5]),  // Critical for performance analysis
      pod: match[6],
      direction: 'inbound'
    };
  }

  return null;
}

/**
 * Creates async generator for streaming AEM request logs
 * Handles both plain text and gzip-compressed logs (common in production)
 * @param {string} filePath - Path to request log file
 * @yields {Object} Parsed request/response entries
 */
async function* createRequestLogStream(filePath) {
  const isGz = filePath.endsWith('.gz');
  let stream;
  
  // Gzip detection allows processing archived logs without manual decompression
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

/* === CDN Log Parsing (JSON Lines) === */
// CDN logs are in JSON Lines format - each line is a complete JSON object
// Contains request-level details: timing, cache status, geographic data

/**
 * Parses CDN log entry from JSON Lines format
 * Maps CDN provider field names to normalized internal names
 * @param {string} line - Raw JSON line from CDN log
 * @returns {Object|null} Normalized CDN entry or null if invalid
 */
function parseCDNLine(line) {
  try {
    const obj = JSON.parse(line.trim());
    // Require timestamp and status - these are essential for analysis
    if (obj.timestamp && obj.status) {
      return {
        timestamp: obj.timestamp,
        ttfb: obj.ttfb,      // Time To First Byte - server processing time
        ttlb: obj.ttlb,      // Time To Last Byte - total response time
        clientIp: obj.cli_ip,
        clientCountry: obj.cli_country,
        clientRegion: obj.cli_region,
        requestId: obj.rid,  // Correlates with AEM request logs
        userAgent: obj.req_ua,
        aemEnvKind: obj.aem_envKind,
        aemTenant: obj.aem_tenant,
        host: obj.host,
        url: obj.url,
        method: obj.method,
        contentType: obj.res_ctype,
        cache: obj.cache,    // HIT/MISS/MODIFIED - cache efficiency indicator
        debug: obj.debug,
        resAge: obj.res_age, // Cache age in seconds
        status: obj.status,
        pop: obj.pop,        // Point of Presence - geographic location
        rules: obj.rules,   // CDN rules fired for this request
        alerts: obj.alerts,
        sample: obj.sample,
        ddos: obj.ddos
      };
    }
  } catch (e) {
    // Non-JSON lines are ignored - might be empty lines or malformed data
  }
  return null;
}

/**
 * Creates async generator for streaming CDN JSON logs
 * Supports gzip compression common with CDN log exports
 * @param {string} filePath - Path to CDN log file
 * @yields {Object} Parsed CDN entries
 */
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

/* === Log Type Detection === */
// Auto-detection allows user to point at any log file without specifying type
// Falls back to content inspection when filename is ambiguous

/**
 * Detects log file type from filename patterns or content inspection
 * Used to route parsing to correct handler without user specification
 * @param {string} filePath - Path to log file
 * @returns {Promise<string>} 'error', 'request', or 'cdn'
 */
function detectLogType(filePath) {
  const isGz = filePath.endsWith('.gz');
  const fileName = filePath.toLowerCase();
  
  // Priority 1: Check filename patterns - fastest detection method
  if (fileName.includes('aemerror') || fileName.includes('error') || fileName.includes('_error')) {
    return 'error';
  }
  if (fileName.includes('aemrequest') || fileName.includes('request') || fileName.includes('_request')) {
    return 'request';
  }
  // .gz files are often CDN logs but not exclusively
  if (fileName.includes('cdn') || isGz) {
    return 'cdn';
  }
  
  // Priority 2: Content-based detection for ambiguous filenames
  // Inspect first few lines to identify format
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
    let linesRead = 0;
    const maxLines = 5;
    
    const checkLine = (line) => {
      linesRead++;
      // JSON Lines format indicates CDN logs
      if (line.trim().startsWith('{')) {
        readStream.destroy();
        resolve('cdn');
      // Common Log Format with named month: 29/Mar/2026:00:00:00
      } else if (line.match(/^\d{2}\/\w{3}\/\d{4}:/)) {
        readStream.destroy();
        resolve('request');
      // AEM error format: 29.03.2026 00:00:00.000
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
      // Default to error log type if file is empty or unrecognized
      if (linesRead < maxLines) {
        resolve('error');
      }
    });
  });
}

/**
 * AEM Log Parser Module
 * Provides parsing for error logs, request logs, and CDN JSON logs
 * @module parser
 */
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