# Palette's Journal

## 2025-05-18 - Material Symbols & Keyboard Navigation Accessibility Pattern
**Learning:** Icon-only controls and Material Symbol font icons require explicit accessibility attributes (`aria-label` and `aria-hidden="true"`). Without `aria-hidden="true"`, screen readers pronounce icon ligature names like "light_mode" or "smart_toy". Additionally, explicit `:focus-visible` ring outlines are needed across custom dark/light theme systems to maintain focus visibility for keyboard users.
**Action:** Always pair Material Symbol icon spans with `aria-hidden="true"` when accompanied by visible text, add `aria-label` to icon-only buttons, and ensure default focus-visible styles exist for all interactive elements.
