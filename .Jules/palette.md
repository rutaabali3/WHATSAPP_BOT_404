# Palette's Journal - Critical Learnings

## 2025-05-18 - Material Design 3 Focus Indicators & ARIA Tab pattern
**Learning:** Pure Material 3 web dashboards using dark/light theme CSS variables need explicit `:focus-visible` outline rings for icon buttons and custom tab buttons to comply with keyboard accessibility (WCAG 2.4.7). Dynamic client-side command search grids benefit significantly from polite screen reader announcements (`aria-live="polite"`) when filtered.
**Action:** Always include `:focus-visible` rules using primary color variables and add live count regions for interactive search inputs in static HTML dashboards.
