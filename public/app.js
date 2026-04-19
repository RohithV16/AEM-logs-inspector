const filePathInput = document.getElementById('filePath');
const analyzeBtn = document.getElementById('analyzeBtn');
const sourceModeButtons = Array.from(document.querySelectorAll('[data-source-mode]'));
const localSourcePanel = document.getElementById('localSourcePanel');
const cloudManagerPanel = document.getElementById('cloudManagerPanel');
const localDownloadsTrigger = document.getElementById('localDownloadsTrigger');
const localDownloadsTriggerMeta = document.getElementById('localDownloadsTriggerMeta');
const localDownloadsPopover = document.getElementById('localDownloadsPopover');
const localDownloadsBackdrop = document.getElementById('localDownloadsBackdrop');
const localDownloadsList = document.getElementById('localDownloadsList');
const localDownloadsOverlayStatus = document.getElementById('localDownloadsOverlayStatus');
const refreshLocalDownloadsBtn = document.getElementById('refreshLocalDownloadsBtn');
const appendSelectedToLocalBtn = document.getElementById('appendSelectedToLocalBtn');
const clearSelectedDownloadsBtn = document.getElementById('clearSelectedDownloadsBtn');
const closeLocalDownloadsPopoverBtn = document.getElementById('closeLocalDownloadsPopoverBtn');
const cmLogTypeTabs = document.getElementById('cmLogTypeTabs');
const popoverCmProgramSelect = document.getElementById('popoverCmProgramSelect');
const popoverCmEnvironmentSelect = document.getElementById('popoverCmEnvironmentSelect');
const cmProgramSelect = document.getElementById('cmProgramSelect');
const cmEnvironmentSelect = document.getElementById('cmEnvironmentSelect');
const cmTierTabs = document.getElementById('cmTierTabs');
const cmLogOptionList = document.getElementById('cmLogOptionList');
const cmDaysInput = document.getElementById('cmDaysInput');
const cmOutputDirectoryInput = document.getElementById('cmOutputDirectory');
const cmEstimatedDateRange = document.getElementById('cmEstimatedDateRange');
const cmProgramHint = document.getElementById('cmProgramHint');
const cmEnvironmentHint = document.getElementById('cmEnvironmentHint');
const cmLogHint = document.getElementById('cmLogHint');
const cmOutputDirectoryHint = document.getElementById('cmOutputDirectoryHint');
const cmAnalyzeBtn = document.getElementById('cmAnalyzeBtn');
const cmTailBtn = document.getElementById('cmTailBtn');
const cmProgressText = document.getElementById('cmProgressText');
const cmDownloadSummary = document.getElementById('cmDownloadSummary');
const cmTailPanel = document.getElementById('cmTailPanel');
const cmTailTitle = document.getElementById('cmTailTitle');
const cmTailStatus = document.getElementById('cmTailStatus');
const cmTailFeed = document.getElementById('cmTailFeed');
const cmTailStopBtn = document.getElementById('cmTailStopBtn');
const cmAdvancedSettingsToggle = document.getElementById('cmAdvancedSettingsToggle');
const cmDownloadProgressPanel = document.getElementById('cmDownloadProgressPanel');
const cmDownloadProgressTitle = document.getElementById('cmDownloadProgressTitle');
const cmDownloadProgressCount = document.getElementById('cmDownloadProgressCount');
const cmDownloadProgressList = document.getElementById('cmDownloadProgressList');
const cmDownloadProgressStatus = document.getElementById('cmDownloadProgressStatus');
const cmStatusBanner = document.getElementById('cmStatusBanner');
const cmCacheStatus = document.getElementById('cmCacheStatus');
const cmCommandPreview = document.getElementById('cmCommandPreview');
const cmHistoryList = document.getElementById('cmHistoryList');
const cmHistorySearchInput = document.getElementById('cmHistorySearchInput');
const cmHistoryEnvironmentFilter = document.getElementById('cmHistoryEnvironmentFilter');
const loggerFilter = document.getElementById('loggerFilter');
const threadFilter = document.getElementById('threadFilter');
const categoryFilter = document.getElementById('categoryFilter');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const savePresetBtn = document.getElementById('savePresetBtn');
const presetSelect = document.getElementById('presetSelect');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportRow = document.querySelector('.export-row');
const progressText = document.getElementById('progressText');
const paginationInfo = document.getElementById('paginationInfo');
const tailBtn = document.getElementById('tailBtn');
const loggerResults = document.getElementById('loggerResults');
const threadSelect = document.getElementById('threadSelect');
const packageFilter = document.getElementById('packageFilter');
const packageResults = document.getElementById('packageResults');
const exceptionFilter = document.getElementById('exceptionFilter');
const exceptionSelect = document.getElementById('exceptionSelect');
const packageVisibleCount = document.getElementById('packageVisibleCount');
const loggerVisibleCount = document.getElementById('loggerVisibleCount');
const packageSelectionHint = document.getElementById('packageSelectionHint');
const loggerSelectionHint = document.getElementById('loggerSelectionHint');
const threadVisibleCount = document.getElementById('threadVisibleCount');
const exceptionVisibleCount = document.getElementById('exceptionVisibleCount');
const advancedSearchRules = document.getElementById('advancedSearchRules');
const addSearchRuleBtn = document.getElementById('addSearchRuleBtn');
const clearSearchRulesBtn = document.getElementById('clearSearchRulesBtn');
const runSearchBuilderBtn = document.getElementById('runSearchBuilderBtn');
const sidebar = document.getElementById('sidebar');
const sidebarBody = document.getElementById('sidebarBody');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const tailPanel = document.getElementById('tailPanel');
const tailTitle = document.getElementById('tailTitle');
const tailSource = document.getElementById('tailSource');
const tailStopBtn = document.getElementById('tailStopBtn');
const tailLevelFilters = document.getElementById('tailLevelFilters');
const tailSearchInput = document.getElementById('tailSearchInput');
const tailRegexToggle = document.getElementById('tailRegexToggle');
const tailPackageFilter = document.getElementById('tailPackageFilter');
const tailPackageResults = document.getElementById('tailPackageResults');
const tailPackageTags = document.getElementById('tailPackageTags');
const tailLoggerFilter = document.getElementById('tailLoggerFilter');
const tailLoggerResults = document.getElementById('tailLoggerResults');
const tailLoggerTags = document.getElementById('tailLoggerTags');
const tailAutoScrollBtn = document.getElementById('tailAutoScrollBtn');
const tailClearBtn = document.getElementById('tailClearBtn');
const tailExportBtn = document.getElementById('tailExportBtn');
const tailExportMenu = document.getElementById('tailExportMenu');
const tailExportJson = document.getElementById('tailExportJson');
const tailExportCsv = document.getElementById('tailExportCsv');
const tailStatus = document.getElementById('tailStatus');
const tailFeed = document.getElementById('tailFeed');
const tailNewIndicator = document.getElementById('tailNewIndicator');
const tailScrollToNew = document.getElementById('tailScrollToNew');
const themeButtons = Array.from(document.querySelectorAll('[data-theme-option]'));
const resultWorkspace = document.getElementById('resultWorkspace');
const workspaceTitle = document.getElementById('workspaceTitle');
const workspaceModeBadge = document.getElementById('workspaceModeBadge');
const workspaceStatus = document.getElementById('workspaceStatus');
const workspaceClearBtn = document.getElementById('workspaceClearBtn');
const pinnedEvents = document.getElementById('pinnedEvents');
const resultViewTabs = Array.from(document.querySelectorAll('[data-result-view]'));
const resultViewEventsTab = document.getElementById('resultViewEventsTab');
const resultViewChartsTab = document.getElementById('resultViewChartsTab');
const resultViewPinnedTab = document.getElementById('resultViewPinnedTab');
const resultViewTailTab = document.getElementById('resultViewTailTab');
const eventsView = document.getElementById('eventsView');
const incidentIndicator = document.getElementById('incidentIndicator');
const incidentIndicatorBtn = document.getElementById('incidentIndicatorBtn');
const incidentCountEl = document.getElementById('incidentCount');
const incidentsPanel = document.getElementById('incidentsPanel');
const THEME_STORAGE_KEY = 'aem_themePreference';
const RAW_EVENTS_PAGE_SIZE_STORAGE_KEY = 'aem_rawEventsPerPage';
const SOURCE_MODE_STORAGE_KEY = 'aem_sourceMode';
const CM_HISTORY_STORAGE_KEY = 'aem_cmHistory';
const CM_SELECTIONS_STORAGE_KEY = 'aem_cmSelections';
const CM_PROGRAMS_CACHE_KEY = 'aem_cmProgramsCache';
const CM_ENVIRONMENTS_CACHE_KEY = 'aem_cmEnvironmentsCache';
const CM_LOG_OPTIONS_CACHE_KEY = 'aem_cmLogOptionsCache';
const WORKSPACE_STORAGE_KEY = 'aem_workspaceState';
const THEME_OPTIONS = new Set(['system', 'light', 'dark']);
let themePreference = localStorage.getItem(THEME_STORAGE_KEY);
if (!THEME_OPTIONS.has(themePreference)) {
  themePreference = 'system';
}
const RAW_EVENTS_PAGE_SIZE_OPTIONS = new Set([50, 100, 150, 200]);

let timelineChart = null;
let loggerChart = null;
let threadChart = null;
let heatmapChart = null;
let rawEventsData = [];
let currentLogType = 'error';
let currentAnalysisMode = 'single';
let currentSourceMode = localStorage.getItem(SOURCE_MODE_STORAGE_KEY) === 'cloudmanager' ? 'cloudmanager' : 'local';
let currentAnalyzedFilePath = '';
let currentBatchInput = null;
let currentBatchSummary = null;
let currentBatchLogType = '';
let cloudManagerProgramsLoaded = false;
let cloudManagerCommandPreviewPending = false;
let cloudManagerLogOptions = [];
let cloudManagerPrograms = [];
let cloudManagerEnvironments = [];
let selectedCloudManagerLogs = [];
let currentCloudManagerTier = '';
let activeLogTypeFilter = 'all';
let cloudManagerLiveMetadata = { lastLoadedAt: '', programsAvailable: false };
let currentCloudManagerRunContext = null;
let cloudManagerHistoryFilters = { search: '', environment: '' };
let cloudManagerCacheData = {
  cacheRoot: '',
  environmentDirectory: '',
  tiers: [],
  summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
};
let popoverCacheData = {
  cacheRoot: '',
  environmentDirectory: '',
  tiers: [],
  summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
};
let popoverProgramId = '';
let popoverEnvironmentId = '';
let selectedLocalDownloadFiles = [];
let localDownloadsPopoverOpen = false;
let cloudManagerDownloadPending = false;
let tailSocket = null;
let activeTailSource = '';
let cloudManagerTailSession = null;
let cloudManagerTailEntries = [];
let cloudManagerDownloadStatusMessage = '';
// Unified filter state now in filters object above
let allLoggers = {};  // Store all loggers for cascading filter
let allPackages = {};
let allThreads = {};
let allPods = {};
let allExceptions = {};
let packageThreadsByPackage = {};
let packageExceptionsByPackage = {};
let visiblePackageOptionCount = 0;
let visibleLoggerOptionCount = 0;
let advancedRulesState = [];
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'aem_sidebarCollapsed';
const SIDEBAR_COLLAPSE_BREAKPOINT = 768;
let sidebarCollapsedPreference = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';

let tailEntries = [];
let tailAutoScroll = true;
let tailHasNewEntries = false;
let tailAllPackages = {};
let tailAllLoggers = {};

let activeView = 'analyzer';
let currentResultView = 'events';
let currentAnalysisSummary = null;
let currentVisibleEventTotal = 0;
let pinnedEntries = [];
let currentCorrelation = null;
let incidentsPanelOpen = false;
let filters = {
  packages: [],
  loggers: [],
  level: 'ALL',
  search: '',
  regex: false
};

function replaceArrayContents(target, nextValues = []) {
  target.splice(0, target.length, ...nextValues);
}

const EXCEPTION_TOKEN_REGEX = /\b(?:[a-zA-Z_$][\w$]*\.)*[A-Z][\w$]*(?:Exception|Error)\b/g;

const themeMediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function getSystemTheme() {
  return themeMediaQuery && themeMediaQuery.matches ? 'dark' : 'light';
}

function getResolvedTheme() {
  return themePreference === 'system' ? getSystemTheme() : themePreference;
}

function getThemeTokens() {
  const styles = getComputedStyle(document.documentElement);
  return {
    backgroundPrimary: styles.getPropertyValue('--color-background-primary').trim(),
    backgroundSecondary: styles.getPropertyValue('--color-background-secondary').trim(),
    backgroundTertiary: styles.getPropertyValue('--color-background-tertiary').trim(),
    borderPrimary: styles.getPropertyValue('--color-border-primary').trim(),
    borderSecondary: styles.getPropertyValue('--color-border-secondary').trim(),
    borderTertiary: styles.getPropertyValue('--color-border-tertiary').trim(),
    textPrimary: styles.getPropertyValue('--color-text-primary').trim(),
    textSecondary: styles.getPropertyValue('--color-text-secondary').trim(),
    textTertiary: styles.getPropertyValue('--color-text-tertiary').trim(),
    primary: styles.getPropertyValue('--color-primary').trim(),
    primarySoft: styles.getPropertyValue('--color-primary-soft').trim(),
    error: styles.getPropertyValue('--color-error').trim(),
    warning: styles.getPropertyValue('--color-warning').trim(),
    success: styles.getPropertyValue('--color-success').trim()
  };
}

function syncThemeControls(resolvedTheme = getResolvedTheme()) {
  const isDark = resolvedTheme === 'dark';
  document.documentElement.dataset.theme = resolvedTheme;
  if (document.body) {
    document.body.dataset.theme = resolvedTheme;
  }

  themeButtons.forEach(button => {
    const isActive = button.dataset.themeOption === themePreference;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    if (button.dataset.themeOption === 'system') {
      button.textContent = themePreference === 'system'
        ? `Auto (${isDark ? 'Dark' : 'Light'})`
        : 'Auto';
    }
  });
}

function refreshVisibleChartsForTheme() {
  if (!chartsToggleBtn || chartsToggleBtn.disabled || !chartsVisible) return;
  if (!currentBatchInput && !getActiveAnalysisFilePath()) return;
  fetchChartsData();
}

function applyThemePreference({ persist = false } = {}) {
  const resolvedTheme = getResolvedTheme();
  syncThemeControls(resolvedTheme);
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }
  refreshVisibleChartsForTheme();
}

function setThemePreference(nextPreference) {
  if (!THEME_OPTIONS.has(nextPreference)) return;
  themePreference = nextPreference;
  applyThemePreference({ persist: true });
}

function getActiveAnalysisFilePath() {
  if (currentAnalysisMode === 'batch') return '';
  if (currentAnalyzedFilePath) return currentAnalyzedFilePath;
  if (currentSourceMode === 'local') return filePathInput.value.trim();
  return '';
}

function setCurrentAnalyzedFilePath(filePath) {
  currentAnalyzedFilePath = filePath ? String(filePath).trim() : '';
}

function getWorkspaceStorageSnapshot() {
  return {
    sourceMode: currentSourceMode,
    resultView: currentResultView,
    filePath: filePathInput?.value.trim() || '',
    rawSearch: rawSearchInput?.value || '',
    rawLevel: rawEventsLevel,
    startDate: startDate?.value || '',
    endDate: endDate?.value || '',
    filters: {
      packages: [...filters.packages],
      loggers: [...filters.loggers],
      level: filters.level,
      search: filters.search,
      regex: filters.regex
    },
    thread: threadSelect?.value || '',
    exception: exceptionSelect?.value || '',
    category: categoryFilter?.value || '',
    request: {
      method: document.getElementById('methodFilter')?.value || '',
      status: document.getElementById('statusFilter')?.value || '',
      pod: document.getElementById('podFilter')?.value || '',
      minResponseTime: document.getElementById('minResponseTime')?.value || '',
      maxResponseTime: document.getElementById('maxResponseTime')?.value || ''
    },
    cdn: {
      method: document.getElementById('cdnMethodFilter')?.value || '',
      status: document.getElementById('cdnStatusFilter')?.value || '',
      cache: document.getElementById('cacheStatusFilter')?.value || '',
      country: document.getElementById('countryFilter')?.value || '',
      pop: document.getElementById('popFilter')?.value || '',
      host: document.getElementById('hostFilter')?.value || '',
      minTtfb: document.getElementById('minTtfb')?.value || '',
      maxTtfb: document.getElementById('maxTtfb')?.value || ''
    },
    pinnedEntries
  };
}

function persistWorkspaceState() {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(getWorkspaceStorageSnapshot()));
}

function countActiveFilters() {
  let count = 0;
  if (startDate?.value) count++;
  if (endDate?.value) count++;
  if (rawEventsLevel && rawEventsLevel !== 'ALL') count++;
  if (rawSearchInput?.value.trim()) count++;
  if (filters.packages.length) count += filters.packages.length;
  if (filters.loggers.length) count += filters.loggers.length;
  if (threadSelect?.value) count++;
  if (exceptionSelect?.value) count++;
  if (categoryFilter?.value) count++;

  [
    'methodFilter', 'statusFilter', 'podFilter', 'minResponseTime', 'maxResponseTime',
    'cdnMethodFilter', 'cdnStatusFilter', 'cacheStatusFilter', 'countryFilter',
    'popFilter', 'hostFilter', 'minTtfb', 'maxTtfb'
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element?.value) count++;
  });

  if (Array.isArray(advancedRulesState) && advancedRulesState.length) count += advancedRulesState.length;
  return count;
}

function buildWorkspaceTitle() {
  if (currentAnalysisMode === 'batch' && currentBatchSummary) {
    const totalFiles = currentBatchSummary.totalFiles || parseBatchInput(currentBatchInput || '').length;
    const batchLabel = currentBatchLogType === 'mixed'
      ? 'mixed log'
      : `${currentBatchLogType || 'batch'} log`;
    return `Merged ${batchLabel} analysis across ${totalFiles} file${totalFiles === 1 ? '' : 's'}`;
  }

  if (currentAnalyzedFilePath) {
    const segments = currentAnalyzedFilePath.split(/[\\/]/);
    return segments[segments.length - 1] || currentAnalyzedFilePath;
  }

  if (activeTailSource === 'cloudmanager' && cloudManagerTailSession) {
    return `Live tail: ${cloudManagerTailSession.environmentName || cloudManagerTailSession.environmentId || 'Cloud Manager'}`;
  }

  return 'No active analysis';
}

function updateWorkspaceChrome() {
  const hasAnalysis = Boolean(currentAnalysisSummary || currentBatchSummary || activeTailSource);
  if (resultWorkspace) resultWorkspace.classList.toggle('hidden', !hasAnalysis);
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.classList.toggle('hidden', hasAnalysis);

  if (workspaceTitle) workspaceTitle.textContent = buildWorkspaceTitle();
  if (workspaceModeBadge) {
    const badgeLabel = activeTailSource
      ? 'Live'
      : currentAnalysisMode === 'batch'
        ? 'Merged'
        : (currentLogType || 'Idle');
    workspaceModeBadge.textContent = badgeLabel;
  }
  if (workspaceStatus) {
    if (activeTailSource === 'cloudmanager') {
      workspaceStatus.textContent = `Live tail is active. Use filters to focus the stream or switch back to Events and Charts without stopping the session.`;
    } else if (currentAnalysisMode === 'batch' && currentBatchSummary) {
      workspaceStatus.textContent = `Merged batch analysis is active. Refine filters to narrow the cross-file result set or pin events to keep them visible while you investigate.`;
    } else if (currentAnalysisSummary) {
      workspaceStatus.textContent = `Analysis loaded. Use the sidebar to refine results, open Charts for distribution trends, or pin events that matter before changing filters.`;
    } else {
      workspaceStatus.textContent = 'Analyze a log file to populate events, charts, and investigation context.';
    }
  }
}

function updateWorkspaceSummary() {
  updateWorkspaceChrome();
}

function setResultView(view, { persist = true } = {}) {
  const nextView = ['events', 'charts', 'pinned', 'live-tail'].includes(view) ? view : 'events';
  currentResultView = nextView;
  chartsVisible = nextView === 'charts';

  const views = {
    events: eventsView,
    charts: chartsTab,
    pinned: document.getElementById('pinnedView'),
    'live-tail': tailPanel
  };

  resultViewTabs.forEach((button) => {
    const isActive = button.dataset.resultView === nextView;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  Object.entries(views).forEach(([key, element]) => {
    if (!element) return;
    element.classList.toggle('hidden', key !== nextView);
    element.classList.toggle('active', key === nextView);
  });

  if (chartsToggleBtn) {
    chartsToggleBtn.classList.toggle('active', nextView === 'charts');
  }

  if (nextView === 'charts') {
    fetchChartsData();
  }

  if (persist) persistWorkspaceState();
}

function updateIncidentIndicator() {
  const incidents = currentCorrelation?.incidents || [];
  if (!incidents.length || currentAnalysisMode !== 'batch') {
    if (incidentIndicator) incidentIndicator.classList.add('hidden');
    if (incidentsPanel) incidentsPanel.classList.add('hidden');
    incidentsPanelOpen = false;
    return;
  }

  const maxSeverity = currentCorrelation.summary?.maxSeverity || 'default';
  const count = incidents.length;
  if (incidentCountEl) incidentCountEl.textContent = count;
  if (incidentIndicatorBtn) {
    incidentIndicatorBtn.classList.remove('severity-error');
    if (maxSeverity === 'ERROR') incidentIndicatorBtn.classList.add('severity-error');
  }
  if (incidentIndicator) incidentIndicator.classList.remove('hidden');
}

function toggleIncidentsPanel() {
  incidentsPanelOpen = !incidentsPanelOpen;
  if (incidentIndicatorBtn) incidentIndicatorBtn.setAttribute('data-expanded', String(incidentsPanelOpen));
  if (!incidentsPanelOpen) {
    incidentsPanel.classList.add('hidden');
    return;
  }
  incidentsPanel.classList.remove('hidden');
  renderIncidents();
}

function renderIncidents() {
  if (!incidentsPanel) return;
  const incidents = currentCorrelation?.incidents || [];
  if (!incidents.length) {
    incidentsPanel.innerHTML = '<div class="incidents-empty">No incidents detected.</div>';
    return;
  }

  const summary = currentCorrelation.summary || {};
  const timeRange = summary.firstTimestamp && summary.lastTimestamp
    ? `from ${summary.firstTimestamp} to ${summary.lastTimestamp}`
    : '';

  let html = '<div class="incidents-panel-header">';
  html += '<h3>Incident Timeline</h3>';
  html += `<span class="incidents-panel-summary">${escapeHtml(timeRange)}</span>`;
  html += '<button id="incidentsPanelCloseBtn" class="incidents-panel-close" type="button" aria-label="Close incidents panel">&times;</button>';
  html += '</div>';

  incidents.forEach((incident, idx) => {
    const maxSev = (incident.severities || []).reduce((best, s) => {
      if (s.name === 'ERROR') return 'error';
      if (s.name === 'WARN' && best !== 'error') return 'warn';
      return best;
    }, 'default');

    const sevLabel = escapeHtml((incident.severities || []).map(s => `${s.name}:${s.count}`).join(', '));
    const sources = (incident.sources || []).map(s => `<span class="incident-source-badge">${escapeHtml(s.name)} (${s.count})</span>`).join('');
    const eventCount = incident.total || incident.events?.length || 0;
    const timeLabel = incident.startTimestamp && incident.lastTimestamp
      ? `${incident.startTimestamp} → ${incident.lastTimestamp}`
      : incident.startTimestamp || '';

    html += `<div class="incident-row" data-incident-idx="${idx}">`;
    html += '<div class="incident-row-meta">';
    html += `<span class="incident-severity-pill ${maxSev}">${sevLabel}</span>`;
    html += `<span class="incident-time-range">${timeLabel}</span>`;
    html += `<span class="incident-event-count">${eventCount} events</span>`;
    html += '</div>';
    if (sources) html += `<div class="incident-sources">${sources}</div>`;
    html += '</div>';
  });

  incidentsPanel.innerHTML = html;

  const closeBtn = document.getElementById('incidentsPanelCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      incidentsPanel.classList.add('hidden');
      incidentsPanelOpen = false;
      if (incidentIndicatorBtn) incidentIndicatorBtn.setAttribute('data-expanded', 'false');
    });
  }

  incidentsPanel.querySelectorAll('.incident-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = Number(row.dataset.incidentIdx);
      const incident = incidents[idx];
      if (!incident) return;

      if (row.classList.contains('expanded')) {
        row.classList.remove('expanded');
        const existing = row.querySelector('.incident-events-list');
        if (existing) existing.remove();
        return;
      }

      row.classList.add('expanded');
      const events = incident.events || [];
      if (!events.length) return;

      let eventsHtml = '<div class="incident-events-list">';
      events.forEach(evt => {
        const evtLevel = (evt.level || evt.severity || 'INFO').toLowerCase();
        const evtClass = evtLevel === 'error' ? 'error' : evtLevel === 'warn' ? 'warn' : 'default';
        const ts = escapeHtml(evt.timestamp || '');
        const msg = evt.message || evt.title || evt.url || JSON.stringify(evt).substring(0, 120);
        eventsHtml += '<div class="incident-event">';
        eventsHtml += `<span class="incident-event-level ${evtClass}">${escapeHtml(evtLevel)}</span>`;
        eventsHtml += `<span class="incident-event-timestamp">${ts}</span>`;
        eventsHtml += `<span class="incident-event-message">${escapeHtml(msg)}</span>`;
        eventsHtml += '</div>';
      });
      eventsHtml += '</div>';
      row.insertAdjacentHTML('beforeend', eventsHtml);
    });
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createPinnedEntryKey(evt = {}, logType = currentLogType) {
  return [
    logType,
    evt.timestamp || '',
    evt.logger || evt.sourceName || evt.sourceFile || evt.url || '',
    evt.message || evt.title || evt.rawLine || '',
    evt.status || '',
    evt.method || ''
  ].join('::');
}

function isPinnedEvent(evt = {}, logType = currentLogType) {
  const key = createPinnedEntryKey(evt, logType);
  return pinnedEntries.some((entry) => entry.key === key);
}

function renderPinnedEvents() {
  if (!pinnedEvents) return;
  if (!pinnedEntries.length) {
    pinnedEvents.innerHTML = '<div class="pinned-empty">No findings pinned yet. Pin events from the Events view to keep them visible while you adjust filters.</div>';
    updateWorkspaceSummary();
    return;
  }

  pinnedEvents.innerHTML = pinnedEntries.map((entry) => `
    <article class="pinned-event-card">
      <div class="pinned-event-meta">
        <span class="level-badge ${escapeHtml(entry.levelClass || 'INFO')}">${escapeHtml(entry.levelLabel || entry.logType || 'Event')}</span>
        <span>${escapeHtml(entry.timestamp || '')}</span>
        <span>${escapeHtml(entry.context || '')}</span>
      </div>
      <p class="pinned-event-message">${highlightText(entry.message || '', rawEventsSearch)}</p>
      <div class="pinned-event-actions">
        <button class="tail-action-btn" type="button" data-remove-pinned-key="${escapeHtml(entry.key)}">Remove</button>
      </div>
    </article>
  `).join('');
  updateWorkspaceSummary();
}

function buildPinnedEntry(evt = {}, logType = currentLogType) {
  const levelClass = String(evt.level || evt.severity || evt.method || 'INFO').toUpperCase();
  const context = evt.logger || evt.sourceName || evt.sourceFile || evt.url || evt.host || '';
  return {
    key: createPinnedEntryKey(evt, logType),
    logType,
    timestamp: evt.timestamp || '',
    context,
    message: evt.message || evt.title || evt.rawLine || evt.url || '',
    levelLabel: evt.level || evt.method || evt.severity || logType,
    levelClass
  };
}

