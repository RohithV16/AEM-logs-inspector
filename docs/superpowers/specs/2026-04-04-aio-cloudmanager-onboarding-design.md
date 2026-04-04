# AIO Cloud Manager Streamlined Onboarding Design Spec

**Date:** April 4, 2026  
**Status:** Design Phase  
**Author:** OpenCode  
**Target Users:** Completely non-technical users  
**Scope:** OAuth-only onboarding (JWT deprecated)

---

## 1. Executive Summary

This spec describes a two-phase, user-friendly onboarding system for non-technical users to set up Adobe I/O Cloud Manager integration with the logs-inspector tool.

**Phase 1 (CLI):** Automated setup of prerequisites, AIO CLI, and Cloud Manager plugin  
**Phase 2 (Dashboard):** Interactive wizard UI for credential collection and configuration

**Key Goals:**
- Zero technical knowledge required
- Auto-detect existing credentials
- Real-time validation with visual feedback
- Pause/resume capability
- Clear error recovery paths

---

## 2. User Journey

### 2.1 Happy Path (No Existing Credentials)

```
User starts on dashboard
        ↓
Click "Setup Cloud Manager" button
        ↓
See prerequisites checklist (Node.js ✓, AIO ✓, Plugin ✓)
        ↓
Step 1: Adobe Console guidance opens in new tab
        ↓
Step 2-5: User copies 5 credentials, pastes into form
        ↓
Real-time validation: Fields turn green as they're valid
        ↓
Step 6: Select organization and program (dropdowns)
        ↓
Step 7: Verify connection (test API call shows ✓ Success)
        ↓
Dashboard unlocked - ready to use Cloud Manager
```

### 2.2 Quick Path (Existing Valid Credentials)

```
User starts on dashboard
        ↓
Script detects valid credentials in ~/.aem-log-analyzer/setup/
        ↓
Wizard skips credential entry, goes to org/program selection
        ↓
Click "Skip, use existing credentials"
        ↓
Step 6: Select organization and program
        ↓
Step 7: Verify connection
        ↓
Done - resume where user left off
```

### 2.3 Recovery Path (Invalid/Expired Credentials)

```
User attempts Cloud Manager action
        ↓
API call returns 401 Unauthorized
        ↓
Toast notification: "Credentials expired. Re-enter them?"
        ↓
One-click "Setup Credentials" button
        ↓
Wizard opens to credential entry step
        ↓
Process continues as Happy Path
```

---

## 3. Architecture

### 3.1 Two-Phase Setup

#### Phase 1: CLI Setup Script (`scripts/setup-aio-cloudmanager.js`)

**Runs once during initial setup:**
```bash
npm run setup:cloudmanager
```

**Responsibilities:**
1. Check prerequisites (Node.js ≥17.0, npm)
2. Detect OS and architecture
3. Install AIO CLI globally (if not present)
4. Install @adobe/aio-cli-plugin-cloudmanager
5. Check for existing credentials in `~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json`
6. If credentials exist and valid → export to temp file with version info
7. Open dashboard in browser
8. Clean up temp files

**No credential collection in CLI** - all happens in dashboard Phase 2

**Exit codes:**
- 0: Success
- 1: Generic error
- 2: Prerequisite failed (Node.js, npm)
- 3: Plugin installation failed
- 10: Browser open failed

#### Phase 2: Dashboard Wizard (`public/components/onboarding-wizard.js`)

**Runs in web browser (localhost:3000):**

**Responsibilities:**
1. Display prerequisites status (pulled from Phase 1 or detected on demand)
2. Guide user to Adobe I/O Console (auto-open in new tab)
3. Collect 5 OAuth credential fields via form
4. User-customizable scopes field
5. Real-time validation of each field
6. Save validated credentials via `/api/onboarding/save-credentials`
7. Organization and program selection
8. Connection verification with Cloud Manager API
9. Success confirmation and next steps

---

### 3.2 Component Architecture

