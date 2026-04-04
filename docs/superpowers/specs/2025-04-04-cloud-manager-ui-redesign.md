# Cloud Manager UI/UX Redesign Specification

**Date:** April 4, 2025  
**Feature:** Cloud Manager Panel Optimization  
**Status:** Design Phase Complete

## Problem Statement

The Cloud Manager panel takes up excessive vertical space when users switch to it, causing poor UX. Multiple form fields, setup options, and history are all stacked vertically without organization, making the interface feel cluttered and forcing unnecessary scrolling.

**User Pain Points:**
- Setup configuration is mixed with main workflow
- History section is always visible, consuming space
- Advanced settings (Days, Output Folder) take up space even when not needed
- Single-column layout doesn't leverage horizontal screen real estate

## Solution Overview

Reorganize the Cloud Manager panel into **three horizontal tabs**:
1. **Setup** — One-time auth configuration (Browser Login / OAuth)
2. **Download & Analyze** — Main workflow (Program/Env/Tier selection + action buttons)
3. **History** — Recent runs list

Within the main **Download & Analyze** tab, implement a collapsible **Advanced Settings** accordion to hide Days and Output Folder until needed.

### Benefits

- **60% space reduction on initial view** — Three-quarter of content moved to other tabs
- **Clear workflow** — Setup, main action, and history are logically separated
- **Discoverable** — All features remain accessible; tabbed interface is intuitive
- **Mobile-friendly** — Tabs stack better on small screens than a long vertical form

## Detailed Design

### 1. Tab Navigation Structure

**Location:** Top of Cloud Manager panel (below the source mode switch)  
**Styling:** Horizontal pill button group with active state indicator

```
[Setup] [Download & Analyze] [History]
   ↓          (active)          ↓
```

**Tab Properties:**
- Small rounded pills (border-radius: 999px)
- Background: `--color-background-tertiary`
- Active tab: Primary color gradient + shadow
- Smooth transition between tabs (0.2s)
- Spacing: 0.35rem gap between pills

### 2. Setup Tab

**Visibility:** When "Setup" tab is active

**Content:**
- Mode switch (Browser Login / OAuth) — unchanged from current design
- Config fields based on selected mode — unchanged
- Setup status messages
- "Run Setup & Create Cache" button

**Layout:**
- Same as current `#cmSetupPanel` content
- Inherits from existing `cloudmanager-setup-panel` structure

### 3. Download & Analyze Tab (Main Workflow)

**Visibility:** Default tab when Cloud Manager panel is shown  
**Layout:** Compact with collapsible section

```
[Status Banner] (hidden if not needed)
[Cache Status] (hidden if not needed)

Program / Environment / Tier Selection Grid (12-column, 3-column fields)

[Advanced Settings ▼] (Collapsed by default)
  └─ Days Input
  └─ Output Directory Input

Button Row:
  [Setup] [Check Prerequisites] [Refresh Cache] [Test Connection] [Download & Analyze]

[Result Badges] (hidden until action completes)
```

**Advanced Settings Accordion:**
- Toggle element with chevron icon
- Smooth height animation on expand/collapse (0.3s)
- Contains two fields: Days (4 columns) + Output Directory (8 columns)
- Chevron rotates 180° when expanded

### 4. History Tab

**Visibility:** When "History" tab is active

**Content:**
- Scrollable list of recent Cloud Manager runs
- Same styling as current `cloudmanager-history-list`
- Shows: timestamp, program name, selected logs, status, action buttons

**Layout:**
- Full-width scrollable container
- Max-height: calc(70vh) to keep interface balanced

### 5. CSS Changes

**New Classes:**

```css
.cloudmanager-tabs {
  display: inline-flex;
  gap: 0.35rem;
  margin-bottom: 0.95rem;
  /* pill styling */
}

.cloudmanager-tab {
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.18s ease;
}

.cloudmanager-tab.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: var(--color-background-primary);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px -2px var(--color-primary-glow);
}

.cloudmanager-tabs-content {
  display: block; /* only one tab visible */
}

.cloudmanager-tab-pane {
  display: none;
}

.cloudmanager-tab-pane.active {
  display: block;
}

.cloudmanager-advanced-settings {
  border: 1px solid var(--color-border-tertiary);
  border-radius: 12px;
  margin-bottom: 0.75rem;
  background: var(--color-background-tertiary);
}

.cloudmanager-advanced-settings-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.cloudmanager-advanced-settings-chevron {
  transition: transform 0.3s ease;
  font-size: 12px;
}

.cloudmanager-advanced-settings.expanded .cloudmanager-advanced-settings-chevron {
  transform: rotate(180deg);
}

.cloudmanager-advanced-settings-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

.cloudmanager-advanced-settings.expanded .cloudmanager-advanced-settings-content {
  max-height: 200px;
  padding: 0 0.75rem 0.75rem;
}
```

