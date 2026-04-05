# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code. Use `src/index.js` for the CLI entry point, `src/server.js` for the Express dashboard, `src/routes/` for API endpoints, `src/services/` for higher-level analysis and Cloud Manager logic, and `src/utils/` for shared helpers and constants. Frontend assets live in `public/` with the main UI in `public/index.html`, `public/app.js`, and `public/style.css`. Unit tests are under `tests/unit/`; browser and API integration coverage lives in `tests/e2e/`. Utility scripts are in `scripts/`, and planning/design notes are in `docs/`.

## Build, Test, and Development Commands
- `npm start /path/to/log.log`: run the CLI analyzer against a local log file.
- `npm run dashboard`: start the dashboard server at `http://localhost:3000`.
- `npm test`: run the Jest unit suite.
- `npm run test:e2e`: run Playwright end-to-end tests.
- `npm run test:api`: run the API smoke script.
- `npm run lint`: lint backend source files with ESLint.

## Coding Style & Naming Conventions
Use JavaScript (CommonJS) with 2-space indentation and Unix line endings. Prefer `camelCase` for variables/functions, `SCREAMING_SNAKE_CASE` for constants, and verb-led function names such as `analyzeLogFile` or `buildDownloadCommand`. Keep imports ordered as built-ins, third-party packages, then local modules. Follow existing module boundaries: parsing in `src/parser.js`, route wiring in `src/routes/`, and reusable logic in `src/services/`.

## Testing Guidelines
Jest is the primary unit test framework; Playwright covers dashboard and API flows. Name unit tests `*.test.js` and place them in `tests/unit/` near the feature area they validate, for example `tests/unit/cloudManagerService.test.js`. Add or update tests when changing parsing, analysis, export, or Cloud Manager behavior. Run the smallest relevant suite before broader test runs.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:` and `docs:`. Keep commit subjects short and imperative, for example `feat: add CDN log option grouping`. PRs should include a clear summary, impacted areas, test coverage performed, and screenshots for UI changes. Link related issues or tasks when applicable.

## Security & Configuration Tips
Do not hardcode credentials, log samples with secrets, or machine-specific paths. Cloud Manager access depends on a working local Adobe `aio` installation and authentication outside this repository. Sanitize user-provided file paths and preserve existing safeguards in `src/utils/files.js`.
