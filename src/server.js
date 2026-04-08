/* === Imports === */
const express = require('express');
const { execFile } = require('child_process');
const { WebSocketServer } = require('ws');
const { watchLogFile } = require('./tailer');
const { detectLogType } = require('./parser');
const { validateFilePath, sanitizeErrorMessage } = require('./utils/files');
const { PORT } = require('./utils/constants');
const { analyzeResolvedLogFile } = require('./services/logAnalysisService');
const { createCloudManagerTailSession } = require('./services/cloudManagerService');

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

function startLocalTailSession(ws, filePath) {
  const targetPath = validateFilePath(filePath);
  const watcher = watchLogFile(targetPath, (entry) => {
    ws.send(JSON.stringify({
      type: 'tail-entry',
      source: 'local',
      entry
    }));
  });

  if (watcher.error) {
    throw new Error(watcher.error);
  }

  ws.activeTailSession = {
    source: 'local',
    stop: () => watcher.close()
  };
  ws.send(JSON.stringify({
    type: 'tail-status',
    source: 'local',
    status: 'running',
    message: `Watching ${targetPath}`
  }));
}

function startCloudManagerTailSession(ws, options = {}) {
  const session = createCloudManagerTailSession(options, {
    onStatus: (status) => {
      ws.send(JSON.stringify({ type: 'tail-status', ...status }));
    },
    onEntry: (entry) => {
      ws.send(JSON.stringify({ type: 'tail-entry', source: 'cloudmanager', entry }));
    },
    onError: (error) => {
      ws.send(JSON.stringify({ type: 'tail-error', source: 'cloudmanager', error: sanitizeErrorMessage(error.message) }));
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

  if (payload.source === 'cloudmanager') {
    const { environmentId, service, logName } = payload;
    if (!environmentId || !service || !logName) {
      throw new Error('Environment, service, and log name are required for Cloud Manager tailing.');
    }
    startCloudManagerTailSession(ws, payload);
    return;
  }

  if (!payload.filePath) {
    throw new Error('A local file path is required for tailing.');
  }

  startLocalTailSession(ws, payload.filePath);
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
          const stoppedSource = stopActiveTail(ws, 'client-request');
          if (stoppedSource === 'local') {
            ws.send(JSON.stringify({ type: 'tail-stopped', source: 'local' }));
          }
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
