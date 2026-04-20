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
            httpMethod, requestPath, url,
            method, httpStatus, minResponseTime, maxResponseTime, pod,
            clientIp, referrer, userAgent,
            cache, clientCountry, pop, host, minTtfb, maxTtfb,
            requestId, aemEnvKind, aemTenant, rules } = req.body;

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

      /* Request log: filter by method, status, response time, pod, clientIp, referrer, userAgent, url */
      if (logType === 'request') {
        const requestFilters = { 
          search, from, to, method, status: httpStatus, 
          minTime: minResponseTime, maxTime: maxResponseTime, pod,
          clientIp, referrer, userAgent, url 
        };
        const { total, entries: events, methods, statuses, pods, clientIps, referrers, userAgents, urls } = stream
          ? await countAndExtractRequestEntriesFromStream(stream, requestFilters, Number(page), Number(perPage))
          : await countAndExtractRequestEntries(targetPath, requestFilters, Number(page), Number(perPage));

        return res.json({
          success: true,
          total,
          page: Number(page),
          perPage: Number(perPage),
          totalPages: Math.ceil(total / perPage),
          events,
          logType: 'request',
          methods,
          statuses,
          pods,
          clientIps,
          referrers,
          userAgents,
          urls
        });
      }

      /* CDN log: filter by cache status, country, PoP, host, TTFB, requestId, aemEnvKind, aemTenant, rules, url */
      if (logType === 'cdn') {
        const cdnFilters = { 
          search, from, to, method, status: httpStatus, 
          cache, country: clientCountry, pop, host, 
          minTtfb, maxTtfb,
          requestId, aemEnvKind, aemTenant, rules, url
        };
        const { total, entries: events, methods, statuses, cacheStatuses, countries, pops, hosts, requestIds, aemEnvKinds, aemTenants, ruleSets, urls } = stream
          ? await countAndExtractCDNEntriesFromStream(stream, cdnFilters, Number(page), Number(perPage))
          : await countAndExtractCDNEntries(targetPath, cdnFilters, Number(page), Number(perPage));

        return res.json({
          success: true,
          total,
          page: Number(page),
          perPage: Number(perPage),
          totalPages: Math.ceil(total / perPage),
          events,
          logType: 'cdn',
          methods,
          statuses,
          cacheStatuses,
          countries,
          pops,
          hosts,
          requestIds,
          aemEnvKinds,
          aemTenants,
          ruleSets,
          urls
        });
      }

      /* AEM Error log: validate regex before building filter for security */
      if (search) {
        const regexValidation = isSafeRegex(search);
        if (regexValidation && regexValidation.error) {
          return res.json({ success: false, error: regexValidation.error });
        }
      }

      /* Build filter with support for level, logger, thread, pod, package, exception, category, url */
      const activeFilters = { level, search, from, to, logger, thread, pod, package: pkg, exception, category, httpMethod, requestPath, url };
      const { 
        entries: events, total, levelCounts, loggers, packages, threads, exceptions,
        methods, statuses, pods, cacheStatuses, countries, pops, hosts, urls 
      } = await extractPageWithBaseCounts(
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
        packages,
        loggers,
        threads,
        exceptions,
        methods,
        statuses: (statuses || []).map(String),
        pods,
        cacheStatuses,
        countries,
        pops,
        hosts,
        urls,
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
