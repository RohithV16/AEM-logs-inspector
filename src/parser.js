/* === AEM Error Log Parsing === */
const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

/**
 * Matches AEM error log format: 29.03.2026 00:00:00.000 [thread-id] *LEVEL* [logger-class] message
 * Captures: timestamp, instance-id, level, thread, logger (Java class), message
 * Note: Java class name can contain angle brackets like JobQueueImpl.<main queue>
 */
const LOG_PATTERN = /^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\.\d{3}) \[([^\]]+)\] \*(\w+)\* \[(.+)\] ([a-zA-Z][a-zA-Z0-9_.<>]*) (.+)$/;

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
const APACHE_ACCESS_PATTERN = /^(\S+) \S+ \S+ \[([^\]]+)\] "(HEAD|GET|POST|PUT|DELETE|PATCH|OPTIONS) (\S+)(?: HTTP\/([\d.]+))?" (\d{3}) (\S+)(?: "([^"]*)" "([^"]*)")?(?: (\d+))?$/;
const ERROR_LOG_REQUEST_CONTEXT_PATTERN = /(?:^|]\s)(HEAD|GET|POST|PUT|DELETE|PATCH|OPTIONS)\s+(\S+)\s+HTTP\/[\d.]+$/;
const STREAM_HIGH_WATER_MARK = 512 * 1024;
const MAX_SIGNATURE_SAMPLE_LINES = 3;

function isLikelyLoggerToken(token) {
  const value = String(token || '').trim();
  if (!value) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9_.<>$]*$/.test(value)) return false;
  return value.includes('.') || value.includes('$') || value.includes('<') || value.includes('>') || /[A-Z]/.test(value);
}

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
  const [, timestamp, instanceId, level, thread, loggerCandidate, message] = match;
  const hasLogger = isLikelyLoggerToken(loggerCandidate);
  const logger = hasLogger ? loggerCandidate : '';
  const normalizedMessage = hasLogger ? message : `${loggerCandidate} ${message}`.trim();
  const requestMeta = parseErrorRequestContext(thread);
  // Normalize field names for consistency across log types
  return {
    timestamp,
    thread: instanceId,
    level,
    threadName: thread,
    logger,
    message: normalizedMessage,
    requestContext: thread,
    httpMethod: requestMeta.httpMethod,
    requestPath: requestMeta.requestPath
  };
}

function parseErrorRequestContext(context) {
  if (!context) {
    return { httpMethod: '', requestPath: '' };
  }

  const match = String(context).match(ERROR_LOG_REQUEST_CONTEXT_PATTERN);
  if (!match) {
    return { httpMethod: '', requestPath: '' };
  }

  return {
    httpMethod: match[1].toUpperCase(),
    requestPath: match[2]
  };
}

function getLogTypeFromFileName(filePath) {
  const fileName = String(filePath || '').toLowerCase();

  if (fileName.includes('aemerror') || fileName.includes('error') || fileName.includes('_error')) {
    return 'error';
  }
  if (
    fileName.includes('aemrequest') ||
    fileName.includes('request') ||
    fileName.includes('_request') ||
    fileName.includes('aemaccess') ||
    fileName.includes('access') ||
    fileName.includes('dispatcher')
  ) {
    return 'request';
  }
  if (fileName.includes('cdn')) {
    return 'cdn';
  }

  return null;
}

function detectLogTypeFromLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) return 'cdn';
  if (/^\d{2}\/\w{3}\/\d{4}:/.test(trimmed)) return 'request';
  if (APACHE_ACCESS_PATTERN.test(trimmed)) return 'request';
  if (/^\d{2}\.\d{2}\.\d{4}/.test(trimmed)) return 'error';
  return null;
}

function detectLogFamilyFromLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) return 'cdn-json';
  if (REQUEST_PATTERN.test(trimmed) || RESPONSE_PATTERN.test(trimmed)) return 'aem-request';
  if (APACHE_ACCESS_PATTERN.test(trimmed)) return 'apache-access';
  if (LOG_PATTERN.test(trimmed) || /^\d{2}\.\d{2}\.\d{4}/.test(trimmed)) return 'aem-error';
  return null;
}

