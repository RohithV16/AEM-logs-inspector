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

### Filtering & Search
- Filter by date range, logger, thread, or regex
- Category-based filtering
- Safe regex validation to prevent catastrophic backtracking
- Filter presets (save/load custom filter configurations)
- URL state encoding (shareable filter links)

### Export & Reporting
- Export to CSV, JSON, or PDF
- Batch export (download all formats at once)

### Real-Time Monitoring
- WebSocket-based live log tailing
- Configurable alerting system with thresholds (max errors, warnings, critical loggers)
- Server-Sent Events (SSE) streaming for large file analysis

### Web Dashboard
- Interactive charts (timeline, logger distribution, thread distribution, hourly heatmap)
- Drag & drop file upload
- Dark mode support
- Pagination with page jump
- Keyboard shortcuts (Ctrl+F to search, Esc to clear, Arrow keys to navigate)
- Copy message to clipboard
- Collapsible sidebar and charts
- Skeleton loading states
- Toast notifications

### Performance
- Streaming analysis for large files (>50MB)
- Memory-efficient processing up to 500MB

## Project Structure

```
logs-inspector/
├── src/
│   ├── index.js        # CLI entry point
│   ├── parser.js       # Log file parsing and streaming
│   ├── analyzer.js     # Log analysis, filtering, and export
│   ├── categorizer.js  # Error categorization
│   ├── tailer.js       # Real-time log file watching
│   ├── alerts.js       # Configurable alerting system
│   └── server.js       # Express web dashboard with WebSocket
├── public/
│   ├── index.html      # Dashboard UI
│   ├── app.js          # Frontend logic
│   └── style.css       # Styles
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

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` or `/` | Focus search |
| `Esc` | Clear filters |
| `←` | Previous page |
| `→` | Next page |

## API Endpoints

- `POST /api/analyze` - Analyze a log file (with streaming support for large files)
- `POST /api/analyze/stream` - SSE streaming analysis with progress updates
- `POST /api/filter` - Filter and analyze with additional filters (includes timeline, logger distribution, hourly heatmap, thread distribution)
- `POST /api/trend` - Get trend comparison data
- `POST /api/alerts/check` - Check analysis results against alert thresholds
- `POST /api/export/csv` - Export results to CSV
- `POST /api/export/json` - Export results to JSON
- `POST /api/export/pdf` - Export summary to PDF
- WebSocket `/` - Real-time log tailing

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
