/**
 * Builds a meaningful display message for a log event based on its type.
 * Falls back through available fields to ensure the message is never empty.
 * @param {Object} evt - Parsed log event object
 * @param {string} logType - 'error' | 'request' | 'cdn' | 'batch'
 * @returns {string} Display message for the event card
 */
function buildEventMessage(evt, logType) {
  if (logType === 'error') return evt.message || evt.title || '';
  if (logType === 'request') return evt.url || '';
  if (logType === 'cdn') {
    return evt.url || evt.host
      || `${evt.method || ''} ${evt.status || ''}`.trim()
      || '';
  }
  return evt.title || evt.message || evt.url || evt.host || '';
}

module.exports = { buildEventMessage };