function togglePinnedEvent(entry, logType = currentLogType) {
  const pinnedKey = createPinnedEntryKey(entry, logType);
  const existingIndex = pinnedEntries.findIndex((item) => item.key === pinnedKey);
  if (existingIndex >= 0) {
    pinnedEntries.splice(existingIndex, 1);
  } else {
    pinnedEntries.unshift(buildPinnedEntry(entry, logType));
  }
  renderPinnedEvents();
  persistWorkspaceState();
}

function restoreWorkspaceState() {
  const saved = safeJsonParse(localStorage.getItem(WORKSPACE_STORAGE_KEY), {});
  if (!saved || typeof saved !== 'object') return;

  if (saved.filePath && filePathInput) {
    filePathInput.value = saved.filePath;
  }
  if (saved.rawSearch && rawSearchInput) {
    rawSearchInput.value = saved.rawSearch;
    rawEventsSearch = saved.rawSearch;
  }
  if (saved.rawLevel) {
    rawEventsLevel = saved.rawLevel;
  }
  if (saved.startDate && startDate) startDate.value = saved.startDate;
  if (saved.endDate && endDate) endDate.value = saved.endDate;

  if (saved.filters && typeof saved.filters === 'object') {
    replaceArrayContents(filters.packages, Array.isArray(saved.filters.packages) ? saved.filters.packages : []);
    replaceArrayContents(filters.loggers, Array.isArray(saved.filters.loggers) ? saved.filters.loggers : []);
    filters.level = saved.filters.level || 'ALL';
    filters.search = saved.filters.search || '';
    filters.regex = Boolean(saved.filters.regex);
  }

  if (threadSelect && saved.thread) threadSelect.value = saved.thread;
  if (exceptionSelect && saved.exception) exceptionSelect.value = saved.exception;
  if (categoryFilter && saved.category) categoryFilter.value = saved.category;

  const requestState = saved.request || {};
  const cdnState = saved.cdn || {};
  const valueMap = {
    methodFilter: requestState.method,
    statusFilter: requestState.status,
    podFilter: requestState.pod,
    minResponseTime: requestState.minResponseTime,
    maxResponseTime: requestState.maxResponseTime,
    cdnMethodFilter: cdnState.method,
    cdnStatusFilter: cdnState.status,
    cacheStatusFilter: cdnState.cache,
    countryFilter: cdnState.country,
    popFilter: cdnState.pop,
    hostFilter: cdnState.host,
    minTtfb: cdnState.minTtfb,
    maxTtfb: cdnState.maxTtfb
  };
  Object.entries(valueMap).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) element.value = value;
  });

  pinnedEntries = Array.isArray(saved.pinnedEntries) ? saved.pinnedEntries : [];
  renderPinnedEvents();

  updateLevelChips(rawEventsLevel || 'ALL');
  currentResultView = saved.resultView || 'events';
}

function getCloudManagerSelectionState() {
  return {
    programId: cmProgramSelect?.value || '',
    environmentId: cmEnvironmentSelect?.value || '',
    selections: [...selectedCloudManagerLogs],
    tier: currentCloudManagerTier,
    days: cmDaysInput?.value.trim() || '1',
    outputDirectory: cmOutputDirectoryInput?.value.trim() || ''
  };
}

function isCloudManagerErrorLogSelection(selection = {}) {
  const logName = String(selection.logName || selection.name || '').toLowerCase();
  return logName.includes('error');
}

function getActiveCloudManagerTailSelections() {
  return selectedCloudManagerLogs;
}

function getCloudManagerCommandPreviewState(mode = 'download') {
  const state = getCloudManagerSelectionState();
  if (mode === 'tail') {
    state.selections = getActiveCloudManagerTailSelections();
    state.mode = 'tail';
    return state;
  }

  state.mode = 'download';
  return state;
}

function persistCloudManagerSelectionState() {
  localStorage.setItem(CM_SELECTIONS_STORAGE_KEY, JSON.stringify(getCloudManagerSelectionState()));
}

function readCloudManagerHistory() {
  return safeJsonParse(localStorage.getItem(CM_HISTORY_STORAGE_KEY), []);
}

function writeCloudManagerHistory(entries) {
  localStorage.setItem(CM_HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 12)));
}

function updateCloudManagerCacheStatus() {
  if (!cmCacheStatus) return;
  if (!cloudManagerLiveMetadata.programsAvailable) {
    cmCacheStatus.textContent = 'Programs load live from aio. Select Cloud Manager to fetch available programs.';
    return;
  }

  const refreshedAt = cloudManagerLiveMetadata.lastLoadedAt
    ? new Date(cloudManagerLiveMetadata.lastLoadedAt).toLocaleString()
    : 'unknown';
  const cacheRoot = cmOutputDirectoryInput?.value.trim() || cloudManagerCacheData.cacheRoot || '~/.aem-logs';
  cmCacheStatus.textContent = `Programs loaded live from aio. Cache root: ${cacheRoot}. Last updated: ${refreshedAt}.`;
}

function resetCloudManagerSummary() {
  if (!cmDownloadSummary) return;
  cmDownloadSummary.innerHTML = '';
  cmDownloadSummary.classList.add('hidden');
}

function getCloudManagerEnvironmentMeta(environmentId = cmEnvironmentSelect?.value || '') {
  return cloudManagerEnvironments.find((environment) => environment.id === environmentId) || null;
}

function getCloudManagerEnvironmentLabel(entry = {}) {
  return entry.environmentName || entry.environmentId || 'Unknown environment';
}

function createCloudManagerRunRecord(base = {}) {
  const timestamp = base.timestamp || new Date().toISOString();
  const downloadedFilesDetailed = Array.isArray(base.downloadedFilesDetailed) ? base.downloadedFilesDetailed : [];
  const supportedFiles = downloadedFilesDetailed.filter((file) => file.supported !== false).length;
  return {
    runId: base.runId || `cm-${Date.parse(timestamp) || Date.now()}`,
    timestamp,
    source: 'cloudmanager',
    programId: base.programId || '',
    environmentId: base.environmentId || '',
    programName: base.programName || '',
    environmentName: base.environmentName || '',
    environmentType: base.environmentType || '',
    selections: Array.isArray(base.selections) ? base.selections : [],
    tier: base.tier || '',
    days: String(base.days || '1'),
    outputDirectory: base.outputDirectory || '',
    analyzedFile: base.analyzedFile || '',
    commandPreview: base.commandPreview || '',
    fileDates: Array.isArray(base.fileDates) ? base.fileDates : [],
    downloadedFiles: Array.isArray(base.downloadedFiles) ? base.downloadedFiles : [],
    downloadedFilesDetailed,
    downloads: Array.isArray(base.downloads) ? base.downloads : [],
    summary: {
      fileCount: downloadedFilesDetailed.length || (Array.isArray(base.downloadedFiles) ? base.downloadedFiles.length : 0),
      supportedFiles,
      selectionCount: Array.isArray(base.selections) ? base.selections.length : 0
    }
  };
}

function renderCloudManagerHistoryFilters() {
  if (!cmHistoryEnvironmentFilter) return;
  const history = readCloudManagerHistory();
  const values = [...new Set(history.map((entry) => `${getCloudManagerEnvironmentLabel(entry)}::${entry.environmentId || ''}`))].sort();
  const current = cloudManagerHistoryFilters.environment;
  cmHistoryEnvironmentFilter.innerHTML = '<option value="">All environments</option>';
  values.forEach((value) => {
    const [label, id] = value.split('::');
    const option = document.createElement('option');
    option.value = id || label;
    option.textContent = label;
    cmHistoryEnvironmentFilter.appendChild(option);
  });
  cmHistoryEnvironmentFilter.value = current;
}

function setCloudManagerStatus(message = '') {
  if (!cmStatusBanner) return;
  const text = String(message || '').trim();
  if (!text) {
    cmStatusBanner.textContent = '';
    cmStatusBanner.classList.add('hidden');
    return;
  }

  cmStatusBanner.textContent = text;
  cmStatusBanner.classList.remove('hidden');
}

