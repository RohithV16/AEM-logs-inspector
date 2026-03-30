/* === AEM Error Categorization === */
// Maps AEM errors to functional categories based on component patterns
// Helps operators quickly identify issue domain (Sling, JCR, Performance, etc.)

const CATEGORIES = {
  // Sling framework - request processing, content resolution
  'Sling': [/org\.apache\.sling/, /\/content\//, /SlingServlet/, /ResourceResolver/],
  // OSGi container - bundle lifecycle, component management
  'OSGi': [/org\.osgi/, /bundle/i, /component/i, /Declarative Services/],
  // Content replication - publish/activate operations
  'Replication': [/replicat/i, /transport/, /AgentManager/, /ReplicationQueue/],
  // JCR repository - persistence, node access
  'JCR': [/javax\.jcr/, /RepositoryException/, /ItemNotFoundException/, /AccessDeniedException/],
  // Oak persistence - AEM 6+ storage backend
  'Oak': [/org\.apache\.jackrabbit\.oak/, /Oak/, /DocumentStore/, /SegmentStore/],
  // Authentication/authorization - login, permissions
  'Security': [/auth/i, /login/i, /permission/i, /UserManager/, /AccessControl/],
  // Performance issues - timeouts, memory, thread contention
  'Performance': [/timeout/i, /slow/i, /pool/i, /thread pool/, /heap/, /memory/],
  // Configuration - OSGi configs, bootstrap
  'Configuration': [/config/i, /OSGi config/, /ConfigurationAdmin/, /Pid/],
  // AEM Workflow - DAM/Page activation workflows
  'Workflow': [/workflow/i, /WorkItem/, /WorkflowSession/, /transient/],
  // Search/indexing - QueryBuilder, Lucene, Oak indexes
  'Search': [/search/i, /query/i, /lucene/i, /index/]
};

/**
 * Categorizes an error based on message content and logger class
 * Uses regex patterns to identify AEM component domain
 * @param {string} message - Error message text
 * @param {string} logger - Java logger class name
 * @returns {string} Category name (Sling, JCR, Performance, etc.)
 */
function categorizeError(message, logger) {
  for (const [category, patterns] of Object.entries(CATEGORIES)) {
    for (const pattern of patterns) {
      try {
        // Match against both message (what happened) and logger (where it happened)
        if (pattern.test(message) || pattern.test(logger)) return category;
      } catch (e) { 
        // Skip invalid regex patterns gracefully
      }
    }
  }
  return 'Other';
}

/**
 * Error Categorizer Module
 * Classifies AEM errors into functional domains for prioritized troubleshooting
 * @module categorizer
 */
module.exports = { categorizeError, CATEGORIES };
