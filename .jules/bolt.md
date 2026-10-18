## 2025-05-18 - Case Sensitivity and Regex in Utility Formatter
**Learning:** `titleCase` in this codebase only converts `[-_]` to spaces and upper-cases word starts, so camelCase strings like `watchUrl` produce `WatchUrl` rather than `Watch Url`. Pre-computing static field mappings for hot formatting paths requires checking actual regex behavior to guarantee exact string parity.
**Action:** Always test original utility behavior with exact string outputs before pre-computing static maps or memoization tables.
