class OnboardingWizard {
  constructor() {
    this.currentStep = 1;
    this.completedSteps = [];
    this.wizardData = {};
    this.stepIndicators = new StepIndicators();
    this.credentialForm = null;
    this.isLoading = false;
  }

  async init() {
    try {
      const response = await fetch('/api/onboarding/status');
      const data = await response.json();

      if (data.completed) {
        this.showSuccessScreen(true);
        return;
      }

      if (data.hasCredentials) {
        this.currentStep = 5;
        this.completedSteps = [1, 2, 3, 4];
      }

      this.render();
    } catch (error) {
      this.showError('Failed to load onboarding status');
      this.render();
    }
  }

  render() {
    const container = document.getElementById('onboarding-wizard');
    if (!container) return;

    const stepIndicatorsHtml = this.stepIndicators.render(this.currentStep, this.completedSteps);
    const stepContent = this.getStepContent(this.currentStep);
    const footerButtons = this.renderFooterButtons();

    container.innerHTML = `
      ${stepIndicatorsHtml}
      <div class="wizard-content">
        ${stepContent}
      </div>
      <div class="wizard-footer">
        ${footerButtons}
      </div>
    `;

    this.attachEventListeners();
    this.initializeStepComponents();
  }

  getStepContent(step) {
    const stepMethods = {
      1: () => this.getPrerequisitesStep(),
      2: () => this.getAdobeConsoleStep(),
      3: () => this.getCredentialsStep(),
      4: () => this.getValidationStep(),
      5: () => this.getOrganizationStep(),
      6: () => this.getProgramStep(),
      7: () => this.getVerificationStep()
    };

    return stepMethods[step] ? stepMethods[step]() : '<p>Unknown step</p>';
  }

  getPrerequisitesStep() {
    return `
      <div class="step-container">
        <h2>Prerequisites</h2>
        <p class="step-description">Before you begin, make sure you have the following:</p>
        <ul class="prerequisites-list">
          <li class="prerequisite-item completed">
            <span class="check-icon">✓</span>
            <span>Adobe Experience Manager (AEM) instance running</span>
          </li>
          <li class="prerequisite-item completed">
            <span class="check-icon">✓</span>
            <span>Access to Adobe Admin Console</span>
          </li>
          <li class="prerequisite-item completed">
            <span class="check-icon">✓</span>
            <span>Cloud Manager product enabled in your organization</span>
          </li>
          <li class="prerequisite-item completed">
            <span class="check-icon">✓</span>
            <span>Chrome, Firefox, or Safari browser</span>
          </li>
        </ul>
        <p class="step-note">All prerequisites are met. Click "Next" to continue.</p>
      </div>
    `;
  }

  getAdobeConsoleStep() {
    return `
      <div class="step-container">
        <h2>Adobe Console Setup</h2>
        <p class="step-description">You need to create a project in Adobe Developer Console to obtain OAuth credentials.</p>
        <div class="console-guide">
          <div class="guide-step">
            <div class="guide-number">1</div>
            <div class="guide-text">
              <strong>Open Adobe Developer Console</strong>
              <p>Navigate to console.adobe.io and sign in with your Adobe ID.</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="guide-number">2</div>
            <div class="guide-text">
              <strong>Create New Project</strong>
              <p>Click "Create new project" and select "Project with API".</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="guide-number">3</div>
            <div class="guide-text">
              <strong>Add Cloud Manager API</strong>
              <p>Select "Cloud Manager" from the list of APIs and click "Next".</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="guide-number">4</div>
            <div class="guide-text">
              <strong>Configure Authentication</strong>
              <p>Choose "OAuth Server-to-Server" as the authentication method.</p>
            </div>
          </div>
        </div>
        <button class="btn btn-primary open-console-btn" id="openConsoleBtn">
          Open Adobe Developer Console
        </button>
      </div>
    `;
  }

  getCredentialsStep() {
    return `
      <div class="step-container">
        <h2>OAuth Credentials</h2>
        <p class="step-description">Enter the credentials from your Adobe Developer Console project.</p>
        <div id="credential-form-container">
          ${this.credentialForm ? this.credentialForm.render() : '<p>Loading form...</p>'}
        </div>
      </div>
    `;
  }

