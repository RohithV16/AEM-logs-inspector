import { useState } from 'react';
import { useAnalysis } from './useAnalysis';

export function LocalFileInput() {
  const [filePath, setFilePath] = useState('');
  const analysis = useAnalysis();

  const handleAnalyze = () => {
    if (!filePath.trim()) return;
    analysis.mutate(filePath);
  };

  return (
    <div className="upload-row">
      <input
        type="text"
        className="upload-input compact"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        placeholder="/path/to/error.log"
      />
      <button 
        className="upload-btn"
        onClick={handleAnalyze} 
        disabled={analysis.isPending}
      >
        {analysis.isPending ? 'Analyzing...' : 'Analyze'}
      </button>
      {analysis.error && <div className="error-message">{analysis.error.message}</div>}
    </div>
  );
}