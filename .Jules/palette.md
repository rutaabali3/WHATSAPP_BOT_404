## 2025-02-24 - Accessible Interactive Components in index.html
**Learning:** When adding accessibility attributes like `aria-pressed` or `aria-selected` to custom tab or filter buttons, event listeners must dynamically toggle both visual classes (`active`) and ARIA attributes in sync.
**Action:** Always ensure interactive JS handlers update both class states and ARIA states simultaneously.
