# AEM Log Inspector

A Node.js tool for analyzing Adobe Experience Manager (AEM) error and warning logs. Provides both a CLI interface and an Express-based web dashboard.

## Features

### Core Analysis
- Parse AEM error logs (ERROR and WARN levels)
- Group duplicate errors/warnings by message with normalization
- Automatic error categorization (Sling, OSGi, Replication, JCR, Oak, Security, Performance, Configuration, Workflow, Search)
- Timeline analysis by date
- Logger distribution analysis
- Thread distribution analysis
- Hourly heatmap visualization (events by hour of day)
- Trend comparison (recent vs. previous period)
- Multi-error analysis across multiple error logs
- Merged error-log output across multiple files

### Filtering & Search
- Filter by date range, logger, thread, or regex
- Category-based filtering
- Safe regex validation to prevent catastrophic backtracking
- Filter presets (save/load custom filter configurations)
- URL state encoding (shareable filter links)
- Advanced structured search builder

### Export & Reporting
- Export to CSV, JSON, or PDF
- Export multi-error results in all formats at once

### Real-Time Monitoring
- WebSocket-based live log tailing
- Configurable alerting system with thresholds (max errors, warnings, critical loggers)
- Server-Sent Events (SSE) streaming for large file analysis

### Web Dashboard
- Interactive charts (timeline, logger distribution, thread distribution, hourly heatmap)
- Dark mode support
- Pagination with page jump
- Keyboard shortcuts (Ctrl+F to search, Esc to clear, Arrow keys to navigate)
- Copy message to clipboard
- Collapsible sidebar and charts
- Skeleton loading states
- Toast notifications

### Performance
- Streaming analysis for large files (>50MB)

## Project Structure

```
logs-inspector/
├── src/
│   ├── index.js              # CLI entry point
│   ├── parser.js             # Log file parsing and detection
│   ├── analyzer.js           # Core analysis functions
│   ├── categorizer.js        # Error categorization
│   ├── tailer.js             # Real-time log file watching
│   ├── alerts.js             # Configurable alerting system
│   ├── grouper.js            # Error grouping utilities
│   ├── exporter.js           # Export to CSV, JSON, PDF
│   ├── server.js             # Express web dashboard with WebSocket
│   ├── routes/               # API route handlers
│   │   ├── analyze.js        # /api/analyze endpoints
│   │   ├── filter.js         # /api/filter, /api/trend endpoints
│   │   ├── events.js         # /api/raw-events endpoint
│   │   └── export.js         # /api/export/*, /api/alerts/check endpoints
│   ├── services/            # Log analysis services
│   │   ├── errorLogService.js    # AEM error log analysis
│   │   ├── requestLogService.js  # Request log analysis
│   │   └── cdnLogService.js      # CDN log analysis
│   └── utils/                # Utility functions
│       ├── constants.js      # App constants
│       ├── files.js          # File validation helpers
│       ├── response.js       # API response helpers
│       └── regex.js          # Regex validation
├── public/
│   ├── index.html            # Dashboard UI
│   ├── app.js                # Frontend logic
│   └── style.css             # Styles
├── package.json
└── README.md
```

## Installation

```bash
npm install
```

## Usage

### CLI Mode

Analyze a log file directly from the command line:

```bash
npm start <path-to-log-file>
```

Example:

```bash
npm start /path/to/author_aemerror.log
```

### Web Dashboard

Start the interactive dashboard:

```bash
npm run dashboard
```

Then open http://localhost:3000 in your browser.

Use the main Analyze source field for one or more error log paths.
If you paste two or more error log paths into the main field, the dashboard merges them into the same results view.
The multi-error flow uses the dedicated multi-error endpoints internally.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` or `/` | Focus search |
| `Esc` | Clear filters |
| `←` | Previous page |
| `→` | Next page |

## API Endpoints

- `POST /api/analyze` - Analyze a log file (with streaming support for large files)
- `POST /api/filter` - Filter and analyze with additional filters (includes timeline, logger distribution, hourly heatmap, thread distribution)
- `POST /api/trend` - Get trend comparison data
- `POST /api/raw-events` - Get raw log entries (paginated)
- `POST /api/analyze/multi-error` - Analyze multiple error logs in one merged view
- `POST /api/raw-events/multi-error` - Get merged raw events for multiple error logs
- `POST /api/alerts/check` - Check analysis results against alert thresholds
- `POST /api/export/csv` - Export results to CSV
- `POST /api/export/json` - Export results to JSON
- `POST /api/export/pdf` - Export summary to PDF
- WebSocket `/` - Real-time log tailing and analyze

## Log Format

Expected log format:

```
DD.MM.YYYY HH:MM:SS.mmm [thread] *LEVEL* [logger] message
```

Example:

```
16.03.2026 14:30:15.123 [qtp123456-123] *ERROR* [com.day.cq.replication] Replication queue failed
```

## License

MIT
