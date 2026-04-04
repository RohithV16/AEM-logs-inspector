const filePathInput = document.getElementById('filePath');
const analyzeBtn = document.getElementById('analyzeBtn');
const sourceModeButtons = Array.from(document.querySelectorAll('[data-source-mode]'));
const localSourcePanel = document.getElementById('localSourcePanel');
const cloudManagerPanel = document.getElementById('cloudManagerPanel');
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
const cmCheckBtn = document.getElementById('cmCheckBtn');
const cmRefreshCacheBtn = document.getElementById('cmRefreshCacheBtn');
const cmTestConnectionBtn = document.getElementById('cmTestConnectionBtn');
const cmAnalyzeBtn = document.getElementById('cmAnalyzeBtn');
const cmProgressText = document.getElementById('cmProgressText');
const cmDownloadSummary = document.getElementById('cmDownloadSummary');
const cmStatusBanner = document.getElementById('cmStatusBanner');
const cmCacheStatus = document.getElementById('cmCacheStatus');
const cmCommandPreview = document.getElementById('cmCommandPreview');
const cmResultBadges = document.getElementById('cmResultBadges');
const cmHistoryList = document.getElementById('cmHistoryList');
const cmSetupBtn = document.getElementById('cmSetupBtn');
const cmSetupModeButtons = Array.from(document.querySelectorAll('[data-setup-mode]'));
const cmSetupStatus = document.getElementById('cmSetupStatus');
const cmSetupBrowserPanel = document.getElementById('cmSetupBrowserPanel');
const cmSetupOauthPanel = document.getElementById('cmSetupOauthPanel');
const cmSetupOrgId = document.getElementById('cmSetupOrgId');
const cmSetupBrowserProgramId = document.getElementById('cmSetupBrowserProgramId');
const cmSetupOauthProgramId = document.getElementById('cmSetupOauthProgramId');
const cmSetupOauthFile = document.getElementById('cmSetupOauthFile');
const cmSetupOauthJson = document.getElementById('cmSetupOauthJson');
const cmSetupPreview = document.getElementById('cmSetupPreview');
const cmSetupResult = document.getElementById('cmSetupResult');
const cmSetupRunBtn = document.getElementById('cmSetupRunBtn');
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
const themeButtons = Array.from(document.querySelectorAll('[data-theme-option]'));
const THEME_STORAGE_KEY = 'aem_themePreference';
const RAW_EVENTS_PAGE_SIZE_STORAGE_KEY = 'aem_rawEventsPerPage';
const CM_OUTPUT_DIRECTORY_STORAGE_KEY = 'aem_cmOutputDirectory';
const SOURCE_MODE_STORAGE_KEY = 'aem_sourceMode';
const CM_HISTORY_STORAGE_KEY = 'aem_cmHistory';
const CM_SELECTIONS_STORAGE_KEY = 'aem_cmSelections';
const CM_ONBOARDING_DISMISSED_KEY = 'aem_cmOnboardingDismissed';
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
let cloudManagerProgramsLoaded = false;
let cloudManagerPrerequisiteState = null;
let cloudManagerCommandPreviewPending = false;
let cloudManagerLogOptions = [];
let selectedCloudManagerLogs = [];
let currentCloudManagerTier = '';
let cloudManagerCacheMetadata = { refreshedAt: '', present: false };
let currentCloudManagerRunContext = null;
let currentCloudManagerSetupMode = 'browser';
let cloudManagerSetupAutoPrompted = false;
let selectedLoggers = [];
let selectedPackages = [];
let allLoggers = {};  // Store all loggers for cascading filter
let allPackages = {};
let allThreads = {};
let allExceptions = {};
let packageThreadsByPackage = {};
let packageExceptionsByPackage = {};
let visiblePackageOptionCount = 0;
let visibleLoggerOptionCount = 0;
let advancedRulesState = [];
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'aem_sidebarCollapsed';
const SIDEBAR_COLLAPSE_BREAKPOINT = 768;
let sidebarCollapsedPreference = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';

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
  if (currentAnalysisMode === 'multi-error') return '';
  if (currentAnalyzedFilePath) return currentAnalyzedFilePath;
  if (currentSourceMode === 'local') return filePathInput.value.trim();
  return '';
}

function setCurrentAnalyzedFilePath(filePath) {
  currentAnalyzedFilePath = filePath ? String(filePath).trim() : '';
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
  if (!cloudManagerCacheMetadata.present) {
    cmCacheStatus.textContent = 'Cache missing. Open Cloud Manager Setup to configure aio and create the first cache.';
    return;
  }

  const refreshedAt = cloudManagerCacheMetadata.refreshedAt
    ? new Date(cloudManagerCacheMetadata.refreshedAt).toLocaleString()
    : 'unknown';
  cmCacheStatus.textContent = `Cache ready. Last refreshed: ${refreshedAt}.`;
}

