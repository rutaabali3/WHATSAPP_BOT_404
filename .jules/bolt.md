## 2025-05-18 - Memoizing Regex Title Casing in Repeated Formatting
**Learning:** In hot formatting paths (like `formatApiResult` processing API collections), repeatedly performing regex replacement and string transformations on common object key names (e.g. `titleCase`) creates significant regex execution overhead and GC pressure. Memoizing string transformations on key names reduced formatting time by ~50%.
**Action:** Always memoize pure string transformations (such as `titleCase` or field name normalizers) when called inside collection mapping or list formatting loops.
