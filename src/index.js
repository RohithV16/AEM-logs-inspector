#!/usr/bin/env node

/* === CLI Entry Point === */

const { analyzeResolvedLogFile } = require('./services/logAnalysisService');
const { downloadLogs, createCloudManagerTailSession } = require('./services/cloudManagerService');
const { validateFilePath } = require('./utils/files');

function parseArgs(argv) {
  const [firstArg, secondArg, ...rest] = argv;

  if (firstArg === 'cloudmanager' && (secondArg === 'analyze' || secondArg === 'tail')) {
    return {
      mode: 'cloudmanager',
      action: secondArg,
      flags: parseFlags(rest)
    };
  }

  if (firstArg === 'analyze' && secondArg) {
    return {
      mode: 'local',
      filePath: secondArg
    };
  }

  return {
    mode: 'local',
    filePath: firstArg || ''
  };
}

function parseFlags(argv) {
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    i++;
  }

  return flags;
}

function printUsage() {
  console.error('Usage:');
  console.error('  npm start <path-to-log-file>');
  console.error('  node src/index.js analyze <path-to-log-file>');
  console.error('  node src/index.js cloudmanager analyze --programId <id> --environmentId <id> --service <name> --logName <name> --days <n> --outputDir <path>');
  console.error('  node src/index.js cloudmanager tail --environmentId <id> --service <name> --logName <name> [--programId <id>]');
}

function ensureLocalFile(filePath) {
  if (!filePath) {
    throw new Error('A local file path is required.');
  }

  return validateFilePath(filePath);
}

function ensureCloudManagerAnalyzeFlags(flags = {}) {
  const required = ['programId', 'environmentId', 'service', 'logName', 'outputDir'];
  const missing = required.filter((key) => !flags[key]);

  if (missing.length) {
    throw new Error(`Missing required flags: ${missing.map((key) => `--${key}`).join(', ')}`);
  }
}

function ensureCloudManagerTailFlags(flags = {}) {
  const required = ['environmentId', 'service', 'logName'];
  const missing = required.filter((key) => !flags[key]);

  if (missing.length) {
    throw new Error(`Missing required flags: ${missing.map((key) => `--${key}`).join(', ')}`);
  }
}

function printAnalysisHeader(label) {
  console.log('\n=== AEM Log Analyzer ===\n');
  console.log(`Analyzing: ${label}\n`);
}

function printAnalysisPayload(payload) {
  if (payload.logType === 'request') {
    console.log('--- Summary ---');
    console.log(`Total Requests:    ${payload.summary.totalRequests}`);
    console.log(`Avg Response Time: ${payload.summary.avgResponseTime} ms`);
    console.log(`Slow Requests:     ${payload.summary.slowRequests}`);
    console.log(`P95 Response Time: ${payload.summary.p95ResponseTime} ms`);
    console.log('\n--- Top Request URLs ---');
    payload.results.slice(0, 10).forEach((entry, index) => {
      console.log(`${index + 1}. [${entry.count}x] ${entry.url}`);
    });
    console.log('');
    return;
  }

  if (payload.logType === 'cdn') {
    console.log('--- Summary ---');
    console.log(`Total Requests: ${payload.summary.totalRequests}`);
    console.log(`Avg TTFB:       ${payload.summary.avgTtfb} ms`);
    console.log(`Avg TTLB:       ${payload.summary.avgTtlb} ms`);
    console.log(`Cache Hit Ratio:${payload.summary.cacheHitRatio}%`);
    console.log('\n--- Top Status Codes ---');
    Object.entries(payload.statuses || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([status, count], index) => {
        console.log(`${index + 1}. [${count}x] ${status}`);
      });
    console.log('');
    return;
  }

  console.log('--- Summary ---');
  console.log(`Total Errors:    ${payload.summary.totalErrors}`);
  console.log(`Total Warnings:  ${payload.summary.totalWarnings}`);
  console.log(`Unique Errors:   ${payload.summary.uniqueErrors}`);
  console.log(`Unique Warnings: ${payload.summary.uniqueWarnings}`);

  console.log('\n--- Top 10 Repeated Errors ---');
  payload.results
    .filter((entry) => entry.level === 'ERROR')
    .slice(0, 10)
    .forEach((entry, index) => {
      console.log(`${index + 1}. [${entry.count}x] ${entry.message.substring(0, 120)}`);
    });

  console.log('\n--- Top 10 Repeated Warnings ---');
  payload.results
    .filter((entry) => entry.level === 'WARN')
    .slice(0, 10)
    .forEach((entry, index) => {
      console.log(`${index + 1}. [${entry.count}x] ${entry.message.substring(0, 120)}`);
    });

  console.log('');
}

function formatTailEntry(entry = {}) {
  if (entry.rawLine) return entry.rawLine;
  if (entry.message) return entry.message;
  return JSON.stringify(entry);
}

async function runLocalAnalysis(filePath) {
  const targetPath = ensureLocalFile(filePath);
  printAnalysisHeader(targetPath);
  const { payload } = await analyzeResolvedLogFile(targetPath);
  printAnalysisPayload(payload);
}

async function runCloudManagerAnalysis(flags) {
  ensureCloudManagerAnalyzeFlags(flags);

  const download = await downloadLogs({
    programId: flags.programId,
    environmentId: flags.environmentId,
    service: flags.service,
    logName: flags.logName,
    days: flags.days || 1,
    outputDirectory: flags.outputDir
  });

  console.log('\n--- Downloaded Files ---');
  download.downloadedFiles.forEach((filePath, index) => {
    console.log(`${index + 1}. ${filePath}`);
  });
  console.log(`\nSelected for analysis: ${download.analyzedFile}`);

  printAnalysisHeader(download.analyzedFile);
  const { payload } = await analyzeResolvedLogFile(download.analyzedFile);
  printAnalysisPayload(payload);
}

async function runCloudManagerTail(flags) {
  ensureCloudManagerTailFlags(flags);

  await new Promise((resolve) => {
    const handleSigint = () => {
      session.stop();
    };

    const session = createCloudManagerTailSession({
      programId: flags.programId,
      environmentId: flags.environmentId,
      service: flags.service,
      logName: flags.logName,
      imsContextName: flags.imsContextName
    }, {
      onStatus: ({ status, message, commandPreview }) => {
        if (status === 'starting') {
          console.error(`Starting live tail: ${commandPreview}`);
        }
        if (message) {
          console.error(message);
        }
      },
      onEntry: (entry) => {
        process.stdout.write(`${formatTailEntry(entry)}\n`);
      },
      onError: (error) => {
        process.stderr.write(`Error: ${error.message}\n`);
      },
      onStopped: () => {
        process.removeListener('SIGINT', handleSigint);
        resolve();
      }
    });

    process.once('SIGINT', handleSigint);
    session.start();
  });
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  try {
    if (options.mode === 'cloudmanager') {
      if (options.action === 'tail') {
        await runCloudManagerTail(options.flags);
        return;
      }

      await runCloudManagerAnalysis(options.flags);
      return;
    }

    if (!options.filePath) {
      printUsage();
      process.exit(1);
    }

    await runLocalAnalysis(options.filePath);
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
  parseFlags,
  run
};