function switchCloudManagerTab(tabName) {
  // Hide all tab panes
  document.querySelectorAll('.cloudmanager-tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  // Show selected pane
  const selectedPane = document.getElementById(`cmTab-${tabName}`);
  if (selectedPane) {
    selectedPane.classList.add('active');
  }
  
  // Update active tab button
  document.querySelectorAll('.cloudmanager-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Save preference to localStorage
  localStorage.setItem('aem_cmActiveTab', tabName);
}

function toggleCloudManagerAdvancedSettings() {
  const accordion = document.querySelector('.cloudmanager-advanced-settings');
  if (accordion) {
    accordion.classList.toggle('expanded');
    // Save preference to localStorage
    const isExpanded = accordion.classList.contains('expanded');
    localStorage.setItem('aem_cmAdvancedExpanded', isExpanded ? 'true' : 'false');
    if (cmAdvancedSettingsToggle) {
      cmAdvancedSettingsToggle.setAttribute('aria-expanded', String(isExpanded));
    }
  }
}

function restoreCloudManagerTabState() {
  const savedTab = localStorage.getItem('aem_cmActiveTab');
  const nextTab = savedTab === 'history' ? 'history' : 'download';
  if (savedTab === 'setup') {
    localStorage.setItem('aem_cmActiveTab', nextTab);
  }
  switchCloudManagerTab(nextTab);

  const accordion = document.querySelector('.cloudmanager-advanced-settings');
  const isExpanded = localStorage.getItem('aem_cmAdvancedExpanded') === 'true';
  if (accordion) {
    accordion.classList.toggle('expanded', isExpanded);
  }
  if (cmAdvancedSettingsToggle) {
    cmAdvancedSettingsToggle.setAttribute('aria-expanded', String(isExpanded));
  }
}

function renderCloudManagerSummary(data) {
  if (!cmDownloadSummary) return;
  const files = Array.isArray(data.downloadedFilesDetailed) && data.downloadedFilesDetailed.length
    ? data.downloadedFilesDetailed
    : (Array.isArray(data.downloadedFiles) ? data.downloadedFiles.map((filePath) => ({
        filePath,
      fileName: filePath.split('/').pop() || filePath,
      service: '',
      logName: '',
      extractedDate: '',
      modifiedAt: '',
      supported: true,
      unsupportedReason: '',
      logFamily: '',
      logType: ''
      })) : []);
  const dates = Array.isArray(data.fileDates)
    ? data.fileDates
        .map((entry) => entry.extractedDate || entry.modifiedAt?.slice(0, 10) || '')
        .filter(Boolean)
        .slice(0, 4)
        .join(', ')
    : '';
  const fileItems = files.length
    ? `<div class="cloudmanager-download-files">${files.map((file) => {
        const label = [file.service, file.logName].filter(Boolean).join(' / ');
        const when = file.extractedDate || file.modifiedAt?.slice(0, 10) || '';
        const supportLabel = file.supported === false
          ? (file.unsupportedReason || 'Unsupported')
          : (file.logFamily || file.logType || 'Ready for local analysis');
        return `
          <div class="cloudmanager-download-file">
            <div>
              <strong>${escapeHtml(file.fileName || file.filePath)}</strong>
              ${label ? `<span>${escapeHtml(label)}</span>` : ''}
              ${when ? `<span>${escapeHtml(when)}</span>` : ''}
              <span>${escapeHtml(supportLabel)}</span>
              <code>${escapeHtml(file.filePath)}</code>
            </div>
          </div>
        `;
      }).join('')}</div>`
    : '<div>No downloaded files were returned.</div>';

  cmDownloadSummary.innerHTML = `
    <div><strong>Downloaded ${files.length}</strong> Cloud Manager file(s).</div>
    <div>Downloaded to: <code>${escapeHtml(data.environmentDirectory || data.outputDirectory || '')}</code></div>
    ${dates ? `<div>Extracted dates: <span>${escapeHtml(dates)}</span></div>` : ''}
    <div>Analyze these files from <strong>Cloud Manager Logs</strong> in Local Path mode.</div>
    ${fileItems}
  `;
  cmDownloadSummary.classList.remove('hidden');
}

function renderCloudManagerHistory() {
  if (!cmHistoryList) return;
  renderCloudManagerHistoryFilters();
  const entries = readCloudManagerHistory().filter((entry) => {
    const search = cloudManagerHistoryFilters.search.trim().toLowerCase();
    const environmentFilter = cloudManagerHistoryFilters.environment;
    const haystack = [
      entry.programName,
      entry.programId,
      entry.environmentName,
      entry.environmentId,
      entry.outputDirectory,
      ...(entry.selections || []).map((item) => `${item.service}/${item.logName}`)
    ].join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesEnvironment = !environmentFilter || entry.environmentId === environmentFilter || getCloudManagerEnvironmentLabel(entry) === environmentFilter;
    return matchesSearch && matchesEnvironment;
  });
  if (!entries.length) {
    cmHistoryList.innerHTML = '<div class="cloudmanager-hint">No Cloud Manager runs match the current filters.</div>';
    return;
  }

  cmHistoryList.innerHTML = entries.map((entry) => `
    <div class="cloudmanager-history-item" data-history-index="${escapeHtml(entry.runId || '')}">
      <div>
        <strong>${escapeHtml(entry.programName || entry.programId || 'Cloud Manager run')}</strong>
        <span>${escapeHtml(entry.environmentName || entry.environmentId || '')}${entry.environmentType ? ` • ${escapeHtml(entry.environmentType)}` : ''}</span><br>
        <span>${escapeHtml(new Date(entry.timestamp).toLocaleString())}</span><br>
        <span>${escapeHtml((entry.selections || []).map(item => `${item.service}/${item.logName}`).join(', '))}</span><br>
        <span>${escapeHtml(`${entry.summary?.fileCount || 0} files • ${entry.summary?.supportedFiles || 0} supported`)}</span><br>
        <code>${escapeHtml(entry.outputDirectory || '')}</code>
      </div>
      <div class="cloudmanager-history-actions">
        <button class="tail-action-btn" type="button" data-history-action="reuse" data-run-id="${escapeHtml(entry.runId || '')}">Reuse Setup</button>
        <button class="tail-action-btn" type="button" data-history-action="analyze" data-run-id="${escapeHtml(entry.runId || '')}" ${entry.analyzedFile || entry.downloadedFilesDetailed?.some((file) => file.supported !== false) ? '' : 'disabled'}>Analyze Latest</button>
      </div>
    </div>
  `).join('');
}

function pushCloudManagerHistoryEntry(entry) {
  const history = readCloudManagerHistory();
  const normalized = createCloudManagerRunRecord(entry);
  history.unshift(normalized);
  writeCloudManagerHistory(history);
  renderCloudManagerHistory();
  renderLocalDownloadsList();
}

function buildCloudManagerSelectionLabels() {
  const isPopover = localDownloadsPopoverOpen && popoverCmProgramSelect?.value && popoverCmEnvironmentSelect?.value;
  const programName = isPopover
    ? popoverCmProgramSelect.selectedOptions?.[0]?.textContent || ''
    : cmProgramSelect?.selectedOptions?.[0]?.textContent || '';
  const environmentName = isPopover
    ? popoverCmEnvironmentSelect.selectedOptions?.[0]?.textContent || ''
    : cmEnvironmentSelect.selectedOptions?.[0]?.textContent || '';
  return { programName, environmentName };
}

function getCloudManagerSelectedEnvironmentLabel() {
  const { programName, environmentName } = buildCloudManagerSelectionLabels();
  if (!programName || !environmentName) return '';
  return `${programName} / ${environmentName}`;
}

function updateCloudManagerHintState() {
  if (cmProgramHint) {
    cmProgramHint.textContent = cloudManagerLiveMetadata.programsAvailable
      ? 'Choose a program from the live Cloud Manager list.'
      : 'Cloud Manager programs will load live from aio.';
  }
  if (cmEnvironmentHint) {
    cmEnvironmentHint.textContent = cmProgramSelect?.value
      ? 'Choose an environment returned for the selected program.'
      : 'Choose a program to load environments.';
  }
  if (cmLogHint) {
    cmLogHint.textContent = cmEnvironmentSelect?.value
      ? 'Choose a tier tab, then select one or more logs to download.'
      : 'Choose an environment to load downloadable logs.';
  }
}

function syncCloudManagerWorkspace() {
  renderLocalDownloadsList();
}

function getRecentLocalDownloadCandidates() {
  const usePopoverData = localDownloadsPopoverOpen && popoverCmProgramSelect?.value && popoverCmEnvironmentSelect?.value;
  const activeCacheData = usePopoverData ? popoverCacheData : cloudManagerCacheData;

  const candidates = [];
  (activeCacheData.tiers || []).forEach((tierGroup) => {
    (tierGroup.dates || []).forEach((dateGroup) => {
      (dateGroup.files || []).forEach((file) => {
        candidates.push({
          id: file.filePath,
          programName: buildCloudManagerSelectionLabels().programName,
          environmentName: buildCloudManagerSelectionLabels().environmentName,
          service: file.service || tierGroup.tier || '',
          tier: file.tier || tierGroup.tier || '',
          logName: file.logName || file.fileName || '',
          filePath: file.filePath,
          fileName: file.fileName || (file.filePath ? file.filePath.split('/').pop() : ''),
          supported: file.supported !== false,
          unsupportedReason: file.unsupportedReason || '',
          logFamily: file.logFamily || '',
          logType: file.logType || '',
          modifiedAt: file.modifiedAt || '',
          extractedDate: file.extractedDate || dateGroup.date || '',
          size: file.size || 0
        });
      });
    });
  });
  return candidates;
}

function getLogTypeIcon(logType) {
  const icons = {
    error: '⚠',
    request: '↔',
    cdn: '🌐',
  };
  return icons[logType] || '📄';
}

function getLogTypeLabel(logType) {
  const labels = {
    error: 'Error Logs',
    request: 'Request Logs',
    cdn: 'CDN Logs',
  };
  return labels[logType] || 'Other Logs';
}

function getLogTypeOrder(logType) {
  const order = { error: 0, request: 1, cdn: 2 };
  return order[logType] ?? 99;
}

function isLocalDownloadSelectable(file) {
  return Boolean(file && file.supported && file.filePath);
}

function updateLocalDownloadsTrigger(candidates = []) {
  if (!localDownloadsTrigger || !localDownloadsTriggerMeta) return;
  const selectedCount = selectedLocalDownloadFiles.filter((id) => candidates.some((candidate) => candidate.id === id)).length;
  const environmentLabel = localDownloadsPopoverOpen ? getPopoverEnvironmentLabel() : getCloudManagerSelectedEnvironmentLabel();
  let summary = environmentLabel ? 'No downloads yet' : 'Choose an environment';
  if (environmentLabel && candidates.length) {
    summary = selectedCount
      ? `${selectedCount} selected • ${candidates.length} downloaded`
      : `${candidates.length} downloaded in ${environmentLabel}`;
  }
  localDownloadsTriggerMeta.textContent = summary;
}

function setCloudManagerDownloadStatus(message = '', { pending = false } = {}) {
  cloudManagerDownloadPending = Boolean(pending);
  cloudManagerDownloadStatusMessage = String(message || '').trim();

  if (cmAnalyzeBtn) {
    cmAnalyzeBtn.disabled = cloudManagerDownloadPending || !(cloudManagerLiveMetadata.programsAvailable && cmProgramSelect?.value && cmEnvironmentSelect?.value && selectedCloudManagerLogs.length);
    cmAnalyzeBtn.textContent = cloudManagerDownloadPending ? 'Downloading…' : 'Download Selected Logs';
  }

  if (refreshLocalDownloadsBtn) {
    refreshLocalDownloadsBtn.disabled = cloudManagerDownloadPending;
  }

  if (cmProgressText) {
    cmProgressText.textContent = cloudManagerDownloadStatusMessage;
    cmProgressText.classList.toggle('hidden', !cloudManagerDownloadStatusMessage);
  }

  if (localDownloadsOverlayStatus) {
    localDownloadsOverlayStatus.textContent = cloudManagerDownloadStatusMessage;
    localDownloadsOverlayStatus.classList.toggle('hidden', !cloudManagerDownloadStatusMessage);
  }

  updateTailControls();
}

function formatTailEntryMarkup(entry = {}) {
  const level = entry.level || entry.type || entry.logType || 'raw';
  const timestamp = entry.timestamp || '';
  const body = entry.rawLine || entry.message || JSON.stringify(entry);
  const sourceLabel = entry.sourceLabel || `${entry.service || ''}/${entry.logName || ''}`.replace(/^\/|\/$/g, '');
  const severityClass = level === 'ERROR' ? 'error' : (level === 'WARN' ? 'warn' : '');
  return `
    <div class="cloudmanager-tail-entry ${severityClass}">
      <div class="cloudmanager-tail-entry-meta">
        <span>${escapeHtml(String(level))}</span>
        <span>${escapeHtml(String(timestamp))}</span>
        <span>${escapeHtml(String(sourceLabel || 'Cloud Manager'))}</span>
      </div>
      <code>${escapeHtml(String(body))}</code>
    </div>
  `;
}

function renderCloudManagerTailPanel() {
  if (!cmTailPanel || !cmTailFeed || !cmTailStatus || !cmTailTitle) return;

  const hasSession = Boolean(cloudManagerTailSession);
  const hasEntries = cloudManagerTailEntries.length > 0;
  cmTailPanel.classList.toggle('hidden', !(hasSession || hasEntries));

  if (!hasSession && !hasEntries) {
    cmTailFeed.innerHTML = '';
    cmTailStatus.textContent = 'Select a Cloud Manager log and start tailing.';
    cmTailTitle.textContent = 'No active Cloud Manager tail';
    updateTailControls();
    return;
  }

  cmTailTitle.textContent = cloudManagerTailSession
    ? `Tailing ${cloudManagerTailSession.selectionCount} log${cloudManagerTailSession.selectionCount === 1 ? '' : 's'} on ${cloudManagerTailSession.environmentName || cloudManagerTailSession.environmentId}`
    : 'Recent live tail output';
  cmTailFeed.innerHTML = cloudManagerTailEntries.map(formatTailEntryMarkup).join('');
  cmTailFeed.scrollTop = 0;
  updateTailControls();
}

function setCloudManagerTailStatus(message = '') {
  if (!cmTailStatus) return;
  cmTailStatus.textContent = message || 'Select a Cloud Manager log and start tailing.';
  renderCloudManagerTailPanel();
}

function pushCloudManagerTailEntry(entry) {
  cloudManagerTailEntries = [entry, ...cloudManagerTailEntries].slice(0, 100);
  renderCloudManagerTailPanel();
}

function resetCloudManagerTailState({ preserveEntries = false } = {}) {
  cloudManagerTailSession = null;
  if (!preserveEntries) {
    cloudManagerTailEntries = [];
  }
  activeTailSource = activeTailSource === 'cloudmanager' ? '' : activeTailSource;
  renderCloudManagerTailPanel();
}

function updateTailControls() {
  const tailSelections = getActiveCloudManagerTailSelections();
  const cloudManagerTailActive = activeTailSource === 'cloudmanager';
  if (cmTailBtn) {
    cmTailBtn.disabled = cloudManagerDownloadPending || (!cloudManagerTailActive && !(cloudManagerLiveMetadata.programsAvailable && cmProgramSelect?.value && cmEnvironmentSelect?.value && tailSelections.length));
    cmTailBtn.textContent = cloudManagerTailActive ? 'Tailing…' : 'Tail Logs';
    cmTailBtn.classList.toggle('active', cloudManagerTailActive);
    cmTailBtn.title = 'Start live tailing for the selected Cloud Manager logs';
  }

  if (cmTailStopBtn) {
    cmTailStopBtn.disabled = !cloudManagerTailActive;
  }
  if (resultViewTailTab) {
    resultViewTailTab.disabled = !cloudManagerTailActive && !tailEntries.length;
  }
}

function setLocalDownloadsPopoverOpen(nextOpen) {
  if (!localDownloadsPopover || !localDownloadsTrigger) return;
  localDownloadsPopoverOpen = Boolean(nextOpen);
  localDownloadsPopover.classList.toggle('hidden', !localDownloadsPopoverOpen);
  localDownloadsTrigger.setAttribute('aria-expanded', String(localDownloadsPopoverOpen));
}

function toggleLocalDownloadsPopover() {
  setLocalDownloadsPopoverOpen(!localDownloadsPopoverOpen);
}

async function loadCloudManagerCacheBrowser(programId = cmProgramSelect?.value || '', environmentId = cmEnvironmentSelect?.value || '', { silent = false } = {}) {
  if (!programId || !environmentId) {
    cloudManagerCacheData = {
      cacheRoot: cmOutputDirectoryInput?.value.trim() || '',
      environmentDirectory: '',
      tiers: [],
      summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
    };
    selectedLocalDownloadFiles = [];
    renderLocalDownloadsList();
    return;
  }

  if (localDownloadsList && !silent) {
    localDownloadsList.innerHTML = '<div class="cloudmanager-hint">Loading downloaded Cloud Manager logs...</div>';
  }

  try {
    const params = new URLSearchParams({ programId, environmentId });
    const response = await fetch(`/api/cloudmanager/cache/logs?${params.toString()}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unable to load downloaded Cloud Manager logs');
    }
    cloudManagerCacheData = {
      cacheRoot: data.cacheRoot || cmOutputDirectoryInput?.value.trim() || '',
      environmentDirectory: data.environmentDirectory || '',
      tiers: Array.isArray(data.tiers) ? data.tiers : [],
      summary: data.summary || { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
    };
  } catch (error) {
    cloudManagerCacheData = {
      cacheRoot: cmOutputDirectoryInput?.value.trim() || '',
      environmentDirectory: '',
      tiers: [],
      summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
    };
    if (!silent) showError(error.message);
  }

  const tiers = new Set((cloudManagerCacheData.tiers || []).map((group) => group.tier));
  const availableTiers = cloudManagerLogOptions.map((entry) => normalizeCloudManagerTier(entry.service));
  availableTiers.forEach((tier) => tiers.add(tier));
  if (!tiers.has(currentCloudManagerTier)) {
    currentCloudManagerTier = tiers.values().next().value || '';
  }
  renderLocalDownloadsList();
}

async function syncPopoverProgramDropdown() {
  if (!popoverCmProgramSelect || !popoverCmEnvironmentSelect) return;
  const programOptions = cmProgramSelect?.innerHTML || '<option value="">Program</option>';
  popoverCmProgramSelect.innerHTML = programOptions;
  popoverCmProgramSelect.value = cmProgramSelect?.value || '';
  popoverProgramId = popoverCmProgramSelect.value || '';
  popoverEnvironmentId = '';

  if (!popoverCmProgramSelect.value) {
    popoverCmEnvironmentSelect.innerHTML = '<option value="">Environment</option>';
    popoverCmEnvironmentSelect.disabled = true;
    return;
  }

  const programId = popoverCmProgramSelect.value;

  if (cloudManagerEnvironments.length > 0 && cmProgramSelect?.value === programId) {
    populatePopoverEnvironmentsFromCache(cloudManagerEnvironments, programId);
    if (cmEnvironmentSelect?.value && cloudManagerEnvironments.some((e) => e.id === cmEnvironmentSelect.value)) {
      popoverCmEnvironmentSelect.value = cmEnvironmentSelect.value;
      popoverEnvironmentId = cmEnvironmentSelect.value;
      if (cloudManagerCacheData.tiers?.length > 0) {
        popoverCacheData = JSON.parse(JSON.stringify(cloudManagerCacheData));
        activeLogTypeFilter = 'all';
        selectedLocalDownloadFiles = [];
        renderLocalDownloadsList();
      } else {
        await loadPopoverCache(popoverProgramId, popoverEnvironmentId);
      }
    } else {
      popoverCacheData = {
        cacheRoot: '',
        environmentDirectory: '',
        tiers: [],
        summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
      };
      selectedLocalDownloadFiles = [];
      activeLogTypeFilter = 'all';
      renderLocalDownloadsList();
    }
  } else {
    await loadPopoverEnvironments(programId);
  }
}

function populatePopoverEnvironmentsFromCache(environments, programId) {
  if (!popoverCmEnvironmentSelect) return;
  popoverCmEnvironmentSelect.innerHTML = '<option value="">Environment</option>';
  environments.forEach((env) => {
    const option = document.createElement('option');
    option.value = env.id;
    option.textContent = env.name + (env.type ? ` (${env.type})` : '');
    popoverCmEnvironmentSelect.appendChild(option);
  });
  popoverCmEnvironmentSelect.disabled = false;
}

async function loadPopoverEnvironments(programId) {
  if (!popoverCmEnvironmentSelect) return;
  popoverCmEnvironmentSelect.innerHTML = '<option value="">Environment</option>';
  popoverCmEnvironmentSelect.disabled = true;
  if (!programId) return;

  const cachedAllEnvironments = safeJsonParse(localStorage.getItem(CM_ENVIRONMENTS_CACHE_KEY), {});
  const cachedEnvironments = cachedAllEnvironments[programId];

  if (cachedEnvironments && Array.isArray(cachedEnvironments.environments)) {
    populatePopoverEnvironmentsFromCache(cachedEnvironments.environments, programId);
    if (cmEnvironmentSelect?.value && cachedEnvironments.environments.some((e) => e.id === cmEnvironmentSelect.value)) {
      popoverCmEnvironmentSelect.value = cmEnvironmentSelect.value;
      popoverEnvironmentId = cmEnvironmentSelect.value;
      if (cloudManagerCacheData.tiers?.length > 0 && cmProgramSelect?.value === programId) {
        popoverCacheData = JSON.parse(JSON.stringify(cloudManagerCacheData));
        activeLogTypeFilter = 'all';
        selectedLocalDownloadFiles = [];
        renderLocalDownloadsList();
      } else {
        await loadPopoverCache(popoverProgramId || programId, popoverEnvironmentId);
      }
    } else {
      popoverCacheData = {
        cacheRoot: '',
        environmentDirectory: '',
        tiers: [],
        summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
      };
      selectedLocalDownloadFiles = [];
      activeLogTypeFilter = 'all';
      renderLocalDownloadsList();
    }
    return;
  }

  try {
    const response = await fetch(`/api/cloudmanager/programs/${programId}/environments`);
    const data = await response.json();
    if (!data.success || !data.environments?.length) return;

    populatePopoverEnvironmentsFromCache(data.environments, programId);

    if (cmEnvironmentSelect?.value && data.environments.some((e) => e.id === cmEnvironmentSelect.value)) {
      popoverCmEnvironmentSelect.value = cmEnvironmentSelect.value;
      popoverEnvironmentId = cmEnvironmentSelect.value;
      await loadPopoverCache(popoverProgramId || programId, popoverEnvironmentId);
    } else {
      popoverCacheData = {
        cacheRoot: '',
        environmentDirectory: '',
        tiers: [],
        summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
      };
      selectedLocalDownloadFiles = [];
      activeLogTypeFilter = 'all';
      renderLocalDownloadsList();
    }
  } catch (error) {
    console.error('[Popover] Failed to load environments:', error);
  }
}

async function loadPopoverCache(programId, environmentId, { silent = false } = {}) {
  if (!programId || !environmentId) {
    popoverCacheData = {
      cacheRoot: '',
      environmentDirectory: '',
      tiers: [],
      summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
    };
    selectedLocalDownloadFiles = [];
    activeLogTypeFilter = 'all';
    renderLocalDownloadsList();
    return;
  }

  if (!silent) {
    localDownloadsList.innerHTML = `
      <div class="popover-loading-container">
        <div class="popover-loading-spinner"></div>
        <div class="popover-loading-text">Loading downloaded logs...</div>
      </div>
    `;
  }

  try {
    const params = new URLSearchParams({ programId, environmentId });
    const response = await fetch(`/api/cloudmanager/cache/logs?${params.toString()}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unable to load downloaded logs');
    }
    popoverCacheData = {
      cacheRoot: data.cacheRoot || '',
      environmentDirectory: data.environmentDirectory || '',
      tiers: Array.isArray(data.tiers) ? data.tiers : [],
      summary: data.summary || { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
    };
  } catch (error) {
    popoverCacheData = {
      cacheRoot: '',
      environmentDirectory: '',
      tiers: [],
      summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
    };
    if (!silent) {
      localDownloadsList.innerHTML = `<div class="cloudmanager-hint">${escapeHtml(error.message)}</div>`;
    }
    return;
  }

  activeLogTypeFilter = 'all';
  selectedLocalDownloadFiles = [];
  renderLocalDownloadsList();
}

function getPopoverEnvironmentLabel() {
  if (!popoverCmProgramSelect?.value || !popoverCmEnvironmentSelect?.value) return '';
  const programText = popoverCmProgramSelect.selectedOptions[0]?.textContent || '';
  const envText = popoverCmEnvironmentSelect.selectedOptions[0]?.textContent || '';
  return `${programText} / ${envText}`;
}

function formatLocalDownloadsSize(size) {
  const value = Number(size || 0);
  if (!value) return '';
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function applySelectedDownloadsToInput() {
  const candidates = getRecentLocalDownloadCandidates();
  const selectedFiles = selectedLocalDownloadFiles
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter(Boolean);

  if (!selectedFiles.length) {
    persistLocalPathInput('');
    return;
  }

  if (selectedFiles.length > 1) {
    const allErrorLogs = selectedFiles.every((file) => file.logType === 'error');
    if (!allErrorLogs) {
      const hasNonError = selectedFiles.some((file) => file.logType && file.logType !== 'error');
      if (hasNonError) {
        showToast('Multiple-file analysis for CDN/request logs uses batch analysis (no error correlation)', 'warning');
      }
    }
  }

  persistLocalPathInput(selectedFiles.map((file) => file.filePath).join(','));
}

function renderLocalDownloadsList() {
  if (!localDownloadsList) return;

  const usePopoverData = localDownloadsPopoverOpen && popoverCmProgramSelect?.value && popoverCmEnvironmentSelect?.value;
  const activeCacheData = usePopoverData ? popoverCacheData : cloudManagerCacheData;
  const activeProgramId = usePopoverData ? popoverCmProgramSelect.value : cmProgramSelect?.value;
  const activeEnvironmentId = usePopoverData ? popoverCmEnvironmentSelect.value : cmEnvironmentSelect?.value;

  const candidates = [];
  (activeCacheData.tiers || []).forEach((tierGroup) => {
    (tierGroup.dates || []).forEach((dateGroup) => {
      (dateGroup.files || []).forEach((file) => {
        candidates.push({
          id: file.filePath,
          tier: file.tier || tierGroup.tier || '',
          logName: file.logName || file.fileName || '',
          filePath: file.filePath,
          fileName: file.fileName || (file.filePath ? file.filePath.split('/').pop() : ''),
          supported: file.supported !== false,
          unsupportedReason: file.unsupportedReason || '',
          logFamily: file.logFamily || '',
          logType: file.logType || '',
          modifiedAt: file.modifiedAt || '',
          extractedDate: file.extractedDate || dateGroup.date || '',
          size: file.size || 0
        });
      });
    });
  });

  selectedLocalDownloadFiles = selectedLocalDownloadFiles.filter((id) => candidates.some((candidate) => candidate.id === id));
  updateLocalDownloadsTrigger(candidates);

  if (!activeProgramId || !activeEnvironmentId) {
    const hint = usePopoverData
      ? 'Select a program and environment to browse downloads.'
      : 'Select a program and environment in the Cloud Manager tab to browse downloads.';
    localDownloadsList.innerHTML = `<div class="cloudmanager-hint">${hint}</div>`;
    if (cmLogTypeTabs) cmLogTypeTabs.innerHTML = '';
    return;
  }

  const typeGroups = {};
  candidates.forEach((file) => {
    const logType = file.logType || 'unknown';
    if (!typeGroups[logType]) {
      typeGroups[logType] = [];
    }
    typeGroups[logType].push(file);
  });

  const sortedTypes = Object.keys(typeGroups).sort((a, b) => getLogTypeOrder(a) - getLogTypeOrder(b));

  if (cmLogTypeTabs) {
    const totalCount = candidates.length;
    cmLogTypeTabs.innerHTML = `
      <button class="cm-log-type-tab ${activeLogTypeFilter === 'all' ? 'active' : ''}" type="button" data-type="all">
        All Logs
        <span class="tab-count">${totalCount}</span>
      </button>
      ${sortedTypes.map((type) => `
        <button class="cm-log-type-tab ${activeLogTypeFilter === type ? 'active' : ''}" type="button" data-type="${escapeHtml(type)}">
          ${getLogTypeIcon(type)} ${getLogTypeLabel(type)}
          <span class="tab-count">${typeGroups[type].length}</span>
        </button>
      `).join('')}
    `;
  }

  const filteredTypes = activeLogTypeFilter === 'all'
    ? sortedTypes
    : sortedTypes.filter((t) => t === activeLogTypeFilter);

  if (!filteredTypes.length) {
    localDownloadsList.innerHTML = '<div class="cloudmanager-hint">No downloaded logs found for this environment.</div>';
    return;
  }

  const environmentLabel = usePopoverData ? getPopoverEnvironmentLabel() : getCloudManagerSelectedEnvironmentLabel();
  const totalCached = activeCacheData.summary?.totalFiles || 0;

  let html = `
    <div class="cm-picker-meta-card">
      <div>
        <strong>${escapeHtml(environmentLabel || 'Cloud Manager environment')}</strong>
        <span>${escapeHtml(activeCacheData.environmentDirectory || activeCacheData.cacheRoot || 'Download path not available')}</span>
      </div>
      <div class="cm-picker-stat">
        <strong>${escapeHtml(String(totalCached))}</strong>
        <span>downloaded logs</span>
      </div>
    </div>
  `;

  filteredTypes.forEach((logType) => {
    const files = typeGroups[logType];

    const tierGroups = {};
    files.forEach((file) => {
      const tier = file.tier || 'other';
      if (!tierGroups[tier]) {
        tierGroups[tier] = [];
      }
      tierGroups[tier].push(file);
    });

    const sortedTiers = Object.keys(tierGroups).sort((a, b) => {
      const tierOrder = { author: 0, publish: 1, dispatcher: 2 };
      return (tierOrder[a] ?? 99) - (tierOrder[b] ?? 99) || a.localeCompare(b);
    });

    html += `
      <div class="cm-type-group">
        <div class="cm-type-group-header">
          <h4>
            <span class="type-icon">${getLogTypeIcon(logType)}</span>
            ${getLogTypeLabel(logType)}
          </h4>
          <span class="group-meta">${files.length} file${files.length !== 1 ? 's' : ''}</span>
        </div>
    `;

    sortedTiers.forEach((tier) => {
      const tierFiles = tierGroups[tier];

      const dateGroups = {};
      tierFiles.forEach((file) => {
        const date = file.extractedDate || 'unknown';
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(file);
      });

      const sortedDates = Object.keys(dateGroups).sort().reverse();

      html += `
        <div class="cm-tier-subgroup">
          <div class="cm-tier-subgroup-label">${escapeHtml(tier)}</div>
      `;

      sortedDates.forEach((date) => {
        const dateFiles = dateGroups[date];

        html += `
          <div class="cm-date-subgroup">
            <div class="cm-date-subgroup-header">${escapeHtml(date)}</div>
        `;

        dateFiles.forEach((file) => {
          const checked = selectedLocalDownloadFiles.includes(file.filePath) ? 'checked' : '';
          const selectable = isLocalDownloadSelectable(file);
          const supportLabel = selectable
            ? (file.logFamily || file.logType || 'Ready for analysis')
            : (file.unsupportedReason || 'Unsupported');

          html += `
            <div class="cm-picker-cache-item ${checked ? 'selected' : ''} ${selectable ? '' : 'disabled'}">
              <label class="cm-picker-cache-copy">
                <input type="checkbox" data-local-download-id="${escapeHtml(file.filePath)}" ${checked} ${selectable ? '' : 'disabled'}>
                <div>
                  <strong>${escapeHtml(file.fileName)}</strong>
                  <span>${escapeHtml(supportLabel)}</span>
                  <span>${escapeHtml(formatLocalDownloadsSize(file.size))}</span>
                  <code>${escapeHtml(file.filePath)}</code>
                </div>
              </label>
              <div class="cm-picker-cache-actions">
                <button class="upload-btn secondary compact" type="button" data-cache-analyze-path="${escapeHtml(file.filePath)}" ${selectable ? '' : 'disabled'}>Analyze</button>
              </div>
            </div>
          `;
        });

        html += `</div>`;
      });

      html += `</div>`;
    });

    html += `</div>`;
  });

  localDownloadsList.innerHTML = html;
}

function normalizeCloudManagerTier(service = '') {
  const value = String(service || '').toLowerCase();
  if (value.includes('author')) return 'author';
  if (value.includes('publish')) return 'publish';
  if (value.includes('dispatcher')) return 'dispatcher';
  return value || 'other';
}

function getCloudManagerTierOrder(tier) {
  const order = { author: 0, publish: 1, dispatcher: 2 };
  return order[tier] ?? 99;
}

function getCloudManagerTierGroups() {
  const groups = {};
  cloudManagerLogOptions.forEach((entry) => {
    const tier = normalizeCloudManagerTier(entry.service);
    if (!groups[tier]) groups[tier] = [];
    groups[tier].push(entry);
  });
  return Object.entries(groups)
    .sort((a, b) => getCloudManagerTierOrder(a[0]) - getCloudManagerTierOrder(b[0]) || a[0].localeCompare(b[0]))
    .map(([tier, entries]) => ({ tier, entries }));
}

function renderCloudManagerTierTabs() {
  if (!cmTierTabs) return;
  const groups = getCloudManagerTierGroups();
  if (!groups.length) {
    cmTierTabs.innerHTML = '';
    currentCloudManagerTier = '';
    return;
  }

  const hasCurrentTier = groups.some((group) => group.tier === currentCloudManagerTier);
  if (!hasCurrentTier) {
    currentCloudManagerTier = groups[0].tier;
  }

  cmTierTabs.innerHTML = groups.map((group) => `
    <button class="cloudmanager-tier-tab ${group.tier === currentCloudManagerTier ? 'active' : ''}" type="button" data-tier="${group.tier}">
      ${escapeHtml(group.tier)}
    </button>
  `).join('');
}

function renderCloudManagerLogOptions() {
  if (!cmLogOptionList) return;
  renderCloudManagerTierTabs();
  const groups = getCloudManagerTierGroups();
  const activeGroup = groups.find((group) => group.tier === currentCloudManagerTier);

  if (!activeGroup) {
    cmLogOptionList.innerHTML = '<div class="cloudmanager-hint">No log options loaded yet.</div>';
    cmLogOptionList.classList.add('disabled');
    return;
  }

  const selectedKeys = new Set(selectedCloudManagerLogs.map((entry) => `${entry.service}::${entry.logName}`));
  cmLogOptionList.innerHTML = activeGroup.entries.map((entry) => {
    const key = `${entry.service}::${entry.name}`;
    const checked = selectedKeys.has(key) ? 'checked' : '';
    return `
      <label class="cloudmanager-log-option">
        <input type="checkbox" data-log-key="${escapeHtml(key)}" ${checked}>
        <span>
          <strong>${escapeHtml(entry.service)}</strong>
          <span>${escapeHtml(entry.name)}</span>
        </span>
      </label>
    `;
  }).join('');
  cmLogOptionList.classList.remove('disabled');
  syncCloudManagerWorkspace();
}

function getSelectedCloudManagerLogOptions() {
  return cloudManagerLogOptions.filter((entry) => {
    const key = `${entry.service}::${entry.name}`;
    return selectedCloudManagerLogs.some((selected) => `${selected.service}::${selected.logName}` === key);
  });
}

async function refreshCloudManagerCommandPreview(mode = cloudManagerTailSession ? 'tail' : 'download') {
  if (!cmCommandPreview) return;
  const state = getCloudManagerCommandPreviewState(mode);
  if (!state.days) state.days = '1';
  if (cmEstimatedDateRange) {
    const parsedDays = Math.max(Number(state.days || 1), 1);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Math.max(parsedDays - 1, 0));
    cmEstimatedDateRange.textContent = `Estimated range: ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`;
  }

  if (!state.programId || !state.environmentId || !state.selections.length) {
    cmCommandPreview.innerHTML = '';
    cmCommandPreview.classList.add('hidden');
    return;
  }

  cloudManagerCommandPreviewPending = true;
  try {
    const response = await fetch('/api/cloudmanager/command-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    const data = await response.json();
    if (!data.success) return;

    const commands = (data.commands || []).map((entry) => `<code>${escapeHtml(entry.command)}</code>`).join('');
    const title = mode === 'tail' ? 'Tail command preview' : 'Command preview';
    const detail = mode === 'tail'
      ? 'Live tail streams entries directly from Cloud Manager and does not save them.'
      : escapeHtml(data.estimatedDateRange?.label || '');
    cmCommandPreview.innerHTML = `
      <div><strong>${title}</strong></div>
      <div>${detail}</div>
      ${commands}
    `;
    cmCommandPreview.classList.remove('hidden');
  } catch {
    // Best-effort preview.
  } finally {
    cloudManagerCommandPreviewPending = false;
  }
}

async function validateCloudManagerOutputDirectory() {
  if (!cmOutputDirectoryInput) return false;
  const outputDirectory = cmOutputDirectoryInput.value.trim();
  if (cmOutputDirectoryHint) {
    cmOutputDirectoryHint.textContent = outputDirectory
      ? `Download folder: ${outputDirectory}`
      : 'Cloud Manager downloads are stored automatically for browsing and analysis.';
  }
  updateCloudManagerActionState(Boolean(outputDirectory));
  return Boolean(outputDirectory);
}

function updateCloudManagerActionState(outputDirectoryValid) {
  const hasSelection = Boolean(cloudManagerLiveMetadata.programsAvailable && cmProgramSelect?.value && cmEnvironmentSelect?.value && selectedCloudManagerLogs.length);
  const outputReady = typeof outputDirectoryValid === 'boolean'
    ? outputDirectoryValid
    : Boolean(cmOutputDirectoryInput?.value.trim());
  if (cmAnalyzeBtn) {
    cmAnalyzeBtn.disabled = cloudManagerDownloadPending || !(hasSelection && outputReady);
  }
  updateCloudManagerHintState();
  updateTailControls();
}

function restoreCloudManagerSelections() {
  const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
  if (cmDaysInput && saved.days) cmDaysInput.value = String(saved.days);
  currentCloudManagerTier = saved.tier || '';
  syncCloudManagerWorkspace();
}

function setSourceMode(mode, { persist = true } = {}) {
  currentSourceMode = mode === 'cloudmanager' ? 'cloudmanager' : 'local';
  if (currentSourceMode !== 'local') {
    setLocalDownloadsPopoverOpen(false);
  }

  sourceModeButtons.forEach((button) => {
    const isActive = button.dataset.sourceMode === currentSourceMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  if (localSourcePanel) localSourcePanel.classList.toggle('hidden', currentSourceMode !== 'local');
  if (cloudManagerPanel) cloudManagerPanel.classList.toggle('hidden', currentSourceMode !== 'cloudmanager');
  updateTailControls();

  if (persist) {
    localStorage.setItem(SOURCE_MODE_STORAGE_KEY, currentSourceMode);
  }

  if (currentSourceMode === 'local') {
    currentCloudManagerRunContext = null;
    renderLocalDownloadsList();
  }

  if (currentSourceMode === 'cloudmanager') {
    resetCloudManagerSummary();
    setCloudManagerStatus('');
    restoreCloudManagerSelections();
    updateCloudManagerCacheStatus();
    updateCloudManagerActionState();
    renderCloudManagerHistory();
    ensureCloudManagerProgramsLoaded();
  }

  updateWorkspaceChrome();
  if (persist) persistWorkspaceState();
}

function renderCloudManagerResultBadges() {}

async function ensureCloudManagerProgramsLoaded({ force = false, silent = false } = {}) {
  const previousMarkup = cmProgramSelect.innerHTML;
  const hadExistingOptions = cmProgramSelect.options.length > 1;

  const cachedPrograms = !force ? safeJsonParse(localStorage.getItem(CM_PROGRAMS_CACHE_KEY), null) : null;
  if (cachedPrograms && Array.isArray(cachedPrograms.programs)) {
    cloudManagerPrograms = cachedPrograms.programs;
    cloudManagerLiveMetadata = {
      lastLoadedAt: cachedPrograms.loadedAt || new Date().toISOString(),
      programsAvailable: cloudManagerPrograms.length > 0
    };
    if (cmOutputDirectoryInput && cachedPrograms.cacheRoot) {
      cmOutputDirectoryInput.value = cachedPrograms.cacheRoot;
      cloudManagerCacheData.cacheRoot = cachedPrograms.cacheRoot;
      if (!silent) await validateCloudManagerOutputDirectory();
    }
    if (!silent) updateCloudManagerCacheStatus();
    cmProgramSelect.innerHTML = '<option value="">Select program</option>';
    cloudManagerPrograms.forEach((program) => {
      const option = document.createElement('option');
      option.value = program.id;
      option.textContent = program.name;
      cmProgramSelect.appendChild(option);
    });

    const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
    if (saved.programId && Array.from(cmProgramSelect.options).some((option) => option.value === saved.programId)) {
      cmProgramSelect.value = saved.programId;
      await loadCloudManagerEnvironments(saved.programId, { force, silent });
    }
    cmProgramSelect.disabled = false;
    cloudManagerProgramsLoaded = true;
    if (!silent) {
      updateCloudManagerActionState();
      syncCloudManagerWorkspace();
    }
    return;
  }

  if (!silent) {
    cmProgramSelect.disabled = true;
    cmProgramSelect.innerHTML = '<option value="">Loading programs...</option>';
    setCloudManagerStatus('Loading Cloud Manager programs...');
  }

  try {
    const response = await fetch('/api/cloudmanager/programs');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load Cloud Manager programs');
    }

    localStorage.setItem(CM_PROGRAMS_CACHE_KEY, JSON.stringify({
      programs: data.programs || [],
      loadedAt: data.loadedAt || new Date().toISOString(),
      cacheRoot: data.cacheRoot
    }));

    cloudManagerLiveMetadata = {
      lastLoadedAt: data.loadedAt || new Date().toISOString(),
      programsAvailable: Array.isArray(data.programs) && data.programs.length > 0
    };
    cloudManagerPrograms = data.programs || [];
    if (cmOutputDirectoryInput && data.cacheRoot) {
      cmOutputDirectoryInput.value = data.cacheRoot;
      cloudManagerCacheData.cacheRoot = data.cacheRoot;
      if (!silent) await validateCloudManagerOutputDirectory();
    }
    if (!silent) updateCloudManagerCacheStatus();
    cmProgramSelect.innerHTML = '<option value="">Select program</option>';
    (data.programs || []).forEach((program) => {
      const option = document.createElement('option');
      option.value = program.id;
      option.textContent = program.name;
      cmProgramSelect.appendChild(option);
    });
    const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
    if (saved.programId && Array.from(cmProgramSelect.options).some((option) => option.value === saved.programId)) {
      cmProgramSelect.value = saved.programId;
      await loadCloudManagerEnvironments(saved.programId, { force, silent });
    }
    cmProgramSelect.disabled = false;
    cloudManagerProgramsLoaded = true;
    if (!silent) {
      setCloudManagerStatus((data.programs || []).length ? '' : 'No Cloud Manager programs were returned.');
      updateCloudManagerActionState();
      syncCloudManagerWorkspace();
    }
  } catch (error) {
    cloudManagerLiveMetadata = { lastLoadedAt: '', programsAvailable: false };
    cloudManagerPrograms = [];
    if (!silent) updateCloudManagerCacheStatus();
    cmProgramSelect.innerHTML = hadExistingOptions
      ? previousMarkup
      : '<option value="">Unable to load programs</option>';
    cmProgramSelect.disabled = false;
    if (!silent) {
      setCloudManagerStatus('');
      showError(error.message);
    }
  }
}

async function loadCloudManagerEnvironments(programId, { force = false, silent = false } = {}) {
  const cachedAllEnvironments = !force ? safeJsonParse(localStorage.getItem(CM_ENVIRONMENTS_CACHE_KEY), {}) : {};
  const cachedEnvironments = cachedAllEnvironments[programId];

  if (cachedEnvironments && Array.isArray(cachedEnvironments.environments)) {
    cloudManagerEnvironments = cachedEnvironments.environments;
    cloudManagerLiveMetadata.lastLoadedAt = cachedEnvironments.loadedAt || cloudManagerLiveMetadata.lastLoadedAt;
    if (!silent) updateCloudManagerCacheStatus();
    cmEnvironmentSelect.innerHTML = '<option value="">Select environment</option>';
    cloudManagerEnvironments.forEach((environment) => {
      const option = document.createElement('option');
      option.value = environment.id;
      option.textContent = environment.type
        ? `${environment.name} (${environment.type})`
        : environment.name;
      cmEnvironmentSelect.appendChild(option);
    });
    cmEnvironmentSelect.disabled = false;
    const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
    if (saved.environmentId && Array.from(cmEnvironmentSelect.options).some((option) => option.value === saved.environmentId)) {
      cmEnvironmentSelect.value = saved.environmentId;
      await loadCloudManagerLogOptions(programId, saved.environmentId, { force });
      await loadCloudManagerCacheBrowser(programId, saved.environmentId, { silent: true });
    }
    if (!silent) syncCloudManagerWorkspace();
    return;
  }

  if (!silent) {
    cmEnvironmentSelect.disabled = true;
    cmEnvironmentSelect.innerHTML = '<option value="">Loading environments...</option>';
  }
  cloudManagerLogOptions = [];
  selectedCloudManagerLogs = [];
  if (!silent) {
    renderCloudManagerLogOptions();
    setCloudManagerStatus('Loading environments for the selected program...');
  }

  try {
    const response = await fetch(`/api/cloudmanager/programs/${encodeURIComponent(programId)}/environments`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load environments');
    }

    const nextAllEnvironments = safeJsonParse(localStorage.getItem(CM_ENVIRONMENTS_CACHE_KEY), {});
    nextAllEnvironments[programId] = {
      environments: data.environments || [],
      loadedAt: data.loadedAt || new Date().toISOString()
    };
    localStorage.setItem(CM_ENVIRONMENTS_CACHE_KEY, JSON.stringify(nextAllEnvironments));

    cloudManagerLiveMetadata.lastLoadedAt = data.loadedAt || cloudManagerLiveMetadata.lastLoadedAt;
    cloudManagerEnvironments = data.environments || [];
    updateCloudManagerCacheStatus();
    cmEnvironmentSelect.innerHTML = '<option value="">Select environment</option>';
    (data.environments || []).forEach((environment) => {
      const option = document.createElement('option');
      option.value = environment.id;
      option.textContent = environment.type
        ? `${environment.name} (${environment.type})`
        : environment.name;
      cmEnvironmentSelect.appendChild(option);
    });
    cmEnvironmentSelect.disabled = false;
    const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
    if (saved.environmentId && Array.from(cmEnvironmentSelect.options).some((option) => option.value === saved.environmentId)) {
      cmEnvironmentSelect.value = saved.environmentId;
      await loadCloudManagerLogOptions(programId, saved.environmentId, { force });
      await loadCloudManagerCacheBrowser(programId, saved.environmentId, { silent: true });
    }
    if (!silent) {
      setCloudManagerStatus((data.environments || []).length ? '' : 'No environments were returned for the selected program.');
      syncCloudManagerWorkspace();
    }
  } catch (error) {
    cloudManagerEnvironments = [];
    if (!silent) {
      cmEnvironmentSelect.innerHTML = '<option value="">Unable to load environments</option>';
      setCloudManagerStatus('');
      showError(error.message);
    }
  }
}

async function loadCloudManagerLogOptions(programId, environmentId, { force = false } = {}) {
  const cachedAllOptions = !force ? safeJsonParse(localStorage.getItem(CM_LOG_OPTIONS_CACHE_KEY), {}) : {};
  const cacheKey = `${programId}::${environmentId}`;
  const cachedOptions = cachedAllOptions[cacheKey];

  if (cachedOptions && Array.isArray(cachedOptions.logOptions)) {
    cloudManagerLogOptions = cachedOptions.logOptions;
    const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
    currentCloudManagerTier = saved.tier || currentCloudManagerTier;
    selectedCloudManagerLogs = Array.isArray(saved.selections)
      ? saved.selections.filter((entry) =>
          cloudManagerLogOptions.some((option) => option.service === entry.service && option.name === entry.logName)
        )
      : [];
    renderCloudManagerLogOptions();
    await refreshCloudManagerCommandPreview();
    await loadCloudManagerCacheBrowser(programId, environmentId, { silent: true });
    updateCloudManagerActionState();
    syncCloudManagerWorkspace();
    return;
  }

  cloudManagerLogOptions = [];
  selectedCloudManagerLogs = [];
  currentCloudManagerTier = '';
  renderCloudManagerLogOptions();
  setCloudManagerStatus('Loading available service and log options...');

  try {
    const params = new URLSearchParams({ programId });
    const response = await fetch(`/api/cloudmanager/environments/${encodeURIComponent(environmentId)}/log-options?${params.toString()}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load log options');
    }

    const nextAllOptions = safeJsonParse(localStorage.getItem(CM_LOG_OPTIONS_CACHE_KEY), {});
    nextAllOptions[cacheKey] = {
      logOptions: data.logOptions || [],
      loadedAt: data.loadedAt || new Date().toISOString()
    };
    localStorage.setItem(CM_LOG_OPTIONS_CACHE_KEY, JSON.stringify(nextAllOptions));

    cloudManagerLogOptions = data.logOptions || [];
    const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
    currentCloudManagerTier = saved.tier || currentCloudManagerTier;
    selectedCloudManagerLogs = Array.isArray(saved.selections)
      ? saved.selections.filter((entry) =>
          cloudManagerLogOptions.some((option) => option.service === entry.service && option.name === entry.logName)
        )
      : [];
    renderCloudManagerLogOptions();
    setCloudManagerStatus((data.logOptions || []).length ? '' : 'No downloadable log options were returned for the selected environment.');
    await refreshCloudManagerCommandPreview();
    await loadCloudManagerCacheBrowser(programId, environmentId, { silent: true });
    updateCloudManagerActionState();
    syncCloudManagerWorkspace();
  } catch (error) {
    cloudManagerLogOptions = [];
    selectedCloudManagerLogs = [];
    renderCloudManagerLogOptions();
    setCloudManagerStatus('');
    showError(error.message);
  }
}

if (themeMediaQuery && typeof themeMediaQuery.addEventListener === 'function') {
  themeMediaQuery.addEventListener('change', () => {
    if (themePreference === 'system') {
      applyThemePreference();
    }
  });
} else if (themeMediaQuery && typeof themeMediaQuery.addListener === 'function') {
  themeMediaQuery.addListener(() => {
    if (themePreference === 'system') {
      applyThemePreference();
    }
  });
}

themeButtons.forEach(button => {
  button.addEventListener('click', () => {
    setThemePreference(button.dataset.themeOption);
  });
});

sourceModeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setSourceMode(button.dataset.sourceMode);
    persistWorkspaceState();
  });
});

if (cmAdvancedSettingsToggle) {
  cmAdvancedSettingsToggle.addEventListener('click', () => {
    toggleCloudManagerAdvancedSettings();
  });
}

resultViewTabs.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.disabled) return;
    setResultView(button.dataset.resultView);
  });
});

if (incidentIndicatorBtn) {
  incidentIndicatorBtn.addEventListener('click', () => {
    toggleIncidentsPanel();
  });
}

if (workspaceClearBtn) {
  workspaceClearBtn.addEventListener('click', () => {
    currentAnalysisSummary = null;
    currentVisibleEventTotal = 0;
    rawEventsData = [];
    currentAnalysisMode = 'single';
    currentBatchInput = null;
    currentBatchSummary = null;
    currentBatchLogType = '';
    currentCorrelation = null;
    pinnedEntries = [];
    setCurrentAnalyzedFilePath('');
    if (rawEventsSection) rawEventsSection.innerHTML = '';
    if (pinnedEvents) pinnedEvents.innerHTML = '<div class="pinned-empty">No findings pinned yet. Pin events from the Events view to keep them visible while you adjust filters.</div>';
    setResultView('events', { persist: false });
    updateWorkspaceChrome();
    updateWorkspaceSummary();
    persistWorkspaceState();
    updateIncidentIndicator();
  });
}

if (cmProgramSelect) {
  cmProgramSelect.addEventListener('change', async () => {
    resetCloudManagerSummary();
    currentCloudManagerRunContext = null;
    renderCloudManagerResultBadges();
    cmEnvironmentSelect.innerHTML = '<option value="">Select environment</option>';
    cloudManagerLogOptions = [];
    selectedCloudManagerLogs = [];
    renderCloudManagerLogOptions();
    persistCloudManagerSelectionState();
    await refreshCloudManagerCommandPreview();
    updateCloudManagerActionState();

    if (!cmProgramSelect.value) {
      cmEnvironmentSelect.disabled = true;
      persistCloudManagerSelectionState();
      await loadCloudManagerCacheBrowser('', '', { silent: true });
      return;
    }

    await loadCloudManagerEnvironments(cmProgramSelect.value);
    persistCloudManagerSelectionState();
  });
}

if (cmEnvironmentSelect) {
  cmEnvironmentSelect.addEventListener('change', async () => {
    resetCloudManagerSummary();
    currentCloudManagerRunContext = null;
    renderCloudManagerResultBadges();
    if (!cmEnvironmentSelect.value || !cmProgramSelect.value) {
      cloudManagerLogOptions = [];
      selectedCloudManagerLogs = [];
      renderCloudManagerLogOptions();
      await loadCloudManagerCacheBrowser('', '', { silent: true });
      persistCloudManagerSelectionState();
      await refreshCloudManagerCommandPreview();
      updateCloudManagerActionState();
      return;
    }

    await loadCloudManagerLogOptions(cmProgramSelect.value, cmEnvironmentSelect.value);
    persistCloudManagerSelectionState();
  });
}

if (cmLogOptionList) {
  cmLogOptionList.addEventListener('change', async (event) => {
    const input = event.target.closest('input[type="checkbox"][data-log-key]');
    if (!input) return;
    const selected = cloudManagerLogOptions.find((entry) => `${entry.service}::${entry.name}` === input.dataset.logKey);
    if (!selected) return;

    const key = `${selected.service}::${selected.name}`;
    if (input.checked) {
      if (!selectedCloudManagerLogs.some((entry) => `${entry.service}::${entry.logName}` === key)) {
        selectedCloudManagerLogs.push({ service: selected.service, logName: selected.name });
      }
    } else {
      selectedCloudManagerLogs = selectedCloudManagerLogs.filter((entry) => `${entry.service}::${entry.logName}` !== key);
    }

    persistCloudManagerSelectionState();
    await refreshCloudManagerCommandPreview();
    updateCloudManagerActionState();
    syncCloudManagerWorkspace();
  });
}

if (cmTierTabs) {
  cmTierTabs.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-tier]');
    if (!button) return;
    currentCloudManagerTier = button.dataset.tier || '';
    persistCloudManagerSelectionState();
    renderCloudManagerLogOptions();
    renderLocalDownloadsList();
    await refreshCloudManagerCommandPreview();
  });
}

if (cmDaysInput) {
  cmDaysInput.addEventListener('input', async () => {
    persistCloudManagerSelectionState();
    await refreshCloudManagerCommandPreview();
    updateCloudManagerActionState();
    syncCloudManagerWorkspace();
  });
}

if (cmOutputDirectoryInput) {
  cmOutputDirectoryInput.addEventListener('blur', async () => {
    await validateCloudManagerOutputDirectory();
  });
}

/* === Cloud Manager Tab Navigation === */
document.querySelectorAll('.cloudmanager-tab').forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    const tabName = tabBtn.dataset.tab;
    switchCloudManagerTab(tabName);
    persistWorkspaceState();
  });
});

if (cmHistorySearchInput) {
  cmHistorySearchInput.addEventListener('input', () => {
    cloudManagerHistoryFilters.search = cmHistorySearchInput.value || '';
    renderCloudManagerHistory();
  });
}

if (localDownloadsList) {
  localDownloadsList.addEventListener('change', async (event) => {
    const selectionInput = event.target.closest('[data-local-download-id]');
    if (selectionInput) {
      const fileId = selectionInput.dataset.localDownloadId || '';
      if (!fileId) return;

      if (selectionInput.checked) {
        if (!selectedLocalDownloadFiles.includes(fileId)) {
          selectedLocalDownloadFiles.push(fileId);
        }
      } else {
        selectedLocalDownloadFiles = selectedLocalDownloadFiles.filter((id) => id !== fileId);
      }

      renderLocalDownloadsList();
      return;
    }

    const cacheLogInput = event.target.closest('[data-cache-log-key]');
    if (!cacheLogInput) return;
    const selected = cloudManagerLogOptions.find((entry) => `${entry.service}::${entry.name}` === cacheLogInput.dataset.cacheLogKey);
    if (!selected) return;
    const key = `${selected.service}::${selected.name}`;
    if (cacheLogInput.checked) {
      if (!selectedCloudManagerLogs.some((entry) => `${entry.service}::${entry.logName}` === key)) {
        selectedCloudManagerLogs.push({ service: selected.service, logName: selected.name });
      }
    } else {
      selectedCloudManagerLogs = selectedCloudManagerLogs.filter((entry) => `${entry.service}::${entry.logName}` !== key);
    }
    persistCloudManagerSelectionState();
    await refreshCloudManagerCommandPreview();
    updateCloudManagerActionState();
    syncCloudManagerWorkspace();
  });

  localDownloadsList.addEventListener('click', async (event) => {
    const analyzeButton = event.target.closest('[data-cache-analyze-path]');
    if (analyzeButton) {
      const filePath = analyzeButton.dataset.cacheAnalyzePath || '';
      if (!filePath) return;
      setLocalDownloadsPopoverOpen(false);
      if (currentSourceMode !== 'local') setSourceMode('local');
      filePathInput.value = filePath;
      localStorage.setItem('aem_lastPath', filePath);
      await analyzeFilePath(filePath);
    }
  });
}

if (localDownloadsTrigger) {
  localDownloadsTrigger.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (!localDownloadsPopoverOpen) {
      if (!cloudManagerProgramsLoaded) {
        await ensureCloudManagerProgramsLoaded({ silent: true });
      }
      await syncPopoverProgramDropdown();
    }
    toggleLocalDownloadsPopover();
  });
}

if (closeLocalDownloadsPopoverBtn) {
  closeLocalDownloadsPopoverBtn.addEventListener('click', () => {
    setLocalDownloadsPopoverOpen(false);
  });
}

if (clearSelectedDownloadsBtn) {
  clearSelectedDownloadsBtn.addEventListener('click', () => {
    selectedLocalDownloadFiles = [];
    renderLocalDownloadsList();
    persistLocalPathInput('');
  });
}

if (appendSelectedToLocalBtn) {
  appendSelectedToLocalBtn.addEventListener('click', () => {
    if (!selectedLocalDownloadFiles.length) {
      showToast('Select one or more log files first', 'warning');
      return;
    }
    applySelectedDownloadsToInput();
    setLocalDownloadsPopoverOpen(false);
  });
}

if (cmLogTypeTabs) {
  cmLogTypeTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-type]');
    if (!tab) return;
    activeLogTypeFilter = tab.dataset.type;
    renderLocalDownloadsList();
  });
}

if (refreshLocalDownloadsBtn) {
  refreshLocalDownloadsBtn.addEventListener('click', async () => {
    try {
      setCloudManagerDownloadStatus('Refreshing local logs...', { pending: true });
      await ensureCloudManagerProgramsLoaded({ force: true });
      await syncPopoverProgramDropdown();
      if (popoverCmProgramSelect?.value && popoverCmEnvironmentSelect?.value) {
        await loadPopoverCache(popoverCmProgramSelect.value, popoverCmEnvironmentSelect.value);
      }
      setCloudManagerDownloadStatus('Local logs refreshed.');
    } catch (error) {
      setCloudManagerDownloadStatus('');
      showError(error.message);
    }
  });
}

if (localDownloadsBackdrop) {
  localDownloadsBackdrop.addEventListener('click', () => {
    if (!localDownloadsPopoverOpen) return;
    setLocalDownloadsPopoverOpen(false);
  });
}

if (popoverCmProgramSelect) {
  popoverCmProgramSelect.addEventListener('change', async () => {
    popoverProgramId = popoverCmProgramSelect.value || '';
    popoverEnvironmentId = '';
    if (popoverCmEnvironmentSelect) {
      popoverCmEnvironmentSelect.innerHTML = '<option value="">Environment</option>';
      popoverCmEnvironmentSelect.disabled = !popoverProgramId;
    }
    if (popoverProgramId) {
      await loadPopoverEnvironments(popoverProgramId);
    } else {
      popoverCacheData = {
        cacheRoot: '',
        environmentDirectory: '',
        tiers: [],
        summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
      };
      selectedLocalDownloadFiles = [];
      activeLogTypeFilter = 'all';
      renderLocalDownloadsList();
    }
  });
}

if (popoverCmEnvironmentSelect) {
  popoverCmEnvironmentSelect.addEventListener('change', async () => {
    popoverEnvironmentId = popoverCmEnvironmentSelect.value || '';
    popoverProgramId = popoverCmProgramSelect?.value || '';
    if (popoverEnvironmentId && popoverProgramId) {
      await loadPopoverCache(popoverProgramId, popoverEnvironmentId);
    } else {
      popoverCacheData = {
        cacheRoot: '',
        environmentDirectory: '',
        tiers: [],
        summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
      };
      selectedLocalDownloadFiles = [];
      activeLogTypeFilter = 'all';
      renderLocalDownloadsList();
    }
  });
}

if (cmHistoryEnvironmentFilter) {
  cmHistoryEnvironmentFilter.addEventListener('change', () => {
    cloudManagerHistoryFilters.environment = cmHistoryEnvironmentFilter.value || '';
    renderCloudManagerHistory();
  });
}

document.addEventListener('keydown', (event) => {
  void event;
});

function isSidebarCollapseSupported() {
  return window.innerWidth > SIDEBAR_COLLAPSE_BREAKPOINT;
}

function syncSidebarToggleButton(isCollapsed) {
  if (!sidebarToggleBtn) return;
  const label = sidebarToggleBtn.querySelector('.sidebar-toggle-label');
  const icon = sidebarToggleBtn.querySelector('.sidebar-toggle-icon');
  if (label) label.textContent = isCollapsed ? 'Expand' : 'Collapse';
  if (icon) icon.textContent = isCollapsed ? '▶' : '◀';
  sidebarToggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
  sidebarToggleBtn.setAttribute('aria-label', isCollapsed ? 'Expand filters panel' : 'Collapse filters panel');
}

function applySidebarState({ persist = false } = {}) {
  const shouldCollapse = sidebarCollapsedPreference && isSidebarCollapseSupported();
  if (sidebar) {
    sidebar.classList.toggle('collapsed', shouldCollapse);
  }
  if (sidebarBody) {
    sidebarBody.setAttribute('aria-hidden', String(shouldCollapse));
  }
  document.body.classList.toggle('sidebar-collapsed', shouldCollapse);
  syncSidebarToggleButton(shouldCollapse);
  if (persist) {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, sidebarCollapsedPreference ? '1' : '0');
  }
}

function setSidebarCollapsed(nextCollapsed) {
  sidebarCollapsedPreference = Boolean(nextCollapsed);
  applySidebarState({ persist: true });
}

if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => {
    setSidebarCollapsed(!sidebarCollapsedPreference);
  });
}

window.addEventListener('resize', () => {
  applySidebarState();
});

function extractExceptionNames(text) {
  if (!text) return [];
  const matches = String(text).match(EXCEPTION_TOKEN_REGEX);
  return matches ? [...new Set(matches)] : [];
}

function formatDateTimeForDisplay(value) {
  if (!value) return '';
  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(?:\.\d{3})?)?$/);
  if (isoMatch) {
    const time = isoMatch[3] ? `${isoMatch[2]}:${isoMatch[3]}` : isoMatch[2];
    return `${isoMatch[1]} ${time}`;
  }
  const spaceMatch = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::(\d{2})(?:\.\d{3})?)?$/);
  if (spaceMatch) {
    const time = spaceMatch[3] ? `${spaceMatch[2]}:${spaceMatch[3]}` : spaceMatch[2];
    return `${spaceMatch[1]} ${time}`;
  }
  return text;
}

function normalizeDateTimeForApi(value) {
  if (!value) return '';
  const text = String(value).trim();
  const spaceMatch = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::(\d{2}))?(?:\.\d{3})?$/);
  if (spaceMatch) {
    const time = spaceMatch[3] ? `${spaceMatch[2]}:${spaceMatch[3]}` : `${spaceMatch[2]}:00`;
    return `${spaceMatch[1]}T${time}`;
  }
  return text;
}

function setDateRangeBounds(timeline, logType) {
  const keys = Object.keys(timeline);
  if (!keys.length) return;

  function parseKey(key) {
    if (logType === 'error') {
      const [datePart, hour] = key.split(' ');
      const [dd, mm, yyyy] = datePart.split('.');
      return { date: `${yyyy}-${mm}-${dd}`, hour };
    } else if (logType === 'request') {
      const [datePart, hour] = key.split(':');
      const [dd, mon, yyyy] = datePart.split('/');
      const months = { Jan:"01", Feb:"02", Mar:"03", Apr:"04", May:"05", Jun:"06", Jul:"07", Aug:"08", Sep:"09", Oct:"10", Nov:"11", Dec:"12" };
      return { date: `${yyyy}-${months[mon]}-${dd}`, hour };
    } else {
      return { date: key.substring(0, 10), hour: key.substring(11, 13) };
    }
  }

  const sorted = keys.sort((a, b) => parseKey(a).date.localeCompare(parseKey(b).date));
  const first = parseKey(sorted[0]);
  const last = parseKey(sorted[sorted.length - 1]);

  const firstTime = `${first.date} ${first.hour}:00:00`;
  const lastTime = `${last.date} ${last.hour}:59:59`;

  startDate.min = formatDateTimeForDisplay(firstTime);
  startDate.max = formatDateTimeForDisplay(lastTime);
  startDate.value = formatDateTimeForDisplay(firstTime);
  endDate.min = formatDateTimeForDisplay(firstTime);
  endDate.max = formatDateTimeForDisplay(lastTime);
  endDate.value = formatDateTimeForDisplay(lastTime);
}

function getSeverityClass(severity) {
  const value = String(severity || '').toUpperCase();
  if (value === 'ERROR' || value === '5XX') return 'error';
  if (value === 'WARN' || value === '4XX') return 'warn';
  return 'info';
}

function getHourFromTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'string' || timestamp.length < 13) return '';
  return timestamp.substring(11, 13);
}

function createAdvancedRuleRow(rule = {}) {
  const row = document.createElement('div');
  row.className = 'advanced-search-row';
  row.innerHTML = `
    <select class="advanced-field">
      <option value="message">Message</option>
      <option value="logger">Logger</option>
      <option value="thread">Thread / Pod</option>
      <option value="package">Package</option>
      <option value="exception">Exception</option>
      <option value="category">Category</option>
      <option value="method">Method</option>
      <option value="status">Status</option>
      <option value="cache">Cache</option>
      <option value="country">Country</option>
      <option value="pop">POP</option>
      <option value="host">Host</option>
      <option value="responseTime">Response Time</option>
      <option value="ttfb">TTFB</option>
      <option value="ttlb">TTLB</option>
      <option value="severity">Severity</option>
      <option value="sourceFile">Source File</option>
    </select>
    <select class="advanced-operator">
      <option value="contains">contains</option>
      <option value="equals">equals</option>
      <option value="startswith">starts with</option>
      <option value="endswith">ends with</option>
      <option value="regex">regex</option>
      <option value="gt">&gt;</option>
      <option value="gte">&ge;</option>
      <option value="lt">&lt;</option>
      <option value="lte">&le;</option>
      <option value="in">in</option>
    </select>
    <input type="text" class="advanced-value" placeholder="Value">
    <button type="button" class="btn-clear remove-rule-btn">×</button>
  `;

  const field = row.querySelector('.advanced-field');
  const operator = row.querySelector('.advanced-operator');
  const value = row.querySelector('.advanced-value');

  field.value = rule.field || 'message';
  operator.value = rule.operator || 'contains';
  value.value = rule.value || '';

  row.querySelector('.remove-rule-btn').addEventListener('click', () => {
    row.remove();
  });

  row.addEventListener('change', syncAdvancedRulesFromUI);
  row.addEventListener('input', syncAdvancedRulesFromUI);

  return row;
}

function syncAdvancedRulesFromUI() {
  advancedRulesState = Array.from(advancedSearchRules.querySelectorAll('.advanced-search-row')).map(row => ({
    field: row.querySelector('.advanced-field')?.value || 'message',
    operator: row.querySelector('.advanced-operator')?.value || 'contains',
    value: row.querySelector('.advanced-value')?.value || ''
  })).filter(rule => String(rule.value || '').trim());
}

function renderAdvancedRuleBuilder() {
  if (!advancedSearchRules) return;
  if (!advancedSearchRules.children.length) {
    advancedSearchRules.appendChild(createAdvancedRuleRow({ field: 'message', operator: 'contains', value: '' }));
  }
}

function parseBatchInput(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeLocalPathInputValue(value) {
  return parseBatchInput(value).join(',');
}

function persistLocalPathInput(value = filePathInput?.value || '') {
  const normalized = normalizeLocalPathInputValue(value);
  if (filePathInput && filePathInput.value !== normalized) {
    filePathInput.value = normalized;
  }

  if (normalized) {
    localStorage.setItem('aem_lastPath', normalized);
  } else {
    localStorage.removeItem('aem_lastPath');
  }

  persistWorkspaceState();
  return normalized;
}

/* ============================================================
   Toast
   ============================================================ */

function showToast(message, type = 'error') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showError(message) {
  showToast(message, 'error');
}

function hideError() {
  // Toasts auto-dismiss
}

/* ============================================================
   Presets
   ============================================================ */

function safeJsonParse(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getActiveErrorLevel() {
  return document.querySelector('.level-chip.active')?.dataset.level || 'ALL';
}

function setActiveErrorLevel(level = 'ALL') {
  document.querySelectorAll('.level-chip').forEach(c => {
    if (c.id !== 'chartsToggleBtn') c.classList.remove('active');
  });
  const chip = document.querySelector(`.level-chip[data-level="${level}"]`) || document.querySelector('.level-chip[data-level="ALL"]');
  if (chip) chip.classList.add('active');
  rawEventsLevel = chip?.dataset.level || 'ALL';
  filters.level = rawEventsLevel;
}

function clearDropdownSearchInputs() {
  loggerFilter.value = '';
  threadFilter.value = '';
  packageFilter.value = '';
  exceptionFilter.value = '';
  renderSelectionHints();
}

function selectMultiValues(allowedValues, selectedArray, values = []) {
  const allowed = new Set(allowedValues || []);
  selectedArray.splice(0, selectedArray.length);
  (values || []).forEach((value) => {
    if (allowed.has(value) && !selectedArray.includes(value)) {
      selectedArray.push(value);
    }
  });
}

function getCurrentErrorPresetState() {
  return {
    selectedLoggers: [...filters.loggers],
    selectedPackages: [...filters.packages],
    thread: threadSelect?.value || '',
    exception: exceptionSelect?.value || '',
    category: categoryFilter.value || '',
    startDate: normalizeDateTimeForApi(startDate.value),
    endDate: normalizeDateTimeForApi(endDate.value),
    level: getActiveErrorLevel()
  };
}

function applyLegacyPresetSelections(preset) {
  if (preset.package) {
    const matchingPackage = Object.prototype.hasOwnProperty.call(allPackages, preset.package);
    if (matchingPackage) filters.packages.push(preset.package);
    else packageFilter.value = preset.package;
  }

  if (preset.logger) {
    const matchingLogger = Object.prototype.hasOwnProperty.call(allLoggers, preset.logger);
    if (matchingLogger) filters.loggers.push(preset.logger);
    else loggerFilter.value = preset.logger;
  }

  if (preset.thread) {
    const matchingThread = Array.from(threadSelect?.options || []).find(opt => opt.value === preset.thread);
    if (matchingThread) threadSelect.value = matchingThread.value;
    threadFilter.value = preset.thread;
  }

  if (preset.exception) {
    const matchingException = Array.from(exceptionSelect?.options || []).find(opt => opt.value === preset.exception);
    if (matchingException) exceptionSelect.value = matchingException.value;
    exceptionFilter.value = preset.exception;
  }
}

function applyCurrentSelectionsToFilterUI() {
  renderPackageTags();
  filterAndPopulateLoggers();
  refreshPackageScopedDropdowns();
  renderLoggerTags();
  renderSelectionHints();
}

function resetErrorFilterState(options = {}) {
  const { preserveDates = false } = options;
  replaceArrayContents(filters.packages);
  replaceArrayContents(filters.loggers);
  filters.level = 'ALL';
  filters.search = '';
  filters.regex = false;
  clearDropdownSearchInputs();
  if (threadSelect) threadSelect.value = '';
  if (exceptionSelect) exceptionSelect.value = '';
  categoryFilter.value = '';
  if (!preserveDates) {
    startDate.value = '';
    endDate.value = '';
  }
  setActiveErrorLevel('ALL');
  updateLevelChips('ALL');
}

function applyErrorPresetState(preset = {}) {
  replaceArrayContents(filters.packages);
  replaceArrayContents(filters.loggers);
  filters.level = 'ALL';
  clearDropdownSearchInputs();

  selectMultiValues(Object.keys(allPackages), filters.packages, preset.filters.packages);
  applyCurrentSelectionsToFilterUI();

  if (preset.filters.loggers?.length) {
    selectMultiValues(Object.keys(allLoggers), filters.loggers, preset.filters.loggers);
    renderLoggerTags();
  } else {
    applyLegacyPresetSelections(preset);
    applyCurrentSelectionsToFilterUI();
  }

  if (threadSelect) {
    threadSelect.value = '';
    if (preset.thread) {
      const threadOption = Array.from(threadSelect.options).find(opt => opt.value === preset.thread);
      if (threadOption) {
        threadSelect.value = threadOption.value;
        threadFilter.value = threadOption.value;
      }
    }
  }

  if (exceptionSelect) {
    exceptionSelect.value = '';
    if (preset.exception) {
      const exceptionOption = Array.from(exceptionSelect.options).find(opt => opt.value === preset.exception);
      if (exceptionOption) {
        exceptionSelect.value = exceptionOption.value;
        exceptionFilter.value = exceptionOption.value;
      }
    }
  }

  categoryFilter.value = preset.category || '';
  startDate.value = formatDateTimeForDisplay(preset.startDate || '');
  endDate.value = formatDateTimeForDisplay(preset.endDate || '');
  setActiveErrorLevel(preset.level || 'ALL');
}

function loadPresets() {
  const presets = safeJsonParse(localStorage.getItem('filterPresets'));
  presetSelect.innerHTML = '<option value="">Load Preset...</option>';
  Object.keys(presets).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    presetSelect.appendChild(opt);
  });
}
loadPresets();

presetSelect.addEventListener('change', () => {
  const presets = safeJsonParse(localStorage.getItem('filterPresets'));
  const preset = presets[presetSelect.value];
  if (preset) {
    applyErrorPresetState(preset);
    
    document.getElementById('methodFilter').value = preset.method || '';
    document.getElementById('statusFilter').value = preset.httpStatus || '';
    document.getElementById('podFilter').value = preset.pod || '';
    document.getElementById('minResponseTime').value = preset.minResponseTime || '';
    document.getElementById('maxResponseTime').value = preset.maxResponseTime || '';
    document.getElementById('cdnMethodFilter').value = preset.cdnMethod || '';
    document.getElementById('cdnStatusFilter').value = preset.cdnStatus || '';
    document.getElementById('cacheStatusFilter').value = preset.cacheStatus || '';
    document.getElementById('countryFilter').value = preset.country || '';
    document.getElementById('popFilter').value = preset.pop || '';
    document.getElementById('hostFilter').value = preset.host || '';
    document.getElementById('minTtfb').value = preset.minTtfb || '';
    document.getElementById('maxTtfb').value = preset.maxTtfb || '';

    scheduleErrorFilterRefresh();
    applyRawEventFilters();
    showToast(`Preset "${presetSelect.value}" loaded`, 'success');
  }
});

savePresetBtn.addEventListener('click', () => {
  const name = prompt('Enter preset name:');
  if (!name) return;
  const presets = safeJsonParse(localStorage.getItem('filterPresets'));
  const errorPresetState = getCurrentErrorPresetState();
  presets[name] = {
    ...errorPresetState,
    method: document.getElementById('methodFilter')?.value || '',
    httpStatus: document.getElementById('statusFilter')?.value || '',
    pod: document.getElementById('podFilter')?.value || '',
    minResponseTime: document.getElementById('minResponseTime')?.value || '',
    maxResponseTime: document.getElementById('maxResponseTime')?.value || '',
    cdnMethod: document.getElementById('cdnMethodFilter')?.value || '',
    cdnStatus: document.getElementById('cdnStatusFilter')?.value || '',
    cacheStatus: document.getElementById('cacheStatusFilter')?.value || '',
    country: document.getElementById('countryFilter')?.value || '',
    pop: document.getElementById('popFilter')?.value || '',
    host: document.getElementById('hostFilter')?.value || '',
    minTtfb: document.getElementById('minTtfb')?.value || '',
    maxTtfb: document.getElementById('maxTtfb')?.value || ''
  };
  localStorage.setItem('filterPresets', JSON.stringify(presets));
  loadPresets();
  showToast(`Preset "${name}" saved`, 'success');
});

/* ============================================================
   Analyze
   ============================================================ */

analyzeBtn.addEventListener('click', async () => {
  const filePath = persistLocalPathInput(filePathInput.value).trim();
  const multiPaths = parseBatchInput(filePath);

  if (multiPaths.length > 1) {
    await analyzeBatchInput(multiPaths);
    return;
  }

  if (filePath) {
    await analyzeFilePath(filePath);
  } else {
    showToast('Please enter a file path', 'warning');
    return;
  }
});

async function downloadSelectedCloudManagerLogs(options = {}) {
  const { openPopover = false } = options;
  const programId = cmProgramSelect?.value || '';
  const environmentId = cmEnvironmentSelect?.value || '';
  const outputDirectory = cmOutputDirectoryInput?.value.trim() || '';
  const days = cmDaysInput?.value.trim() || '1';

  if (!programId || !environmentId || !selectedCloudManagerLogs.length) {
    showToast('Select a program, environment, and at least one log option', 'warning');
    return;
  }

  if (!outputDirectory || !(await validateCloudManagerOutputDirectory())) {
    showToast('Cloud Manager download folder is not ready yet', 'warning');
    return;
  }

  await analyzeCloudManagerSelection({
    programId,
    environmentId,
    selections: [...selectedCloudManagerLogs],
    days,
    outputDirectory,
    openPopover
  });
}

if (cmAnalyzeBtn) {
  cmAnalyzeBtn.addEventListener('click', async () => {
    await downloadSelectedCloudManagerLogs();
  });
}

filePathInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  analyzeBtn.click();
});

async function analyzeBatchInput(input) {
  analyzeBtn.textContent = 'Analyzing...';
  analyzeBtn.disabled = true;
  progressText.classList.remove('hidden');
  progressText.textContent = 'Analyzing log files...';
  document.getElementById('emptyState').classList.add('hidden');

  try {
    const response = await fetch('/api/analyze/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, filters: { advancedRules: advancedRulesState } })
    });
    const data = await response.json();

    if (!data.success) {
      showError(data.error || 'Batch analysis failed');
      return;
    }

    await handleBatchAnalysisComplete(data, input);
  } catch (error) {
    showError('Batch analysis failed: ' + error.message);
  } finally {
    analyzeBtn.textContent = 'Analyze';
    analyzeBtn.disabled = false;
    progressText.classList.add('hidden');
  }
}

async function analyzeFilePath(filePath) {
  resetCloudManagerSummary();
  if (currentSourceMode === 'local') {
    currentCloudManagerRunContext = null;
    renderCloudManagerResultBadges();
  }
  analyzeBtn.textContent = 'Analyzing...';
  analyzeBtn.disabled = true;
  progressText.classList.remove('hidden');
  progressText.textContent = 'Connecting...';
  document.getElementById('emptyState').classList.add('hidden');

  // Use WebSocket for real-time progress
  const ws = new WebSocket(`ws://${location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ action: 'analyze', filePath }));
  };

  ws.onmessage = async (e) => {
    const data = JSON.parse(e.data);

    if (data.type === 'progress') {
      const lines = data.totalLines ? data.totalLines.toLocaleString() : '0';
      progressText.textContent = `Analyzing... ${data.percent || 0}% (${lines} lines)`;
    }

    if (data.type === 'complete') {
      await handleAnalysisComplete(data, { analyzedFile: filePath, source: 'local' });
      analyzeBtn.textContent = 'Analyze';
      analyzeBtn.disabled = false;
      progressText.classList.add('hidden');
      ws.close();
    }

    if (data.type === 'error') {
      ws.close();
      showError(data.error);
      analyzeBtn.textContent = 'Analyze';
      analyzeBtn.disabled = false;
      progressText.classList.add('hidden');
    }
  };

  ws.onerror = () => {
    showError('WebSocket connection failed');
    analyzeBtn.textContent = 'Analyze';
    analyzeBtn.disabled = false;
    progressText.classList.add('hidden');
  };

  ws.onclose = () => {
    // If we haven't received complete or error, connection was lost
    if (analyzeBtn.disabled && analyzeBtn.textContent === 'Analyzing...') {
      showError('Connection lost during analysis');
      analyzeBtn.textContent = 'Analyze';
      analyzeBtn.disabled = false;
      progressText.classList.add('hidden');
    }
  };

}

async function analyzeCloudManagerSelection(options) {
  let finishedSuccessfully = false;

  console.log('[AEM] Starting Cloud Manager download with options:', options);

  setCloudManagerDownloadStatus('Downloading log files from Cloud Manager...', { pending: true });
  setCloudManagerStatus('Downloading log files from Cloud Manager...');
  document.getElementById('emptyState').classList.add('hidden');
  resetCloudManagerSummary();

  if (cmAnalyzeBtn) {
    cmAnalyzeBtn.disabled = true;
    cmAnalyzeBtn.textContent = 'Downloading...';
  }

  showCloudManagerDownloadProgress(options.selections || []);

  try {
    console.log('[AEM] Sending fetch request to /api/cloudmanager/download');
    const response = await fetch('/api/cloudmanager/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    console.log('[AEM] Response received, status:', response.status);
    const data = await response.json();
    console.log('[AEM] Response data:', data);

    if (!data.success) {
      setCloudManagerStatus('');
      hideCloudManagerDownloadProgress();
      showError(data.error || 'Cloud Manager download failed');
      return;
    }

    setCloudManagerDownloadStatus('Downloads updated.');
    setCloudManagerStatus('Downloads updated. You can analyze the downloaded files from the Cloud Manager picker.');
    const labels = buildCloudManagerSelectionLabels();
    const environmentMeta = getCloudManagerEnvironmentMeta(options.environmentId);
    currentCloudManagerRunContext = {
      source: 'cloudmanager',
      runId: `cm-${Date.now()}`,
      programId: options.programId,
      environmentId: options.environmentId,
      programName: labels.programName,
      environmentName: labels.environmentName,
      environmentType: environmentMeta?.type || '',
      selections: options.selections || [],
      days: options.days,
      outputDirectory: data.environmentDirectory || data.outputDirectory,
      commandPreview: data.commandPreview,
      fileDates: data.fileDates || [],
      downloadedFiles: data.downloadedFiles || [],
      downloadedFilesDetailed: data.downloadedFilesDetailed || [],
      downloads: data.downloads || []
    };
    renderCloudManagerSummary(data);
    pushCloudManagerHistoryEntry({
      timestamp: new Date().toISOString(),
      ...currentCloudManagerRunContext,
      downloadedFiles: data.downloadedFiles || [],
      downloadedFilesDetailed: data.downloadedFilesDetailed || [],
      downloads: data.downloads || []
    });
    await loadCloudManagerCacheBrowser(options.programId, options.environmentId, { silent: true });
    if (currentSourceMode !== 'local') {
      setSourceMode('local');
    } else {
      renderLocalDownloadsList();
    }
    if (options.openPopover) {
      setLocalDownloadsPopoverOpen(true);
    }
    finishedSuccessfully = true;
    hideCloudManagerDownloadProgress();
    showToast('Downloads updated. Open Cloud Manager Logs to analyze the new files.', 'success');
    persistCloudManagerSelectionState();
  } catch (error) {
    console.error('[AEM] Catch block error:', error);
    setCloudManagerDownloadStatus('');
    setCloudManagerStatus('');
    hideCloudManagerDownloadProgress();
    showError('Cloud Manager download failed: ' + error.message);
  } finally {
    if (cmAnalyzeBtn) {
      cmAnalyzeBtn.disabled = false;
      cmAnalyzeBtn.textContent = 'Download Selected Logs';
    }
    if (!finishedSuccessfully) {
      setCloudManagerDownloadStatus('');
    }
  }
}

async function handleCloudManagerDownloadComplete(data, options) {
  if (!data.success) {
    setCloudManagerStatus('');
    showError(data.error || 'Cloud Manager download failed');
    return;
  }

  setCloudManagerDownloadStatus('Downloads updated.');
  setCloudManagerStatus('Downloads updated. You can analyze the downloaded files from the Cloud Manager picker.');
  const labels = buildCloudManagerSelectionLabels();
  const environmentMeta = getCloudManagerEnvironmentMeta(options.environmentId);
  currentCloudManagerRunContext = {
    source: 'cloudmanager',
    runId: `cm-${Date.now()}`,
    programId: options.programId,
    environmentId: options.environmentId,
    programName: labels.programName,
    environmentName: labels.environmentName,
    environmentType: environmentMeta?.type || '',
    selections: options.selections || [],
    days: options.days,
    outputDirectory: data.environmentDirectory || data.outputDirectory,
    commandPreview: data.commandPreview,
    fileDates: data.fileDates || [],
    downloadedFiles: data.downloadedFiles || [],
    downloadedFilesDetailed: data.downloadedFilesDetailed || [],
    downloads: data.downloads || []
  };
  renderCloudManagerSummary(data);
  pushCloudManagerHistoryEntry({
    timestamp: new Date().toISOString(),
    ...currentCloudManagerRunContext,
    downloadedFiles: data.downloadedFiles || [],
    downloadedFilesDetailed: data.downloadedFilesDetailed || [],
    downloads: data.downloads || []
  });
  await loadCloudManagerCacheBrowser(options.programId, options.environmentId, { silent: true });
  if (currentSourceMode !== 'local') {
    setSourceMode('local');
  } else {
    renderLocalDownloadsList();
  }
  if (options.openPopover) {
    setLocalDownloadsPopoverOpen(true);
  }
  hideCloudManagerDownloadProgress();
  showToast('Downloads updated. Open Cloud Manager Logs to analyze the new files.', 'success');
  persistCloudManagerSelectionState();
}

function showCloudManagerDownloadProgress(selections) {
  if (!cmDownloadProgressPanel) return;

  const items = selections.map((entry, index) => `
    <div class="cm-download-progress-item" data-index="${index}">
      <span class="cm-download-progress-icon pending">&#9711;</span>
      <span class="cm-download-progress-item-name">${escapeHtml(entry.logName || 'Unknown')}</span>
      <span class="cm-download-progress-item-status">Pending</span>
    </div>
  `).join('');

  if (cmDownloadProgressList) {
    cmDownloadProgressList.innerHTML = items;
  }

  if (cmDownloadProgressCount) {
    cmDownloadProgressCount.textContent = `0/${selections.length} files`;
  }

  if (cmDownloadProgressTitle) {
    cmDownloadProgressTitle.textContent = 'Downloading logs from Cloud Manager...';
  }

  if (cmDownloadProgressStatus) {
    cmDownloadProgressStatus.textContent = 'Starting...';
  }

  cmDownloadProgressPanel.classList.remove('hidden');
  if (cmDownloadSummary) cmDownloadSummary.classList.add('hidden');
}

function updateCloudManagerDownloadProgress(progress) {
  if (!cmDownloadProgressPanel) return;

  const { currentIndex, totalFiles, currentFile, message, status } = progress;

  if (cmDownloadProgressCount) {
    cmDownloadProgressCount.textContent = `${currentIndex}/${totalFiles} files`;
  }

  if (cmDownloadProgressStatus) {
    cmDownloadProgressStatus.textContent = message;
  }

  const items = cmDownloadProgressList?.querySelectorAll('.cm-download-progress-item');
  items?.forEach((item, index) => {
    const icon = item.querySelector('.cm-download-progress-icon');
    const statusEl = item.querySelector('.cm-download-progress-item-status');

    if (index < currentIndex - 1) {
      item.classList.add('completed');
      item.classList.remove('downloading');
      if (icon) {
        icon.className = 'cm-download-progress-icon completed';
        icon.innerHTML = '&#10003;';
      }
      if (statusEl) statusEl.textContent = 'Completed';
    } else if (index === currentIndex - 1) {
      item.classList.add('downloading');
      item.classList.remove('completed');
      if (icon) {
        icon.className = 'cm-download-progress-icon downloading';
        icon.innerHTML = '&#8635;';
      }
      if (statusEl) statusEl.textContent = 'Downloading...';
    } else {
      item.classList.remove('completed', 'downloading');
      if (icon) {
        icon.className = 'cm-download-progress-icon pending';
        icon.innerHTML = '&#9711;';
      }
      if (statusEl) statusEl.textContent = 'Pending';
    }
  });
}

function hideCloudManagerDownloadProgress() {
  if (cmDownloadProgressPanel) {
    cmDownloadProgressPanel.classList.add('hidden');
  }
  if (cmDownloadSummary) {
    cmDownloadSummary.classList.remove('hidden');
  }
}

async function handleAnalysisComplete(data, context = {}) {
  currentAnalysisMode = 'single';
  currentBatchInput = null;
  currentBatchSummary = null;
  currentBatchLogType = '';
  currentAnalysisSummary = data.summary || null;
  setCurrentAnalyzedFilePath(context.analyzedFile || data.analyzedFile || '');
  chartsToggleBtn.disabled = false;

  // Store the log type
  currentLogType = data.logType || 'error';

  if (currentLogType === 'error') {
    resetErrorFilterState({ preserveDates: true });
  }

  if (context.source === 'cloudmanager' || currentCloudManagerRunContext) {
    renderCloudManagerResultBadges(data, currentCloudManagerRunContext || context);
  }

  // Constrain date range inputs to actual log file dates
  if (data.timeline) setDateRangeBounds(data.timeline, currentLogType);
  
  // Show/hide filter panels based on log type
  const filterPanel = document.getElementById(currentLogType + 'Filters');
  document.querySelectorAll('.log-filter-panel').forEach(p => p.classList.add('hidden'));
  if (filterPanel) filterPanel.classList.remove('hidden');
  
  exportCsvBtn.disabled = true;
  exportJsonBtn.disabled = true;
  exportPdfBtn.disabled = true;
  document.getElementById('exportAllBtn').disabled = true;
  if (exportRow) {
    exportRow.classList.add('export-row-hidden');
    exportRow.setAttribute('aria-hidden', 'true');
  }

  // Update level counts for error logs
  if (data.levelCounts) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `(${val || 0})`; };
    const lc = data.levelCounts;
    set('countALL', (lc.ERROR || 0) + (lc.WARN || 0) + (lc.INFO || 0) + (lc.DEBUG || 0));
    set('countERROR', lc.ERROR);
    set('countWARN', lc.WARN);
    set('countINFO', lc.INFO);
    set('countDEBUG', lc.DEBUG);
  }

  // Populate filters based on log type
  if (currentLogType === 'error') {
    // Error log filters
    const categories = data.results ? [...new Set(data.results.map(r => r.category || 'Other'))].sort() : [];
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
      categories.forEach(c => {
        categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
      });
    }

    if (data.loggers || data.threads || data.packages || data.exceptions || data.pods) {
      populateFilterDropdowns(
        data.loggers,
        data.threads,
        data.packages,
        data.exceptions,
        data.packageThreads || {},
        data.packageExceptions || {},
        categories,
        data.pods || {}
      );
    }
  } else if (currentLogType === 'request') {
    // Request log filters
    const filterOptions = data.filterOptions || {};
    populateSelect('methodFilter', filterOptions.methods || [], 'All Methods');
    populateSelect('statusFilter', filterOptions.statuses || [], 'All Status Codes');
    populateSelect('podFilter', filterOptions.pods || [], 'All Pods');
  } else if (currentLogType === 'cdn') {
    // CDN log filters
    const filterOptions = data.filterOptions || {};
    populateSelect('cdnMethodFilter', filterOptions.methods || [], 'All Methods');
    populateSelect('cdnStatusFilter', filterOptions.statuses || [], 'All Status Codes');
    populateSelect('cacheStatusFilter', filterOptions.cacheStatuses || [], 'All Cache Status');
    populateSelect('countryFilter', filterOptions.countries || [], 'All Countries');
    populateSelect('popFilter', filterOptions.pops || [], 'All POPs');
    populateSelect('hostFilter', filterOptions.hosts || [], 'All Hosts');
  }

  setResultView('events', { persist: false });
  updateWorkspaceChrome();
  updateWorkspaceSummary();
  persistWorkspaceState();
  await fetchRawEvents(1);
}

async function handleBatchAnalysisComplete(data, input) {
  currentAnalysisMode = 'batch';
  currentBatchLogType = data.batchLogType || 'error';
  currentLogType = currentBatchLogType === 'mixed' ? 'error' : currentBatchLogType;
  currentAnalysisSummary = data.summary || null;
  setCurrentAnalyzedFilePath('');
  currentBatchInput = input;
  currentBatchSummary = data.summary || null;
  currentCorrelation = data.correlation || null;
  chartsToggleBtn.disabled = currentBatchLogType === 'mixed';
  exportCsvBtn.disabled = true;
  exportJsonBtn.disabled = true;
  exportPdfBtn.disabled = true;
  document.getElementById('exportAllBtn').disabled = true;
  if (exportRow) {
    exportRow.classList.add('export-row-hidden');
    exportRow.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.log-filter-panel').forEach(p => p.classList.add('hidden'));
  const filterPanel = document.getElementById(
    currentBatchLogType === 'request'
      ? 'requestFilters'
      : currentBatchLogType === 'cdn'
        ? 'cdnFilters'
        : currentBatchLogType === 'mixed'
          ? 'mixedFilters'
          : 'errorFilters'
  );
  if (filterPanel) filterPanel.classList.remove('hidden');

  if (currentBatchLogType === 'error') {
    applyErrorFilterSidebarResponse(data);
  } else if (currentBatchLogType === 'request') {
    const filterOptions = data.filterOptions || {};
    populateSelect('methodFilter', filterOptions.methods || [], 'All Methods');
    populateSelect('statusFilter', filterOptions.statuses || [], 'All Status Codes');
    populateSelect('podFilter', filterOptions.pods || [], 'All Pods');
  } else if (currentBatchLogType === 'cdn') {
    const filterOptions = data.filterOptions || {};
    populateSelect('cdnMethodFilter', filterOptions.methods || [], 'All Methods');
    populateSelect('cdnStatusFilter', filterOptions.statuses || [], 'All Status Codes');
    populateSelect('cacheStatusFilter', filterOptions.cacheStatuses || [], 'All Cache Status');
    populateSelect('countryFilter', filterOptions.countries || [], 'All Countries');
    populateSelect('popFilter', filterOptions.pops || [], 'All POPs');
    populateSelect('hostFilter', filterOptions.hosts || [], 'All Hosts');
  } else if (currentBatchLogType === 'mixed') {
    setupMixedFilterTabs();
    const filterOptions = data.filterOptions || {};
    const requestOpts = filterOptions.request || {};
    const cdnOpts = filterOptions.cdn || {};
    populateSelect('mixedMethodFilter', requestOpts.methods || [], 'All Methods');
    populateSelect('mixedStatusFilter', requestOpts.statuses || [], 'All Status Codes');
    populateSelect('mixedPodFilter', requestOpts.pods || [], 'All Pods');
    populateSelect('mixedCdnMethodFilter', cdnOpts.methods || [], 'All Methods');
    populateSelect('mixedCdnStatusFilter', cdnOpts.statuses || [], 'All Status Codes');
    populateSelect('mixedCacheStatusFilter', cdnOpts.cacheStatuses || [], 'All Cache Status');
    populateSelect('mixedCountryFilter', cdnOpts.countries || [], 'All Countries');
    populateSelect('mixedPopFilter', cdnOpts.pops || [], 'All POPs');
    populateSelect('mixedHostFilter', cdnOpts.hosts || [], 'All Hosts');
  }

  if (data.levelCounts && (currentBatchLogType === 'error' || currentBatchLogType === 'mixed')) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `(${val || 0})`; };
    const lc = data.levelCounts;
    set('countALL', lc.ALL || 0);
    set('countERROR', lc.ERROR);
    set('countWARN', lc.WARN);
    set('countINFO', lc.INFO);
    set('countDEBUG', lc.DEBUG);
  }
  chartsTab.classList.toggle('hidden', currentBatchLogType === 'mixed');
  setResultView('events', { persist: false });
  updateWorkspaceChrome();
  updateWorkspaceSummary();
  persistWorkspaceState();
  await fetchRawEvents(1);
  updateIncidentIndicator();
}

function setupMixedFilterTabs() {
  const tabs = document.querySelectorAll('.mixed-filter-tab');
  const sections = document.querySelectorAll('.mixed-filter-section');
  tabs.forEach(tab => {
    if (tab.dataset.tabInitialized) return;
    tab.dataset.tabInitialized = 'true';
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.add('hidden'));
      tab.classList.add('active');
      const targetSection = document.getElementById(tab.dataset.tab);
      if (targetSection) targetSection.classList.remove('hidden');
    });
  });
  if (tabs.length > 0) {
    tabs[0].click();
  }
}

