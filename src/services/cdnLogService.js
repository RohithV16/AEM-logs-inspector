const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { createCDNLogStream } = require('../parser');
const { getCached, setCached } = require('../utils/analysisCache');
const { STREAM_THRESHOLD } = require('../utils/constants');

/* === Core Analysis === */

/**
 * Analyzes CDN logs, collecting cache performance, geographic distribution,
 * and timing metrics (TTFB/TTLB).
 * @param {string} filePath - Path to the CDN log file
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Analysis results with summary, filter options, and detailed metrics
 */
function shouldUseWorkerForAnalysis(filePath, options = {}) {
  if (options.disableWorker) return false;
  return fs.statSync(filePath).size > STREAM_THRESHOLD;
}

function runAnalysisWorker(filePath, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../workers/analyzeWorker.js'), {
      workerData: { service: 'cdn', filePath }
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

async function analyzeCDNLogFromStream(stream, filePath, onProgress) {
  if (!onProgress) {
    const cached = getCached(filePath);
    if (cached) return cached;
  }

  const fileSize = fs.statSync(filePath).size;

  const methods = {};
  const statuses = {};
  const cacheStatuses = {};
  const countries = {};
  const pops = {};
  const hosts = {};
  const ttfbTimes = [];
  const ttlbTimes = [];
  let totalRequests = 0;
  let totalTtfb = 0;
  let totalTtlb = 0;
  const timeline = {};

  for await (const entry of stream) {
    totalRequests++;

    if (entry.method) {
      methods[entry.method] = (methods[entry.method] || 0) + 1;
    }

    if (entry.status) {
      statuses[entry.status] = (statuses[entry.status] || 0) + 1;
    }

    if (entry.cache) {
      cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
    }

    if (entry.clientCountry) {
      countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
    }

    if (entry.pop) {
      pops[entry.pop] = (pops[entry.pop] || 0) + 1;
    }

    if (entry.host) {
      hosts[entry.host] = (hosts[entry.host] || 0) + 1;
    }

    /* TTFB: Time To First Byte - measures backend/origin response time
       TTLB: Time To Last Byte - measures total request completion time
       Both are essential for diagnosing CDN vs origin performance issues */
    if (entry.ttfb) {
      ttfbTimes.push(entry.ttfb);
      totalTtfb += entry.ttfb;
    }
    if (entry.ttlb) {
      ttlbTimes.push(entry.ttlb);
      totalTtlb += entry.ttlb;
    }

    /* Build hourly timeline with CDN-specific metrics - track cache hit rate over time
       to identify patterns like cache warming or invalidation events */
    if (entry.timestamp) {
      const hour = entry.timestamp.substring(0, 13);
      if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
      timeline[hour].requests++;
      if (entry.status >= 400) timeline[hour].errors++;
      if (entry.cache === 'HIT') timeline[hour].cacheHits++;
    }

    if (onProgress && totalRequests % 10000 === 0) {
      onProgress({ fileSize, totalRequests, percent: 0 });
    }
  }

  if (onProgress) onProgress({ fileSize, totalRequests, percent: 100 });

  /* Sort timing data for percentile calculations */
  ttfbTimes.sort((a, b) => a - b);
  ttlbTimes.sort((a, b) => a - b);
  const avgTtfb = totalRequests > 0 ? Math.round(totalTtfb / ttfbTimes.length) : 0;
  const avgTtlb = totalRequests > 0 ? Math.round(totalTtlb / ttlbTimes.length) : 0;

  /* Calculate cache hit ratio - critical CDN performance metric.
     Both HIT and TCP_HIT indicate cache was served; MISS and TCP_MISS indicate origin fetch.
     Some CDNs use different naming conventions, so we check both variants. */
  const cacheHits = (cacheStatuses['HIT'] || 0) + (cacheStatuses['TCP_HIT'] || 0);
  const cacheMisses = (cacheStatuses['MISS'] || 0) + (cacheStatuses['TCP_MISS'] || 0);
  const cacheHitRatio = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : 0;

  const result = {
    summary: {
      totalRequests,
      avgTtfb,
      avgTtlb,
      cacheHitRatio,
      cacheHits,
      cacheMisses
    },
    filterOptions: {
      methods: Object.keys(methods).sort(),
      statuses: Object.keys(statuses).map(s => parseInt(s)).sort((a, b) => a - b),
      cacheStatuses: Object.keys(cacheStatuses).sort(),
      countries: Object.keys(countries).sort(),
      pops: Object.keys(pops).sort(),
      hosts: Object.keys(hosts).sort()
    },
    methods,
    statuses,
    cacheStatuses,
    countries,
    pops,
    hosts,
    timeline
  };

  if (!onProgress) {
    setCached(filePath, result);
  }

  return result;
}

async function analyzeCDNLog(filePath, onProgress, options = {}) {
  if (shouldUseWorkerForAnalysis(filePath, options)) {
    return runAnalysisWorker(filePath, onProgress);
  }

  const stream = createCDNLogStream(filePath);
  return analyzeCDNLogFromStream(stream, filePath, onProgress);
}

/* === Filter Functions === */

/**
 * Builds a filter function for CDN log entries.
 * @param {Object} filters - Filter parameters
 * @param {string} filters.method - HTTP method
 * @param {number} filters.status - HTTP status code
 * @param {string} filters.cache - Cache status (HIT, MISS, etc.)
 * @param {string} filters.country - Client country code
 * @param {string} filters.pop - Point of Presence (PoP) identifier
 * @param {string} filters.host - Requested host
 * @param {number} filters.minTtfb - Minimum TTFB (ms)
 * @param {number} filters.maxTtfb - Maximum TTFB (ms)
 * @param {number} filters.minTtlb - Minimum TTLB (ms)
 * @param {number} filters.maxTtlb - Maximum TTLB (ms)
 * @returns {function} Filter function that returns true for matching entries
 */
function buildCDNFilter(filters = {}) {
  const { method, status, cache, country, pop, host, minTtfb, maxTtfb, minTtlb, maxTtlb } = filters;

  return (entry) => {
    if (method && entry.method !== method) return false;
    if (status && entry.status !== status) return false;
    if (cache && entry.cache !== cache) return false;
    if (country && entry.clientCountry !== country) return false;
    if (pop && entry.pop !== pop) return false;
    if (host && entry.host !== host) return false;
    if (minTtfb && entry.ttfb < minTtfb) return false;
    if (maxTtfb && entry.ttfb > maxTtfb) return false;
    if (minTtlb && entry.ttlb < minTtlb) return false;
    if (maxTtlb && entry.ttlb > maxTtlb) return false;
    return true;
  };
}

/**
 * Counts CDN log entries matching the given filters.
 * @param {string} filePath - Path to the CDN log file
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} Count of matching entries
 */
async function countMatchingCDNEntries(filePath, filters = {}) {
  const stream = createCDNLogStream(filePath);
  const filter = buildCDNFilter(filters);
  let count = 0;

  for await (const entry of stream) {
    if (filter(entry)) count++;
  }

  return count;
}

/**
 * Extracts a paginated subset of matching CDN log entries.
 * @param {string} filePath - Path to the CDN log file
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of entries per page
 * @returns {Promise<Object>} Object with entries array and total count
 */
async function extractCDNPage(filePath, filters = {}, page = 1, pageSize = 50) {
  const stream = createCDNLogStream(filePath);
  const filter = buildCDNFilter(filters);
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
 * Counts and extracts CDN entries in a single pass - more efficient than separate calls.
 * @param {string} filePath - Path to the CDN log file
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of entries per page
 * @returns {Promise<Object>} Object with entries array and total count
 */
async function countAndExtractCDNEntries(filePath, filters = {}, page = 1, pageSize = 50) {
  const stream = createCDNLogStream(filePath);
  return countAndExtractCDNEntriesFromStream(stream, filters, page, pageSize);
}

async function countAndExtractCDNEntriesFromStream(stream, filters = {}, page = 1, pageSize = 50) {
  const filter = buildCDNFilter(filters);
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
  analyzeCDNLog,
  analyzeCDNLogFromStream,
  buildCDNFilter,
  countMatchingCDNEntries,
  extractCDNPage,
  countAndExtractCDNEntries,
  countAndExtractCDNEntriesFromStream
};
