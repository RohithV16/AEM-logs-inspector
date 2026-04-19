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
    <div className="file-input">
      <input
        type="text"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        placeholder="/path/to/log.log"
      />
      <button onClick={handleAnalyze} disabled={analysis.isPending}>
        {analysis.isPending ? 'Analyzing...' : 'Analyze'}
      </button>
      {analysis.error && <div className="error">{analysis.error.message}</div>}
    </div>
  );
}