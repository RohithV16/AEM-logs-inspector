class CredentialForm {
  static fields = [
    { name: 'clientId', label: 'Client ID', placeholder: 'Paste from Adobe Console', type: 'text' },
    { name: 'clientSecret', label: 'Client Secret', placeholder: 'Paste from Adobe Console', type: 'password', showToggle: true },
    { name: 'technicalAccountId', label: 'Technical Account ID', placeholder: 'UUID format', type: 'text' },
    { name: 'technicalAccountEmail', label: 'Technical Account Email', placeholder: 'user@adobe.com', type: 'email' },
    { name: 'imsOrgId', label: 'IMS Organization ID', placeholder: 'Copy from Adobe Console', type: 'text' }
  ];

  static scopes = [
    { name: 'openid', label: 'openid', description: 'Basic authentication' },
    { name: 'AdobeID', label: 'AdobeID', description: 'Adobe ID access' },
    { name: 'read_organizations', label: 'read_organizations', description: 'Read organization data' },
    { name: 'additional_info.projectedProductContext', label: 'additional_info.projectedProductContext', description: 'Product context access' },
    { name: 'read_pc.dma_aem_ams', label: 'read_pc.dma_aem_ams', description: 'AEM Managed Services access' }
  ];

  static render(credentials = {}, errors = {}) {
    const fieldsHtml = this.fields.map(field => {
      const error = errors[field.name];
      const value = credentials[field.name] || '';
      const errorClass = error ? 'input-error' : '';
      const errorHtml = error ? `<span class="error-message">${error}</span>` : '';
      
      let inputHtml = `<input 
        type="${field.type}" 
        name="${field.name}" 
        id="field-${field.name}"
        placeholder="${field.placeholder}"
        value="${value}"
        class="${errorClass}"
        autocomplete="off"
      >`;

      if (field.showToggle) {
        inputHtml += `<button type="button" class="toggle-visibility" data-target="field-${field.name}">Show</button>`;
      }

      return `
        <div class="form-group" data-field="${field.name}">
          <label for="field-${field.name}">${field.label}</label>
          <div class="input-wrapper">
            ${inputHtml}
          </div>
          <div class="validation-placeholder" id="validation-${field.name}"></div>
          ${errorHtml}
        </div>
      `;
    }).join('');

    const scopesHtml = this.scopes.map(scope => `
      <div class="scope-item">
        <label class="checkbox-label">
          <input type="checkbox" name="scopes" value="${scope.name}" checked>
          <span class="scope-name">${scope.label}</span>
          <span class="scope-description">${scope.description}</span>
        </label>
      </div>
    `).join('');

    return `
      <form id="credential-form" class="credential-form">
        <div class="form-section">
          <h3>Credentials</h3>
          <p class="section-description">Enter your Adobe IMS credentials from the Adobe Console.</p>
          ${fieldsHtml}
        </div>

        <div class="form-section">
          <h3>Required Scopes</h3>
          <p class="section-description">These scopes are required for Cloud Manager access.</p>
          <div class="scopes-list">
            ${scopesHtml}
          </div>
        </div>

        <div class="form-section">
          <h3>Custom Scope</h3>
          <div class="custom-scope-input">
            <input 
              type="text" 
              id="custom-scope-input" 
              placeholder="e.g., additional_info.requestedProductContext"
            >
            <button type="button" id="add-scope-btn" class="btn-secondary">Add</button>
          </div>
          <div id="custom-scopes-list" class="custom-scopes-list"></div>
        </div>

        <div class="form-actions">
          <button type="button" id="guide-btn" class="btn-secondary">
            How to get credentials
          </button>
          <button type="submit" id="validate-btn" class="btn-primary">
            Validate Credentials
          </button>
        </div>
      </form>
    `;
  }

  static getFormValues() {
    const form = document.getElementById('credential-form');
    if (!form) return null;

    const values = {};
    this.fields.forEach(field => {
      const input = form.querySelector(`#field-${field.name}`);
      if (input) {
        values[field.name] = input.value.trim();
      }
    });

    const scopes = [];
    form.querySelectorAll('input[name="scopes"]:checked').forEach(cb => {
      scopes.push(cb.value);
    });

    form.querySelectorAll('.custom-scope-item').forEach(item => {
      scopes.push(item.dataset.scope);
    });

    values.scopes = scopes;
    return values;
  }

  static setFieldError(fieldName, message) {
    const field = document.querySelector(`[data-field="${fieldName}"]`);
    if (!field) return;

    const input = field.querySelector('input');
    const errorSpan = field.querySelector('.error-message');

    if (input) input.classList.add('input-error');
    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.style.display = 'block';
    }
  }

  static clearFieldError(fieldName) {
    const field = document.querySelector(`[data-field="${fieldName}"]`);
    if (!field) return;

    const input = field.querySelector('input');
    const errorSpan = field.querySelector('.error-message');

    if (input) input.classList.remove('input-error');
    if (errorSpan) {
      errorSpan.textContent = '';
      errorSpan.style.display = 'none';
    }
  }

  static clearAllErrors() {
    this.fields.forEach(field => {
      this.clearFieldError(field.name);
    });
  }

  static attachEventListeners(callbacks = {}) {
    const form = document.getElementById('credential-form');
    if (!form) return;

    if (callbacks.onValidate) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        callbacks.onValidate(this.getFormValues());
      });
    }

    if (callbacks.onGuide) {
      const guideBtn = document.getElementById('guide-btn');
      if (guideBtn) {
        guideBtn.addEventListener('click', callbacks.onGuide);
      }
    }

    const toggleBtns = form.querySelectorAll('.toggle-visibility');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.textContent = isPassword ? 'Hide' : 'Show';
        }
      });
    });

    const addScopeBtn = document.getElementById('add-scope-btn');
    const customScopeInput = document.getElementById('custom-scope-input');
    const customScopesList = document.getElementById('custom-scopes-list');

    if (addScopeBtn && customScopeInput && customScopesList) {
      addScopeBtn.addEventListener('click', () => {
        const scope = customScopeInput.value.trim();
        if (scope && !this.scopeExists(scope)) {
          const scopeItem = document.createElement('div');
          scopeItem.className = 'custom-scope-item';
          scopeItem.dataset.scope = scope;
          scopeItem.innerHTML = `
            <span class="scope-name">${scope}</span>
            <button type="button" class="remove-scope">&times;</button>
          `;
          scopeItem.querySelector('.remove-scope').addEventListener('click', () => {
            scopeItem.remove();
          });
          customScopesList.appendChild(scopeItem);
          customScopeInput.value = '';
        }
      });
    }
  }

  static scopeExists(scope) {
    const list = document.getElementById('custom-scopes-list');
    if (!list) return false;
    return Array.from(list.querySelectorAll('.custom-scope-item')).some(
      item => item.dataset.scope === scope
    );
  }
}

module.exports = CredentialForm;
