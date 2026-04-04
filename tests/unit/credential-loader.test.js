const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  maskCredential,
  loadExistingCredentials,
  saveCredentials
} = require('../../scripts/lib/credential-loader');

describe('scripts/lib/credential-loader', () => {
  const testConfigDir = path.join(os.tmpdir(), 'aem-log-analyzer-test', 'setup');
  const testConfigPath = path.join(testConfigDir, 'cloudmanager-oauth-config.json');
  const originalConfigPath = path.join(os.homedir(), '.aem-log-analyzer', 'setup', 'cloudmanager-oauth-config.json');

  beforeAll(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir, { recursive: true });
    }
  });

  describe('maskCredential', () => {
    test('masks credential with first 4 and last 4 chars visible', () => {
      const result = maskCredential('abcdefghij');
      expect(result).toBe('abcd...ghij');
    });

    test('handles 8-char credential', () => {
      const result = maskCredential('abcdefgh');
      expect(result).toBe('abcd...efgh');
    });

    test('handles credential longer than 8 chars', () => {
      const result = maskCredential('abcdefghijklmnop');
      expect(result).toBe('abcd...mnop');
    });

    test('returns empty string for null', () => {
      const result = maskCredential(null);
      expect(result).toBe('');
    });

    test('returns empty string for undefined', () => {
      const result = maskCredential(undefined);
      expect(result).toBe('');
    });

    test('returns empty string for empty string', () => {
      const result = maskCredential('');
      expect(result).toBe('');
    });

    test('handles exactly 8 char credential', () => {
      const result = maskCredential('12345678');
      expect(result).toBe('1234...5678');
    });

    test('handles credential with only 1 char difference from mask length', () => {
      const result = maskCredential('abcdefghi');
      expect(result).toBe('abcd...fghi');
    });
  });

  describe('loadExistingCredentials', () => {
    test('returns null when file does not exist', () => {
      const result = loadExistingCredentials('/nonexistent/path/config.json');
      expect(result).toBeNull();
    });

    test('returns null when setup directory does not exist', () => {
      const result = loadExistingCredentials('/nonexistent/setup/config.json');
      expect(result).toBeNull();
    });

    test('loads valid credentials from file', () => {
      const validConfig = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true,
        _metadata: {
          setup_date: '2024-01-01',
          version: '1.0'
        }
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const result = loadExistingCredentials(testConfigPath);
      expect(result).not.toBeNull();
      expect(result.client_id).toBe('aaaa...aaaa');
      expect(result.technical_account_email).toBe('test@example.com');
    });

    test('masks credentials in returned object', () => {
      const validConfig = {
        client_id: 'abcdefghij'.repeat(4),
        client_secrets: ['secret1234567890abcdefghij'],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'abcdef1234567890abcdef123456',
        scopes: ['openid'],
        oauth_enabled: true,
        _metadata: {
          setup_date: '2024-01-01',
          version: '1.0'
        }
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const result = loadExistingCredentials(testConfigPath);
      expect(result.client_id).toBe('abcd...ghij');
      expect(result.ims_org_id).toBe('abcd...3456');
    });

    test('returns null for corrupted JSON', () => {
      fs.writeFileSync(testConfigPath, '{ invalid json }');

      const result = loadExistingCredentials(testConfigPath);
      expect(result).toBeNull();
    });

    test('returns null when file is empty', () => {
      fs.writeFileSync(testConfigPath, '');

      const result = loadExistingCredentials(testConfigPath);
      expect(result).toBeNull();
    });

    test('detects invalid credentials in config file', () => {
      const invalidConfig = {
        client_id: 'short',
        client_secrets: ['also_short'],
        technical_account_id: 'not-a-uuid',
        technical_account_email: 'invalid-email',
        ims_org_id: 'short',
        scopes: 'not-an-array',
        oauth_enabled: true,
        _metadata: {}
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig));

      const result = loadExistingCredentials(testConfigPath);
      expect(result).not.toBeNull();
      expect(result.invalid).toBe(true);
      expect(result.errors).toBeDefined();
    });
  });

  describe('saveCredentials', () => {
    test('saves credentials successfully', () => {
      const credentials = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      const result = saveCredentials(credentials, testConfigPath);
      expect(result).toBe(true);
      expect(fs.existsSync(testConfigPath)).toBe(true);
    });

    test('writes valid JSON to file', () => {
      const credentials = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      saveCredentials(credentials, testConfigPath);
      const fileContent = fs.readFileSync(testConfigPath, 'utf8');
      const parsed = JSON.parse(fileContent);
      expect(parsed.client_id).toBe(credentials.client_id);
    });

    test('sets correct file permissions (0o600)', () => {
      const credentials = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      saveCredentials(credentials, testConfigPath);
      const stats = fs.statSync(testConfigPath);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600);
    });

    test('includes metadata in saved file', () => {
      const credentials = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      saveCredentials(credentials, testConfigPath);
      const fileContent = fs.readFileSync(testConfigPath, 'utf8');
      const parsed = JSON.parse(fileContent);
      expect(parsed._metadata).toBeDefined();
      expect(parsed._metadata.setup_date).toBeDefined();
      expect(parsed._metadata.version).toBeDefined();
    });

    test('handles existing file (overwrite)', () => {
      const credentials1 = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test1@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      const credentials2 = {
        client_id: 'c'.repeat(32),
        client_secrets: ['d'.repeat(32)],
        technical_account_id: '223e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test2@example.com',
        ims_org_id: 'b'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      saveCredentials(credentials1, testConfigPath);
      saveCredentials(credentials2, testConfigPath);

      const fileContent = fs.readFileSync(testConfigPath, 'utf8');
      const parsed = JSON.parse(fileContent);
      expect(parsed.client_id).toBe('c'.repeat(32));
    });

    test('returns false when directory cannot be created', () => {
      const credentials = {
        client_id: 'a'.repeat(32),
        client_secrets: ['b'.repeat(32)],
        technical_account_id: '123e4567-e89b-12d3-a456-426614174000',
        technical_account_email: 'test@example.com',
        ims_org_id: 'a'.repeat(24),
        scopes: ['openid'],
        oauth_enabled: true
      };

      const result = saveCredentials(credentials, '/nonexistent/deeply/nested/path/config.json');
      expect(result).toBe(false);
    });
  });
});
