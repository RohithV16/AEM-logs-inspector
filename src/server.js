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
const createOnboardingRouter = require('./routes/onboarding');

/* === Express App Setup === */
const app = express();
const DASHBOARD_URL = `http://localhost:${PORT}`;

/* Large limit needed for uploading log files up to 500MB */
app.use(express.json({ limit: '500mb' }));

/* Serve static frontend assets */
app.use(express.static('public'));

/* Mount API routes */
app.use('/api', createAnalyzeRouter());
app.use('/api', createMultiErrorRouter());
app.use('/api', createFilterRouter());
app.use('/api', createEventsRouter());
app.use('/api', createExportRouter());
app.use('/api', createCloudManagerRouter());
app.use('/api', createOnboardingRouter());

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
