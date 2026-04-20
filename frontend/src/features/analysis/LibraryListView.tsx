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

interface LibraryListViewProps {
  nodes: FileTreeNode[];
  selectedPaths: string[];
  onSelectionChange: (paths: string[]) => void;
  searchQuery: string;
}

export function LibraryListView({ nodes, selectedPaths, onSelectionChange, searchQuery }: LibraryListViewProps) {
  const flattenFiles = (items: FileTreeNode[]): FileTreeNode[] => {
    let results: FileTreeNode[] = [];
    for (const node of items) {
      if (node.type === 'file' && isLogFile(node.name)) {
        if (!searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push(node);
        }
      } else if (node.children) {
        results.push(...flattenFiles(node.children));
      }
    }
    return results;
  };

  const files = flattenFiles(nodes);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getLogType = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('error')) return { label: 'ERROR', color: 'var(--status-error)' };
    if (n.includes('request')) return { label: 'REQUEST', color: 'var(--status-info)' };
    if (n.includes('access') || n.includes('cdn')) return { label: 'ACCESS', color: 'var(--status-success)' };
    return { label: 'LOG', color: 'var(--text-secondary)' };
  };

  return (
    <div className="library-list">
      <div className="library-list-header">
        <div className="col-name">FILENAME</div>
        <div className="col-type">TYPE</div>
        <div className="col-size">SIZE</div>
        <div className="col-date">MODIFIED</div>
      </div>
      <div className="library-list-body">
        {files.length === 0 ? (
          <div className="empty-library-state">No matching log files found</div>
        ) : (
          files.map(file => {
            const isSelected = selectedPaths.includes(file.path);
            const type = getLogType(file.name);
            return (
              <div 
                key={file.path} 
                className={`library-list-row ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (isSelected) onSelectionChange(selectedPaths.filter(p => p !== file.path));
                  else onSelectionChange([...selectedPaths, file.path]);
                }}
              >
                <div className="col-name">
                  <div className="file-info">
                    <span className="file-icon">{isSelected ? '☑' : '📄'}</span>
                    <div className="name-stack">
                      <span className="file-name">{file.name}</span>
                      <span className="file-path">{file.relativePath}</span>
                    </div>
                  </div>
                </div>
                <div className="col-type">
                  <span className="type-badge" style={{ 
                    backgroundColor: type.color + '15', 
                    color: type.color, 
                    borderColor: type.color 
                  }}>
                    {type.label}
                  </span>
                </div>
                <div className="col-size">{formatSize(file.size)}</div>
                <div className="col-date">
                  {file.modified ? new Date(file.modified).toLocaleDateString() : '--'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
