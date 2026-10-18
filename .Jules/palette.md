# Palette's UX & Accessibility Journal

## 2025-05-18 - Interactive Landing Page Accessibility & Focus Ring Consistency
**Learning:** In single-page HTML documentation apps, icon buttons (such as theme toggles and dynamic copy buttons) and search inputs often lack explicit ARIA labels and keyboard focus indicators, making screen reader and keyboard navigation ambiguous.
**Action:** Always ensure search inputs, icon-only buttons, and dynamically rendered buttons receive descriptive `aria-label` attributes and `:focus-visible` styling using design system primary tokens.