function resetCloudManagerSummary() {
  if (!cmDownloadSummary) return;
  cmDownloadSummary.innerHTML = '';
  cmDownloadSummary.classList.add('hidden');
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

function setCloudManagerSetupStatus(message = '') {
  if (!cmSetupStatus) return;
  const text = String(message || '').trim();
  if (!text) {
    cmSetupStatus.textContent = '';
    cmSetupStatus.classList.add('hidden');
    return;
  }

  cmSetupStatus.textContent = text;
  cmSetupStatus.classList.remove('hidden');
}

function getCloudManagerSetupPreviewPath() {
  return '~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json';
}

function extractCloudManagerOauthJsonText(value = '') {
  const text = String(value || '').trim().replace(/^\uFEFF/, '');
  if (!text) return '';

  const fencedMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace >= firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

function parseCloudManagerOauthJsonInput(rawText = '') {
  const text = extractCloudManagerOauthJsonText(rawText);
  if (!text) {
    return { ok: false, error: 'Paste or load the Adobe OAuth JSON first.' };
  }

  try {
    const parsed = JSON.parse(text);
    const clientSecrets = Array.isArray(parsed.CLIENT_SECRETS)
      ? parsed.CLIENT_SECRETS
      : Array.isArray(parsed.client_secrets)
        ? parsed.client_secrets
        : [];
    const scopes = Array.isArray(parsed.SCOPES)
      ? parsed.SCOPES
      : Array.isArray(parsed.scopes)
        ? parsed.scopes
        : [];

    const normalized = {
      orgId: String(parsed.ORG_ID || parsed.ims_org_id || parsed.IMS_ORG_ID || '').trim(),
      clientId: String(parsed.CLIENT_ID || parsed.client_id || '').trim(),
      clientSecret: String(clientSecrets[0] || parsed.CLIENT_SECRET || parsed.client_secret || '').trim(),
      technicalAccountId: String(parsed.TECHNICAL_ACCOUNT_ID || parsed.technical_account_id || '').trim(),
      technicalAccountEmail: String(parsed.TECHNICAL_ACCOUNT_EMAIL || parsed.technical_account_email || '').trim(),
      scopes: scopes.map(scope => String(scope || '').trim()).filter(Boolean)
    };

    return { ok: true, raw: parsed, normalized };
  } catch (error) {
    return { ok: false, error: `Invalid OAuth JSON: ${error.message}` };
  }
}

function getCloudManagerSetupPayload() {
  if (currentCloudManagerSetupMode === 'oauth') {
    return {
      mode: 'oauth',
      oauthConfigJson: cmSetupOauthJson?.value || '',
      programId: cmSetupOauthProgramId?.value.trim() || ''
    };
  }

  return {
    mode: 'browser',
    orgId: cmSetupOrgId?.value.trim() || '',
    programId: cmSetupBrowserProgramId?.value.trim() || ''
  };
}

function renderCloudManagerSetupMode() {
  const isOauth = currentCloudManagerSetupMode === 'oauth';
  cmSetupModeButtons.forEach((button) => {
    const active = button.dataset.setupMode === currentCloudManagerSetupMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  if (cmSetupBrowserPanel) cmSetupBrowserPanel.classList.toggle('hidden', isOauth);
  if (cmSetupOauthPanel) cmSetupOauthPanel.classList.toggle('hidden', !isOauth);
}

function renderCloudManagerSetupPreview() {
  if (!cmSetupPreview) return;
  const payload = getCloudManagerSetupPayload();
  const blocks = [];

  if (payload.mode === 'browser') {
    const commands = [
      {
        label: 'Authenticate with Adobe',
        note: 'This opens the Adobe browser login flow using your own identity.',
        command: 'aio auth:login'
      },
      payload.orgId
        ? {
            label: 'Set Cloud Manager org globally',
            note: 'Stores the Cloud Manager org in your global aio config, not in this repo.',
            command: `aio config:set cloudmanager_orgid ${escapeHtml(payload.orgId)} --global`
          }
        : null,
      payload.programId
        ? {
            label: 'Set default program globally',
            note: 'Optional, but useful for default CLI context.',
            command: `aio config:set cloudmanager_programid ${escapeHtml(payload.programId)} --global`
          }
        : null
    ].filter(Boolean);

    blocks.push(`
      <div class="cloudmanager-setup-preview-block">
        <strong>What the app will run</strong>
        <div class="cloudmanager-setup-steps">
          ${commands.map((step) => `
            <div class="cloudmanager-setup-preview-item">
              <strong>${step.label}</strong>
              <span>${step.note}</span>
              <code>${step.command}</code>
            </div>
          `).join('')}
          <div class="cloudmanager-setup-preview-item">
            <strong>Create the first Cloud Manager cache</strong>
            <span>After setup succeeds, the app immediately loads programs and environments into the user-profile cache.</span>
          </div>
        </div>
      </div>
    `);
  } else {
    const parsed = parseCloudManagerOauthJsonInput(payload.oauthConfigJson);
    if (!parsed.ok) {
      cmSetupPreview.innerHTML = `
        <div class="cloudmanager-setup-preview-block">
          <strong>OAuth JSON required</strong>
          <div class="cloudmanager-setup-preview-item">
            <span>${escapeHtml(parsed.error)}</span>
          </div>
        </div>
      `;
      return;
    }

    const configPreview = {
      client_id: parsed.normalized.clientId || 'value from Adobe I/O Console',
      client_secrets: [parsed.normalized.clientSecret ? '********' : 'client secret'],
      technical_account_id: parsed.normalized.technicalAccountId || 'technical account id',
      technical_account_email: parsed.normalized.technicalAccountEmail || 'technical account email',
      ims_org_id: parsed.normalized.orgId || 'ims org id',
      scopes: parsed.normalized.scopes.length ? parsed.normalized.scopes : ['openid', 'AdobeID', 'read_organizations', 'additional_info.projectedProductContext', 'read_pc.dma_aem_ams'],
      oauth_enabled: true
    };
    const commands = [
      `aio config:set ims.contexts.aio-cli-plugin-cloudmanager ${getCloudManagerSetupPreviewPath()} --file --json --global`,
      parsed.normalized.orgId ? `aio config:set cloudmanager_orgid ${escapeHtml(parsed.normalized.orgId)} --global` : null,
      payload.programId ? `aio config:set cloudmanager_programid ${escapeHtml(payload.programId)} --global` : null
    ].filter(Boolean);

    blocks.push(`
      <div class="cloudmanager-setup-preview-block">
        <strong>OAuth config written under your profile</strong>
        <div class="cloudmanager-setup-preview-item">
          <span>Path</span>
          <code>${getCloudManagerSetupPreviewPath()}</code>
        </div>
        <div class="cloudmanager-setup-preview-item">
          <span>Config JSON</span>
          <code>${escapeHtml(JSON.stringify(configPreview, null, 2))}</code>
        </div>
      </div>
    `);
    blocks.push(`
      <div class="cloudmanager-setup-preview-block">
        <strong>What the app will run</strong>
        <div class="cloudmanager-setup-steps">
          ${commands.map((command) => `
            <div class="cloudmanager-setup-preview-item">
              <strong>Apply global aio config</strong>
              <code>${command}</code>
            </div>
          `).join('')}
          <div class="cloudmanager-setup-preview-item">
            <strong>Create the first Cloud Manager cache</strong>
            <span>After setup succeeds, the app immediately loads programs and environments into the user-profile cache.</span>
          </div>
        </div>
      </div>
    `);
  }

  cmSetupPreview.innerHTML = blocks.join('');
}

function resetCloudManagerSetupResult() {
  if (!cmSetupResult) return;
  cmSetupResult.innerHTML = '';
  cmSetupResult.classList.add('hidden');
}

function renderCloudManagerSetupResult(result = {}, errorMessage = '') {
  if (!cmSetupResult) return;
  const steps = Array.isArray(result.steps) ? result.steps : [];
  const summary = errorMessage
    ? `<div><strong>${escapeHtml(errorMessage)}</strong></div>`
    : `<div><strong>Cloud Manager setup completed.</strong></div>`;
  const items = steps.length
    ? `<div class="cloudmanager-setup-steps">${steps.map((step) => `
        <div class="cloudmanager-setup-step ${step.ok ? 'ok' : 'fail'}">
          <strong>${escapeHtml(step.label || step.id || 'Step')}</strong>
          ${step.command ? `<code>${escapeHtml(step.command)}</code>` : ''}
          <span>${escapeHtml(step.detail || '')}</span>
        </div>
      `).join('')}</div>`
    : '<div>No setup steps were returned.</div>';

  cmSetupResult.innerHTML = `${summary}${items}`;
  cmSetupResult.classList.remove('hidden');
}

function openCloudManagerSetupPopover() {
  if (!cloudManagerPanel) return;
  // Switch to Setup tab
  switchCloudManagerTab('setup');
}

function closeCloudManagerSetupPopover() {
  if (!cloudManagerPanel) return;
  // Switch back to Download & Analyze tab
  switchCloudManagerTab('download');
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
  }
}

function restoreCloudManagerTabState() {
  const savedTab = localStorage.getItem('aem_cmActiveTab') || 'download';
  switchCloudManagerTab(savedTab);
  
  const expandedState = localStorage.getItem('aem_cmAdvancedExpanded');
  if (expandedState === 'true') {
    const accordion = document.querySelector('.cloudmanager-advanced-settings');
    if (accordion) {
      accordion.classList.add('expanded');
    }
  }
}

function maybeOpenCloudManagerSetupPopover() {
  if (currentSourceMode !== 'cloudmanager' || cloudManagerCacheMetadata.present || cloudManagerSetupAutoPrompted) {
    return;
  }

  cloudManagerSetupAutoPrompted = true;
  openCloudManagerSetupPopover();
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
  const selectedFile = currentCloudManagerRunContext?.analyzedFile || data.analyzedFile || '';
  const fileItems = files.length
    ? `<div class="cloudmanager-download-files">${files.map((file) => {
        const when = file.extractedDate || file.modifiedAt?.slice(0, 10) || '';
        const label = [file.service, file.logName].filter(Boolean).join(' / ');
        const isSelected = file.filePath === selectedFile;
        const supportLabel = file.supported === false
          ? `Unsupported: ${file.unsupportedReason || 'Unsupported log format'}`
          : file.logFamily
            ? `Detected: ${file.logFamily}`
            : '';
        return `
          <div class="cloudmanager-download-file ${isSelected ? 'active' : ''}">
            <div>
              <strong>${escapeHtml(file.fileName || file.filePath)}</strong>
              ${label ? `<span>${escapeHtml(label)}</span>` : ''}
              ${when ? `<span>${escapeHtml(when)}</span>` : ''}
              ${supportLabel ? `<span>${escapeHtml(supportLabel)}</span>` : ''}
              <code>${escapeHtml(file.filePath)}</code>
            </div>
            <button class="upload-btn secondary cm-download-analyze" type="button" data-file-path="${escapeHtml(file.filePath)}" ${file.supported === false ? 'disabled' : ''}>Analyze</button>
          </div>
        `;
      }).join('')}</div>`
    : '<div>No downloaded files were returned.</div>';

  cmDownloadSummary.innerHTML = `
    <div><strong>Downloaded ${files.length}</strong> Cloud Manager file(s).</div>
    <div>Analyzed file: <code>${escapeHtml(data.analyzedFile || '')}</code></div>
    <div>Saved under: <code>${escapeHtml(data.outputDirectory || '')}</code></div>
    ${dates ? `<div>Extracted dates: <span>${escapeHtml(dates)}</span></div>` : ''}
    ${fileItems}
  `;
  cmDownloadSummary.classList.remove('hidden');
}

function renderCloudManagerPrerequisiteSummary(data) {
  if (!cmDownloadSummary) return;
  const checks = Array.isArray(data.checks) ? data.checks : [];
  const items = checks.map((check) => {
    const state = check.ok ? 'PASS' : 'FAIL';
    const remediation = check.remediationCommand
      ? `<div><code>${escapeHtml(check.remediationCommand)}</code></div>`
      : '';
    return `<div><strong>${escapeHtml(check.label)}:</strong> ${state} <span>${escapeHtml(check.detail || '')}</span>${remediation}</div>`;
  }).join('');

  cmDownloadSummary.innerHTML = `
    <div><strong>${escapeHtml(data.summary || 'Cloud Manager prerequisite check complete.')}</strong></div>
    ${items || '<div>No prerequisite details returned.</div>'}
  `;
  cmDownloadSummary.classList.remove('hidden');
}

function renderCloudManagerResultBadges(data = {}, context = {}) {
  if (!cmResultBadges) return;
  const badges = [];
  const source = context.source || data.source;
  if (source) badges.push(`Source: ${source}`);
  if (context.programName) badges.push(`Program: ${context.programName}`);
  if (context.environmentName) badges.push(`Environment: ${context.environmentName}`);
  if (Array.isArray(context.selections) && context.selections.length) {
    badges.push(`Logs: ${context.selections.map(entry => `${entry.service}/${entry.logName}`).join(', ')}`);
  }
  if (context.days) badges.push(`Days: ${context.days}`);
  if (context.outputDirectory) badges.push(`Folder: ${context.outputDirectory}`);
  if (context.analyzedFile || data.analyzedFile) badges.push(`Analyzed: ${context.analyzedFile || data.analyzedFile}`);

  if (!badges.length) {
    cmResultBadges.innerHTML = '';
    cmResultBadges.classList.add('hidden');
    return;
  }

  cmResultBadges.innerHTML = badges.map((badge) => `<span class="cloudmanager-badge">${escapeHtml(badge)}</span>`).join('');
  cmResultBadges.classList.remove('hidden');
}

function renderCloudManagerHistory() {
  if (!cmHistoryList) return;
  const entries = readCloudManagerHistory();
  if (!entries.length) {
    cmHistoryList.innerHTML = '<div class="cloudmanager-hint">No Cloud Manager runs yet.</div>';
    return;
  }

  cmHistoryList.innerHTML = entries.map((entry, index) => `
    <div class="cloudmanager-history-item" data-history-index="${index}">
      <div>
        <strong>${escapeHtml(entry.programName || entry.programId || 'Cloud Manager run')}</strong>
        <span>${escapeHtml(entry.environmentName || entry.environmentId || '')}</span><br>
        <span>${escapeHtml((entry.selections || []).map(item => `${item.service}/${item.logName}`).join(', '))}</span><br>
        <code>${escapeHtml(entry.analyzedFile || '')}</code>
      </div>
      <div class="cloudmanager-history-actions">
        <button class="upload-btn secondary cm-history-reopen" type="button">Reopen</button>
      </div>
    </div>
  `).join('');
}

function pushCloudManagerHistoryEntry(entry) {
  const history = readCloudManagerHistory();
  history.unshift(entry);
  writeCloudManagerHistory(history);
  renderCloudManagerHistory();
}

async function analyzeSavedCloudManagerFile(filePath, runContext = {}) {
  if (!filePath) return;

  setCloudManagerStatus('Rendering analysis results from the selected Cloud Manager file...');
  resetCloudManagerSummary();
  document.getElementById('emptyState').classList.add('hidden');

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze the selected Cloud Manager file.');
    }

    currentCloudManagerRunContext = {
      ...currentCloudManagerRunContext,
      ...runContext,
      source: 'cloudmanager',
      analyzedFile: filePath
    };
    renderCloudManagerSummary({
      ...runContext,
      analyzedFile: filePath,
      downloadedFilesDetailed: runContext.downloadedFilesDetailed || [],
      downloadedFiles: runContext.downloadedFiles || [],
      outputDirectory: runContext.outputDirectory || ''
    });
    renderCloudManagerResultBadges(data, currentCloudManagerRunContext);
    handleAnalysisComplete(data, {
      analyzedFile: filePath,
      source: 'cloudmanager'
    });
    setCloudManagerStatus('');
  } catch (error) {
    setCloudManagerStatus('');
    showError(error.message);
  }
}

function buildCloudManagerSelectionLabels() {
  const programName = cmProgramSelect?.selectedOptions?.[0]?.textContent || '';
  const environmentName = cmEnvironmentSelect?.selectedOptions?.[0]?.textContent || '';
  return { programName, environmentName };
}

function updateCloudManagerHintState() {
  if (cmProgramHint) {
    cmProgramHint.textContent = cloudManagerCacheMetadata.present
      ? 'Choose a program from the cached metadata.'
      : 'Open setup first, then let the app create the cache.';
  }
  if (cmEnvironmentHint) {
    cmEnvironmentHint.textContent = cmProgramSelect?.value
      ? 'Choose an environment from the cached program data.'
      : 'Choose a cached program to load environments.';
  }
  if (cmLogHint) {
    cmLogHint.textContent = cmEnvironmentSelect?.value
      ? 'Choose a tier tab, then select one or more logs to download.'
      : 'Choose an environment to load downloadable logs.';
  }
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
}

function getSelectedCloudManagerLogOptions() {
  return cloudManagerLogOptions.filter((entry) => {
    const key = `${entry.service}::${entry.name}`;
    return selectedCloudManagerLogs.some((selected) => `${selected.service}::${selected.logName}` === key);
  });
}

async function refreshCloudManagerCommandPreview() {
  if (!cmCommandPreview) return;
  const state = getCloudManagerSelectionState();
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
    cmCommandPreview.innerHTML = `
      <div><strong>Command preview</strong></div>
      <div>${escapeHtml(data.estimatedDateRange?.label || '')}</div>
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
  if (!outputDirectory) {
    if (cmOutputDirectoryHint) {
      cmOutputDirectoryHint.textContent = 'Provide a writable local folder for Cloud Manager downloads.';
    }
    updateCloudManagerActionState();
    return false;
  }

  try {
    const response = await fetch('/api/cloudmanager/validate-output-directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputDirectory })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Invalid output directory.');
    }

    if (cmOutputDirectoryHint) {
      cmOutputDirectoryHint.textContent = `Folder looks valid: ${data.resolved}`;
    }
    updateCloudManagerActionState(true);
    return true;
  } catch (error) {
    if (cmOutputDirectoryHint) {
      cmOutputDirectoryHint.textContent = error.message;
    }
    updateCloudManagerActionState(false);
    return false;
  }
}

function updateCloudManagerActionState(outputDirectoryValid) {
  const hasSelection = Boolean(cloudManagerCacheMetadata.present && cmProgramSelect?.value && cmEnvironmentSelect?.value && selectedCloudManagerLogs.length);
  const outputReady = typeof outputDirectoryValid === 'boolean'
    ? outputDirectoryValid
    : Boolean(cmOutputDirectoryInput?.value.trim());
  const prerequisitesPassed = Boolean(cloudManagerPrerequisiteState?.ok);
  if (cmAnalyzeBtn) {
    cmAnalyzeBtn.disabled = !(prerequisitesPassed && hasSelection && outputReady);
  }
  updateCloudManagerHintState();
}

function restoreCloudManagerSelections() {
  const saved = safeJsonParse(localStorage.getItem(CM_SELECTIONS_STORAGE_KEY), {});
  if (cmDaysInput && saved.days) cmDaysInput.value = String(saved.days);
  if (cmOutputDirectoryInput && saved.outputDirectory) cmOutputDirectoryInput.value = saved.outputDirectory;
  currentCloudManagerTier = saved.tier || '';
}

function setSourceMode(mode, { persist = true } = {}) {
  currentSourceMode = mode === 'cloudmanager' ? 'cloudmanager' : 'local';

  sourceModeButtons.forEach((button) => {
    const isActive = button.dataset.sourceMode === currentSourceMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  if (localSourcePanel) localSourcePanel.classList.toggle('hidden', currentSourceMode !== 'local');
  if (cloudManagerPanel) cloudManagerPanel.classList.toggle('hidden', currentSourceMode !== 'cloudmanager');
  if (tailBtn) {
    tailBtn.disabled = currentSourceMode !== 'local';
    tailBtn.title = currentSourceMode === 'local'
      ? 'Watch a log file for new entries in real-time'
      : 'Tail is only available for local file paths';
  }

  if (persist) {
    localStorage.setItem(SOURCE_MODE_STORAGE_KEY, currentSourceMode);
  }

  if (currentSourceMode === 'local') {
    currentCloudManagerRunContext = null;
    renderCloudManagerResultBadges();
  }

  if (currentSourceMode === 'cloudmanager') {
    resetCloudManagerSummary();
    setCloudManagerStatus('');
    restoreCloudManagerSelections();
    updateCloudManagerCacheStatus();
    updateCloudManagerActionState();
    renderCloudManagerHistory();
    ensureCloudManagerProgramsLoaded();
    maybeOpenCloudManagerSetupPopover();
  }
}

async function ensureCloudManagerProgramsLoaded() {
  const previousMarkup = cmProgramSelect.innerHTML;
  const hadExistingOptions = cmProgramSelect.options.length > 1;
  cmProgramSelect.disabled = true;
  cmProgramSelect.innerHTML = '<option value="">Loading programs...</option>';
  setCloudManagerStatus('Loading cached Cloud Manager programs...');

  try {
    const response = await fetch('/api/cloudmanager/programs');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load Cloud Manager programs');
    }

    cloudManagerCacheMetadata = {
      refreshedAt: data.refreshedAt || '',
      present: Array.isArray(data.programs) && data.programs.length > 0
    };
    updateCloudManagerCacheStatus();
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
      await loadCloudManagerEnvironments(saved.programId);
    }
    cmProgramSelect.disabled = false;
    cloudManagerProgramsLoaded = true;
    setCloudManagerStatus((data.programs || []).length ? '' : 'Cloud Manager cache is empty. Refresh cache to load programs.');
    updateCloudManagerActionState();
  } catch (error) {
    cloudManagerCacheMetadata = { refreshedAt: '', present: false };
    updateCloudManagerCacheStatus();
    cmProgramSelect.innerHTML = hadExistingOptions
      ? previousMarkup
      : '<option value="">Refresh cache to load programs</option>';
    cmProgramSelect.disabled = false;
    setCloudManagerStatus(/cache is empty/i.test(error.message) ? error.message : '');
    if (!/cache is empty/i.test(error.message)) {
      showError(error.message);
    }
    maybeOpenCloudManagerSetupPopover();
  }
}

async function loadCloudManagerEnvironments(programId) {
  cmEnvironmentSelect.disabled = true;
  cmEnvironmentSelect.innerHTML = '<option value="">Loading environments...</option>';
  cloudManagerLogOptions = [];
  selectedCloudManagerLogs = [];
  renderCloudManagerLogOptions();
  setCloudManagerStatus('Loading environments for the selected program...');

  try {
    const response = await fetch(`/api/cloudmanager/programs/${encodeURIComponent(programId)}/environments`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load environments');
    }

    cloudManagerCacheMetadata.refreshedAt = data.refreshedAt || cloudManagerCacheMetadata.refreshedAt;
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
      await loadCloudManagerLogOptions(programId, saved.environmentId);
    }
    setCloudManagerStatus((data.environments || []).length ? '' : 'No environments were returned for the selected program.');
  } catch (error) {
    cmEnvironmentSelect.innerHTML = '<option value="">No cached environments available</option>';
    setCloudManagerStatus(/cache is empty/i.test(error.message) ? error.message : '');
    if (!/cache is empty/i.test(error.message)) {
      showError(error.message);
    }
  }
}

async function loadCloudManagerLogOptions(programId, environmentId) {
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
    updateCloudManagerActionState();
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
  });
});

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
  });
}

if (cmTierTabs) {
  cmTierTabs.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-tier]');
    if (!button) return;
    currentCloudManagerTier = button.dataset.tier || '';
    persistCloudManagerSelectionState();
    renderCloudManagerLogOptions();
    await refreshCloudManagerCommandPreview();
  });
}

if (cmDaysInput) {
  cmDaysInput.addEventListener('input', async () => {
    persistCloudManagerSelectionState();
    await refreshCloudManagerCommandPreview();
    updateCloudManagerActionState();
  });
}

if (cmOutputDirectoryInput) {
  cmOutputDirectoryInput.addEventListener('input', async () => {
    persistCloudManagerSelectionState();
    await refreshCloudManagerCommandPreview();
    updateCloudManagerActionState();
  });

  cmOutputDirectoryInput.addEventListener('blur', async () => {
    await validateCloudManagerOutputDirectory();
  });
}

if (cmSetupBtn) {
  cmSetupBtn.addEventListener('click', () => {
    openCloudManagerSetupPopover();
  });
}

cmSetupModeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentCloudManagerSetupMode = button.dataset.setupMode === 'oauth' ? 'oauth' : 'browser';
    renderCloudManagerSetupMode();
    renderCloudManagerSetupPreview();
    resetCloudManagerSetupResult();
  });
});

[
  cmSetupOrgId,
  cmSetupBrowserProgramId,
  cmSetupOauthProgramId,
  cmSetupOauthJson
].filter(Boolean).forEach((input) => {
  input.addEventListener('input', () => {
    renderCloudManagerSetupPreview();
    resetCloudManagerSetupResult();
  });
});

if (cmSetupOauthFile) {
  cmSetupOauthFile.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !cmSetupOauthJson) return;

    try {
      const text = await file.text();
      cmSetupOauthJson.value = text;
      renderCloudManagerSetupPreview();
      resetCloudManagerSetupResult();
      setCloudManagerSetupStatus(`Loaded OAuth JSON from ${file.name}.`);
    } catch (error) {
      setCloudManagerSetupStatus(`Failed to read OAuth JSON file: ${error.message}`);
    }
  });
}

if (cmSetupRunBtn) {
  cmSetupRunBtn.addEventListener('click', async () => {
    const payload = getCloudManagerSetupPayload();
    cmSetupRunBtn.disabled = true;
    cmSetupRunBtn.textContent = 'Running Setup...';
    setCloudManagerSetupStatus('Applying aio configuration and creating the Cloud Manager cache...');
    resetCloudManagerSetupResult();

    try {
      const response = await fetch('/api/cloudmanager/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!data.success) {
        renderCloudManagerSetupResult(data, data.error || 'Cloud Manager setup failed.');
        setCloudManagerSetupStatus(data.error || 'Cloud Manager setup failed.');
        return;
      }

      renderCloudManagerSetupResult(data, '');
      cloudManagerPrerequisiteState = data.prerequisites || cloudManagerPrerequisiteState;
      cloudManagerCacheMetadata = {
        refreshedAt: data.cache?.refreshedAt || '',
        present: Boolean(data.cache?.totalPrograms)
      };
      cloudManagerProgramsLoaded = false;
      updateCloudManagerCacheStatus();
      renderCloudManagerPrerequisiteSummary({
        summary: data.cache?.environmentErrors?.length
          ? `Cloud Manager setup completed. Cache created with ${data.cache.totalPrograms || 0} program(s), but some environment lists could not be loaded yet.`
          : 'Cloud Manager setup completed and the cache was created.',
        checks: data.steps || []
      });
      await ensureCloudManagerProgramsLoaded();
      setCloudManagerStatus(data.cache?.environmentErrors?.length
        ? `Cloud Manager setup completed. Cache created with ${data.cache?.totalPrograms || 0} program(s), but ${data.cache.environmentErrors.length} program(s) have no cached environments yet.`
        : `Cloud Manager setup complete. Cache created with ${data.cache?.totalPrograms || 0} program(s).`);
      showToast(data.cache?.environmentErrors?.length
        ? 'Cloud Manager setup completed with cache warnings'
        : 'Cloud Manager setup completed', data.cache?.environmentErrors?.length ? 'warning' : 'success');
      closeCloudManagerSetupPopover();
    } catch (error) {
      renderCloudManagerSetupResult({}, error.message);
      setCloudManagerSetupStatus(error.message);
    } finally {
      cmSetupRunBtn.disabled = false;
      cmSetupRunBtn.textContent = 'Run Setup & Create Cache';
      updateCloudManagerActionState();
    }
  });
}

/* === Cloud Manager Tab Navigation === */
document.querySelectorAll('.cloudmanager-tab').forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    const tabName = tabBtn.dataset.tab;
    switchCloudManagerTab(tabName);
  });
});

/* === Cloud Manager Advanced Settings Accordion === */
const advancedSettingsToggle = document.querySelector('.cloudmanager-advanced-settings-toggle');
if (advancedSettingsToggle) {
  advancedSettingsToggle.addEventListener('click', toggleCloudManagerAdvancedSettings);
}

document.addEventListener('keydown', (event) => {
  // Escape key can close setup tab in future if needed
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
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d{3})?)?$/);
  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2]}`;
  }
  const spaceMatch = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2}(?:\.\d{3})?)?$/);
  if (spaceMatch) {
    return `${spaceMatch[1]} ${spaceMatch[2]}`;
  }
  return text;
}

