/* === Imports === */
const express = require('express');
const { detectLogTypeAndCreateStream, parseLogFile, createLogStream, createRequestLogStream, createCDNLogStream } = require('../parser');
const { buildEntryFilter } = require('../services/errorLogService');
const { buildRequestFilter: buildRequestFilterSvc } = require('../services/requestLogService');
const { buildCDNFilter: buildCDNFilterSvc } = require('../services/cdnLogService');
const { analyzeEntries, getSummaryFromEntries, getTimelineData, filterAndAnalyzeStream, buildErrorFilterStats, getTrendComparison } = require('../analyzer');
const { validateFilePath, sanitizeErrorMessage, shouldUseStream } = require('../utils/files');
const { storeLogFile, findStoredFileByOriginalPath } = require('../utils/logStorage');
const { MAX_FILE_SIZE } = require('../utils/constants');
const { isSafeRegex } = require('../utils/regex');

/**
 * Creates the filter router with endpoints for filtered log analysis
 * @returns {express.Router} Express router with filter endpoints
 */
function createFilterRouter() {
  const router = express.Router();

  // Log all requests to filter router
  router.use((req, res, next) => {
    console.log('Filter router received:', req.method, '/api/filter' + req.path);
    next();
  });

  router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Filter router test works!' });
  });

  function validateRegexFilters(filters = {}) {
    const regexFields = ['search', 'logger', 'thread'];

    for (const field of regexFields) {
      const rawValue = filters[field];
      const candidates = Array.isArray(rawValue) ? rawValue : [rawValue];

      for (const candidate of candidates) {
        if (!candidate) continue;
        const regexValidation = isSafeRegex(String(candidate));
        if (regexValidation && regexValidation.error) {
          throw new Error(regexValidation.error);
        }
      }
    }
  }

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

      let storageWarning = null;
      try {
        const stored = storeLogFile(targetPath);
        targetPath = stored.storedPath;
      } catch (storageError) {
        storageWarning = storageError.message;
        console.error('Failed to store log file:', storageError.message);
      }

      validateRegexFilters(filters || {});
      
      /* Detect log type to apply appropriate filtering logic */
      const { logType, stream } = await detectLogTypeAndCreateStream(targetPath);
      
      /* Request log filtering - aggregates by method, status, pod, and time */
      if (logType === 'request') {
        const requestFilters = filters || {};
        const filter = buildRequestFilterSvc(requestFilters);
        const requestStream = stream || createRequestLogStream(targetPath);
        
        const methods = {};
        const statuses = {};
        const pods = {};
        let totalRequests = 0;
        let totalResponseTime = 0;
        const responseTimes = [];
        const timeline = {};
        
        for await (const entry of requestStream) {
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
          pods,
          storageWarning
        });
      }
      
      /* CDN log filtering - aggregates by cache status, country, PoP, and host */
      if (logType === 'cdn') {
        const cdnFilters = filters || {};
        const filter = buildCDNFilterSvc(cdnFilters);
        const cdnStream = stream || createCDNLogStream(targetPath);
        
        const methods = {};
        const statuses = {};
        const cacheStatuses = {};
        const countries = {};
        const pops = {};
        const hosts = {};
        let totalRequests = 0;
        let totalTtfb = 0;
        let totalTtlb = 0;
        const timeline = {};
        
        for await (const entry of cdnStream) {
          if (!filter(entry)) continue;
          
          totalRequests++;
          if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
          if (entry.status) statuses[entry.status] = (statuses[entry.status] || 0) + 1;
          if (entry.cache) cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
          if (entry.clientCountry) countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
          if (entry.pop) pops[entry.pop] = (pops[entry.pop] || 0) + 1;
          if (entry.ttfb) totalTtfb += entry.ttfb;
        if (entry.ttlb) totalTtlb += entry.ttlb;
        if (entry.host) hosts[entry.host] = (hosts[entry.host] || 0) + 1;
          if (entry.timestamp) {
            const hour = entry.timestamp.substring(0, 13);
            if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
            timeline[hour].requests++;
            if (entry.status >= 400) timeline[hour].errors++;
            if (entry.cache === 'HIT') timeline[hour].cacheHits++;
          }
        }
        
        const avgTtfb = totalRequests > 0 ? Math.round(totalTtfb / totalRequests) : 0;
        const avgTtlb = totalRequests > 0 ? Math.round(totalTtlb / totalRequests) : 0;
        const cacheHitsCount = (cacheStatuses['HIT'] || 0) + (cacheStatuses['TCP_HIT'] || 0);
        const cacheHitRatio = totalRequests > 0 ? ((cacheHitsCount / totalRequests) * 100).toFixed(1) : 0;
        
        return res.json({
          success: true,
          logType: 'cdn',
          summary: { 
            totalRequests,
            avgTtfb,
            avgTtlb,
            cacheHitRatio,
            cacheHits: cacheHitsCount,
            cacheMisses: totalRequests - cacheHitsCount
          },
          timeline,
          methods,
          statuses,
          cacheStatuses,
          countries,
          pops,
          hosts,
          storageWarning
        });
      }
      
      /* AEM Error Log Filtering */
      /* Complex filtering with date range, logger, thread, package, and regex support */
      
      /* Choose streaming or in-memory approach based on file size */
      /* Streaming required for files > 50MB to avoid memory issues */
      const useStream = shouldUseStream(targetPath);
      
      if (useStream) {
        /* For large files: stream through data and apply filters incrementally */
        const filtered = await filterAndAnalyzeStream(stream || createLogStream(targetPath), filters);
        const httpMethods = filtered.httpMethods || {};
        return res.json({
          success: true,
          summary: filtered.summary,
          results: filtered.results,
          timeline: filtered.timeline,
          loggerDist: filtered.loggers,
          filterError: filtered.filterError,
          hourlyHeatmap: filtered.hourlyHeatmap || {},
          threadDist: filtered.threads,
          logType: 'error',
          loggers: filtered.loggers,
          threads: filtered.threads,
          packages: filtered.packages,
          exceptions: filtered.exceptions,
          httpMethods,
          packageThreads: filtered.packageThreads,
          packageExceptions: filtered.packageExceptions,
          categories: Object.keys(filtered.categories || {}).sort(),
          storageWarning
        });
      } else {
        /* For smaller files: load all entries into memory for faster filtering */
        let entries;

        if (stream) {
          entries = [];
          for await (const entry of stream) {
            entries.push(entry);
          }
        } else {
          entries = parseLogFile(targetPath);
        }

        if (filters) {
          /* Date range filter - must be applied first as it's most restrictive */
          if (filters.startDate || filters.endDate) {
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start && isNaN(start.getTime())) throw new Error('Invalid start date');
            if (end && isNaN(end.getTime())) throw new Error('Invalid end date');
          }

          const filter = buildEntryFilter(filters);
          entries = entries.filter(filter);
        }

        const stats = buildErrorFilterStats(entries);
        /* Aggregate filtered entries into grouped results */
        const results = analyzeEntries(entries);
        const summary = getSummaryFromEntries(entries);
        const timeline = getTimelineData(entries);
        const loggerDist = stats.loggers;
        const threadDist = stats.threads;
        const packageDist = stats.packages;
        const exceptionDist = stats.exceptions;
        const httpMethods = stats.httpMethods || {};
        const packageThreads = stats.packageThreads;
        const packageExceptions = stats.packageExceptions;
        const categories = Object.keys(stats.categories).sort();
        const hourlyHeatmap = stats.hourlyHeatmap;
        return res.json({
          success: true,
          summary,
          results,
          timeline,
          loggerDist,
          filterError: null,
          hourlyHeatmap,
          threadDist,
          logType: 'error',
          loggers: loggerDist,
          threads: threadDist,
          packages: packageDist,
          exceptions: exceptionDist,
          httpMethods,
packageThreads,
          packageExceptions,
          categories,
          storageWarning
        });
      }
    } catch (error) {
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
      const parsedDays = Number(days);

      if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
        throw new Error('Days must be a positive integer.');
      }

      /* Compare error patterns across specified number of days */
      const trend = await getTrendComparison(targetPath, parsedDays);
      res.json({ success: true, trend });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === GET /api/filter/scan === */
  /* Scan storage folder and return nested file tree */
  router.get('/scan', async (req, res) => {
    try {
      const { scanStorageFolder, getStorageDir } = require('../utils/logStorage');
      const tree = scanStorageFolder();
      const storageDir = getStorageDir();
      res.json({
        success: true,
        storageDir,
        tree
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === POST /api/filter/analyze-batch === */
  /* Analyze selected files (max 5) */
  router.post('/analyze-batch', async (req, res) => {
    const { filePaths } = req.body;
    
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return res.json({ success: false, error: 'No files provided' });
    }
    
    if (filePaths.length > 5) {
      return res.json({ success: false, error: 'Maximum 5 files allowed' });
    }
    
    try {
      const { getStoredFile, getStorageDir } = require('../utils/logStorage');
      const { analyzeEntries, getSummaryFromEntries, getTimelineData, buildErrorFilterStats } = require('../analyzer');
      const { detectLogTypeAndCreateStream, parseLogFile } = require('../parser');
      const { validateFilePath } = require('../utils/files');
      
      const results = [];
      
      for (const fileId of filePaths) {
        const storedFile = getStoredFile(fileId);
        
        if (!storedFile) {
          results.push({ fileId, success: false, error: 'File not found' });
          continue;
        }
        
        try {
          const targetPath = validateFilePath(storedFile.storedPath);
          const { logType, stream } = await detectLogTypeAndCreateStream(targetPath);
          
          let entries;
          if (stream) {
            entries = [];
            for await (const entry of stream) {
              entries.push(entry);
            }
          } else {
            entries = parseLogFile(targetPath);
          }
          
          const stats = buildErrorFilterStats(entries);
          const analysisResults = analyzeEntries(entries);
          const summary = getSummaryFromEntries(entries);
          const timeline = getTimelineData(entries);
          
          results.push({
            fileId,
            success: true,
            logType,
            summary,
            results: analysisResults,
            timeline,
            loggerDist: stats.loggers,
            threadDist: stats.threads,
            packages: stats.packages,
            exceptions: stats.exceptions,
            fileName: storedFile.fileName,
            originalPath: storedFile.originalPath
          });
        } catch (fileError) {
          results.push({ fileId, success: false, error: fileError.message });
        }
      }
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === GET /api/filter/stored === */
  /* List all stored log files */
  router.get('/stored', async (req, res) => {
    try {
      const { listStoredFiles, getStorageDir } = require('../utils/logStorage');
      const files = listStoredFiles();
      const storageDir = getStorageDir();
      res.json({
        success: true,
        storageDir,
        files
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === DELETE /api/filter/stored/:id === */
  /* Delete a stored log file */
  router.delete('/stored/:id', async (req, res) => {
    try {
      const { deleteStoredFile } = require('../utils/logStorage');
      const { id } = req.params;
      const deleted = deleteStoredFile(id);
      res.json({ success: deleted });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === POST /api/filter/stored/:id/analyze === */
  /* Analyze a stored log file */
  router.post('/stored/:id/analyze', async (req, res) => {
    try {
      const { getStoredFile } = require('../utils/logStorage');
      const { id } = req.params;
      const storedFile = getStoredFile(id);
      
      if (!storedFile) {
        return res.json({ success: false, error: 'Stored file not found' });
      }
      
      const targetPath = validateFilePath(storedFile.storedPath);
      validateRegexFilters(req.body.filters || {});
      
      const { logType, stream } = await detectLogTypeAndCreateStream(targetPath);
      const filters = req.body.filters || {};
      
      if (logType === 'request') {
        const requestFilters = filters;
        const filter = buildRequestFilterSvc(requestFilters);
        const requestStream = stream || createRequestLogStream(targetPath);
        
        const methods = {};
        const statuses = {};
        const pods = {};
        let totalRequests = 0;
        let totalResponseTime = 0;
        const responseTimes = [];
        const timeline = {};
        
        for await (const entry of requestStream) {
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
      
      if (logType === 'cdn') {
        const cdnFilters = filters;
        const filter = buildCDNFilterSvc(cdnFilters);
        const cdnStream = stream || createCDNLogStream(targetPath);
        
        const methods = {};
        const statuses = {};
        const cacheStatuses = {};
        const countries = {};
        const pops = {};
        const hosts = {};
        let totalRequests = 0;
        let totalTtfb = 0;
        let totalTtlb = 0;
        const timeline = {};
        
        for await (const entry of cdnStream) {
          if (!filter(entry)) continue;
          
          totalRequests++;
          if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
          if (entry.status) statuses[entry.status] = (statuses[entry.status] || 0) + 1;
          if (entry.cache) cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
          if (entry.clientCountry) countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
          if (entry.pop) pops[entry.pop] = (pops[entry.pop] || 0) + 1;
          if (entry.ttfb) totalTtfb += entry.ttfb;
          if (entry.ttlb) totalTtlb += entry.ttlb;
          if (entry.host) hosts[entry.host] = (hosts[entry.host] || 0) + 1;
          if (entry.timestamp) {
            const hour = entry.timestamp.substring(0, 13);
            if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
            timeline[hour].requests++;
            if (entry.status >= 400) timeline[hour].errors++;
            if (entry.cache === 'HIT') timeline[hour].cacheHits++;
          }
        }
        
        const avgTtfb = totalRequests > 0 ? Math.round(totalTtfb / totalRequests) : 0;
        const avgTtlb = totalRequests > 0 ? Math.round(totalTtlb / totalRequests) : 0;
        const cacheHitsCount = (cacheStatuses['HIT'] || 0) + (cacheStatuses['TCP_HIT'] || 0);
        const cacheHitRatio = totalRequests > 0 ? ((cacheHitsCount / totalRequests) * 100).toFixed(1) : 0;
        
        return res.json({
          success: true,
          logType: 'cdn',
          summary: { 
            totalRequests,
            avgTtfb,
            avgTtlb,
            cacheHitRatio,
            cacheHits: cacheHitsCount,
            cacheMisses: totalRequests - cacheHitsCount
          },
          timeline,
          methods,
          statuses,
          cacheStatuses,
          countries,
          pops,
          hosts
        });
      }
      
      const useStream = shouldUseStream(targetPath);
      
      if (useStream) {
        const filtered = await filterAndAnalyzeStream(stream || createLogStream(targetPath), filters);
        const httpMethods = filtered.httpMethods || {};
        return res.json({
          success: true,
          summary: filtered.summary,
          results: filtered.results,
          timeline: filtered.timeline,
          loggerDist: filtered.loggers,
          filterError: filtered.filterError,
          hourlyHeatmap: filtered.hourlyHeatmap || {},
          threadDist: filtered.threads,
          logType: 'error',
          loggers: filtered.loggers,
          threads: filtered.threads,
          packages: filtered.packages,
          exceptions: filtered.exceptions,
          httpMethods,
          packageThreads: filtered.packageThreads,
          packageExceptions: filtered.packageExceptions,
          categories: Object.keys(filtered.categories || {}).sort()
        });
      }
      
      let entries;
      if (stream) {
        entries = [];
        for await (const entry of stream) {
          entries.push(entry);
        }
      } else {
        entries = parseLogFile(targetPath);
      }

      if (filters) {
        if (filters.startDate || filters.endDate) {
          const start = filters.startDate ? new Date(filters.startDate) : null;
          const end = filters.endDate ? new Date(filters.endDate) : null;
          if (start && isNaN(start.getTime())) throw new Error('Invalid start date');
          if (end && isNaN(end.getTime())) throw new Error('Invalid end date');
        }

        const filter = buildEntryFilter(filters);
        entries = entries.filter(filter);
      }

      const stats = buildErrorFilterStats(entries);
      const results = analyzeEntries(entries);
      const summary = getSummaryFromEntries(entries);
      const timeline = getTimelineData(entries);
      const loggerDist = stats.loggers;
      const threadDist = stats.threads;
      const packageDist = stats.packages;
      const exceptionDist = stats.exceptions;
      const httpMethods = stats.httpMethods || {};
      const packageThreads = stats.packageThreads;
      const packageExceptions = stats.packageExceptions;
      const categories = Object.keys(stats.categories).sort();
      const hourlyHeatmap = stats.hourlyHeatmap;
      return res.json({
        success: true,
        summary,
        results,
        timeline,
        loggerDist,
        filterError: null,
        hourlyHeatmap,
        threadDist,
        logType: 'error',
        loggers: loggerDist,
        threads: threadDist,
        packages: packageDist,
        exceptions: exceptionDist,
        httpMethods,
        packageThreads,
        packageExceptions,
        categories
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

/* === Module Exports === */
module.exports = createFilterRouter;