### 6. HTML Structure Changes

**Current Structure** (single-column everything):
```html
<div id="cloudManagerPanel" class="source-panel hidden">
  <div id="cmStatusBanner">...</div>
  <div id="cmCacheStatus">...</div>
  <div class="cloudmanager-grid">
    <!-- all fields mixed -->
  </div>
  <!-- history below -->
</div>
```

**New Structure** (tabbed):
```html
<div id="cloudManagerPanel" class="source-panel hidden">
  <!-- Tab Navigation -->
  <div class="cloudmanager-tabs">
    <button class="cloudmanager-tab active" data-tab="download">Download & Analyze</button>
    <button class="cloudmanager-tab" data-tab="setup">Setup</button>
    <button class="cloudmanager-tab" data-tab="history">History</button>
  </div>

  <!-- Download & Analyze Tab -->
  <div class="cloudmanager-tab-pane active" id="cmTab-download">
    <div id="cmStatusBanner">...</div>
    <div id="cmCacheStatus">...</div>
    <div class="cloudmanager-grid">
      <!-- Program, Environment, Tier only -->
    </div>

    <!-- Advanced Settings Accordion -->
    <div class="cloudmanager-advanced-settings">
      <div class="cloudmanager-advanced-settings-toggle">
        <span>Advanced Settings</span>
        <span class="cloudmanager-advanced-settings-chevron">▼</span>
      </div>
      <div class="cloudmanager-advanced-settings-content">
        <div class="cloudmanager-grid">
          <!-- Days + Output Directory -->
        </div>
      </div>
    </div>

    <div class="upload-row">
      <!-- Buttons -->
    </div>
    <div id="cmResultBadges">...</div>
  </div>

  <!-- Setup Tab -->
  <div class="cloudmanager-tab-pane" id="cmTab-setup">
    <!-- Current setup content -->
  </div>

  <!-- History Tab -->
  <div class="cloudmanager-tab-pane" id="cmTab-history">
    <!-- Current history content -->
  </div>
</div>
```

### 7. JavaScript Interactivity

**Tab Switching:**
```javascript
// On tab button click
.addEventListener('click', (e) => {
  const tabName = e.target.dataset.tab;
  
  // Hide all panes
  document.querySelectorAll('.cloudmanager-tab-pane').forEach(p => p.classList.remove('active'));
  
  // Show selected pane
  document.getElementById(`cmTab-${tabName}`).classList.add('active');
  
  // Update active button
  document.querySelectorAll('.cloudmanager-tab').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});
```

**Accordion Toggle:**
```javascript
// On Advanced Settings toggle click
.addEventListener('click', () => {
  const accordion = document.querySelector('.cloudmanager-advanced-settings');
  accordion.classList.toggle('expanded');
});
```

### 8. Testing & Validation

**Manual Testing:**
- ✅ Tab switching works smoothly, only one tab visible
- ✅ Advanced Settings accordion expand/collapse works
- ✅ All form fields remain functional in new layout
- ✅ Setup, Download, History workflows complete successfully
- ✅ Responsive behavior on tablet/mobile (tabs may stack if needed)

**Browser Compatibility:**
- Modern CSS Grid, Flexbox, CSS Grid (all supported)
- Smooth transitions work in all modern browsers

### 9. Migration Notes

**Breaking Changes:** None. All existing functionality preserved.

**Data State:** 
- Existing user preferences (saved days, output directory) continue to work
- Tab preference could be saved to localStorage (enhancement, not required)

**Accessibility:**
- Tab buttons have `role="tab"` / `aria-selected` attributes
- Accordion toggle has `aria-expanded` attribute
- Focus management preserved

---

## Success Metrics

1. **Space Efficiency** — Cloud Manager panel initial view is 60%+ smaller
2. **Usability** — First-time users understand tab navigation intuitively
3. **Functionality** — All Cloud Manager features work identically to before
4. **Performance** — No performance degradation from tabbed layout
5. **Mobile** — Responsive layout works on tablet/mobile screens

## Future Enhancements (Out of Scope)

- Save last-selected tab to localStorage
- Wizard mode for first-time setup (modal walkthrough)
- Keyboard shortcuts for tab navigation (Ctrl+1, Ctrl+2, etc.)
