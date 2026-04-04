class AdobeConsoleGuide {
  static open() {
    window.open('https://console.adobe.io/projects', '_blank');
  }

  static render() {
    return `
      <div class="guide-dialog" id="adobe-console-guide">
        <div class="guide-header">
          <h2>Adobe Console Setup Guide</h2>
          <button class="guide-close" id="guide-close-btn">&times;</button>
        </div>
        
        <div class="guide-content">
          <div class="guide-section">
            <h3>Prerequisites</h3>
            <p>Before starting, make sure you have:</p>
            <ul class="checklist">
              <li><span class="check">✓</span> An Adobe account with admin rights</li>
              <li><span class="check">✓</span> Access to Adobe Cloud Manager</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>Step 1: Access Adobe Console</h3>
            <p>Open Adobe Console and navigate to Projects.</p>
            <a href="https://console.adobe.io/projects" target="_blank" class="btn-link">
              Open Adobe Console →
            </a>
          </div>

          <div class="guide-section">
            <h3>Step 2: Create a New Project</h3>
            <ol class="step-list">
              <li>Click <strong>"Create new project"</strong></li>
              <li>Select <strong>"Project type" → "Trust" </strong>for service-to-service authentication</li>
              <li>Name your project (e.g., "Cloud Manager Access")</li>
            </ol>
          </div>

          <div class="guide-section">
            <h3>Step 3: Add API</h3>
            <ol class="step-list">
              <li>In your project, click <strong>"Add API"</strong></li>
              <li>Search for and select <strong>"Cloud Manager API"</strong></li>
              <li>Choose authentication type: <strong>"OAuth Server-to-Server"</strong></li>
            </ol>
          </div>

          <div class="guide-section">
            <h3>Step 4: Configure Product Profiles</h3>
            <p>Link the API to product profiles that grant Cloud Manager access:</p>
            <ul class="checklist">
              <li><span class="check">✓</span> <strong>Cloud Manager - Dev</strong> for development environments</li>
              <li><span class="check">✓</span> <strong>Cloud Manager - Stage</strong> for staging environments</li>
              <li><span class="check">✓</span> <strong>Cloud Manager - Prod</strong> for production environments</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>Step 5: Collect Credentials</h3>
            <p>Once the API is configured, you'll see these credentials:</p>
            <div class="credential-locations">
              <div class="credential-item">
                <strong>Client ID</strong>
                <span class="hint">Shown as "Client ID" in credentials table</span>
              </div>
              <div class="credential-item">
                <strong>Client Secret</strong>
                <span class="hint">Click "Download" or "Copy" to get the secret</span>
              </div>
              <div class="credential-item">
                <strong>Technical Account ID</strong>
                <span class="hint">In the credentials details section</span>
              </div>
              <div class="credential-item">
                <strong>Technical Account Email</strong>
                <span class="hint">Format: user@tech_acc.adobe.com</span>
              </div>
              <div class="credential-item">
                <strong>IMS Organization ID</strong>
                <span class="hint">Your organization's 24-char hex ID</span>
              </div>
            </div>
          </div>

          <div class="guide-section warning">
            <h3>⚠ Important</h3>
            <ul class="warning-list">
              <li>Keep the Adobe Console tab open - you may need to return</li>
              <li>Client Secret is shown only once - save it securely</li>
              <li>Wait 2-5 minutes after creating credentials before validating</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>Need Help?</h3>
            <ul class="help-links">
              <li><a href="https://developer.adobe.com/developer-console/docs/guides/" target="_blank">Developer Console Docs</a></li>
              <li><a href="https://developer.adobe.com/experience-cloud/cloud-manager/" target="_blank">Cloud Manager Documentation</a></li>
            </ul>
          </div>
        </div>

        <div class="guide-footer">
          <button class="btn-primary" id="guide-done-btn">Got it</button>
        </div>
      </div>
    `;
  }

  static show() {
    const existingGuide = document.getElementById('adobe-console-guide');
    if (existingGuide) {
      existingGuide.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'guide-overlay';
    overlay.id = 'guide-overlay';
    overlay.innerHTML = this.render();
    document.body.appendChild(overlay);

    document.getElementById('guide-close-btn').addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('guide-done-btn').addEventListener('click', () => {
      this.hide();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });
  }

  static hide() {
    const guide = document.getElementById('adobe-console-guide');
    const overlay = document.getElementById('guide-overlay');
    if (guide) guide.remove();
    if (overlay) overlay.remove();
  }
}

module.exports = AdobeConsoleGuide;
