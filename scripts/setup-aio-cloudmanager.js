#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const { checkPrerequisites, verifyNodeVersion } = require('./lib/prerequisite-checker');
const { openBrowser } = require('./lib/browser-opener');

const DASHBOARD_URL = 'http://localhost:3000';
const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  PREREQ_FAILED: 2,
  INSTALL_FAILED: 3
};

function showBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     Adobe I/O Cloud Manager Setup Wizard                        ║
║                                                               ║
║     Setting up your Cloud Manager development environment      ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

function log(message) {
  console.log(`  ${message}`);
}

function logSuccess(message) {
  console.log(`  ✓ ${message}`);
}

function logError(message) {
  console.log(`  ✗ ${message}`);
}

function logInfo(message) {
  console.log(`  ℹ ${message}`);
}

function execCommand(command, errorMessage) {
  try {
    execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch (error) {
    if (errorMessage) {
      logError(errorMessage);
    }
    return false;
  }
}

function installAioCli() {
  log('Installing Adobe I/O CLI globally...');
  try {
    execSync('npm install -g @adobe/aio-cli', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    return false;
  }
}

function installCloudManagerPlugin() {
  log('Installing Cloud Manager plugin...');
  try {
    execSync('aio plugins install @adobe/aio-cli-plugin-cloudmanager', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    return false;
  }
}

function loadExistingCredentials() {
  try {
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aio', 'config.json');
    const fs = require('fs');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.credentials && Object.keys(config.credentials).length > 0) {
        return true;
      }
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function openDashboard() {
  log(`Opening dashboard at ${DASHBOARD_URL}...`);
  const success = await openBrowser(DASHBOARD_URL);
  if (success) {
    logSuccess('Dashboard opened in browser');
  } else {
    logError('Failed to open browser automatically');
    logInfo(`Please open your browser and navigate to ${DASHBOARD_URL}`);
  }
}

async function main() {
  showBanner();

  log('Checking prerequisites...\n');

  const prereqs = checkPrerequisites();

  if (!prereqs.node.installed) {
    logError('Node.js is not installed');
    logInfo('Please install Node.js 17.0 or higher from https://nodejs.org');
    process.exit(EXIT_CODES.PREREQ_FAILED);
  }

  if (!prereqs.node.met) {
    logError(`Node.js version ${prereqs.node.version} is too old`);
    logInfo('Please upgrade to Node.js 17.0 or higher');
    process.exit(EXIT_CODES.PREREQ_FAILED);
  }

  logSuccess(`Node.js ${prereqs.node.version} found`);

  if (!prereqs.npm.installed) {
    logError('npm is not installed');
    logInfo('Please install npm');
    process.exit(EXIT_CODES.PREREQ_FAILED);
  }

  logSuccess(`npm ${prereqs.npm.version} found`);

  if (!prereqs.aioCli.installed) {
    logInfo('Adobe I/O CLI not found');
    log('Installing Adobe I/O CLI...');

    const installed = installAioCli();
    if (!installed) {
      logError('Failed to install Adobe I/O CLI');
      logInfo('Please run: npm install -g @adobe/aio-cli');
      process.exit(EXIT_CODES.INSTALL_FAILED);
    }

    logSuccess('Adobe I/O CLI installed successfully');
  } else {
    logSuccess(`Adobe I/O CLI ${prereqs.aioCli.version} found`);
  }

  if (!prereqs.cloudManagerPlugin.installed) {
    logInfo('Cloud Manager plugin not found');
    log('Installing Cloud Manager plugin...');

    const installed = installCloudManagerPlugin();
    if (!installed) {
      logError('Failed to install Cloud Manager plugin');
      logInfo('Please run: aio plugins install @adobe/aio-cli-plugin-cloudmanager');
      process.exit(EXIT_CODES.INSTALL_FAILED);
    }

    logSuccess('Cloud Manager plugin installed successfully');
  } else {
    logSuccess('Cloud Manager plugin is already installed');
  }

  log('');

  const hasCredentials = loadExistingCredentials();
  if (hasCredentials) {
    logSuccess('Existing credentials found');
  } else {
    logInfo('No existing credentials found');
    logInfo('You will need to authenticate with Adobe I/O in the dashboard');
  }

  log('');
  log('Setup complete!');
  log('');

  await openDashboard();

  log('');
  log('Next steps:');
  log('  1. Complete the onboarding wizard in the dashboard');
  log('  2. Authenticate with your Adobe account');
  log('  3. Select your Organization and Project');
  log('');

  process.exit(EXIT_CODES.SUCCESS);
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(EXIT_CODES.ERROR);
});
