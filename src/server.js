const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { WebSocketServer } = require('ws');
const { analyzeLogFile, getSummary, filterByDateRange, filterByLogger, filterByThread, filterByRegex, exportToCSV, exportToJSON, generatePDFSummary, getTimelineData, getLoggerDistribution, normalizeMessage, analyzeEntries, getSummaryFromEntries, analyzeLogFileStream, getSummaryStream, getTimelineDataStream, getLoggerDistributionStream, filterAndAnalyzeStream, getHourlyHeatmap, getThreadDistribution, getTrendComparison, parseAllLevels, isSafeRegex, analyzeAllInOnePass, buildEntryFilter, countMatchingEntries, countMatchingEntriesWithLevels, extractPage, buildRequestFilter, countMatchingRequestEntries, extractRequestPage, countAndExtractRequestEntries, buildCDNFilter, countMatchingCDNEntries, extractCDNPage, countAndExtractCDNEntries, analyzeRequestLog, analyzeCDNLog, detectLogType } = require('./analyzer');
const { parseLogFile, parseAllLevels: parseAllLevelsParser, createLogStream, getFileSize, createRequestLogStream, createCDNLogStream } = require('./parser');
const { watchLogFile } = require('./tailer');
const { checkAlerts } = require('./alerts');

const ALLOWED_LOG_EXTENSIONS = ['.log', '.txt', '.gz'];
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB for file path mode
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;    // 500MB for browser upload mode
const STREAM_THRESHOLD = 50 * 1024 * 1024;    // 50MB - use streaming above this

function sanitizeErrorMessage(message) {
  return message
    .replace(/[<>"'&]/g, '')  // Only strip HTML-injection chars
    .substring(0, 500);
}

function validateFilePath(filePath) {
  const resolved = path.resolve(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
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
  
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5GB.');
  }
  
  return resolved;
}

function createTempFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aem-log-'));
  const tempFile = path.join(dir, `${crypto.randomUUID()}.log`);
  fs.writeFileSync(tempFile, content);
  return tempFile;
}

function cleanupTempFile(tempFile) {
  try {
    if (tempFile) {
      fs.unlinkSync(tempFile);
      const dir = path.dirname(tempFile);
      if (fs.existsSync(dir)) {
        fs.rmdirSync(dir);
      }
    }
  } catch (e) {
    console.error('Cleanup error:', e);
  }
}

const app = express();
const PORT = 3000;

// Serving logic moved to the top for precedence check
const staticPath = path.resolve(__dirname, '..', 'frontend', 'dist');
console.log(`[DEBUG] staticPath: ${staticPath}`);

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Debug logging for all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  res.setHeader('X-AEM-Inspector-Server', 'v1'); // Identity check
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', staticPath }));

// Serve static files
app.use(express.static(staticPath));

// Middleware for catching non-API GET requests early
app.get('/', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Dashboard index.html not found. Path: ' + staticPath);
});

