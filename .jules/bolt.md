## 2025-02-14 - String formatting memoization and array allocation optimization
**Learning:** Formatting large API responses or lists repeatedly creates significant garbage collection overhead and CPU time when constructing arrays and evaluating regexes (like title-casing strings) on every item.
**Action:** Memoize string transformation functions like `titleCase` with a Map and hoist static key arrays (`PREFERRED_KEYS`) to avoid intermediate `.filter().map()` allocations in tight hot loops.