function buildUnsupportedSignature(filePath, sampleLines = [], detectedBy = 'content') {
  return {
    logType: 'unknown',
    logFamily: 'unknown',
    supported: false,
    unsupportedReason: 'Unknown log format. The file does not match any supported parser yet.',
    detectedBy,
    sampleLines: sampleLines.slice(0, MAX_SIGNATURE_SAMPLE_LINES),
    fileName: String(filePath || '').split('/').pop() || String(filePath || '')
  };
}

function buildSignatureFromLogType(logType, detectedBy = 'filename', sampleLines = []) {
  if (logType === 'error') {
    return { logType, logFamily: 'aem-error', supported: true, unsupportedReason: '', detectedBy, sampleLines };
  }
  if (logType === 'request') {
    const logFamily = sampleLines.some((line) => APACHE_ACCESS_PATTERN.test(String(line || '').trim()))
      ? 'apache-access'
      : 'aem-request';
    return { logType, logFamily, supported: true, unsupportedReason: '', detectedBy, sampleLines };
  }
  if (logType === 'cdn') {
    return { logType, logFamily: 'cdn-json', supported: true, unsupportedReason: '', detectedBy, sampleLines };
  }

  return buildUnsupportedSignature('', sampleLines, detectedBy);
}

function detectLogSignature(filePath) {
  const filenameType = getLogTypeFromFileName(filePath);
  if (filenameType) {
    return Promise.resolve(buildSignatureFromLogType(filenameType, 'filename', []));
  }

  return new Promise((resolve) => {
    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: STREAM_HIGH_WATER_MARK });
    let linesRead = 0;
    const sampleLines = [];
    let resolved = false;

    const finish = (signature) => {
      if (resolved) return;
      resolved = true;
      readStream.destroy();
      resolve(signature);
    };

    readStream.on('data', (chunk) => {
      const lines = chunk.split('\n');
      for (const line of lines) {
        const trimmed = String(line || '').trim();
        if (!trimmed) continue;
        if (sampleLines.length < MAX_SIGNATURE_SAMPLE_LINES) {
          sampleLines.push(trimmed.slice(0, 240));
        }
        linesRead++;
        const family = detectLogFamilyFromLine(trimmed);
        if (family === 'aem-error') return finish({ logType: 'error', logFamily: family, supported: true, unsupportedReason: '', detectedBy: 'content', sampleLines });
        if (family === 'aem-request' || family === 'apache-access') {
          return finish({ logType: 'request', logFamily: family, supported: true, unsupportedReason: '', detectedBy: 'content', sampleLines });
        }
        if (family === 'cdn-json') return finish({ logType: 'cdn', logFamily: family, supported: true, unsupportedReason: '', detectedBy: 'content', sampleLines });
        if (linesRead >= 5) break;
      }
      if (linesRead >= 5) {
        finish(buildUnsupportedSignature(filePath, sampleLines, 'content'));
      }
    });

    readStream.on('end', () => finish(buildUnsupportedSignature(filePath, sampleLines, linesRead ? 'content' : 'empty-file')));
    readStream.on('error', () => finish(buildUnsupportedSignature(filePath, [], 'content')));
  });
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
  const isGz = filePath.endsWith('.gz');
  let stream;

  if (isGz) {
    const gzip = zlib.createGunzip();
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(gzip);
    stream = gzip;
  } else {
    stream = fs.createReadStream(filePath, {
      encoding: 'utf-8',
      highWaterMark: STREAM_HIGH_WATER_MARK
    });
  }

  const rl = readline.createInterface({ input: stream });
  yield* createLogStreamFromLines(rl, options);
}

