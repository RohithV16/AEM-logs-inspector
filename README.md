# AEM Log Inspector

A Node.js tool for analyzing Adobe Experience Manager (AEM) logs. Provides both a CLI interface and an interactive Express-based web dashboard with real-time monitoring, advanced filtering, and Cloud Manager integration.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Supported Log Formats](#supported-log-formats)
- [API Reference](#api-reference)
- [Cloud Manager Integration](#cloud-manager-integration)
- [Configuration](#configuration)
- [Export Features](#export-features)
- [Security](#security)
- [Performance](#performance)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Browser Compatibility](#browser-compatibility)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Features

### CLI Analysis
- Analyze local log files from the command line
- Download and analyze logs from Adobe Cloud Manager
- Support for error, request, and CDN log types
- Automatic log type detection
- Summary statistics with top repeated errors/warnings
- Streaming mode for large files (>50MB)
- Compressed `.gz` file support

### Web Dashboard
- Interactive analysis with real-time progress updates
- Multi-file analysis with merged results
- WebSocket-based live log tailing
- Advanced structured search builder with field operators
- Filter presets (save/load configurations)
- Shareable filter links via URL state encoding
- Dark mode support
- Collapsible sidebar and charts
- Skeleton loading states and toast notifications
- Keyboard shortcuts for quick navigation

### Analysis Capabilities
- **Error Logs**: Total errors/warnings, unique counts, logger/thread distribution, package grouping, exception extraction, hourly heatmap, timeline analysis, trend comparison
- **Request Logs**: Total requests, average response time, slow requests, P95 response time, HTTP method distribution, status codes, pod distribution
- **CDN Logs**: Total requests, average TTFB/TTLB, cache hit ratio, cache statuses, country/PoP/host distribution
- **Error Categorization**: 10 categories (Sling, OSGi, Replication, JCR, Oak, Security, Performance, Configuration, Workflow, Search)

### Filtering & Search
- Filter by date range, logger, thread, or regex
- Category-based filtering
- Safe regex validation to prevent catastrophic backtracking
- Advanced search builder with multiple rule types

### Export & Reporting
- Export to CSV, JSON, or PDF
- Export multi-error results in all formats at once

### Cloud Manager Integration
- Download logs from Adobe Cloud Manager environments
- Program and environment selection via live `aio` data
- Download caching in `~/.aem-logs/`
- Progress tracking with real-time updates
- Cache management and validation

### Real-Time Monitoring
- WebSocket-based live log tailing
- Configurable alerting system with thresholds
- Server-Sent Events (SSE) for streaming analysis
- Error, warning, and critical logger threshold alerts

## Installation

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Local Setup
```bash
git clone https://github.com/RohithV16/AEM-logs-inspector.git
cd AEM-logs-inspector
npm install
```

### Cloud Manager Prerequisites
To use Cloud Manager log download features, you need the Adobe I/O CLI:

1. **Install Adobe I/O CLI:**
   ```bash
   npm install -g @adobe/aio-cli
   ```

2. **Install Cloud Manager plugin:**
   ```bash
   aio plugins:install @adobe/aio-cli-plugin-cloudmanager
   ```

3. **Authenticate with Adobe:**
   ```bash
   aio auth:login
   ```

4. **Verify setup:**
   ```bash
   aio cloudmanager:list-programs
   ```

## Usage

### CLI Mode

Analyze a local log file:

```bash
# Basic usage
npm start /path/to/log.log

# Explicit analyze command
node src/index.js analyze /path/to/log.log
```

Cloud Manager analysis:

```bash
node src/index.js cloudmanager analyze \
  --programId <id> \
  --environmentId <id> \
  --service <name> \
  --logName <name> \
  --days <n> \
  --outputDir <path>
```

**Required Cloud Manager flags:**
- `--programId`: Cloud Manager program ID
- `--environmentId`: Environment ID
- `--service`: Service name (author, publish, dispatcher)
- `--logName`: Log name (error, request, access)
- `--outputDir`: Directory to save downloaded logs
- `--days`: Number of days of logs to download (default: 1)

### Web Dashboard

Start the dashboard:

```bash
npm run dashboard
```

Open `http://localhost:3000` in your browser. The dashboard will automatically open on supported systems.

**Dashboard Features:**
- Select source: Local file or Cloud Manager
- Paste multiple error log paths for merged analysis
- Save/load filter presets
- Share filters via URL
- Live log tailing
- Export results in multiple formats

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` or `/` | Focus search |
| `Esc` | Clear filters |
| `←` | Previous page |
| `→` | Next page |

## Supported Log Formats

### AEM Error Logs
Format: `DD.MM.YYYY HH:MM:SS.mmm [thread] *LEVEL* [logger] message`

Example:
```
16.03.2026 14:30:15.123 [qtp123456-123] *ERROR* [com.day.cq.replication] Replication queue failed
```

### AEM Request Logs
Outbound requests and inbound responses with timing information.

Example:
```
16.03.2026 14:30:15.123 - - [16/Mar/2026:14:30:15 +0000] "GET /content/page.html HTTP/1.1" 200 1234
```

### Apache Access Logs
Common/Combined log format with client IP, request method, status code, and response size.

### CDN JSON Logs
JSON-formatted CDN logs with cache performance data including TTFB, TTLB, cache hit/miss status, country, and PoP information.

**Log type detection** is automatic based on:
- Filename patterns (e.g., `*error*`, `*request*`, `*cdn*`)
- Content analysis of the first few lines

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze a log file (streaming for large files) |
| `POST` | `/api/analyze/stream` | Streaming analysis with SSE |
| `POST` | `/api/analyze/multi-error` | Analyze multiple error logs merged |
| `POST` | `/api/filter` | Filter and analyze with custom filters |
| `POST` | `/api/filter/multi-error` | Filter multiple error logs |
| `POST` | `/api/trend` | Trend comparison between periods |
| `POST` | `/api/raw-events` | Get raw log entries (paginated) |
| `POST` | `/api/raw-events/multi-error` | Get merged raw events for multiple logs |
| `POST` | `/api/export/csv` | Export results to CSV |
| `POST` | `/api/export/json` | Export results to JSON |
| `POST` | `/api/export/pdf` | Export summary to PDF |
| `POST` | `/api/alerts/check` | Check results against alert thresholds |
| `GET` | `/api/cloudmanager/programs` | List Cloud Manager programs |
| `GET` | `/api/cloudmanager/programs/:programId/environments` | List environments |
| `GET` | `/api/cloudmanager/environments/:environmentId/log-options` | List log options |
| `GET` | `/api/cloudmanager/cache/logs` | View cached logs |
| `GET` | `/api/cloudmanager/cache-root` | Get cache root directory |
| `POST` | `/api/cloudmanager/download` | Download logs from Cloud Manager |
| `POST` | `/api/cloudmanager/download-analyze` | Download and analyze logs |
| `POST` | `/api/cloudmanager/validate-output-directory` | Validate output directory |
| `POST` | `/api/cloudmanager/command-preview` | Preview download commands |
| `WebSocket` | `/` | Real-time log tailing and analysis |

## Cloud Manager Integration

### Setup

1. **Install Adobe I/O CLI:**
   ```bash
   npm install -g @adobe/aio-cli
   ```

2. **Install Cloud Manager plugin:**
   ```bash
   aio plugins:install @adobe/aio-cli-plugin-cloudmanager
   ```

3. **Authenticate:**
   ```bash
   aio auth:login
   ```

4. **Verify access:**
   ```bash
   aio cloudmanager:list-programs
   ```

### Usage

**Via Dashboard:**
1. Start the dashboard: `npm run dashboard`
2. Select "Cloud Manager" as your source
3. Choose a program and environment
4. Select service and log type
5. Download and analyze

**Via CLI:**
```bash
node src/index.js cloudmanager analyze \
  --programId 123 \
  --environmentId 456 \
  --service author \
  --logName error \
  --days 7 \
  --outputDir ./logs
```

### Supported Services
- Author
- Publish
- Dispatcher

### Supported Log Types
- Error logs
- Request logs
- Access logs

### Cache Management
- Logs are cached in `~/.aem-logs/`
- View cached logs via dashboard or API
- Validate and manage cached files
- Automatic reuse of cached logs

## Configuration

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `ALLOWED_LOG_EXTENSIONS` | `.log`, `.txt`, `.gz` | Allowed file types |
| `MAX_FILE_SIZE` | 5GB | Maximum file size for analysis |
| `STREAM_THRESHOLD` | 50MB | File size to trigger streaming mode |
| `MAX_REGEX_LENGTH` | 100 | Maximum user regex pattern length |
| `REGEX_TIMEOUT_MS` | 100ms | Regex execution timeout |
| `PORT` | 3000 | Dashboard server port |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CI` | Set to disable auto-open browser in CI environments |
| `NO_OPEN_BROWSER` | Set to `1` to disable auto-open browser |

## Export Features

### Formats

**CSV:**
- Columns: Level, Count, Message, First Occurrence
- Suitable for spreadsheet analysis

**JSON:**
- Pretty-printed JSON array
- Full analysis results with metadata

**PDF:**
- Plain-text summary with top 20 issues
- Formatted for easy sharing

### Export Methods
- Dashboard UI export buttons
- API endpoints for each format
- Multi-error export (all formats at once)

## Security

### Input Validation
- **File path validation**: Prevents directory traversal attacks
- **Allowed extensions**: Only `.log`, `.txt`, `.gz` files accepted
- **File size limits**: 5GB maximum, 50MB streaming threshold

### Regex Safety
- **Length limit**: Maximum 100 characters for user-provided patterns
- **Timeout protection**: 100ms execution limit to prevent catastrophic backtracking

### Output Sanitization
- **Error message sanitization**: Prevents XSS in client responses
- **User input escaping**: All user-provided data is escaped before display

## Performance

### Large File Handling
- **Streaming mode**: Automatically enabled for files >50MB
- **Memory management**: Line-by-line processing prevents memory exhaustion
- **Worker threads**: Used for CPU-intensive analysis tasks

### Caching
- **Analysis results**: Cached to avoid reprocessing
- **Cloud Manager logs**: Cached in `~/.aem-logs/`

### Concurrent Analysis
- Multiple files can be analyzed simultaneously
- WebSocket connections handled independently
- Non-blocking I/O for all file operations

## Development

### Code Style
- JavaScript (CommonJS)
- 2-space indentation
- Unix line endings
- `camelCase` for variables/functions
- `SCREAMING_SNAKE_CASE` for constants
- Verb-led function names (e.g., `analyzeLogFile`, `buildDownloadCommand`)

### Module Organization
- `src/index.js`: CLI entry point
- `src/server.js`: Express dashboard with WebSocket
- `src/parser.js`: Log file parsing and detection
- `src/analyzer.js`: Core analysis functions
- `src/categorizer.js`: Error categorization
- `src/tailer.js`: Real-time log file watching
- `src/alerts.js`: Configurable alerting system
- `src/grouper.js`: Error grouping utilities
- `src/exporter.js`: Export to CSV, JSON, PDF
- `src/routes/`: API route handlers
- `src/services/`: Log analysis services
- `src/utils/`: Utility functions and constants

### Scripts

```bash
npm start <path-to-log-file>    # CLI analyzer
npm run dashboard               # Start web dashboard
npm test                        # Run Jest unit tests
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run Playwright with UI
npm run test:e2e:headed        # Run Playwright headed
npm run test:api               # Run API smoke tests
npm run test:api:start         # Start server and run API tests
npm run lint                   # Lint source files
```

## Testing

### Unit Tests
```bash
npm test
```
- Framework: Jest
- Location: `tests/unit/`
- Covers parsing, analysis, export, Cloud Manager logic

### E2E Tests
```bash
npm run test:e2e
```
- Framework: Playwright
- Location: `tests/e2e/`
- Covers dashboard flows and API integration

### API Tests
```bash
npm run test:api
```
- Custom smoke script
- Tests all API endpoints
- Can run with server: `npm run test:api:start`

### Linting
```bash
npm run lint
```
- ESLint configuration
- Covers all source files in `src/`

## Troubleshooting

### Cloud Manager Issues

**Authentication failures:**
```bash
# Re-authenticate
aio auth:login

# Verify plugin installation
aio plugins:list | grep cloudmanager

# Check program access
aio cloudmanager:list-programs
```

**Download errors:**
- Ensure `aio` CLI is in PATH
- Verify environment ID is correct
- Check network connectivity to Adobe APIs
- Review error messages for permission issues

### File Permission Issues
- Ensure read access to log files
- Check output directory write permissions
- Use absolute paths to avoid resolution issues

### Large File Issues
- Files >50MB use streaming mode (slower but memory-efficient)
- Maximum supported size is 5GB
- Consider splitting very large files for faster analysis
- Monitor memory usage during analysis

### Regex Timeout Errors
- User-provided regex patterns are limited to 100 characters
- Execution timeout is 100ms
- Simplify complex patterns or use literal search instead

### Dashboard Issues
- Ensure port 3000 is available
- Check for conflicting processes: `lsof -i :3000`
- Set `NO_OPEN_BROWSER=1` to disable auto-open

## Browser Compatibility

- **Supported browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Required features**: WebSocket support, LocalStorage, ES6+
- **Chart rendering**: Chart.js 4.x

## Architecture

### Backend
- **Express.js**: Web server and API framework
- **WebSocket**: Real-time communication for tailing and progress
- **Worker threads**: CPU-intensive analysis tasks
- **Streaming parsers**: Memory-efficient log processing

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **Chart.js**: Interactive visualizations
- **CSS**: Responsive design with dark mode support
- **LocalStorage**: Filter presets and user preferences

### Data Flow
1. User uploads file or selects Cloud Manager source
2. Server validates and detects log type
3. Parser extracts events from log file
4. Analyzer computes metrics and statistics
5. Results sent to client via WebSocket or HTTP
6. Dashboard renders charts and tables

### Real-Time Features
- **WebSocket**: Live log tailing and analysis progress
- **SSE**: Streaming analysis for large files
- **Alerting**: Configurable thresholds for errors/warnings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow existing code style and conventions
4. Add tests for new functionality
5. Run linting and tests before submitting
6. Submit a pull request with clear description

## License

MIT
