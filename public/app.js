const fileInput = document.getElementById('fileInput');
const filePathInput = document.getElementById('filePath');
const analyzeBtn = document.getElementById('analyzeBtn');
const summarySection = document.getElementById('summary');
const resultsSection = document.getElementById('results');
const showErrors = document.getElementById('showErrors');
const showWarnings = document.getElementById('showWarnings');
const searchInput = document.getElementById('searchInput');
const loggerFilter = document.getElementById('loggerFilter');
const threadFilter = document.getElementById('threadFilter');
const regexFilter = document.getElementById('regexFilter');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const sortBy = document.getElementById('sortBy');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const savePresetBtn = document.getElementById('savePresetBtn');
const presetSelect = document.getElementById('presetSelect');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const progressText = document.getElementById('progressText');
const pagination = document.getElementById('pagination');
const paginationInfo = document.getElementById('paginationInfo');

let currentResults = [];
let filteredResults = [];
let timelineChart = null;
let loggerChart = null;
const ITEMS_PER_PAGE = 50;
let currentPage = 1;

darkModeBtn.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  darkModeBtn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
});

if (localStorage.getItem('darkMode') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  darkModeBtn.textContent = '☀️';
}

function loadPresets() {
  const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
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
  const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
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
  const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
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

analyzeBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  const filePath = filePathInput.value.trim();
  
  let requestBody;
  
  if (file) {
    const content = await file.text();
    requestBody = JSON.stringify({ fileContent: content });
  } else if (filePath) {
    requestBody = JSON.stringify({ filePath });
  } else {
    alert('Please select a file or enter a file path');
    return;
  }

  analyzeBtn.textContent = 'Analyzing...';
  analyzeBtn.disabled = true;
  progressText.classList.remove('hidden');
  progressText.textContent = 'Parsing log file...';

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });

    const data = await response.json();

    if (!data.success) {
      alert('Error: ' + data.error);
      return;
    }

    displaySummary(data.summary);
    currentResults = data.results;
    filteredResults = [...currentResults];
    displayResults(filteredResults);
    enableExports();
    progressText.textContent = '';
    
    fetchChartsData();
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    analyzeBtn.textContent = 'Analyze';
    analyzeBtn.disabled = false;
    progressText.classList.add('hidden');
  }
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
      renderCharts(data.timeline, data.loggerDist);
      document.getElementById('chartsSection').classList.remove('hidden');
    }
  } catch (e) {
    console.error('Charts error:', e);
  }
}

function renderCharts(timeline, loggerDist) {
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
        { label: 'Errors', data: errors, borderColor: '#e74c3c', fill: false },
        { label: 'Warnings', data: warnings, borderColor: '#f39c12', fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Errors & Warnings Over Time' } }
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
          '#e74c3c', '#f39c12', '#3498db', '#2ecc71', '#9b59b6',
          '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Top 10 Loggers by Error Count' } }
    }
  });
}

function displaySummary(summary) {
  document.getElementById('totalErrors').textContent = summary.totalErrors;
  document.getElementById('totalWarnings').textContent = summary.totalWarnings;
  document.getElementById('uniqueErrors').textContent = summary.uniqueErrors;
  document.getElementById('uniqueWarnings').textContent = summary.uniqueWarnings;
  summarySection.classList.remove('hidden');
}