```
┌─ public/
│  ├─ index.html                    ← Main entry point
│  ├─ app.js                        ← Dashboard state + routing
│  └─ components/
│     ├─ onboarding-wizard.js       ← Wizard state machine
│     ├─ credential-form.js         ← Form UI + validation
│     ├─ step-indicators.js         ← Visual progress (1/7, progress bar)
│     ├─ validation-feedback.js     ← Real-time field validation UI
│     └─ adobe-console-guide.js     ← Instructions + auto-open browser
│
├─ public/styles/
│  └─ onboarding.css                ← Wizard styling (dark/light theme aware)
│
├─ scripts/
│  ├─ setup-aio-cloudmanager.js     ← Main CLI setup
│  └─ lib/
│     ├─ prerequisite-checker.js    ← Node, npm, AIO version checks
│     ├─ credential-loader.js       ← Load existing credentials safely
│     ├─ browser-opener.js          ← Cross-platform browser opening
│     └─ progress-tracker.js        ← Track setup progress
│
├─ src/
│  ├─ routes/
│  │  └─ onboarding.js              ← API endpoints
│  ├─ services/
│  │  └─ cloudManagerService.js     ← (modified) Add credential validation
│  └─ utils/
│     └─ credential-validator.js    ← Format validation (client ID, email, etc.)
│
└─ docs/
   ├─ aio-cloudmanager-setup.md     ← User guide with screenshots
   └─ superpowers/specs/
      └─ 2026-04-04-aio-cloudmanager-onboarding-design.md  ← This file
```

---

## 4. Data Flow

### 4.1 Credential Storage Locations

**Never in Frontend:**
- ❌ localStorage (user can inspect)
- ❌ sessionStorage
- ❌ React/Vue state sent to API
- ❌ Browser console
- ❌ HTML

