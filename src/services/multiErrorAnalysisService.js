const path = require('path');
const { detectLogType } = require('../parser');
const { resolveAnalysisTargets } = require('../utils/files');
const { buildFilterOptionsFromStats, buildCorrelationData } = require('./correlationService');
const { extractExceptionNames } = require('./errorLogService');
const { normalizeMessage } = require('../grouper');
const { categorizeError } = require('../categorizer');
const {
  analyzeBatch,
  analyzeMergedErrorFilters: analyzeMergedErrorFiltersFromBatch,
  collectBatchEvents,
  countAndExtractBatchEntries,
  buildBatchEventMatcher
} = require('./batchAnalysisService');

function summarizeSourceTypes(sources = []) {
  return sources.reduce((acc, source) => {
    const type = source.logType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

function inferBatchLogType(sources = []) {
  const types = [...new Set(sources.map(source => source.logType).filter(Boolean))];
  if (!types.length) return 'error';
  if (types.length === 1) return types[0];
  return 'mixed';
}

function normalizeBatchResult(result, sources = []) {
  const batchLogType = inferBatchLogType(sources);
  return {
    ...result,
    logType: 'batch',
    mode: 'batch',
    batchLogType,
    sourceTypes: summarizeSourceTypes(sources)
  };
}

function createEmptyTypeStats() {
  return {
    methods: {},
    statuses: {},
    pods: {},
    cacheStatuses: {},
    countries: {},
    pops: {},
    hosts: {},
    timeline: {},
    logTypes: {},
    sourceFiles: {},
    totalRequests: 0,
    totalErrors: 0,
    totalWarnings: 0,
    cacheHits: 0,
    cacheMisses: 0,
    loggers: {},
    threads: {},
    packages: {},
    exceptions: {},
    categories: {}
  };
}

function incrementBucket(bucket, key, amount = 1) {
  if (key === null || key === undefined || key === '') return;
  bucket[key] = (bucket[key] || 0) + amount;
}

function getTimelineBucket(timeline, hour) {
  if (!hour) return null;
  if (!timeline[hour]) {
    timeline[hour] = { total: 0, requests: 0, errors: 0, warnings: 0, cacheHits: 0 };
  }
  return timeline[hour];
}

function collectTypeStats(stats, event) {
  incrementBucket(stats.logTypes, event.logType);
  incrementBucket(stats.sourceFiles, event.sourceName || event.sourceFile);

  if (event.logType === 'request' || event.logType === 'cdn') {
    stats.totalRequests++;
    incrementBucket(stats.methods, event.method);
    incrementBucket(stats.statuses, event.status);
  }

  if (event.logType === 'request') {
    incrementBucket(stats.pods, event.thread);
  }

  if (event.logType === 'cdn') {
    incrementBucket(stats.cacheStatuses, event.cache);
    incrementBucket(stats.countries, event.clientCountry);
    incrementBucket(stats.pops, event.pop);
    incrementBucket(stats.hosts, event.host);
    if (event.cache === 'HIT' || event.cache === 'TCP_HIT') stats.cacheHits++;
    if (event.cache === 'MISS' || event.cache === 'TCP_MISS') stats.cacheMisses++;
  }

  if (event.logType === 'error') {
    const severity = String(event.severity || event.level || '').toUpperCase();
    if (severity === 'ERROR') stats.totalErrors++;
    if (severity === 'WARN') stats.totalWarnings++;
    if (event.logger) {
      const parts = event.logger.split('.');
      const pkg = parts.length >= 2 ? parts[0] : event.logger;
      incrementBucket(stats.packages, pkg);
      incrementBucket(stats.loggers, event.logger);
    }
    if (event.thread) incrementBucket(stats.threads, event.thread);
    if (event.message || event.title) {
      const message = event.message || event.title || '';
      const exceptions = extractExceptionNames(message);
      exceptions.forEach(exc => incrementBucket(stats.exceptions, exc));
      
      if (severity === 'ERROR' || severity === 'WARN') {
        incrementBucket(stats.categories, categorizeError(message, event.logger || ''));
      }
    }
  } else if (event.status >= 400) {
    stats.totalErrors++;
  }

  const bucket = getTimelineBucket(stats.timeline, event.hour || (event.timestamp ? event.timestamp.substring(0, 13) : ''));
  if (!bucket) return;

  bucket.total++;
  if (event.logType === 'request' || event.logType === 'cdn') {
    bucket.requests++;
    if (event.status >= 400) bucket.errors++;
    if (event.logType === 'cdn' && (event.cache === 'HIT' || event.cache === 'TCP_HIT')) {
      bucket.cacheHits++;
    }
    return;
  }

  const severity = String(event.severity || event.level || '').toUpperCase();
  if (severity === 'ERROR') bucket.errors++;
  if (severity === 'WARN') bucket.warnings++;
}

function finalizeTypeStats(stats, batchLogType, baseSummary = {}) {
  const response = {
    timeline: stats.timeline,
    logTypes: stats.logTypes,
    sourceFiles: stats.sourceFiles,
    loggers: stats.loggers,
    threads: stats.threads,
    packages: stats.packages,
    exceptions: stats.exceptions,
    categories: Object.keys(stats.categories || {}).sort()
  };

  if (batchLogType === 'request') {
    response.methods = stats.methods;
    response.statuses = stats.statuses;
    response.pods = stats.pods;
    response.summary = {
      ...baseSummary,
      totalRequests: stats.totalRequests
    };
  } else if (batchLogType === 'cdn') {
    const totalRequests = stats.totalRequests;
    const cacheHitRatio = totalRequests > 0 ? ((stats.cacheHits / totalRequests) * 100).toFixed(1) : '0.0';
    response.methods = stats.methods;
    response.statuses = stats.statuses;
    response.cacheStatuses = stats.cacheStatuses;
    response.countries = stats.countries;
    response.pops = stats.pops;
    response.hosts = stats.hosts;
    response.summary = {
      ...baseSummary,
      totalRequests,
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      cacheHitRatio
    };
  } else if (batchLogType === 'mixed') {
    response.methods = stats.methods;
    response.statuses = stats.statuses;
    response.pods = stats.pods;
    response.cacheStatuses = stats.cacheStatuses;
    response.countries = stats.countries;
    response.pops = stats.pops;
    response.hosts = stats.hosts;
    response.summary = {
      ...baseSummary,
      totalRequests: stats.totalRequests,
      totalErrors: stats.totalErrors,
      totalWarnings: stats.totalWarnings
    };
  } else {
    response.summary = { ...baseSummary };
  }

  return response;
}

function overlayFilters(target, overlay = {}) {
  Object.entries(overlay).forEach(([key, value]) => {
    if (value !== undefined) {
      target[key] = value;
    }
  });
  return target;
}

function buildBatchFiltersFromBody(body = {}) {
  const {
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
    sourceFile,
    logType,
    method,
    httpStatus,
    status,
    pod,
    minResponseTime,
    maxResponseTime,
    cache,
    clientCountry,
    country,
    pop,
    host,
    minTtfb,
    maxTtfb,
    minTtlb,
    maxTtlb
  } = body;

  return overlayFilters({ ...(filters || {}) }, {
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
    sourceFile,
    logType,
    method,
    status: httpStatus || status,
    pod,
    minResponseTime,
    maxResponseTime,
    cache,
    country: clientCountry || country,
    pop,
    host,
    minTtfb,
    maxTtfb,
    minTtlb,
    maxTtlb
  });
}

async function resolveBatchSources(input) {
  const filePaths = resolveAnalysisTargets(input);
  const sources = [];

  if (filePaths.length < 2) {
    throw new Error('Please provide at least two log paths.');
  }

  for (const filePath of filePaths) {
    const logType = await detectLogType(filePath);
    sources.push({ filePath, logType });
  }

  return sources;
}

async function resolveMultiErrorSources(input) {
  const sources = await resolveBatchSources(input);

  for (const source of sources) {
    if (source.logType !== 'error') {
      throw new Error(`Multi-error analysis supports error logs only. Invalid file: ${path.basename(source.filePath)}`);
    }
  }

  return sources;
}

async function resolveBatchTargets(input) {
  const sources = await resolveBatchSources(input);
  return sources.map(source => source.filePath);
}

async function resolveMultiErrorTargets(input) {
  const sources = await resolveMultiErrorSources(input);
  return sources.map(source => source.filePath);
}

async function analyzeLogBatch(input, filters = {}, onProgress) {
  const sources = await resolveBatchSources(input);
  const result = await analyzeBatch(sources, filters, onProgress);
  return normalizeBatchResult(result, sources);
}

async function analyzeMultiError(input, filters = {}, onProgress) {
  const sources = await resolveMultiErrorSources(input);
  const result = await analyzeBatch(sources, filters, onProgress);

  return {
    ...normalizeBatchResult(result, sources),
    logType: 'multi-error',
    batchLogType: 'error'
  };
}

async function collectBatchAnalysisEvents(input, filters = {}, options = {}) {
  const sources = await resolveBatchSources(input);
  return collectBatchEvents(sources, filters, options);
}

async function collectMultiErrorEvents(input, filters = {}, options = {}) {
  const sources = await resolveMultiErrorSources(input);
  return collectBatchEvents(sources, filters, options);
}

async function countAndExtractLogBatchEntries(input, filters = {}, page = 1, pageSize = 50) {
  const sources = await resolveBatchSources(input);
  return countAndExtractBatchEntries(sources, filters, page, pageSize);
}

async function countAndExtractMultiErrorEntries(input, filters = {}, page = 1, pageSize = 50) {
  const sources = await resolveMultiErrorSources(input);
  return countAndExtractBatchEntries(sources, filters, page, pageSize);
}

async function analyzeMergedErrorFilters(input, filters = {}) {
  const sources = await resolveMultiErrorSources(input);
  return analyzeMergedErrorFiltersFromBatch(sources, filters);
}

async function analyzeLogBatchFilters(input, filters = {}) {
  const sources = await resolveBatchSources(input);
  const batchLogType = inferBatchLogType(sources);

  if (batchLogType === 'error') {
    const result = await analyzeMergedErrorFiltersFromBatch(sources, filters);
    return {
      ...result,
      logType: 'batch',
      mode: 'batch',
      batchLogType,
      sourceTypes: summarizeSourceTypes(sources)
    };
  }

  const events = await collectBatchEvents(sources, filters, { includeStackTrace: true });
  const stats = createEmptyTypeStats();
  events.forEach(event => collectTypeStats(stats, event));
  const summary = {
    totalFiles: sources.length,
    totalEvents: events.length,
    totalRequests: stats.totalRequests,
    totalErrors: stats.totalErrors,
    totalWarnings: stats.totalWarnings
  };

  return {
    success: true,
    logType: 'batch',
    mode: 'batch',
    batchLogType,
    sourceTypes: summarizeSourceTypes(sources),
    results: [],
    filterOptions: buildFilterOptionsFromStats(stats, batchLogType),
    ...finalizeTypeStats(stats, batchLogType, summary)
  };
}

async function getLogBatchPage(input, body = {}) {
  const sources = await resolveBatchSources(input);
  const filters = buildBatchFiltersFromBody(body);
  const page = Number(body.page || 1);
  const pageSize = Number(body.perPage || body.limit || 50);
  const batchLogType = inferBatchLogType(sources);

  const pageResult = await countAndExtractBatchEntries(sources, filters, page, pageSize);
  
  /* Optimization: Re-collect non-error specific stats and correlation only if it's a mixed/request/cdn batch,
     otherwise countAndExtractBatchEntries already provided error stats. */
  let stats = null;
  let correlation = null;
  
  const allEvents = await collectBatchEvents(sources, filters, { includeStackTrace: true });
  
  if (batchLogType !== 'error') {
    stats = createEmptyTypeStats();
    allEvents.forEach(event => collectTypeStats(stats, event));
  }
  
  if (batchLogType === 'error' || batchLogType === 'mixed') {
    const { buildCorrelationData } = require('./correlationService');
    correlation = buildCorrelationData(allEvents);
  }

  const baseResponse = {
    success: true,
    logType: 'batch',
    mode: 'batch',
    batchLogType,
    sourceTypes: summarizeSourceTypes(sources),
    total: pageResult.total,
    page,
    perPage: pageSize,
    totalPages: Math.ceil(pageResult.total / pageSize),
    events: pageResult.entries,
    levelCounts: pageResult.levelCounts,
    correlation,
    ...pageResult
  };

  if (stats) {
    return {
      ...baseResponse,
      filterOptions: buildFilterOptionsFromStats(stats, batchLogType),
      ...finalizeTypeStats(stats, batchLogType, {
        totalFiles: sources.length,
        totalEvents: pageResult.total,
        totalRequests: stats.totalRequests,
        totalErrors: stats.totalErrors,
        totalWarnings: stats.totalWarnings
      })
    };
  }

  return baseResponse;
}

module.exports = {
  analyzeLogBatch,
  analyzeLogBatchFilters,
  collectBatchAnalysisEvents,
  countAndExtractLogBatchEntries,
  getLogBatchPage,
  buildBatchFiltersFromBody,
  buildMultiErrorEventMatcher: buildBatchEventMatcher,
  analyzeMultiError,
  analyzeMergedErrorFilters,
  collectMultiErrorEvents,
  countAndExtractMultiErrorEntries,
  resolveBatchTargets,
  resolveBatchSources,
  resolveMultiErrorTargets,
  resolveMultiErrorSources
};
