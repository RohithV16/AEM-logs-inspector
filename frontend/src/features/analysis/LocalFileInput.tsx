import { useState } from 'react';
import { useAnalysis } from './useAnalysis';
import { RecentFiles } from './RecentFiles';
import { FileSelectorModal } from './FileSelectorModal';

export function LocalFileInput() {
  const [filePath, setFilePath] = useState('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const analysis = useAnalysis();

  const handleAnalyze = () => {
    if (!filePath.trim()) return;
    analysis.mutate(filePath);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const handleFileSelection = (selectedPaths: string[]) => {
    if (selectedPaths.length === 0) return;
    setFilePath(selectedPaths.join(', '));
    setShowFileSelector(false);
  };

  return (
    <div className="upload-section">
      <div className="upload-row">
        <input
          type="text"
          className="upload-input compact"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/path/to/error.log"
        />
        <button 
          className="upload-btn"
          onClick={handleAnalyze} 
          disabled={analysis.isPending}
        >
          {analysis.isPending ? 'Analyzing...' : 'Analyze'}
        </button>
        <button 
          className="upload-btn secondary"
          onClick={() => setShowFileSelector(true)}
        >
          Select from Library
        </button>
        {analysis.error && <div className="error-message">{analysis.error.message}</div>}
      </div>
      <RecentFiles />
      <FileSelectorModal
        isOpen={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        onAnalyze={handleFileSelection}
        title="Select Files from Library"
      />
    </div>
  );
}