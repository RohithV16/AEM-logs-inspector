const REGEX_PATTERNS = {
  CLIENT_ID: /^[a-zA-Z0-9]{32,}$/,
  CLIENT_SECRET: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{32,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HEX_24: /^[a-f0-9]{24}$/i,
  SCOPES: /^[a-zA-Z0-9_.,\-]*$/
};

/**
 * Validates an OAuth client ID.
 * Must be 32 or more alphanumeric characters.
 * @param {string} clientId - The client ID to validate
 * @returns {Object} Validation result with valid boolean and optional error string
 */
function validateClientId(clientId) {
  if (!clientId || typeof clientId !== 'string') {
    return { valid: false, error: 'Client ID must be at least 32 alphanumeric characters' };
  }
  if (!REGEX_PATTERNS.CLIENT_ID.test(clientId)) {
    return { valid: false, error: 'Client ID must be at least 32 alphanumeric characters' };
  }
  return { valid: true };
}

/**
 * Validates an OAuth client secret.
 * Must be 32 or more characters with no spaces or newlines.
 * @param {string} clientSecret - The client secret to validate
 * @returns {Object} Validation result with valid boolean and optional error string
 */
function validateClientSecret(clientSecret) {
  if (!clientSecret || typeof clientSecret !== 'string') {
    return { valid: false, error: 'Client secret must be at least 32 characters with no spaces' };
  }
  if (!REGEX_PATTERNS.CLIENT_SECRET.test(clientSecret)) {
    return { valid: false, error: 'Client secret must be at least 32 characters with no spaces' };
  }
  return { valid: true };
}

/**
 * Validates an email address using RFC 5322 simplified format.
 * @param {string} email - The email address to validate
 * @returns {Object} Validation result with valid boolean and optional error string
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Invalid email format' };
  }
  if (!REGEX_PATTERNS.EMAIL.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Validates a technical account ID (UUID format).
 * @param {string} id - The technical account ID to validate
 * @returns {Object} Validation result with valid boolean and optional error string
 */
function validateTechnicalAccountId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Technical account ID must be a valid UUID' };
  }
  if (!REGEX_PATTERNS.UUID.test(id)) {
    return { valid: false, error: 'Technical account ID must be a valid UUID' };
  }
  return { valid: true };
}

/**
 * Validates an organization ID (24 character hexadecimal string).
 * @param {string} orgId - The organization ID to validate
 * @returns {Object} Validation result with valid boolean and optional error string
 */
function validateOrgId(orgId) {
  if (!orgId || typeof orgId !== 'string') {
    return { valid: false, error: 'Organization ID must be exactly 24 hexadecimal characters' };
  }
  if (!REGEX_PATTERNS.HEX_24.test(orgId)) {
    return { valid: false, error: 'Organization ID must be exactly 24 hexadecimal characters' };
  }
  return { valid: true };
}

/**
 * Validates OAuth scopes array.
 * @param {Array} scopes - Array of scope strings to validate
 * @returns {Object} Validation result with valid boolean and optional error string
 */
function validateScopes(scopes) {
  if (!Array.isArray(scopes)) {
    return { valid: false, error: 'Scopes must be an array of valid scope strings' };
  }
  for (const scope of scopes) {
    if (typeof scope !== 'string' || !REGEX_PATTERNS.SCOPES.test(scope)) {
      return { valid: false, error: 'Scopes must be an array of valid scope strings' };
    }
  }
  return { valid: true };
}

/**
 * Validates all OAuth credentials at once.
 * @param {Object} creds - Object containing all credentials to validate
 * @param {string} creds.clientId - OAuth client ID
 * @param {string} creds.clientSecret - OAuth client secret
 * @param {string} creds.email - Technical account email
 * @param {string} creds.technicalAccountId - Technical account UUID
 * @param {string} creds.orgId - Organization ID
 * @param {Array} creds.scopes - OAuth scopes array
 * @returns {Object} Validation result with valid boolean and errors object
 */
function validateAllCredentials(creds) {
  const errors = {};

  if (!creds || typeof creds !== 'object') {
    return { valid: false, errors: { _: 'Credentials object is required' } };
  }

  const clientIdResult = validateClientId(creds.clientId);
  if (!clientIdResult.valid) {
    errors.clientId = clientIdResult.error;
  }

  const clientSecretResult = validateClientSecret(creds.clientSecret);
  if (!clientSecretResult.valid) {
    errors.clientSecret = clientSecretResult.error;
  }

  const emailResult = validateEmail(creds.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  const technicalAccountIdResult = validateTechnicalAccountId(creds.technicalAccountId);
  if (!technicalAccountIdResult.valid) {
    errors.technicalAccountId = technicalAccountIdResult.error;
  }

  const orgIdResult = validateOrgId(creds.orgId);
  if (!orgIdResult.valid) {
    errors.orgId = orgIdResult.error;
  }

  const scopesResult = validateScopes(creds.scopes);
  if (!scopesResult.valid) {
    errors.scopes = scopesResult.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  validateClientId,
  validateClientSecret,
  validateEmail,
  validateTechnicalAccountId,
  validateOrgId,
  validateScopes,
  validateAllCredentials,
  REGEX_PATTERNS
};