async function* createLogStreamFromLines(lines, options = {}) {
  const allLevels = options.levels === 'all';
  let current = null;

  for await (const line of lines) {
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

  match = line.match(APACHE_ACCESS_PATTERN);
  if (match) {
    const [, clientIp, timestamp, method, url, httpVersion, status, , referrer, userAgent, responseTimeToken] = match;
    const parsedTimestamp = parseRequestTimestamp(timestamp);
    return {
      type: 'access',
      timestamp: parsedTimestamp ? parsedTimestamp.toISOString().slice(0, 19) : timestamp,
      threadId: '',
      method,
      url,
      httpVersion: httpVersion ? `HTTP/${httpVersion}` : '',
      status: parseInt(status, 10),
      responseTime: responseTimeToken ? parseInt(responseTimeToken, 10) : 0,
      pod: '',
      direction: 'access',
      clientIp,
      referrer: referrer || '',
      userAgent: userAgent || ''
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
    stream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: STREAM_HIGH_WATER_MARK });
  }

  const rl = readline.createInterface({ input: stream });
  yield* createRequestLogStreamFromLines(rl);
}

async function* createRequestLogStreamFromLines(lines) {
  for await (const line of lines) {
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
    stream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: STREAM_HIGH_WATER_MARK });
  }

  const rl = readline.createInterface({ input: stream });
  yield* createCDNLogStreamFromLines(rl);
}

async function* createCDNLogStreamFromLines(lines) {
  for await (const line of lines) {
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
  return detectLogSignature(filePath).then(signature => signature.logType);
}

async function detectLogTypeAndCreateStream(filePath, options = {}) {
  const signature = await detectLogSignature(filePath);
  const parserOptions = options.logOptions || {};

  if (!signature.supported) {
    const error = new Error(signature.unsupportedReason);
    error.logSignature = signature;
    throw error;
  }

  if (signature.detectedBy === 'filename') {
    const isGz = String(filePath || '').toLowerCase().endsWith('.gz');
    if (!isGz) {
      return { logType: signature.logType, logFamily: signature.logFamily, stream: null };
    }

    if (signature.logType === 'request') {
      return { logType: signature.logType, logFamily: signature.logFamily, stream: createRequestLogStream(filePath) };
    }
    if (signature.logType === 'cdn') {
      return { logType: signature.logType, logFamily: signature.logFamily, stream: createCDNLogStream(filePath) };
    }
    return { logType: signature.logType, logFamily: signature.logFamily, stream: createLogStream(filePath, parserOptions) };
  }

  const readStream = fs.createReadStream(filePath, {
    encoding: 'utf-8',
    highWaterMark: STREAM_HIGH_WATER_MARK
  });
  const rl = readline.createInterface({ input: readStream });
  const iterator = rl[Symbol.asyncIterator]();
  const bufferedLines = [];
  let linesRead = 0;
  let logType = signature.logType;
  let logFamily = signature.logFamily;

  while (linesRead < 5) {
    const { value, done } = await iterator.next();
    if (done) break;
    bufferedLines.push(value);
    if (String(value || '').trim()) {
      linesRead++;
      const detectedType = detectLogTypeFromLine(value);
      if (detectedType) {
        logType = detectedType;
        logFamily = detectLogFamilyFromLine(value) || logFamily;
        break;
      }
    }
  }

  async function* replayLines() {
    for (const line of bufferedLines) {
      yield line;
    }

    while (true) {
      const { value, done } = await iterator.next();
      if (done) break;
      yield value;
    }
  }

  if (logType === 'request') {
    return { logType, logFamily, stream: createRequestLogStreamFromLines(replayLines()) };
  }
  if (logType === 'cdn') {
    return { logType, logFamily, stream: createCDNLogStreamFromLines(replayLines()) };
  }

  return { logType: 'error', logFamily, stream: createLogStreamFromLines(replayLines(), parserOptions) };
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
  parseErrorRequestContext,
  parseRequestLine,
  createRequestLogStreamFromLines,
  createRequestLogStream,
  parseCDNLine,
  createCDNLogStreamFromLines,
  createCDNLogStream,
  createLogStreamFromLines,
  detectLogType,
  detectLogSignature,
  detectLogTypeAndCreateStream,
  detectLogTypeFromLine,
  detectLogFamilyFromLine,
  getLogTypeFromFileName
};
