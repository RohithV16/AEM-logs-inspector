const { sanitizeErrorMessage } = require('./files');

/* === Response Helpers === */

/**
 * Sends a successful JSON response.
 * @param {Object} res - Express response object
 * @param {Object} data - Data to include in response
 * @returns {Object} Express JSON response
 */
function success(res, data = {}) {
  return res.json({ success: true, ...data });
}

/**
 * Sends an error JSON response with sanitized message.
 * @param {Object} res - Express response object
 * @param {string} message - Error message to send
 * @param {number} statusCode - HTTP status code (default 500)
 * @returns {Object} Express JSON response
 */
function error(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    // Sanitize to prevent XSS in client error displays
    error: sanitizeErrorMessage(message)
  });
}

module.exports = {
  success,
  error
};
