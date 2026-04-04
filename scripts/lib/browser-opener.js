const { spawn } = require('child_process');

const platform = process.platform;

function openBrowser(url) {
  return new Promise((resolve) => {
    let command;
    let args;

    if (platform === 'darwin') {
      command = 'open';
      args = [url];
    } else if (platform === 'win32') {
      command = 'cmd';
      args = ['/c', 'start', url];
    } else {
      command = 'xdg-open';
      args = [url];
    }

    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });

    child.on('error', (err) => {
      console.error(`Failed to open browser: ${err.message}`);
      resolve(false);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`Browser open exited with code ${code}`);
        resolve(false);
      }
    });

    child.unref();
  });
}

module.exports = {
  openBrowser
};
