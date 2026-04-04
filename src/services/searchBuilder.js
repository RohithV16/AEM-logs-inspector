const { isSafeRegex } = require('../utils/regex');
const { categorizeError } = require('../categorizer');

function getEntryFieldValue(entry, field) {
  switch (field) {
    case 'level':
      return entry.level;
    case 'message':
      return entry.message || '';
    case 'logger':
      return entry.logger || '';
    case 'thread':
      return entry.thread || entry.threadName || '';
    case 'package':
      if (!entry.logger) return '';
      return entry.logger.split('.').slice(0, 2).join('.');
    case 'exception':
      return entry.stackTrace || entry.message || '';
    case 'category':
      return categorizeError(entry.message || '', entry.logger || '');
    case 'method':
      return entry.method || '';
    case 'status':
      return typeof entry.status === 'number' ? entry.status : Number(entry.status || 0);
    case 'cache':
      return entry.cache || '';
    case 'country':
      return entry.clientCountry || '';
    case 'pop':
      return entry.pop || '';
    case 'host':
      return entry.host || '';
    case 'responseTime':
      return typeof entry.responseTime === 'number' ? entry.responseTime : Number(entry.responseTime || 0);
    case 'ttfb':
      return typeof entry.ttfb === 'number' ? entry.ttfb : Number(entry.ttfb || 0);
    case 'ttlb':
      return typeof entry.ttlb === 'number' ? entry.ttlb : Number(entry.ttlb || 0);
    case 'requestId':
      return entry.requestId || '';
    case 'sourceFile':
      return entry.sourceFile || '';
    case 'logType':
      return entry.logType || '';
    case 'severity':
      return entry.severity || entry.level || '';
    case 'timestamp':
      return entry.timestamp || '';
    case 'url':
      return entry.url || '';
    default:
      return entry[field] ?? '';
  }
}

function normalizeRuleValue(rule) {
  return String(rule?.value ?? '').trim();
}

function buildFieldMatcher(rule) {
  const field = rule?.field;
  const operator = (rule?.operator || 'contains').toLowerCase();
  const value = normalizeRuleValue(rule);

  if (!field || !value) {
    return () => true;
  }

  if (operator === 'regex') {
    const validation = isSafeRegex(value);
    if (validation && validation.error) {
      return () => false;
    }
    const regex = new RegExp(value, 'i');
    return (entry) => {
      const actual = String(getEntryFieldValue(entry, field));
      return regex.test(actual);
    };
  }

  const numericOperators = new Set(['gt', 'gte', 'lt', 'lte']);
  const numericValue = Number(value);
  const useNumeric = numericOperators.has(operator) && !Number.isNaN(numericValue);

  return (entry) => {
    const actual = getEntryFieldValue(entry, field);
    const actualText = String(actual).toLowerCase();
    const expectedText = value.toLowerCase();

    if (useNumeric) {
      const actualNumber = Number(actual);
      if (Number.isNaN(actualNumber)) return false;
      if (operator === 'gt') return actualNumber > numericValue;
      if (operator === 'gte') return actualNumber >= numericValue;
      if (operator === 'lt') return actualNumber < numericValue;
      if (operator === 'lte') return actualNumber <= numericValue;
    }

    if (operator === 'equals') return actualText === expectedText;
    if (operator === 'contains') return actualText.includes(expectedText);
    if (operator === 'startswith') return actualText.startsWith(expectedText);
    if (operator === 'endswith') return actualText.endsWith(expectedText);
    if (operator === 'in') {
      return value
        .split(',')
        .map(v => v.trim().toLowerCase())
        .filter(Boolean)
        .includes(actualText);
    }

    return actualText.includes(expectedText);
  };
}

function buildAdvancedMatcher(rules = []) {
  const activeRules = Array.isArray(rules)
    ? rules.filter(rule => rule && rule.field && String(rule.value ?? '').trim())
    : [];

  if (!activeRules.length) {
    return () => true;
  }

  const matchers = activeRules.map(buildFieldMatcher);
  return (entry) => matchers.every(matcher => matcher(entry));
}

module.exports = {
  buildAdvancedMatcher,
  getEntryFieldValue
};
