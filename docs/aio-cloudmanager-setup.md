# Cloud Manager Onboarding Guide

A step-by-step guide to setting up Cloud Manager integration for downloading and analyzing AEM logs directly from Adobe's Cloud Manager service.

## Quick Start

### Run Setup Script

```bash
npm run setup:cloudmanager
```

This command opens the dashboard setup wizard automatically.

### Complete the Wizard (5 minutes)

The setup wizard guides you through these steps:

- Prerequisites checked automatically
- Get credentials from Adobe Console (guided)
- Paste 5 credential fields
- Select organization and program
- Verify connection
- Done!

---

## Step-by-Step Instructions

### Step 1: Run Setup Script

Open your terminal and run:

```bash
npm run setup:cloudmanager
```

The script will:

- Check that Node.js 17+ is installed
- Verify npm is available
- Install the Adobe I/O CLI (if not present)
- Install the Cloud Manager plugin for AIO CLI
- Open the setup wizard in your browser

**What it checks:**

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| Node.js | 17.x or higher | LTS recommended |
| npm | 8.x or higher | Comes with Node.js |
| Operating System | macOS, Linux, Windows | WSL for Windows |

[SCREENSHOT: Terminal showing setup script running and performing prerequisite checks]

---

### Step 2: Dashboard Opens

When the wizard launches, you'll see:

- Welcome screen explaining what Cloud Manager does
- "Get Started" button to begin
- Link to this documentation

[SCREENSHOT: Dashboard setup wizard welcome screen]

The wizard runs in your default browser at `http://localhost:3000`.

---

### Step 3: Get OAuth Credentials

You need to create or use existing OAuth credentials from Adobe Console.

**Open Adobe Console:**

