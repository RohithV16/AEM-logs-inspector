import { useState, useEffect } from 'react';
import { LibraryListView } from './LibraryListView';
import { isLogFile } from '../../utils/logFiltering';

interface FileTreeNode {
  path: string;
  relativePath: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileTreeNode[];
}

interface ScanResponse {
  success: boolean;
  storageDir?: string;
  tree?: FileTreeNode;
  error?: string;
}

interface FileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (selectedPaths: string[]) => void;
  title?: string;
}

const MAX_SELECTION = 30; // Increased for batch analysis

export function FileSelectorModal({ isOpen, onClose, onAnalyze, title = 'Select Files from Library' }: FileSelectorModalProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTree();
    }
  }, [isOpen]);

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/filter/scan');
      const data: ScanResponse = await response.json();
      
      if (data.success && data.tree) {
        setTree(data.tree.children || []);
      } else {
        setError(data.error || 'Failed to load library');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getAllSelectablePaths = (nodes: FileTreeNode[]): string[] => {
    const paths: string[] = [];
    for (const node of nodes) {
      if (node.type === 'file' && isLogFile(node.name)) {
        if (!searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          paths.push(node.path);
        }
      } else if (node.children) {
        paths.push(...getAllSelectablePaths(node.children));
      }
    }
    return paths;
  };

  const handleSelectAll = () => {
    const all = getAllSelectablePaths(tree);
    setSelectedPaths(all.slice(0, MAX_SELECTION));
  };

  const handleAnalyze = () => {
    if (selectedPaths.length > 0) {
      onAnalyze(selectedPaths);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-selector-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="library-controls-top">
            <input 
              type="text" 
              placeholder="Search library..." 
              className="library-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="library-actions-top">
              <button className="upload-btn secondary" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="upload-btn secondary" onClick={() => setSelectedPaths([])}>
                Clear
              </button>
              <button 
                className="upload-btn" 
                onClick={handleAnalyze}
                disabled={selectedPaths.length === 0}
              >
                Analyze Selected ({selectedPaths.length})
              </button>
            </div>
          </div>

          <div className="selection-counter">
            {selectedPaths.length} / {MAX_SELECTION} log files selected
          </div>

          {loading ? (
            <div className="loading-state">Scanning library...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <LibraryListView 
              nodes={tree} 
              selectedPaths={selectedPaths}
              onSelectionChange={setSelectedPaths}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
    </div>
  );
}