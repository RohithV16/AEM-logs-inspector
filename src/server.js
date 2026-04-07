/* === Imports === */
const express = require('express');
const fs = require('fs');
const { execFile } = require('child_process');
const { WebSocketServer } = require('ws');
const { watchLogFile } = require('./tailer');
const { detectLogType } = require('./parser');
const { validateFilePath, sanitizeErrorMessage } = require('./utils/files');
const { PORT } = require('./utils/constants');
const { analyzeResolvedLogFile } = require('./services/logAnalysisService');

/* === Route Imports === */
const createAnalyzeRouter = require('./routes/analyze');
const createMultiErrorRouter = require('./routes/multiError');
const createFilterRouter = require('./routes/filter');
const createEventsRouter = require('./routes/events');
const createExportRouter = require('./routes/export');
const createCloudManagerRouter = require('./routes/cloudManager');
const { performCloudManagerDownload } = require('./routes/cloudManager');

/* === Express App Setup === */
const app = express();
const DASHBOARD_URL = `http://localhost:${PORT}`;

/* === Rate Limiting === */
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

/* === Request ID Middleware === */
// Adds unique ID to each request for tracing through logs
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || require('crypto').randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

/* Large limit needed for uploading log files up to 500MB */
app.use(express.json({ limit: '500mb' }));

/* Serve static frontend assets */
app.use(express.static('public'));

/* Mount API routes with rate limiting */
app.use('/api', apiLimiter, createAnalyzeRouter());
app.use('/api', apiLimiter, createMultiErrorRouter());
app.use('/api', apiLimiter, createFilterRouter());
app.use('/api', apiLimiter, createEventsRouter());
app.use('/api', apiLimiter, createExportRouter());
app.use('/api', apiLimiter, createCloudManagerRouter());

/* === Error Handling Middleware === */
// Centralized error handler - prevents unhandled errors from crashing server
app.use((err, req, res, next) => {
  console.error(`[${req.id}] Unhandled error:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error: sanitizeErrorMessage(err.message),
    requestId: req.id
  });
});

/* === 404 Handler === */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    requestId: req.id
  });
});

let httpServer = null;
let wss = null;

/**
 * Handles WebSocket log analysis request
 * @param {WebSocket} ws - WebSocket connection to send results to
 * @param {string} filePath - Path to the log file to analyze
 */
async function handleAnalyzeAction(ws, filePath) {
  try {
    /* Validate and resolve the file path to prevent directory traversal */
    const targetPath = validateFilePath(filePath);
    const logType = await detectLogType(targetPath);

    const onProgress = (progress) => {
      ws.send(JSON.stringify({ type: 'progress', ...progress }));
    };

    const { payload } = await analyzeResolvedLogFile(targetPath, onProgress);
    
    /* Notify client of detected log type so UI can adapt */
    ws.send(JSON.stringify({ type: 'logType', logType }));

    /* Send complete results with all computed metrics */
    ws.send(JSON.stringify({ type: 'complete', ...payload }));
  } catch (err) {
    /* Sanitize error message to prevent XSS in client */
    ws.send(JSON.stringify({ type: 'error', error: sanitizeErrorMessage(err.message) }));
  }
}

/**
 * Handles Cloud Manager download with progress updates
 * @param {WebSocket} ws - WebSocket connection to send results to
 * @param {Object} options - Download options
 */
async function handleCloudManagerDownloadAction(ws, options) {
  try {
    console.log('[CM] Starting download with options:', JSON.stringify(options, null, 2));
    ws.send(JSON.stringify({ type: 'status', message: 'Starting download from Cloud Manager...', status: 'starting' }));

    const onProgress = (progress) => {
      console.log('[CM] Progress:', JSON.stringify(progress));
      ws.send(JSON.stringify({ type: 'progress', ...progress }));
    };

    console.log('[CM] Calling performCloudManagerDownload...');
    const result = await performCloudManagerDownload(options, onProgress);
    console.log('[CM] Download complete, result keys:', Object.keys(result));

    ws.send(JSON.stringify({ type: 'complete', ...result, status: 'complete' }));
  } catch (err) {
    console.error('[CM] Download error:', err.message);
    ws.send(JSON.stringify({ type: 'error', error: sanitizeErrorMessage(err.message), status: 'error' }));
  }
}

function attachWebSocketHandlers(server) {
  const socketServer = new WebSocketServer({ server });

  socketServer.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        /* Handle analyze action - full file analysis */
        if (data.action === 'analyze' && data.filePath) {
          await handleAnalyzeAction(ws, data.filePath);
        }
        /* Handle Cloud Manager download action */
        else if (data.action === 'cloudmanager-download') {
          await handleCloudManagerDownloadAction(ws, data.options);
        }
        /* Handle tail action - real-time file watching */
        else if (data.type === 'tail') {
          const { filePath } = data;
          
          /* Verify file exists before attempting to watch */
          if (!fs.existsSync(filePath)) {
            ws.send(JSON.stringify({ type: 'error', message: 'File not found' }));
            return;
          }
          
          /* Start watching file for new entries */
          const watcher = watchLogFile(filePath, (newEntries) => {
            ws.send(JSON.stringify({ type: 'entries', entries: newEntries }));
          });
          
          /* Cleanup watcher when client disconnects to prevent resource leaks */
          ws.on('close', () => {
            watcher.close();
          });
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  return socketServer;
}

function startServer() {
  if (httpServer) return httpServer;

  httpServer = app.listen(PORT, () => {
    console.log(`Open ${DASHBOARD_URL} in your browser`);
    if (process.env.CI || process.env.NO_OPEN_BROWSER === '1') {
      return;
    }

    const opener = process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'cmd'
        : 'xdg-open';

    const args = process.platform === 'win32'
      ? ['/c', 'start', '', DASHBOARD_URL]
      : [DASHBOARD_URL];

    execFile(opener, args, { detached: true, stdio: 'ignore' }, () => {});
  });

  wss = attachWebSocketHandlers(httpServer);

  return httpServer;
}

if (require.main === module) {
  startServer();
}

/* === Module Exports === */
module.exports = {
  app,
  startServer
};
