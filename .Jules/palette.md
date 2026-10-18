## 2025-05-18 - Explicit Focus Visible and ARIA Roles on Static Dashboard

**Learning:** Static landing and dashboard pages with custom tabs and icon controls benefit significantly from explicit `:focus-visible` ring styling and ARIA tab attributes (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-pressed`).
**Action:** Always ensure custom tab component handlers accept the event parameter explicitly to set `aria-selected="true"` reliably without relying on deprecated global event objects.
