const {
  validateClientId,
  validateClientSecret,
  validateEmail,
  validateTechnicalAccountId,
  validateOrgId,
  validateScopes,
  validateAllCredentials
} = require('../../src/utils/credential-validator');

describe('utils/credential-validator', () => {
  describe('validateClientId', () => {
    test('accepts valid 32-char alphanumeric client ID', () => {
      const result = validateClientId('a'.repeat(32));
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts valid client ID with mixed alphanumeric', () => {
      const result = validateClientId('ABCDEFGHIJKLMNOPQRSTUVWXYZ123456');
      expect(result.valid).toBe(true);
    });

    test('accepts valid client ID longer than 32 chars', () => {
      const result = validateClientId('a'.repeat(50));
      expect(result.valid).toBe(true);
    });

    test('rejects client ID shorter than 32 chars', () => {
      const result = validateClientId('short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('32');
    });

    test('rejects client ID with 31 chars', () => {
      const result = validateClientId('a'.repeat(31));
      expect(result.valid).toBe(false);
    });

    test('rejects client ID with special characters', () => {
      const result = validateClientId('abc123!@#'.padEnd(32, 'a'));
      expect(result.valid).toBe(false);
    });

    test('rejects client ID with spaces', () => {
      const result = validateClientId('abc def'.padEnd(32, 'a'));
      expect(result.valid).toBe(false);
    });

    test('rejects null client ID', () => {
      const result = validateClientId(null);
      expect(result.valid).toBe(false);
    });

    test('rejects undefined client ID', () => {
      const result = validateClientId(undefined);
      expect(result.valid).toBe(false);
    });

    test('rejects empty string client ID', () => {
      const result = validateClientId('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateClientSecret', () => {
    test('accepts valid 32-char client secret', () => {
      const result = validateClientSecret('a'.repeat(32));
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts client secret with allowed special characters', () => {
      const result = validateClientSecret('!@#$%^&*()_+-=[]{}|;":,.<>?/abcd');
      expect(result.valid).toBe(true);
    });

    test('accepts client secret longer than 32 chars', () => {
      const result = validateClientSecret('a'.repeat(50));
      expect(result.valid).toBe(true);
    });

    test('rejects client secret shorter than 32 chars', () => {
      const result = validateClientSecret('short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('32');
    });

    test('rejects client secret with spaces', () => {
      const result = validateClientSecret('secret with spaces'.padEnd(32, 'x'));
      expect(result.valid).toBe(false);
    });

    test('rejects client secret with newlines', () => {
      const result = validateClientSecret('secret\nwith\nnewlines'.padEnd(32, 'x'));
      expect(result.valid).toBe(false);
    });

    test('rejects null client secret', () => {
      const result = validateClientSecret(null);
      expect(result.valid).toBe(false);
    });

    test('rejects undefined client secret', () => {
      const result = validateClientSecret(undefined);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('accepts valid email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.valid).toBe(true);
    });

    test('accepts email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.valid).toBe(true);
    });

    test('accepts email with dots in local part', () => {
      const result = validateEmail('first.last@example.com');
      expect(result.valid).toBe(true);
    });

    test('rejects email without @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.valid).toBe(false);
    });

    test('rejects email without domain', () => {
      const result = validateEmail('user@');
      expect(result.valid).toBe(false);
    });

    test('rejects email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.valid).toBe(false);
    });

    test('rejects email with spaces', () => {
      const result = validateEmail('user@example .com');
      expect(result.valid).toBe(false);
    });

    test('rejects null email', () => {
      const result = validateEmail(null);
      expect(result.valid).toBe(false);
    });

    test('rejects undefined email', () => {
      const result = validateEmail(undefined);
      expect(result.valid).toBe(false);
    });

    test('rejects empty string email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTechnicalAccountId', () => {
    test('accepts valid UUID format', () => {
      const result = validateTechnicalAccountId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts uppercase UUID format', () => {
      const result = validateTechnicalAccountId('123E4567-E89B-12D3-A456-426614174000');
      expect(result.valid).toBe(true);
    });

    test('accepts lowercase UUID format', () => {
      const result = validateTechnicalAccountId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    test('accepts mixed case UUID format', () => {
      const result = validateTechnicalAccountId('123E4567-e89b-12D3-A456-426614174000');
      expect(result.valid).toBe(true);
    });

    test('rejects non-UUID string', () => {
      const result = validateTechnicalAccountId('not-a-uuid');
      expect(result.valid).toBe(false);
    });

    test('rejects UUID without hyphens', () => {
      const result = validateTechnicalAccountId('123e4567e89b12d3a456426614174000');
      expect(result.valid).toBe(false);
    });

    test('rejects UUID with wrong length', () => {
      const result = validateTechnicalAccountId('123e4567-e89b-12d3-a456');
      expect(result.valid).toBe(false);
    });

    test('rejects null technical account ID', () => {
      const result = validateTechnicalAccountId(null);
      expect(result.valid).toBe(false);
    });

    test('rejects undefined technical account ID', () => {
      const result = validateTechnicalAccountId(undefined);
      expect(result.valid).toBe(false);
    });

    test('rejects empty string technical account ID', () => {
      const result = validateTechnicalAccountId('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateOrgId', () => {
    test('accepts valid 24-char lowercase hex org ID', () => {
      const result = validateOrgId('a'.repeat(24));
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts valid 24-char uppercase hex org ID', () => {
      const result = validateOrgId('A'.repeat(24));
      expect(result.valid).toBe(true);
    });

    test('accepts valid 24-char mixed case hex org ID', () => {
      const result = validateOrgId('aAbBcCdDeEfF012345678901');
      expect(result.valid).toBe(true);
    });

    test('accepts valid org ID with digits', () => {
      const result = validateOrgId('0123456789abcdef01234567');
      expect(result.valid).toBe(true);
    });

    test('rejects org ID with less than 24 chars', () => {
      const result = validateOrgId('a'.repeat(23));
      expect(result.valid).toBe(false);
    });

    test('rejects org ID with more than 24 chars', () => {
      const result = validateOrgId('a'.repeat(25));
      expect(result.valid).toBe(false);
    });

    test('rejects org ID with non-hex characters', () => {
      const result = validateOrgId('g'.repeat(24));
      expect(result.valid).toBe(false);
    });

    test('rejects org ID with special characters', () => {
      const result = validateOrgId('abc123!@#$%^&*()12345678');
      expect(result.valid).toBe(false);
    });

    test('rejects null org ID', () => {
      const result = validateOrgId(null);
      expect(result.valid).toBe(false);
    });

    test('rejects undefined org ID', () => {
      const result = validateOrgId(undefined);
      expect(result.valid).toBe(false);
    });

    test('rejects empty string org ID', () => {
      const result = validateOrgId('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateScopes', () => {
    test('accepts valid scope array', () => {
      const result = validateScopes(['openid', 'AdobeID', 'read_repositories']);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts single scope', () => {
      const result = validateScopes(['openid']);
      expect(result.valid).toBe(true);
    });

    test('accepts empty scope array', () => {
      const result = validateScopes([]);
      expect(result.valid).toBe(true);
    });

    test('accepts scopes with allowed special characters', () => {
      const result = validateScopes(['scope_with_underscore', 'scope.with.dot', 'scope,with,comma']);
      expect(result.valid).toBe(true);
    });

    test('rejects non-array scopes', () => {
      const result = validateScopes('openid');
      expect(result.valid).toBe(false);
    });

    test('rejects null scopes', () => {
      const result = validateScopes(null);
      expect(result.valid).toBe(false);
    });

    test('rejects undefined scopes', () => {
      const result = validateScopes(undefined);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAllCredentials', () => {
    test('accepts valid credentials object', () => {
      const creds = {
        clientId: 'a'.repeat(32),
        clientSecret: 'b'.repeat(32),
        email: 'test@example.com',
        technicalAccountId: '123e4567-e89b-12d3-a456-426614174000',
        orgId: 'a'.repeat(24),
        scopes: ['openid']
      };
      const result = validateAllCredentials(creds);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('reports all errors when all fields invalid', () => {
      const creds = {
        clientId: 'short',
        clientSecret: 'short',
        email: 'invalid',
        technicalAccountId: 'not-uuid',
        orgId: 'short',
        scopes: null
      };
      const result = validateAllCredentials(creds);
      expect(result.valid).toBe(false);
      expect(result.errors.clientId).toBeDefined();
      expect(result.errors.clientSecret).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.technicalAccountId).toBeDefined();
      expect(result.errors.orgId).toBeDefined();
      expect(result.errors.scopes).toBeDefined();
    });

    test('reports only specific errors for partial invalid credentials', () => {
      const creds = {
        clientId: 'a'.repeat(32),
        clientSecret: 'b'.repeat(32),
        email: 'invalid-email',
        technicalAccountId: '123e4567-e89b-12d3-a456-426614174000',
        orgId: 'a'.repeat(24),
        scopes: ['openid']
      };
      const result = validateAllCredentials(creds);
      expect(result.valid).toBe(false);
      expect(result.errors.clientId).toBeUndefined();
      expect(result.errors.clientSecret).toBeUndefined();
      expect(result.errors.email).toBeDefined();
    });

    test('returns empty errors object for valid credentials', () => {
      const creds = {
        clientId: 'A'.repeat(32),
        clientSecret: 'B'.repeat(32),
        email: 'valid@test.com',
        technicalAccountId: '123e4567-e89b-12d3-a456-426614174000',
        orgId: '0123456789abcdef01234567',
        scopes: []
      };
      const result = validateAllCredentials(creds);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });
});