function normalizeDateTimeForApi(value) {
  if (!value) return '';
  const text = String(value).trim();
  const spaceMatch = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2}(?:\.\d{3})?)?$/);
  if (spaceMatch) {
    return `${spaceMatch[1]}T${spaceMatch[2]}`;
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

  const firstTime = `${first.date} ${first.hour}:00`;
  const lastTime = `${last.date} ${last.hour}:59`;

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

function parseMultiErrorInput(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);
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
    selectedLoggers: [...selectedLoggers],
    selectedPackages: [...selectedPackages],
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
    if (matchingPackage) selectedPackages.push(preset.package);
    else packageFilter.value = preset.package;
  }

  if (preset.logger) {
    const matchingLogger = Object.prototype.hasOwnProperty.call(allLoggers, preset.logger);
    if (matchingLogger) selectedLoggers.push(preset.logger);
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
  selectedLoggers.splice(0, selectedLoggers.length);
  selectedPackages.splice(0, selectedPackages.length);
  clearDropdownSearchInputs();
  if (threadSelect) threadSelect.value = '';
  if (exceptionSelect) exceptionSelect.value = '';
  categoryFilter.value = '';
  if (!preserveDates) {
    startDate.value = '';
    endDate.value = '';
  }
  setActiveErrorLevel('ALL');
}