function populateSelect(selectId, options, defaultLabel) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="">${defaultLabel}</option>`;
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

/* ============================================================
   Charts
   ============================================================ */

const chartsToggleBtn = document.getElementById('chartsToggleBtn');
const chartsTab = document.getElementById('chartsTab');
let chartsVisible = false;

chartsToggleBtn.addEventListener('click', () => {
  setResultView('charts');
  chartsToggleBtn.classList.add('active');
});

async function fetchChartsData() {
  const isBatch = currentAnalysisMode === 'batch' && currentBatchInput;
  const filePath = getActiveAnalysisFilePath();
  if (!isBatch && !filePath) return;
  if (isBatch && currentBatchLogType !== 'error') return;

  const body = isBatch
    ? { input: currentBatchInput, filters: getCurrentErrorFilterPayload() }
    : { filePath, filters: getCurrentLogFilterPayload() };

  try {
    const response = await fetch(isBatch ? '/api/filter/batch' : '/api/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.success) {
      renderCharts(data.timeline, data.loggerDist, data.hourlyHeatmap || [], data.threadDist || {});
      if (data.filterError) {
        showError('Filter warning: ' + data.filterError);
      }
    } else if (data.error) {
      showError(data.error);
    }
  } catch (e) {
    showToast('Failed to load charts: ' + e.message, 'error');
  }
}

function renderCharts(timeline, loggerDist, hourlyHeatmap, threadDist) {
  setDateRangeBounds(timeline, currentLogType);
  const palette = getThemeTokens();
  const chartBaseOptions = {
    responsive: true,
    color: palette.textSecondary,
    font: { family: "'Inter', sans-serif" },
    plugins: {
      legend: {
        labels: {
          color: palette.textSecondary,
          font: { family: "'Inter', sans-serif", size: 11, weight: 500 }
        }
      },
      title: {
        color: palette.textPrimary,
        font: { family: "'Inter', sans-serif", size: 14, weight: 600 }
      }
    },
    scales: {
      x: {
        ticks: { color: palette.textSecondary, font: { family: "'Inter', sans-serif", size: 10 } },
        grid: { color: palette.borderTertiary, drawBorder: false }
      },
      y: {
        ticks: { color: palette.textSecondary, font: { family: "'Inter', sans-serif", size: 10 } },
        grid: { color: palette.borderTertiary, drawBorder: false }
      }
    }
  };
  const ctx1 = document.getElementById('timelineChart').getContext('2d');
  const dates = Object.keys(timeline).sort();
  const errors = dates.map(d => timeline[d].ERROR || 0);
  const warnings = dates.map(d => timeline[d].WARN || 0);

  if (timelineChart) timelineChart.destroy();
  timelineChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        { label: 'Errors', data: errors, borderColor: palette.error, backgroundColor: palette.error.replace('rgb', 'rgba').replace(')', ', 0.1)'), fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5 },
        { label: 'Warnings', data: warnings, borderColor: palette.warning, backgroundColor: palette.warning.replace('rgb', 'rgba').replace(')', ', 0.1)'), fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5 }
      ]
    },
    options: {
      ...chartBaseOptions,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const dateLabel = dates[elements[0].index];
          const [dd, mm, yyyy] = dateLabel.split('.');
          startDate.value = formatDateTimeForDisplay(`${yyyy}-${mm}-${dd} 00:00`);
          endDate.value = formatDateTimeForDisplay(`${yyyy}-${mm}-${dd} 23:59`);
          applyRawEventFilters();
          showToast(`Filtered to ${dateLabel}`, 'info');
        }
      },
      scales: chartBaseOptions.scales,
      plugins: {
        ...chartBaseOptions.plugins,
        title: { ...chartBaseOptions.plugins.title, display: true, text: 'Errors & Warnings Over Time (click to drill down)' }
      },
    }
  });

  const ctx2 = document.getElementById('loggerChart').getContext('2d');
  const sortedLoggers = Object.entries(loggerDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (loggerChart) loggerChart.destroy();
  loggerChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: sortedLoggers.map(([k]) => k.substring(0, 30)),
      datasets: [{
        data: sortedLoggers.map(([, v]) => v),
        backgroundColor: [
          '#EF4444', '#F59E0B', palette.primary, '#10B981', '#8B5CF6',
          '#06B6D4', '#F97316', '#64748B', '#14B8A6', '#E11D48'
        ]
      }]
    },
    options: {
      responsive: true,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const loggerName = sortedLoggers[elements[0].index][0];
          selectMultiValues(Object.keys(allLoggers), filters.loggers, [loggerName]);
          renderLoggerTags();
          renderLoggerPicker();
          scheduleErrorFilterRefresh();
          applyRawEventFilters();
          showToast(`Filtered to logger: ${loggerName.substring(0, 40)}`, 'info');
        }
      },
      plugins: {
        ...chartBaseOptions.plugins,
        title: { ...chartBaseOptions.plugins.title, display: true, text: 'Top 10 Loggers (click to drill down)' }
      },
      scales: chartBaseOptions.scales
    }
  });

  const ctx3 = document.getElementById('threadChart').getContext('2d');
  const sortedThreads = Object.entries(threadDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (threadChart) threadChart.destroy();
  threadChart = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: sortedThreads.map(([k]) => k.substring(0, 25)),
      datasets: [{
        label: 'Count',
        data: sortedThreads.map(([, v]) => v),
        backgroundColor: palette.primary
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      scales: {
        x: { ticks: { color: palette.textSecondary }, grid: { color: palette.borderTertiary } },
        y: { ticks: { color: palette.textSecondary }, grid: { color: palette.borderTertiary } }
      },
      plugins: {
        ...chartBaseOptions.plugins,
        title: { ...chartBaseOptions.plugins.title, display: true, text: 'Top 10 Threads' }
      }
    }
  });

  const ctx4 = document.getElementById('heatmapChart').getContext('2d');
  const hourBuckets = {};
  const heatmapEntries = Array.isArray(hourlyHeatmap)
    ? hourlyHeatmap
    : hourlyHeatmap && typeof hourlyHeatmap === 'object' && hourlyHeatmap.heatmap
      ? Object.entries(hourlyHeatmap.heatmap).flatMap(([hour, days]) => {
        const total = Object.values(days || {}).reduce((sum, count) => sum + count, 0);
        return [{ hour: Number(hour), count: total }];
      })
      : [];

  if (heatmapEntries.length) {
    heatmapEntries.forEach(h => {
      if (!hourBuckets[h.hour]) hourBuckets[h.hour] = 0;
      hourBuckets[h.hour] += h.count;
    });
  }
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourData = hourLabels.map((_, i) => hourBuckets[i] || 0);

  if (heatmapChart) heatmapChart.destroy();
  heatmapChart = new Chart(ctx4, {
    type: 'bar',
    data: {
      labels: hourLabels,
      datasets: [{
        label: 'Events',
        data: hourData,
        backgroundColor: hourData.map(v => v > 0 ? `rgba(20,184,166,${Math.min(0.9, 0.18 + (v / Math.max(...hourData, 1)) * 0.72)})` : palette.backgroundTertiary)
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: palette.textSecondary }, grid: { color: palette.borderTertiary } },
        y: { ticks: { color: palette.textSecondary }, grid: { color: palette.borderTertiary } }
      },
      plugins: {
        ...chartBaseOptions.plugins,
        title: { ...chartBaseOptions.plugins.title, display: true, text: 'Events by Hour of Day' }
      }
    }
  });
}

/* ============================================================
   Filter Dropdowns
   ============================================================ */

function getScopedCountsByPackage(scopeMap, fallbackCounts = {}) {
  const result = {};
  if (!scopeMap || typeof scopeMap !== 'object') return result;

  const packageNames = Object.keys(scopeMap);
  if (!packageNames.length) {
    return { ...(fallbackCounts || {}) };
  }

  const activePackages = filters.packages.length > 0
    ? filters.packages
    : packageNames;

  activePackages.forEach((pkgName) => {
    const scoped = scopeMap[pkgName];
    if (!scoped || typeof scoped !== 'object') return;
    Object.entries(scoped).forEach(([name, count]) => {
      result[name] = (result[name] || 0) + count;
    });
  });

  return result;
}

function populateSingleSelectOptions(select, searchInput, counts, placeholder) {
  if (!select) return;

  const currentValue = select.value || '';
  const entries = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]);
  select.innerHTML = `<option value="">${placeholder}</option>`;

  entries.forEach(([name, count]) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} (${count})`;
    select.appendChild(opt);
  });

  const visibleValues = new Set(entries.map(([name]) => name));
  if (currentValue && visibleValues.has(currentValue)) {
    select.value = currentValue;
    if (searchInput) searchInput.value = currentValue;
  } else {
    select.value = '';
    if (searchInput) searchInput.value = '';
  }
}

