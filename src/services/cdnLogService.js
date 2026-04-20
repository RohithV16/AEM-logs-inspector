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
  const { method, status, cache, country, pop, host, minTtfb, maxTtfb, minTtlb, maxTtlb, from, to, requestId, aemEnvKind, aemTenant, rules, url } = filters;
  
  const methods = Array.isArray(method) ? method.map(m => String(m).toUpperCase()) : (method ? [String(method).toUpperCase()] : []);
  const statuses = Array.isArray(status) ? status.map(s => Number(s)) : (status ? [Number(status)] : []);
  const caches = Array.isArray(cache) ? cache.map(c => String(c).toUpperCase()) : (cache ? [String(cache).toUpperCase()] : []);
  const countries = Array.isArray(country) ? country.map(c => String(c).toUpperCase()) : (country ? [String(country).toUpperCase()] : []);
  const pops = Array.isArray(pop) ? pop.map(p => String(p).toUpperCase()) : (pop ? [String(pop).toUpperCase()] : []);
  const hosts = Array.isArray(host) ? host.map(h => String(h).toLowerCase()) : (host ? [String(host).toLowerCase()] : []);
  const requestIds = Array.isArray(requestId) ? requestId.map(r => String(r)) : (requestId ? [String(requestId)] : []);
  const envKinds = Array.isArray(aemEnvKind) ? aemEnvKind.map(e => String(e).toUpperCase()) : (aemEnvKind ? [String(aemEnvKind).toUpperCase()] : []);
  const tenants = Array.isArray(aemTenant) ? aemTenant.map(t => String(t).toLowerCase()) : (aemTenant ? [String(aemTenant).toLowerCase()] : []);
  const ruleSets = Array.isArray(rules) ? rules.map(r => String(r).toLowerCase()) : (rules ? [String(rules).toLowerCase()] : []);
  const filterUrls = Array.isArray(url) ? url.map(u => String(u)) : (url ? [String(url)] : []);
  
  const targetMinTtfb = minTtfb ? Number(minTtfb) : null;
  const targetMaxTtfb = maxTtfb ? Number(maxTtfb) : null;
  const targetMinTtlb = minTtlb ? Number(minTtlb) : null;
  const targetMaxTtlb = maxTtlb ? Number(maxTtlb) : null;

  /* Pre-normalize date filters to ensure consistent UTC-based comparison */
  const parseFilterDate = (dateStr) => {
    if (!dateStr) return null;
    const normalized = dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+') 
      ? dateStr + 'Z' 
      : dateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  };

  const fromDate = parseFilterDate(from);
  const toDate = parseFilterDate(to);

  return (entry) => {
    if (process.env.DEBUG_FILTERS) console.log('Filtering CDN Entry:', entry.timestamp, 'Filters:', JSON.stringify(filters));
    
    if (methods.length > 0 && !methods.includes(String(entry.method || '').toUpperCase())) return false;
    if (statuses.length > 0 && !statuses.includes(Number(entry.status))) return false;
    if (caches.length > 0 && !caches.includes(String(entry.cache || '').toUpperCase())) return false;
    if (countries.length > 0 && !countries.includes(String(entry.clientCountry || '').toUpperCase())) return false;
    if (pops.length > 0 && !pops.includes(String(entry.pop || '').toUpperCase())) return false;
    if (hosts.length > 0 && !hosts.includes(String(entry.host || '').toLowerCase())) return false;
    if (requestIds.length > 0 && !requestIds.some(id => String(entry.requestId || '').includes(id))) return false;
    if (envKinds.length > 0 && !envKinds.includes(String(entry.aemEnvKind || '').toUpperCase())) return false;
    if (tenants.length > 0 && !tenants.some(t => String(entry.aemTenant || '').toLowerCase().includes(t))) return false;
    if (ruleSets.length > 0 && !ruleSets.some(r => String(entry.rules || '').toLowerCase().includes(r))) return false;
    if (filterUrls.length > 0 && !filterUrls.some(u => String(entry.url || '').toLowerCase().includes(u.toLowerCase()))) return false;
    
    if (targetMinTtfb && (entry.ttfb || 0) < targetMinTtfb) return false;
    if (targetMaxTtfb && (entry.ttfb || 0) > targetMaxTtfb) return false;
    if (targetMinTtlb && (entry.ttlb || 0) < targetMinTtlb) return false;
    if (targetMaxTtlb && (entry.ttlb || 0) > targetMaxTtlb) return false;

    /* Date Range Filtering - CDN entries use ISO timestamps */
    if (fromDate || toDate) {
      if (!entry.timestamp) return false;
      const entryTime = new Date(entry.timestamp).getTime();
      if (fromDate && entryTime < fromDate.getTime()) return false;
      if (toDate && entryTime > toDate.getTime()) return false;
    }
    
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
  const uniqueMethods = new Set();
  const uniqueStatuses = new Set();
  const uniqueCache = new Set();
  const uniqueCountries = new Set();
  const uniquePops = new Set();
  const uniqueHosts = new Set();
  let skipped = (page - 1) * pageSize;
  let totalCount = 0;

  for await (const entry of stream) {
    if (entry.method) uniqueMethods.add(entry.method);
    if (entry.status) uniqueStatuses.add(String(entry.status));
    if (entry.cache) uniqueCache.add(entry.cache);
    if (entry.clientCountry) uniqueCountries.add(entry.clientCountry);
    if (entry.pop) uniquePops.add(entry.pop);
    if (entry.host) uniqueHosts.add(entry.host);
    
    if (filter(entry)) {
      totalCount++;
      if (skipped > 0) {
        skipped--;
      } else if (entries.length < pageSize) {
        entries.push(entry);
      }
    }
  }

  return { 
    entries, 
    total: totalCount,
    methods: Array.from(uniqueMethods).sort(),
    statuses: Array.from(uniqueStatuses).sort((a, b) => Number(a) - Number(b)),
    cacheStatuses: Array.from(uniqueCache).sort(),
    countries: Array.from(uniqueCountries).sort(),
    pops: Array.from(uniquePops).sort(),
    hosts: Array.from(uniqueHosts).sort()
  };
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
