const { execSync } = require('child_process');

jest.mock('child_process');

const {
  getCommandVersion,
  verifyNodeVersion,
  checkPrerequisites
} = require('../../scripts/lib/prerequisite-checker');

describe('prerequisite-checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommandVersion', () => {
    test('returns version string for existing command', () => {
      execSync.mockReturnValue('v18.19.0');
      
      const version = getCommandVersion('node', '--version');
      
      expect(execSync).toHaveBeenCalledWith('node --version', expect.any(Object));
      expect(version).toBe('v18.19.0');
    });

    test('returns null for non-existent command', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });
      
      const version = getCommandVersion('nonexistent', '--version');
      
      expect(version).toBeNull();
    });

    test('handles npm version output', () => {
      execSync.mockReturnValue('10.2.3');
      
      const version = getCommandVersion('npm', '--version');
      
      expect(version).toBe('10.2.3');
    });

    test('handles aio cli version output', () => {
      execSync.mockReturnValue('Adobe I/O CLI 3.2.2\nhttps://github.com/adobe/aio-cli');
      
      const version = getCommandVersion('aio', '--version');
      
      expect(version).toContain('Adobe I/O CLI');
    });
  });

  describe('verifyNodeVersion', () => {
    test('accepts Node.js version 17.0.0', () => {
      expect(() => verifyNodeVersion('v17.0.0')).not.toThrow();
    });

    test('accepts Node.js version 18.19.0', () => {
      expect(() => verifyNodeVersion('v18.19.0')).not.toThrow();
    });

    test('accepts Node.js version 20.10.0', () => {
      expect(() => verifyNodeVersion('v20.10.0')).not.toThrow();
    });

    test('accepts Node.js version 22.0.0', () => {
      expect(() => verifyNodeVersion('v22.0.0')).not.toThrow();
    });

    test('rejects Node.js version 16.0.0', () => {
      expect(() => verifyNodeVersion('v16.0.0')).toThrow('Node.js 17.0+ is required');
    });

    test('rejects Node.js version 14.x', () => {
      expect(() => verifyNodeVersion('v14.21.0')).toThrow('Node.js 17.0+ is required');
    });

    test('rejects empty version string', () => {
      expect(() => verifyNodeVersion('')).toThrow('Node.js 17.0+ is required');
    });

    test('rejects null version', () => {
      expect(() => verifyNodeVersion(null)).toThrow('Node.js 17.0+ is required');
    });
  });

  describe('checkPrerequisites', () => {
    test('returns all required fields when all prerequisites are met', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('node --version')) {
          return 'v18.19.0';
        }
        if (command.includes('npm --version')) {
          return '10.2.3';
        }
        if (command.includes('aio --version')) {
          return 'Adobe I/O CLI 3.2.2';
        }
        if (command.includes('aio plugins')) {
          return '@adobe/aio-cli-plugin-cloudmanager';
        }
        throw new Error('Unknown command');
      });

      const result = checkPrerequisites();

      expect(result).toHaveProperty('node');
      expect(result).toHaveProperty('npm');
      expect(result).toHaveProperty('aioCli');
      expect(result).toHaveProperty('cloudManagerPlugin');
      expect(result.node.installed).toBe(true);
      expect(result.npm.installed).toBe(true);
      expect(result.aioCli.installed).toBe(true);
      expect(result.cloudManagerPlugin.installed).toBe(true);
    });

    test('returns installed: false for missing node', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = checkPrerequisites();

      expect(result.node.installed).toBe(false);
    });

    test('returns installed: false for missing npm', () => {
      let callCount = 0;
      execSync.mockImplementation((command) => {
        callCount++;
        if (command.includes('node --version')) {
          return 'v18.19.0';
        }
        if (command.includes('npm --version')) {
          throw new Error('Command not found');
        }
        throw new Error('Unknown command');
      });

      const result = checkPrerequisites();

      expect(result.npm.installed).toBe(false);
    });

    test('returns installed: false for missing aio cli', () => {
      let callCount = 0;
      execSync.mockImplementation((command) => {
        callCount++;
        if (command.includes('node --version')) {
          return 'v18.19.0';
        }
        if (command.includes('npm --version')) {
          return '10.2.3';
        }
        if (command.includes('aio --version')) {
          throw new Error('Command not found');
        }
        throw new Error('Unknown command');
      });

      const result = checkPrerequisites();

      expect(result.aioCli.installed).toBe(false);
    });

    test('returns installed: false for missing cloudmanager plugin', () => {
      let callCount = 0;
      execSync.mockImplementation((command) => {
        callCount++;
        if (command.includes('node --version')) {
          return 'v18.19.0';
        }
        if (command.includes('npm --version')) {
          return '10.2.3';
        }
        if (command.includes('aio --version')) {
          return 'Adobe I/O CLI 3.2.2';
        }
        if (command.includes('aio plugins')) {
          return '';
        }
        throw new Error('Unknown command');
      });

      const result = checkPrerequisites();

      expect(result.cloudManagerPlugin.installed).toBe(false);
    });

    test('includes version information when installed', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('node --version')) {
          return 'v20.10.0';
        }
        if (command.includes('npm --version')) {
          return '10.2.3';
        }
        if (command.includes('aio --version')) {
          return 'Adobe I/O CLI 3.2.2';
        }
        if (command.includes('aio plugins')) {
          return '@adobe/aio-cli-plugin-cloudmanager';
        }
        throw new Error('Unknown command');
      });

      const result = checkPrerequisites();

      expect(result.node.version).toBe('v20.10.0');
      expect(result.npm.version).toBe('10.2.3');
      expect(result.aioCli.version).toBe('Adobe I/O CLI 3.2.2');
    });
  });
});
