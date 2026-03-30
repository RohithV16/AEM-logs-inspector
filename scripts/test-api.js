const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/test-api.js <path-to-log-file>');
  console.error('Example: node scripts/test-api.js /path/to/error.log');
  console.error('\nMake sure the server is running: npm run dashboard');
  process.exit(1);
}

let testData = {};

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json')
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const endpoints = [
  {
    name: 'POST /api/analyze',
    method: 'POST',
    path: '/api/analyze',
    body: { filePath }
  },
  {
    name: 'POST /api/filter',
    method: 'POST',
    path: '/api/filter',
    body: { filePath, filters: {} }
  },
  {
    name: 'POST /api/trend',
    method: 'POST',
    path: '/api/trend',
    body: { filePath, days: 7 }
  },
  {
    name: 'POST /api/raw-events',
    method: 'POST',
    path: '/api/raw-events',
    body: { filePath, page: 1, perPage: 10 }
  },
  {
    name: 'POST /api/alerts/check',
    method: 'POST',
    path: '/api/alerts/check',
    body: {
      summary: { totalErrors: 100, totalWarnings: 0, uniqueErrors: 0 },
      results: [{ message: 'test error', count: 50, examples: [] }],
      thresholds: { maxErrors: 1000, maxWarnings: 500, maxUniqueErrors: 20, criticalLoggers: ['com.adobe.test'] }
    }
  },
  {
    name: 'POST /api/export/csv',
    method: 'POST',
    path: '/api/export/csv',
    body: null
  },
  {
    name: 'POST /api/export/json',
    method: 'POST',
    path: '/api/export/json',
    body: null
  },
  {
    name: 'POST /api/export/pdf',
    method: 'POST',
    path: '/api/export/pdf',
    body: null
  }
];

async function runTests() {
  try {
    console.log(`\nTesting APIs with log file: ${filePath}\n`);
    console.log('='.repeat(50));

    const analyzeResult = await request('POST', '/api/analyze', { filePath });
    console.log('\nAnalyzing log file...');
    
    if (!analyzeResult.body.success) {
      console.error('\nError analyzing file:', analyzeResult.body.error);
      process.exit(1);
    }

    console.log('Analysis complete. Running endpoint tests...\n');
    
    testData.summary = analyzeResult.body.summary;
    testData.results = analyzeResult.body.results || [];

    const tests = endpoints.map(async (endpoint) => {
      try {
        let body = endpoint.body;
        
        if (endpoint.path === '/api/export/csv' || endpoint.path === '/api/export/json') {
          body = { results: testData.results.length > 0 ? testData.results : [{ message: 'test', count: 1 }] };
        }
        if (endpoint.path === '/api/export/pdf') {
          body = { summary: testData.summary || { totalErrors: 0 }, results: testData.results.length > 0 ? testData.results : [] };
        }

        const result = await request(endpoint.method, endpoint.path, body);
        const isJsonResponse = typeof result.body === 'object' && result.body !== null && !Array.isArray(result.body);
        const success = isJsonResponse ? result.body.success === true : result.status < 400;
        return { name: endpoint.name, success, status: result.status };
      } catch (err) {
        return { name: endpoint.name, success: false, error: err.message };
      }
    });

    const results = await Promise.all(tests);

    console.log('Results:\n');
    let passed = 0;
    let failed = 0;

    for (const r of results) {
      const status = r.success ? '✓ PASS' : '✗ FAIL';
      console.log(`${status} ${r.name}`);
      if (r.status) console.log(`       Status: ${r.status}`);
      if (r.error) console.log(`       Error: ${r.error}`);
      if (r.success) passed++;
      else failed++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);

  } catch (err) {
    console.error('Test error:', err.message);
    console.error('\nIs the server running? Start it with: npm run dashboard');
    process.exit(1);
  }
}

runTests();
