const fileInput = document.getElementById('fileInput');
const filePathInput = document.getElementById('filePath');
const analyzeBtn = document.getElementById('analyzeBtn');
const searchInput = document.getElementById('searchInput');
const loggerFilter = document.getElementById('loggerFilter');
const threadFilter = document.getElementById('threadFilter');
const regexFilter = document.getElementById('regexFilter');
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
const darkModeBtn = document.getElementById('darkModeBtn');
const progressText = document.getElementById('progressText');
const paginationInfo = document.getElementById('paginationInfo');
const tailBtn = document.getElementById('tailBtn');
const dropZone = document.getElementById('dropZone');
const loggerSelect = document.getElementById('loggerSelect');
const threadSelect = document.getElementById('threadSelect');
const packageFilter = document.getElementById('packageFilter');
const packageSelect = document.getElementById('packageSelect');
const exceptionFilter = document.getElementById('exceptionFilter');
const exceptionSelect = document.getElementById('exceptionSelect');

let timelineChart = null;
let loggerChart = null;
let threadChart = null;
let heatmapChart = null;
let rawEventsData = [];
let lastFileContent = null;
let currentLogType = 'error'; // Store file content after upload for reuse

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
   Dark Mode
   ============================================================ */

darkModeBtn.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  darkModeBtn.textContent = isDark ? '\u{1F319}' : '\u{2600}\u{FE0F}';
  localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
});

if (localStorage.getItem('darkMode') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  darkModeBtn.textContent = '\u{2600}\u{FE0F}';
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
    loggerFilter.value = preset.logger || '';
    threadFilter.value = preset.thread || '';
    regexFilter.value = preset.regex || '';
    startDate.value = preset.startDate || '';
    endDate.value = preset.endDate || '';
  }
});

savePresetBtn.addEventListener('click', () => {
  const name = prompt('Enter preset name:');
  if (!name) return;
  const presets = safeJsonParse(localStorage.getItem('filterPresets'));
  presets[name] = {
    logger: loggerFilter.value,
    thread: threadFilter.value,
    regex: regexFilter.value,
    startDate: startDate.value,
    endDate: endDate.value
  };
  localStorage.setItem('filterPresets', JSON.stringify(presets));
  loadPresets();
});

/* ============================================================
   Drag & Drop
   ============================================================ */

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    const name = e.dataTransfer.files[0].name;
    const textEl = dropZone.querySelector('.drop-zone-text');
    if (textEl) textEl.textContent = name;
  }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    const name = fileInput.files[0].name;
    const textEl = dropZone.querySelector('.drop-zone-text');
    if (textEl) textEl.textContent = name;
    // Restore normal placeholder when file is selected
    filePathInput.placeholder = '/path/to/aem-error.log';
  }
});

/* ============================================================
   Analyze
   ============================================================ */

analyzeBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  const filePath = filePathInput.value.trim();

  const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB

  if (file) {
    // File upload mode (for small files ≤500MB)
    if (file.size > MAX_UPLOAD_SIZE) {
      showToast('File too large for upload (>500MB). Enter the server file path instead.', 'error');
      return;
    }
    localStorage.setItem('aem_lastPath', 'file:' + file.name);
    await analyzeFileUpload(file);
  } else if (filePath) {
    // File path mode (server-side, up to 5GB)
    localStorage.setItem('aem_lastPath', filePath);
    await analyzeFilePath(filePath);
  } else {
    showToast('Please select a file or enter a file path', 'warning');
    return;
  }
});

async function analyzeFileUpload(file) {
  analyzeBtn.textContent = 'Uploading...';
  analyzeBtn.disabled = true;
  progressText.classList.remove('hidden');
  progressText.textContent = 'Reading file...';
  document.getElementById('emptyState').classList.add('hidden');

  try {
    const content = await file.text();
    lastFileContent = content; // Store for raw events
    progressText.textContent = 'Analyzing...';

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileContent: content })
    });

    const data = await response.json();
    if (!data.success) {
      showError(data.error);
      return;
    }
    handleAnalysisComplete(data);
  } catch (error) {
    showError(error.message);
  } finally {
    analyzeBtn.textContent = 'Analyze';
    analyzeBtn.disabled = false;
    progressText.classList.add('hidden');
  }
}

async function analyzeFilePath(filePath) {
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
      handleAnalysisComplete(data);
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

  // Clear cached file content - file path mode uses server-side processing
  lastFileContent = null;
}

