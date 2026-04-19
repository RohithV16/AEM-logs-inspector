import { useState, useEffect } from 'react';
import { useAnalysisStore } from './useAnalysisStore';
import { useAnalysis } from './useAnalysis';
import { useFilterStore } from '../filters/useFilters';

interface StoredFile {
  id: string;
  originalPath: string;
  storedPath: string;
  fileName: string;
  size: number;
  storedAt: string;
  accessedAt: string;
}

interface StoredFilesResponse {
  success: boolean;
  storageDir?: string;
  files?: StoredFile[];
  error?: string;
}

export function RecentFiles() {
  const recentFiles = useAnalysisStore((s) => s.recentFiles);
  const removeRecentFile = useAnalysisStore((s) => s.removeRecentFile);
  const clearRecentFiles = useAnalysisStore((s) => s.clearRecentFiles);
  const analysis = useAnalysis();
  const [expanded, setExpanded] = useState(false);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [storedExpanded, setStoredExpanded] = useState(false);

  const fetchStoredFiles = async () => {
    try {
      const response = await fetch('/api/filter/stored');
      const data = await response.json() as StoredFilesResponse;
      if (data.success && data.files) {
        setStoredFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch stored files:', error);
    }
  };

  useEffect(() => {
    if (expanded || storedExpanded) {
      fetchStoredFiles();
    }
  }, [expanded, storedExpanded]);

  const handleSelect = (filePath: string) => {
    analysis.mutate(filePath);
    setExpanded(false);
  };

  const handleAnalyzeStored = async (fileId: string) => {
    const clearFilters = useFilterStore.getState().clear;
    try {
      const response = await fetch(`/api/filter/stored/${fileId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: {} })
      });
      const data = await response.json();
      if (data.success) {
        const setAnalysis = useAnalysisStore.getState().setAnalysis;
        const addRecentFile = useAnalysisStore.getState().addRecentFile;
        const storedFile = storedFiles.find(f => f.id === fileId);
        if (storedFile) {
          setAnalysis(storedFile.storedPath, data.logType, data);
          addRecentFile(storedFile.originalPath);
          clearFilters();
        }
      }
    } catch (error) {
      console.error('Failed to analyze stored file:', error);
    }
    setStoredExpanded(false);
  };

  const handleDeleteStored = async (fileId: string) => {
    try {
      await fetch(`/api/filter/stored/${fileId}`, { method: 'DELETE' });
      fetchStoredFiles();
    } catch (error) {
      console.error('Failed to delete stored file:', error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="recent-files-section">
      {(recentFiles.length > 0 || storedFiles.length > 0) && (
        <>
          <button 
            className="recent-files-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            Recent Files ({recentFiles.length}) ▼
          </button>
          
          <button 
            className="recent-files-toggle stored-toggle"
            onClick={() => setStoredExpanded(!storedExpanded)}
          >
            Stored Library ({storedFiles.length}) ▼
          </button>
        </>
      )}
      
      {expanded && recentFiles.length > 0 && (
        <div className="recent-files-list">
          {recentFiles.map((filePath) => (
            <div key={filePath} className="recent-file-item">
              <button 
                className="recent-file-path"
                onClick={() => handleSelect(filePath)}
                title={filePath}
              >
                {filePath.split('/').pop()}
              </button>
              <span className="recent-file-fullpath" title={filePath}>
                {filePath}
              </span>
              <button 
                className="recent-file-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecentFile(filePath);
                }}
                title="Remove from recent"
              >
                ×
              </button>
            </div>
          ))}
          <button 
            className="recent-files-clear"
            onClick={clearRecentFiles}
          >
            Clear All
          </button>
        </div>
      )}

      {storedExpanded && storedFiles.length > 0 && (
        <div className="recent-files-list stored-list">
          {storedFiles.map((file) => (
            <div key={file.id} className="recent-file-item stored-item">
              <button 
                className="recent-file-path"
                onClick={() => handleAnalyzeStored(file.id)}
                title={file.originalPath}
              >
                {file.fileName}
              </button>
              <span className="recent-file-fullpath" title={file.originalPath}>
                {formatSize(file.size)} • {formatDate(file.storedAt)}
              </span>
              <button 
                className="recent-file-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStored(file.id);
                }}
                title="Delete from library"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}