import { useAnalysisStore } from './useAnalysisStore';

function getFileName(path: string): string {
  if (!path) return 'Unknown';
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || path;
}

export function BatchFileTabs() {
  const batchResults = useAnalysisStore((s) => s.batchResults);
  const activeBatchIndex = useAnalysisStore((s) => s.activeBatchIndex);
  const setActiveBatchIndex = useAnalysisStore((s) => s.setActiveBatchIndex);
  const setAnalysis = useAnalysisStore((s) => s.setAnalysis);
  
  if (batchResults.length === 0) {
    return null;
  }
  
  const handleTabClick = (index: number) => {
    setActiveBatchIndex(index);
    const result = batchResults[index];
    if (result.success) {
      setAnalysis(result.originalPath || result.fileId || '', result.logType, result);
    }
  };
  
  const getDisplayName = (result: typeof batchResults[0], index: number): string => {
    if (result.fileName) return result.fileName;
    if (result.originalPath) return getFileName(result.originalPath);
    if (result.fileId) return getFileName(result.fileId);
    return `File ${index + 1}`;
  };
  
  return (
    <div className="batch-file-tabs">
      <div className="batch-tabs-header">
        <span className="batch-tabs-label">Analyzed Files:</span>
      </div>
      <div className="batch-tabs-list">
        {batchResults.map((result, index) => (
          <button
            key={result.fileId || index}
            className={`batch-tab ${index === activeBatchIndex ? 'active' : ''} ${!result.success ? 'error' : ''}`}
            onClick={() => handleTabClick(index)}
            title={result.error || result.originalPath || result.fileId}
          >
            <span className="batch-tab-name">
              {result.fileName || (result.originalPath ? getFileName(result.originalPath) : (result.fileId ? getFileName(result.fileId) : `File ${index + 1}`))}
            </span>
            {!result.success && <span className="batch-tab-error">!</span>}
          </button>
        ))}
      </div>
    </div>
  );
}