/* === Imports === */
const express = require('express');
const { detectLogType, createLogStream, createRequestLogStream, createCDNLogStream, parseLogFile } = require('../parser');
const { buildEntryFilter, buildRequestFilter, buildCDNFilter } = require('../services/errorLogService');
const { buildRequestFilter: buildRequestFilterSvc } = require('../services/requestLogService');
const { buildCDNFilter: buildCDNFilterSvc } = require('../services/cdnLogService');
const { analyzeEntries, getSummaryFromEntries, getTimelineData, getLoggerDistribution, getHourlyHeatmap, getThreadDistribution, filterAndAnalyzeStream, getTimelineDataStream, getLoggerDistributionStream, getTrendComparison } = require('../analyzer');
const { filterByDateRange, filterByLogger, filterByThread, filterByRegex, filterByPackage } = require('../analyzer');
const { validateFilePath, sanitizeErrorMessage, shouldUseStream } = require('../utils/files');
const { MAX_FILE_SIZE } = require('../utils/constants');

/**
 * Creates the filter router with endpoints for filtered log analysis
 * @returns {express.Router} Express router with filter endpoints
 */
function createFilterRouter() {
  const router = express.Router();

  /* === POST /api/filter === */
  /* Apply filters to log entries and return aggregated statistics */
  router.post('/filter', async (req, res) => {
    const { filePath, filters } = req.body;
    
    try {
      let targetPath;
      
      if (filePath) {
        targetPath = validateFilePath(filePath);
      } else {
        throw new Error('No file path provided');
      }
      
      /* Detect log type to apply appropriate filtering logic */
      const logType = await detectLogType(targetPath);
      
      /* Request log filtering - aggregates by method, status, pod, and time */
      if (logType === 'request') {
        const requestFilters = filters || {};
        const filter = buildRequestFilterSvc(requestFilters);
        const stream = createRequestLogStream(targetPath);
        
        const methods = {};
        const statuses = {};
        const pods = {};
        let totalRequests = 0;
        let totalResponseTime = 0;
        const responseTimes = [];
        const timeline = {};
        
        for await (const entry of stream) {
          if (!filter(entry)) continue;
          
          totalRequests++;
          if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
          if (entry.status) {
            statuses[entry.status] = (statuses[entry.status] || 0) + 1;
            responseTimes.push(entry.responseTime);
            totalResponseTime += entry.responseTime;
          }
          if (entry.pod) pods[entry.pod] = (pods[entry.pod] || 0) + 1;
          if (entry.timestamp) {
            const hour = entry.timestamp.substring(0, 13);
            if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0 };
            timeline[hour].requests++;
            if (entry.status >= 400) timeline[hour].errors++;
          }
        }
        
        responseTimes.sort((a, b) => a - b);
        const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / responseTimes.length) : 0;
        
        return res.json({
          success: true,
          logType: 'request',
          summary: { totalRequests, avgResponseTime },
          timeline,
          methods,
          statuses,
          pods
        });
      }
      
      /* CDN log filtering - aggregates by cache status, country, PoP, and host */
      if (logType === 'cdn') {
        const cdnFilters = filters || {};
        const filter = buildCDNFilterSvc(cdnFilters);
        const stream = createCDNLogStream(targetPath);
        
        const methods = {};
        const statuses = {};
        const cacheStatuses = {};
        const countries = {};
        const pops = {};
        const hosts = {};
        let totalRequests = 0;
        const timeline = {};
        
        for await (const entry of stream) {
          if (!filter(entry)) continue;
          
          totalRequests++;
          if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
          if (entry.status) statuses[entry.status] = (statuses[entry.status] || 0) + 1;
          if (entry.cache) cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
          if (entry.clientCountry) countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
          if (entry.pop) pops[entry.pop] = (pops[entry.pop] || 0) + 1;
          if (entry.host) hosts[entry.host] = (hosts[entry.host] || 0) + 1;
          if (entry.timestamp) {
            const hour = entry.timestamp.substring(0, 13);
            if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
            timeline[hour].requests++;
            if (entry.status >= 400) timeline[hour].errors++;
            if (entry.cache === 'HIT') timeline[hour].cacheHits++;
          }
        }
        
        return res.json({
          success: true,
          logType: 'cdn',
          summary: { totalRequests },
          timeline,
          methods,
          statuses,
          cacheStatuses,
          countries,
          pops,
          hosts
        });
      }
      
      /* AEM Error Log Filtering */
      /* Complex filtering with date range, logger, thread, package, and regex support */
      
      let results, summary, timeline, loggerDist, filterError = null;
      let hourlyHeatmap = {};
      let threadDist = {};
      
      /* Choose streaming or in-memory approach based on file size */
      /* Streaming required for files > 50MB to avoid memory issues */
      const useStream = shouldUseStream(targetPath);
      
      if (useStream) {
        /* For large files: stream through data and apply filters incrementally */
        const stream = createLogStream(targetPath);
        const filtered = await filterAndAnalyzeStream(stream, filters);
        results = filtered.results;
        summary = filtered.summary;
        filterError = filtered.filterError;

        /* Run timeline and logger distribution queries in parallel for performance */
        const [tlResult, ldResult] = await Promise.all([
          (async () => { const s = createLogStream(targetPath); return getTimelineDataStream(s); })(),
          (async () => { const s = createLogStream(targetPath); return getLoggerDistributionStream(s); })()
        ]);
        timeline = tlResult;
        loggerDist = ldResult;
      } else {
        /* For smaller files: load all entries into memory for faster filtering */
        let entries = parseLogFile(targetPath);

        if (filters) {
          /* Date range filter - must be applied first as it's most restrictive */
          if (filters.startDate || filters.endDate) {
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start && isNaN(start.getTime())) throw new Error('Invalid start date');
            if (end && isNaN(end.getTime())) throw new Error('Invalid end date');
            entries = filterByDateRange(entries, start, end);
          }
          /* Logger filter - filters entries by the logger that generated them */
          if (filters.logger) {
            const result = filterByLogger(entries, filters.logger);
            if (result.error) filterError = result.error;
            entries = result.entries;
          }
          /* Thread filter - filters by AEM thread name */
          if (filters.thread) {
            const result = filterByThread(entries, filters.thread);
            if (result.error) filterError = result.error;
            entries = result.entries;
          }
          /* Package filter - supports filtering by Java package (can be array) */
          if (filters.package) {
            const packages = Array.isArray(filters.package) ? filters.package : [filters.package];
            const result = filterByPackage(entries, packages);
            if (result.error) filterError = result.error;
            entries = result.entries;
          }
          /* Regex filter - most flexible but slowest; validate for safety first */
          if (filters.regex) {
            const result = filterByRegex(entries, filters.regex);
            if (result.error) filterError = result.error;
            entries = result.entries;
          }
        }

        /* Aggregate filtered entries into grouped results */
        results = analyzeEntries(entries);
        summary = getSummaryFromEntries(entries);
        timeline = getTimelineData(entries);
        loggerDist = getLoggerDistribution(entries);
        hourlyHeatmap = getHourlyHeatmap(entries);
        threadDist = getThreadDistribution(entries);
      }

      res.json({ success: true, summary, results, timeline, loggerDist, filterError, hourlyHeatmap, threadDist, logType: 'error' });
    } catch (error) {
      /* Sanitize error message to prevent XSS in client response */
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === POST /api/trend === */
  /* Compare error patterns across multiple days to identify trends */
  router.post('/trend', async (req, res) => {
    const { filePath, days } = req.body;
    try {
      if (!filePath) throw new Error('No file path provided');
      const targetPath = validateFilePath(filePath);

      /* Compare error patterns across specified number of days */
      const trend = await getTrendComparison(targetPath, days);
      res.json({ success: true, trend });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

/* === Module Exports === */
module.exports = createFilterRouter;
