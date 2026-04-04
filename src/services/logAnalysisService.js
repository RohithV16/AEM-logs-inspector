const { detectLogSignature, detectLogTypeAndCreateStream } = require('../parser');
const { analyzeAllInOnePass, analyzeAllInOnePassFromStream } = require('./errorLogService');
const { analyzeRequestLog, analyzeRequestLogFromStream } = require('./requestLogService');
const { analyzeCDNLog, analyzeCDNLogFromStream } = require('./cdnLogService');

async function analyzeResolvedLogFile(filePath, onProgress) {
  const signature = await detectLogSignature(filePath);
  if (!signature.supported) {
    const error = new Error(signature.unsupportedReason);
    error.logSignature = signature;
    throw error;
  }

  const { logType, logFamily, stream } = await detectLogTypeAndCreateStream(filePath, {
    logOptions: { levels: 'all' }
  });

  let result;
  if (logType === 'request') {
    result = stream
      ? await analyzeRequestLogFromStream(stream, filePath, onProgress)
      : await analyzeRequestLog(filePath, onProgress);
  } else if (logType === 'cdn') {
    result = stream
      ? await analyzeCDNLogFromStream(stream, filePath, onProgress)
      : await analyzeCDNLog(filePath, onProgress);
  } else {
    result = stream
      ? await analyzeAllInOnePassFromStream(stream, filePath, onProgress)
      : await analyzeAllInOnePass(filePath, onProgress);
  }

  return {
    logType,
    logFamily: logFamily || signature.logFamily,
    payload: buildAnalysisResponse(logType, result, {
      logFamily: logFamily || signature.logFamily,
      supported: true,
      detectedBy: signature.detectedBy
    })
  };
}

function buildAnalysisResponse(logType, result, metadata = {}) {
  if (logType === 'request') {
    return {
      success: true,
      logType: 'request',
      logFamily: metadata.logFamily || 'aem-request',
      supported: true,
      detectedBy: metadata.detectedBy || '',
      summary: result.summary,
      filterOptions: result.filterOptions,
      results: result.results,
      methods: result.methods,
      statuses: result.statuses,
      pods: result.pods,
      timeline: result.timeline
    };
  }

  if (logType === 'cdn') {
    return {
      success: true,
      logType: 'cdn',
      logFamily: metadata.logFamily || 'cdn-json',
      supported: true,
      detectedBy: metadata.detectedBy || '',
      summary: result.summary,
      filterOptions: result.filterOptions,
      methods: result.methods,
      statuses: result.statuses,
      cacheStatuses: result.cacheStatuses,
      countries: result.countries,
      pops: result.pops,
      hosts: result.hosts,
      timeline: result.timeline
    };
  }

  return {
    success: true,
    logType: 'error',
    logFamily: metadata.logFamily || 'aem-error',
    supported: true,
    detectedBy: metadata.detectedBy || '',
    summary: result.summary,
    results: result.results,
    loggers: result.loggers,
    threads: result.threads,
    packages: result.packages,
    exceptions: result.exceptions,
    httpMethods: result.httpMethods,
    packageThreads: result.packageThreads,
    packageExceptions: result.packageExceptions,
    timeline: result.timeline,
    levelCounts: result.levelCounts
  };
}

module.exports = {
  analyzeResolvedLogFile,
  buildAnalysisResponse
};
