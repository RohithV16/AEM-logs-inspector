const { MAX_REGEX_LENGTH, REGEX_TIMEOUT_MS } = require('./constants');

/* === Regex Validation === */

/**
 * Validates a regex pattern for safety before compilation.
 * Checks for complexity, dangerous patterns, and execution timeout.
 * @param {string} pattern - Regex pattern string to validate
 * @returns {Object} Object with compiled regex or error message
 */
function isSafeRegex(pattern) {
  if (!pattern || typeof pattern !== 'string') return null;

  // Reject patterns exceeding reasonable length
  if (pattern.length > MAX_REGEX_LENGTH) {
    return { error: 'Pattern too long (max 100 characters)' };
  }

  // Check nesting depth to prevent exponential complexity
  // Deeply nested groups can cause catastrophic backtracking
  let depth = 0;
  for (const char of pattern) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (depth > 3) return { error: 'Pattern too complex' };
  }

  // Detect known dangerous regex patterns that can cause ReDoS
  // These patterns have nested quantifiers that create exponential matching
  const dangerousPatterns = [
    /\([^)]*\*\)[*+]/,   // (a*)+ - star inside group with quantifier
    /\([^)]*\+\)[*+]/,   // (a+)+ - plus inside group with quantifier
    /\(\.[*+]\)[*+]/,    // (.*)+ - any inside group with quantifier
    /\([^)]*[*+][^)]*\)[*+]/  // (a*b*)+ - mixed quantifiers in group
  ];
  for (const dp of dangerousPatterns) {
    if (dp.test(pattern)) {
      return { error: 'Pattern may cause catastrophic backtracking' };
    }
  }

  try {
    const regex = new RegExp(pattern, 'i');

    // Execute timeout check with worst-case input
    // Using repeated 'a' triggers backtracking in most regex engines
    const testInput = 'a'.repeat(50) + '!';
    const start = Date.now();
    regex.test(testInput);
    if (Date.now() - start > REGEX_TIMEOUT_MS) {
      return { error: 'Pattern too slow (execution timeout)' };
    }

    return { regex, error: null };
  } catch (e) {
    return { error: `Invalid regex: ${e.message}` };
  }
}

module.exports = {
  isSafeRegex
};
