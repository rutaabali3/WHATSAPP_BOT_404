## 2025-05-10 - ARIA Tablist State Syncing in Vanillajs
**Learning:** Interactive filter button groups presented as tabs require explicit role="tablist" and role="tab" with dynamic aria-selected attribute updates on selection to inform screen reader users of state transitions.
**Action:** Always sync aria-selected="true/false" in tab click handlers alongside CSS active state toggles.
