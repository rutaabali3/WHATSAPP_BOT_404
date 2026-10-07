## 2025-10-07 - Accessible Theme Toggle and Search Inputs
**Learning:** Icon-only buttons and search inputs in standalone dashboard HTML pages frequently lack explicit `aria-label`, `type="button"`, or focus ring indicators, degrading keyboard and screen-reader accessibility.
**Action:** Always add `aria-label`, `aria-live="polite"` on theme toggles, and uniform `:focus-visible` ring rules on key interactive elements.