  getValidationStep() {
    return `
      <div class="step-container">
        <h2>Validating Credentials</h2>
        <p class="step-description">Please wait while we validate your credentials...</p>
        <div class="validation-status">
          <div class="spinner"></div>
          <p class="validation-message">Connecting to Adobe services...</p>
        </div>
      </div>
    `;
  }

  async getOrganizationStep() {
    let organizations = [];
    try {
      if (this.wizardData.organizations) {
        organizations = this.wizardData.organizations;
      } else {
        const response = await fetch('/api/onboarding/organizations');
        const data = await response.json();
        organizations = data.organizations || [];
        this.wizardData.organizations = organizations;
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }

    const orgOptions = organizations.map(org => 
      `<option value="${org.id}">${org.name}</option>`
    ).join('');

    return `
      <div class="step-container">
        <h2>Select Organization</h2>
        <p class="step-description">Choose the Adobe organization you want to use with Cloud Manager.</p>
        <div class="form-group">
          <label for="organization-select">Organization</label>
          <select id="organization-select" class="form-control">
            <option value="">Select an organization...</option>
            ${orgOptions}
          </select>
        </div>
      </div>
    `;
  }

  async getProgramStep() {
    let programs = [];
    try {
      if (this.wizardData.programs) {
        programs = this.wizardData.programs;
      } else {
        const response = await fetch('/api/onboarding/programs');
        const data = await response.json();
        programs = data.programs || [];
        this.wizardData.programs = programs;
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    }

    const programOptions = programs.map(program => 
      `<option value="${program.id}">${program.name}</option>`
    ).join('');

    return `
      <div class="step-container">
        <h2>Select Program</h2>
        <p class="step-description">Choose the Cloud Manager program you want to configure.</p>
        <div class="form-group">
          <label for="program-select">Program</label>
          <select id="program-select" class="form-control">
            <option value="">Select a program...</option>
            ${programOptions}
          </select>
        </div>
      </div>
    `;
  }

  getVerificationStep() {
    return `
      <div class="step-container">
        <h2>Verify & Complete</h2>
        <p class="step-description">Final verification in progress...</p>
        <div class="verification-spinner">
          <div class="spinner large"></div>
          <p class="verification-message">Verifying your configuration...</p>
        </div>
      </div>
    `;
  }

  renderFooterButtons() {
    const isFirstStep = this.currentStep === 1;
    const isLastStep = this.currentStep === 7;

    return `
      <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
      ${!isFirstStep ? '<button class="btn btn-secondary" id="backBtn">Back</button>' : ''}
      ${!isLastStep ? '<button class="btn btn-primary" id="nextBtn">Next</button>' : ''}
    `;
  }

  attachEventListeners() {
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const openConsoleBtn = document.getElementById('openConsoleBtn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => this.previousStep());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancel());
    }

    if (openConsoleBtn) {
      openConsoleBtn.addEventListener('click', () => this.openAdobeConsole());
    }
  }

  initializeStepComponents() {
    if (this.currentStep === 3 && !this.credentialForm) {
      if (typeof CredentialForm !== 'undefined') {
        this.credentialForm = new CredentialForm();
        this.credentialForm.init();
        document.getElementById('credential-form-container').innerHTML = this.credentialForm.render();
      }
    }
  }

  async nextStep() {
    const isValid = await this.validateStep(this.currentStep);
    if (!isValid) return;

    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps.push(this.currentStep);
    }

    if (this.currentStep === 7) {
      await this.completeSetup();
    } else {
      this.currentStep++;
      this.render();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
    }
  }

  async validateStep(step) {
    const validationMethods = {
      1: () => this.validatePrerequisites(),
      2: () => this.validateAdobeConsole(),
      3: () => this.validateCredentials(),
      4: () => this.validateConnection(),
      5: () => this.validateOrganization(),
      6: () => this.validateProgram(),
      7: () => this.validateVerification()
    };

    const validator = validationMethods[step];
    if (validator) {
      return await validator();
    }
    return true;
  }

  validatePrerequisites() {
    return true;
  }

  validateAdobeConsole() {
    return true;
  }

  async validateCredentials() {
    if (!this.credentialForm) {
      if (typeof CredentialForm !== 'undefined') {
        this.credentialForm = new CredentialForm();
      } else {
        this.showError('Credential form not loaded');
        return false;
      }
    }

    const credentials = this.credentialForm.getValues();
    if (!credentials.clientId || !credentials.clientSecret) {
      this.showError('Please enter both Client ID and Client Secret');
      return false;
    }

    this.wizardData.credentials = credentials;
    this.isLoading = true;
    this.render();

    try {
      const response = await fetch('/api/onboarding/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      if (!data.success) {
        this.showError(data.message || 'Failed to save credentials');
        this.isLoading = false;
        this.render();
        return false;
      }

      return true;
    } catch (error) {
      this.showError('Failed to validate credentials');
      this.isLoading = false;
      this.render();
      return false;
    }
  }

  async validateConnection() {
    this.isLoading = true;
    this.render();

    try {
      const response = await fetch('/api/onboarding/verify-connection');
      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        this.showError(data.message || 'Connection verification failed');
        return false;
      }
    } catch (error) {
      this.showError('Failed to verify connection');
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  validateOrganization() {
    const select = document.getElementById('organization-select');
    if (!select || !select.value) {
      this.showError('Please select an organization');
      return false;
    }

    this.wizardData.organizationId = select.value;
    this.wizardData.organizationName = select.options[select.selectedIndex].text;
    return true;
  }

  validateProgram() {
    const select = document.getElementById('program-select');
    if (!select || !select.value) {
      this.showError('Please select a program');
      return false;
    }

    this.wizardData.programId = select.value;
    this.wizardData.programName = select.options[select.selectedIndex].text;
    return true;
  }

  async validateVerification() {
    try {
      const response = await fetch('/api/onboarding/verify-connection');
      const data = await response.json();
      return data.success;
    } catch (error) {
      return false;
    }
  }

  async completeSetup() {
    this.isLoading = true;
    this.render();

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.wizardData)
      });

