/* === Imports === */
const express = require('express');
const { detectLogType } = require('../parser');
const { analyzeAllInOnePass } = require('../services/errorLogService');
const { analyzeRequestLog } = require('../services/requestLogService');
const { analyzeCDNLog } = require('../services/cdnLogService');
const { validateFilePath, sanitizeErrorMessage, shouldUseStream } = require('../utils/files');

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

      /* Detect log type to route to the appropriate analyzer */
      const logType = await detectLogType(targetPath);

      let result;
      
      /* Route to request log analyzer for AEM request.log files */
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
      } 
      /* Route to CDN log analyzer for CDN access logs */
      else if (logType === 'cdn') {
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
      } 
      /* Default to AEM error log analyzer for standard error logs */
      else {
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
          httpMethods: result.httpMethods,
          packageThreads: result.packageThreads,
          packageExceptions: result.packageExceptions,
          timeline: result.timeline,
          levelCounts: result.levelCounts
        });
      }
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
      let result;
      if (logType === 'request') {
        result = await analyzeRequestLog(targetPath, onProgress);
      } else if (logType === 'cdn') {
        result = await analyzeCDNLog(targetPath, onProgress);
      } else {
        result = await analyzeAllInOnePass(targetPath, onProgress);
      }

      /* Send final results and close the SSE connection */
      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
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
