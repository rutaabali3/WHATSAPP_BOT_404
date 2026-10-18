## 2025-05-18 - Bounded Caching for In-Memory String Formatting Utilities
**Learning:** Adding unbounded Map memoization to string formatting utilities (such as title-case transformations) in long-running node bot processes risks unbounded memory growth if dynamic user inputs pass through the function. Capping cache size with a max limit and FIFO eviction maintains high formatting performance without risking heap memory leaks.
**Action:** Always enforce a maximum entry cap (e.g. FIFO eviction on max size) when adding memoization caches to formatting utilities.
