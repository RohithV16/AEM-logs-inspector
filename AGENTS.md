# Agent Guidelines for AEM Log Inspector

A Node.js tool for analyzing Adobe Experience Manager (AEM) logs with CLI and Express web dashboard.

## Project Structure

```
logs-inspector/
├── src/
│   ├── index.js              # CLI entry point
│   ├── parser.js             # Log parsing (error, request, CDN logs)
│   ├── analyzer.js           # Core analysis functions
│   ├── categorizer.js        # Error categorization
│   ├── tailer.js             # Real-time file watching
│   ├── alerts.js             # Configurable alerting
│   ├── grouper.js            # Error grouping utilities
│   ├── exporter.js           # Export to CSV, JSON, PDF
│   ├── server.js             # Express API + WebSocket server
│   ├── routes/               # API route handlers
│   │   ├── analyze.js        # /api/analyze endpoints
│   │   ├── filter.js         # /api/filter, /api/trend endpoints
│   │   ├── events.js         # /api/raw-events endpoint
│   │   └── export.js         # /api/export/*, /api/alerts/check
│   ├── services/             # Log analysis services
│   │   ├── errorLogService.js    # AEM error log analysis
│   │   ├── requestLogService.js  # Request log analysis
│   │   └── cdnLogService.js      # CDN log analysis
│   └── utils/                # Utility functions
│       ├── constants.js      # App constants
│       ├── files.js          # File validation helpers
│       ├── response.js       # API response helpers
│       └── regex.js          # Regex validation
├── public/                   # Frontend assets
├── package.json
└── README.md
```

## Build, Lint, and Test Commands

```bash
# Run the CLI
npm start <path-to-log-file>

# Start web dashboard
npm run dashboard
# Opens at http://localhost:3000

# Testing
npm test                           # Run all tests
npx jest src/parser.test.js       # Run a single test file

# Linting
npm run lint                      # Lint all JS files
```

## Code Style Guidelines

### Language & Formatting

- **Language**: JavaScript (ES6+), CommonJS modules (`require`/`module.exports`)
- **Indentation**: 2 spaces
- **Line Endings**: Unix (LF)

### Naming Conventions

- `camelCase` for variables and functions: `const filePath`, `function parseLogFile()`
- `SCREAMING_SNAKE_CASE` for constants: `const MAX_FILE_SIZE = 500 * 1024 * 1024`
- Use verbs for function names: `parseX`, `getY`, `analyzeZ`, `createX`

### Import/Require Order

1. Node.js built-in modules (`fs`, `path`)
2. External packages (`express`, `chart.js`)
3. Local modules (`./analyzer`, `./tailer`)

### File Organization

- Group related functions together
- Use section comments: `/* === Section Name === */`
- `module.exports` at end of file
- Private functions prefixed with `_` or kept module-local


## Adding New Features

| Feature Type | Location |
|--------------|----------|
| Parser functions | `src/parser.js` |
| Analyzer functions | `src/analyzer.js` |
| Express routes | `src/routes/*.js` |
| Log services | `src/services/*.js` |
| CLI commands | `src/index.js` |
| Error categories | `src/categorizer.js` |
| Real-time features | `src/tailer.js` |
| Alert rules | `src/alerts.js` |
| Utilities | `src/utils/*.js` |

### Adding a New Filter

1. Add filter builder function in `src/analyzer.js`
2. Add API endpoint in `src/routes/filter.js`
3. Add frontend controls in `public/app.js`

### Adding a New Log Type

1. Add parser functions in `src/parser.js`
2. Add analyzer functions in `src/analyzer.js`
3. Add service in `src/services/` (e.g., `errorLogService.js`)
4. Add detection logic in `src/parser.js` (`detectLogType`)
5. Add route handler in `src/routes/analyze.js`

## Key Constants

```javascript
const ALLOWED_LOG_EXTENSIONS = ['.log', '.txt', '.gz'];
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;     // 5GB for file path mode
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;        // 500MB for browser upload
const STREAM_THRESHOLD = 50 * 1024 * 1024;        // 50MB - use streaming above
const MAX_REGEX_LENGTH = 100;
const REGEX_TIMEOUT_MS = 100;
const PORT = 3000;
```

