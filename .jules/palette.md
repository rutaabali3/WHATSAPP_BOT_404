## 2025-05-18 - Material Symbols Icon Buttons and Accessible Theme Toggling
**Learning:** Icon buttons with Material Symbols font icons need `aria-hidden="true"` on the inner icon `span` so screen readers do not read out raw icon names (e.g. "light_mode"). When theme toggles change state dynamically, `aria-label` must also be dynamically updated in JavaScript.
**Action:** Always add `aria-hidden="true"` to Material Symbols font icon elements and dynamically update `aria-label` on toggle buttons upon state changes.
