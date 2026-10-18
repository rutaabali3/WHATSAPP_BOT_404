## 2025-05-20 - Precomputing Field Maps for Response Formatter
**Learning:** Re-allocating key arrays and running regex `titleCase` inside hot per-item loops (like response formatters) causes high GC pressure and regex overhead (~100 regex calls per response).
**Action:** Precompute static field-to-label maps and cache string casing transformations outside hot loops.