function pluralize(label, count) {
  return count === 1 ? label : `${label}s`;
}

function updateFilterCountBadge(element, visible, total, label, mode = 'visible') {
  if (!element) return;
  if (!total) {
    element.textContent = '';
    return;
  }
  if (mode === 'selected') {
    element.textContent = `${visible} selected`;
    return;
  }
  element.textContent = `${visible} ${pluralize(label, visible)}`;
}

function updateCascadeCountBadges() {
  const loggerVisible = visibleLoggerOptionCount;
  const loggerTotal = Object.keys(allLoggers || {}).length;
  const threadVisible = threadSelect ? Math.max(0, threadSelect.options.length - 1) : 0;
  const threadTotal = Object.keys(allPods).length || Object.keys(allThreads || {}).length;
  const exceptionVisible = exceptionSelect ? Math.max(0, exceptionSelect.options.length - 1) : 0;
  const exceptionTotal = Object.keys(allExceptions || {}).length;
  const packageTotal = Object.keys(allPackages || {}).length;

  updateFilterCountBadge(loggerVisibleCount, loggerVisible, loggerTotal, 'logger');
  updateFilterCountBadge(threadVisibleCount, threadVisible, threadTotal, 'pod');
  updateFilterCountBadge(exceptionVisibleCount, exceptionVisible, exceptionTotal, 'exception');
  updateFilterCountBadge(packageVisibleCount, filters.packages.length, packageTotal, 'package', 'selected');
}