function handleAnalysisComplete(data) {
  // Store the log type
  currentLogType = data.logType || 'error';
  
  // Show/hide filter panels based on log type
  const filterPanel = document.getElementById(currentLogType + 'Filters');
  document.querySelectorAll('.log-filter-panel').forEach(p => p.classList.add('hidden'));
  if (filterPanel) filterPanel.classList.remove('hidden');
  
  exportCsvBtn.disabled = false;
  exportJsonBtn.disabled = false;
  exportPdfBtn.disabled = false;
  document.getElementById('exportAllBtn').disabled = false;

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
      populateFilterDropdowns(data.loggers, data.threads, data.packages, data.exceptions);
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
  const file = fileInput.files[0];
  const filePath = filePathInput.value.trim();

  let body;
  if (file) {
    const content = await file.text();
    body = { fileContent: content, filters: {} };
  } else if (filePath) {
    body = { filePath, filters: {} };
  } else return;

  try {
    const response = await fetch('/api/filter', {
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
        { label: 'Errors', data: errors, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3 },
        { label: 'Warnings', data: warnings, borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const dateLabel = dates[elements[0].index];
          const [dd, mm, yyyy] = dateLabel.split('.');
          startDate.value = `${yyyy}-${mm}-${dd}T00:00`;
          endDate.value = `${yyyy}-${mm}-${dd}T23:59`;
          applyRawEventFilters();
          showToast(`Filtered to ${dateLabel}`, 'info');
        }
      },
      plugins: { title: { display: true, text: 'Errors & Warnings Over Time (click to drill down)' } }
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
          '#EF4444', '#F59E0B', '#0EA5E9', '#10B981', '#8B5CF6',
          '#06B6D4', '#F97316', '#475569', '#14B8A6', '#E11D48'
        ]
      }]
    },
    options: {
      responsive: true,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const loggerName = sortedLoggers[elements[0].index][0];
          loggerFilter.value = loggerName;
          applyRawEventFilters();
          showToast(`Filtered to logger: ${loggerName.substring(0, 40)}`, 'info');
        }
      },
      plugins: { title: { display: true, text: 'Top 10 Loggers (click to drill down)' } }
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
        backgroundColor: '#0EA5E9'
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: { title: { display: true, text: 'Top 10 Threads' } }
    }
  });

  const ctx4 = document.getElementById('heatmapChart').getContext('2d');
  const hourBuckets = {};
  if (hourlyHeatmap && Array.isArray(hourlyHeatmap)) {
    hourlyHeatmap.forEach(h => {
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
        backgroundColor: hourData.map(v => v > 0 ? `rgba(239,68,60,${Math.min(1, v / Math.max(...hourData, 1))})` : '#e2e8f0')
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Events by Hour of Day' } }
    }
  });
}

/* ============================================================
   Filter Dropdowns
   ============================================================ */

