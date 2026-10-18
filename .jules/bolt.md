## 2026-03-29 - Early-Exit String Clipping and Bounded Key Casing

**Learning:** Running global regex string replacements (such as `/\s+/g`) across large unclipped API payload strings causes significant CPU spikes (~2000ms per 100 calls on 600KB payloads), even when only a small portion of the text is retained by `.slice()`. Naive slicing before whitespace collapsing can miss characters across whitespace runs or produce incorrect truncation boundaries. Furthermore, unbounded memoization maps on string transformations risk memory leaks under dynamic input keys.

**Action:** Use an early-exit single-pass character scanner for text clipping that exits immediately when the maximum character budget is met, and cap memoization cache sizes (`size < 500`) to prevent unbounded memory growth.
