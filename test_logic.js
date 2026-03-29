const { detectLogType, analyzeAllInOnePass, analyzeRequestLog, buildEntryFilter, countAndExtractRequestEntries, buildRequestFilter } = require('./src/analyzer');
const path = require('path');

async function test() {
  const errorLog = '/Users/rvenat01/Downloads/author_aemerror_2026-03-29.log';
  const requestLog = '/Users/rvenat01/Downloads/author_aemrequest_2026-03-29.log';

  console.log('--- Testing Error Log ---');
  const errorLogType = await detectLogType(errorLog);
  console.log('Detected Log Type:', errorLogType);
  
  if (errorLogType === 'error') {
    const errorResult = await analyzeAllInOnePass(errorLog);
    console.log('Summary:', errorResult.summary);
    console.log('Unique Errors:', errorResult.results.length);
    console.log('Top Loggers:', Object.keys(errorResult.loggers).slice(0, 3));
  }

  console.log('\n--- Testing Request Log ---');
  const requestLogType = await detectLogType(requestLog);
  console.log('Detected Log Type:', requestLogType);

  if (requestLogType === 'request') {
    const requestResult = await analyzeRequestLog(requestLog);
    console.log('Summary:', requestResult.summary);
    console.log('Statuses:', requestResult.statuses);
    
    // Test Filtering with status '200'
    console.log('\n--- Testing Request Filter (Status 200) ---');
    const filter = buildRequestFilter({ httpStatus: '200' });
    const filteredResults = await countAndExtractRequestEntries(requestLog, filter, 0, 5);
    console.log('Total 200s:', filteredResults.total);
    if (filteredResults.events.length > 0) {
      console.log('Example 200 URL:', filteredResults.events[0].url);
    }
  }
}

test().catch(console.error);