      const data = await response.json();
      if (data.success) {
        this.showSuccessScreen();
      } else {
        this.showError(data.message || 'Setup completion failed');
        this.isLoading = false;
        this.render();
      }
    } catch (error) {
      this.showError('Failed to complete setup');
      this.isLoading = false;
      this.render();
    }
  }

  showSuccessScreen(isAlreadyCompleted = false) {
    const container = document.getElementById('onboarding-wizard');
    if (!container) return;

    container.innerHTML = `
      <div class="success-container">
        <div class="success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="#4CAF50" stroke-width="4"/>
            <path d="M20 32L28 40L44 24" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>${isAlreadyCompleted ? 'Setup Complete' : 'Congratulations!'}</h2>
        <p class="success-message">
          ${isAlreadyCompleted 
            ? 'Your Cloud Manager is already configured and ready to use.' 
            : 'You have successfully completed the Cloud Manager setup wizard.'}
        </p>
        <button class="btn btn-primary" id="startUsingBtn">
          ${isAlreadyCompleted ? 'Go to Dashboard' : "Start Using Cloud Manager"}
        </button>
      </div>
    `;

    document.getElementById('startUsingBtn').addEventListener('click', () => {
      if (isAlreadyCompleted) {
        window.location.href = '/';
      } else {
        window.location.reload();
      }
    });
  }

  showError(message) {
    const existingToast = document.querySelector('.toast-error');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    document.body.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  openAdobeConsole() {
    window.open('https://console.adobe.io/projects', '_blank');
  }

  cancel() {
    if (confirm('Are you sure you want to cancel the setup wizard? Your progress will be saved.')) {
      const container = document.getElementById('onboarding-wizard');
      if (container) {
        container.innerHTML = `
          <div class="cancel-container">
            <p>Setup has been paused. You can resume anytime from the dashboard.</p>
            <button class="btn btn-secondary" onclick="window.location.reload()">Resume Setup</button>
          </div>
        `;
      }
    }
  }
}
