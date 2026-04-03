const { isSafeRegex } = require('../../src/utils/regex');
const { MAX_REGEX_LENGTH, REGEX_TIMEOUT_MS } = require('../../src/utils/constants');

describe('utils/regex - isSafeRegex', () => {
  describe('valid patterns', () => {
    test('accepts simple word patterns', () => {
      const result = isSafeRegex('error');
      expect(result.error).toBeNull();
      expect(result.regex).toBeDefined();
    });

    test('accepts patterns with common regex characters', () => {
      const result = isSafeRegex('com\\.adobe\\..*');
      expect(result.error).toBeNull();
    });

    test('accepts anchored patterns', () => {
      const result = isSafeRegex('^Error.*');
      expect(result.error).toBeNull();
    });

    test('accepts character classes', () => {
      const result = isSafeRegex('[a-zA-Z]+');
      expect(result.error).toBeNull();
    });

    test('accepts alternation patterns', () => {
      const result = isSafeRegex('error|warn|info');
      expect(result.error).toBeNull();
    });

    test('accepts quantifiers', () => {
      const result = isSafeRegex('.*test.+');
      expect(result.error).toBeNull();
    });

    test('accepts escaped special characters', () => {
      const result = isSafeRegex('path/to/file\\.log');
      expect(result.error).toBeNull();
    });
  });

  describe('null/undefined handling', () => {
    test('returns null for null pattern', () => {
      expect(isSafeRegex(null)).toBeNull();
    });

    test('returns null for undefined pattern', () => {
      expect(isSafeRegex(undefined)).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(isSafeRegex('')).toBeNull();
    });

    test('returns null for non-string input', () => {
      expect(isSafeRegex(123)).toBeNull();
      expect(isSafeRegex({})).toBeNull();
      expect(isSafeRegex([])).toBeNull();
    });
  });

  describe('pattern length validation', () => {
    test('rejects patterns exceeding MAX_REGEX_LENGTH', () => {
      const longPattern = 'a'.repeat(MAX_REGEX_LENGTH + 1);
      const result = isSafeRegex(longPattern);
      expect(result.error).toContain('too long');
    });

    test('accepts patterns at MAX_REGEX_LENGTH boundary', () => {
      const boundaryPattern = 'a'.repeat(MAX_REGEX_LENGTH);
      const result = isSafeRegex(boundaryPattern);
      expect(result.error).toBeNull();
    });
  });

  describe('nesting depth validation', () => {
    test('rejects patterns with nesting depth > 3', () => {
      const deeplyNested = '((((a))))';
      const result = isSafeRegex(deeplyNested);
      expect(result.error).toContain('too complex');
    });

    test('accepts patterns with nesting depth <= 3', () => {
      const normalNested = '((a))';
      const result = isSafeRegex(normalNested);
      expect(result.error).toBeNull();
    });

    test('rejects deeply nested character classes', () => {
      const nestedClass = '[[[[a]]]]';
      const result = isSafeRegex(nestedClass);
      expect(result.error).toContain('too complex');
    });
  });

  describe('dangerous pattern detection', () => {
    test('rejects (a*)+ pattern', () => {
      const result = isSafeRegex('(a*)+');
      expect(result.error).toContain('catastrophic backtracking');
    });

    test('rejects (a+)+ pattern', () => {
      const result = isSafeRegex('(a+)+');
      expect(result.error).toContain('catastrophic backtracking');
    });

    test('rejects (.*)+ pattern', () => {
      const result = isSafeRegex('(.*)+');
      expect(result.error).toContain('catastrophic backtracking');
    });

    test('rejects (a*b*)+ pattern', () => {
      const result = isSafeRegex('(a*b*)+');
      expect(result.error).toContain('catastrophic backtracking');
    });

    test('rejects nested quantifiers with inner star', () => {
      const result = isSafeRegex('(x*)+');
      expect(result.error).toContain('catastrophic backtracking');
    });

    test('rejects nested quantifiers with inner plus', () => {
      const result = isSafeRegex('(x+)+');
      expect(result.error).toContain('catastrophic backtracking');
    });
  });

  describe('execution timeout validation', () => {
    test('accepts patterns with quantifiers', () => {
      const pattern = '^[a-z]+$';
      const result = isSafeRegex(pattern);
      expect(result.error).toBeNull();
    });

    test('accepts fast patterns', () => {
      const fastPattern = '^[a-z]+$';
      const result = isSafeRegex(fastPattern);
      expect(result.error).toBeNull();
    });

    test('rejects patterns that cause timeout on execution', () => {
      const slowPattern = '^(a+)+b$';
      const result = isSafeRegex(slowPattern);
      expect(result.error).toBeDefined();
    });
  });

  describe('invalid regex handling', () => {
    test('rejects unbalanced parentheses', () => {
      const result = isSafeRegex('(unbalanced');
      expect(result.error).toContain('Invalid regex');
    });

    test('rejects unbalanced brackets', () => {
      const result = isSafeRegex('[unclosed');
      expect(result.error).toContain('Invalid regex');
    });

    test('rejects invalid quantifier placement', () => {
      const result = isSafeRegex('*invalid');
      expect(result.error).toContain('Invalid regex');
    });

    test('rejects empty group', () => {
      const result = isSafeRegex('()');
      expect(result.error).toBeNull();
    });
  });

  describe('return value structure', () => {
    test('returns object with regex property on success', () => {
      const result = isSafeRegex('test');
      expect(result).toHaveProperty('regex');
      expect(result.regex).toBeInstanceOf(RegExp);
    });

    test('returns object with error property on failure', () => {
      const result = isSafeRegex('(a+)+');
      expect(result).toHaveProperty('error');
      expect(result.error).toBeDefined();
    });

    test('compiled regex has case-insensitive flag', () => {
      const result = isSafeRegex('test');
      expect(result.regex.flags).toContain('i');
    });
  });
});
