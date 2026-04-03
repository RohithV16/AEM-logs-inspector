# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: log-types.test.js >> AEM Log Inspector - Log Type Detection Tests >> 10. Calculate cache hit ratio in CDN logs (HIT/MISS ratio)
- Location: tests/e2e/log-types.test.js:126:3

# Error details

```
Error: ENOENT: no such file or directory, stat '/Users/rvenat01/Documents/rohith/logs-inspector/tests/e2e/test-data/author_cdn_2026-03-29.log.gz'
```

# Test source

```ts
  1   | const fs = require('fs');
  2   | const { createCDNLogStream } = require('../parser');
  3   | 
  4   | /* === Core Analysis === */
  5   | 
  6   | /**
  7   |  * Analyzes CDN logs, collecting cache performance, geographic distribution,
  8   |  * and timing metrics (TTFB/TTLB).
  9   |  * @param {string} filePath - Path to the CDN log file
  10  |  * @param {function} onProgress - Optional callback for progress updates
  11  |  * @returns {Promise<Object>} Analysis results with summary, filter options, and detailed metrics
  12  |  */
  13  | async function analyzeCDNLog(filePath, onProgress) {
  14  |   const stream = createCDNLogStream(filePath);
  15  |   const fileSize = fs.statSync(filePath).size;
  16  | 
  17  |   const methods = {};
  18  |   const statuses = {};
> 19  |   const cacheStatuses = {};
      |                       ^ Error: ENOENT: no such file or directory, stat '/Users/rvenat01/Documents/rohith/logs-inspector/tests/e2e/test-data/author_cdn_2026-03-29.log.gz'
  20  |   const countries = {};
  21  |   const pops = {};
  22  |   const hosts = {};
  23  |   const ttfbTimes = [];
  24  |   const ttlbTimes = [];
  25  |   let totalRequests = 0;
  26  |   let totalTtfb = 0;
  27  |   let totalTtlb = 0;
  28  |   const timeline = {};
  29  | 
  30  |   for await (const entry of stream) {
  31  |     totalRequests++;
  32  | 
  33  |     if (entry.method) {
  34  |       methods[entry.method] = (methods[entry.method] || 0) + 1;
  35  |     }
  36  | 
  37  |     if (entry.status) {
  38  |       statuses[entry.status] = (statuses[entry.status] || 0) + 1;
  39  |     }
  40  | 
  41  |     if (entry.cache) {
  42  |       cacheStatuses[entry.cache] = (cacheStatuses[entry.cache] || 0) + 1;
  43  |     }
  44  | 
  45  |     if (entry.clientCountry) {
  46  |       countries[entry.clientCountry] = (countries[entry.clientCountry] || 0) + 1;
  47  |     }
  48  | 
  49  |     if (entry.pop) {
  50  |       pops[entry.pop] = (pops[entry.pop] || 0) + 1;
  51  |     }
  52  | 
  53  |     if (entry.host) {
  54  |       hosts[entry.host] = (hosts[entry.host] || 0) + 1;
  55  |     }
  56  | 
  57  |     /* TTFB: Time To First Byte - measures backend/origin response time
  58  |        TTLB: Time To Last Byte - measures total request completion time
  59  |        Both are essential for diagnosing CDN vs origin performance issues */
  60  |     if (entry.ttfb) {
  61  |       ttfbTimes.push(entry.ttfb);
  62  |       totalTtfb += entry.ttfb;
  63  |     }
  64  |     if (entry.ttlb) {
  65  |       ttlbTimes.push(entry.ttlb);
  66  |       totalTtlb += entry.ttlb;
  67  |     }
  68  | 
  69  |     /* Build hourly timeline with CDN-specific metrics - track cache hit rate over time
  70  |        to identify patterns like cache warming or invalidation events */
  71  |     if (entry.timestamp) {
  72  |       const hour = entry.timestamp.substring(0, 13);
  73  |       if (!timeline[hour]) timeline[hour] = { requests: 0, errors: 0, cacheHits: 0 };
  74  |       timeline[hour].requests++;
  75  |       if (entry.status >= 400) timeline[hour].errors++;
  76  |       if (entry.cache === 'HIT') timeline[hour].cacheHits++;
  77  |     }
  78  | 
  79  |     if (onProgress && totalRequests % 10000 === 0) {
  80  |       onProgress({ fileSize, totalRequests, percent: 0 });
  81  |     }
  82  |   }
  83  | 
  84  |   if (onProgress) onProgress({ fileSize, totalRequests, percent: 100 });
  85  | 
  86  |   /* Sort timing data for percentile calculations */
  87  |   ttfbTimes.sort((a, b) => a - b);
  88  |   ttlbTimes.sort((a, b) => a - b);
  89  |   const avgTtfb = totalRequests > 0 ? Math.round(totalTtfb / ttfbTimes.length) : 0;
  90  |   const avgTtlb = totalRequests > 0 ? Math.round(totalTtlb / ttlbTimes.length) : 0;
  91  | 
  92  |   /* Calculate cache hit ratio - critical CDN performance metric.
  93  |      Both HIT and TCP_HIT indicate cache was served; MISS and TCP_MISS indicate origin fetch.
  94  |      Some CDNs use different naming conventions, so we check both variants. */
  95  |   const cacheHits = (cacheStatuses['HIT'] || 0) + (cacheStatuses['TCP_HIT'] || 0);
  96  |   const cacheMisses = (cacheStatuses['MISS'] || 0) + (cacheStatuses['TCP_MISS'] || 0);
  97  |   const cacheHitRatio = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : 0;
  98  | 
  99  |   return {
  100 |     summary: {
  101 |       totalRequests,
  102 |       avgTtfb,
  103 |       avgTtlb,
  104 |       cacheHitRatio,
  105 |       cacheHits,
  106 |       cacheMisses
  107 |     },
  108 |     filterOptions: {
  109 |       methods: Object.keys(methods).sort(),
  110 |       statuses: Object.keys(statuses).map(s => parseInt(s)).sort((a, b) => a - b),
  111 |       cacheStatuses: Object.keys(cacheStatuses).sort(),
  112 |       countries: Object.keys(countries).sort(),
  113 |       pops: Object.keys(pops).sort(),
  114 |       hosts: Object.keys(hosts).sort()
  115 |     },
  116 |     methods,
  117 |     statuses,
  118 |     cacheStatuses,
  119 |     countries,
```