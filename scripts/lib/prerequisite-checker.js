const { execSync } = require('child_process');

const MIN_NODE_VERSION = 17;

function getCommandVersion(command, versionFlag) {
  try {
    const output = execSync(`${command} ${versionFlag}`, {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.trim();
  } catch (error) {
    return null;
  }
}

function verifyNodeVersion(version) {
  if (!version) {
    throw new Error('Node.js 17.0+ is required');
  }

  const match = version.match(/^v?(\d+)\./);
  if (!match) {
    throw new Error('Node.js 17.0+ is required');
  }

  const majorVersion = parseInt(match[1], 10);
  if (majorVersion < MIN_NODE_VERSION) {
    throw new Error('Node.js 17.0+ is required');
  }
}

function checkPrerequisites() {
  const nodeVersion = getCommandVersion('node', '--version');
  const npmVersion = getCommandVersion('npm', '--version');
  const aioVersion = getCommandVersion('aio', '--version');

  let nodeInstalled = false;
  let nodeMet = false;
  if (nodeVersion) {
    nodeInstalled = true;
    try {
      verifyNodeVersion(nodeVersion);
      nodeMet = true;
    } catch (error) {
      nodeMet = false;
    }
  }

  const npmInstalled = !!npmVersion;

  let aioInstalled = false;
  if (aioVersion) {
    aioInstalled = true;
  }

  let cloudManagerPluginInstalled = false;
  if (aioInstalled) {
    try {
      const pluginsOutput = execSync('aio plugins', {
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      cloudManagerPluginInstalled = pluginsOutput.includes('@adobe/aio-cli-plugin-cloudmanager');
    } catch (error) {
      cloudManagerPluginInstalled = false;
    }
  }

  return {
    node: {
      installed: nodeInstalled,
      met: nodeMet,
      version: nodeVersion
    },
    npm: {
      installed: npmInstalled,
      version: npmVersion
    },
    aioCli: {
      installed: aioInstalled,
      version: aioVersion
    },
    cloudManagerPlugin: {
      installed: cloudManagerPluginInstalled
    }
  };
}

module.exports = {
  getCommandVersion,
  verifyNodeVersion,
  checkPrerequisites
};
