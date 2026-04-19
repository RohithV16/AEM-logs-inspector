import { useState } from 'react';

interface FileTreeNode {
  path: string;
  relativePath: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileTreeNode[];
}

interface FolderTreeProps {
  nodes: FileTreeNode[];
  selectedPaths: string[];
  onSelectionChange: (paths: string[]) => void;
  maxSelection?: number;
}

export function FolderTree({ nodes, selectedPaths, onSelectionChange, maxSelection = 5 }: FolderTreeProps) {
  return (
    <div className="folder-tree">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          selectedPaths={selectedPaths}
          onSelectionChange={onSelectionChange}
          maxSelection={maxSelection}
          level={0}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  selectedPaths: string[];
  onSelectionChange: (paths: string[]) => void;
  maxSelection: number;
  level: number;
}

function TreeNode({ node, selectedPaths, onSelectionChange, maxSelection, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  
  const isSelected = selectedPaths.includes(node.path);
  const isDirectory = node.type === 'directory';
  
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDirectory) {
      setExpanded(!expanded);
      return;
    }
    
    if (isSelected) {
      onSelectionChange(selectedPaths.filter(p => p !== node.path));
    } else {
      if (selectedPaths.length < maxSelection) {
        onSelectionChange([...selectedPaths, node.path]);
      }
    }
  };
  
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className="tree-node">
      <div
        className={`tree-item ${isSelected ? 'selected' : ''} ${isDirectory ? 'directory' : 'file'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={onClick}
      >
        {isDirectory ? (
          <span className="tree-expand">{expanded ? '▼' : '▶'}</span>
        ) : (
          <span className="tree-checkbox">
            {isSelected ? '☑' : '☐'}
          </span>
        )}
        <span className="tree-icon">{isDirectory ? '📁' : '📄'}</span>
        <span className="tree-name">{node.name}</span>
        {!isDirectory && node.size && (
          <span className="tree-size">{formatSize(node.size)}</span>
        )}
      </div>
      {isDirectory && expanded && node.children && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPaths={selectedPaths}
              onSelectionChange={onSelectionChange}
              maxSelection={maxSelection}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}