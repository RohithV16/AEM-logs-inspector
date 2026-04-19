import { useState, useEffect } from 'react';
import { FolderTree } from './FolderTree';

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

const MAX_SELECTION = 5;

export function FileSelectorModal({ isOpen, onClose, onAnalyze, title = 'Select Files to Analyze' }: FileSelectorModalProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error || 'Failed to load file tree');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const allFilePaths = getAllFilePaths(tree);
    const limited = allFilePaths.slice(0, MAX_SELECTION);
    setSelectedPaths(limited);
  };

  const handleSelectNone = () => {
    setSelectedPaths([]);
  };

  const handleAnalyze = () => {
    if (selectedPaths.length > 0) {
      onAnalyze(selectedPaths);
      onClose();
    }
  };

  const getAllFilePaths = (nodes: FileTreeNode[]): string[] => {
    const paths: string[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        paths.push(node.path);
      } else if (node.children) {
        paths.push(...getAllFilePaths(node.children));
      }
    }
    return paths;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading && <div className="loading-state">Loading file tree...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && tree.length === 0 && (
            <div className="empty-state">No log files found in library</div>
          )}
          
          {!loading && !error && tree.length > 0 && (
            <FolderTree
              nodes={tree}
              selectedPaths={selectedPaths}
              onSelectionChange={setSelectedPaths}
              maxSelection={MAX_SELECTION}
            />
          )}
        </div>
        
        <div className="modal-footer">
          <div className="selection-info">
            <span>{selectedPaths.length} / {MAX_SELECTION} files selected</span>
            {selectedPaths.length >= MAX_SELECTION && (
              <span className="selection-limit-warning"> (maximum)</span>
            )}
          </div>
          
          <div className="modal-actions">
            <button className="upload-btn secondary" onClick={handleSelectAll}>
              Select All
            </button>
            <button className="upload-btn secondary" onClick={handleSelectNone}>
              Clear
            </button>
            <button 
              className="upload-btn" 
              onClick={handleAnalyze}
              disabled={selectedPaths.length === 0}
            >
              Analyze Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}