# AEM Log Analyzer - Enhanced Features Implementation Plan

**Goal:** Add filtering, search, visualizations, export capabilities, and UI improvements to the AEM Log Analyzer dashboard.

**Tech Stack:** Express, vanilla JS frontend, Chart.js (visualizations), jsPDF (PDF export)

---

## Task 1: Project Setup - Add Dependencies

- [ ] Run: `npm install chart.js jspdf`

---

## Task 2: Backend - Parser Date Helper

Modify `src/parser.js`:
- Add `parseTimestamp` function to convert "DD.MM.YYYY HH:MM:SS.mmm" to Date object
- Export it

---

## Task 3: Backend - Enhanced Analyzer

Modify `src/analyzer.js`:
- Add: `filterByDateRange`, `filterByLogger`, `filterByThread`, `filterByRegex`
- Add: `exportToCSV`, `exportToJSON`, `generatePDFSummary`
- Add: `getTimelineData`, `getLoggerDistribution`
- Export all new functions

---

## Task 4: Backend - New API Endpoints

Modify `src/server.js`:
- Add `/api/filter` - filtering with date range, logger, thread, regex
- Add `/api/export/csv` - CSV export
- Add `/api/export/json` - JSON export  
- Add `/api/export/pdf` - PDF export
- Add helper functions: `analyzeEntries`, `getSummaryFromEntries`

---

## Task 5: Frontend - Enhanced HTML

Modify `public/index.html`:
- Add dark mode toggle button
- Add charts section (timeline + logger distribution)
- Add filter inputs: sort dropdown, logger filter, thread filter, date range, regex
- Add filter preset save/load
- Add export buttons (CSV, JSON, PDF)
- Add pagination UI

---

## Task 6: Frontend - Enhanced CSS

Modify `public/style.css`:
- Add CSS variables for dark/light mode
- Add dark mode styles with `[data-theme="dark"]` selector
- Add chart container styles
- Add pagination styles
- Add export bar styles
- Add filter row styles

---

## Task 7: Frontend - Enhanced JavaScript

Modify `public/app.js`:
- Add dark mode toggle with localStorage persistence
- Add filter presets (save/load from localStorage)
- Add fetchChartsData() function
- Add renderCharts() with Chart.js
- Add pagination logic (50 items/page)
- Add sort options (count, timestamp, message)
- Add all filter handlers
- Add export button handlers (CSV, JSON, PDF)

---

## Task 8: Verify Implementation

- Install dependencies
- Start server: `npm run dashboard`
- Test in browser at http://localhost:3000
- Verify all features work
- Commit changes
