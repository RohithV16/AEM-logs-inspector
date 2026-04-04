const express = require('express');
const {
  analyzeMultiError,
  analyzeMergedErrorFilters,
  countAndExtractMultiErrorEntries
} = require('../services/multiErrorAnalysisService');
const { sanitizeErrorMessage } = require('../utils/files');

function withoutLevelFilter(filters = {}) {
  const normalized = { ...(filters || {}) };
  delete normalized.level;
  delete normalized.severity;
  return normalized;
}

function createMultiErrorRouter() {
  const router = express.Router();

  router.post('/analyze/multi-error', async (req, res) => {
    const { input, filters } = req.body;

    try {
      if (!input) {
        throw new Error('Please provide two or more error log paths.');
      }

      const result = await analyzeMultiError(input, filters || {});
      res.json({
        success: true,
        logType: 'multi-error',
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
        hourlyHeatmap: result.hourlyHeatmap
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/filter/multi-error', async (req, res) => {
    const { input, filters } = req.body;

    try {
      if (!input) {
        throw new Error('Please provide two or more error log paths.');
      }

      const result = await analyzeMergedErrorFilters(input, filters || {});
      res.json({
        success: true,
        logType: 'multi-error',
        summary: result.summary,
        results: result.results,
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
        hourlyHeatmap: result.hourlyHeatmap
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/raw-events/multi-error', async (req, res) => {
    const {
      input,
      page = 1,
      perPage = 50,
      filters = {},
      advancedRules,
      search,
      level,
      logger,
      thread,
      package: pkg,
      exception,
      category,
      startDate,
      endDate,
      from,
      to,
      hourOfDay,
      severity,
      sourceFile
    } = req.body;

    try {
      if (!input) {
        throw new Error('Multi-error input required.');
      }

      const mergedFilters = { ...(filters || {}) };
      const overlay = {
        advancedRules,
        search,
        level,
        logger,
        thread,
        package: pkg,
        exception,
        category,
        startDate,
        endDate,
        from,
        to,
        hourOfDay,
        severity,
        sourceFile
      };

      Object.entries(overlay).forEach(([key, value]) => {
        if (value !== undefined) {
          mergedFilters[key] = value;
        }
      });

      const { entries: events, total, levelCounts: _filteredLevelCounts, ...stats } = await countAndExtractMultiErrorEntries(
        input,
        mergedFilters,
        Number(page),
        Number(perPage)
      );
      const baseCounts = await analyzeMergedErrorFilters(input, withoutLevelFilter(mergedFilters));

      return res.json({
        success: true,
        total,
        page: Number(page),
        perPage: Number(perPage),
        totalPages: Math.ceil(total / perPage),
        events,
        logType: 'multi-error',
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
