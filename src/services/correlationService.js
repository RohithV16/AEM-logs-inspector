const path = require('path');

const INCIDENT_WINDOW_MINUTES = 30;

function getTimestampValue(timestamp) {
  if (!timestamp) return 0;

  let parsed = null;
  const errorMatch = timestamp.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?/);
  if (errorMatch) {
    const [, dd, mm, yyyy, hh, min, sec, ms = '000'] = errorMatch;
    parsed = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}.${ms}Z`);
  }

  const requestMatch = !parsed && timestamp.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/);
  if (requestMatch) {
    const [, dd, mon, yyyy, hh, min, sec, tz] = requestMatch;
    const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    parsed = new Date(`${yyyy}-${months[mon]}-${dd}T${hh}:${min}:${sec}${tz.slice(0, 3)}:${tz.slice(3)}`);
  }

  const value = (parsed || new Date(timestamp)).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function getHourBucket(timestamp) {
  if (!timestamp || typeof timestamp !== 'string' || timestamp.length < 13) return null;
  return timestamp.substring(0, 13);
}

function getSeverityForEntry(entry, logType) {
  if (entry.severity) return entry.severity;

  if (logType === 'request' || logType === 'cdn') {
    const status = Number(entry.status || 0);
    if (status >= 500) return '5XX';
    if (status >= 400) return '4XX';
    if (status >= 300) return '3XX';
    return '2XX';
  }

  return entry.level || 'INFO';
}

function getTitleForEntry(entry, logType) {
  if (logType === 'request' || logType === 'cdn') {
    return entry.url || entry.message || '';
  }
  return entry.message || '';
}

function normalizeCorrelationEvent(entry, meta = {}) {
  const logType = meta.logType || entry.logType || 'error';
  const sourceFile = meta.sourceFile || entry.sourceFile || '';
  const sourceName = path.basename(sourceFile || entry.sourceFile || '');
  const timestamp = entry.timestamp || '';
  const severity = getSeverityForEntry(entry, logType);
  const title = getTitleForEntry(entry, logType);

  return {
    timestamp,
    hour: getHourBucket(timestamp),
    severity,
    logType,
    sourceFile,
    sourceName,
    title,
    logger: entry.logger || '',
    thread: entry.thread || entry.threadName || '',
    pod: entry.instanceId || entry.pod || '',
    method: entry.method || '',
    url: entry.url || '',
    status: entry.status || null,
    responseTime: entry.responseTime || null,
    cache: entry.cache || '',
    clientIp: entry.clientIp || '',
    clientCountry: entry.clientCountry || '',
    clientRegion: entry.clientRegion || '',
    pop: entry.pop || '',
    host: entry.host || '',
    ttfb: entry.ttfb || null,
    ttlb: entry.ttlb || null,
    requestId: entry.requestId || '',
    userAgent: entry.userAgent || '',
    aemEnvKind: entry.aemEnvKind || '',
    aemTenant: entry.aemTenant || '',
    contentType: entry.contentType || '',
    debug: entry.debug || '',
    resAge: entry.resAge || null,
    rules: entry.rules || '',
    alerts: entry.alerts || '',
    sample: entry.sample || '',
    ddos: entry.ddos || false,
    message: entry.message || '',
    stackTrace: entry.stackTrace || ''
  };
}

function buildCorrelationSummary(events) {
  if (!events.length) {
    return {
      totalEvents: 0,
      totalSources: 0,
      firstTimestamp: null,
      lastTimestamp: null,
      maxSeverity: null
    };
  }

  const sorted = [...events].sort((a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp));
  const sourceSet = new Set(sorted.map(event => event.sourceFile).filter(Boolean));

  return {
    totalEvents: sorted.length,
    totalSources: sourceSet.size,
    firstTimestamp: sorted[0].timestamp,
    lastTimestamp: sorted[sorted.length - 1].timestamp,
    maxSeverity: sorted.find(event => event.severity === 'ERROR') ? 'ERROR' : sorted.find(event => event.severity === 'WARN') ? 'WARN' : sorted[0].severity
  };
}

function buildCorrelationTimeline(events) {
  const hourlySeverity = {};
  const hourOfDaySeverity = {};
  const incidents = [];
  const sorted = [...events].sort((a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp));

  let currentIncident = null;
  const windowMs = INCIDENT_WINDOW_MINUTES * 60 * 1000;

  for (const event of sorted) {
    if (!event.hour) continue;

    if (!hourlySeverity[event.hour]) {
      hourlySeverity[event.hour] = {
        hour: event.hour,
        total: 0,
        severityCounts: {},
        logTypeCounts: {}
      };
    }

    hourlySeverity[event.hour].total++;
    hourlySeverity[event.hour].severityCounts[event.severity] = (hourlySeverity[event.hour].severityCounts[event.severity] || 0) + 1;
    hourlySeverity[event.hour].logTypeCounts[event.logType] = (hourlySeverity[event.hour].logTypeCounts[event.logType] || 0) + 1;

    const hourOfDay = Number(event.hour?.slice(-2));
    if (!Number.isNaN(hourOfDay)) {
      if (!hourOfDaySeverity[hourOfDay]) {
        hourOfDaySeverity[hourOfDay] = { hour: hourOfDay, severityCounts: {}, total: 0 };
      }
      hourOfDaySeverity[hourOfDay].total++;
      hourOfDaySeverity[hourOfDay].severityCounts[event.severity] = (hourOfDaySeverity[hourOfDay].severityCounts[event.severity] || 0) + 1;
    }

    if (!currentIncident) {
      currentIncident = createIncident(event);
      incidents.push(currentIncident);
      continue;
    }

    const gap = getTimestampValue(event.timestamp) - getTimestampValue(currentIncident.lastTimestamp);
    if (gap > windowMs) {
      currentIncident = createIncident(event);
      incidents.push(currentIncident);
      continue;
    }

    appendIncidentEvent(currentIncident, event);
  }

  return {
    hourlySeverity,
    hourOfDaySeverity,
    incidents: incidents.map(incident => ({
      ...incident,
      sources: Object.entries(incident.sources).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      severities: Object.entries(incident.severities).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      logTypes: Object.entries(incident.logTypes).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    }))
  };
}

function createIncident(event) {
  return {
    startTimestamp: event.timestamp,
    lastTimestamp: event.timestamp,
    firstEvent: event,
    lastEvent: event,
    total: 1,
    sources: event.sourceName ? { [event.sourceName]: 1 } : {},
    severities: { [event.severity]: 1 },
    logTypes: { [event.logType]: 1 },
    events: [event]
  };
}

function appendIncidentEvent(incident, event) {
  incident.lastTimestamp = event.timestamp;
  incident.lastEvent = event;
  incident.total++;
  incident.events.push(event);

  if (event.sourceName) {
    incident.sources[event.sourceName] = (incident.sources[event.sourceName] || 0) + 1;
  }
  incident.severities[event.severity] = (incident.severities[event.severity] || 0) + 1;
  incident.logTypes[event.logType] = (incident.logTypes[event.logType] || 0) + 1;
}

function finalizeCorrelationEvents(events) {
  return [...events].sort((a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp));
}

function buildCorrelationData(events) {
  const summary = buildCorrelationSummary(events);
  const timeline = buildCorrelationTimeline(events);
  const eventList = finalizeCorrelationEvents(events);

  return {
    summary,
    hourlySeverity: timeline.hourlySeverity,
    hourOfDaySeverity: timeline.hourOfDaySeverity,
    incidents: timeline.incidents.map(incident => ({
      startTimestamp: incident.startTimestamp,
      lastTimestamp: incident.lastTimestamp,
      firstEvent: incident.firstEvent,
      lastEvent: incident.lastEvent,
      total: incident.total,
      sources: incident.sources,
      severities: incident.severities,
      logTypes: incident.logTypes,
      events: incident.events.slice(0, 20)
    })),
    events: eventList
  };
}

function buildFilterOptionsFromStats(stats, batchLogType) {
  if (batchLogType === 'request') {
    return {
      methods: Object.keys(stats.methods || {}).sort(),
      statuses: Object.keys(stats.statuses || {}).map(Number).sort((a, b) => a - b),
      pods: Object.keys(stats.pods || {}).sort()
    };
  }

  if (batchLogType === 'cdn') {
    return {
      methods: Object.keys(stats.methods || {}).sort(),
      statuses: Object.keys(stats.statuses || {}).map(Number).sort((a, b) => a - b),
      cacheStatuses: Object.keys(stats.cacheStatuses || {}).sort(),
      countries: Object.keys(stats.countries || {}).sort(),
      pops: Object.keys(stats.pops || {}).sort(),
      hosts: Object.keys(stats.hosts || {}).sort()
    };
  }

  if (batchLogType === 'mixed') {
    return {
      request: {
        methods: Object.keys(stats.methods || {}).sort(),
        statuses: Object.keys(stats.statuses || {}).map(Number).sort((a, b) => a - b),
        pods: Object.keys(stats.pods || {}).sort()
      },
      cdn: {
        methods: Object.keys(stats.methods || {}).sort(),
        statuses: Object.keys(stats.statuses || {}).map(Number).sort((a, b) => a - b),
        cacheStatuses: Object.keys(stats.cacheStatuses || {}).sort(),
        countries: Object.keys(stats.countries || {}).sort(),
        pops: Object.keys(stats.pops || {}).sort(),
        hosts: Object.keys(stats.hosts || {}).sort()
      }
    };
  }

  if (batchLogType === 'error') {
    return {
      loggers: Object.keys(stats.loggers || {}).sort(),
      threads: Object.keys(stats.threads || {}).sort(),
      pods: Object.keys(stats.pods || {}).sort(),
      packages: Object.keys(stats.packages || {}).sort(),
      exceptions: Object.keys(stats.exceptions || {}).sort()
    };
  }

  return null;
}

module.exports = {
  buildCorrelationData,
  normalizeCorrelationEvent,
  getSeverityForEntry,
  getHourBucket,
  getTimestampValue,
  buildFilterOptionsFromStats
};