function populateFilterDropdowns(loggers, threads, packages, exceptions) {
  const populate = (select, items, allLabel) => {
    if (!items || !select) return;
    const sorted = Object.entries(items).sort((a, b) => b[1] - a[1]);
    select.innerHTML = `<option value="">${allLabel}</option>`;
    sorted.forEach(([name, count]) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${name} (${count})`;
      select.appendChild(opt);
    });
  };

  populate(loggerSelect, loggers, 'All Loggers');
  populate(threadSelect, threads, 'All Threads');
  populate(packageSelect, packages, 'All Packages');
  populate(exceptionSelect, exceptions, 'All Exceptions');
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

/* ============================================================
   Filtering
   ============================================================ */

function applyRawEventFilters() {
  rawEventsSearch = searchInput.value;
  rawEventsLevel = document.querySelector('.level-chip.active')?.dataset.level || 'ALL';
  fetchRawEvents(1);
}

applyFiltersBtn.addEventListener('click', applyRawEventFilters);

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  loggerFilter.value = '';
  threadFilter.value = '';
  packageFilter.value = '';
  exceptionFilter.value = '';
  regexFilter.value = '';
  startDate.value = '';
  endDate.value = '';
  if (loggerSelect) Array.from(loggerSelect.options).forEach(o => o.style.display = '');
  if (threadSelect) Array.from(threadSelect.options).forEach(o => o.style.display = '');
  if (packageSelect) Array.from(packageSelect.options).forEach(o => o.style.display = '');
  if (exceptionSelect) Array.from(exceptionSelect.options).forEach(o => o.style.display = '');
  applyRawEventFilters();
});

categoryFilter.addEventListener('change', applyRawEventFilters);

/* ============================================================
   Exports
   ============================================================ */

exportCsvBtn.addEventListener('click', async () => {
  const response = await fetch('/api/export/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: rawEventsData })
  });
  downloadFile(await response.blob(), 'aem-log-errors.csv', 'text/csv');
});

exportJsonBtn.addEventListener('click', async () => {
  const response = await fetch('/api/export/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: rawEventsData })
  });
  downloadFile(await response.blob(), 'aem-log-errors.json', 'application/json');
});

exportPdfBtn.addEventListener('click', async () => {
  const summary = getSummaryFromDOM();

  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, events: rawEventsData })
  });
  downloadFile(await response.blob(), 'aem-log-summary.pdf', 'application/pdf');
});

function getSummaryFromDOM() {
  return {
    totalErrors: document.getElementById('totalErrors').textContent,
    totalWarnings: document.getElementById('totalWarnings').textContent,
    uniqueErrors: document.getElementById('uniqueErrors').textContent,
    uniqueWarnings: document.getElementById('uniqueWarnings').textContent
  };
}

document.getElementById('exportAllBtn').addEventListener('click', async () => {
  showToast('Generating all exports...', 'info');
  const summary = getSummaryFromDOM();
  try {
    const [csvRes, jsonRes, pdfRes] = await Promise.all([
      fetch('/api/export/csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: rawEventsData }) }),
      fetch('/api/export/json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: rawEventsData }) }),
      fetch('/api/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary, events: rawEventsData }) })
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
    searchInput.focus();
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

const levelFilters = document.getElementById('levelFilters');
const rawSearchRow = document.getElementById('rawSearchRow');
const rawEventsSection = document.getElementById('rawEvents');

async function fetchRawEvents(page = 1) {
  rawEventsPage = page;
  const filePath = filePathInput.value.trim();

  if (!filePath && !lastFileContent) {
    showToast('Enter a file path or select a file to view events', 'warning');
    return;
  }

  const body = {
    page,
    perPage: 50,
    search: rawEventsSearch
  };

  // Use file path if available, otherwise use stored file content
  if (filePath) {
    body.filePath = filePath;
  } else if (lastFileContent) {
    body.fileContent = lastFileContent;
  }

  // Date filters
  if (startDate.value) body.from = startDate.value;
  if (endDate.value) body.to = endDate.value;

  // Error log filters
  if (currentLogType === 'error') {
    body.level = rawEventsLevel;
    if (loggerFilter.value) body.logger = loggerFilter.value;
    if (threadFilter.value) body.thread = threadFilter.value;
    if (packageFilter.value) body.package = packageFilter.value;
    if (exceptionFilter.value) body.exception = exceptionFilter.value;
    if (regexFilter.value) body.regex = regexFilter.value;
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
  } catch (e) {
    showToast('Failed to load events: ' + e.message, 'error');
  }
}

function extractedExceptionBadge(evt) {
  const exceptionRegex = /^([a-zA-Z][a-zA-Z0-9_.]*(?:Exception|Error))/;
  let exType = null;
  if (evt.message) {
    const m = evt.message.match(exceptionRegex);
    if (m) exType = m[1].split('.').pop();
  }
  if (!exType && evt.stackTrace) {
    const causedByRegex = /Caused by:\s*([a-zA-Z][a-zA-Z0-9_.]*(?:Exception|Error))/;
    const m = evt.stackTrace.match(causedByRegex);
    if (m) exType = m[1].split('.').pop();
  }
  if (exType) {
    return `<span class="exception-badge">${escapeHtml(exType)}</span>`;
  }
  return '';
}

function renderRawEvents(events, total, page, perPage, logType = 'error') {
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  let html = `<div class="pagination-info">Showing ${start}-${end} of ${total} events</div>`;

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
    html += `<button ${page === 1 ? 'disabled' : ''} onclick="fetchRawEvents(${page - 1})">Prev</button>`;

    const maxVis = 5;
    let sp = Math.max(1, page - Math.floor(maxVis / 2));
    let ep = Math.min(totalPages, sp + maxVis - 1);
    if (ep - sp < maxVis - 1) sp = Math.max(1, ep - maxVis + 1);

    if (sp > 1) { html += `<button onclick="fetchRawEvents(1)">1</button>`; if (sp > 2) html += '<span>...</span>'; }
    for (let i = sp; i <= ep; i++) {
      html += `<button class="${i === page ? 'active' : ''}" onclick="fetchRawEvents(${i})">${i}</button>`;
    }
    if (ep < totalPages) { if (ep < totalPages - 1) html += '<span>...</span>'; html += `<button onclick="fetchRawEvents(${totalPages})">${totalPages}</button>`; }

    html += `<button ${page === totalPages ? 'disabled' : ''} onclick="fetchRawEvents(${page + 1})">Next</button>`;
    html += '</div>';
  }

  rawEventsSection.innerHTML = html;

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
  const hasStack = evt.stackTrace && evt.stackTrace.trim();
  const stackHtml = hasStack ? formatStackTrace(evt.stackTrace) : '';

  const jsonEntry = {
    timestamp: evt.timestamp,
    thread: evt.thread,
    level: evt.level,
    logger: evt.logger,
    message: evt.message,
    ...(hasStack && { stackTrace: evt.stackTrace })
  };
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch || searchInput.value)}</pre>`;

  return `
    <div class="raw-event ${evt.level.toLowerCase()}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${evt.level}">${evt.level}</span>
        ${extractedExceptionBadge(evt)}
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-logger" title="${escapeHtml(evt.logger)}">${escapeHtml((evt.logger || '').split('.').pop())}</span>
        <span class="event-message" title="${escapeHtml(evt.message)}">${highlightText(evt.message, rawEventsSearch || searchInput.value)}</span>
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
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch || searchInput.value)}</pre>`;

  return `
    <div class="raw-event ${statusClass}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${statusClass}">${evt.method}</span>
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-message" title="${escapeHtml(evt.url)}">${highlightText(evt.url, rawEventsSearch || searchInput.value)}</span>
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
  const jsonHtml = `<pre class="json-view">${highlightText(JSON.stringify(jsonEntry, null, 2), rawEventsSearch || searchInput.value)}</pre>`;

  return `
    <div class="raw-event ${statusClass}" data-index="${i}" style="animation-delay:${i * 30}ms">
      <div class="raw-event-header">
        <span class="level-badge ${statusClass}">${evt.method}</span>
        <span class="event-time">${escapeHtml(evt.timestamp)}</span>
        <span class="event-message" title="${escapeHtml(evt.url)}">${highlightText(evt.url, rawEventsSearch || searchInput.value)}</span>
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
  fetchRawEvents(1);
});
rawSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    rawEventsSearch = rawSearchInput.value;
    fetchRawEvents(1);
  }
});

