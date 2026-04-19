const express = require('express');
const {
  analyzeLogBatch,
  analyzeLogBatchFilters,
  getLogBatchPage,
  analyzeMultiError,
  analyzeMergedErrorFilters,
  countAndExtractMultiErrorEntries,
  buildBatchFiltersFromBody
} = require('../services/multiErrorAnalysisService');
const { sanitizeErrorMessage } = require('../utils/files');

function withoutLevelFilter(filters = {}) {
  const normalized = { ...(filters || {}) };
  delete normalized.level;
  delete normalized.severity;
  return normalized;
}

function sendBatchAnalyzeResponse(res, result) {
  return res.json({
    success: true,
    logType: result.logType,
    mode: result.mode || 'batch',
    batchLogType: result.batchLogType || 'error',
    sourceTypes: result.sourceTypes || {},
    summary: result.summary,
    sources: result.sources,
    correlation: result.correlation,
    levelCounts: result.levelCounts,
    loggerDist: result.loggers,
    threadDist: result.threads,
    loggers: result.loggers,
    threads: result.threads,
    packages: result.packages,
    exceptions: result.exceptions,
    packageThreads: result.packageThreads,
    packageExceptions: result.packageExceptions,
    categories: result.categories,
    timeline: result.timeline,
    hourlyHeatmap: result.hourlyHeatmap,
    methods: result.methods,
    statuses: result.statuses,
    pods: result.pods,
    cacheStatuses: result.cacheStatuses,
    countries: result.countries,
    pops: result.pops,
    hosts: result.hosts,
    filterOptions: result.filterOptions,
    logTypes: result.logTypes,
    sourceFiles: result.sourceFiles
  });
}

function sendBatchFilterResponse(res, result) {
  return res.json({
    success: true,
    logType: result.logType,
    mode: result.mode || 'batch',
    batchLogType: result.batchLogType || 'error',
    sourceTypes: result.sourceTypes || {},
    summary: result.summary,
    results: result.results || [],
    correlation: result.correlation,
    levelCounts: result.levelCounts,
    loggerDist: result.loggers,
    threadDist: result.threads,
    loggers: result.loggers,
    threads: result.threads,
    packages: result.packages,
    exceptions: result.exceptions,
    packageThreads: result.packageThreads,
    packageExceptions: result.packageExceptions,
    categories: result.categories,
    timeline: result.timeline,
    hourlyHeatmap: result.hourlyHeatmap,
    methods: result.methods,
    statuses: result.statuses,
    pods: result.pods,
    cacheStatuses: result.cacheStatuses,
    countries: result.countries,
    pops: result.pops,
    hosts: result.hosts,
    filterOptions: result.filterOptions,
    logTypes: result.logTypes,
    sourceFiles: result.sourceFiles
  });
}

function createMultiErrorRouter() {
  const router = express.Router();

  router.post('/analyze/batch', async (req, res) => {
    const { input, filters } = req.body;

    try {
      if (!input) {
        throw new Error('Please provide two or more log paths.');
      }

      const result = await analyzeLogBatch(input, filters || {});
      sendBatchAnalyzeResponse(res, result);
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/filter/batch', async (req, res) => {
    const { input } = req.body;

    try {
      if (!input) {
        throw new Error('Please provide two or more log paths.');
      }

      const filters = buildBatchFiltersFromBody(req.body);
      const result = await analyzeLogBatchFilters(input, filters);
      sendBatchFilterResponse(res, result);
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/raw-events/batch', async (req, res) => {
    const { input } = req.body;

    try {
      if (!input) {
        throw new Error('Batch input required.');
      }

      const result = await getLogBatchPage(input, req.body);
      res.json(result);
    } catch (error) {
      return res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/analyze/multi-error', async (req, res) => {
    const { input, filters } = req.body;

    try {
      if (!input) {
        throw new Error('Please provide two or more error log paths.');
      }

      const result = await analyzeMultiError(input, filters || {});
      sendBatchAnalyzeResponse(res, result);
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/filter/multi-error', async (req, res) => {
    const { input } = req.body;

    try {
      if (!input) {
        throw new Error('Please provide two or more error log paths.');
      }

      const filters = buildBatchFiltersFromBody(req.body);
      const result = await analyzeMergedErrorFilters(input, filters);
      sendBatchFilterResponse(res, {
        ...result,
        logType: 'multi-error',
        mode: 'batch',
        batchLogType: 'error',
        sourceTypes: { error: Array.isArray(input) ? input.length : String(input).split(',').filter(Boolean).length }
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/raw-events/multi-error', async (req, res) => {
    const { input, page = 1, perPage = 50 } = req.body;

    try {
      if (!input) {
        throw new Error('Multi-error input required.');
      }

      const filters = buildBatchFiltersFromBody(req.body);
      const { entries: events, total, levelCounts: _filteredLevelCounts, ...stats } = await countAndExtractMultiErrorEntries(
        input,
        filters,
        Number(page),
        Number(perPage)
      );
      const baseCounts = await analyzeMergedErrorFilters(input, withoutLevelFilter(filters));

      return res.json({
        success: true,
        total,
        page: Number(page),
        perPage: Number(perPage),
        totalPages: Math.ceil(total / perPage),
        events,
        logType: 'multi-error',
        mode: 'batch',
        batchLogType: 'error',
        levelCounts: baseCounts.levelCounts,
        loggerDist: stats.loggers,
        threadDist: stats.threads,
        ...stats
      });
    } catch (error) {
      return res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

module.exports = createMultiErrorRouter;
