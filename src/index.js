#!/usr/bin/env node

const { analyzeLogFile, getSummary } = require('./analyzer');
const fs = require('fs');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npm start <path-to-log-file>');
  console.error('Example: npm start /Users/rvenat01/Downloads/author_aemerror_2026-03-16.log');
  process.exit(1);
}

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