app.post('/api/raw-events', async (req, res) => {
  const { filePath, fileContent, page = 1, perPage = 50, level, search, from, to,
          logger, thread, package: pkg, exception, category,
          method, httpStatus, minResponseTime, maxResponseTime, pod,
          cache, clientCountry, pop, host, minTtfb, maxTtfb } = req.body;
  let tempFile = null;

  try {
    let targetPath;

    if (fileContent) {
      if (fileContent.length > MAX_UPLOAD_SIZE) {
        throw new Error('File too large for upload. Use file path mode.');
      }
      tempFile = createTempFile(fileContent);
      targetPath = tempFile;
    } else if (filePath) {
      targetPath = validateFilePath(filePath);
    } else {
      throw new Error('File path or content required.');
    }

    const logType = await detectLogType(targetPath);

    if (logType === 'request') {
      const filter = buildRequestFilter({ search, from, to, method, httpStatus, minResponseTime, maxResponseTime, pod });
      const skip = (page - 1) * perPage;
      const { total, events } = await countAndExtractRequestEntries(targetPath, filter, skip, perPage);

      return res.json({
        success: true,
        total,
        page: Number(page),
        perPage: Number(perPage),
        totalPages: Math.ceil(total / perPage),
        events,
        logType: 'request'
      });
    }

    if (logType === 'cdn') {
      const filter = buildCDNFilter({ search, from, to, method, httpStatus, cache, country: clientCountry, pop, host, minTtfb, maxTtfb });
      const skip = (page - 1) * perPage;
      const { total, events } = await countAndExtractCDNEntries(targetPath, filter, skip, perPage);

      return res.json({
        success: true,
        total,
        page: Number(page),
        perPage: Number(perPage),
        totalPages: Math.ceil(total / perPage),
        events,
        logType: 'cdn'
      });
    }

    // Default: error log
    if (search) {
      const regexValidation = isSafeRegex(search);
      if (regexValidation && regexValidation.error) {
        return res.json({ success: false, error: regexValidation.error });
      }
    }

    const filter = buildEntryFilter({ level, search, from, to, logger, thread, package: pkg, exception, category });
    const { total, levelCounts } = await countMatchingEntriesWithLevels(targetPath, filter);
    const skip = (page - 1) * perPage;
    const events = await extractPage(targetPath, filter, skip, perPage);

    res.json({
      success: true,
      total,
      page: Number(page),
      perPage: Number(perPage),
      totalPages: Math.ceil(total / perPage),
      events,
      levelCounts,
      logType: 'error'
    });
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  } finally {
    cleanupTempFile(tempFile);
  }
});



function shouldUseStream(filePath) {
  try {
    const size = getFileSize(filePath);
    return size > STREAM_THRESHOLD;
  } catch {
    return false;
  }
}

app.post('/api/analyze/stream', async (req, res) => {
  const { filePath, fileContent } = req.body;
  let tempFile = null;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    let targetPath = filePath;
    if (fileContent) {
      if (fileContent.length > MAX_FILE_SIZE) {
        res.write(`data: ${JSON.stringify({ error: 'File too large' })}\n\n`);
        return res.end();
      }
      tempFile = createTempFile(fileContent);
      targetPath = tempFile;
    }
    const validatedPath = validateFilePath(targetPath);
    const stream = createLogStream(validatedPath);

    const grouped = {};
    let count = 0;
    for await (const entry of stream) {
      count++;
      const normalized = normalizeMessage(entry.message);
      const key = `${entry.level}:${normalized}`;
      if (!grouped[key]) {
        grouped[key] = { level: entry.level, message: normalized, count: 0, firstOccurrence: entry.timestamp, examples: [] };
      }
      grouped[key].count++;
      if (grouped[key].examples.length < 3) {
        grouped[key].examples.push({ timestamp: entry.timestamp, logger: entry.logger, thread: entry.thread });
      }
      if (count % 500 === 0) {
        res.write(`data: ${JSON.stringify({ progress: count, type: 'processing' })}\n\n`);
      }
    }

    const results = Object.values(grouped).sort((a, b) => b.count - a.count);
    const loggers = {};
    const threads = {};
    for (const r of results) {
      for (const ex of (r.examples || [])) {
        if (ex.logger) loggers[ex.logger] = (loggers[ex.logger] || 0) + r.count;
        if (ex.thread) threads[ex.thread] = (threads[ex.thread] || 0) + r.count;
      }
    }
    const totalErrors = results.filter(r => r.level === 'ERROR').reduce((s, r) => s + r.count, 0);
    const totalWarnings = results.filter(r => r.level === 'WARN').reduce((s, r) => s + r.count, 0);
    const uniqueErrors = results.filter(r => r.level === 'ERROR').length;
    const uniqueWarnings = results.filter(r => r.level === 'WARN').length;
    const summary = { totalErrors, totalWarnings, uniqueErrors, uniqueWarnings, totalLines: count };
    res.write(`data: ${JSON.stringify({ done: true, summary, results, loggers, threads })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: sanitizeErrorMessage(error.message) })}\n\n`);
    res.end();
  } finally {
    cleanupTempFile(tempFile);
  }
});

