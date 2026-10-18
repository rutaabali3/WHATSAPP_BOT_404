## 2025-05-20 - Configurable Delays in Staged Async Tasks
**Learning:** Hardcoded async delays (`setTimeout`/`wait`) in user-facing prank or staged animation flows drastically slow down test execution when called by unit tests.
**Action:** Always make delay parameters configurable with production defaults (e.g. `delayMs = 650`), allowing test suites to pass `0` and run in milliseconds.
