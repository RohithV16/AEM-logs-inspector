# AEM Log Inspector - Context & Instructions

This project is a comprehensive tool for analyzing Adobe Experience Manager (AEM) logs, providing both a CLI and a web-based dashboard.

## Project Overview

- **Name:** AEM Log Inspector (aem-log-analyzer)
- **Type:** Node.js (CommonJS)
- **Purpose:** Analyze error, request, access, and CDN logs from AEM environments, including integration with Adobe Cloud Manager.
- **Key Technologies:** Express.js, WebSocket (ws), Chart.js, Worker Threads, Jest, Playwright.

### Architecture

- **Backend:** Node.js with Express for the API and dashboard server.
- **Frontend:** Vanilla JavaScript with Chart.js for data visualization. No heavy frontend frameworks.
- **Parsing:** Custom regex-based parsers for AEM-specific log formats. Supports streaming for large files (>50MB).
- **Real-time:** WebSockets for live log tailing and analysis progress updates.
- **Cloud Manager:** Integration via `@adobe/aio-cli` for downloading and tailing environment logs.

## Building and Running

- **Install Dependencies:** `npm install`
- **CLI Analysis:** `npm start <path-to-log-file>`
- **Web Dashboard:** `npm run dashboard` (Starts on port 3000 by default)
- **Unit Tests:** `npm test` (Uses Jest)
- **E2E Tests:** `npm run test:e2e` (Uses Playwright)
- **Linting:** `npm run lint` (Uses ESLint)

## Development Conventions

- **Modules:** CommonJS (`require`/`module.exports`).
- **Formatting:** 2-space indentation, Unix line endings.
- **Naming:**
  - `camelCase` for variables and functions.
  - `SCREAMING_SNAKE_CASE` for constants.
  - Verb-led function names (e.g., `analyzeLogFile`, `detectLogType`).
- **Logic Placement:**
  - `src/parser.js`: Log parsing regex and streaming logic.
  - `src/analyzer.js`: Core metrics calculation and grouping.
  - `src/services/`: Specialized services (e.g., `cloudManagerService.js`, `errorLogService.js`).
  - `src/routes/`: Express API endpoints.
  - `src/utils/`: Shared utilities (regex safety, file validation, constants).
- **Performance:** Always prefer streaming (`createLogStream`, `AsyncGenerators`) when handling potentially large log files.
- **Security:** Use `isSafeRegex` for user-provided search patterns to prevent ReDoS.

## Log Support

1.  **AEM Error Logs:** Grouping by message patterns, stack trace extraction, and hourly heatmap.
2.  **AEM Request Logs:** Tracking outbound/inbound requests with timing analysis.
3.  **Apache Access Logs:** Standard CLF/Combined format support.
4.  **CDN Logs:** JSON-formatted logs with cache performance and geographic data.

## Cloud Manager Integration

- Requires `aio` CLI and `@adobe/aio-cli-plugin-cloudmanager`.
- Logs are cached locally in `~/.aem-logs/`.
- Supports live tailing directly to the dashboard or CLI.

## Key Files for Reference

- `README.md`: Comprehensive usage and feature guide.
- `package.json`: Dependency and script definitions.
- `src/index.js`: CLI entry point and command routing.
- `src/server.js`: Web server and WebSocket implementation.
- `src/parser.js`: The "brain" of log extraction.
- `src/analyzer.js`: Core analysis algorithms.
- `docs/`: Historical specs and future planning documents.
