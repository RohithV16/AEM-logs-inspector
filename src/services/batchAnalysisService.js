const path = require('path');
const { detectLogType, createLogStream, createRequestLogStream, createCDNLogStream } = require('../parser');
const { resolveAnalysisTargets } = require('../utils/files');
const { buildAdvancedMatcher } = require('./searchBuilder');
const { buildCorrelationData, normalizeCorrelationEvent, getTimestampValue } = require('./correlationService');
const { normalizeMessage } = require('../grouper');
const { categorizeError } = require('../categorizer');

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

function buildBatchEventMatcher(filters = {}) {
  const advancedMatcher = buildAdvancedMatcher(filters.advancedRules || []);
  const search = String(filters.search || '').trim().toLowerCase();
  const hourOfDay = String(filters.hourOfDay || '').trim();
  const severity = String(filters.severity || '').trim();
  const logType = String(filters.logType || '').trim();
  const sourceFile = String(filters.sourceFile || '').trim();

  return (event) => {
    if (!advancedMatcher(event)) return false;
    if (hourOfDay && String(Number(event.hour?.slice(-2))) !== String(hourOfDay)) return false;
    if (severity && event.severity !== severity) return false;
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
  let total = 0;
  let skipped = (page - 1) * pageSize;

  for await (const event of mergeNormalizedEvents(filePaths, {
    matcher,
    compact: false,
    includeTrackers: false
  })) {
    total++;
    if (skipped > 0) {
      skipped--;
      continue;
    }
    if (entries.length < pageSize) {
      entries.push(event);
    }
  }

  return { entries, total };
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
    }
  };
}

module.exports = {
  analyzeBatch,
  buildBatchEventMatcher,
  collectBatchEvents,
  countAndExtractBatchEntries
};
