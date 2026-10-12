## 2025-05-18 - Material Design 3 Accessible Tab & Search Controls
**Learning:** In static single-page documentation dashboards (such as `index.html`), custom button tabs require explicit `role="tablist"`, `role="tab"`, and programmatically synced `aria-selected` state updates on tab clicks to ensure screen readers announce active tab selection correctly.
**Action:** When adding or updating custom tab controls or search inputs, always pair CSS active classes with `aria-selected` attribute updates and `aria-label`/`aria-controls` bindings.
