const path = require('path');
const { detectLogType } = require('../parser');
const { resolveAnalysisTargets } = require('../utils/files');
const {
  analyzeBatch,
  collectBatchEvents,
  countAndExtractBatchEntries,
  buildBatchEventMatcher
} = require('./batchAnalysisService');

async function resolveMultiErrorTargets(input) {
  const filePaths = resolveAnalysisTargets(input);

  if (filePaths.length < 2) {
    throw new Error('Please provide at least two error log paths.');
  }

  for (const filePath of filePaths) {
    const logType = await detectLogType(filePath);
    if (logType !== 'error') {
      throw new Error(`Multi-error analysis supports error logs only. Invalid file: ${path.basename(filePath)}`);
    }
  }

  return filePaths;
}

async function analyzeMultiError(input, filters = {}, onProgress) {
  const filePaths = await resolveMultiErrorTargets(input);
  const result = await analyzeBatch(filePaths, filters, onProgress);

  return {
    ...result,
    logType: 'multi-error'
  };
}

async function collectMultiErrorEvents(input, filters = {}, options = {}) {
  const filePaths = await resolveMultiErrorTargets(input);
  return collectBatchEvents(filePaths, filters, options);
}

async function countAndExtractMultiErrorEntries(input, filters = {}, page = 1, pageSize = 50) {
  const filePaths = await resolveMultiErrorTargets(input);
  return countAndExtractBatchEntries(filePaths, filters, page, pageSize);
}

module.exports = {
  analyzeMultiError,
  collectMultiErrorEvents,
  countAndExtractMultiErrorEntries,
  buildMultiErrorEventMatcher: buildBatchEventMatcher,
  resolveMultiErrorTargets
};
