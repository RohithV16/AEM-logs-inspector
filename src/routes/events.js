/* === Imports === */
const express = require('express');
const { detectLogTypeAndCreateStream } = require('../parser');
const { buildEntryFilter, extractPageWithBaseCounts } = require('../services/errorLogService');
const { buildRequestFilter, countAndExtractRequestEntries, countAndExtractRequestEntriesFromStream } = require('../services/requestLogService');
const { buildCDNFilter, countAndExtractCDNEntries, countAndExtractCDNEntriesFromStream } = require('../services/cdnLogService');
const { validateFilePath, sanitizeErrorMessage } = require('../utils/files');
const { isSafeRegex } = require('../utils/regex');

function withoutLevelFilter(filters = {}) {
  const normalized = { ...(filters || {}) };
  delete normalized.level;
  delete normalized.severity;
  return normalized;
}

/**
 * Creates the events router with endpoints for paginated log event retrieval
 * @returns {express.Router} Express router with events endpoints
 */
function createEventsRouter() {
  const router = express.Router();

  /* === POST /api/raw-events === */
  /* Paginated endpoint for retrieving individual log entries with optional filtering */
  router.post('/raw-events', async (req, res) => {
    /* Destructure with defaults for pagination parameters */
    const { filePath, page = 1, perPage = 50, level, search, from, to,
            logger, thread, package: pkg, exception, category,
            httpMethod, requestPath,
            method, httpStatus, minResponseTime, maxResponseTime, pod,
            cache, clientCountry, pop, host, minTtfb, maxTtfb } = req.body;

    try {
      let targetPath;

      if (filePath) {
        targetPath = validateFilePath(filePath);
      } else {
        throw new Error('File path required.');
      }

      /* Detect log type to apply appropriate filter and extraction logic */
      const { logType, stream } = await detectLogTypeAndCreateStream(targetPath, {
        logOptions: { levels: 'all' }
      });

      /* Request log: filter by method, status, response time, pod */
      if (logType === 'request') {
        const requestFilters = { search, from, to, method, status: httpStatus, minTime: minResponseTime, maxTime: maxResponseTime, pod };
        const { total, entries: events } = stream
          ? await countAndExtractRequestEntriesFromStream(stream, requestFilters, Number(page), Number(perPage))
          : await countAndExtractRequestEntries(targetPath, requestFilters, Number(page), Number(perPage));

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

      /* CDN log: filter by cache status, country, PoP, host, TTFB */
      if (logType === 'cdn') {
        const cdnFilters = { search, from, to, method, status: httpStatus, cache, country: clientCountry, pop, host, minTtfb, maxTtfb };
        const { total, entries: events } = stream
          ? await countAndExtractCDNEntriesFromStream(stream, cdnFilters, Number(page), Number(perPage))
          : await countAndExtractCDNEntries(targetPath, cdnFilters, Number(page), Number(perPage));

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

      /* AEM Error log: validate regex before building filter for security */
      if (search) {
        const regexValidation = isSafeRegex(search);
        if (regexValidation && regexValidation.error) {
          return res.json({ success: false, error: regexValidation.error });
        }
      }

      /* Build filter with support for level, logger, thread, package, exception, category */
      const activeFilters = { level, search, from, to, logger, thread, package: pkg, exception, category, httpMethod, requestPath };
      const { entries: events, total, levelCounts } = await extractPageWithBaseCounts(
        targetPath,
        activeFilters,
        Number(page),
        Number(perPage)
      );

      /* Return paginated results with total count and level counts for filter chips */
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
      /* Sanitize error to prevent XSS in client response */
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

/* === Module Exports === */
module.exports = createEventsRouter;
