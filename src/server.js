/* === Imports === */
const express = require('express');
const path = require('path');
const { execFile } = require('child_process');
const { WebSocketServer } = require('ws');
const { detectLogType } = require('./parser');
const { validateFilePath, sanitizeErrorMessage } = require('./utils/files');
const { PORT } = require('./utils/constants');
const { analyzeResolvedLogFile } = require('./services/logAnalysisService');
const { createCloudManagerTailGroupSession } = require('./services/cloudManagerService');

/* === Route Imports === */
const createAnalyzeRouter = require('./routes/analyze');
const createMultiErrorRouter = require('./routes/multiError');
const createFilterRouter = require('./routes/filter');
const createEventsRouter = require('./routes/events');
const createExportRouter = require('./routes/export');
const { createCloudManagerRouter, performCloudManagerDownload } = require('./routes/cloudManager');

/* === Express App Setup === */
const app = express();
const DASHBOARD_URL = `http://localhost:${PORT}`;

/* === Request ID Middleware === */
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || require('crypto').randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

app.use(express.json({ limit: '500mb' }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.use('/api', createAnalyzeRouter());
app.use('/api', createMultiErrorRouter());
app.use('/api', createFilterRouter());
app.use('/api', createEventsRouter());
app.use('/api', createExportRouter());
app.use('/api', createCloudManagerRouter());

app.use((err, req, res, next) => {
  console.error(`[${req.id}] Unhandled error:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error: sanitizeErrorMessage(err.message),
    requestId: req.id
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    requestId: req.id
  });
});

let httpServer = null;
let wss = null;

async function handleAnalyzeAction(ws, filePath) {
  try {
    const targetPath = validateFilePath(filePath);
    const logType = await detectLogType(targetPath);

    const onProgress = (progress) => {
      ws.send(JSON.stringify({ type: 'progress', ...progress }));
    };

    const { payload } = await analyzeResolvedLogFile(targetPath, onProgress);
    ws.send(JSON.stringify({ type: 'logType', logType }));
    ws.send(JSON.stringify({ type: 'complete', ...payload }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', error: sanitizeErrorMessage(err.message) }));
  }
}

async function handleCloudManagerDownloadAction(ws, options) {
  try {
    ws.send(JSON.stringify({ type: 'status', message: 'Starting download from Cloud Manager...', status: 'starting' }));

    const onProgress = (progress) => {
      ws.send(JSON.stringify({ type: 'progress', ...progress }));
    };

    const result = await performCloudManagerDownload(options, onProgress);
    ws.send(JSON.stringify({ type: 'complete', ...result, status: 'complete' }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', error: sanitizeErrorMessage(err.message), status: 'error' }));
  }
}

function stopActiveTail(ws, source = '') {
  const activeSession = ws.activeTailSession;
  if (!activeSession) return null;
  activeSession.stop();
  ws.activeTailSession = null;
  if (source) {
    console.log(`[Tail] Stopped ${source} tail session`);
  }
  return activeSession.source || null;
}

function startCloudManagerTailSession(ws, options = {}) {
  const session = createCloudManagerTailGroupSession(options, {
    onStatus: (status) => {
      ws.send(JSON.stringify({ type: 'tail-status', ...status }));
    },
    onEntry: (entry) => {
      ws.send(JSON.stringify({ type: 'tail-entry', source: 'cloudmanager', entry }));
    },
    onError: (error, meta = {}) => {
      ws.send(JSON.stringify({
        type: 'tail-error',
        source: 'cloudmanager',
        error: sanitizeErrorMessage(error.message),
        ...meta
      }));
    },
    onStopped: ({ source }) => {
      if (ws.activeTailSession === session) {
        ws.activeTailSession = null;
      }
      ws.send(JSON.stringify({ type: 'tail-stopped', source }));
    }
  });

  ws.activeTailSession = session;
  session.start();
}

function handleTailStartAction(ws, payload = {}) {
  stopActiveTail(ws, 'replaced');

  if (payload.source !== 'cloudmanager') {
    throw new Error('Local file tailing has been removed. Use Cloud Manager tailing instead.');
  }

  const { environmentId, selections } = payload;
  if (!environmentId || !Array.isArray(selections) || !selections.length) {
    throw new Error('Environment and at least one Cloud Manager log selection are required for tailing.');
  }

  startCloudManagerTailSession(ws, payload);
}

function attachWebSocketHandlers(server) {
  const socketServer = new WebSocketServer({ server });

  socketServer.on('connection', (ws) => {
    ws.activeTailSession = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.action === 'analyze' && data.filePath) {
          await handleAnalyzeAction(ws, data.filePath);
        } else if (data.action === 'cloudmanager-download') {
          await handleCloudManagerDownloadAction(ws, data.options);
        } else if (data.action === 'tail-start') {
          handleTailStartAction(ws, data);
        } else if (data.action === 'tail-stop') {
          stopActiveTail(ws, 'client-request');
        }
      } catch (err) {
        ws.send(JSON.stringify({
          type: 'tail-error',
          source: 'unknown',
          error: sanitizeErrorMessage(err.message)
        }));
      }
    });

    ws.on('close', () => {
      stopActiveTail(ws, 'disconnect');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      stopActiveTail(ws, 'socket-error');
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

module.exports = {
  app,
  startServer
};
