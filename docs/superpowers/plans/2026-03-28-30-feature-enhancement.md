# AEM Log Inspector — 30 Feature Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 30 features spanning bug fixes, UI/UX enhancements, visual upgrades, export improvements, and advanced parallel-subagent capabilities to the AEM Log Inspector dashboard.

**Architecture:** 5-phase approach — bugs first as foundation, then core UX, visual/filter enhancements, export/sharing, and finally advanced features (WebSocket, workers, categorization). Vanilla JS frontend, Express backend, no framework additions.

**Tech Stack:** Node.js, Express, Chart.js (CDN), jsPDF, CSS custom properties, WebSocket (`ws` package), Server-Sent Events.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `.gitignore` | Create | Git ignore rules |
| `src/parser.js` | Modify | Fix timestamp milliseconds |
| `src/analyzer.js` | Modify | Fix uniqueWarnings bug, add categorization, trends, alerts, heatmap |
| `src/server.js` | Modify | Fix PDF export, add WebSocket, SSE, multi-file, alerts endpoints |
| `src/categorizer.js` | Create | Error auto-categorization engine |
| `src/tailer.js` | Create | Real-time log file watcher |
| `src/alerts.js` | Create | Alert threshold checker |
| `public/index.html` | Modify | Add toast container, sidebar, chart canvases, multi-file, alerts |
| `public/app.js` | Modify | Toast, skeleton, keyboard, live filter, sidebar, charts, WebSocket |
| `public/style.css` | Modify | All new styles for above features |

---

## Phase 1: Bug Fixes & Cleanup (Features 18–22)

### Task 1: Add `.gitignore` (Feature 21)

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.env
*.log
.DS_Store
temp/
```

---

### Task 2: Fix `uniqueWarnings` hardcoded to 0 (Feature 20)

**Files:**
- Modify: `src/analyzer.js:285-368`

- [ ] **Step 1:** In `filterAndAnalyzeStream`, replace `const uniqueMessages = new Set();` with two Sets: `const uniqueErrorMessages = new Set();` and `const uniqueWarningMessages = new Set();`
- [ ] **Step 2:** Replace the tracking line `if (entry.level === 'ERROR') uniqueMessages.add(normalized);` to track both error and warning normalized messages in their respective Sets
- [ ] **Step 3:** Fix the summary object to use both Sets: `uniqueErrors: uniqueErrorMessages.size, uniqueWarnings: uniqueWarningMessages.size`

---

### Task 3: Fix PDF Export (Feature 18)

**Files:**
- Modify: `src/server.js:263-276`
- Modify: `public/app.js:404-417`

- [ ] **Step 1:** Replace `doc.save(...)` and `res.json(...)` with `const pdfBuffer = Buffer.from(doc.output('arraybuffer')); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', 'attachment; filename=aem-log-summary.pdf'); res.send(pdfBuffer);`
- [ ] **Step 2:** Fix client handler to use `downloadFile(await response.blob(), 'aem-log-summary.pdf', 'application/pdf');`

---

### Task 4: Fix Date Range Filter (Feature 19)

**Files:**
- Modify: `public/app.js:325-357` (applyFilters function)

- [ ] **Step 1:** Add date range filtering logic inside `applyFilters` that parses AEM timestamps and compares against `startDate.value` / `endDate.value`

---

### Task 5: Enforce Regex Timeout (Feature 22)

**Files:**
- Modify: `src/analyzer.js:6-26` (isSafeRegex)

- [ ] **Step 1:** Add catastrophic backtracking pattern detection and execution time test using `REGEX_TIMEOUT_MS`
- [ ] **Step 2:** Remove unused `dangerous` array on line 12

---

## Phase 2: Core UI/UX (Features 1, 2, 3, 5, 11, 12)

### Task 6: Toast Notification System (Feature 1)

**Files:**
- Modify: `public/index.html` — add toast container div
- Modify: `public/style.css` — add toast CSS (fixed position, animations)
- Modify: `public/app.js` — replace `showError()` with `showToast(msg, type)`, replace all `showError(` calls, replace `alert()` and `console.error`

---

### Task 7: Skeleton Loading Screens (Feature 2)

**Files:**
- Modify: `public/style.css` — add skeleton shimmer CSS with animation
- Modify: `public/app.js` — add `showSkeleton()` helper, show skeletons during analyze and chart fetch

---

### Task 8: Keyboard Shortcuts (Feature 3)

**Files:**
- Modify: `public/app.js` — add keydown listener for `/`, `Esc`, `←`, `→`
- Modify: `public/index.html` — add keyboard shortcut hints below header

---

### Task 9: Full-Width Results Toggle (Feature 5)

**Files:**
- Modify: `public/index.html` — add toggle button after charts
- Modify: `public/style.css` — add `.charts-section.collapsed` style
- Modify: `public/app.js` — add toggle click handler

---

### Task 10: Enhanced Pagination (Feature 11)

**Files:**
- Modify: `public/app.js:289-306` — rewrite with smart ellipsis, page jump input, surrounding page window

---

### Task 11: Live Filtering (Feature 12)

**Files:**
- Modify: `public/app.js:359-378` — add `debouncedApplyFilters()`, attach `input` listeners to search/logger/thread/regex inputs, `change` listeners to date inputs

---

## Phase 3: Visual & Filter Enhancements (Features 4, 6, 7, 8, 9, 10, 13, 14, 15)

### Task 12: Collapsible Sidebar Filter Panel (Feature 4)

