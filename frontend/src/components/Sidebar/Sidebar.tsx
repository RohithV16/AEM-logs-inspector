import { useState } from 'react'
import { SourcePanel } from './SourcePanel'
import { FileInput } from './FileInput'
import { CloudManagerPanel } from '../CloudManagerPanel/CloudManagerPanel'
import { LocalDownloadsPopover } from '../LocalDownloadsPopover/LocalDownloadsPopover'
import type { SourceMode } from '../../types'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('local')

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      data-testid="sidebar"
    >
      <button
        className="sidebar-toggle"
        data-testid="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '\u2192' : '\u2190'}
      </button>

      {!collapsed && (
        <>
          <SourcePanel mode={sourceMode} onModeChange={setSourceMode} />
          {sourceMode === 'cloudmanager' ? <CloudManagerPanel /> : <FileInput />}
          <LocalDownloadsPopover />
        </>
      )}
    </aside>
  )
}
