import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface WorkspaceShellProps {
  children?: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div className="workspace-shell">
      <Sidebar />
      <main className="workspace-content">{children}</main>
    </div>
  );
}