function displayResults(results) {
  const sorted = sortResults(results);
  
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  currentPage = Math.min(currentPage, totalPages || 1);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = sorted.slice(start, end);
  
  paginationInfo.textContent = `Showing ${start + 1}-${Math.min(end, sorted.length)} of ${sorted.length}`;
  
  renderPagination(totalPages);
  
  resultsSection.innerHTML = pageItems.map((r, i) => `
    <div class="result-item ${r.level.toLowerCase()}" data-index="${start + i}">
      <div class="result-header" onclick="toggleDetails(${start + i})">
        <span class="count">${r.count}x</span>
        <span class="message">${escapeHtml(r.message)}</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="result-details">
        <strong>Level:</strong> ${r.level}<br>
        <strong>First occurrence:</strong> ${r.firstOccurrence}<br>
        <strong>Examples:</strong>
        ${r.examples.map(ex => `
          <div class="example">
            <span class="timestamp">${ex.timestamp}</span> -
            <span class="logger">${escapeHtml(ex.logger)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function sortResults(results) {
  const sort = sortBy.value;
  return [...results].sort((a, b) => {
    if (sort === 'count') return b.count - a.count;
    if (sort === 'timestamp') return a.firstOccurrence.localeCompare(b.firstOccurrence);
    if (sort === 'message') return a.message.localeCompare(b.message);
    return 0;
  });
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Prev</button>`;
  
  for (let i = 1; i <= Math.min(totalPages, 10); i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  
  if (totalPages > 10) html += '<span>...</span>';
  
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;
  pagination.innerHTML = html;
}

window.goToPage = (page) => {
  currentPage = page;
  displayResults(filteredResults);
};

window.toggleDetails = (index) => {
  const items = document.querySelectorAll('.result-item');
  const item = Array.from(items).find(el => parseInt(el.dataset.index) === index);
  if (item) item.classList.toggle('expanded');
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function applyFilters() {
  filteredResults = currentResults.filter(r => {
    if (r.level === 'ERROR' && !showErrors.checked) return false;
    if (r.level === 'WARN' && !showWarnings.checked) return false;
    
    const search = searchInput.value.toLowerCase();
    if (search && !r.message.toLowerCase().includes(search)) return false;
    
    const logger = loggerFilter.value.toLowerCase();
    if (logger) {
      const hasMatch = r.examples.some(ex => (ex.logger || '').toLowerCase().includes(logger));
      if (!hasMatch) return false;
    }
    
    const thread = threadFilter.value.toLowerCase();
    if (thread) {
      const hasMatch = r.examples.some(ex => (ex.thread || '').toLowerCase().includes(thread));
      if (!hasMatch) return false;
    }
    
    const regex = regexFilter.value;
    if (regex) {
      try {
        if (!new RegExp(regex, 'i').test(r.message)) return false;
      } catch {}
    }
    
    return true;
  });
  
  currentPage = 1;
  displayResults(filteredResults);
}

applyFiltersBtn.addEventListener('click', applyFilters);

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  loggerFilter.value = '';
  threadFilter.value = '';
  regexFilter.value = '';
  startDate.value = '';
  endDate.value = '';
  showErrors.checked = true;
  showWarnings.checked = true;
  filteredResults = [...currentResults];
  currentPage = 1;
  displayResults(filteredResults);
});

showErrors.addEventListener('change', applyFilters);
showWarnings.addEventListener('change', applyFilters);
sortBy.addEventListener('change', () => displayResults(filteredResults));

function enableExports() {
  exportCsvBtn.disabled = false;
  exportJsonBtn.disabled = false;
  exportPdfBtn.disabled = false;
}

exportCsvBtn.addEventListener('click', async () => {
  const response = await fetch('/api/export/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results: filteredResults })
  });
  downloadFile(await response.blob(), 'aem-log-errors.csv', 'text/csv');
});

exportJsonBtn.addEventListener('click', async () => {
  const response = await fetch('/api/export/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results: filteredResults })
  });
  downloadFile(await response.blob(), 'aem-log-errors.json', 'application/json');
});

exportPdfBtn.addEventListener('click', async () => {
  const summary = {
    totalErrors: document.getElementById('totalErrors').textContent,
    totalWarnings: document.getElementById('totalWarnings').textContent,
    uniqueErrors: document.getElementById('uniqueErrors').textContent,
    uniqueWarnings: document.getElementById('uniqueWarnings').textContent
  };
  
  await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, results: filteredResults })
  });
});

function downloadFile(blob, filename, type) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
