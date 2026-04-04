const fs = require('fs');

const MAX_CACHE_ENTRIES = 5;
const cache = new Map();

function getCacheKey(filePath) {
  const stats = fs.statSync(filePath);
  return `${filePath}::${stats.mtimeMs}::${stats.size}`;
}

function getCached(filePath) {
  const key = getCacheKey(filePath);
  const value = cache.get(key) || null;

  if (value) {
    cache.delete(key);
    cache.set(key, value);
  }

  return value;
}

function setCached(filePath, result) {
  const key = getCacheKey(filePath);

  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, result);

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function clearCache() {
  cache.clear();
}

module.exports = {
  getCached,
  setCached,
  clearCache
};