function applyErrorPresetState(preset = {}) {
  selectedPackages.splice(0, selectedPackages.length);
  selectedLoggers.splice(0, selectedLoggers.length);
  clearDropdownSearchInputs();

  selectMultiValues(Object.keys(allPackages), selectedPackages, preset.selectedPackages);
  applyCurrentSelectionsToFilterUI();

  if (preset.selectedLoggers?.length) {
    selectMultiValues(Object.keys(allLoggers), selectedLoggers, preset.selectedLoggers);
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
  const filePath = filePathInput.value.trim();
  const multiPaths = parseMultiErrorInput(filePath);

  if (multiPaths.length > 1) {
    await analyzeBatchInput(multiPaths);
    return;
  }

  if (filePath) {
    localStorage.setItem('aem_lastPath', filePath);
    await analyzeFilePath(filePath);
  } else {
    showToast('Please enter a file path', 'warning');
    return;
  }
});

if (cmAnalyzeBtn) {
  cmAnalyzeBtn.addEventListener('click', async () => {
    const programId = cmProgramSelect.value;
    const environmentId = cmEnvironmentSelect.value;
    const outputDirectory = cmOutputDirectoryInput.value.trim();
    const days = cmDaysInput.value.trim() || '1';

    if (!programId || !environmentId || !selectedCloudManagerLogs.length) {
      showToast('Select a program, environment, and at least one log option', 'warning');
      return;
    }

    if (!outputDirectory || !(await validateCloudManagerOutputDirectory())) {
      showToast('Enter a local download folder', 'warning');
      return;
    }

    localStorage.setItem(CM_OUTPUT_DIRECTORY_STORAGE_KEY, outputDirectory);
    await analyzeCloudManagerSelection({
      programId,
      environmentId,
      selections: [...selectedCloudManagerLogs],
      days,
      outputDirectory
    });
  });
}

