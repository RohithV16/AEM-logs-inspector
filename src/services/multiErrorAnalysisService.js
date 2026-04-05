const path = require('path');
const { detectLogType } = require('../parser');
const { resolveAnalysisTargets } = require('../utils/files');
const {
  analyzeBatch,
  analyzeMergedErrorFilters,
  collectBatchEvents,
  countAndExtractBatchEntries,
  buildBatchEventMatcher
} = require('./batchAnalysisService');

async function resolveMultiErrorSources(input) {
  const filePaths = resolveAnalysisTargets(input);
  const sources = [];

  if (filePaths.length < 2) {
    throw new Error('Please provide at least two error log paths.');
  }

  for (const filePath of filePaths) {
    const logType = await detectLogType(filePath);
    if (logType !== 'error') {
      throw new Error(`Multi-error analysis supports error logs only. Invalid file: ${path.basename(filePath)}`);
    }
    sources.push({ filePath, logType });
  }

  return sources;
}

async function resolveMultiErrorTargets(input) {
  const sources = await resolveMultiErrorSources(input);
  return sources.map(source => source.filePath);
}

async function analyzeMultiError(input, filters = {}, onProgress) {
  const sources = await resolveMultiErrorSources(input);
  const result = await analyzeBatch(sources, filters, onProgress);

  return {
    ...result,
    logType: 'multi-error'
  };
}

async function collectMultiErrorEvents(input, filters = {}, options = {}) {
  const sources = await resolveMultiErrorSources(input);
  return collectBatchEvents(sources, filters, options);
}

async function countAndExtractMultiErrorEntries(input, filters = {}, page = 1, pageSize = 50) {
  const sources = await resolveMultiErrorSources(input);
  return countAndExtractBatchEntries(sources, filters, page, pageSize);
}

async function analyzeMultiErrorFilters(input, filters = {}) {
  const sources = await resolveMultiErrorSources(input);
  return analyzeMergedErrorFilters(sources, filters);
}

module.exports = {
  analyzeMultiError,
  analyzeMergedErrorFilters: analyzeMultiErrorFilters,
  collectMultiErrorEvents,
  countAndExtractMultiErrorEntries,
  buildMultiErrorEventMatcher: buildBatchEventMatcher,
  resolveMultiErrorTargets,
  resolveMultiErrorSources
};
