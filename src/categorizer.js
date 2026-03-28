const CATEGORIES = {
  'Sling': [/org\.apache\.sling/, /\/content\//, /SlingServlet/, /ResourceResolver/],
  'OSGi': [/org\.osgi/, /bundle/i, /component/i, /Declarative Services/],
  'Replication': [/replicat/i, /transport/, /AgentManager/, /ReplicationQueue/],
  'JCR': [/javax\.jcr/, /RepositoryException/, /ItemNotFoundException/, /AccessDeniedException/],
  'Oak': [/org\.apache\.jackrabbit\.oak/, /Oak/, /DocumentStore/, /SegmentStore/],
  'Security': [/auth/i, /login/i, /permission/i, /UserManager/, /AccessControl/],
  'Performance': [/timeout/i, /slow/i, /pool/i, /thread pool/, /heap/, /memory/],
  'Configuration': [/config/i, /OSGi config/, /ConfigurationAdmin/, /Pid/],
  'Workflow': [/workflow/i, /WorkItem/, /WorkflowSession/, /transient/],
  'Search': [/search/i, /query/i, /lucene/i, /index/]
};

function categorizeError(message, logger) {
  for (const [category, patterns] of Object.entries(CATEGORIES)) {
    for (const pattern of patterns) {
      try {
        if (pattern.test(message) || pattern.test(logger)) return category;
      } catch (e) { /* skip invalid patterns */ }
    }
  }
  return 'Other';
}

module.exports = { categorizeError, CATEGORIES };