app.post('/api/analyze', async (req, res) => {
  const { filePath, fileContent } = req.body;
  let tempFile = null;

  try {
    let targetPath;

    if (fileContent) {
      // File upload mode (for small files ≤500MB)
      if (fileContent.length > MAX_UPLOAD_SIZE) {
        throw new Error('File too large for upload (>500MB). Enter the server file path instead.');
      }
      tempFile = createTempFile(fileContent);
      targetPath = tempFile;
    } else if (filePath) {
      // File path mode (server-side, up to 5GB)
      targetPath = validateFilePath(filePath);
    } else {
      throw new Error('Please select a file or enter a file path.');
    }

    // Detect log type
    const logType = await detectLogType(targetPath);

    let result;
    if (logType === 'request') {
      result = await analyzeRequestLog(targetPath);
      res.json({
        success: true,
        logType: 'request',
        summary: result.summary,
        filterOptions: result.filterOptions,
        results: result.results,
        methods: result.methods,
        statuses: result.statuses,
        pods: result.pods,
        timeline: result.timeline
      });
    } else if (logType === 'cdn') {
      result = await analyzeCDNLog(targetPath);
      res.json({
        success: true,
        logType: 'cdn',
        summary: result.summary,
        filterOptions: result.filterOptions,
        methods: result.methods,
        statuses: result.statuses,
        cacheStatuses: result.cacheStatuses,
        countries: result.countries,
        pops: result.pops,
        hosts: result.hosts,
        timeline: result.timeline
      });
    } else {
      // Default: error log
      result = await analyzeAllInOnePass(targetPath);
      res.json({
        success: true,
        logType: 'error',
        summary: result.summary,
        results: result.results,
        loggers: result.loggers,
        threads: result.threads,
        packages: result.packages,
        exceptions: result.exceptions,
        timeline: result.timeline
      });
    }
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  } finally {
    cleanupTempFile(tempFile);
  }
});