function renderSelectionHint(element, selectedValues, label, searchValue = '') {
  if (!element) return;

  const query = String(searchValue || '').trim();
  if (!selectedValues.length) {
    if (query) {
      element.innerHTML = `Typing filters matches for <strong>${escapeHtml(query)}</strong>. Press Enter to apply the top match.`;
    } else {
      element.innerHTML = `Type to filter ${label}s. Press Enter to apply the top match.`;
    }
    return;
  }

  if (selectedValues.length === 1) {
    element.innerHTML = `Active ${label}: <strong title="${escapeHtml(selectedValues[0])}">${escapeHtml(selectedValues[0])}</strong>`;
    return;
  }

  element.innerHTML = `Active ${label}s: <strong>${selectedValues.length}</strong> selected`;
}

function renderSelectionHints() {
  renderSelectionHint(packageSelectionHint, filters.packages, 'package', packageFilter?.value || '');
  renderSelectionHint(loggerSelectionHint, filters.loggers, 'logger', loggerFilter?.value || '');
}

function syncSelectedMultiSelectValues(selectedArray, visibleValues) {
  for (let i = selectedArray.length - 1; i >= 0; i--) {
    if (!visibleValues.has(selectedArray[i])) {
      selectedArray.splice(i, 1);
    }
  }
  filterTailEntries();
}

function refreshPackageScopedDropdowns() {
  const sourceThreads = Object.keys(allPods).length > 0 ? allPods : allThreads;
  const scopedThreads = getScopedCountsByPackage(packageThreadsByPackage, sourceThreads);
  const scopedExceptions = getScopedCountsByPackage(packageExceptionsByPackage, allExceptions);
  populateSingleSelectOptions(threadSelect, document.getElementById('threadFilter'), scopedThreads, 'All Pods');
  populateSingleSelectOptions(exceptionSelect, document.getElementById('exceptionFilter'), scopedExceptions, 'All Exceptions');
  updateCascadeCountBadges();
  renderSelectionHints();
}

function populateSelectWithSelection(select, options, defaultLabel, currentValue = '') {
  if (!select) return;
  const entries = Array.isArray(options)
    ? options.map(name => [name, null])
    : Object.entries(options || {});
  const values = new Set();
  select.innerHTML = `<option value="">${defaultLabel}</option>`;
  entries.sort((a, b) => String(a[0]).localeCompare(String(b[0]))).forEach(([name, count]) => {
    values.add(name);
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = count ? `${name} (${count})` : name;
    select.appendChild(opt);
  });
  if (currentValue && values.has(currentValue)) {
    select.value = currentValue;
  } else {
    select.value = '';
  }
}

function populateFilterDropdowns(loggers, threads, packages, exceptions, packageThreads = {}, packageExceptions = {}, categories = [], pods = {}) {
  // Store all loggers for cascading filter
  allLoggers = loggers || {};
  allPackages = packages || {};
  allThreads = threads || {};
  allExceptions = exceptions || {};
  allPods = pods || {};
  packageThreadsByPackage = packageThreads || {};
  packageExceptionsByPackage = packageExceptions || {};

  const visiblePackageValues = new Set(Object.keys(allPackages));
  syncSelectedMultiSelectValues(filters.packages, visiblePackageValues);
  renderPackagePicker();
  renderPackageTags();

  // Multi-select for loggers (filtered by selected packages)
  filterAndPopulateLoggers();

  // Threads and exceptions should stay aligned to the active package scope.
  refreshPackageScopedDropdowns();

  // Category options should track the active error subset
  populateSelectWithSelection(categoryFilter, categories || [], 'All Categories', categoryFilter?.value || '');

  updateCascadeCountBadges();
  renderSelectionHints();
}

function getCurrentErrorFilterPayload() {
  const payload = {};

  if (startDate.value) payload.startDate = normalizeDateTimeForApi(startDate.value);
  if (endDate.value) payload.endDate = normalizeDateTimeForApi(endDate.value);
  if (rawEventsLevel && rawEventsLevel !== 'ALL') payload.level = rawEventsLevel;
  if (filters.loggers.length > 0) payload.logger = [...filters.loggers];
  if (threadSelect?.value) {
    if (Object.keys(allPods).length > 0) {
      payload.pod = threadSelect.value;
    } else {
      payload.thread = threadSelect.value;
    }
  }
  if (filters.packages.length > 0) payload.package = [...filters.packages];
  if (exceptionSelect?.value) payload.exception = exceptionSelect.value;
  if (categoryFilter?.value) payload.category = categoryFilter.value;

  return payload;
}

function getCurrentRequestFilterPayload() {
  const filters = {};

  if (document.getElementById('methodFilter')?.value) filters.method = document.getElementById('methodFilter').value;
  if (document.getElementById('statusFilter')?.value) filters.status = document.getElementById('statusFilter').value;
  if (document.getElementById('podFilter')?.value) filters.pod = document.getElementById('podFilter').value;
  if (document.getElementById('minResponseTime')?.value) filters.minTime = document.getElementById('minResponseTime').value;
  if (document.getElementById('maxResponseTime')?.value) filters.maxTime = document.getElementById('maxResponseTime').value;

  return filters;
}

function getCurrentCDNFilterPayload() {
  const filters = {};

  if (document.getElementById('cdnMethodFilter')?.value) filters.method = document.getElementById('cdnMethodFilter').value;
  if (document.getElementById('cdnStatusFilter')?.value) filters.status = document.getElementById('cdnStatusFilter').value;
  if (document.getElementById('cacheStatusFilter')?.value) filters.cache = document.getElementById('cacheStatusFilter').value;
  if (document.getElementById('countryFilter')?.value) filters.country = document.getElementById('countryFilter').value;
  if (document.getElementById('popFilter')?.value) filters.pop = document.getElementById('popFilter').value;
  if (document.getElementById('hostFilter')?.value) filters.host = document.getElementById('hostFilter').value;
  if (document.getElementById('minTtfb')?.value) filters.minTtfb = document.getElementById('minTtfb').value;
  if (document.getElementById('maxTtfb')?.value) filters.maxTtfb = document.getElementById('maxTtfb').value;

  return filters;
}

function getCurrentMixedFilterPayload() {
  const filters = {};

  if (document.getElementById('mixedMethodFilter')?.value) filters.method = document.getElementById('mixedMethodFilter').value;
  if (document.getElementById('mixedStatusFilter')?.value) filters.status = document.getElementById('mixedStatusFilter').value;
  if (document.getElementById('mixedPodFilter')?.value) filters.pod = document.getElementById('mixedPodFilter').value;
  if (document.getElementById('mixedMinResponseTime')?.value) filters.minTime = document.getElementById('mixedMinResponseTime').value;
  if (document.getElementById('mixedMaxResponseTime')?.value) filters.maxTime = document.getElementById('mixedMaxResponseTime').value;
  if (document.getElementById('mixedCacheStatusFilter')?.value) filters.cache = document.getElementById('mixedCacheStatusFilter').value;
  if (document.getElementById('mixedCountryFilter')?.value) filters.country = document.getElementById('mixedCountryFilter').value;
  if (document.getElementById('mixedHostFilter')?.value) filters.host = document.getElementById('mixedHostFilter').value;
  if (document.getElementById('mixedMinTtfb')?.value) filters.minTtfb = document.getElementById('mixedMinTtfb').value;
  if (document.getElementById('mixedMaxTtfb')?.value) filters.maxTtfb = document.getElementById('mixedMaxTtfb').value;

  const cdnMethod = document.getElementById('mixedCdnMethodFilter')?.value;
  const cdnStatus = document.getElementById('mixedCdnStatusFilter')?.value;
  const cdnPop = document.getElementById('mixedPopFilter')?.value;
  if (cdnMethod && !filters.method) filters.method = cdnMethod;
  if (cdnStatus && !filters.status) filters.status = cdnStatus;
  if (cdnPop && !filters.pod) filters.pod = cdnPop;

  return filters;
}

function getCurrentLogFilterPayload() {
  if (currentLogType === 'request') return getCurrentRequestFilterPayload();
  if (currentLogType === 'cdn') return getCurrentCDNFilterPayload();
  return getCurrentErrorFilterPayload();
}

function getActiveErrorFilterPayload() {
  const filters = getCurrentErrorFilterPayload();
  if (rawSearchInput?.value) {
    filters.search = rawSearchInput.value;
  }
  return filters;
}

function getSidebarErrorFilterPayload() {
  const filters = getActiveErrorFilterPayload();
  delete filters.level;
  delete filters.severity;
  return filters;
}

function applyErrorFilterSidebarResponse(data) {
  if (!data || !data.success) return;

  const categories = data.categories || [];
  populateFilterDropdowns(
    data.loggers || data.loggerDist || {},
    data.threads || data.threadDist || {},
    data.packages || {},
    data.exceptions || {},
    data.packageThreads || {},
    data.packageExceptions || {},
    categories,
    data.pods || {}
  );
}

let errorFilterRefreshTimer = null;
let errorFilterRefreshSeq = 0;
let errorFilterApplyTimer = null;

function scheduleErrorFilterApply() {
  if (currentLogType !== 'error') return;
  clearTimeout(errorFilterApplyTimer);
  errorFilterApplyTimer = setTimeout(() => {
    applyRawEventFilters();
  }, 120);
}

async function refreshErrorFilterOptions() {
  if (currentLogType !== 'error') return;

  const isBatch = currentAnalysisMode === 'batch' && currentBatchInput;
  const filePath = getActiveAnalysisFilePath();
  if (!isBatch && !filePath) return;
  if (isBatch && currentBatchLogType !== 'error') return;

  const seq = ++errorFilterRefreshSeq;
  const payload = isBatch
    ? { input: currentBatchInput, filters: getSidebarErrorFilterPayload() }
    : { filePath, filters: getSidebarErrorFilterPayload() };

  try {
    const response = await fetch(isBatch ? '/api/filter/batch' : '/api/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (seq !== errorFilterRefreshSeq) return;
    if (!data.success) return;
    applyErrorFilterSidebarResponse(data);
  } catch {
    // Sidebar refresh is best-effort; keep the current selections on failure.
  }
}

function scheduleErrorFilterRefresh() {
  if (currentLogType !== 'error') return;
  clearTimeout(errorFilterRefreshTimer);
  errorFilterRefreshTimer = setTimeout(() => {
    refreshErrorFilterOptions();
  }, 120);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, searchTerm, isRegex = false) {
  if (!searchTerm || !text) return escapeHtml(text || '');
  const escaped = escapeHtml(text);
  try {
    if (isRegex) {
      const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
      return escaped.replace(regex, '<mark>$1</mark>');
    } else {
      const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
      return escaped.replace(regex, '<mark>$1</mark>');
    }
  } catch {
    return escaped;
  }
}

function renderLoggerTags() {
  const container = document.getElementById('loggerTags');
  if (!container) return;
  container.innerHTML = filters.loggers.map(val =>
    `<span class="filter-tag"><span title="${escapeHtml(val)}">${escapeHtml(val.split('.').pop())}</span> <button onclick="removeLogger('${escapeHtml(val)}')">&times;</button></span>`
  ).join('');
  renderSelectionHints();
}

function renderPackageTags() {
  const container = document.getElementById('packageTags');
  if (!container) return;
  container.innerHTML = filters.packages.map(val =>
    `<span class="filter-tag"><span>${escapeHtml(val)}</span> <button onclick="removePackage('${escapeHtml(val)}')">&times;</button></span>`
  ).join('');
  renderSelectionHints();
}

function getFilteredPackageEntries() {
  const query = packageFilter.value.trim().toLowerCase();
  let sourcePackages = allPackages || {};
  
  if (activeTailSource && tailAllPackages) {
    sourcePackages = { ...sourcePackages, ...tailAllPackages };
  }
  
  return Object.entries(sourcePackages)
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => !query || name.toLowerCase().includes(query));
}

function renderTokenPickerResults(container, entries, selectedArray, { showActionLabel = true } = {}) {
  if (!container) return;

  if (!entries.length) {
    container.innerHTML = '<div class="token-picker-empty">No matches</div>';
    return;
  }

  container.innerHTML = entries.map(([name, count]) => `
    <button type="button" class="token-picker-option ${selectedArray.includes(name) ? 'selected' : ''}" data-value="${escapeHtml(name)}" title="${escapeHtml(name)}">
      <span class="token-picker-option-label" title="${escapeHtml(name)}">${escapeHtml(name)}${count ? ` (${count})` : ''}</span>
      ${showActionLabel ? `<span class="token-picker-option-check">${selectedArray.includes(name) ? 'Selected' : 'Add'}</span>` : ''}
    </button>
  `).join('');
}

function renderPackagePicker() {
  const entries = getFilteredPackageEntries();
  visiblePackageOptionCount = entries.length;
  renderTokenPickerResults(packageResults, entries, filters.packages);
  updateCascadeCountBadges();
  renderSelectionHints();
}

window.removeLogger = (val) => {
  const idx = filters.loggers.indexOf(val);
  if (idx !== -1) filters.loggers.splice(idx, 1);
  renderLoggerTags();
  renderLoggerPicker();
  scheduleErrorFilterRefresh();
  scheduleErrorFilterApply();
  filterTailEntries();
};

window.removePackage = (val) => {
  const idx = filters.packages.indexOf(val);
  if (idx !== -1) filters.packages.splice(idx, 1);
  renderPackageTags();
  renderPackagePicker();
  filterAndPopulateLoggers();
  refreshPackageScopedDropdowns();
  scheduleErrorFilterRefresh();
  scheduleErrorFilterApply();
  filterTailEntries();
};

/* ============================================================
   Smart Package Grouping & Cascading Filter
   ============================================================ */

function loggerMatchesSelectedPackages(loggerName) {
  if (!filters.packages.length) return true;
  return filters.packages.some((pkg) => loggerName === pkg || loggerName.startsWith(`${pkg}.`));
}

function getAvailableLoggerEntries() {
  let sourceLoggers = allLoggers || {};
  
  if (activeTailSource && tailAllLoggers) {
    sourceLoggers = { ...sourceLoggers, ...tailAllLoggers };
  }
  
  return Object.entries(sourceLoggers)
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => loggerMatchesSelectedPackages(name));
}

function getFilteredLoggerEntries() {
  const query = loggerFilter.value.trim().toLowerCase();
  return getAvailableLoggerEntries()
    .filter(([name]) => !query || name.toLowerCase().includes(query));
}

function renderLoggerPicker() {
  const entries = getFilteredLoggerEntries();
  visibleLoggerOptionCount = entries.length;
  renderTokenPickerResults(loggerResults, entries, filters.loggers, { showActionLabel: false });
  updateCascadeCountBadges();
  renderSelectionHints();
}

function filterAndPopulateLoggers() {
  if (!allLoggers) return;
  const availableValues = new Set(getAvailableLoggerEntries().map(([name]) => name));
  // Mutate array in-place instead of reassigning to preserve reference
  for (let i = filters.loggers.length - 1; i >= 0; i--) {
    if (!availableValues.has(filters.loggers[i])) {
      filters.loggers.splice(i, 1);
    }
  }
  renderLoggerTags();
  renderLoggerPicker();
}

function getVisibleTokenPickerEntries(resultsEl) {
  if (!resultsEl) return [];
  return Array.from(resultsEl.querySelectorAll('.token-picker-option'))
    .map((button) => ({
      value: button.dataset.value || '',
      selected: button.classList.contains('selected'),
      text: button.querySelector('.token-picker-option-label')?.textContent || ''
    }))
    .filter(item => item.value);
}

function commitTopTokenPickerMatch(resultsEl, query = '') {
  const candidates = getVisibleTokenPickerEntries(resultsEl);
  if (!candidates.length) return false;

  const normalizedQuery = String(query || '').trim().toLowerCase();
  const exactUnselected = candidates.find(item =>
    !item.selected && (
      item.value.toLowerCase() === normalizedQuery ||
      item.text.toLowerCase() === normalizedQuery ||
      item.value.toLowerCase().includes(normalizedQuery)
    )
  );
  const firstUnselected = candidates.find(item => !item.selected);
  const target = exactUnselected || firstUnselected;
  if (!target) return false;

  const button = resultsEl.querySelector(`.token-picker-option[data-value="${CSS.escape(target.value)}"]`);
  if (!button) return false;
  button.click();
  return true;
}

/* ============================================================
   Filtering
   ============================================================ */

function applyRawEventFilters() {
  rawEventsSearch = rawSearchInput.value;
  rawEventsLevel = document.querySelector('.level-chip.active')?.dataset.level || 'ALL';
  filters.level = rawEventsLevel;
  filters.search = rawEventsSearch;
  updateWorkspaceSummary();
  persistWorkspaceState();

  if (activeTailSource === 'cloudmanager') {
    renderTailFeed();
    updateTailCounts();
    updateTailDropdownOptions();
    return;
  }

  if (currentAnalysisMode === 'batch' && currentBatchInput) {
    fetchRawEvents(1);
    return;
  }

  fetchRawEvents(1);
  if (chartsVisible) fetchChartsData();
}

applyFiltersBtn.addEventListener('click', applyRawEventFilters);

clearFiltersBtn.addEventListener('click', () => {
  rawSearchInput.value = '';
  rawEventsSearch = '';
  resetErrorFilterState();
  const requestFilterIds = ['methodFilter', 'statusFilter', 'podFilter', 'minResponseTime', 'maxResponseTime'];
  const cdnFilterIds = ['cdnMethodFilter', 'cdnStatusFilter', 'cacheStatusFilter', 'countryFilter', 'popFilter', 'hostFilter', 'minTtfb', 'maxTtfb'];

  [...requestFilterIds, ...cdnFilterIds].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });
  renderLoggerTags();
  renderPackageTags();
  renderPackagePicker();
  filterAndPopulateLoggers(); // Refresh logger list to show all
  refreshPackageScopedDropdowns();
  scheduleErrorFilterRefresh();
  advancedSearchRules.innerHTML = '';
  if (activeTailSource === 'cloudmanager') {
    renderTailFeed();
    updateTailCounts();
    updateTailDropdownOptions();
  }
  renderAdvancedRuleBuilder();
  advancedRulesState = [];
  applyRawEventFilters();
});

categoryFilter.addEventListener('change', () => {
  scheduleErrorFilterRefresh();
  applyRawEventFilters();
});

startDate.addEventListener('change', () => {
  scheduleErrorFilterRefresh();
});

endDate.addEventListener('change', () => {
  scheduleErrorFilterRefresh();
});

addSearchRuleBtn.addEventListener('click', () => {
  advancedSearchRules.appendChild(createAdvancedRuleRow());
  syncAdvancedRulesFromUI();
});

clearSearchRulesBtn.addEventListener('click', () => {
  advancedSearchRules.innerHTML = '';
  advancedRulesState = [];
  renderAdvancedRuleBuilder();
  applyRawEventFilters();
});

runSearchBuilderBtn.addEventListener('click', () => {
  syncAdvancedRulesFromUI();
  applyRawEventFilters();
});

/* ============================================================
   Exports
   ============================================================ */

