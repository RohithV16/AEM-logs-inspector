class ValidationFeedback {
  static states = {
    waiting: { icon: '○', color: '#ccc', text: 'Ready to paste' },
    valid: { icon: '✓', color: '#4caf50', text: 'Format looks good' },
    invalid: { icon: '✗', color: '#f44336', text: 'Invalid format' },
    validating: { icon: '⟳', color: '#2196f3', text: 'Checking...' }
  };

  static validators = {
    clientId: (value) => {
      const regex = /^[a-zA-Z0-9]{32,}$/;
      return { valid: regex.test(value), message: 'Must be at least 32 alphanumeric characters' };
    },
    clientSecret: (value) => {
      const noSpaces = !/\s/.test(value);
      const longEnough = value.length >= 32;
      return {
        valid: longEnough && noSpaces,
        message: noSpaces ? 'Must be at least 32 characters' : 'Cannot contain spaces'
      };
    },
    technicalAccountId: (value) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return { valid: uuidRegex.test(value), message: 'Must be a valid UUID format' };
    },
    technicalAccountEmail: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return { valid: emailRegex.test(value), message: 'Must be a valid email address' };
    },
    imsOrgId: (value) => {
      const regex = /^[a-f0-9]{24}$/i;
      return { valid: regex.test(value), message: 'Must be 24 hexadecimal characters' };
    }
  };

  static render(fieldName, state, message) {
    const stateConfig = this.states[state] || this.states.waiting;
    return `
      <div class="validation-feedback validation-${state}" data-field="${fieldName}">
        <span class="validation-icon" style="color: ${stateConfig.color}">${stateConfig.icon}</span>
        <span class="validation-text" style="color: ${stateConfig.color}">${message || stateConfig.text}</span>
      </div>
    `;
  }

  static updateField(fieldName, state, message = null) {
    const field = document.querySelector(`[data-field="${fieldName}"]`);
    if (!field) return;

    const input = field.querySelector('input');
    const validationPlaceholder = document.getElementById(`validation-${fieldName}`);

    input.classList.remove('input-valid', 'input-invalid', 'input-validating');
    if (state !== 'waiting') {
      input.classList.add(`input-${state}`);
    }

    if (validationPlaceholder) {
      validationPlaceholder.innerHTML = this.render(fieldName, state, message);
    }
  }

  static validateField(fieldName, value) {
    const validator = this.validators[fieldName];
    if (!validator) return { valid: true };

    const result = validator(value);

    if (value.length === 0) {
      this.updateField(fieldName, 'waiting');
      return { valid: null };
    }

    const state = result.valid ? 'valid' : 'invalid';
    this.updateField(fieldName, state, result.message);

    return result;
  }

  static attachRealTimeValidation(formId = 'credential-form') {
    const form = document.getElementById(formId);
    if (!form) return;

    const fields = ['clientId', 'clientSecret', 'technicalAccountId', 'technicalAccountEmail', 'imsOrgId'];

    fields.forEach(fieldName => {
      const input = form.querySelector(`#field-${fieldName}`);
      if (!input) return;

      input.addEventListener('input', (e) => {
        const value = e.target.value;
        let state = 'waiting';
        let message = null;

        if (value.length > 0) {
          const result = this.validateField(fieldName, value);
          if (result.valid === true) {
            state = 'valid';
            message = this.states.valid.text;
          } else if (result.valid === false) {
            state = 'invalid';
            message = result.message;
          }
        }

        this.updateField(fieldName, state, message);
      });

      input.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value.length > 0) {
          this.validateField(fieldName, value);
        }
      });
    });
  }

  static showToast(message, type = 'error', duration = 5000) {
    const container = document.getElementById('toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'error' ? '✗' : '✓'}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.classList.add('toast-fade-out');
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
  }

  static createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }
}

module.exports = ValidationFeedback;
