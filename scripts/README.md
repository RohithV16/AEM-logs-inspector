# Scripts

## test-api.js

Tests all API endpoints with a given log file.

### Usage

```bash
# Start server automatically and run tests
npm run test:api:start -- /path/to/log.log

# Or if server is already running
npm run test:api -- /path/to/log.log

# Direct node execution
node scripts/test-api.js /path/to/log.log
```

### Tested Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Full log analysis |
| POST | `/api/filter` | Filter log entries |
| POST | `/api/trend` | Trend comparison |
| POST | `/api/raw-events` | Paginated event retrieval |
| POST | `/api/alerts/check` | Alert threshold check |
| POST | `/api/export/csv` | Export to CSV |
| POST | `/api/export/json` | Export to JSON |
| POST | `/api/export/pdf` | Export to PDF |

### Output

```
Testing APIs with log file: /path/to/log.log
==================================================

Results:

✓ PASS POST /api/analyze
✓ PASS POST /api/filter
✓ PASS POST /api/trend
✓ PASS POST /api/raw-events
✓ PASS POST /api/alerts/check
✓ PASS POST /api/export/csv
✓ PASS POST /api/export/json
✓ PASS POST /api/export/pdf

==================================================

Total: 8 | Passed: 8 | Failed: 0
```
