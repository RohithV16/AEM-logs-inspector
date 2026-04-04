const fs = require('fs');
const path = require('path');
const os = require('os');

const PROGRESS_FILE = path.join(
  os.homedir(), 
  '.aem-log-analyzer', 
  'setup-progress.json'
);

function trackProgress(step, status = 'in_progress') {
  try {
    const dir = path.dirname(PROGRESS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    const progress = {
      currentStep: step,
      status,
      timestamp: new Date().toISOString(),
      steps: {
        1: 'prerequisites',
        2: 'adobe_console',
        3: 'credentials',
        4: 'validation',
        5: 'organization',
        6: 'program',
        7: 'verification'
      }[step]
    };

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), {
      mode: 0o600,
      encoding: 'utf-8'
    });
  } catch (error) {
    console.warn('Failed to track progress:', error.message);
  }
}

function getProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.warn('Failed to get progress:', error.message);
  }
  return null;
}

module.exports = { trackProgress, getProgress };
