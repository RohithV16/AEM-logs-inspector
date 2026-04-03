#!/usr/bin/env node

/* === CLI Entry Point === */
/* Supports single-file analysis and batch correlation analysis */

const fs = require('fs');
const { analyzeLogFile, getSummary } = require('./analyzer');
const { analyzeBatch } = require('./services/batchAnalysisService');

function parseArgs(argv) {
  const options = {
    batch: false,
    directory: null,
    inputs: []
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--batch') {
      options.batch = true;
      continue;
    }
    if (arg === '--directory' || arg === '-d') {
      options.directory = argv[i + 1] || null;
      i++;
      continue;
    }
    if (arg.startsWith('--directory=')) {
      options.directory = arg.split('=').slice(1).join('=');
      continue;
    }
    options.inputs.push(arg);
  }

  return options;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const hasBatchShape = options.batch || options.directory || options.inputs.length > 1 || (options.inputs[0] && options.inputs[0].includes(','));

  if (!options.inputs.length && !options.directory) {
    console.error('Usage: npm start <path-to-log-file>');
    console.error('       npm start --batch <path1> <path2> [path3...]');
    console.error('       npm start --directory <path-to-log-directory>');
    console.error('Example: npm start /Users/rvenat01/Downloads/author_aemerror_2026-03-16.log');
    process.exit(1);
  }

  if (!hasBatchShape) {
    const filePath = options.inputs[0];

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    console.log('\n=== AEM Log Analyzer ===\n');
    console.log(`Analyzing: ${filePath}\n`);

    const summary = getSummary(filePath);
    console.log('--- Summary ---');
    console.log(`Total Errors:   ${summary.totalErrors}`);
    console.log(`Total Warnings: ${summary.totalWarnings}`);
    console.log(`Unique Errors:  ${summary.uniqueErrors}`);
    console.log(`Unique Warnings: ${summary.uniqueWarnings}`);

    const results = analyzeLogFile(filePath);

    console.log('\n--- Top 10 Repeated Errors ---');
    const errors = results.filter(r => r.level === 'ERROR').slice(0, 10);
    errors.forEach((e, i) => {
      console.log(`\n${i + 1}. [${e.count}x] ${e.message.substring(0, 80)}...`);
    });

    console.log('\n--- Top 10 Repeated Warnings ---');
    const warnings = results.filter(r => r.level === 'WARN').slice(0, 10);
    warnings.forEach((w, i) => {
      console.log(`\n${i + 1}. [${w.count}x] ${w.message.substring(0, 80)}...`);
    });

    console.log('\n');
    return;
  }

  const input = options.directory
    ? { directory: options.directory, filePaths: options.inputs }
    : options.inputs.length === 1
      ? options.inputs[0]
      : options.inputs;

  console.log('\n=== AEM Batch Correlation Analyzer ===\n');
  console.log('Analyzing multiple sources...\n');

  try {
    const result = await analyzeBatch(input, {});
    console.log('--- Batch Summary ---');
    console.log(`Total Files:    ${result.summary.totalFiles}`);
    console.log(`Total Events:   ${result.summary.totalEvents}`);
    console.log(`Total Errors:   ${result.summary.totalErrors}`);
    console.log(`Total Warnings: ${result.summary.totalWarnings}`);
    console.log(`Total Requests: ${result.summary.totalRequests}`);

    console.log('\n--- Sources ---');
    result.sources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.fileName} [${source.logType}] - ${source.eventCount} events`);
    });

    console.log('\n--- Incident Timeline ---');
    result.correlation.incidents.slice(0, 10).forEach((incident, index) => {
      console.log(`${index + 1}. ${incident.startTimestamp} -> ${incident.lastTimestamp} (${incident.total} events)`);
    });

    console.log('\n');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  parseArgs,
  run
};
