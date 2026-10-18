## 2024-10-09 - Accessible Toast Notifications & Icon Buttons
**Learning:** Icon-only buttons (like theme togglers) and floating toast notifications (like copy snackbars) need explicit `aria-label` and `role="status"`/`aria-live="polite"` attributes, plus dynamic state updates, to ensure screen reader users receive equal visual feedback.
**Action:** Always pair floating status snackbars with `role="status"` and `aria-live="polite"`, and update icon button `aria-label`s dynamically on state changes.
