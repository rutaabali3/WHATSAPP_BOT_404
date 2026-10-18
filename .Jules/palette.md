# Palette's Journal

## 2025-02-23 - Material Symbols Accessibility Pattern
**Learning:** Material Design icon-only buttons (`.material-symbols-rounded`) are visually clear but invisible or confusing to screen readers without explicit `aria-label` on the parent `<button>` and `aria-hidden="true"` on the icon `<span>`.
**Action:** When adding or modifying Material Symbols buttons, always hide the icon `<span>` with `aria-hidden="true"` and set a descriptive `aria-label` on the host interactive element.
