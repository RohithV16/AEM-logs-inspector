import { useCallback, useState, useRef } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { LogProvider, useLogContext } from './context/LogContext'
import { ToastContainer } from './components/common/ToastContainer'
import { KeyboardShortcutLayer } from './components/common/KeyboardShortcutLayer'
import { Sidebar } from './components/Sidebar/Sidebar'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { FilterSidebar } from './components/FilterSidebar/FilterSidebar'
import { FilterBar } from './components/FilterBar/FilterBar'
import { ExportBar } from './components/ExportBar/ExportBar'
import { EventsList } from './components/EventsList/EventsList'
import { ChartsPanel } from './components/ChartsPanel/ChartsPanel'
import { PinnedList } from './components/PinnedList/PinnedList'
import { TailPanel } from './components/TailPanel/TailPanel'
import { IncidentsPanel } from './components/IncidentsPanel/IncidentsPanel'
import type { ViewTab } from './types'

function AppInner() {
  const [viewTab, setViewTab] = useState<ViewTab>('events')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { payload, totalEvents } = useLogContext()

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
            <FilterSidebar />
            <FilterBar searchRef={searchRef} />
          </div>
          <div className="workspace">
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p) => !p)} />
            <div className="result-view-tabs" data-testid="view-tabs">
              {(['events', 'charts', 'pinned', 'tail'] as ViewTab[]).map((tab) => (
                <button
                  key={tab}
                  data-testid={`view-tab-${tab}`}
                  className={`result-view-tab ${viewTab === tab ? 'active' : ''}`}
                  onClick={() => setViewTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <IncidentsPanel />
            <div className="workspace-content">
              {viewTab === 'events' && <EventsList />}
              {viewTab === 'charts' && <ChartsPanel />}
              {viewTab === 'pinned' && <PinnedList />}
              {viewTab === 'tail' && <TailPanel />}
            </div>
            <ExportBar payload={payload} totalEvents={totalEvents} />
          </div>
        </div>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  )
}

function App() {
  return (
    <LogProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </LogProvider>
  )
}

export default App