**Files:**
- Modify: `public/index.html` — wrap filters in `<aside class="sidebar">`, wrap summary+charts+results in `<main class="main-content">`, add `.layout` wrapper
- Modify: `public/style.css` — sidebar layout (flex, sticky, transition, collapsed state)
- Modify: `public/app.js` — sidebar toggle handler

---

### Task 13: Virtualized Result List (Feature 6)

**Files:**
- Modify: `public/app.js:244-277` — replace innerHTML string rendering with DocumentFragment for better performance

---

### Task 14: Copy-to-Clipboard on Error Messages (Feature 7)

**Files:**
- Modify: `public/app.js` — add click handler on `.message` span for clipboard copy + toast
- Modify: `public/style.css` — cursor pointer, hover underline on message

---

### Task 15: Sticky Summary Cards (Feature 8)

**Files:**
- Modify: `public/style.css` — add `position: sticky; top: 0; z-index: 10;` to `.summary-section`

---

### Task 16: Additional Charts — Bar & Heatmap (Feature 9)

**Files:**
- Modify: `src/analyzer.js` — add `getHourlyHeatmap()` and `getThreadDistribution()` functions
- Modify: `src/server.js` — include in `/api/filter` response
- Modify: `public/index.html` — add 2 new canvas elements in second row
- Modify: `public/app.js` — render bar chart (threads) and horizontal bar (hourly)
- Modify: `public/style.css` — update chart grid

---

### Task 17: Chart Zoom & Drill-Down (Feature 10)

**Files:**
- Modify: `public/app.js` — add `onClick` handlers on timeline chart (sets date filter) and logger chart (sets logger filter)

---

### Task 18: Regex Validation Feedback (Feature 14)

**Files:**
- Modify: `public/app.js` — add/remove `invalid` class on regexFilter in applyFilters
- Modify: `public/style.css` — `.filters input.invalid` red border style

---

### Task 19: Filter Count Badges (Feature 15)

**Files:**
- Modify: `public/index.html` — add `<span id="filterCount">` in sidebar header
- Modify: `public/app.js` — count active filters, update badge text/visibility
- Modify: `public/style.css` — badge style

---

## Phase 4: Export & Sharing (Features 16, 17)

### Task 20: Shareable Filter URLs (Feature 17)

**Files:**
- Modify: `public/app.js` — add `encodeFilterState()` (writes to URL via `history.replaceState`) and `decodeFilterState()` (restores from URL params), call in `applyFilters` and on page load

---

## Phase 5: Advanced Features (Features 23–30)

### Task 21: Multi-File Analysis (Feature 23)

**Files:**
- Modify: `public/index.html` — add multi-file input and Compare button
- Modify: `src/server.js` — add `/api/compare` endpoint using `Promise.all`
- Modify: `public/app.js` — compare handler, renderComparison function

---

### Task 22: Real-Time Log Tailing (Feature 24)

**Files:**
- Create: `src/tailer.js` — `watchLogFile(filePath, onEntry)` using `fs.watch` + incremental read
- Modify: `src/server.js` — add WebSocket server with `ws` package, handle watch/stop messages
- Modify: `public/app.js` — add WebSocket client `startTailing(filePath)` that shows new entries as toasts
- Modify: `package.json` — add `ws` dependency

---

### Task 23: Parallel Export (Feature 25)

**Files:**
- Modify: `public/index.html` — add "Export All" button
- Modify: `public/app.js` — click handler uses `Promise.all` for CSV+JSON+PDF, downloads all 3

---

### Task 24: Background File Indexing (Feature 26)

**Files:**
- Modify: `src/server.js` — add `/api/analyze/stream` SSE endpoint that reports progress every 1000 entries
- Modify: `public/app.js` — for large files, use SSE endpoint with progress display

---

### Task 25: Concurrent Chart Generation (Feature 27)

**Files:**
- Modify: `src/server.js` — parallelize chart data generation with `Promise.all` in `/api/filter`

---

### Task 26: Auto-Categorization Engine (Feature 28)

**Files:**
- Create: `src/categorizer.js` — `categorizeError(message, logger)` with pattern-based categories (Sling, OSGi, Replication, JCR, Oak, Security, Performance, Configuration, Workflow, Search, Other)
- Modify: `src/analyzer.js` — add `category` field to all grouped results
- Modify: `public/index.html` — add category filter dropdown
- Modify: `public/app.js` — populate categories after analysis, filter by category in applyFilters

---

### Task 27: Trend Comparison (Feature 29)

**Files:**
- Modify: `src/analyzer.js` — add `getTrendComparison(entries, days)` function
- Modify: `src/server.js` — add `/api/trend` endpoint
- Modify: `public/index.html` — add trend section
- Modify: `public/app.js` — fetch and display trend data

---

### Task 28: Alert Threshold Checker (Feature 30)

**Files:**
- Create: `src/alerts.js` — `checkAlerts(summary, results, thresholds)` with default thresholds
- Modify: `src/server.js` — add `/api/alerts/check` endpoint
- Modify: `public/index.html` — add alerts panel
- Modify: `public/app.js` — fetch alerts after analysis, display in panel
- Modify: `public/style.css` — alert item styles

---

## Verification

After all tasks:
- [ ] `npm run dashboard` starts without errors
- [ ] All UI elements render (sidebar, charts, toasts, alerts)
- [ ] All filters work (live, date range, regex, category)
- [ ] All exports work (CSV, JSON, PDF, Export All)
- [ ] Keyboard shortcuts work
- [ ] Dark mode covers all new elements
- [ ] Multi-file compare works
- [ ] Real-time tailing via WebSocket works
