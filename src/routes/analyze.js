/* === Imports === */
const express = require('express');
const { detectLogType } = require('../parser');
const { validateFilePath, sanitizeErrorMessage, shouldUseStream } = require('../utils/files');
const { analyzeResolvedLogFile } = require('../services/logAnalysisService');

/**
 * Creates the analyze router with endpoints for log analysis
 * @returns {express.Router} Express router with analyze endpoints
 */
function createAnalyzeRouter() {
  const router = express.Router();

  /* === POST /api/analyze === */
  /* Full analysis endpoint - loads entire file into memory for smaller files */
  router.post('/analyze', async (req, res) => {
    const { filePath } = req.body;

    try {
      let targetPath;

      /* Validate file path for security (prevents directory traversal) */
      if (filePath) {
        targetPath = validateFilePath(filePath);
      } else {
        throw new Error('Please enter a file path.');
      }

      const { payload } = await analyzeResolvedLogFile(targetPath);
      res.json(payload);
    } catch (error) {
      /* Sanitize error message before sending to client to prevent XSS */
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === POST /api/analyze/stream === */
  /* Streaming endpoint for large files - uses Server-Sent Events for progress */
  router.post('/analyze/stream', async (req, res) => {
    const { filePath } = req.body;

    try {
      let targetPath;

      if (filePath) {
        targetPath = validateFilePath(filePath);
      } else {
        throw new Error('Please enter a file path.');
      }

      /* Only use streaming for large files to avoid SSE overhead on small files */
      if (!shouldUseStream(targetPath)) {
        throw new Error('File too small for streaming. Use /api/analyze instead.');
      }

      /* Set up Server-Sent Events (SSE) for streaming responses */
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const logType = await detectLogType(targetPath);
      
      /* Send log type first so client can configure UI appropriately */
      res.write(`data: ${JSON.stringify({ type: 'logType', logType })}\n\n`);

      /* Progress callback sends incremental updates during analysis */
      const onProgress = (progress) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`);
      };

      /* Same routing logic as /analyze but with progress reporting */
      const { payload } = await analyzeResolvedLogFile(targetPath, onProgress);

      /* Send final results and close the SSE connection */
      res.write(`data: ${JSON.stringify({ type: 'complete', result: payload })}\n\n`);
      res.end();
    } catch (error) {
      /* Send error through SSE stream and close connection */
      res.write(`data: ${JSON.stringify({ type: 'error', error: sanitizeErrorMessage(error.message) })}\n\n`);
      res.end();
    }
  });
  return router;
}

/* === Module Exports === */
module.exports = createAnalyzeRouter;
