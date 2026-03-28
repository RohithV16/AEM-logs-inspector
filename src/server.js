const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { WebSocketServer } = require('ws');
const { analyzeLogFile, getSummary, filterByDateRange, filterByLogger, filterByThread, filterByRegex, exportToCSV, exportToJSON, generatePDFSummary, getTimelineData, getLoggerDistribution, normalizeMessage, analyzeEntries, getSummaryFromEntries, analyzeLogFileStream, getSummaryStream, getTimelineDataStream, getLoggerDistributionStream, filterAndAnalyzeStream, getHourlyHeatmap, getThreadDistribution, getTrendComparison, parseAllLevels, isSafeRegex, analyzeAllInOnePass, buildEntryFilter, countMatchingEntries, countMatchingEntriesWithLevels, extractPage } = require('./analyzer');
const { parseLogFile, parseAllLevels: parseAllLevelsParser, createLogStream, getFileSize } = require('./parser');
const { watchLogFile } = require('./tailer');
const { checkAlerts } = require('./alerts');

const ALLOWED_LOG_EXTENSIONS = ['.log', '.txt'];
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

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.post('/api/raw-events', async (req, res) => {
  const { filePath, fileContent, page = 1, perPage = 50, level, search, from, to,
          logger, thread, package: pkg, exception, category } = req.body;
  let tempFile = null;

  try {
    let targetPath;

    if (fileContent) {
      // File upload mode (for small files)
      if (fileContent.length > MAX_UPLOAD_SIZE) {
        throw new Error('File too large for upload. Use file path mode.');
      }
      tempFile = createTempFile(fileContent);
      targetPath = tempFile;
    } else if (filePath) {
      // File path mode (server-side, up to 5GB)
      targetPath = validateFilePath(filePath);
    } else {
      throw new Error('File path or content required.');
    }

    // Validate regex if search is provided
    if (search) {
      const regexValidation = isSafeRegex(search);
      if (regexValidation && regexValidation.error) {
        return res.json({ success: false, error: regexValidation.error });
      }
    }

    // Build filter function (compiled once, used in both passes)
    const filter = buildEntryFilter({ level, search, from, to, logger, thread, package: pkg, exception, category });

    // PASS 1: Count matching entries + level counts (single streaming pass)
    const { total, levelCounts } = await countMatchingEntriesWithLevels(targetPath, filter);

    // PASS 2: Extract page (streaming, stops early after page is full)
    const skip = (page - 1) * perPage;
    const events = await extractPage(targetPath, filter, skip, perPage);

    res.json({
      success: true,
      total,
      page: Number(page),
      perPage: Number(perPage),
      totalPages: Math.ceil(total / perPage),
      events,
      levelCounts
    });
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  } finally {
    cleanupTempFile(tempFile);
  }
});

app.use(express.static('public'));

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

    // Single-pass analysis: summary + results + filter options in one streaming pass
    const result = await analyzeAllInOnePass(targetPath);

    res.json({
      success: true,
      summary: result.summary,
      results: result.results,
      loggers: result.loggers,
      threads: result.threads,
      packages: result.packages,
      exceptions: result.exceptions,
      timeline: result.timeline
    });
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
    let results, summary, timeline, loggerDist, filterError = null;
    let hourlyHeatmap = {};
    let threadDist = {};
    
    if (fileContent) {
      if (fileContent.length > MAX_UPLOAD_SIZE) {
        throw new Error('File content too large. Maximum size is 500MB.');
      }
      tempFile = createTempFile(fileContent);
      const useStream = shouldUseStream(tempFile);
      
      if (useStream) {
        const stream = createLogStream(tempFile);
        const filtered = await filterAndAnalyzeStream(stream, filters);
        results = filtered.results;
        summary = filtered.summary;
        filterError = filtered.filterError;

        const [tlResult, ldResult] = await Promise.all([
          (async () => { const s = createLogStream(tempFile); return getTimelineDataStream(s); })(),
          (async () => { const s = createLogStream(tempFile); return getLoggerDistributionStream(s); })()
        ]);
        timeline = tlResult;
        loggerDist = ldResult;
      } else {
        let entries = parseLogFile(tempFile);

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
    } else if (filePath) {
      const validatedPath = validateFilePath(filePath);
      const useStream = shouldUseStream(validatedPath);

      if (useStream) {
        const stream = createLogStream(validatedPath);
        const filtered = await filterAndAnalyzeStream(stream, filters);
        results = filtered.results;
        summary = filtered.summary;
        filterError = filtered.filterError;

        const [tlResult, ldResult] = await Promise.all([
          (async () => { const s = createLogStream(validatedPath); return getTimelineDataStream(s); })(),
          (async () => { const s = createLogStream(validatedPath); return getLoggerDistributionStream(s); })()
        ]);
        timeline = tlResult;
        loggerDist = ldResult;
      } else {
        let entries = parseLogFile(validatedPath);
        
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
    } else {
      throw new Error('No file path or content provided');
    }
    
    res.json({ success: true, summary, results, timeline, loggerDist, filterError, hourlyHeatmap, threadDist });
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

const httpServer = app.listen(PORT, () => {
  console.log(`AEM Log Analyzer Dashboard`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`\nUsage:`);
  console.log(`1. Click "Select Log File"`);
  console.log(`2. Navigate to your log file`);
  console.log(`3. View analyzed errors and warnings\n`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let watcher = null;
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      // Watch/tail mode
      if (data.action === 'watch' && data.filePath) {
        watcher = watchLogFile(data.filePath, (entry) => {
          ws.send(JSON.stringify(entry));
        });
        if (watcher.error) {
          ws.send(JSON.stringify({ error: watcher.error }));
        }
      }
      if (data.action === 'stop' && watcher) {
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

        // Run single-pass analysis with progress callback
        // Estimate ~300 bytes per line for progress calculation
        analyzeAllInOnePass(validatedPath, (progress) => {
          const estimatedBytes = progress.totalLines * 300;
          const percent = Math.min(Math.round((estimatedBytes / fileSize) * 100), 99);
          ws.send(JSON.stringify({
            type: 'progress',
            analysisId,
            percent,
            totalLines: progress.totalLines,
            bytesRead: estimatedBytes,
            fileSize
          }));
        }).then(result => {
          ws.send(JSON.stringify({
            type: 'complete',
            analysisId,
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
