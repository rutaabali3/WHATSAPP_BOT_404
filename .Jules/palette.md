## 2025-10-05 - Accessible Focus Outlines for High-Contrast Custom Themes
**Learning:** Custom Material Design theme tokens on dark background require explicit `:focus-visible` outline offsets using system primary color tokens to ensure visible focus indicators across both light and dark themes.
**Action:** Apply global `:focus-visible` outlines with `--md-sys-color-primary` on interactive components in single-page HTML documentation.