app.post('/api/filter', async (req, res) => {
  const { filePath, fileContent, filters } = req.body;
  
  let tempFile = null;
  
  try {
    let targetPath;
    
    if (fileContent) {
      if (fileContent.length > MAX_UPLOAD_SIZE) {
        throw new Error('File content too large. Maximum size is 500MB.');
      }
      tempFile = createTempFile(fileContent);
      targetPath = tempFile;
    } else if (filePath) {
      targetPath = validateFilePath(filePath);
    } else {
      throw new Error('No file path or content provided');
    }
    
    const logType = await detectLogType(targetPath);
    
    if (logType === 'request') {
      const requestFilters = filters || {};
      const filter = buildRequestFilter(requestFilters);
      const stream = createRequestLogStream(targetPath);
      
      const methods = {};
      const statuses = {};
      const pods = {};
      let totalRequests = 0;
      let totalResponseTime = 0;
      const responseTimes = [];
      const timeline = {};
      
      for await (const entry of stream) {
        if (!filter(entry)) continue;
        
        totalRequests++;
        if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
        if (entry.status) {
          statuses[entry.status] = (statuses[entry.status] || 0) + 1;
          responseTimes.push(entry.responseTime);
          totalResponseTime += entry.responseTime;
        }
        if (entry.pod) pods[entry.pod] = (pods[entry.pod] || 0) + 1;
        if (entry.timestamp) {
          const hour = entry.timestamp.substring(0, 13);
          if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0 };
          timeline[hour].requests++;
          if (entry.status >= 400) timeline[hour].errors++;
        }
      }
      
      responseTimes.sort((a, b) => a - b);
      const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / responseTimes.length) : 0;
      
      return res.json({
        success: true,
        logType: 'request',
        summary: { totalRequests, avgResponseTime },
        timeline,
        methods,
        statuses,
        pods
      });
    }
    
    if (logType === 'cdn') {
      const cdnFilters = filters || {};
      const filter = buildCDNFilter(cdnFilters);
      const stream = createCDNLogStream(targetPath);
      
      const methods = {};
      const statuses = {};
      const cacheStatuses = {};
      const countries = {};
      const pops = {};
      const hosts = {};
      let totalRequests = 0;
      const timeline = {};
      
      for await (const entry of stream) {
        if (!filter(entry)) continue;
        
        totalRequests++;
        if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
        if (entry.status) statuses[entry.status] = (statuses[entry.status] || 0) + 1;
        if (entry.cache) cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
        if (entry.clientCountry) countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
        if (entry.pop) pops[entry.pop] = (pops[entry.pop] || 0) + 1;
        if (entry.host) hosts[entry.host] = (hosts[entry.host] || 0) + 1;
        if (entry.timestamp) {
          const hour = entry.timestamp.substring(0, 13);
          if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
          timeline[hour].requests++;
          if (entry.status >= 400) timeline[hour].errors++;
          if (entry.cache === 'HIT') timeline[hour].cacheHits++;
        }
      }
      
      return res.json({
        success: true,
        logType: 'cdn',
        summary: { totalRequests },
        timeline,
        methods,
        statuses,
        cacheStatuses,
        countries,
        pops,
        hosts
      });
    }
    
    // Default: error log - existing logic
    let results, summary, timeline, loggerDist, filterError = null;
    let hourlyHeatmap = {};
    let threadDist = {};
    
    const useStream = shouldUseStream(targetPath);
    
    if (useStream) {
      const stream = createLogStream(targetPath);
      const filtered = await filterAndAnalyzeStream(stream, filters);
      results = filtered.results;
      summary = filtered.summary;
      filterError = filtered.filterError;

      const [tlResult, ldResult] = await Promise.all([
        (async () => { const s = createLogStream(targetPath); return getTimelineDataStream(s); })(),
        (async () => { const s = createLogStream(targetPath); return getLoggerDistributionStream(s); })()
      ]);
      timeline = tlResult;
      loggerDist = ldResult;
    } else {
      let entries = parseLogFile(targetPath);

      if (filters) {
        if (filters.startDate || filters.endDate) {
          const start = filters.startDate ? new Date(filters.startDate) : null;
          const end = filters.endDate ? new Date(filters.endDate) : null;
          if (start && isNaN(start.getTime())) throw new Error('Invalid start date');
          if (end && isNaN(end.getTime())) throw new Error('Invalid end date');
          entries = filterByDateRange(entries, start, end);
        }
        if (filters.logger) {
          const result = filterByLogger(entries, filters.logger);
          if (result.error) filterError = result.error;
          entries = result.entries;
        }
        if (filters.thread) {
          const result = filterByThread(entries, filters.thread);
          if (result.error) filterError = result.error;
          entries = result.entries;
        }
        if (filters.regex) {
          const result = filterByRegex(entries, filters.regex);
          if (result.error) filterError = result.error;
          entries = result.entries;
        }
      }

      results = analyzeEntries(entries);
      summary = getSummaryFromEntries(entries);
      timeline = getTimelineData(entries);
      loggerDist = getLoggerDistribution(entries);
      hourlyHeatmap = getHourlyHeatmap(entries);
      threadDist = getThreadDistribution(entries);
    }

    res.json({ success: true, summary, results, timeline, loggerDist, filterError, hourlyHeatmap, threadDist, logType: 'error' });
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  } finally {
    cleanupTempFile(tempFile);
  }
});

app.post('/api/trend', async (req, res) => {
  const { filePath, fileContent, days } = req.body;
  let tempFile = null;
  try {
    let targetPath = filePath;
    if (fileContent) {
      if (fileContent.length > MAX_FILE_SIZE) throw new Error('File too large');
      tempFile = createTempFile(fileContent);
      targetPath = tempFile;
    }
    const validatedPath = validateFilePath(targetPath);
    const entries = parseLogFile(validatedPath);
    const trend = getTrendComparison(entries, days || 7);
    res.json({ success: true, trend });
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  } finally {
    cleanupTempFile(tempFile);
  }
});

app.post('/api/alerts/check', (req, res) => {
  try {
    const { summary, results, thresholds } = req.body;
    const alerts = checkAlerts(summary, results, thresholds);
    res.json({ success: true, alerts });
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  }
});