exportCsvBtn.addEventListener('click', async () => {
  const body = currentAnalysisMode === 'batch' ? { ...getBatchExportPayload(), mode: 'batch' } : { events: rawEventsData };
  const response = await fetch('/api/export/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  downloadFile(await response.blob(), 'aem-log-errors.csv', 'text/csv');
});

exportJsonBtn.addEventListener('click', async () => {
  const body = currentAnalysisMode === 'batch' ? { ...getBatchExportPayload(), mode: 'batch' } : { events: rawEventsData };
  const response = await fetch('/api/export/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  downloadFile(await response.blob(), 'aem-log-errors.json', 'application/json');
});

exportPdfBtn.addEventListener('click', async () => {
  const summary = getSummaryFromDOM();
  const body = currentAnalysisMode === 'batch'
    ? { ...getBatchExportPayload(), summary, mode: 'batch' }
    : { summary, events: rawEventsData };

  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  downloadFile(await response.blob(), 'aem-log-summary.pdf', 'application/pdf');
});

function getBatchExportPayload() {
  let batchFilters;
  if (currentBatchLogType === 'request') {
    batchFilters = getCurrentRequestFilterPayload();
  } else if (currentBatchLogType === 'cdn') {
    batchFilters = getCurrentCDNFilterPayload();
  } else if (currentBatchLogType === 'mixed') {
    batchFilters = getCurrentMixedFilterPayload();
  } else {
    batchFilters = getActiveErrorFilterPayload();
  }
  return {
    input: currentBatchInput,
    filters: batchFilters,
    advancedRules: advancedRulesState,
    search: rawEventsSearch,
    logType: currentBatchLogType === 'mixed' ? '' : currentBatchLogType
  };
}

function getSummaryFromDOM() {
  if (currentAnalysisMode === 'batch' && currentBatchSummary) {
    return {
      totalErrors: currentBatchSummary.totalErrors || 0,
      totalWarnings: currentBatchSummary.totalWarnings || 0,
      uniqueErrors: currentBatchSummary.uniqueErrors || 0,
      uniqueWarnings: currentBatchSummary.uniqueWarnings || 0,
      totalFiles: currentBatchSummary.totalFiles || 0,
      totalEvents: currentBatchSummary.totalEvents || 0
    };
  }

  const summary = currentAnalysisSummary || {};
  if (currentLogType === 'request') {
    return {
      totalErrors: summary.totalRequests || 0,
      totalWarnings: summary.slowRequests || 0,
      uniqueErrors: summary.p95ResponseTime || 0,
      uniqueWarnings: 0
    };
  }
  if (currentLogType === 'cdn') {
    return {
      totalErrors: summary.totalRequests || 0,
      totalWarnings: summary.cacheMisses || 0,
      uniqueErrors: summary.cacheHitRatio || 0,
      uniqueWarnings: 0
    };
  }
  return {
    totalErrors: summary.totalErrors || 0,
    totalWarnings: summary.totalWarnings || 0,
    uniqueErrors: summary.uniqueErrors || 0,
    uniqueWarnings: summary.uniqueWarnings || 0
  };
}

document.getElementById('exportAllBtn').addEventListener('click', async () => {
  showToast('Generating all exports...', 'info');
  const summary = getSummaryFromDOM();
  try {
    const csvBody = currentAnalysisMode === 'batch' ? { ...getBatchExportPayload(), mode: 'batch' } : { events: rawEventsData };
    const jsonBody = currentAnalysisMode === 'batch' ? { ...getBatchExportPayload(), mode: 'batch' } : { events: rawEventsData };
    const pdfBody = currentAnalysisMode === 'batch' ? { ...getBatchExportPayload(), summary, mode: 'batch' } : { summary, events: rawEventsData };
    const [csvRes, jsonRes, pdfRes] = await Promise.all([
      fetch('/api/export/csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(csvBody) }),
      fetch('/api/export/json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jsonBody) }),
      fetch('/api/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pdfBody) })
    ]);
    downloadFile(await csvRes.blob(), 'aem-log-errors.csv', 'text/csv');
    downloadFile(await jsonRes.blob(), 'aem-log-errors.json', 'application/json');
    downloadFile(await pdfRes.blob(), 'aem-log-summary.pdf', 'application/pdf');
    showToast('All exports downloaded', 'success');
  } catch (e) {
    showToast('Export failed: ' + e.message, 'error');
  }
});

function downloadFile(blob, filename, type) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   Keyboard Shortcuts
   ============================================================ */

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey && e.key === 'f') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
    e.preventDefault();
    rawSearchInput.focus();
  }
  if (e.key === 'Escape') {
    if (localDownloadsPopoverOpen) {
      e.preventDefault();
      setLocalDownloadsPopoverOpen(false);
      localDownloadsTrigger?.focus();
      return;
    }
    document.activeElement.blur();
    clearFiltersBtn.click();
  }
});

/* ============================================================
   WebSocket Tail
   ============================================================ */

function closeTailSocket({ sendStop = false } = {}) {
  if (!tailSocket) return;

  if (sendStop && tailSocket.readyState === WebSocket.OPEN) {
    tailSocket.send(JSON.stringify({ action: 'tail-stop', source: activeTailSource || 'cloudmanager' }));
    return;
  }

  if (tailSocket.readyState === WebSocket.OPEN || tailSocket.readyState === WebSocket.CONNECTING) {
    tailSocket.close();
  }

  tailSocket = null;
}

function handleTailSocketMessage(data) {
  if (data.type === 'tail-status') {
    if (data.source === 'cloudmanager') {
      setCloudManagerTailStatus(data.message || 'Cloud Manager live tail connected.');
    } else if (data.message) {
      showToast(data.message, 'info');
    }
    if (activeTailSource === 'local' || data.source === 'cloudmanager') {
      if (tailStatus) {
        tailStatus.textContent = data.message || 'Tailing in progress...';
      }
    }
    return;
  }

  if (data.type === 'tail-entry') {
    if (data.source === 'cloudmanager') {
      pushCloudManagerTailEntry(data.entry || {});
      pushTailEntry({ ...data.entry, source: 'cloudmanager' });
    }
    return;
  }

  if (data.type === 'tail-error') {
    if (data.source === 'cloudmanager') {
      setCloudManagerTailStatus(data.sourceLabel
        ? `${data.sourceLabel}: ${data.error || 'Cloud Manager live tail failed.'}`
        : (data.error || 'Cloud Manager live tail failed.'));
      if (cloudManagerTailSession?.sourceFailures) {
        cloudManagerTailSession.sourceFailures[data.sourceKey || data.sourceLabel || `failure-${Date.now()}`] = data.error || 'Cloud Manager live tail failed.';
      }
      renderCloudManagerTailPanel();
      showToast(`Tail error: ${data.error || 'Unknown error'}`, 'error');
      updateWorkspaceChrome();
      updateWorkspaceSummary();
      return;
    }
  }

  if (data.type === 'tail-stopped') {
    if (data.source === 'cloudmanager') {
      cloudManagerTailSession = null;
      activeTailSource = '';
      setCloudManagerTailStatus('Cloud Manager live tail stopped.');
      renderCloudManagerTailPanel();
      refreshCloudManagerCommandPreview('download');
    }
    if (tailStatus) {
      tailStatus.textContent = 'Tail stopped';
    }
    if (tailStopBtn) {
      tailStopBtn.disabled = true;
    }
    closeTailSocket();
    hideTailPanel();
    persistWorkspaceState();
  }
}

function openTailSocket(onOpen) {
  closeTailSocket();
  tailSocket = new WebSocket(`ws://${location.host}`);
  tailSocket.onopen = onOpen;
  tailSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleTailSocketMessage(data);
  };
  tailSocket.onerror = () => {
    showToast('WebSocket connection error', 'error');
    activeTailSource = '';
    cloudManagerTailSession = null;
    updateTailControls();
    hideTailPanel();
    persistWorkspaceState();
  };
  tailSocket.onclose = () => {
    tailSocket = null;
    if (activeTailSource === 'cloudmanager') {
      activeTailSource = '';
      cloudManagerTailSession = null;
      setCloudManagerTailStatus('Cloud Manager live tail disconnected.');
      refreshCloudManagerCommandPreview('download');
    }
    updateTailControls();
    hideTailPanel();
    persistWorkspaceState();
  };
}

function startCloudManagerTail() {
  const selections = getActiveCloudManagerTailSelections();
  const programId = cmProgramSelect?.value || '';
  const environmentId = cmEnvironmentSelect?.value || '';

  if (!programId || !environmentId || !selections.length) {
    showToast('Select one or more Cloud Manager logs to tail', 'warning');
    return;
  }

  if (activeTailSource === 'cloudmanager') {
    closeTailSocket({ sendStop: true });
    return;
  }

  const labels = buildCloudManagerSelectionLabels();
  cloudManagerTailEntries = [];
  tailEntries = [];
  tailAllPackages = {};
  tailAllLoggers = {};
  resetErrorFilterState();
  applyCurrentSelectionsToFilterUI();
  renderTailFilterTags();
  updateTailCounts();

  cloudManagerTailSession = {
    programId,
    environmentId,
    programName: labels.programName,
    environmentName: labels.environmentName,
    selectionCount: selections.length,
    selections: selections.map((selection) => ({ ...selection })),
    sourceFailures: {}
  };
  activeTailSource = 'cloudmanager';
  setCloudManagerTailStatus('Starting Cloud Manager live tail...');
  renderCloudManagerTailPanel();
  refreshCloudManagerCommandPreview('tail');
  updateWorkspaceChrome();
  updateWorkspaceSummary();

  const cmSource = `${labels.programName} / ${labels.environmentName} - ${selections.length} log${selections.length === 1 ? '' : 's'}`;
  showTailPanel('cloudmanager', cmSource);

  openTailSocket(() => {
    tailSocket.send(JSON.stringify({
      action: 'tail-start',
      source: 'cloudmanager',
      programId,
      environmentId,
      selections
    }));
  });
}

if (cmTailBtn) {
  cmTailBtn.addEventListener('click', startCloudManagerTail);
}

if (cmTailStopBtn) {
  cmTailStopBtn.addEventListener('click', () => {
    closeTailSocket({ sendStop: true });
  });
}

if (tailStopBtn) {
  tailStopBtn.addEventListener('click', () => {
    closeTailSocket({ sendStop: true });
    hideTailPanel();
  });
}

/* ============================================================
   Raw Events View
   ============================================================ */

let rawEventsPage = 1;
let rawEventsLevel = 'ALL';
let rawEventsSearch = '';
let rawEventsPerPage = Number(localStorage.getItem(RAW_EVENTS_PAGE_SIZE_STORAGE_KEY) || 50);
if (!RAW_EVENTS_PAGE_SIZE_OPTIONS.has(rawEventsPerPage)) {
  rawEventsPerPage = 50;
}

const levelFilters = document.getElementById('levelFilters');
const rawSearchRow = document.getElementById('rawSearchRow');
const rawEventsSection = document.getElementById('rawEvents');

function scrollRawEventsToTop() {
  if (!rawEventsSection) return;
  rawEventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function fetchRawEvents(page = 1, options = {}) {
  const { scrollToTop = false } = options;
  rawEventsPage = page;

  if (currentAnalysisMode === 'batch' && currentBatchInput) {
    let batchFilters;
    if (currentBatchLogType === 'request') {
      batchFilters = getCurrentRequestFilterPayload();
    } else if (currentBatchLogType === 'cdn') {
      batchFilters = getCurrentCDNFilterPayload();
    } else if (currentBatchLogType === 'mixed') {
      batchFilters = getCurrentMixedFilterPayload();
    } else {
      batchFilters = getActiveErrorFilterPayload();
    }
    const body = {
      input: currentBatchInput,
      page,
      perPage: rawEventsPerPage,
      filters: batchFilters,
      search: rawEventsSearch
    };

    rawEventsSection.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--color-text-secondary);">Loading merged batch events...</div>';

    try {
      const response = await fetch('/api/raw-events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!data.success) {
        progressText.classList.add('hidden');
        showToast(data.error, 'error');
        return;
      }

      rawEventsData = data.events;
      currentVisibleEventTotal = data.total || data.events.length || 0;
      if (data.levelCounts && (currentBatchLogType === 'error' || currentBatchLogType === 'mixed')) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `(${val || 0})`; };
        const lc = data.levelCounts;
        set('countALL', lc.ALL || 0);
        set('countERROR', lc.ERROR);
        set('countWARN', lc.WARN);
        set('countINFO', lc.INFO);
        set('countDEBUG', lc.DEBUG);
      }
      if (currentBatchLogType === 'error') {
        applyErrorFilterSidebarResponse(data);
      }
      const renderType = currentBatchLogType === 'mixed' ? 'batch' : currentBatchLogType;
      renderRawEvents(data.events, data.total, data.page, data.perPage, renderType);
      progressText.classList.add('hidden');
      updateWorkspaceSummary();
      persistWorkspaceState();
      if (scrollToTop) scrollRawEventsToTop();
    } catch (e) {
      progressText.classList.add('hidden');
      showToast('Failed to load merged batch events: ' + e.message, 'error');
    }
    return;
  }

  const filePath = getActiveAnalysisFilePath();

  if (!filePath) {
    showToast('Enter a file path to view events', 'warning');
    return;
  }

  const body = {
    page,
    perPage: rawEventsPerPage,
    search: rawEventsSearch,
    filePath
  };

  // Date filters
  if (startDate.value) body.from = normalizeDateTimeForApi(startDate.value);
  if (endDate.value) body.to = normalizeDateTimeForApi(endDate.value);

  // Error log filters
  if (currentLogType === 'error') {
    body.level = rawEventsLevel;
    if (filters.loggers.length > 0) body.logger = filters.loggers;
    // Pods/Threads
    const tSelect = document.getElementById('threadSelect');
    const tFilter = document.getElementById('threadFilter');
    const podVal = tSelect?.value || tFilter?.value || '';
    if (podVal) body.pod = podVal;

    // Packages
    if (filters.packages.length > 0) body.package = filters.packages;
    
    // Exceptions
    const eSelect = document.getElementById('exceptionSelect');
    const eFilter = document.getElementById('exceptionFilter');
    const excVal = eSelect?.value || eFilter?.value || '';
    if (excVal) body.exception = excVal;

    if (rawSearchInput.value) body.search = rawSearchInput.value;
    if (categoryFilter.value) body.category = categoryFilter.value;
  } else if (currentLogType === 'request') {
    const methodFilter = document.getElementById('methodFilter');
    const statusFilter = document.getElementById('statusFilter');
    const podFilter = document.getElementById('podFilter');
    const minTimeFilter = document.getElementById('minResponseTime');
    const maxTimeFilter = document.getElementById('maxResponseTime');
    if (methodFilter?.value) body.method = methodFilter.value;
    if (statusFilter?.value) body.httpStatus = statusFilter.value;
    if (podFilter?.value) body.pod = podFilter.value;
    if (minTimeFilter?.value) body.minResponseTime = minTimeFilter.value;
    if (maxTimeFilter?.value) body.maxResponseTime = maxTimeFilter.value;
  } else if (currentLogType === 'cdn') {
    const cdnMethodFilter = document.getElementById('cdnMethodFilter');
    const cdnStatusFilter = document.getElementById('cdnStatusFilter');
    const cacheStatusFilter = document.getElementById('cacheStatusFilter');
    const countryFilter = document.getElementById('countryFilter');
    const popFilter = document.getElementById('popFilter');
    const hostFilter = document.getElementById('hostFilter');
    const minTtfbFilter = document.getElementById('minTtfb');
    const maxTtfbFilter = document.getElementById('maxTtfb');
    if (cdnMethodFilter?.value) body.method = cdnMethodFilter.value;
    if (cdnStatusFilter?.value) body.httpStatus = cdnStatusFilter.value;
    if (cacheStatusFilter?.value) body.cache = cacheStatusFilter.value;
    if (countryFilter?.value) body.clientCountry = countryFilter.value;
    if (popFilter?.value) body.pop = popFilter.value;
    if (hostFilter?.value) body.host = hostFilter.value;
    if (minTtfbFilter?.value) body.minTtfb = minTtfbFilter.value;
    if (maxTtfbFilter?.value) body.maxTtfb = maxTtfbFilter.value;
  }

  rawEventsSection.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--color-text-secondary);">Loading events...</div>';

  try {
    const response = await fetch('/api/raw-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!data.success) { 
      progressText.classList.add('hidden');
      showToast(data.error, 'error'); 
      return; 
    }

    // Update level counts for error logs
    if (data.levelCounts) {
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `(${val || 0})`; };
      set('countALL', data.levelCounts.ALL);
      set('countERROR', data.levelCounts.ERROR);
      set('countWARN', data.levelCounts.WARN);
      set('countINFO', data.levelCounts.INFO);
      set('countDEBUG', data.levelCounts.DEBUG);
    }

    rawEventsData = data.events;
    currentVisibleEventTotal = data.total || data.events.length || 0;
    renderRawEvents(data.events, data.total, data.page, data.perPage, data.logType || currentLogType);
    progressText.classList.add('hidden');
    updateWorkspaceSummary();
    persistWorkspaceState();
    if (scrollToTop) scrollRawEventsToTop();
  } catch (e) {
    progressText.classList.add('hidden');
    showToast('Failed to load events: ' + e.message, 'error');
  }
}

function extractedExceptionBadge(evt) {
  const names = [
    ...extractExceptionNames(evt.message),
    ...extractExceptionNames(evt.stackTrace)
  ];
  if (names.length > 0) {
    const simpleName = names[0].split('.').pop();
    return `<span class="exception-badge">${escapeHtml(simpleName)}</span>`;
  }
  return '';
}

function renderRawEvents(events, total, page, perPage, logType = 'error') {
  currentVisibleEventTotal = total || events.length || 0;
  if (exportRow) {
    exportRow.classList.toggle('export-row-hidden', total <= 0);
    exportRow.setAttribute('aria-hidden', total > 0 ? 'false' : 'true');
  }
  const exportDisabled = total <= 0;
  exportCsvBtn.disabled = exportDisabled;
  exportJsonBtn.disabled = exportDisabled;
  exportPdfBtn.disabled = exportDisabled;
  document.getElementById('exportAllBtn').disabled = exportDisabled;

  const totalPages = Math.ceil(total / perPage);
  const start = total > 0 ? ((page - 1) * perPage + 1) : 0;
  const end = Math.min(page * perPage, total);
  const pageSizeOptions = [50, 100, 150, 200]
    .map((size) => `<option value="${size}" ${Number(perPage) === size ? 'selected' : ''}>${size}</option>`)
    .join('');

  let html = `
    <div class="pagination-header">
      <div class="pagination-info">Showing ${start}-${end} of ${total} events</div>
      <label class="page-size-control">
        <span>Per page</span>
        <select id="rawEventsPerPageSelect" class="filter-select">
          ${pageSizeOptions}
        </select>
      </label>
    </div>
  `;

  events.forEach((evt, i) => {
    if (logType === 'batch') {
      html += renderBatchEvent(evt, i);
    } else if (logType === 'request') {
      html += renderRequestEvent(evt, i);
    } else if (logType === 'cdn') {
      html += renderCDNEvent(evt, i);
    } else {
      html += renderErrorEvent(evt, i);
    }
  });

  if (totalPages > 1) {
    html += '<div class="pagination">';
    html += `<button ${page === 1 ? 'disabled' : ''} onclick="changeRawEventsPage(${page - 1})">Prev</button>`;

    const maxVis = 5;
    let sp = Math.max(1, page - Math.floor(maxVis / 2));
    let ep = Math.min(totalPages, sp + maxVis - 1);
    if (ep - sp < maxVis - 1) sp = Math.max(1, ep - maxVis + 1);

    if (sp > 1) { html += `<button onclick="changeRawEventsPage(1)">1</button>`; if (sp > 2) html += '<span>...</span>'; }
    for (let i = sp; i <= ep; i++) {
      html += `<button class="${i === page ? 'active' : ''}" onclick="changeRawEventsPage(${i})">${i}</button>`;
    }
    if (ep < totalPages) { if (ep < totalPages - 1) html += '<span>...</span>'; html += `<button onclick="changeRawEventsPage(${totalPages})">${totalPages}</button>`; }

    html += `<button ${page === totalPages ? 'disabled' : ''} onclick="changeRawEventsPage(${page + 1})">Next</button>`;
    html += '</div>';
  }

  rawEventsSection.innerHTML = html;

  const pageSizeSelect = document.getElementById('rawEventsPerPageSelect');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (event) => {
      changeRawEventsPerPage(event.target.value);
    });
  }

  rawEventsSection.querySelectorAll('.raw-event').forEach(item => {
    const header = item.querySelector('.raw-event-header');
    if (header) {
      header.addEventListener('click', () => {
        item.classList.toggle('expanded');
      });
    }
    item.querySelectorAll('.detail-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabName = tab.dataset.tab;
        item.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        item.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        item.querySelector(`.${tabName}-tab`).classList.add('active');
      });
    });
  });
}

function changeRawEventsPage(page) {
  fetchRawEvents(page, { scrollToTop: true });
}

function changeRawEventsPerPage(nextValue) {
  const parsed = Number(nextValue);
  if (!RAW_EVENTS_PAGE_SIZE_OPTIONS.has(parsed) || parsed === rawEventsPerPage) return;
  rawEventsPerPage = parsed;
  localStorage.setItem(RAW_EVENTS_PAGE_SIZE_STORAGE_KEY, String(parsed));
  fetchRawEvents(1, { scrollToTop: true });
}

function formatStackTrace(trace) {
  if (!trace) return '';
  return trace.split('\n').map(line => {
    let escaped = escapeHtml(line);
    if (escaped.includes('Caused by:')) {
      escaped = `<span class="caused-by">${escaped}</span>`;
    } else if (escaped.trim().startsWith('at ')) {
      escaped = escaped.replace(
        /at\s+([\w.$]+)\.([\w<>]+)\(([^)]+)\)/,
        'at <span class="at-class">$1</span>.<span class="at-file">$2</span>(<span class="at-file">$3</span>)'
      );
      escaped = `<span class="at-line">${escaped}</span>`;
    } else if (/^[a-zA-Z]+\./.test(escaped.trim())) {
      escaped = `<span class="exception">${escaped}</span>`;
    }
    return escaped;
  }).join('\n');
}

function buildEventMessage(evt, logType) {
  if (logType === 'error') return evt.message || evt.title || '';
  if (logType === 'request') return evt.url || '';
  if (logType === 'cdn') {
    if (evt.host && evt.url) return `${evt.host}${evt.url}`;
    if (evt.url) return evt.url;
    if (evt.host) return evt.host;
    return `${evt.method || ''} ${evt.status || ''}`.trim() || '';
  }
  return evt.title || evt.message || evt.url || evt.host || '';
}

function renderErrorEvent(evt, i) {
  const level = evt.level || evt.severity || 'INFO';
  const loggerName = evt.logger || evt.sourceName || '';
  const messageText = buildEventMessage(evt, 'error');
  const hasStack = evt.stackTrace && evt.stackTrace.trim();
  const stackHtml = hasStack ? formatStackTrace(evt.stackTrace) : '';
  const pinned = isPinnedEvent(evt, 'error');

  const jsonEntry = {
    timestamp: evt.timestamp,
    thread: evt.thread,
    level,
    logger: loggerName,
    message: messageText,
    sourceFile: evt.sourceFile || '',
    sourceName: evt.sourceName || '',
    ...(hasStack && { stackTrace: evt.stackTrace })
  };
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch)}</pre>`;

  return `
    <div class="raw-event ${String(level).toLowerCase()}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${level}">${level}</span>
        ${extractedExceptionBadge(evt)}
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-logger" title="${escapeHtml(loggerName)}">${escapeHtml((loggerName || '').split('.').pop())}</span>
        <span class="event-message" title="${escapeHtml(messageText)}">${highlightText(messageText, rawEventsSearch)}</span>
        <button class="raw-event-pin ${pinned ? 'active' : ''}" type="button" onclick="event.stopPropagation(); togglePinnedEventByIndex(${i}, 'error')">${pinned ? 'Pinned' : 'Pin'}</button>
        <span class="expand-arrow">&#9654;</span>
      </div>
      <div class="event-details">
        <div class="event-details-tabs">
          ${hasStack ? '<button class="detail-tab active" data-tab="stack">Stack Trace</button>' : ''}
          <button class="detail-tab ${hasStack ? '' : 'active'}" data-tab="json">JSON</button>
          <button class="copy-stack-btn" onclick="event.stopPropagation(); copyEventJson(this, ${i})">Copy JSON</button>
        </div>
        ${hasStack ? `<div class="tab-content stack-tab active"><div class="stack-trace-wrapper"><div class="stack-trace">${stackHtml}</div></div></div>` : ''}
        <div class="tab-content json-tab ${hasStack ? '' : 'active'}">${jsonHtml}</div>
      </div>
    </div>
  `;
}

function renderRequestEvent(evt, i) {
  const statusClass = evt.status >= 400 ? 'error' : evt.status >= 300 ? 'warn' : 'success';
  const pinned = isPinnedEvent(evt, 'request');
  const messageText = buildEventMessage(evt, 'request');
  const jsonEntry = {
    timestamp: evt.timestamp,
    method: evt.method,
    url: evt.url,
    status: evt.status,
    responseTime: evt.responseTime,
    pod: evt.pod
  };
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch)}</pre>`;

  return `
    <div class="raw-event ${statusClass}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${statusClass}">${evt.method}</span>
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-message" title="${escapeHtml(messageText)}">${highlightText(messageText, rawEventsSearch)}</span>
        <span class="status-badge ${statusClass}">${evt.status}</span>
        <span class="response-time">${evt.responseTime}ms</span>
        <button class="raw-event-pin ${pinned ? 'active' : ''}" type="button" onclick="event.stopPropagation(); togglePinnedEventByIndex(${i}, 'request')">${pinned ? 'Pinned' : 'Pin'}</button>
        <span class="expand-arrow">&#9654;</span>
      </div>
      <div class="event-details">
        <div class="event-details-tabs">
          <button class="detail-tab active" data-tab="json">JSON</button>
          <button class="copy-stack-btn" onclick="event.stopPropagation(); copyEventJson(this, ${i})">Copy JSON</button>
        </div>
        <div class="tab-content json-tab active">${jsonHtml}</div>
      </div>
    </div>
  `;
}

function renderCDNEvent(evt, i) {
  const statusClass = evt.status >= 400 ? 'error' : evt.status >= 300 ? 'warn' : 'success';
  const pinned = isPinnedEvent(evt, 'cdn');
  const messageText = buildEventMessage(evt, 'cdn');
  const jsonEntry = {
    timestamp: evt.timestamp,
    method: evt.method,
    url: evt.url,
    status: evt.status,
    ttfb: evt.ttfb,
    ttlb: evt.ttlb,
    cache: evt.cache,
    clientIp: evt.clientIp,
    clientCountry: evt.clientCountry,
    clientRegion: evt.clientRegion,
    pop: evt.pop,
    requestId: evt.requestId,
    userAgent: evt.userAgent && evt.userAgent.length > 100 ? evt.userAgent.slice(0, 100) + '...' : evt.userAgent,
    aemEnvKind: evt.aemEnvKind,
    aemTenant: evt.aemTenant,
    contentType: evt.contentType,
    debug: evt.debug,
    resAge: evt.resAge,
    host: evt.host,
    rules: evt.rules,
    alerts: evt.alerts,
    sample: evt.sample,
    ddos: evt.ddos
  };
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch)}</pre>`;

  return `
    <div class="raw-event ${statusClass}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${statusClass}">${evt.method}</span>
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-message" title="${escapeHtml(messageText)}">${highlightText(messageText, rawEventsSearch)}</span>
        <span class="status-badge ${statusClass}">${evt.status}</span>
        <span class="cache-badge">${evt.cache || '-'}</span>
        <button class="raw-event-pin ${pinned ? 'active' : ''}" type="button" onclick="event.stopPropagation(); togglePinnedEventByIndex(${i}, 'cdn')">${pinned ? 'Pinned' : 'Pin'}</button>
        <span class="expand-arrow">&#9654;</span>
      </div>
      <div class="event-details">
        <div class="event-details-tabs">
          <button class="detail-tab active" data-tab="json">JSON</button>
          <button class="copy-stack-btn" onclick="event.stopPropagation(); copyEventJson(this, ${i})">Copy JSON</button>
        </div>
        <div class="tab-content json-tab active">${jsonHtml}</div>
      </div>
    </div>
  `;
}

function renderBatchEvent(evt, i) {
  const pinned = isPinnedEvent(evt, 'batch');
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(evt, null, 2), rawEventsSearch)}</pre>`;
  const messageText = buildEventMessage(evt, 'batch');

  return `
    <div class="raw-event ${getSeverityClass(evt.severity)}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${getSeverityClass(evt.severity)}">${escapeHtml(evt.severity)}</span>
        <span class="event-time">${escapeHtml(evt.timestamp || '')}</span>
        <span class="event-logger" title="${escapeHtml(evt.sourceName || evt.sourceFile || '')}">${escapeHtml(evt.sourceName || evt.sourceFile || '')}</span>
        <span class="event-message" title="${escapeHtml(messageText)}">${highlightText(messageText, rawEventsSearch)}</span>
        <button class="raw-event-pin ${pinned ? 'active' : ''}" type="button" onclick="event.stopPropagation(); togglePinnedEventByIndex(${i}, 'batch')">${pinned ? 'Pinned' : 'Pin'}</button>
        <span class="expand-arrow">&#9654;</span>
      </div>
      <div class="event-details">
        <div class="event-details-tabs">
          <button class="detail-tab active" data-tab="json">JSON</button>
          <button class="copy-stack-btn" onclick="event.stopPropagation(); copyEventJson(this, ${i})">Copy JSON</button>
        </div>
        <div class="tab-content json-tab active">${jsonHtml}</div>
      </div>
    </div>
  `;
}

window.copyEventJson = (btn, index) => {
  const event = btn.closest('.raw-event');
  const jsonView = event.querySelector('.json-view');
  if (jsonView) {
    navigator.clipboard.writeText(jsonView.textContent).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy JSON', 1500);
    });
  }
};

window.togglePinnedEventByIndex = (index, logType = currentLogType) => {
  const entry = rawEventsData[index];
  if (!entry) return;
  togglePinnedEvent(entry, logType);
  const renderType = currentAnalysisMode === 'batch' && currentBatchLogType === 'mixed'
    ? 'batch'
    : currentLogType;
  renderRawEvents(rawEventsData, currentVisibleEventTotal || rawEventsData.length, rawEventsPage, rawEventsPerPage, renderType);
  updateWorkspaceSummary();
};

window.removePinnedEvent = (key) => {
  pinnedEntries = pinnedEntries.filter((entry) => entry.key !== key);
  renderPinnedEvents();
  persistWorkspaceState();
};

if (pinnedEvents) {
  pinnedEvents.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-pinned-key]');
    if (!removeButton) return;
    const key = removeButton.dataset.removePinnedKey || '';
    if (!key) return;
    window.removePinnedEvent(key);
  });
}