if (cmCheckBtn) {
  cmCheckBtn.addEventListener('click', async () => {
    cmCheckBtn.disabled = true;
    cmCheckBtn.textContent = 'Checking...';
    setCloudManagerStatus('Checking aio, Cloud Manager plugin, and access...');
    resetCloudManagerSummary();

    try {
      const response = await fetch('/api/cloudmanager/check-prerequisites');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to check Cloud Manager prerequisites');
      }

      cloudManagerPrerequisiteState = data;
      renderCloudManagerPrerequisiteSummary(data);
      setCloudManagerStatus(data.ok
        ? 'Cloud Manager prerequisites look good.'
        : 'Cloud Manager prerequisite check found issues.');
      if (!data.ok) {
        maybeOpenCloudManagerSetupPopover();
      }
      updateCloudManagerActionState();
    } catch (error) {
      setCloudManagerStatus('');
      showError(error.message);
    } finally {
      cmCheckBtn.disabled = false;
      cmCheckBtn.textContent = 'Check Prerequisites';
    }
  });
}

if (cmRefreshCacheBtn) {
  cmRefreshCacheBtn.addEventListener('click', async () => {
    cmRefreshCacheBtn.disabled = true;
    cmRefreshCacheBtn.textContent = 'Refreshing...';
    setCloudManagerStatus('Refreshing Cloud Manager cache from aio...');

    try {
      const response = await fetch('/api/cloudmanager/refresh-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to refresh Cloud Manager cache');
      }

      cloudManagerCacheMetadata = {
        refreshedAt: data.refreshedAt || '',
        present: Boolean(data.totalPrograms)
      };
      cloudManagerProgramsLoaded = false;
      updateCloudManagerCacheStatus();
      await ensureCloudManagerProgramsLoaded();
      setCloudManagerStatus(data.environmentErrors?.length
        ? `Cloud Manager cache refreshed. Loaded ${data.totalPrograms || 0} program(s), but ${data.environmentErrors.length} program(s) could not load environments.`
        : `Cloud Manager cache refreshed. Loaded ${data.totalPrograms || 0} program(s).`);
    } catch (error) {
      showError(error.message);
      setCloudManagerStatus('');
    } finally {
      cmRefreshCacheBtn.disabled = false;
      cmRefreshCacheBtn.textContent = 'Refresh Cache';
    }
  });
}

