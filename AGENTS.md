# Agent Guidelines for AEM Log Inspector

This document provides guidelines for AI agents working on this codebase.

## Project Overview

AEM Log Inspector is a Node.js tool for analyzing Adobe Experience Manager (AEM) error and warning logs. It provides both a CLI interface and an Express-based web dashboard for log analysis.

## Project Structure

```
logs-inspector/
├── src/
│   ├── index.js      # CLI entry point
│   ├── parser.js     # Log file parsing
│   ├── analyzer.js   # Log analysis and aggregation
│   └── server.js     # Express web dashboard
├── public/            # Frontend assets (HTML, JS, CSS)
├── package.json
└── README.md
```

## Build, Lint, and Test Commands

### Running the Application

```bash
# CLI mode - analyze a log file
npm start <path-to-log-file>

# Example:
npm start /path/to/author_aemerror.log

# Start the web dashboard
npm run dashboard
# Opens at http://localhost:3000
```

### Testing

This project currently has **no test suite**. When adding tests:

```bash
# Run tests with Jest (recommended)
npx jest

# Run a single test file
npx jest src/parser.test.js

# Run tests matching a pattern
npx jest --testNamePattern="parseLine"
```

### Linting

No ESLint configuration exists. Install and configure if needed:

```bash
npm install --save-dev eslint
npx eslint src/**/*.js
```

## Code Style Guidelines

### General Conventions

- **Language**: Plain JavaScript (ES6+) - no TypeScript
- **Module System**: CommonJS (`require`/`module.exports`)
- **Indentation**: 2 spaces
- **Line Endings**: Unix (LF)

### Naming Conventions

```javascript
// Variables and functions: camelCase
const filePath = '/path/to/log';
function parseLogFile(filePath) { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const LOG_PATTERN = /^(\d{2}\.\d{2}\.\d{4} ...)$/;

// Classes: PascalCase (if used)
// function names should be verbs: parseX, getY, analyzeZ
```

### Import/Require Order

1. Node.js built-in modules (`fs`, `path`, `crypto`)
2. External packages (`express`, `chart.js`)
3. Local modules (`./parser`, `./analyzer`)

```javascript
const fs = require('fs');
const path = require('path');
const express = require('express');
const { analyzeLogFile } = require('./analyzer');
```

### File Organization

- One export per file (or related exports)
- `module.exports` at end of file
- Private functions prefixed with `_` or defined as module-local
- Group related functions together

### Error Handling

- Use `try/catch` for synchronous operations
- Use `.catch()` or try/catch with async/await for async operations
- Provide meaningful error messages
- Sanitize error messages before exposing to users (see `sanitizeErrorMessage` in server.js)
- Use `process.exit(1)` for fatal CLI errors

```javascript
// Good error handling examples
if (!filePath) {
  console.error('Usage: npm start <path-to-log-file>');
  process.exit(1);
}

try {
  const data = fs.readFileSync(filePath, 'utf-8');
} catch (error) {
  res.json({ success: false, error: sanitizeErrorMessage(error.message) });
}
```

### Async/Await Patterns

- Use `async/await` for asynchronous operations
- Use generators for streaming large files
- Handle errors in async routes with try/catch

```javascript
async function analyzeLogFileStream(stream) {
  const grouped = {};
  for await (const entry of stream) {
    // process entry
  }
  return Object.values(grouped).sort((a, b) => b.count - a.count);
}
```

### Security Considerations

- Validate file paths to prevent directory traversal
- Sanitize user inputs in regex patterns
- Limit file sizes (max 500MB for uploads)
- Only allow `.log` and `.txt` file extensions
- Use `isSafeRegex` for filtering with user-provided patterns

```javascript
function isSafeRegex(pattern) {
  if (!pattern || typeof pattern !== 'string') return null;
  if (pattern.length > MAX_REGEX_LENGTH) {
    return { error: 'Pattern too long (max 100 characters)' };
  }
  // Check for dangerous patterns
  // ...
}
```

### Express Routes

- Return JSON responses with `{ success, data, error }` structure
- Clean up temporary files in `finally` blocks
- Validate and sanitize all inputs

```javascript
app.post('/api/analyze', (req, res) => {
  let tempFile = null;
  try {
    // process request
    res.json({ success: true, summary, results });
  } catch (error) {
    res.json({ success: false, error: sanitizeErrorMessage(error.message) });
  } finally {
    cleanupTempFile(tempFile);
  }
});
```

## Adding New Features

1. **Parser functions** go in `src/parser.js`
2. **Analyzer functions** go in `src/analyzer.js`
3. **Express routes** go in `src/server.js`
4. **CLI commands** go in `src/index.js`

## Common Tasks

### Adding a new filter

1. Add filter function to `src/analyzer.js`
2. Add API endpoint in `src/server.js` under `/api/filter`
3. Add frontend control in `public/app.js`

### Adding export format

1. Add export function to `src/analyzer.js`
2. Add endpoint in `src/server.js` under `/api/export/:format`
3. Add download button in frontend

## References

- Express.js: https://expressjs.com/
- Chart.js: https://www.chartjs.org/
- jsPDF: https://github.com/parallax/jsPDF
