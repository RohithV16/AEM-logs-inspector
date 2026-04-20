import { useState, useEffect } from 'react';
import { useAnalysisStore } from './useAnalysisStore';
import { useAnalysis as useAnalysisHook, useBatchAnalysis as useBatchAnalysisHook } from './useAnalysis';
import { RecentFiles } from './RecentFiles';
import { FileSelectorModal } from './FileSelectorModal';

function parsePaths(input: string): string[] {
  return input.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
}

export function LocalFileInput() {
  const storeFilePath = useAnalysisStore(s => s.currentFilePath);
  const [filePath, setFilePath] = useState('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const analysis = useAnalysisHook();
  const batchAnalysis = useBatchAnalysisHook();

  useEffect(() => {
    if (storeFilePath && storeFilePath !== 'Multiple Files') {
      setFilePath(storeFilePath);
    } else if (storeFilePath === 'Multiple Files') {
      setFilePath('');
    }
  }, [storeFilePath]);

  const isAnalyzing = analysis.isPending || batchAnalysis.isPending;
  const analyzeError = analysis.error || batchAnalysis.error;

  const handleAnalyze = () => {
    const paths = parsePaths(filePath);
    if (paths.length === 0) return;

    if (paths.length === 1) {
      analysis.mutate(paths[0]);
    } else {
      batchAnalysis.mutate(paths);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const handleFileSelection = (paths: string[]) => {
    if (paths.length === 0) return;
    setSelectedPaths(paths);
    setFilePath(paths.join(', '));
    
    if (paths.length === 1) {
      analysis.mutate(paths[0]);
      setShowFileSelector(false);
    } else {
      batchAnalysis.mutate(paths);
      setShowFileSelector(false);
    }
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
          placeholder="/path/to/error.log or multiple paths (comma-separated)"
        />
        <button 
          className="upload-btn"
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
        <button 
          className="upload-btn secondary"
          onClick={() => setShowFileSelector(true)}
        >
          Select from Library
        </button>
        {analyzeError && <div className="error-message">{analyzeError.message}</div>}
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