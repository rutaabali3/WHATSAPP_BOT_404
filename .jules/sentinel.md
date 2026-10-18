# Sentinel Security Journal

## 2025-05-18 - Dashboard Missing Token Authentication
**Vulnerability:** When `DASHBOARD_TOKEN` is not explicitly set, `authorized()` returned `process.env.NODE_ENV !== 'production'`, causing the dashboard API to be accessible without any token in development/test environments. Furthermore, constant-time comparison was not used when verifying `Bearer ${token}`.
**Learning:** Default fallbacks for authorization tokens should strictly deny access when the token is missing/empty, or require explicit authorization headers with timing-safe comparison (`crypto.timingSafeEqual`) to prevent authentication bypass and timing side-channel attacks.
**Prevention:** Always require non-empty secret/token and use timing-safe comparison for authorization headers.
