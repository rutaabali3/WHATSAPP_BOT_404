## 2025-05-18 - Dashboard Authentication Bypass in Non-Production Environments

**Vulnerability:** The internal dashboard API (`V-2/src/dashboard.ts`) previously defaulted to allowing all unauthenticated HTTP requests when `DASHBOARD_TOKEN` was unset and `NODE_ENV !== 'production'`. This exposed sensitive endpoints like `POST /api/trusted` that alter the database state.
**Learning:** Development-mode fallbacks that bypass token authentication violate fail-secure principles and risk exposing administrative capabilities in non-production or default environments. Additionally, token checks must use constant-time comparison to prevent timing attacks.
**Prevention:** Always default to deny when security tokens are missing or unconfigured, and compare secrets with `crypto.timingSafeEqual`.
