const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateAllCredentials } = require('../../src/utils/credential-validator');

const CONFIG_VERSION = '1.0';

function maskCredential(value) {
  if (!value || typeof value !== 'string' || value.length < 8) {
    return '';
  }
  const firstFour = value.substring(0, 4);
  const lastFour = value.substring(value.length - 4);
  return `${firstFour}...${lastFour}`;
}

function loadExistingCredentials(configPath) {
  if (!configPath || typeof configPath !== 'string') {
    return null;
  }

  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    return null;
  }

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    if (!fileContent || !fileContent.trim()) {
      return null;
    }

    const config = JSON.parse(fileContent);
    if (!config || typeof config !== 'object') {
      return null;
    }

    const maskedConfig = {
      client_id: config.client_id ? maskCredential(config.client_id) : null,
      client_secrets: Array.isArray(config.client_secrets)
        ? config.client_secrets.map(s => maskCredential(s))
        : [],
      technical_account_id: config.technical_account_id
        ? maskCredential(config.technical_account_id)
        : null,
      technical_account_email: config.technical_account_email || null,
      ims_org_id: config.ims_org_id ? maskCredential(config.ims_org_id) : null,
      scopes: config.scopes || [],
      oauth_enabled: config.oauth_enabled || false,
      _metadata: config._metadata || {}
    };

    const credsForValidation = {
      clientId: config.client_id || '',
      clientSecret: Array.isArray(config.client_secrets) && config.client_secrets.length > 0
        ? config.client_secrets[0]
        : '',
      email: config.technical_account_email || '',
      technicalAccountId: config.technical_account_id || '',
      orgId: config.ims_org_id || '',
      scopes: config.scopes || []
    };

    const validation = validateAllCredentials(credsForValidation);
    if (!validation.valid) {
      maskedConfig.invalid = true;
      maskedConfig.errors = validation.errors;
    }

    return maskedConfig;
  } catch (error) {
    return null;
  }
}

function saveCredentials(credentials, configPath) {
  if (!credentials || typeof credentials !== 'object') {
    return false;
  }

  if (!configPath || typeof configPath !== 'string') {
    return false;
  }

  try {
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const config = {
      client_id: credentials.client_id || null,
      client_secrets: Array.isArray(credentials.client_secrets)
        ? credentials.client_secrets
        : [credentials.client_secrets].filter(Boolean),
      technical_account_id: credentials.technical_account_id || null,
      technical_account_email: credentials.technical_account_email || null,
      ims_org_id: credentials.ims_org_id || null,
      scopes: credentials.scopes || [],
      oauth_enabled: credentials.oauth_enabled !== false,
      _metadata: {
        setup_date: new Date().toISOString(),
        version: CONFIG_VERSION
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    try {
      fs.chmodSync(configPath, 0o600);
    } catch (chmodError) {
      console.error('Warning: Could not set file permissions:', chmodError.message);
    }

    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  maskCredential,
  loadExistingCredentials,
  saveCredentials
};