window.fetchRawEvents = fetchRawEvents;

// Searchable dropdown behavior
function initSearchableDropdown(dropdownId, searchInputId, selectId, filterInputId) {
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
      const text = opt.value.toLowerCase();
      opt.style.display = text.includes(query) ? '' : 'none';
    });
  });

  select.addEventListener('change', () => {
    const val = select.value;
    searchInput.value = val;
    dropdown.classList.remove('open');
    applyRawEventFilters();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// Initialize dropdowns
initSearchableDropdown('loggerDropdown', 'loggerFilter', 'loggerSelect');
initSearchableDropdown('threadDropdown', 'threadFilter', 'threadSelect');
initSearchableDropdown('packageDropdown', 'packageFilter', 'packageSelect');
initSearchableDropdown('exceptionDropdown', 'exceptionFilter', 'exceptionSelect');

// Restore last used file path on page load
const lastPath = localStorage.getItem('aem_lastPath');
if (lastPath) {
  if (lastPath.startsWith('file:')) {
    // File was uploaded previously - show name and prompt to re-select
    const fileName = lastPath.substring(5);
    filePathInput.value = '';
    filePathInput.placeholder = 'Last used: ' + fileName + ' (re-select to analyze)';
    console.log('[AEM] Last file uploaded:', fileName);
  } else {
    filePathInput.value = lastPath;
    console.log('[AEM] Restored path:', lastPath);
  }
}

// Debounced save on input for instant persistence
let savePathTimeout;
filePathInput.addEventListener('input', () => {
  // Restore normal placeholder when user types
  if (filePathInput.placeholder.includes('Last used:')) {
    filePathInput.placeholder = '/path/to/aem-error.log';
  }
  clearTimeout(savePathTimeout);
  savePathTimeout = setTimeout(() => {
    const val = filePathInput.value.trim();
    if (val) {
      localStorage.setItem('aem_lastPath', val);
      console.log('[AEM] Saved path on input:', val);
    }
  }, 300);
});

// Also save on blur (immediate)
filePathInput.addEventListener('blur', () => {
  if (filePathInput.value.trim()) {
    localStorage.setItem('aem_lastPath', filePathInput.value.trim());
  }
});
