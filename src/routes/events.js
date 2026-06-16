/* === Imports === */
const crypto = require('crypto');
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

function validatePagination(page, perPage) {
  let p = Number(page);
  let pp = Number(perPage);
  if (!Number.isFinite(p) || p < 1) p = 1;
  if (!Number.isFinite(pp) || pp < 1) pp = 50;
  return { page: p, perPage: pp };
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
    const { filePath, page = 1, perPage = 50, level, search,
            from, to, startDate, endDate,
            logger, thread, package: pkg, exception, category,
            httpMethod, requestPath,
            method, httpStatus, minResponseTime, maxResponseTime, pod,
            cache, clientCountry, pop, host, minTtfb, maxTtfb } = req.body;

    const { page: safePage, perPage: safePerPage } = validatePagination(page, perPage);

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
        const requestDateFrom = from || startDate;
        const requestDateTo = to || endDate;
        const requestFilters = { search, from: requestDateFrom, to: requestDateTo, method, status: httpStatus, minTime: minResponseTime, maxTime: maxResponseTime, pod };
        const { total, entries: rawEvents } = stream
          ? await countAndExtractRequestEntriesFromStream(stream, requestFilters, safePage, safePerPage)
          : await countAndExtractRequestEntries(targetPath, requestFilters, safePage, safePerPage);

        const events = rawEvents.map((ev, i) => ({ ...ev, id: crypto.randomUUID() }));
        const totalPages = Math.ceil(total / safePerPage);

        return res.json({
          success: true,
          total,
          page: safePage,
          perPage: safePerPage,
          totalPages: Number.isFinite(totalPages) ? totalPages : 1,
          events,
          logType: 'request'
        });
      }

      /* CDN log: filter by cache status, country, PoP, host, TTFB */
      if (logType === 'cdn') {
        const cdnDateFrom = from || startDate;
        const cdnDateTo = to || endDate;
        const cdnFilters = { search, from: cdnDateFrom, to: cdnDateTo, method, status: httpStatus, cache, country: clientCountry, pop, host, minTtfb, maxTtfb };
        const { total, entries: rawEvents } = stream
          ? await countAndExtractCDNEntriesFromStream(stream, cdnFilters, safePage, safePerPage)
          : await countAndExtractCDNEntries(targetPath, cdnFilters, safePage, safePerPage);

        const events = rawEvents.map((ev) => ({ ...ev, id: crypto.randomUUID() }));
        const totalPages = Math.ceil(total / safePerPage);

        return res.json({
          success: true,
          total,
          page: safePage,
          perPage: safePerPage,
          totalPages: Number.isFinite(totalPages) ? totalPages : 1,
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

      /* Build filter with support for level, logger, thread, pod, package, exception, category */
      const errDateFrom = from || startDate;
      const errDateTo = to || endDate;
      const activeFilters = { level, search, from: errDateFrom, to: errDateTo, logger, thread, pod, package: pkg, exception, category, httpMethod, requestPath };
      const { entries: rawEvents, total, levelCounts } = await extractPageWithBaseCounts(
        targetPath,
        activeFilters,
        safePage,
        safePerPage
      );

      const events = rawEvents.map((ev) => ({ ...ev, id: crypto.randomUUID() }));
      const totalPages = Math.ceil(total / safePerPage);

      /* Return paginated results with total count and level counts for filter chips */
      res.json({
        success: true,
        total,
        page: safePage,
        perPage: safePerPage,
        totalPages: Number.isFinite(totalPages) ? totalPages : 1,
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