app.post('/api/export/csv', (req, res) => {
  const { results } = req.body;
  const csv = exportToCSV(results);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=aem-log-errors.csv');
  res.send(csv);
});

app.post('/api/export/json', (req, res) => {
  const { results } = req.body;
  const json = exportToJSON(results);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=aem-log-errors.json');
  res.send(json);
});

app.post('/api/export/pdf', (req, res) => {
  try {
    const { summary, results } = req.body;
    const text = generatePDFSummary(summary, results);
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    const lines = text.split('\n');
    lines.forEach((line, i) => doc.text(line, 10, 10 + i * 5));
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=aem-log-summary.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.json({ success: false, error: 'Failed to generate PDF' });
  }
});
 
// Final catch-all middleware for any other GET requests (Vue Router support)
// Using a generic middleware instead of a '*' route to avoid pathToRegexp compatibility issues.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/') || req.path.startsWith('/ws')) return next();
  
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});


const httpServer = app.listen(PORT, () => {
  console.log(`AEM Log Analyzer Dashboard`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let watcher = null;
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);

      // Watch/tail mode
      if ((data.action === 'watch' || data.type === 'startTail') && data.filePath) {
        watcher = watchLogFile(data.filePath, (entry) => {
          ws.send(JSON.stringify({ type: 'tail', event: entry }));
        });
        if (watcher.error) {
          ws.send(JSON.stringify({ error: watcher.error }));
        }
      }
      if ((data.action === 'stop' || data.type === 'stopTail') && watcher) {
        watcher.close();
        watcher = null;
      }

      // Analysis with progress reporting
      if (data.action === 'analyze' && data.filePath) {
        const analysisId = crypto.randomUUID();
        const validatedPath = validateFilePath(data.filePath);
        const fileSize = fs.statSync(validatedPath).size;

        // Send initial progress
        ws.send(JSON.stringify({
          type: 'progress',
          analysisId,
          percent: 0,
          totalLines: 0,
          bytesRead: 0,
          fileSize
        }));

        // Detect log type and run appropriate analysis
        const logType = await detectLogType(validatedPath);
        
        if (logType === 'request') {
          const result = await analyzeRequestLog(validatedPath);
          return ws.send(JSON.stringify({
            type: 'complete',
            analysisId,
            logType: 'request',
            summary: result.summary,
            filterOptions: result.filterOptions,
            methods: result.methods,
            statuses: result.statuses,
            pods: result.pods,
            timeline: result.timeline
          }));
        }
        
        if (logType === 'cdn') {
          const result = await analyzeCDNLog(validatedPath);
          return ws.send(JSON.stringify({
            type: 'complete',
            analysisId,
            logType: 'cdn',
            summary: result.summary,
            filterOptions: result.filterOptions,
            methods: result.methods,
            statuses: result.statuses,
            cacheStatuses: result.cacheStatuses,
            countries: result.countries,
            pops: result.pops,
            hosts: result.hosts,
            timeline: result.timeline
          }));
        }
        
        // Default: error log
        analyzeAllInOnePass(validatedPath, (progress) => {
          const estimatedBytes = progress.totalLines * 300;
          const percent = Math.min(Math.round((estimatedBytes / fileSize) * 100), 99);
          ws.send(JSON.stringify({
            type: 'progress',
            analysisId,
            percent,
            percentage: percent, // Backward compatibility
            totalLines: progress.totalLines,
            bytesRead: estimatedBytes,
            fileSize
          }));
        }).then(result => {
          ws.send(JSON.stringify({
            type: 'complete',
            analysisId,
            logType: 'error',
            summary: result.summary,
            results: result.results,
            loggers: result.loggers,
            threads: result.threads,
            packages: result.packages,
            exceptions: result.exceptions,
            timeline: result.timeline
          }));
        }).catch(err => {
          ws.send(JSON.stringify({
            type: 'error',
            analysisId,
            error: sanitizeErrorMessage(err.message)
          }));
        });
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
  ws.on('close', () => { if (watcher) watcher.close(); });
});


