# Bolt's Performance Journal

## 2025-02-22 - Pre-computing static field labels in response formatters
**Learning:** In formatting functions called on API response lists, re-allocating array literals, filtering, mapping, and re-evaluating regex string transformations (e.g. titleCase) per item creates substantial overhead (~124ms per 1k ops). Pre-computing static field key-label structures outside the per-item loop reduced formatting latency by ~61% (~2.6x speedup). Care must be taken so pre-computed labels exactly match the output of any replaced transformation function (e.g. `watchUrl` producing `WatchUrl`).
**Action:** When formatting structured item lists, extract static property arrays and pre-compute exact property labels outside the per-item loop.