Go to: [https://console.adobe.io/projects](https://console.adobe.io/projects)

1. **Sign in** with your Adobe ID
2. **Create or select a project:**
   - Click "Create project" or select an existing one
   - Give it a memorable name like "AEM Log Analyzer"

[SCREENSHOT: Adobe Console projects page]

3. **Add API:**
   - In your project, click "Add API"
   - Select "Cloud Manager" from the list
   - Choose "OAuth Server-to-Server" authentication

[SCREENSHOT: Selecting Cloud Manager API]

4. **Get Your Credentials:**

Copy these 5 values from the credentials screen:

| Field | Where to Find It |
|-------|------------------|
| **Client ID** | Top of the credentials page |
| **Client Secret** | Below Client ID, click "Retrieve client secret" |
| **Technical Account ID** | In the service credentials JSON section |
| **Technical Account Email** | In the service credentials JSON section |
| **IMS Organization ID** | In the service credentials JSON section |

[SCREENSHOT: Adobe Console credentials page showing all 5 fields highlighted]

**Note:** The "scopes" field is pre-filled and you can use the default values.

---

### Step 4: Paste into Wizard

Back in the setup wizard, enter each credential:

| Field | What to Paste |
|-------|---------------|
| Client ID | The client_id value |
| Client Secret | The client_secret value |
| Technical Account ID | The technical_account_id (UUID format) |
| Technical Account Email | The technical_account_email |
| IMS Organization ID | The ims_org_id (24-character hex) |

[SCREENSHOT: Setup wizard with credential fields]

**Real-Time Validation:**

As you paste each field:

- Green checkmark = valid format
- Red X = invalid or missing
- All fields must be valid before proceeding

**Field Requirements:**

| Field | Format | Example |
|-------|--------|---------|
| Client ID | String | `abc123def456...` |
| Client Secret | String | `p8e-...` |
| Technical Account ID | UUID | `BB23F54A69D4B4A90A88C...` |
| Technical Account Email | Email | `technical-account@AdobeOrg.adobe.com` |
| IMS Organization ID | 24-char hex | `24A3567B8C70D2B50A49...` |

---

### Step 5: Select Organization

After credentials are validated, the wizard shows your Adobe organizations:

[SCREENSHOT: Organization selection dropdown]

**If you have only one organization:**
- It's automatically selected
- Click "Next" to continue

**If you have multiple organizations:**
- Choose from the dropdown
- Make sure you select the correct org for your AEM environments

---

### Step 6: Select Program

The wizard lists all Cloud Manager programs accessible to your credentials:

[SCREENSHOT: Program selection dropdown]

**What is a Program?**
A program typically represents a solution like "AEM Cloud Service" or "AEM On-Premise".

- Select the program containing your AEM environments
- Note: Programs usually have Production, Stage, and Development environments

---

### Step 7: Verify Connection

The wizard runs a connection test:

```
Testing connection to Cloud Manager API...
✓ Authentication successful
✓ Retrieved programs list
✓ Verified access to program
```

[SCREENSHOT: Connection verification success screen]

**If verification fails:**

| Error | Solution |
|-------|----------|
| Invalid credentials | Re-enter credentials from Adobe Console |
| Access denied | Ensure your account has Cloud Manager access |
| Network error | Check your internet connection |

---

## Glossary

| Term | Definition |
|------|------------|
| **Client ID** | Your application's unique identifier in Adobe's system |
| **Client Secret** | A password for your application (keep this secret!) |
| **Technical Account ID** | A unique UUID that identifies your service account |
| **Technical Account Email** | The email address associated with the service account |
| **IMS Organization ID** | Your Adobe organization's unique identifier (24 hex characters) |
| **Scope** | Permissions granted to your application (e.g., read_organizations) |
| **Cloud Manager** | Adobe's CI/CD platform for managing AEM cloud environments |
| **AIO CLI** | Adobe I/O Command Line Interface for interacting with Adobe services |

---

## Troubleshooting

### Common Issues

#### "Node.js version error"

**Problem:** Setup script reports Node.js version is too old.

**Solution:**

1. Check your current version:
   ```bash
   node --version
   ```

2. Update Node.js:
   - **macOS:** `brew install node`
   - **Windows:** Download from [nodejs.org](https://nodejs.org)
   - **Linux:** `sudo apt update && sudo apt install nodejs`

#### "Failed to install AIO CLI"

**Problem:** The script couldn't install the Adobe I/O CLI.

**Solution:**

Install manually:

```bash
npm install -g @adobe/aio-cli
```

Then retry:

```bash
npm run setup:cloudmanager
```

#### "Failed to list organizations"

**Problem:** Credentials were accepted but organization list is empty.

**Solution:**

1. Verify credentials are correct in Adobe Console
2. Ensure your Adobe account has Cloud Manager access
3. Try regenerating credentials in Adobe Console
4. Re-enter the new credentials in the wizard

#### "Credentials expired"

**Problem:** Connection works but then fails after setup.

**Solution:**

1. Go to [https://console.adobe.io/projects](https://console.adobe.io/projects)
2. Find your project
3. Regenerate the OAuth credentials
4. Run setup again:
   ```bash
   npm run setup:cloudmanager
   ```

#### "API rate limit exceeded"

**Problem:** Too many requests to Cloud Manager API.

**Solution:**

Wait 5-10 minutes and try again. The rate limits reset periodically.

---

## Resuming Setup

### If the wizard closed early

Simply run the setup command again:

```bash
npm run setup:cloudmanager
```

Existing credentials are auto-detected if previously entered. The wizard resumes from where you left off.

### If credentials were already saved

The wizard detects existing credentials and offers options:

- **Use existing credentials** - Continue with saved configuration
- **Re-enter credentials** - Clear and start fresh
- **Reset everything** - Remove all saved data and start over

---

## Resetting Everything

To completely remove Cloud Manager setup and start fresh:

```bash
# Remove saved credentials
rm ~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json

# Remove AIO CLI context (optional)
aio config:delete ims.contexts.aio-cli-plugin-cloudmanager

# Run setup again
npm run setup:cloudmanager
```

---

## What Happens Next

After successful setup:

1. **Close the wizard**
2. **Start the dashboard:**
   ```bash
   npm run dashboard
   ```
3. **Select "Cloud Manager" as your source**

   [SCREENSHOT: Dashboard with Cloud Manager source selected]

4. **Choose a program and environment**
   - Select from your configured programs
   - Pick Production, Stage, or Development

5. **Download and analyze logs!**

   The dashboard can now:
   - List log files in your Cloud Manager environments
   - Download error logs directly
   - Analyze them with all the standard tools

---

## Security Notes

Your credentials are secure:

- **Stored locally** - Only on YOUR machine in `~/.aem-log-analyzer/setup/`
- **Never transmitted** - Credentials go directly from your browser to Adobe's API
- **No cloud storage** - Nothing is sent to any external server
- **File permissions** - The config file is restricted to owner only (600)
- **Passwords hidden** - Client secrets are never shown in plain text

**For added security on shared machines:**

```bash
# Restrict file permissions
chmod 600 ~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json
```

---

## Manual Setup (Advanced)

For users who prefer not to use the wizard, manual setup is available.

### Prerequisites

```bash
# Install AIO CLI
npm install -g @adobe/aio-cli

# Install Cloud Manager plugin
aio plugins:install @adobe/aio-cli-plugin-cloudmanager
```

### Create Config File

```bash
# Create directory
mkdir -p ~/.aem-log-analyzer/setup

# Create and edit config file
touch ~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json
```

### Edit Config File

Open the file and add your credentials:

```json
{
  "client_id": "your-client-id-from-adobe-console",
  "client_secrets": ["your-client-secret"],
  "technical_account_id": "uuid-format-technical-account-id",
  "technical_account_email": "technical-account@AdobeOrg.adobe.com",
  "ims_org_id": "24-character-hex-org-id",
  "scopes": ["openid", "AdobeID", "read_organizations"],
  "oauth_enabled": true
}
```

### Set AIO CLI Context

```bash
aio config:set ims.contexts.aio-cli-plugin-cloudmanager \
  ~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json --file --json
```

### Verify Setup

```bash
# List accessible programs
aio cloudmanager:list-programs
```

### Debug Mode

For troubleshooting, run with verbose output:

```bash
DEBUG=* npm run setup:cloudmanager
```

---

## Getting Help

### Official Documentation

- **Adobe I/O CLI:** [https://github.com/adobe/aio-cli](https://github.com/adobe/aio-cli)
- **Cloud Manager API:** [https://developer.adobe.com/experience-cloud/cloud-manager/](https://developer.adobe.com/experience-cloud/cloud-manager/)
- **Adobe Console Help:** [https://developer.adobe.com/developer-console/docs/guides/](https://developer.adobe.com/developer-console/docs/guides/)

### Report Issues

If you encounter a bug or have a feature request:

1. Check existing issues in the repository
2. Create a new issue with:
   - Your operating system and version
   - Node.js version (`node --version`)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages or screenshots

---

## Config File Reference

### Location

```
~/.aem-log-analyzer/setup/cloudmanager-oauth-config.json
```

### Full Schema

```json
{
  "client_id": "string (required) - Your app's Adobe client ID",
  "client_secrets": ["string (required) - Client secret array"],
  "technical_account_id": "string (required) - UUID of technical account",
  "technical_account_email": "string (required) - Service account email",
  "ims_org_id": "string (required) - 24-character hex Adobe org ID",
  "scopes": ["string (required) - Array of OAuth scopes"],
  "oauth_enabled": "boolean (required) - Must be true"
}
```

### Environment Variables (Optional)

You can also use environment variables instead of the config file:

```bash
export AIO_CLIENT_ID=your-client-id
export AIO_CLIENT_SECRET=your-client-secret
export AIO_TECHNICAL_ACCOUNT_ID=your-technical-account-id
export AIO_TECHNICAL_ACCOUNT_EMAIL=your-email
export AIO_IMS_ORG_ID=your-org-id
```

The wizard checks environment variables before the config file.

---

*Last updated: April 2026*
