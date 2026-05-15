import { useCallback, useState, useRef } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/common/ToastContainer'
import { KeyboardShortcutLayer } from './components/common/KeyboardShortcutLayer'
import { Sidebar } from './components/Sidebar/Sidebar'
import { FilterSidebar } from './components/FilterSidebar/FilterSidebar'
import { FilterBar } from './components/FilterBar/FilterBar'
import { ExportBar } from './components/ExportBar/ExportBar'
import { EventsList } from './components/EventsList/EventsList'
import { ChartsPanel } from './components/ChartsPanel/ChartsPanel'
import { PinnedList } from './components/PinnedList/PinnedList'
import type { ViewTab } from './types'

function App() {
  const [viewTab, setViewTab] = useState<ViewTab>('events')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSearchFocus = useCallback(() => {
    searchRef.current?.focus()
  }, [])

  const handleEscape = useCallback(() => {
    setSidebarCollapsed(true)
  }, [])

  return (
    <ThemeProvider>
      <ToastProvider>
        <KeyboardShortcutLayer onSearchFocus={handleSearchFocus} onEscape={handleEscape} />
        <div className="app-layout">
          <div className="left-rail">
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p) => !p)} />
            <FilterSidebar />
          </div>
          <div className="workspace">
            <FilterBar searchRef={searchRef} />
            <div className="view-tabs" data-testid="view-tabs">
              {(['events', 'charts', 'pinned'] as ViewTab[]).map((tab) => (
                <button
                  key={tab}
                  data-testid={`view-tab-${tab}`}
                  className={`view-tab ${viewTab === tab ? 'active' : ''}`}
                  onClick={() => setViewTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="workspace-content">
              {viewTab === 'events' && <EventsList />}
              {viewTab === 'charts' && <ChartsPanel />}
              {viewTab === 'pinned' && <PinnedList />}
            </div>
            <ExportBar />
          </div>
        </div>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
