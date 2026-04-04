class StepIndicators {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 7;
    this.completedSteps = [];
  }

  render(currentStep, completedSteps = []) {
    this.currentStep = currentStep;
    this.completedSteps = completedSteps;

    const progressPercentage = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;

    return `
      <div class="step-indicators">
        <div class="step-progress-bar">
          <div class="step-progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="step-progress-text">Step ${this.currentStep} of ${this.totalSteps}</div>
        <div class="step-list">
          ${this.renderStepCircles()}
        </div>
        <div class="step-labels">
          ${this.renderStepLabels()}
        </div>
      </div>
    `;
  }

  renderStepCircles() {
    let html = '';
    for (let i = 1; i <= this.totalSteps; i++) {
      const isCompleted = this.completedSteps.includes(i);
      const isCurrent = i === this.currentStep;
      const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : '';

      if (isCompleted) {
        html += `<div class="step-circle ${statusClass}" data-step="${i}">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>`;
      } else {
        html += `<div class="step-circle ${statusClass}" data-step="${i}">${i}</div>`;
      }
    }
    return html;
  }

  renderStepLabels() {
    let html = '';
    for (let i = 1; i <= this.totalSteps; i++) {
      const isCompleted = this.completedSteps.includes(i);
      const isCurrent = i === this.currentStep;
      const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : '';
      const name = this.getStepName(i);

      html += `<div class="step-label ${statusClass}" data-step="${i}">${name}</div>`;
    }
    return html;
  }

  getStepName(stepNum) {
    const stepNames = {
      1: 'Prerequisites',
      2: 'Adobe Console',
      3: 'OAuth Credentials',
      4: 'Validate Fields',
      5: 'Select Organization',
      6: 'Select Program',
      7: 'Verify & Complete'
    };
    return stepNames[stepNum] || `Step ${stepNum}`;
  }
}
