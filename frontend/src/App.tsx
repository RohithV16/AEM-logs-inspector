import { ThemeControls } from './features/preferences/ThemeControls';
import { Sidebar } from './features/workspace/Sidebar';
import { SourceModeSwitcher } from './features/workspace/SourceModeSwitcher';
import { LocalFileInput } from './features/analysis/LocalFileInput';
import { BatchInput } from './features/analysis/BatchInput';
import { ResultsTable } from './features/results/ResultsTable';
import { Toaster } from './shared/components/Toaster';
import { useWorkspaceStore, DashboardTab } from './features/workspace/useWorkspace';
import { CloudManagerPanel } from './features/cloud-manager/CloudManagerPanel';
import { TailPanel } from './features/tail/TailPanel';

import { useAnalysisStore } from './features/analysis/useAnalysisStore';
import { TimelineChart } from './features/charts/TimelineChart';
import { DistributionChart } from './features/charts/DistributionChart';

export default function App() {
  const { sourceMode, activeTab, setActiveTab } = useWorkspaceStore();
  const { stats, logType } = useAnalysisStore();

  return (
    <div className="main-grid">
      <Sidebar />
      <main className="main-content">
        {/* ... existing upload-card ... */}
        <div className="upload-card">
          <div className="upload-card-header">
            <div>
              <p className="filter-section-label">Analyze source</p>
              <h2>Analyze local logs or pull them from Cloud Manager</h2>
            </div>
            <ThemeControls />
          </div>

          <SourceModeSwitcher />

          <div className="source-panel">
            {sourceMode === 'local' ? (
              <>
                <LocalFileInput />
                <BatchInput />
                <p className="upload-hint">Use one path for standard analysis or comma-separated error logs for merged error analysis.</p>
              </>
            ) : (
              <CloudManagerPanel />
            )}
          </div>
        </div>

        <section id="resultWorkspace" className="result-workspace">
          <div className="result-view-tabs" role="tablist">
            {(['events', 'charts', 'pinned', 'live-tail'] as DashboardTab[]).map((tab) => (
              <button
                key={tab}
                className={`result-view-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="tab-content" style={{ marginTop: '20px' }}>
            {activeTab === 'events' && <ResultsTable />}
            
            {activeTab === 'charts' && (
              <div className="charts-tab result-view-panel active">
                {!stats ? (
                  <div className="empty-state">
                    <p>No analysis data available. Please analyze a log file first.</p>
                  </div>
                ) : (
                  <div className="charts-section">
                    <div className="chart-wrapper full-width">
                      <h4>Timeline Distribution</h4>
                      <TimelineChart data={stats.timeline || {}} />
                    </div>
                    
                    <div className="charts-grid-two">
                      <div className="chart-wrapper">
                        <h4>Logger Stats</h4>
                        <DistributionChart 
                          label="Logs per logger" 
                          data={stats.loggers || stats.loggerDist || {}} 
                          color="#3b82f6" 
                        />
                      </div>
                      <div className="chart-wrapper">
                        <h4>Thread/Pod Stats</h4>
                        <DistributionChart 
                          label="Logs per thread" 
                          data={stats.threads || stats.threadDist || {}} 
                          color="#6366f1" 
                        />
                      </div>
                    </div>

                    {logType === 'error' && stats.exceptions && (
                       <div className="chart-wrapper">
                        <h4>Top Exceptions</h4>
                        <DistributionChart 
                          label="Exception count" 
                          data={stats.exceptions} 
                          color="#ef4444" 
                        />
                      </div>
                    )}

                    {logType === 'cdn' && (
                      <>
                        <div className="charts-grid-two">
                          <div className="chart-wrapper">
                            <h4>Cache Performance</h4>
                            <DistributionChart 
                              label="Requests" 
                              data={stats.cacheStatuses || {}} 
                              color="#10b981" 
                            />
                            <div className="chart-footer-stats">
                              <span className="stat-pill green">Hit Ratio: {stats.summary.cacheHitRatio}%</span>
                              <span className="stat-pill blue">Avg TTFB: {stats.summary.avgTtfb}ms</span>
                            </div>
                          </div>
                          <div className="chart-wrapper">
                            <h4>Top Countries</h4>
                            <DistributionChart 
                              label="Requests" 
                              data={stats.countries || {}} 
                              color="#f59e0b" 
                            />
                          </div>
                        </div>

                        <div className="charts-grid-two">
                          <div className="chart-wrapper">
                            <h4>Traffic by PoP (Point of Presence)</h4>
                            <DistributionChart 
                              label="Requests" 
                              data={stats.pops || {}} 
                              color="#8b5cf6" 
                            />
                          </div>
                          <div className="chart-wrapper">
                            <h4>Target Hosts</h4>
                            <DistributionChart 
                              label="Requests" 
                              data={stats.hosts || {}} 
                              color="#2dd4bf" 
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pinned' && (
              <div className="result-view-panel active">
                <p className="filter-selection-hint">Pinned events feature is coming soon.</p>
              </div>
            )}
            {activeTab === 'live-tail' && <TailPanel />}
          </div>
        </section>

        <Toaster />
      </main>
    </div>
  );
}