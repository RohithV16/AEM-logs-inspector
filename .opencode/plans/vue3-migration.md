# Vue 3 Migration - Implementation Document

## Project Overview

**Goal:** Migrate AEM Log Inspector frontend from vanilla JS to Vue 3 with Tailwind CSS  
**Tech Stack:** Vue 3 + Vite + Pinia + Tailwind CSS + Chart.js  
**Backend:** Unchanged (Express API)  

---

## Architecture

```
logs-inspector/
├── src/                      # Backend (unchanged)
├── frontend/                 # NEW Vue 3 app
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppHeader.vue
│   │   │   ├── FileUpload.vue
│   │   │   ├── FilterPanel/
│   │   │   │   ├── FilterPanel.vue
│   │   │   │   ├── SearchableMultiSelect.vue
│   │   │   │   ├── ErrorFilters.vue
│   │   │   │   ├── RequestFilters.vue
│   │   │   │   └── CDNFilters.vue
│   │   │   ├── EventList.vue
│   │   │   ├── EventCard.vue
│   │   │   ├── LevelChips.vue
│   │   │   ├── ChartsContainer.vue
│   │   │   └── ExportBar.vue
│   │   ├── composables/
│   │   │   ├── useApi.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── usePresets.ts
│   │   ├── stores/
│   │   │   └── logStore.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── smartGrouping.ts
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── public/                   # REMOVE after migration
```

---

## Feature List with Implementation Steps

### Phase 1: Project Setup

| Feature | Description | File |
|---------|-------------|------|
| 1.1 Initialize Vue 3 + Vite | Create frontend/ with Vue 3, TypeScript, Vite | `package.json`, `vite.config.ts` |
| 1.2 Install Tailwind CSS | Add Tailwind + forms plugin | `tailwind.config.js`, `postcss.config.js` |
| 1.3 Install dependencies | Vue, Pinia, Chart.js, etc. | `package.json` |
| 1.4 Configure API proxy | Proxy /api to localhost:3000 | `vite.config.ts` |
| 1.5 Entry point | index.html + main.ts | `index.html`, `src/main.ts` |

### Phase 2: State Management & API

