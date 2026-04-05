const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { createRequestLogStream } = require('../parser');
const { getCached, setCached } = require('../utils/analysisCache');
const { STREAM_THRESHOLD } = require('../utils/constants');

/* === Core Analysis === */

/**
 * Analyzes AEM request logs, collecting metrics on HTTP methods, status codes,
 * response times, and request patterns.
 * @param {string} filePath - Path to the request log file
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Analysis results with summary, filter options, results, and timelines
 */
function shouldUseWorkerForAnalysis(filePath, options = {}) {
  if (options.disableWorker) return false;
  return fs.statSync(filePath).size > STREAM_THRESHOLD;
}

function runAnalysisWorker(filePath, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../workers/analyzeWorker.js'), {
      workerData: { service: 'request', filePath }
    });

    worker.on('message', (message) => {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'progress' && onProgress) {
        onProgress(message.payload || {});
        return;
      }
      if (message.type === 'result') {
        resolve(message.payload);
      }
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Analysis worker exited with code ${code}`));
      }
    });
  });
}

async function analyzeRequestLogFromStream(stream, filePath, onProgress) {
  if (!onProgress) {
    const cached = getCached(filePath);
    if (cached) return cached;
  }

  const fileSize = fs.statSync(filePath).size;

  const methods = {};
  const statuses = {};
  const pods = {};
  const urls = {};
  const responseTimes = [];
  let totalRequests = 0;
  let totalResponseTime = 0;
  let slowRequests = 0;
  const timeline = {};

  for await (const entry of stream) {
    totalRequests++;

    if (entry.method) {
      methods[entry.method] = (methods[entry.method] || 0) + 1;
    }

    if (entry.status) {
      statuses[entry.status] = (statuses[entry.status] || 0) + 1;
      const responseTime = Number(entry.responseTime || 0);
      responseTimes.push(responseTime);
      totalResponseTime += responseTime;
      if (responseTime > 1000) slowRequests++;
    }

    if (entry.pod) {
      pods[entry.pod] = (pods[entry.pod] || 0) + 1;
    }

    /* Strip query strings to group requests by endpoint.
       /api/users?id=123 and /api/users?id=456 are the same endpoint. */
    if (entry.url) {
      const urlKey = entry.url.split('?')[0];
      urls[urlKey] = (urls[urlKey] || 0) + 1;
    }

    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, slow: 0 };
      timeline[hour].requests++;
      if (entry.status >= 400) timeline[hour].errors++;
      if (Number(entry.responseTime || 0) > 1000) timeline[hour].slow++;
    }

    if (onProgress && totalRequests % 10000 === 0) {
      onProgress({ fileSize, totalRequests, percent: 0 });
    }
  }

  if (onProgress) onProgress({ fileSize, totalRequests, percent: 100 });

  /* Calculate response time percentiles after sorting.
     Percentiles help identify latency outliers that average would mask -
     p99 is particularly important for SLA compliance. */
  responseTimes.sort((a, b) => a - b);
  const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / responseTimes.length) : 0;
  const p50 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.5)] : 0;
  const p95 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;
  const p99 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0;

  const result = {
    summary: {
      totalRequests,
      avgResponseTime,
      slowRequests,
      p50ResponseTime: p50,
      p95ResponseTime: p95,
      p99ResponseTime: p99
    },
    filterOptions: {
      methods: Object.keys(methods).sort(),
      statuses: Object.keys(statuses).map(s => parseInt(s)).sort((a, b) => a - b),
      pods: Object.keys(pods).sort()
    },
    results: Object.entries(urls).map(([url, count]) => ({ url, count })).sort((a, b) => b.count - a.count),
    methods,
    statuses,
    pods,
    timeline
  };

  if (!onProgress) {
    setCached(filePath, result);
  }

  return result;
}

async function analyzeRequestLog(filePath, onProgress, options = {}) {
  if (shouldUseWorkerForAnalysis(filePath, options)) {
    return runAnalysisWorker(filePath, onProgress);
  }

  const stream = createRequestLogStream(filePath);
  return analyzeRequestLogFromStream(stream, filePath, onProgress);
}

/* === Filter Functions === */

/**
 * Builds a filter function for request log entries.
 * @param {Object} filters - Filter parameters
 * @param {string} filters.method - HTTP method (GET, POST, etc.)
 * @param {number} filters.status - HTTP status code
 * @param {string} filters.pod - Pod identifier
 * @param {number} filters.minTime - Minimum response time (ms)
 * @param {number} filters.maxTime - Maximum response time (ms)
 * @returns {function} Filter function that returns true for matching entries
 */
function buildRequestFilter(filters = {}) {
  const { method, status, pod, minTime, maxTime } = filters;

  return (entry) => {
    if (method && entry.method !== method) return false;
    if (status && entry.status !== status) return false;
    if (pod && entry.pod !== pod) return false;
    if (minTime && entry.responseTime < minTime) return false;
    if (maxTime && entry.responseTime > maxTime) return false;
    return true;
  };
}

/**
 * Counts request log entries matching the given filters.
 * @param {string} filePath - Path to the request log file
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} Count of matching entries
 */
async function countMatchingRequestEntries(filePath, filters = {}) {
  const stream = createRequestLogStream(filePath);
  const filter = buildRequestFilter(filters);
  let count = 0;

  for await (const entry of stream) {
    if (filter(entry)) count++;
  }

  return count;
}

/**
 * Extracts a paginated subset of matching request log entries.
 * @param {string} filePath - Path to the request log file
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of entries per page
 * @returns {Promise<Object>} Object with entries array and total count
 */
async function extractRequestPage(filePath, filters = {}, page = 1, pageSize = 50) {
  const stream = createRequestLogStream(filePath);
  const filter = buildRequestFilter(filters);
  const entries = [];
  let skipped = (page - 1) * pageSize;
  let pageCount = 0;

  for await (const entry of stream) {
    if (filter(entry)) {
      if (skipped > 0) {
        skipped--;
      } else if (entries.length < pageSize) {
        entries.push(entry);
      }
      pageCount++;
    }
  }

  return { entries, total: pageCount };
}

/**
 * Counts and extracts entries in a single pass - more efficient than separate calls.
 * @param {string} filePath - Path to the request log file
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of entries per page
 * @returns {Promise<Object>} Object with entries array and total count
 */
async function countAndExtractRequestEntries(filePath, filters = {}, page = 1, pageSize = 50) {
  const stream = createRequestLogStream(filePath);
  return countAndExtractRequestEntriesFromStream(stream, filters, page, pageSize);
}

async function countAndExtractRequestEntriesFromStream(stream, filters = {}, page = 1, pageSize = 50) {
  const filter = buildRequestFilter(filters);
  const entries = [];
  let skipped = (page - 1) * pageSize;
  let totalCount = 0;

  for await (const entry of stream) {
    if (filter(entry)) {
      totalCount++;
      if (skipped > 0) {
        skipped--;
      } else if (entries.length < pageSize) {
        entries.push(entry);
      }
    }
  }

  return { entries, total: totalCount };
}

module.exports = {
  analyzeRequestLog,
  analyzeRequestLogFromStream,
  buildRequestFilter,
  countMatchingRequestEntries,
  extractRequestPage,
  countAndExtractRequestEntries,
  countAndExtractRequestEntriesFromStream
};
