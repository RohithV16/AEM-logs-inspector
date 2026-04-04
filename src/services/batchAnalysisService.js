const path = require('path');
const { detectLogType, createLogStream, createRequestLogStream, createCDNLogStream } = require('../parser');
const { resolveAnalysisTargets } = require('../utils/files');
const { buildAdvancedMatcher } = require('./searchBuilder');
const { buildCorrelationData, normalizeCorrelationEvent, getTimestampValue } = require('./correlationService');
const { normalizeMessage } = require('../grouper');
const { extractExceptionNames } = require('./errorLogService');
const { categorizeError } = require('../categorizer');

const packageRegex = /^([a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*)\./;

function createEntryStream(filePath, logType) {
  if (logType === 'request') return createRequestLogStream(filePath);
  if (logType === 'cdn') return createCDNLogStream(filePath);
  return createLogStream(filePath, { levels: 'all' });
}

function createSourceTracker(filePath, logType) {
  return {
    filePath,
    fileName: path.basename(filePath),
    logType,
    matchedEvents: 0,
    totalErrors: 0,
    totalWarnings: 0,
    totalRequests: 0,
    uniqueErrorMessages: new Set(),
    uniqueWarningMessages: new Set(),
    groupedErrors: {},
    timeline: {},
    methods: {},
    statuses: {},
    pods: {},
    urls: {},
    cacheStatuses: {},
    countries: {},
    pops: {},
    hosts: {}
  };
}

function derivePackageGroup(logger) {
  if (!logger) return null;
  const match = String(logger).match(packageRegex);
  return match ? match[1] : null;
}

function incrementTimelineBucket(timeline, hour, fields) {
  if (!hour) return;
  if (!timeline[hour]) timeline[hour] = {};
  Object.entries(fields).forEach(([key, value]) => {
    timeline[hour][key] = (timeline[hour][key] || 0) + value;
  });
}

function trackErrorEntry(tracker, entry) {
  if (entry.level === 'ERROR') {
    tracker.totalErrors++;
    tracker.uniqueErrorMessages.add(normalizeMessage(entry.message || ''));
  } else if (entry.level === 'WARN') {
    tracker.totalWarnings++;
    tracker.uniqueWarningMessages.add(normalizeMessage(entry.message || ''));
  }

  if (entry.level === 'ERROR' || entry.level === 'WARN') {
    const normalized = normalizeMessage(entry.message || '');
    const key = `${entry.level}:${normalized}`;
    if (!tracker.groupedErrors[key]) {
      tracker.groupedErrors[key] = {
        level: entry.level,
        message: normalized,
        count: 0,
        firstOccurrence: entry.timestamp,
        category: categorizeError(entry.message || '', entry.logger || '')
      };
    }
    tracker.groupedErrors[key].count++;
  }

  if (entry.timestamp) {
    const hour = entry.timestamp.substring(0, 13);
    incrementTimelineBucket(tracker.timeline, hour, {
      total: 1,
      ERROR: entry.level === 'ERROR' ? 1 : 0,
      WARN: entry.level === 'WARN' ? 1 : 0
    });
  }
}

function trackRequestEntry(tracker, entry) {
  tracker.totalRequests++;

  if (entry.method) {
    tracker.methods[entry.method] = (tracker.methods[entry.method] || 0) + 1;
  }
  if (entry.status) {
    tracker.statuses[entry.status] = (tracker.statuses[entry.status] || 0) + 1;
  }
  if (entry.pod) {
    tracker.pods[entry.pod] = (tracker.pods[entry.pod] || 0) + 1;
  }
  if (entry.url) {
    const urlKey = entry.url.split('?')[0];
    tracker.urls[urlKey] = (tracker.urls[urlKey] || 0) + 1;
  }

  if (entry.timestamp) {
    const hour = entry.timestamp.substring(0, 13);
    incrementTimelineBucket(tracker.timeline, hour, {
      requests: 1,
      errors: entry.status >= 400 ? 1 : 0,
      slow: entry.responseTime > 1000 ? 1 : 0
    });
  }
}

function trackCDNEntry(tracker, entry) {
  tracker.totalRequests++;

  if (entry.method) {
    tracker.methods[entry.method] = (tracker.methods[entry.method] || 0) + 1;
  }
  if (entry.status) {
    tracker.statuses[entry.status] = (tracker.statuses[entry.status] || 0) + 1;
  }
  if (entry.cache) {
    tracker.cacheStatuses[entry.cache] = (tracker.cacheStatuses[entry.cache] || 0) + 1;
  }
  if (entry.clientCountry) {
    tracker.countries[entry.clientCountry] = (tracker.countries[entry.clientCountry] || 0) + 1;
  }
  if (entry.pop) {
    tracker.pops[entry.pop] = (tracker.pops[entry.pop] || 0) + 1;
  }
  if (entry.host) {
    tracker.hosts[entry.host] = (tracker.hosts[entry.host] || 0) + 1;
  }

  if (entry.timestamp) {
    const hour = entry.timestamp.substring(0, 13);
    incrementTimelineBucket(tracker.timeline, hour, {
      requests: 1,
      errors: entry.status >= 400 ? 1 : 0,
      cacheHits: entry.cache === 'HIT' ? 1 : 0
    });
  }
}

function trackSourceEntry(tracker, entry) {
  if (tracker.logType === 'request') {
    trackRequestEntry(tracker, entry);
    return;
  }

  if (tracker.logType === 'cdn') {
    trackCDNEntry(tracker, entry);
    return;
  }

  trackErrorEntry(tracker, entry);
}

function createSourceSummary(tracker) {
  return {
    filePath: tracker.filePath,
    fileName: tracker.fileName,
    logType: tracker.logType,
    eventCount: tracker.matchedEvents,
    summary: {
      totalErrors: tracker.totalErrors,
      totalWarnings: tracker.totalWarnings,
      totalRequests: tracker.totalRequests,
      uniqueErrors: tracker.uniqueErrorMessages.size,
      uniqueWarnings: tracker.uniqueWarningMessages.size,
      totalEvents: tracker.matchedEvents
    },
    topResults: Object.values(tracker.groupedErrors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    timeline: tracker.timeline
  };
}

function createEmptyMergedErrorStats() {
  return {
    levelCounts: { ALL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 },
    loggers: {},
    threads: {},
    packages: {},
    exceptions: {},
    packageThreads: {},
    packageExceptions: {},
    categories: {},
    timeline: {},
    hourlyHeatmap: {
      heatmap: {},
      days: new Set()
    },
    summary: {
      totalErrors: 0,
      totalWarnings: 0,
      uniqueErrors: new Set(),
      uniqueWarnings: new Set(),
      totalEvents: 0
    }
  };
}

function addMergedCount(bucket, key, amount = 1) {
  if (!key) return;
  bucket[key] = (bucket[key] || 0) + amount;
}

function collectMergedErrorStats(stats, event) {
  const level = String(event.level || event.severity || '').toUpperCase();
  const message = event.message || event.title || '';
  const logger = event.logger || '';
  const thread = event.thread || '';
  const pkg = derivePackageGroup(logger);

  if (level && stats.levelCounts[level] !== undefined) {
    stats.levelCounts[level]++;
  }
  stats.levelCounts.ALL++;
  stats.summary.totalEvents++;

  if (level === 'ERROR') {
    stats.summary.totalErrors++;
    stats.summary.uniqueErrors.add(normalizeMessage(message));
  } else if (level === 'WARN') {
    stats.summary.totalWarnings++;
    stats.summary.uniqueWarnings.add(normalizeMessage(message));
  }

  if (logger) {
    addMergedCount(stats.loggers, logger);
    if (pkg) addMergedCount(stats.packages, pkg);
  }

  if (thread) {
    addMergedCount(stats.threads, thread);
    if (pkg) {
      if (!stats.packageThreads[pkg]) stats.packageThreads[pkg] = {};
      addMergedCount(stats.packageThreads[pkg], thread);
    }
  }

  const exceptionNames = [
    ...extractExceptionNames(message),
    ...extractExceptionNames(event.stackTrace)
  ];
  [...new Set(exceptionNames)].forEach((exceptionName) => {
    addMergedCount(stats.exceptions, exceptionName);
    if (pkg) {
      if (!stats.packageExceptions[pkg]) stats.packageExceptions[pkg] = {};
      addMergedCount(stats.packageExceptions[pkg], exceptionName);
    }
  });

  if (level === 'ERROR' || level === 'WARN') {
    addMergedCount(stats.categories, categorizeError(message, logger));
  }

  if (event.timestamp) {
    const hour = event.timestamp.substring(0, 13);
    if (!stats.timeline[hour]) stats.timeline[hour] = { ERROR: 0, WARN: 0, total: 0 };
    stats.timeline[hour].total++;
    if (level === 'ERROR') stats.timeline[hour].ERROR++;
    if (level === 'WARN') stats.timeline[hour].WARN++;

    const date = event.timestamp.substring(0, 10);
    const hourNumber = Number(event.timestamp.substring(11, 13));
    stats.hourlyHeatmap.days.add(date);
    if (!Number.isNaN(hourNumber)) {
      if (!stats.hourlyHeatmap.heatmap[hourNumber]) stats.hourlyHeatmap.heatmap[hourNumber] = {};
      stats.hourlyHeatmap.heatmap[hourNumber][date] = (stats.hourlyHeatmap.heatmap[hourNumber][date] || 0) + 1;
    }
  }
}

function finalizeMergedErrorStats(stats) {
  return {
    levelCounts: { ...stats.levelCounts },
    loggers: stats.loggers,
    threads: stats.threads,
    packages: stats.packages,
    exceptions: stats.exceptions,
    packageThreads: stats.packageThreads,
    packageExceptions: stats.packageExceptions,
    categories: Object.keys(stats.categories).sort(),
    timeline: stats.timeline,
    hourlyHeatmap: {
      heatmap: stats.hourlyHeatmap.heatmap,
      days: Array.from(stats.hourlyHeatmap.days).sort()
    },
    summary: {
      totalErrors: stats.summary.totalErrors,
      totalWarnings: stats.summary.totalWarnings,
      uniqueErrors: stats.summary.uniqueErrors.size,
      uniqueWarnings: stats.summary.uniqueWarnings.size,
      totalEvents: stats.summary.totalEvents
    }
  };
}

function buildSearchText(event) {
  return [
    event.timestamp,
    event.severity,
    event.logType,
    event.sourceName,
    event.sourceFile,
    event.title,
    event.message,
    event.logger,
    event.thread,
    event.method,
    event.status,
    event.responseTime,
    event.cache,
    event.clientCountry,
    event.pop,
    event.host,
    event.requestId,
    event.url
  ]
    .filter(value => value !== null && value !== undefined && value !== '')
    .join(' ')
    .toLowerCase();
}

function matchesFilterText(actualValue, filterValue) {
  if (!filterValue) return true;
  const values = Array.isArray(filterValue) ? filterValue : [filterValue];
  const actualText = String(actualValue || '');

  return values.some((value) => {
    const pattern = String(value || '').trim();
    if (!pattern) return false;
    if (actualText === pattern || actualText.includes(pattern)) return true;
    try {
      return new RegExp(pattern, 'i').test(actualText);
    } catch {
      return false;
    }
  });
}

function buildBatchEventMatcher(filters = {}) {
  const advancedMatcher = buildAdvancedMatcher(filters.advancedRules || []);
  const search = String(filters.search || '').trim().toLowerCase();
  const level = String(filters.level || filters.severity || '').trim().toUpperCase();
  const logger = filters.logger;
  const thread = filters.thread;
  const exception = String(filters.exception || '').trim();
  const category = String(filters.category || '').trim();
  const startDate = filters.startDate || filters.from || '';
  const endDate = filters.endDate || filters.to || '';
  const pkg = Array.isArray(filters.package) ? filters.package : (filters.package ? [filters.package] : []);
  const hourOfDay = String(filters.hourOfDay || '').trim();
  const logType = String(filters.logType || '').trim();
  const sourceFile = String(filters.sourceFile || '').trim();

  return (event) => {
    if (!advancedMatcher(event)) return false;
    const eventLevel = String(event.level || event.severity || '').toUpperCase();
    if (level && level !== 'ALL' && eventLevel !== level) return false;
    if (startDate) {
      const startValue = new Date(startDate).getTime();
      if (!Number.isNaN(startValue) && getTimestampValue(event.timestamp) < startValue) return false;
    }
    if (endDate) {
      const endValue = new Date(endDate).getTime();
      if (!Number.isNaN(endValue) && getTimestampValue(event.timestamp) > endValue) return false;
    }
    if (!matchesFilterText(event.logger, logger)) return false;
    if (!matchesFilterText(event.thread, thread)) return false;
    if (exception) {
      const text = `${event.message || ''} ${event.stackTrace || ''}`.toLowerCase();
      const exceptionMatch = [event.message, event.stackTrace]
        .flatMap(value => extractExceptionNames(value))
        .some(name => {
          const lower = name.toLowerCase();
          const simple = name.split('.').pop().toLowerCase();
          const filterLower = exception.toLowerCase();
          return lower === filterLower || simple === filterLower || lower.includes(filterLower) || text.includes(filterLower);
        });
      if (!exceptionMatch && !text.includes(exception.toLowerCase())) return false;
    }
    if (category) {
      const entryCategory = categorizeError(event.message || event.title || '', event.logger || '');
      if (entryCategory !== category) return false;
    }
    if (pkg.length > 0) {
      const entryPkg = derivePackageGroup(event.logger);
      if (!entryPkg || !pkg.some(p => entryPkg === p || entryPkg.startsWith(`${p}.`))) return false;
    }
    if (hourOfDay && String(Number(event.hour?.slice(-2))) !== String(hourOfDay)) return false;
    if (logType && event.logType !== logType) return false;
    if (sourceFile && event.sourceFile !== sourceFile && event.sourceName !== sourceFile) return false;
    if (search && !buildSearchText(event).includes(search)) return false;
    return true;
  };
}

function stripHeavyFields(event) {
  if (!event.stackTrace) return event;
  return {
    ...event,
    stackTrace: ''
  };
}

async function* createNormalizedEventIterator(filePath, logType, options = {}) {
  const matcher = options.matcher || (() => true);
  const tracker = options.tracker || null;
  const compact = options.compact !== false;

  for await (const entry of createEntryStream(filePath, logType)) {
    if (tracker) {
      trackSourceEntry(tracker, entry);
    }

    const normalized = normalizeCorrelationEvent(entry, { filePath, logType });
    const event = compact ? stripHeavyFields(normalized) : normalized;
    if (!matcher(event)) continue;

    if (tracker) {
      tracker.matchedEvents++;
    }
    yield event;
  }
}

async function createMergedContexts(filePaths, options = {}) {
  const contexts = [];

  for (const filePath of filePaths) {
    const logType = await detectLogType(filePath);
    const tracker = options.includeTrackers ? createSourceTracker(filePath, logType) : null;
    const iterator = createNormalizedEventIterator(filePath, logType, {
      matcher: options.matcher,
      tracker,
      compact: options.compact
    });
    const current = await iterator.next();

    contexts.push({
      filePath,
      logType,
      tracker,
      iterator,
      current
    });
  }

  return contexts;
}

async function* mergeNormalizedEvents(filePaths, options = {}) {
  const contexts = await createMergedContexts(filePaths, options);

  try {
    while (true) {
      const active = contexts.filter(context => !context.current.done);
      if (!active.length) break;

      let selected = active[0];
      for (let i = 1; i < active.length; i++) {
        const candidate = active[i];
        if (getTimestampValue(candidate.current.value.timestamp) < getTimestampValue(selected.current.value.timestamp)) {
          selected = candidate;
        }
      }

      yield selected.current.value;
      selected.current = await selected.iterator.next();
    }
  } finally {
    return contexts;
  }
}

async function collectBatchEvents(input, filters = {}, options = {}) {
  const filePaths = resolveAnalysisTargets(input);
  const matcher = buildBatchEventMatcher(filters);
  const events = [];

  for await (const event of mergeNormalizedEvents(filePaths, {
    matcher,
    compact: options.includeStackTrace === true ? false : true,
    includeTrackers: false
  })) {
    events.push(event);
  }

  return events;
}

async function countAndExtractBatchEntries(input, filters = {}, page = 1, pageSize = 50) {
  const filePaths = resolveAnalysisTargets(input);
  const matcher = buildBatchEventMatcher(filters);
  const entries = [];
  const stats = createEmptyMergedErrorStats();
  let total = 0;
  let skipped = (page - 1) * pageSize;

  for await (const event of mergeNormalizedEvents(filePaths, {
    matcher,
    compact: false,
    includeTrackers: false
  })) {
    collectMergedErrorStats(stats, event);
    total++;
    if (skipped > 0) {
      skipped--;
      continue;
    }
    if (entries.length < pageSize) {
      entries.push(event);
    }
  }

  return {
    entries,
    total,
    ...finalizeMergedErrorStats(stats)
  };
}

async function analyzeMergedErrorFilters(input, filters = {}) {
  const filePaths = resolveAnalysisTargets(input);
  const matcher = buildBatchEventMatcher(filters);
  const stats = createEmptyMergedErrorStats();
  const matchedEvents = [];

  for await (const event of mergeNormalizedEvents(filePaths, {
    matcher,
    compact: false,
    includeTrackers: false
  })) {
    matchedEvents.push(event);
    collectMergedErrorStats(stats, event);
  }

  const levelCounts = { ...stats.levelCounts };
  const summary = finalizeMergedErrorStats(stats).summary;
  const results = matchedEvents.length ? matchedEvents : [];

  return {
    summary,
    results,
    levelCounts,
    ...finalizeMergedErrorStats(stats)
  };
}

async function analyzeBatch(input, filters = {}, onProgress) {
  const filePaths = resolveAnalysisTargets(input);
  const totalFiles = filePaths.length;
  const matcher = buildBatchEventMatcher({ advancedRules: filters.advancedRules || [] });
  const contexts = await createMergedContexts(filePaths, {
    matcher,
    compact: true,
    includeTrackers: true
  });
  const matchedEvents = [];

  while (true) {
    const active = contexts.filter(context => !context.current.done);
    if (!active.length) break;

    let selected = active[0];
    for (let i = 1; i < active.length; i++) {
      const candidate = active[i];
      if (getTimestampValue(candidate.current.value.timestamp) < getTimestampValue(selected.current.value.timestamp)) {
        selected = candidate;
      }
    }

    matchedEvents.push(selected.current.value);
    selected.current = await selected.iterator.next();

    if (onProgress) {
      const completed = contexts.filter(context => context.current.done).length;
      onProgress({ totalFiles, completedFiles: completed });
    }
  }

  const sources = contexts.map(context => createSourceSummary(context.tracker));
  const byType = {
    error: { files: 0, events: 0 },
    request: { files: 0, events: 0 },
    cdn: { files: 0, events: 0 }
  };
  const uniqueErrors = new Set();
  const uniqueWarnings = new Set();

  let summary = {
    totalFiles,
    totalEvents: matchedEvents.length,
    totalErrors: 0,
    totalWarnings: 0,
    totalRequests: 0,
    uniqueErrors: 0,
    uniqueWarnings: 0
  };

  contexts.forEach((context) => {
    const tracker = context.tracker;
    const typeBucket = byType[tracker.logType];
    if (typeBucket) {
      typeBucket.files++;
      typeBucket.events += tracker.matchedEvents;
    }

    summary.totalErrors += tracker.totalErrors;
    summary.totalWarnings += tracker.totalWarnings;
    summary.totalRequests += tracker.totalRequests;

    tracker.uniqueErrorMessages.forEach(message => uniqueErrors.add(message));
    tracker.uniqueWarningMessages.forEach(message => uniqueWarnings.add(message));
  });

  summary.uniqueErrors = uniqueErrors.size;
  summary.uniqueWarnings = uniqueWarnings.size;

  const correlationData = buildCorrelationData(matchedEvents);
  const mergedErrorStats = finalizeMergedErrorStats(
    matchedEvents.reduce((stats, event) => {
      collectMergedErrorStats(stats, event);
      return stats;
    }, createEmptyMergedErrorStats())
  );
  const { summary: mergedSummary, ...mergedFields } = mergedErrorStats;

  return {
    logType: 'batch',
    summary: {
      ...summary,
      byType
    },
    sources,
    correlation: {
      summary: correlationData.summary,
      hourOfDaySeverity: correlationData.hourOfDaySeverity,
      incidents: correlationData.incidents
    },
    mergedSummary,
    ...mergedFields
  };
}

module.exports = {
  analyzeBatch,
  analyzeMergedErrorFilters,
  buildBatchEventMatcher,
  collectBatchEvents,
  countAndExtractBatchEntries
};
