# Bolt's Journal - Critical Learnings

## 2025-02-21 - Format Item Label Title Casing
**Learning:** `titleCase` regex (`/[-_]/g` and `/\b\w/g`) does not split camelCase strings (e.g. `watchUrl` -> `WatchUrl`, not `Watch Url`).
**Action:** When pre-formatting constant labels for camelCase keys to eliminate runtime `titleCase` calls, ensure exact matching with regex output behavior to avoid subtle string format regressions.