if (cmTestConnectionBtn) {
  cmTestConnectionBtn.addEventListener('click', async () => {
    cmTestConnectionBtn.disabled = true;
    cmTestConnectionBtn.textContent = 'Testing...';
    setCloudManagerStatus('Testing Cloud Manager connectivity...');

    try {
      const response = await fetch('/api/cloudmanager/check-prerequisites');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to test Cloud Manager connection');
      }

      cloudManagerPrerequisiteState = data;
      const accessCheck = (data.checks || []).find((check) => check.id === 'auth');
      renderCloudManagerPrerequisiteSummary({
        summary: accessCheck?.ok
          ? 'Cloud Manager connection test passed.'
          : 'Cloud Manager connection test failed.',
        checks: accessCheck ? [accessCheck] : []
      });
      setCloudManagerStatus(accessCheck?.ok
        ? 'Cloud Manager connection looks healthy.'
        : 'Cloud Manager connection test found issues.');
      updateCloudManagerActionState();
    } catch (error) {
      setCloudManagerStatus('');
      showError(error.message);
    } finally {
      cmTestConnectionBtn.disabled = false;
      cmTestConnectionBtn.textContent = 'Test Connection';
    }
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
  progressText.textContent = 'Analyzing error files...';
  document.getElementById('emptyState').classList.add('hidden');

  try {
    const response = await fetch('/api/analyze/multi-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, filters: { advancedRules: advancedRulesState } })
    });
    const data = await response.json();

    if (!data.success) {
      showError(data.error || 'Multi-error analysis failed');
      return;
    }

    handleMultiErrorAnalysisComplete(data, input);
  } catch (error) {
    showError('Multi-error analysis failed: ' + error.message);
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

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.type === 'progress') {
      const lines = data.totalLines ? data.totalLines.toLocaleString() : '0';
      progressText.textContent = `Analyzing... ${data.percent || 0}% (${lines} lines)`;
    }

    if (data.type === 'complete') {
      ws.close();
      handleAnalysisComplete(data, { analyzedFile: filePath, source: 'local' });
      analyzeBtn.textContent = 'Analyze';
      analyzeBtn.disabled = false;
      progressText.classList.add('hidden');
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
  cmAnalyzeBtn.textContent = 'Downloading...';
  cmAnalyzeBtn.disabled = true;
  cmProgressText.classList.remove('hidden');
  cmProgressText.textContent = 'Downloading log files from Cloud Manager...';
  setCloudManagerStatus('Downloading logs and waiting for analysis results...');
  document.getElementById('emptyState').classList.add('hidden');
  resetCloudManagerSummary();

  try {
    const response = await fetch('/api/cloudmanager/download-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    const data = await response.json();

    if (!data.success) {
      setCloudManagerStatus('');
      showError(data.error || 'Cloud Manager analysis failed');
      return;
    }

    cmProgressText.textContent = 'Downloaded. Rendering analysis...';
    setCloudManagerStatus('Rendering analysis results from the downloaded log...');
    const labels = buildCloudManagerSelectionLabels();
    currentCloudManagerRunContext = {
      source: 'cloudmanager',
      programId: options.programId,
      environmentId: options.environmentId,
      programName: labels.programName,
      environmentName: labels.environmentName,
      selections: options.selections || [],
      days: options.days,
      outputDirectory: data.outputDirectory,
      analyzedFile: data.analyzedFile,
      commandPreview: data.commandPreview,
      fileDates: data.fileDates || [],
      downloadedFiles: data.downloadedFiles || [],
      downloadedFilesDetailed: data.downloadedFilesDetailed || [],
      downloads: data.downloads || []
    };
    renderCloudManagerSummary(data);
    renderCloudManagerResultBadges(data, currentCloudManagerRunContext);
    pushCloudManagerHistoryEntry({
      timestamp: new Date().toISOString(),
      ...currentCloudManagerRunContext,
      downloadedFiles: data.downloadedFiles || [],
      downloadedFilesDetailed: data.downloadedFilesDetailed || [],
      downloads: data.downloads || []
    });
    if (data.supported === false || !data.analyzedFile) {
      setCloudManagerStatus(data.unsupportedReason || 'Downloaded files are not supported for structured analysis yet.');
      showToast(data.unsupportedReason || 'Downloaded files are not supported yet', 'warning');
      persistCloudManagerSelectionState();
      return;
    }

    handleAnalysisComplete(data, {
      analyzedFile: data.analyzedFile,
      source: 'cloudmanager'
    });
    setCloudManagerStatus('');
    persistCloudManagerSelectionState();
  } catch (error) {
    setCloudManagerStatus('');
    showError('Cloud Manager analysis failed: ' + error.message);
  } finally {
    cmAnalyzeBtn.textContent = 'Download & Analyze';
    cmAnalyzeBtn.disabled = false;
    cmProgressText.classList.add('hidden');
  }
}

function handleAnalysisComplete(data, context = {}) {
  currentAnalysisMode = 'single';
  currentBatchInput = null;
  currentBatchSummary = null;
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

    if (data.loggers || data.threads || data.packages || data.exceptions) {
      populateFilterDropdowns(
        data.loggers,
        data.threads,
        data.packages,
        data.exceptions,
        data.packageThreads || {},
        data.packageExceptions || {},
        categories
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

  fetchRawEvents(1);
}

function handleMultiErrorAnalysisComplete(data, input) {
  currentAnalysisMode = 'multi-error';
  currentLogType = 'error';
  setCurrentAnalyzedFilePath('');
  currentBatchInput = input;
  currentBatchSummary = data.summary || null;
  chartsToggleBtn.disabled = true;
  exportCsvBtn.disabled = true;
  exportJsonBtn.disabled = true;
  exportPdfBtn.disabled = true;
  document.getElementById('exportAllBtn').disabled = true;
  if (exportRow) {
    exportRow.classList.add('export-row-hidden');
    exportRow.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.log-filter-panel').forEach(p => p.classList.add('hidden'));
  const filterPanel = document.getElementById('errorFilters');
  if (filterPanel) filterPanel.classList.remove('hidden');
  applyErrorFilterSidebarResponse(data);
  if (data.levelCounts) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `(${val || 0})`; };
    const lc = data.levelCounts;
    set('countALL', lc.ALL);
    set('countERROR', lc.ERROR);
    set('countWARN', lc.WARN);
    set('countINFO', lc.INFO);
    set('countDEBUG', lc.DEBUG);
  }
  chartsTab.classList.add('hidden');
  fetchRawEvents(1);
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
  chartsVisible = !chartsVisible;
  chartsTab.classList.toggle('hidden', !chartsVisible);
  chartsToggleBtn.classList.toggle('active', chartsVisible);
  if (chartsVisible) fetchChartsData();
});

async function fetchChartsData() {
  const isMultiError = currentAnalysisMode === 'multi-error' && currentBatchInput;
  const filePath = getActiveAnalysisFilePath();
  if (!isMultiError && !filePath) return;

  const body = isMultiError
    ? { input: currentBatchInput, filters: getCurrentErrorFilterPayload() }
    : { filePath, filters: getCurrentLogFilterPayload() };

  try {
    const response = await fetch(isMultiError ? '/api/filter/multi-error' : '/api/filter', {
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
          selectMultiValues(Object.keys(allLoggers), selectedLoggers, [loggerName]);
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

  const activePackages = selectedPackages.length > 0
    ? selectedPackages
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
  const threadTotal = Object.keys(allThreads || {}).length;
  const exceptionVisible = exceptionSelect ? Math.max(0, exceptionSelect.options.length - 1) : 0;
  const exceptionTotal = Object.keys(allExceptions || {}).length;
  const packageTotal = Object.keys(allPackages || {}).length;

  updateFilterCountBadge(loggerVisibleCount, loggerVisible, loggerTotal, 'logger');
  updateFilterCountBadge(threadVisibleCount, threadVisible, threadTotal, 'pod');
  updateFilterCountBadge(exceptionVisibleCount, exceptionVisible, exceptionTotal, 'exception');
  updateFilterCountBadge(packageVisibleCount, selectedPackages.length, packageTotal, 'package', 'selected');
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
  renderSelectionHint(packageSelectionHint, selectedPackages, 'package', packageFilter?.value || '');
  renderSelectionHint(loggerSelectionHint, selectedLoggers, 'logger', loggerFilter?.value || '');
}

function syncSelectedMultiSelectValues(selectedArray, visibleValues) {
  for (let i = selectedArray.length - 1; i >= 0; i--) {
    if (!visibleValues.has(selectedArray[i])) {
      selectedArray.splice(i, 1);
    }
  }
}

function refreshPackageScopedDropdowns() {
  const scopedThreads = getScopedCountsByPackage(packageThreadsByPackage, allThreads);
  const scopedExceptions = getScopedCountsByPackage(packageExceptionsByPackage, allExceptions);
  populateSingleSelectOptions(threadSelect, document.getElementById('threadFilter'), scopedThreads, 'All Pods');
  populateSingleSelectOptions(exceptionSelect, document.getElementById('exceptionFilter'), scopedExceptions, 'All Exceptions');
  updateCascadeCountBadges();
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

function populateFilterDropdowns(loggers, threads, packages, exceptions, packageThreads = {}, packageExceptions = {}, categories = []) {
  // Store all loggers for cascading filter
  allLoggers = loggers || {};
  allPackages = packages || {};
  allThreads = threads || {};
  allExceptions = exceptions || {};
  packageThreadsByPackage = packageThreads || {};
  packageExceptionsByPackage = packageExceptions || {};

  const visiblePackageValues = new Set(Object.keys(allPackages));
  syncSelectedMultiSelectValues(selectedPackages, visiblePackageValues);
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
  const filters = {};

  if (startDate.value) filters.startDate = normalizeDateTimeForApi(startDate.value);
  if (endDate.value) filters.endDate = normalizeDateTimeForApi(endDate.value);
  if (rawEventsLevel && rawEventsLevel !== 'ALL') filters.level = rawEventsLevel;
  if (selectedLoggers.length > 0) filters.logger = [...selectedLoggers];
  if (threadSelect?.value) filters.thread = threadSelect.value;
  if (selectedPackages.length > 0) filters.package = [...selectedPackages];
  if (exceptionSelect?.value) filters.exception = exceptionSelect.value;
  if (categoryFilter?.value) filters.category = categoryFilter.value;

  return filters;
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
    categories
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

  const isMultiError = currentAnalysisMode === 'multi-error' && currentBatchInput;
  const filePath = getActiveAnalysisFilePath();
  if (!isMultiError && !filePath) return;

  const seq = ++errorFilterRefreshSeq;
  const payload = isMultiError
    ? { input: currentBatchInput, filters: getSidebarErrorFilterPayload() }
    : { filePath, filters: getSidebarErrorFilterPayload() };

  try {
    const response = await fetch(isMultiError ? '/api/filter/multi-error' : '/api/filter', {
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

function highlightText(text, searchTerm) {
  if (!searchTerm || !text) return escapeHtml(text || '');
  const escaped = escapeHtml(text);
  try {
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  } catch {
    return escaped;
  }
}

function renderLoggerTags() {
  const container = document.getElementById('loggerTags');
  if (!container) return;
  container.innerHTML = selectedLoggers.map(val =>
    `<span class="filter-tag"><span title="${escapeHtml(val)}">${escapeHtml(val.split('.').pop())}</span> <button onclick="removeLogger('${escapeHtml(val)}')">&times;</button></span>`
  ).join('');
  renderSelectionHints();
}

function renderPackageTags() {
  const container = document.getElementById('packageTags');
  if (!container) return;
  container.innerHTML = selectedPackages.map(val =>
    `<span class="filter-tag"><span>${escapeHtml(val)}</span> <button onclick="removePackage('${escapeHtml(val)}')">&times;</button></span>`
  ).join('');
  renderSelectionHints();
}

function getFilteredPackageEntries() {
  const query = packageFilter.value.trim().toLowerCase();
  return Object.entries(allPackages || {})
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
  renderTokenPickerResults(packageResults, entries, selectedPackages);
  updateCascadeCountBadges();
  renderSelectionHints();
}

window.removeLogger = (val) => {
  const idx = selectedLoggers.indexOf(val);
  if (idx !== -1) selectedLoggers.splice(idx, 1);
  renderLoggerTags();
  renderLoggerPicker();
  scheduleErrorFilterRefresh();
  scheduleErrorFilterApply();
};

window.removePackage = (val) => {
  const idx = selectedPackages.indexOf(val);
  if (idx !== -1) selectedPackages.splice(idx, 1);
  renderPackageTags();
  renderPackagePicker();
  filterAndPopulateLoggers();
  refreshPackageScopedDropdowns();
  scheduleErrorFilterRefresh();
  scheduleErrorFilterApply();
};

/* ============================================================
   Smart Package Grouping & Cascading Filter
   ============================================================ */

function loggerMatchesSelectedPackages(loggerName) {
  if (!selectedPackages.length) return true;
  return selectedPackages.some((pkg) => loggerName === pkg || loggerName.startsWith(`${pkg}.`));
}

function getAvailableLoggerEntries() {
  return Object.entries(allLoggers || {})
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
  renderTokenPickerResults(loggerResults, entries, selectedLoggers, { showActionLabel: false });
  updateCascadeCountBadges();
  renderSelectionHints();
}

function filterAndPopulateLoggers() {
  if (!allLoggers) return;
  const availableValues = new Set(getAvailableLoggerEntries().map(([name]) => name));
  // Mutate array in-place instead of reassigning to preserve reference
  for (let i = selectedLoggers.length - 1; i >= 0; i--) {
    if (!availableValues.has(selectedLoggers[i])) {
      selectedLoggers.splice(i, 1);
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

  if (currentAnalysisMode === 'multi-error' && currentBatchInput) {
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
  const body = currentAnalysisMode === 'multi-error' ? { ...getBatchExportPayload(), mode: 'multi-error' } : { events: rawEventsData };
  const response = await fetch('/api/export/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  downloadFile(await response.blob(), 'aem-log-errors.csv', 'text/csv');
});

exportJsonBtn.addEventListener('click', async () => {
  const body = currentAnalysisMode === 'multi-error' ? { ...getBatchExportPayload(), mode: 'multi-error' } : { events: rawEventsData };
  const response = await fetch('/api/export/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  downloadFile(await response.blob(), 'aem-log-errors.json', 'application/json');
});

exportPdfBtn.addEventListener('click', async () => {
  const summary = getSummaryFromDOM();
  const body = currentAnalysisMode === 'multi-error'
    ? { ...getBatchExportPayload(), summary, mode: 'multi-error' }
    : { summary, events: rawEventsData };

  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  downloadFile(await response.blob(), 'aem-log-summary.pdf', 'application/pdf');
});

function getBatchExportPayload() {
  return {
    input: currentBatchInput,
    filters: getActiveErrorFilterPayload(),
    advancedRules: advancedRulesState,
    search: rawEventsSearch
  };
}

function getSummaryFromDOM() {
  if (currentAnalysisMode === 'multi-error' && currentBatchSummary) {
    return {
      totalErrors: currentBatchSummary.totalErrors || 0,
      totalWarnings: currentBatchSummary.totalWarnings || 0,
      uniqueErrors: currentBatchSummary.uniqueErrors || 0,
      uniqueWarnings: currentBatchSummary.uniqueWarnings || 0,
      totalFiles: currentBatchSummary.totalFiles || 0,
      totalEvents: currentBatchSummary.totalEvents || 0
    };
  }

  const getText = (id) => document.getElementById(id)?.textContent || '(0)';
  return {
    totalErrors: getText('totalErrors'),
    totalWarnings: getText('totalWarnings'),
    uniqueErrors: getText('uniqueErrors'),
    uniqueWarnings: getText('uniqueWarnings')
  };
}

document.getElementById('exportAllBtn').addEventListener('click', async () => {
  showToast('Generating all exports...', 'info');
  const summary = getSummaryFromDOM();
  try {
    const csvBody = currentAnalysisMode === 'multi-error' ? { ...getBatchExportPayload(), mode: 'multi-error' } : { events: rawEventsData };
    const jsonBody = currentAnalysisMode === 'multi-error' ? { ...getBatchExportPayload(), mode: 'multi-error' } : { events: rawEventsData };
    const pdfBody = currentAnalysisMode === 'multi-error' ? { ...getBatchExportPayload(), summary, mode: 'multi-error' } : { summary, events: rawEventsData };
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
    document.activeElement.blur();
    clearFiltersBtn.click();
  }
});

/* ============================================================
   WebSocket Tail
   ============================================================ */

let ws = null;

tailBtn.addEventListener('click', () => {
  if (currentSourceMode !== 'local') {
    showToast('Tail is only available for local file paths', 'warning');
    return;
  }

  const tailPathInput = document.getElementById('tailPath');
  const filePath = tailPathInput ? tailPathInput.value.trim() : filePathInput.value.trim();
  if (!filePath) { showToast('Enter a file path to tail', 'warning'); return; }

  // Save path to localStorage for persistence
  localStorage.setItem('aem_lastPath', filePath);
  console.log('[AEM] Saved path on tail:', filePath);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'stop' }));
    ws.close();
    ws = null;
    tailBtn.textContent = '\u25B6 Tail';
    tailBtn.classList.remove('active');
    showToast('Stopped tailing', 'info');
    return;
  }

  ws = new WebSocket(`ws://${location.host}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ action: 'watch', filePath }));
    tailBtn.textContent = 'Stop Tail';
    tailBtn.classList.add('active');
    showToast(`Tailing ${filePath}`, 'success');
  };
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.error) {
      showToast('Tail error: ' + data.error, 'error');
    } else {
      showToast(`[${data.level}] ${data.message.substring(0, 80)}`, data.level === 'ERROR' ? 'error' : 'warning');
    }
  };
  ws.onerror = () => {
    showToast('WebSocket connection error', 'error');
    tailBtn.textContent = '\u25B6 Tail';
    tailBtn.classList.remove('active');
  };
  ws.onclose = () => {
    tailBtn.textContent = '\u25B6 Tail';
    tailBtn.classList.remove('active');
  };
});

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

  if (currentAnalysisMode === 'multi-error' && currentBatchInput) {
    const body = {
      input: currentBatchInput,
      page,
      perPage: rawEventsPerPage,
      filters: getActiveErrorFilterPayload(),
      search: rawEventsSearch
    };

    rawEventsSection.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--color-text-secondary);">Loading merged error events...</div>';

    try {
      const response = await fetch('/api/raw-events/multi-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!data.success) {
        showToast(data.error, 'error');
        return;
      }

      rawEventsData = data.events;
      if (data.levelCounts) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `(${val || 0})`; };
        const lc = data.levelCounts;
        set('countALL', lc.ALL);
        set('countERROR', lc.ERROR);
        set('countWARN', lc.WARN);
        set('countINFO', lc.INFO);
        set('countDEBUG', lc.DEBUG);
      }
      applyErrorFilterSidebarResponse(data);
      renderRawEvents(data.events, data.total, data.page, data.perPage, data.logType || 'error');
      if (scrollToTop) scrollRawEventsToTop();
    } catch (e) {
      showToast('Failed to load merged error events: ' + e.message, 'error');
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
    if (selectedLoggers.length > 0) body.logger = selectedLoggers;
    if (threadSelect?.value) body.thread = threadSelect.value;
    if (selectedPackages.length > 0) body.package = selectedPackages;
    if (exceptionSelect?.value) body.exception = exceptionSelect.value;
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
    if (!data.success) { showToast(data.error, 'error'); return; }

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
    renderRawEvents(data.events, data.total, data.page, data.perPage, data.logType || currentLogType);
    if (scrollToTop) scrollRawEventsToTop();
  } catch (e) {
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
    if (logType === 'request') {
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

function renderErrorEvent(evt, i) {
  const level = evt.level || evt.severity || 'INFO';
  const loggerName = evt.logger || evt.sourceName || '';
  const messageText = evt.message || evt.title || '';
  const hasStack = evt.stackTrace && evt.stackTrace.trim();
  const stackHtml = hasStack ? formatStackTrace(evt.stackTrace) : '';

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
        <span class="event-message" title="${escapeHtml(evt.url)}">${highlightText(evt.url, rawEventsSearch)}</span>
        <span class="status-badge ${statusClass}">${evt.status}</span>
        <span class="response-time">${evt.responseTime}ms</span>
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
  const jsonEntry = {
    timestamp: evt.timestamp,
    method: evt.method,
    url: evt.url,
    status: evt.status,
    ttfb: evt.ttfb,
    ttlb: evt.ttlb,
    cache: evt.cache,
    clientCountry: evt.clientCountry,
    pop: evt.pop,
    host: evt.host
  };
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch)}</pre>`;

  return `
    <div class="raw-event ${statusClass}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${statusClass}">${evt.method}</span>
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-message" title="${escapeHtml(evt.url)}">${highlightText(evt.url, rawEventsSearch)}</span>
        <span class="status-badge ${statusClass}">${evt.status}</span>
        <span class="cache-badge">${evt.cache || '-'}</span>
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
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(evt, null, 2), rawEventsSearch)}</pre>`;

  return `
    <div class="raw-event ${getSeverityClass(evt.severity)}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${getSeverityClass(evt.severity)}">${escapeHtml(evt.severity)}</span>
        <span class="event-time">${escapeHtml(evt.timestamp || '')}</span>
        <span class="event-logger" title="${escapeHtml(evt.sourceName || evt.sourceFile || '')}">${escapeHtml(evt.sourceName || evt.sourceFile || '')}</span>
        <span class="event-message" title="${escapeHtml(evt.title || evt.message || '')}">${highlightText(evt.title || evt.message || '', rawEventsSearch)}</span>
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

document.querySelectorAll('.level-chip').forEach(chip => {
  if (chip.id === 'chartsToggleBtn') return;
  chip.addEventListener('click', () => {
    document.querySelectorAll('.level-chip').forEach(c => {
      if (c.id !== 'chartsToggleBtn') c.classList.remove('active');
    });
    chip.classList.add('active');
    rawEventsLevel = chip.dataset.level;
    fetchRawEvents(1);
  });
});

const rawSearchInput = document.getElementById('rawSearchInput');
const rawSearchBtn = document.getElementById('rawSearchBtn');
rawSearchBtn.addEventListener('click', () => {
  rawEventsSearch = rawSearchInput.value;
  if (currentAnalysisMode === 'multi-error' && currentBatchInput) {
    applyRawEventFilters();
  } else {
    fetchRawEvents(1);
  }
});
rawSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    rawEventsSearch = rawSearchInput.value;
    if (currentAnalysisMode === 'multi-error' && currentBatchInput) {
      applyRawEventFilters();
    } else {
      fetchRawEvents(1);
    }
  }
});

window.fetchRawEvents = fetchRawEvents;
window.changeRawEventsPage = changeRawEventsPage;
window.changeRawEventsPerPage = changeRawEventsPerPage;

if (cmHistoryList) {
  cmHistoryList.addEventListener('click', async (event) => {
    const button = event.target.closest('.cm-history-reopen');
    if (!button) return;
    const item = button.closest('[data-history-index]');
    const index = Number(item?.dataset.historyIndex);
    const history = readCloudManagerHistory();
    const entry = history[index];
    if (!entry || !entry.analyzedFile) return;

    currentCloudManagerRunContext = entry;
    renderCloudManagerResultBadges({}, entry);
    renderCloudManagerSummary({
      analyzedFile: entry.analyzedFile,
      outputDirectory: entry.outputDirectory,
      downloadedFiles: entry.downloadedFiles || [],
      downloadedFilesDetailed: entry.downloadedFilesDetailed || []
    });
    setCloudManagerStatus('Reopening a previously downloaded Cloud Manager log...');
    await analyzeSavedCloudManagerFile(entry.analyzedFile, entry);
    setCloudManagerStatus('');
  });
}

if (cmDownloadSummary) {
  cmDownloadSummary.addEventListener('click', async (event) => {
    const button = event.target.closest('.cm-download-analyze');
    if (!button) return;
    const filePath = button.dataset.filePath || '';
    if (!filePath) return;

    const runContext = currentCloudManagerRunContext || {};
    await analyzeSavedCloudManagerFile(filePath, runContext);
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
  selectedLoggers,
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
  selectedPackages,
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
restoreCloudManagerSelections();
restoreCloudManagerTabState();
renderCloudManagerHistory();
updateCloudManagerHintState();
renderCloudManagerLogOptions();
setSourceMode(currentSourceMode, { persist: false });
refreshCloudManagerCommandPreview();
updateCloudManagerActionState();

// Restore last used file path on page load
const lastPath = localStorage.getItem('aem_lastPath');
if (lastPath) {
  if (parseMultiErrorInput(lastPath).length > 1) {
    localStorage.removeItem('aem_lastPath');
  } else {
    filePathInput.value = lastPath;
    console.log('[AEM] Restored path:', lastPath);
  }
}

// Debounced save on input for instant persistence
let savePathTimeout;
filePathInput.addEventListener('input', () => {
  clearTimeout(savePathTimeout);
  savePathTimeout = setTimeout(() => {
    const val = filePathInput.value.trim();
    if (val && parseMultiErrorInput(val).length <= 1) {
      localStorage.setItem('aem_lastPath', val);
      console.log('[AEM] Saved path on input:', val);
    }
  }, 300);
});

// Also save on blur (immediate)
filePathInput.addEventListener('blur', () => {
  const val = filePathInput.value.trim();
  if (val && parseMultiErrorInput(val).length <= 1) {
    localStorage.setItem('aem_lastPath', val);
  }
});

if (cmOutputDirectoryInput) {
  cmOutputDirectoryInput.addEventListener('blur', () => {
    const value = cmOutputDirectoryInput.value.trim();
    if (value) {
      localStorage.setItem(CM_OUTPUT_DIRECTORY_STORAGE_KEY, value);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const setupBtn = document.getElementById('setup-cloudmanager-btn');
  if (setupBtn) {
    setupBtn.addEventListener('click', () => {
      const wizard = window.open(
        '/pages/onboarding.html',
        'cm-setup-wizard',
        'width=750,height=850,left=100,top=100,scrollbars=yes'
      );
      if (!wizard) {
        window.location.href = '/pages/onboarding.html';
      }
    });
  }

  window.addEventListener('message', (event) => {
    if (event.data.action === 'setup-complete') {
      location.reload();
    }
    if (event.data.action === 'open-settings') {
      setSourceMode('cloudmanager');
    }
  });
});