| Feature | Description | File |
|---------|-------------|------|
| 2.1 Pinia store | Central state: file, logType, filters, events, pagination | `src/stores/logStore.ts` |
| 2.2 API composable | All /api/* calls wrapped in composable | `src/composables/useApi.ts` |
| 2.3 WebSocket composable | Progress updates, tail mode | `src/composables/useWebSocket.ts` |
| 2.4 Presets composable | localStorage save/load | `src/composables/usePresets.ts` |
| 2.5 Utility functions | escapeHtml, highlightText, smartGrouping | `src/utils/formatters.ts`, `src/utils/smartGrouping.ts` |

### Phase 3: Core Components

| Feature | Description | File |
|---------|-------------|------|
| 3.1 AppHeader | Logo, title, dark mode toggle | `src/components/AppHeader.vue` |
| 3.2 FileUpload | Drag-drop, path input, analyze button, tail button | `src/components/FileUpload.vue` |
| 3.3 EmptyState | Shown when no file loaded | `src/components/EmptyState.vue` |
| 3.4 Toast notifications | Success/error/warning toasts | `src/components/ToastContainer.vue` |

### Phase 4: Filter System

| Feature | Description | File |
|---------|-------------|------|
| 4.1 SearchableMultiSelect | Reusable: search + multi-select + tags | `src/components/FilterPanel/SearchableMultiSelect.vue` |
| 4.2 ErrorFilters | Package → Logger (cascading) → Pods → Exception | `src/components/FilterPanel/ErrorFilters.vue` |
| 4.3 RequestFilters | Method, Status, Response Time, Pod | `src/components/FilterPanel/RequestFilters.vue` |
| 4.4 CDNFilters | Method, Status, Cache, Country, POP, TTFB, Host | `src/components/FilterPanel/CDNFilters.vue` |
| 4.5 FilterPanel container | Switches between log-type panels | `src/components/FilterPanel/FilterPanel.vue` |
| 4.6 DateRangePicker | Start/end datetime inputs | `src/components/FilterPanel/DateRangePicker.vue` |
| 4.7 FilterActions | Apply/Clear buttons, preset save/load | `src/components/FilterPanel/FilterActions.vue` |

### Phase 5: Events Display

| Feature | Description | File |
|---------|-------------|------|
| 5.1 LevelChips | ERROR/WARN/INFO/DEBUG toggle chips | `src/components/LevelChips.vue` |
| 5.2 EventCard | Expandable card for single event (error/request/cdn) | `src/components/EventCard.vue` |
| 5.3 EventList | List of EventCard + pagination | `src/components/EventList.vue` |
| 5.4 RawSearch | Search input with regex support | `src/components/RawSearch.vue` |

### Phase 6: Charts

| Feature | Description | File |
|---------|-------------|------|
| 6.1 ChartsContainer | Toggle charts visibility | `src/components/ChartsContainer.vue` |
| 6.2 TimelineChart | Errors/warnings over time (line) | `src/components/charts/TimelineChart.vue` |
| 6.3 LoggerChart | Top loggers (doughnut) | `src/components/charts/LoggerChart.vue` |
| 6.4 HeatmapChart | Events by hour (bar) | `src/components/charts/HeatmapChart.vue` |

### Phase 7: Export & Presets

| Feature | Description | File |
|---------|-------------|------|
| 7.1 ExportBar | CSV/JSON/PDF/All buttons | `src/components/ExportBar.vue` |
| 7.2 Export handlers | Trigger API calls, download files | `src/composables/useApi.ts` |

### Phase 8: Integration & Polish

| Feature | Description | File |
|---------|-------------|------|
| 8.1 App.vue orchestration | Put all components together | `src/App.vue` |
| 8.2 Keyboard shortcuts | / for search, Esc to clear | `src/App.vue` |
| 8.3 Dark mode | Full dark/light theme with Tailwind | `tailwind.config.js` |
| 8.4 Server update | Serve Vue in production | `src/server.js` |

### Phase 9: Cleanup

| Feature | Description | File |
|---------|-------------|------|
| 9.1 Remove old public/ | Delete vanilla JS files | `public/` |
| 9.2 Final test | All log types work | - |

---

## Testing Checklist (Per Feature)

After implementing each feature:

- [ ] **Unit test**: Component renders without errors
- [ ] **Integration test**: Component works with store/composables
- [ ] **Manual test**: Feature works in browser at localhost:5173

### Testing Commands

```bash
# Start backend (Terminal 1)
npm run dashboard

# Start frontend (Terminal 2)
cd frontend && npm run dev

# Test with sample log files:
# - Error log: author_aemerror.log
# - Request log: author_aemrequest.log
# - CDN log: cdn.log
```

---

## API Endpoints (Backend - Unchanged)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze` | POST | Analyze log file, return summary |
| `/api/raw-events` | POST | Paginated event list with filters |
| `/api/filter` | POST | Get filtered data for charts |
| `/api/export/csv` | POST | Export to CSV |
| `/api/export/json` | POST | Export to JSON |
| `/api/export/pdf` | POST | Export to PDF |
| WebSocket | WS | Progress updates, tail mode |

---

## Data Structures

### logStore State

```typescript
interface LogState {
  // File
  filePath: string
  fileContent: string | null
  logType: 'error' | 'request' | 'cdn'
  
  // Analysis results
  timeline: Record<string, { ERROR: number, WARN: number }>
  filterOptions: FilterOptions
  levelCounts: { ALL: number, ERROR: number, WARN: number, INFO: number, DEBUG: number }
  
  // Filters
  filters: {
    search: string
    from: string
    to: string
    regex: string
    level: string
    // Error filters
    packages: string[]
    loggers: string[]
    thread: string
    exception: string
    category: string
    // Request filters
    method: string
    httpStatus: string
    minResponseTime: number
    maxResponseTime: number
    pod: string
    // CDN filters
    cache: string
    clientCountry: string
    pop: string
    host: string
    minTtfb: number
    maxTtfb: number
  }
  
  // Events
  events: LogEvent[]
  totalEvents: number
  currentPage: number
  perPage: number
  
  // UI
  loading: boolean
  chartsVisible: boolean
  error: string | null
}
```

---

## Implementation Order with Checkpoints

```
Phase 1: Setup
├── 1.1 Initialize project
├── 1.2 Configure Tailwind
├── 1.3 Test: npm run dev shows Vue app
│
Phase 2: State & API
├── 2.1 Pinia store
├── 2.2 useApi composable
├── 2.3 Test: Can call /api/analyze from Vue
│
Phase 3: Core Components
├── 3.1 AppHeader
├── 3.2 FileUpload
├── 3.3 Test: Can upload file and see progress
│
Phase 4: Filters
├── 4.1 SearchableMultiSelect
├── 4.2 ErrorFilters (with cascading)
├── 4.3 RequestFilters
├── 4.4 CDNFilters
├── 4.5 Test: Filters update store correctly
│
Phase 5: Events
├── 5.1 LevelChips
├── 5.2 EventCard
├── 5.3 EventList
├── 5.4 Test: Can view paginated events
│
Phase 6: Charts
├── 6.1 ChartsContainer
├── 6.2 Timeline/Logger/Heatmap
├── 6.3 Test: Charts render with data
│
Phase 7: Export
├── 7.1 ExportBar
├── 7.2 Test: Can download CSV/JSON/PDF
│
Phase 8: Integration
├── 8.1 Full App.vue
├── 8.2 Dark mode
├── 8.3 Test: All features work end-to-end
│
Phase 9: Cleanup
├── 9.1 Remove public/
├── 9.2 Final verification
```

---

## Notes

- Use TypeScript for store, composables, and utils
- Vue components can use `<script setup>` syntax
- Keep Tailwind utility classes for rapid styling
- Reuse existing backend API unchanged
- All features from current vanilla JS implementation must work