document.querySelectorAll('.level-chip').forEach(chip => {
  if (chip.id === 'chartsToggleBtn') return;
  chip.addEventListener('click', () => {
    document.querySelectorAll('.level-chip').forEach(c => {
      if (c.id !== 'chartsToggleBtn') c.classList.remove('active');
    });
    chip.classList.add('active');
    rawEventsLevel = chip.dataset.level;
    filters.level = rawEventsLevel;
    filterTailEntries();
    if (!activeTailSource) {
      fetchRawEvents(1);
    }
  });
});

const rawSearchInput = document.getElementById('rawSearchInput');
const rawSearchBtn = document.getElementById('rawSearchBtn');
rawSearchBtn.addEventListener('click', () => {
  rawEventsSearch = rawSearchInput.value;
  filters.search = rawSearchInput.value;
  if (activeTailSource) {
    return;
  }
  if (currentAnalysisMode === 'batch' && currentBatchInput) {
    applyRawEventFilters();
  } else {
    fetchRawEvents(1);
  }
});
rawSearchInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  rawEventsSearch = rawSearchInput.value;
  filters.search = rawSearchInput.value;
  if (activeTailSource) {
    return;
  }
  if (currentAnalysisMode === 'batch' && currentBatchInput) {
    applyRawEventFilters();
  } else {
    fetchRawEvents(1);
  }
});

window.fetchRawEvents = fetchRawEvents;
window.changeRawEventsPage = changeRawEventsPage;
window.changeRawEventsPerPage = changeRawEventsPerPage;

if (cmHistoryList) {
  cmHistoryList.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-history-action]');
    if (!actionButton) return;

    const runId = actionButton.dataset.runId || '';
    const entry = readCloudManagerHistory().find((item) => item.runId === runId);
    if (!entry) return;

    if (actionButton.dataset.historyAction === 'reuse') {
      setSourceMode('cloudmanager');
      if (cmProgramSelect) cmProgramSelect.value = entry.programId || '';
      persistCloudManagerSelectionState();
      ensureCloudManagerProgramsLoaded({ force: false, silent: false }).then(async () => {
        if (entry.programId) {
          cmProgramSelect.value = entry.programId;
          await loadCloudManagerEnvironments(entry.programId, { silent: false });
        }
        if (cmEnvironmentSelect && entry.environmentId) {
          cmEnvironmentSelect.value = entry.environmentId;
          await loadCloudManagerLogOptions(entry.programId, entry.environmentId, { silent: false });
        }
        selectedCloudManagerLogs = Array.isArray(entry.selections) ? entry.selections.map((selection) => ({ ...selection })) : [];
        currentCloudManagerTier = entry.tier || '';
        renderCloudManagerLogOptions();
        syncCloudManagerWorkspace();
        persistCloudManagerSelectionState();
        showToast('Cloud Manager run restored into the current setup', 'success');
      }).catch((error) => {
        showToast(error.message || 'Failed to restore Cloud Manager run', 'error');
      });
      return;
    }

    if (actionButton.dataset.historyAction === 'analyze') {
      const supportedFile = entry.analyzedFile
        || entry.downloadedFilesDetailed?.find((file) => file.supported !== false)?.filePath
        || entry.downloadedFiles?.[0]
        || '';
      if (!supportedFile) {
        showToast('No supported downloaded file found for this history entry', 'warning');
        return;
      }
      setSourceMode('local');
      filePathInput.value = supportedFile;
      analyzeBtn.click();
    }
  });
}

// Single-select searchable dropdown behavior
function initSearchableDropdown(dropdownId, searchInputId, selectId, filterInputId, onChangeCallback = null) {
  const dropdown = document.getElementById(dropdownId);
  const searchInput = document.getElementById(searchInputId);
  const select = document.getElementById(selectId);
  const filterInput = filterInputId ? document.getElementById(filterInputId) : null;

  if (!dropdown || !searchInput || !select) return;

  searchInput.addEventListener('focus', () => {
    dropdown.classList.add('open');
  });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    dropdown.classList.add('open');

    Array.from(select.options).forEach(opt => {
      if (opt.value === '') {
        opt.style.display = '';
        return;
      }
      const text = (opt.value + ' ' + opt.textContent).toLowerCase();
      opt.style.display = text.includes(query) ? '' : 'none';
    });
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const query = searchInput.value.trim().toLowerCase();
    const visibleOptions = Array.from(select.options).filter((opt) => {
      if (opt.value === '') return false;
      if (opt.style.display === 'none') return false;
      if (!query) return true;
      const text = (opt.value + ' ' + opt.textContent).toLowerCase();
      return text.includes(query);
    });

    const exact = visibleOptions.find((opt) => opt.value.toLowerCase() === query || opt.textContent.toLowerCase() === query);
    const target = exact || visibleOptions[0];
    if (!target) return;

    e.preventDefault();
    select.value = target.value;
    searchInput.value = target.value;
    dropdown.classList.remove('open');
    if (onChangeCallback) onChangeCallback();
    applyRawEventFilters();
  });

  select.addEventListener('change', () => {
    const val = select.value;
    searchInput.value = val;
    dropdown.classList.remove('open');
    if (onChangeCallback) onChangeCallback();
    applyRawEventFilters();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// Token-picker behavior for package/logger multi-select filters.
function initMultiSelectDropdown(dropdownId, searchInputId, resultsId, selectedArray, renderTagsFn, onSelectionChange, onSelectionCommit, renderResultsFn) {
  const dropdown = document.getElementById(dropdownId);
  const searchInput = document.getElementById(searchInputId);
  const results = document.getElementById(resultsId);

  if (!dropdown || !searchInput || !results) return;

  let hasPendingSelectionChange = false;

  function commitSelectionChanges() {
    if (!hasPendingSelectionChange) return;
    hasPendingSelectionChange = false;
    if (onSelectionCommit) onSelectionCommit();
  }

  searchInput.addEventListener('focus', () => {
    dropdown.classList.add('open');
    renderResultsFn();
  });

  searchInput.addEventListener('input', () => {
    dropdown.classList.add('open');
    renderResultsFn();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !searchInput.value.trim() && selectedArray.length > 0) {
      selectedArray.pop();
      renderTagsFn();
      renderResultsFn();
      hasPendingSelectionChange = true;
      if (onSelectionChange) onSelectionChange();
    }

    if (e.key === 'Enter') {
      const applied = commitTopTokenPickerMatch(results, searchInput.value);
      if (applied) {
        e.preventDefault();
        commitSelectionChanges();
      }
    }

    if (e.key === 'Escape') {
      dropdown.classList.remove('open');
      commitSelectionChanges();
    }
  });

  results.addEventListener('mousedown', (e) => {
    if (e.target.closest('.token-picker-option')) {
      e.preventDefault();
    }
  });

  results.addEventListener('click', (e) => {
    const button = e.target.closest('.token-picker-option');
    if (!button) return;
    e.preventDefault();
    e.stopPropagation();
    const optionValue = button.dataset.value || '';
    if (!optionValue) return;

    if (selectedArray.includes(optionValue)) {
      const idx = selectedArray.indexOf(optionValue);
      if (idx !== -1) selectedArray.splice(idx, 1);
    } else {
      selectedArray.push(optionValue);
    }

    renderTagsFn();
    renderResultsFn();
    dropdown.classList.add('open');
    searchInput.focus();
    hasPendingSelectionChange = true;
    if (onSelectionChange) onSelectionChange();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      commitSelectionChanges();
    }
  });
}

// Initialize dropdowns
initMultiSelectDropdown(
  'loggerDropdown',
  'loggerFilter',
  'loggerResults',
  filters.loggers,
  renderLoggerTags,
  renderLoggerPicker,
  () => {
    scheduleErrorFilterRefresh();
    scheduleErrorFilterApply();
  },
  renderLoggerPicker
);
initSearchableDropdown('threadDropdown', 'threadFilter', 'threadSelect', null, scheduleErrorFilterRefresh);
initMultiSelectDropdown(
  'packageDropdown',
  'packageFilter',
  'packageResults',
  filters.packages,
  renderPackageTags,
  () => {
    renderPackagePicker();
    filterAndPopulateLoggers();
    refreshPackageScopedDropdowns();
  },
  () => {
    scheduleErrorFilterRefresh();
    scheduleErrorFilterApply();
  },
  renderPackagePicker
);
initSearchableDropdown('exceptionDropdown', 'exceptionFilter', 'exceptionSelect', null, scheduleErrorFilterRefresh);

['methodFilter', 'statusFilter', 'podFilter', 'cdnMethodFilter', 'cdnStatusFilter', 'cacheStatusFilter', 'countryFilter', 'popFilter', 'hostFilter'].forEach((id) => {
  const select = document.getElementById(id);
  if (select) select.addEventListener('change', applyRawEventFilters);
});

['minResponseTime', 'maxResponseTime', 'minTtfb', 'maxTtfb'].forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener('change', applyRawEventFilters);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') applyRawEventFilters();
  });
});

renderAdvancedRuleBuilder();
updateCascadeCountBadges();
renderSelectionHints();
applyThemePreference();
applySidebarState();
restoreWorkspaceState();
restoreCloudManagerSelections();
restoreCloudManagerTabState();
ensureCloudManagerProgramsLoaded().catch((error) => {
  console.warn('[AEM] Failed to initialize Cloud Manager on load:', error);
});
renderCloudManagerHistory();
renderLocalDownloadsList();
updateCloudManagerHintState();
renderCloudManagerLogOptions();
renderCloudManagerTailPanel();
setSourceMode(currentSourceMode, { persist: false });
refreshCloudManagerCommandPreview();
updateCloudManagerActionState();
updateTailControls();
syncCloudManagerWorkspace();
setResultView(currentResultView || 'events', { persist: false });
renderPinnedEvents();
updateWorkspaceChrome();
updateWorkspaceSummary();

// Restore last used file path on page load
const lastPath = localStorage.getItem('aem_lastPath');
if (lastPath) {
  filePathInput.value = normalizeLocalPathInputValue(lastPath);
  console.log('[AEM] Restored path:', filePathInput.value);
}

// Debounced save on input for instant persistence
let savePathTimeout;
filePathInput.addEventListener('input', () => {
  clearTimeout(savePathTimeout);
  savePathTimeout = setTimeout(() => {
    const val = persistLocalPathInput(filePathInput.value);
    if (val) {
      console.log('[AEM] Saved path on input:', val);
    }
  }, 300);
});

// Also save on blur (immediate)
filePathInput.addEventListener('blur', () => {
  persistLocalPathInput(filePathInput.value);
});

// ============================================================
// New Tail Panel - Initialization & Event Handlers
// ============================================================

function initTailPanel() {
  setupTailLevelFilters();
  setupTailSearch();
  setupTailFilters();
  setupTailActions();
}

function syncLevelChips(source) {
  const targetSelector = source === 'analyzer' ? '.tail-level-chip' : '.level-chip';
  document.querySelectorAll(targetSelector).forEach(c => {
    c.classList.toggle('active', c.dataset.level === filters.level);
  });
}

function updateLevelChips(level) {
  filters.level = level;
  syncLevelChips('analyzer');
  syncLevelChips('tail');
}

function switchToView(view) {
  activeView = view;
  syncLevelChips(view);
}

function setupTailLevelFilters() {
  if (!tailLevelFilters) return;
  tailLevelFilters.querySelectorAll('.tail-level-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      tailLevelFilters.querySelectorAll('.tail-level-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filters.level = chip.dataset.level || 'ALL';
      filterTailEntries();
    });
  });
}

function setupTailSearch() {
  if (tailSearchInput) {
    tailSearchInput.addEventListener('input', () => {
      filters.search = tailSearchInput.value;
      filterTailEntries();
    });
  }
  if (tailRegexToggle) {
    tailRegexToggle.addEventListener('click', () => {
      filters.regex = !filters.regex;
      tailRegexToggle.classList.toggle('active', filters.regex);
      filterTailEntries();
    });
  }
}

function setupTailFilters() {
  if (tailPackageFilter) {
    tailPackageFilter.addEventListener('input', () => {
      filterDropdown(tailPackageFilter, tailPackageResults, tailAllPackages, renderTailPackageOptions);
    });
    tailPackageFilter.addEventListener('focus', () => {
      filterDropdown(tailPackageFilter, tailPackageResults, tailAllPackages, renderTailPackageOptions);
    });
  }
  if (tailLoggerFilter) {
    tailLoggerFilter.addEventListener('input', () => {
      filterDropdown(tailLoggerFilter, tailLoggerResults, tailAllLoggers, renderTailLoggerOptions);
    });
    tailLoggerFilter.addEventListener('focus', () => {
      filterDropdown(tailLoggerFilter, tailLoggerResults, tailAllLoggers, renderTailLoggerOptions);
    });
  }
}

function setupTailActions() {
  if (tailAutoScrollBtn) {
    tailAutoScrollBtn.addEventListener('click', () => {
      tailAutoScroll = !tailAutoScroll;
      tailAutoScrollBtn.classList.toggle('active', tailAutoScroll);
      if (tailAutoScroll && tailHasNewEntries) {
        scrollTailToTop();
      }
    });
  }
  if (tailClearBtn) {
    tailClearBtn.addEventListener('click', () => {
      tailEntries = [];
      tailAllPackages = {};
      tailAllLoggers = {};
      renderTailFeed();
      updateTailCounts();
    });
  }
  if (tailExportBtn) {
    tailExportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tailExportMenu.classList.toggle('hidden');
    });
  }
  if (tailExportJson) {
    tailExportJson.addEventListener('click', () => {
      exportTailBuffer('json');
      tailExportMenu.classList.add('hidden');
    });
  }
  if (tailExportCsv) {
    tailExportCsv.addEventListener('click', () => {
      exportTailBuffer('csv');
      tailExportMenu.classList.add('hidden');
    });
  }
  if (tailScrollToNew) {
    tailScrollToNew.addEventListener('click', () => {
      scrollTailToTop();
    });
  }
  document.addEventListener('click', (e) => {
    if (tailExportBtn && tailExportMenu && !tailExportBtn.contains(e.target) && !tailExportMenu.contains(e.target)) {
      tailExportMenu.classList.add('hidden');
    }
  });
}

function renderTailPackageOptions(filter = '') {
  if (!tailPackageResults) return;
  const filterLower = filter.toLowerCase();
  const options = Object.keys(tailAllPackages).filter(p => p.toLowerCase().includes(filterLower)).slice(0, 50);
  if (!options.length) {
    tailPackageResults.innerHTML = '<div class="token-picker-empty">No packages found</div>';
    return;
  }
  tailPackageResults.innerHTML = options.map(pkg => `
    <label class="token-picker-option">
      <input type="checkbox" value="${escapeHtml(pkg)}" ${filters.packages.includes(pkg) ? 'checked' : ''}>
      <span>${escapeHtml(pkg)}</span>
      <span class="token-count">${tailAllPackages[pkg]}</span>
    </label>
  `).join('');
  tailPackageResults.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      replaceArrayContents(filters.packages, Array.from(tailPackageResults.querySelectorAll('input:checked')).map(i => i.value));
      renderTailFilterTags();
      filterTailEntries();
    });
  });
}

function renderTailLoggerOptions(filter = '') {
  if (!tailLoggerResults) return;
  const filterLower = filter.toLowerCase();
  const options = Object.keys(tailAllLoggers).filter(l => l.toLowerCase().includes(filterLower)).slice(0, 50);
  if (!options.length) {
    tailLoggerResults.innerHTML = '<div class="token-picker-empty">No loggers found</div>';
    return;
  }
  tailLoggerResults.innerHTML = options.map(logger => `
    <label class="token-picker-option">
      <input type="checkbox" value="${escapeHtml(logger)}" ${filters.loggers.includes(logger) ? 'checked' : ''}>
      <span>${escapeHtml(logger)}</span>
      <span class="token-count">${tailAllLoggers[logger]}</span>
    </label>
  `).join('');
  tailLoggerResults.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      replaceArrayContents(filters.loggers, Array.from(tailLoggerResults.querySelectorAll('input:checked')).map(i => i.value));
      renderTailFilterTags();
      filterTailEntries();
    });
  });
}

function renderTailFilterTags() {
  if (tailPackageTags) {
    tailPackageTags.innerHTML = filters.packages.map(pkg => `
      <span class="filter-tag" data-package="${escapeHtml(pkg)}">
        ${escapeHtml(pkg.split('.').pop())}
        <button type="button" onclick="removeTailPackageFilter('${escapeHtml(pkg)}')">&times;</button>
      </span>
    `).join('');
  }
  if (tailLoggerTags) {
    tailLoggerTags.innerHTML = filters.loggers.map(logger => `
      <span class="filter-tag" data-logger="${escapeHtml(logger)}">
        ${escapeHtml(logger.split('.').pop())}
        <button type="button" onclick="removeTailLoggerFilter('${escapeHtml(logger)}')">&times;</button>
      </span>
    `).join('');
  }
}

function removeTailPackageFilter(pkg) {
  replaceArrayContents(filters.packages, filters.packages.filter(p => p !== pkg));
  renderTailFilterTags();
  if (tailPackageResults) {
    tailPackageResults.querySelectorAll(`input[value="${cssEscape(pkg)}"]`).forEach(i => i.checked = false);
  }
  filterTailEntries();
}

function removeTailLoggerFilter(logger) {
  replaceArrayContents(filters.loggers, filters.loggers.filter(l => l !== logger));
  renderTailFilterTags();
  if (tailLoggerResults) {
    tailLoggerResults.querySelectorAll(`input[value="${cssEscape(logger)}"]`).forEach(i => i.checked = false);
  }
  filterTailEntries();
}

function showTailPanel(source = 'local', path = '') {
  if (!tailPanel) return;
  if (resultViewTailTab) resultViewTailTab.disabled = false;
  if (tailTitle) {
    tailTitle.textContent = 'Cloud Manager Tail';
  }
  if (tailSource) {
    tailSource.textContent = path;
  }
  if (tailStopBtn) {
    tailStopBtn.disabled = false;
  }
  if (tailStatus) {
    tailStatus.textContent = 'Tailing in progress...';
  }
  setResultView('live-tail', { persist: false });
  updateWorkspaceChrome();
  updateWorkspaceSummary();
}

function hideTailPanel() {
  if (!tailPanel) return;
  tailPanel.classList.add('hidden');
  if (resultViewTailTab) resultViewTailTab.disabled = true;
  if (currentResultView === 'live-tail') {
    setResultView('events', { persist: false });
  }
  updateWorkspaceChrome();
  updateWorkspaceSummary();
}

function pushTailEntry(entry) {
  const level = entry.level || entry.logType || 'INFO';
  const loggerName = entry.logger || entry.sourceName || '';
  const packageName = entry.sourceFile || loggerName.split('.').slice(0, -1).join('.');

  if (packageName && packageName !== 'null') {
    tailAllPackages[packageName] = (tailAllPackages[packageName] || 0) + 1;
  }
  if (loggerName) {
    tailAllLoggers[loggerName] = (tailAllLoggers[loggerName] || 0) + 1;
  }

  entry._index = tailEntries.length;
  tailEntries.push(entry);

  if (tailEntries.length > 500) {
    tailEntries = tailEntries.slice(-500);
  }

  const shouldShow = checkTailEntryShouldShow(entry);
  
  if (shouldShow) {
    addTailEntryToFeed(entry);
  }

  updateTailCounts();
  updateTailDropdownOptions();

  if (tailAutoScroll) {
    scrollTailToTop();
  } else {
    tailHasNewEntries = true;
    if (tailNewIndicator) tailNewIndicator.classList.remove('hidden');
  }
}

function addTailEntryToFeed(entry) {
  if (!tailFeed) return;
  const html = renderTailEntryHtml(entry);
  tailFeed.insertAdjacentHTML('beforeend', html);
  
  const lastEntry = tailFeed.lastElementChild;
  if (lastEntry) {
    setupTailEntryEvents(lastEntry);
  }
}

function renderTailEntryHtml(entry) {
  const level = entry.level || entry.logType || 'INFO';
  const loggerName = entry.logger || entry.sourceName || '';
  const messageText = entry.message || entry.rawLine || '';
  const hasStack = entry.stackTrace && entry.stackTrace.trim();
  const timestamp = entry.timestamp || '';
  const sourceLabel = entry.sourceLabel || `${entry.service || ''}/${entry.logName || ''}`.replace(/^\/|\/$/g, '');

  return `
    <div class="tail-entry ${String(level).toLowerCase()}" data-index="${entry._index}" style="animation-delay: ${(entry._index % 20) * 30}ms">
      <div class="tail-entry-header">
        <span class="level-badge ${level}">${level}</span>
        <span class="entry-time">${escapeHtml(timestamp)}</span>
        <span class="entry-logger" title="${escapeHtml(sourceLabel)}">${escapeHtml(sourceLabel || 'Cloud Manager')}</span>
        <span class="entry-logger" title="${escapeHtml(loggerName)}">${escapeHtml((loggerName || '').split('.').pop() || loggerName)}</span>
        <span class="entry-message" title="${escapeHtml(messageText)}">${highlightText(messageText, filters.search, filters.regex)}</span>
        <span class="expand-arrow">▶</span>
      </div>
      <div class="tail-entry-details">
        <div class="tail-entry-tabs">
          ${hasStack ? '<button class="tail-entry-tab active" data-tab="stack">Stack Trace</button>' : ''}
          <button class="tail-entry-tab ${hasStack ? '' : 'active'}" data-tab="json">JSON</button>
          <button class="tail-copy-btn" onclick="event.stopPropagation(); copyTailEntry(${entry._index})">Copy</button>
        </div>
        ${hasStack ? `<div class="tail-entry-content stack-tab active"><div class="stack-trace">${formatStackTrace(entry.stackTrace)}</div></div>` : ''}
        <div class="tail-entry-content json-tab ${hasStack ? '' : 'active'}"><pre class="json-view">${highlightText(JSON.stringify(entry, null, 2), filters.search, filters.regex)}</pre></div>
      </div>
    </div>
  `;
}

function setupTailEntryEvents(entryEl) {
  const header = entryEl.querySelector('.tail-entry-header');
  if (header) {
    header.addEventListener('click', () => {
      entryEl.classList.toggle('expanded');
    });
  }
  entryEl.querySelectorAll('.tail-entry-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      entryEl.querySelectorAll('.tail-entry-tab').forEach(t => t.classList.remove('active'));
      entryEl.querySelectorAll('.tail-entry-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      entryEl.querySelector(`.${tabName}-tab`).classList.add('active');
    });
  });
}

function checkTailEntryShouldShow(entry) {
  const activeFilters = getActiveErrorFilterPayload();
  const level = entry.level || entry.logType || 'INFO';
  const loggerName = entry.logger || entry.sourceName || '';
  const packageName = entry.sourceFile || loggerName.split('.').slice(0, -1).join('.');
  const messageText = entry.message || entry.rawLine || '';

  if (activeFilters.level && activeFilters.level !== 'ALL' && level !== activeFilters.level) {
    return false;
  }

  const packages = Array.isArray(activeFilters.package) ? activeFilters.package : [];
  if (packages.length > 0) {
    const matches = packages.some(pkg => packageName && (packageName === pkg || packageName.startsWith(`${pkg}.`)));
    if (!matches) return false;
  }

  const loggers = Array.isArray(activeFilters.logger) ? activeFilters.logger : [];
  if (loggers.length > 0) {
    const matches = loggers.some(logger => loggerName === logger);
    if (!matches) return false;
  }

  if (activeFilters.thread && entry.threadName !== activeFilters.thread && entry.thread !== activeFilters.thread) {
    return false;
  }

  if (activeFilters.exception && !(entry.message || '').includes(activeFilters.exception)) {
    return false;
  }

  if (activeFilters.search) {
    try {
      if (filters.regex) {
        const regex = new RegExp(activeFilters.search, 'i');
        if (!regex.test(messageText) && !regex.test(loggerName)) return false;
      } else {
        const searchLower = String(activeFilters.search).toLowerCase();
        if (!messageText.toLowerCase().includes(searchLower) && !loggerName.toLowerCase().includes(searchLower)) return false;
      }
    } catch (e) {
      return false;
    }
  }

  return true;
}

function filterTailEntries() {
  if (!tailFeed) return;
  const entries = tailFeed.querySelectorAll('.tail-entry');
  let visibleCount = 0;
  entries.forEach(entryEl => {
    const index = parseInt(entryEl.dataset.index, 10);
    const entry = tailEntries.find(e => e._index === index);
    if (entry && checkTailEntryShouldShow(entry)) {
      entryEl.classList.remove('filtered-out');
      visibleCount++;
    } else {
      entryEl.classList.add('filtered-out');
    }
  });
}

function updateTailCounts() {
  const counts = { ALL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
  tailEntries.forEach(entry => {
    const level = entry.level || entry.logType || 'INFO';
    counts[level] = (counts[level] || 0) + 1;
    counts.ALL++;
  });
  if (document.getElementById('tailCountALL')) document.getElementById('tailCountALL').textContent = counts.ALL;
  if (document.getElementById('tailCountERROR')) document.getElementById('tailCountERROR').textContent = counts.ERROR;
  if (document.getElementById('tailCountWARN')) document.getElementById('tailCountWARN').textContent = counts.WARN;
  if (document.getElementById('tailCountINFO')) document.getElementById('tailCountINFO').textContent = counts.INFO;
  if (document.getElementById('tailCountDEBUG')) document.getElementById('tailCountDEBUG').textContent = counts.DEBUG;
}

function updateTailDropdownOptions() {
  if (tailPackageFilter && tailPackageFilter.value) {
    renderTailPackageOptions(tailPackageFilter.value);
  }
  if (tailLoggerFilter && tailLoggerFilter.value) {
    renderTailLoggerOptions(tailLoggerFilter.value);
  }
}

function renderTailFeed() {
  if (!tailFeed) return;
  tailFeed.innerHTML = '';
  tailEntries.forEach(entry => {
    if (checkTailEntryShouldShow(entry)) {
      addTailEntryToFeed(entry);
    }
  });
}

function scrollTailToTop() {
  if (tailFeed) {
    tailFeed.scrollTop = 0;
  }
  tailHasNewEntries = false;
  if (tailNewIndicator) tailNewIndicator.classList.add('hidden');
}

function exportTailBuffer(format) {
  const entriesToExport = Array.from(tailFeed.querySelectorAll('.tail-entry:not(.filtered-out)')).map(el => {
    const index = parseInt(el.dataset.index, 10);
    return tailEntries.find(e => e._index === index);
  }).filter(Boolean);

  if (!entriesToExport.length) {
    showToast('No entries to export', 'warning');
    return;
  }

  if (format === 'json') {
    downloadJson(entriesToExport, 'tail-export.json');
    showToast(`Exported ${entriesToExport.length} entries to JSON`, 'success');
  } else if (format === 'csv') {
    const csv = convertToCSV(entriesToExport);
    downloadText(csv, 'tail-export.csv', 'text/csv');
    showToast(`Exported ${entriesToExport.length} entries to CSV`, 'success');
  }
}

function copyTailEntry(index) {
  const entry = tailEntries.find(e => e._index === index);
  if (entry) {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2)).then(() => {
      showToast('Copied to clipboard', 'success');
    });
  }
}

function cssEscape(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function filterDropdown(input, resultsContainer, dataMap, renderFn) {
  const filter = input.value;
  renderFn(filter);
  if (resultsContainer) {
    resultsContainer.style.display = 'block';
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function convertToCSV(entries) {
  if (!entries.length) return '';
  const headers = ['timestamp', 'level', 'logger', 'message', 'thread', 'sourceFile'];
  const rows = entries.map(entry => {
    return headers.map(h => {
      const val = entry[h] || '';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

// Initialize tail panel
initTailPanel();
