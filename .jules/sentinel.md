## 2025-05-18 - Dashboard Authentication and Body Size Limits
**Vulnerability:** Unauthenticated access allowed on dashboard endpoints when `DASHBOARD_TOKEN` was unset, authorization string comparison vulnerable to timing side-channels, and unbounded request streaming on `POST /api/trusted` allowing DoS via memory exhaustion.
**Learning:** Checking `process.env.NODE_ENV !== 'production'` as a fallback for missing auth tokens creates authentication bypasses across non-production setups.
**Prevention:** Require explicit tokens and reject requests when token is empty, compare bearer headers with `crypto.timingSafeEqual`, and enforce max body size caps on raw HTTP streaming endpoints.
