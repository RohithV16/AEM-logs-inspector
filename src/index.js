#!/usr/bin/env node

/* === CLI Entry Point === */
/* A simple command-line interface for quick log analysis without the web UI */

/* === Imports === */
const { analyzeLogFile, getSummary } = require('./analyzer');
const fs = require('fs');

/* === CLI Argument Validation === */
const filePath = process.argv[2];

/* Exit early with usage instructions if no file path provided */
if (!filePath) {
  console.error('Usage: npm start <path-to-log-file>');
  console.error('Example: npm start /Users/rvenat01/Downloads/author_aemerror_2026-03-16.log');
  process.exit(1);
}

/* Verify file exists before attempting analysis */
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

/* === Analysis Execution === */
console.log('\n=== AEM Log Analyzer ===\n');
console.log(`Analyzing: ${filePath}\n`);

/* Get quick summary statistics without full parsing */
const summary = getSummary(filePath);
console.log('--- Summary ---');
console.log(`Total Errors:   ${summary.totalErrors}`);
console.log(`Total Warnings: ${summary.totalWarnings}`);
console.log(`Unique Errors:  ${summary.uniqueErrors}`);
console.log(`Unique Warnings: ${summary.uniqueWarnings}`);

/* Perform full analysis to group and count repeated errors */
const results = analyzeLogFile(filePath);

/* Display top repeated errors - helps identify persistent issues */
console.log('\n--- Top 10 Repeated Errors ---');
const errors = results.filter(r => r.level === 'ERROR').slice(0, 10);
errors.forEach((e, i) => {
  console.log(`\n${i + 1}. [${e.count}x] ${e.message.substring(0, 80)}...`);
});

/* Display top repeated warnings - helps identify degradation trends */
console.log('\n--- Top 10 Repeated Warnings ---');
const warnings = results.filter(r => r.level === 'WARN').slice(0, 10);
warnings.forEach((w, i) => {
  console.log(`\n${i + 1}. [${w.count}x] ${w.message.substring(0, 80)}...`);
});

console.log('\n');
