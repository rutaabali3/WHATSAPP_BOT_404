## 2025-05-18 - Material Design 3 Documentation UI Accessibility
**Learning:** Single-page documentation apps built with Material Design 3 and custom CSS components often lack keyboard `:focus-visible` indicators, skip-to-content navigation links, and standard ARIA roles (`role="tablist"`, `aria-selected`, `aria-label`).
**Action:** Always include global `:focus-visible` focus rings, a skip-to-content link, and dynamic ARIA state updates (`aria-selected`, `aria-label`) when implementing interactive tabs and theme toggle controls.