**Backend (User's Home Directory):**
```
~/.aem-log-analyzer/
└── setup/
    └── cloudmanager-oauth-config.json
    
{
  "client_id": "value",
  "client_secrets": ["value1", "value2"],  // Array support
  "technical_account_id": "value",
  "technical_account_email": "value@example.com",
  "ims_org_id": "value",
  "scopes": [
    "openid",
    "AdobeID",
    "read_organizations",
    "additional_info.projectedProductContext",
    "read_pc.dma_aem_ams"
  ],
  "oauth_enabled": true,
  "_metadata": {
    "setup_date": "2026-04-04T10:30:00Z",
    "last_validated": "2026-04-04T10:35:00Z",
    "version": "4.2.4"
  }
}
```

### 4.2 Frontend State (localStorage only)

```javascript
{
  'aem_cmOnboarding': {
    status: 'not_started' | 'in_progress' | 'completed' | 'failed',
    currentStep: 1-7,
    completedSteps: [1, 2, 3],
    clientIdEntered: true,
    clientSecretEntered: true,
    // Credentials NEVER stored in frontend
    orgSelected: 'ORG123',
    programSelected: 'PROG456',
    lastOpenedDate: '2026-04-04T10:30:00Z'
  },
  
  'aem_cmPrerequisites': {
    nodeVersion: '17.0.0',
    npmVersion: '8.5.0',
    aioCliVersion: '9.0.0',
    aioPluginVersion: '4.2.4',
    lastChecked: '2026-04-04T10:25:00Z'
  }
}
```

### 4.3 API Endpoints

#### GET `/api/onboarding/status`
**Response:**
```json
{
  "success": true,
  "wizard": {
    "status": "not_started",
    "completedSteps": [],
    "currentStep": 0
  },
  "prerequisites": {
    "nodeVersion": "17.0.0",
    "aioCliInstalled": true,
    "aioPluginInstalled": true,
    "aioPluginVersion": "4.2.4"
  },
  "credentials": {
    "exists": true,
    "isValid": true,
    "lastValidated": "2026-04-04T10:35:00Z",
    "clientIdMasked": "abc123****67890",
    "orgId": "ORG123"
  }
}
```

#### POST `/api/onboarding/save-credentials`
**Request:**
```json
{
  "clientId": "value",
  "clientSecret": "value",
  "technicalAccountId": "value",
  "technicalAccountEmail": "user@example.com",
  "imsOrgId": "value",
  "scopes": ["openid", "AdobeID", "read_organizations"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials saved and validated",
  "clientIdMasked": "abc123****67890",
  "validated": true
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Invalid Client Secret format",
  "field": "clientSecret",
  "hint": "Client Secret should be 32-64 characters"
}
```

#### POST `/api/onboarding/verify-connection`
**Request:**
```json
{
  "organizationId": "ORG123",
  "programId": "PROG456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection verified",
  "organization": {
    "id": "ORG123",
    "name": "My Organization"
  },
  "program": {
    "id": "PROG456",
    "name": "My Program",
    "productionEnvironment": true
  }
}
```

#### POST `/api/onboarding/list-organizations`
**Response:**
```json
{
  "success": true,
  "organizations": [
    { "id": "ORG123", "name": "Organization 1" },
    { "id": "ORG456", "name": "Organization 2" }
  ]
}
```

#### POST `/api/onboarding/list-programs`
**Request:**
```json
{ "organizationId": "ORG123" }
```

**Response:**
```json
{
  "success": true,
  "programs": [
    { "id": "PROG123", "name": "Program 1" },
    { "id": "PROG456", "name": "Program 2" }
  ]
}
```

#### POST `/api/onboarding/complete`
**Request:**
```json
{
  "organizationId": "ORG123",
  "programId": "PROG456",
  "setAsDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Setup complete! Cloud Manager is ready to use."
}
```

---

## 5. UI/UX Specification

### 5.1 Wizard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Cloud Manager Setup Wizard                          [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Progress: [████░░░░░░░] 3/7 Steps Complete                 │
│                                                               │
│  Step 1: Prerequisites ✓                                     │
│  Step 2: Adobe Console Guidance ✓                            │
│  Step 3: Collect Credentials ✓                               │
│  Step 4: Real-time Validation →                              │
│  Step 5: Organization Selection                              │
│  Step 6: Program Selection                                   │
│  Step 7: Verify Connection                                   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  STEP 3/7: COLLECT CREDENTIALS                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                               │
│  1. Client ID                                                │
│     └─ Copy from Adobe Console → OAuth credentials           │
│     [________________] ✓                                      │
│                                                               │
│  2. Client Secret                                            │
│     └─ Copy from Adobe Console → OAuth credentials           │
│     [________________] ✓                                      │
│                                                               │
│  3. Technical Account ID                                     │
│     └─ Format: UUID (e.g., abc123...)                        │
│     [________________] ✗ (Invalid format)                    │
│                                                               │
│  4. Technical Account Email                                  │
│     └─ Format: user@example.com                              │
│     [________________] ○ (waiting)                            │
│                                                               │
│  5. IMS Organization ID                                      │
│     └─ Copy from Adobe Console → OAuth credentials           │
│     [________________] ○ (waiting)                            │
│                                                               │
│  Scopes (User-Customizable)                                  │
│  ┌──────────────────────────────────┐                        │
│  │ ☑ openid                          │                        │
│  │ ☑ AdobeID                         │                        │
│  │ ☑ read_organizations              │                        │
│  │ ☑ additional_info...              │                        │
│  │ ☑ read_pc.dma_aem_ams             │                        │
│  │ ☐ [Add custom scope...]           │                        │
│  └──────────────────────────────────┘                        │
│                                                               │
│  [← Back]                                  [Continue →]      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Validation Feedback States

**For each credential field:**

| State | Icon | Color | Message |
|-------|------|-------|---------|
| Waiting | ○ | Gray | "Ready to paste" |
| Valid | ✓ | Green | "Format looks good" |
| Invalid | ✗ | Red | "[Specific error hint]" |
| Validating | ⟳ | Blue | "Checking format..." |

**Example Invalid Formats:**
```
❌ Client ID: "Too short (8 chars), need 32+"
❌ Client Secret: "Contains space, should be alphanumeric"
❌ Email: "Invalid format, use name@example.com"
❌ Org ID: "Must be 24-character hex string"
```

### 5.3 Progress Indicators

**Option A: Numbered Steps (1/7)**
```
Step 3/7: Prerequisites
├─ ✓ Node.js v17.0.0
├─ ✓ AIO CLI v9.0.0
└─ ✓ Cloud Manager Plugin v4.2.4
```

**Option B: Progress Bar + Checkmarks**
```
Progress: [████░░░░░░░] 3/7 Complete
         ✓ ✓ ✓ ○ ○ ○ ○
```

**Use Option A (numbered steps) as recommended per design discussion.**

### 5.4 Error States & Recovery

**Network Error:**
```
⚠ Couldn't reach Adobe Cloud Manager API
→ Check your internet connection
→ [Retry] or [Use different credentials]
```

**Invalid Credentials:**
```
✗ Credentials are invalid
→ Double-check you copied the correct values from Adobe Console
→ [Paste again] or [Get help]
```

**Expired Credentials:**
```
✗ Credentials expired (last valid: 2026-04-03)
→ Generate new credentials in Adobe Console
→ [Update credentials]
```

**Organization Access Denied:**
```
✗ Your credentials don't have access to this organization
→ Check if your account has been added to the organization
→ [Try different org] or [Contact admin]
```

### 5.5 Success Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Cloud Manager Setup Complete! 🎉                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Progress: [██████████] 7/7 Steps Complete                   │
│                                                               │
│  ✓ Prerequisites verified                                    │
│  ✓ Credentials saved securely                                │
│  ✓ Organization: My Organization                             │
│  ✓ Program: My Program                                        │
│  ✓ Cloud Manager API: Connected                              │
│                                                               │
│  You can now:                                                │
│  • Download AEM logs from Cloud Manager                      │
│  • View pipeline executions                                  │
│  • Analyze production logs                                   │
│  • Access environment variables                              │
│                                                               │
│  Next steps:                                                 │
│  1. Select "Cloud Manager" source mode (top of dashboard)    │
│  2. Choose a program and environment                         │
│  3. Download and analyze logs                                │
│                                                               │
│  [Close] [View Cloud Manager] [Read Documentation]           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Details

### 6.1 Field Validation Rules

| Field | Format | Example | Validation |
|-------|--------|---------|-----------|
| Client ID | 32+ alphanumeric | `abc123...` | Regex: `/^[a-zA-Z0-9]{32,}$/` |
| Client Secret | 32+ alphanumeric, no spaces | `secret123...` | Length ≥ 32, no spaces |
| Technical Account ID | UUID format | `12345678-1234-...` | Regex: UUID pattern |
| Email | RFC 5322 email | `user@adobe.com` | Regex: `/^[^@]+@[^@]+\.[^@]+$/` |
| Org ID | 24-char hex | `abc123def456...` | Length = 24, hex only |

### 6.2 Scope Management

**Default Scopes (Required):**
```javascript
const DEFAULT_SCOPES = [
  'openid',
  'AdobeID',
  'read_organizations',
  'additional_info.projectedProductContext',
  'read_pc.dma_aem_ams'
];
```

**User Can:**
- ✓ Toggle default scopes on/off
- ✓ Add custom scopes via text input
- ✓ See description of what each scope does
- ✓ See warning if removing critical scopes

**Scope Descriptions:**
```
openid          → Required for authentication
AdobeID         → Required for Adobe account access
read_organizations  → Read-only access to organizations
additional_info.projectedProductContext → Product context
read_pc.dma_aem_ams  → Read AEM as Cloud Service management
[Custom Scope]  → User-defined scope
```

### 6.3 Security Considerations

**Credential Handling:**
1. Never log full credentials
2. Never store in frontend
3. Validate format before backend
4. Encrypt at rest (if possible via Node.js)
5. Use HTTPS in production
6. Validate input length (max 500 chars per field)
7. Sanitize error messages (no credential echoing)

**Session Management:**
1. Wizard state expires after 1 hour of inactivity
2. User must re-authenticate if session expires
3. Wizard can be paused and resumed within 24 hours
4. Clear all temp data on browser close (optional)

**Error Messages:**
- ✓ Display user-friendly hints ("Email format invalid")
- ✗ Never echo credentials in error responses
- ✗ Never expose API internals ("JWT decode failed")

### 6.4 Cross-Platform Considerations

**Operating Systems:**
- macOS: `open` command
- Linux: `xdg-open` command
- Windows: `start` command

**Browser Detection:**
- Try common paths (Chrome, Firefox, Safari, Edge)
- Fall back to default system browser
- If all fail, print URL for manual opening

**Node.js Version:**
- Min: 17.0.0
- Warn if < 18.0.0 (LTS recommended)
- Don't allow < 17.0.0

---

## 7. Testing Strategy

### 7.1 Unit Tests

```javascript
// credential-validator.test.js
describe('Credential Validation', () => {
  test('validates valid client ID format');
  test('rejects short client ID');
  test('validates valid client secret');
  test('validates RFC 5322 email');
  test('validates UUID format');
  test('validates 24-char hex org ID');
  test('detects invalid characters');
  test('handles empty values');
});

// prerequisite-checker.test.js
describe('Prerequisites', () => {
  test('detects Node.js version');
  test('detects npm installation');
  test('detects AIO CLI globally');
  test('detects Cloud Manager plugin');
  test('returns correct versions');
  test('handles missing dependencies');
});

// credential-loader.test.js
describe('Credential Loading', () => {
  test('loads existing credentials from file');
  test('validates loaded credentials');
  test('returns empty if file missing');
  test('handles corrupted JSON gracefully');
  test('masks credentials in return value');
});
```

### 7.2 Integration Tests

```javascript
// onboarding.integration.test.js
describe('Onboarding Flow', () => {
  test('Happy path: No existing creds → Full wizard');
  test('Quick path: Existing creds → Skip to org selection');
  test('Recovery path: Expired creds → Re-enter flow');
  test('All fields validated before submit');
  test('Credentials saved to correct location');
  test('Organization/Program fetched and displayed');
  test('Verification test call succeeds');
  test('Dashboard enabled after completion');
});
```

### 7.3 E2E Tests

```javascript
// onboarding.e2e.test.js (using Playwright)
describe('Onboarding E2E', () => {
  test('Full wizard flow in dashboard');
  test('Real-time validation feedback');
  test('Adobe Console auto-open');
  test('Scope customization UI');
  test('Error recovery flows');
  test('Success screen and next steps');
});
```

### 7.4 Manual Testing Checklist

- [ ] CLI setup script runs without errors
- [ ] Prerequisites correctly detected
- [ ] Existing credentials auto-detected
- [ ] Dashboard opens in default browser
- [ ] Wizard displays correct step
- [ ] Field validation shows correct feedback
- [ ] Credentials saved securely
- [ ] Org/Program dropdowns populate
- [ ] Verification succeeds
- [ ] Success screen shows correct info
- [ ] Dark/light theme switches correctly
- [ ] Mobile responsive layout works
- [ ] Error messages are clear and helpful
- [ ] Pause/resume state persists

---

## 8. Rollout & Rollback

### 8.1 Feature Flag

```javascript
// src/utils/constants.js
const FEATURE_FLAGS = {
  CLOUDMANAGER_ONBOARDING_WIZARD: process.env.ENABLE_ONBOARDING_WIZARD === 'true'
};
```

**Default:** OFF (backward compatible)  
**Enable in production:** Set `ENABLE_ONBOARDING_WIZARD=true`

### 8.2 Backward Compatibility

- Existing Cloud Manager setup still works
- Manual credential entry via config file still supported
- Old localStorage keys not touched
- API routes are new, no modifications to existing endpoints

### 8.3 Rollback Plan

If critical issues found:
1. Disable feature flag
2. Users fall back to existing setup method
3. No data loss (credentials in `~/.aem-log-analyzer/`)
4. Dashboard shows "Setup" button but it redirects to docs

---

## 9. Monitoring & Observability

### 9.1 Metrics to Track

- How many users start onboarding
- What % complete setup
- Where do they drop off (which step)
- Average time to complete
- Error rates by step
- Browser/OS distribution

### 9.2 Error Logging

```javascript
// Log setup events to backend (non-sensitive)
logger.info('Onboarding started', { step: 1, timestamp });
logger.warn('Validation failed', { field: 'clientId', step: 3 });
logger.error('Setup failed', { error: 'Network timeout', step: 7 });
```

**Never log:**
- Full credential values
- Partial secrets
- API responses with sensitive data

---

## 10. Acceptance Criteria

### Must-Have

- [x] Two-phase setup (CLI + Dashboard)
- [x] Prerequisites detection
- [x] Auto-detect existing credentials
- [x] Interactive credential collection form
- [x] Real-time field validation
- [x] User-customizable scopes
- [x] Organization/Program selection
- [x] Connection verification
- [x] Success confirmation
- [x] Error recovery paths
- [x] Progress indicator (numbered steps)
- [x] Pause/resume capability
- [x] No technical knowledge required

### Nice-to-Have

- [ ] Desktop notifications on completion
- [ ] Keyboard shortcuts (Next, Previous)
- [ ] Dark mode support for wizard
- [ ] Video tutorial embedded
- [ ] Credential export for backup
- [ ] Multi-credential support

### Non-Goals (Out of Scope)

- JWT authentication (deprecated by Adobe)
- Browser-based auth flow (out of scope for now)
- Credential sharing between machines
- Cloud storage of credentials

---

## 11. Glossary

**OAuth 2.0**: Modern secure authentication protocol used by Adobe  
**Service Account**: Non-human account (vs. user account) used for API automation  
**Technical Account ID**: Unique identifier for service account  
**IMS Organization ID**: Adobe Organization identifier  
**Scope**: Permission or privilege granted to service account  
**Cloud Manager**: Adobe's CI/CD and deployment platform

---

## 12. Success Criteria

**Technical:**
- All unit tests pass
- All integration tests pass
- E2E tests pass on macOS, Linux, Windows
- Zero credential leaks to frontend
- Error messages clear and actionable

**User Experience:**
- Non-technical user can complete setup in < 5 minutes
- User can pause and resume later
- User can fix errors without support
- Success rate > 95%
- User satisfaction score > 4.5/5

---

## Appendix: File Structure Summary

```
logs-inspector/
├── scripts/
│   ├── setup-aio-cloudmanager.js
│   └── lib/
│       ├── prerequisite-checker.js
│       ├── credential-loader.js
│       ├── browser-opener.js
│       └── progress-tracker.js
│
├── public/
│   ├── components/
│   │   ├── onboarding-wizard.js
│   │   ├── credential-form.js
│   │   ├── step-indicators.js
│   │   ├── validation-feedback.js
│   │   └── adobe-console-guide.js
│   ├── pages/
│   │   └── onboarding.html
│   ├── styles/
│   │   └── onboarding.css
│   └── app.js (modified)
│
├── src/
│   ├── routes/
│   │   └── onboarding.js
│   ├── services/
│   │   └── cloudManagerService.js (modified)
│   └── utils/
│       └── credential-validator.js
│
├── docs/
│   ├── aio-cloudmanager-setup.md
│   └── superpowers/specs/
│       └── 2026-04-04-aio-cloudmanager-onboarding-design.md
│
├── package.json (modified - add setup:cloudmanager script)
└── README.md (modified - link to setup)
```

---

**End of Design Specification**
