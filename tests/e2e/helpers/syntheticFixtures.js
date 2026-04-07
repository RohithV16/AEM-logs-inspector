const fs = require('fs');
const path = require('path');

function createTempErrorLog(dir, options = {}) {
  const {
    errorCount = 5,
    warningCount = 3,
    uniqueErrors = 2,
    loggers = ['com.example.Component', 'com.example.Service', 'com.example.Cache'],
    threads = ['thread-1', 'thread-2', 'thread-3'],
    exceptions = ['java.lang.NullPointerException', 'java.lang.RuntimeException'],
    startDate = '29.03.2026 00:00:00'
  } = options;

  const lines = [];
  const errorMessages = [
    'Something went wrong',
    'Failed to process request',
    'Database connection error',
    'Authentication failed',
    'Resource not found'
  ];
  const warnMessages = [
    'Cache miss for /content/page',
    'Deprecated API usage',
    'Slow response detected'
  ];

  const usedErrors = new Set();
  const usedWarnings = new Set();

  for (let i = 0; i < errorCount; i++) {
    const timestamp = new Date(startDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1')).getTime() + i * 1000;
    const dateStr = formatDate(new Date(timestamp));
    const thread = threads[i % threads.length];
    const logger = loggers[i % loggers.length];
    const errorMsg = errorMessages[i % uniqueErrors];

    usedErrors.add(errorMsg);

    lines.push(`${dateStr} [${thread}] *ERROR* [${logger}] ${errorMsg}`);

    if (i % 2 === 0 && exceptions.length > 0) {
      const exc = exceptions[i % exceptions.length];
      lines.push(exc);
      lines.push(`    at ${loggers[i % loggers.length]}.process(${loggers[i % loggers.length]}.java:42)`);
    }
  }

  for (let i = 0; i < warningCount; i++) {
    const timestamp = new Date(startDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1')).getTime() + errorCount * 1000 + i * 1000;
    const dateStr = formatDate(new Date(timestamp));
    const thread = threads[i % threads.length];
    const logger = loggers[i % loggers.length];
    const warnMsg = warnMessages[i % warnMessages.length];

    usedWarnings.add(warnMsg);

    lines.push(`${dateStr} [${thread}] *WARN* [${logger}] ${warnMsg}`);
  }

  const filePath = path.join(dir, 'temp_error_' + Date.now() + '.log');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

  return {
    filePath,
    expected: {
      totalErrors: errorCount,
      totalWarnings: warningCount,
      uniqueErrors: usedErrors.size,
      loggerCounts: loggers.reduce((acc, l) => ({ ...acc, [l]: Math.ceil(errorCount / loggers.length) }), {}),
      threadCounts: threads.reduce((acc, t) => ({ ...acc, [t]: Math.ceil(errorCount / threads.length) }), {}),
      exceptionCount: Math.ceil(errorCount / 2)
    }
  };
}

function createTempRequestLog(dir, options = {}) {
  const {
    methodCounts = { GET: 5, POST: 3, PUT: 2, DELETE: 1 },
    statusBuckets = { 200: 5, 404: 3, 500: 2 },
    avgLatency = 150,
    endpoints = ['/content/page.html', '/api/data', '/api/user', '/assets/image.png'],
    pods = ['pod-1', 'pod-2', 'pod-3'],
    startDate = '29/Mar/2026:00:00:00'
  } = options;

  const lines = [];
  let requestId = 100;

  const statusList = Object.entries(statusBuckets).flatMap(([status, count]) =>
    Array(count).fill(parseInt(status))
  );

  let statusIdx = 0;
  let currentTimestamp = new Date('2026-03-29T00:00:00').getTime();
  
  Object.entries(methodCounts).forEach(([method, count]) => {
    for (let i = 0; i < count; i++) {
      const dateStr = formatRequestDate(new Date(currentTimestamp));
      const reqId = requestId++;
      const endpoint = endpoints[i % endpoints.length];
      const pod = pods[i % pods.length];
      const status = statusList[statusIdx++ % statusList.length];

      const latency = Math.round(avgLatency * (0.5 + Math.random()));

      lines.push(`${dateStr} [${reqId}] -> ${method} ${endpoint} HTTP/1.1 [${pod}]`);
      lines.push(`${dateStr} [${reqId}] <- ${status} text/html ${latency}ms [${pod}]`);
      
      currentTimestamp += 1000;
    }
  });

  const filePath = path.join(dir, 'temp_request_' + Date.now() + '.log');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

  const totalRequests = Object.values(methodCounts).reduce((a, b) => a + b, 0);
  const avgLatencyCalc = Math.round(
    statusList.reduce((sum, s) => sum + avgLatency * (0.5 + Math.random()), 0) / statusList.length
  );

  return {
    filePath,
    expected: {
      totalRequests,
      methodCounts,
      statusBuckets,
      avgLatency: avgLatencyCalc,
      topEndpoints: endpoints.slice(0, Math.min(5, endpoints.length)).map(e => ({ url: e, count: methodCounts.GET || 1 }))
    }
  };
}

function createTempCdnLog(dir, options = {}) {
  const {
    cacheStatusCounts = { HIT: 7, MISS: 3 },
    popCounts = { 'pod-1': 5, 'pod-2': 3, 'pod-3': 2 },
    hostBreakdown = { 'example.com': 8, 'cdn.example.org': 2 },
    statusCounts = { 200: 6, 404: 2, 500: 2 },
    countries = { US: 5, GB: 3, DE: 2 },
    startDate = '2026-03-29T00:00:00'
  } = options;

  const lines = [];
  const total = Object.values(cacheStatusCounts).reduce((a, b) => a + b, 0);

  const cacheList = Object.entries(cacheStatusCounts).flatMap(([status, count]) =>
    Array(count).fill(status)
  );

  const statuses = Object.entries(statusCounts).flatMap(([status, count]) =>
    Array(count).fill(parseInt(status))
  );

  const countriesList = Object.entries(countries).flatMap(([country, count]) =>
    Array(count).fill(country)
  );

  const pops = Object.entries(popCounts).flatMap(([pop, count]) =>
    Array(count).fill(pop)
  );

  const hosts = Object.entries(hostBreakdown).flatMap(([host, count]) =>
    Array(count).fill(host)
  );

  const endpoints = ['/content/page.html', '/api/data', '/assets/image.png', '/static/js/main.js'];

  for (let i = 0; i < total; i++) {
    const timestamp = new Date(startDate).getTime() + i * 1000;
    const dateStr = new Date(timestamp).toISOString();

    const entry = {
      timestamp: dateStr,
      status: statuses[i % statuses.length],
      method: 'GET',
      url: endpoints[i % endpoints.length],
      cache: cacheList[i % cacheList.length],
      cli_country: countriesList[i % countriesList.length],
      pop: pops[i % pops.length],
      host: hosts[i % hosts.length]
    };

    lines.push(JSON.stringify(entry));
  }

  const filePath = path.join(dir, 'temp_cdn_' + Date.now() + '.log');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

  const hitCount = cacheStatusCounts.HIT || 0;
  const missCount = cacheStatusCounts.MISS || 0;
  const hitRatio = total > 0 ? hitCount / total : 0;

  return {
    filePath,
    expected: {
      totalRequests: total,
      cacheStatusCounts,
      hitRatio: Math.round(hitRatio * 100) / 100,
      popCounts,
      hostBreakdown,
      statusCounts,
      countries
    }
  };
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}.${ms}`;
}

function formatRequestDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} +0000`;
}

module.exports = {
  createTempErrorLog,
  createTempRequestLog,
  createTempCdnLog
};
