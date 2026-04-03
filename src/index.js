#!/usr/bin/env node

/* === CLI Entry Point === */
/* Supports single-file analysis */

const fs = require('fs');
const { analyzeLogFile, getSummary } = require('./analyzer');

function parseArgs(argv) {
  const options = { inputs: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    options.inputs.push(arg);
  }

  return options;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.inputs.length) {
    console.error('Usage: npm start <path-to-log-file>');
    console.error('Example: npm start /Users/rvenat01/Downloads/author_aemerror_2026-03-16.log');
    process.exit(1);
  }

  if (options.inputs.length > 1 || options.inputs[0].includes(',')) {
    console.error('Error: Multi-file analysis is available in the dashboard multi-error panel, not the CLI.');
    process.exit(1);
  }

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
}

if (require.main === module) {
  run();
}

module.exports = {
  parseArgs,
  run
};
