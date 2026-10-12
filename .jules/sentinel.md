## 2025-05-18 - Constant-Time Token Comparison and Missing Secret Fallback in Dashboard Server
**Vulnerability:** Weak string comparison (`===`) vulnerable to timing attacks and insecure fallback allowing unauthenticated access when `DASHBOARD_TOKEN` was unset in non-production environments.
**Learning:** `req.headers.authorization` strings must be compared in constant time using `crypto.timingSafeEqual` after checking buffer lengths. Additionally, administrative endpoints must fail securely by default when missing authorization configuration rather than falling back to unauthenticated access.
**Prevention:** Always require non-empty credentials for protected endpoints and compare secret tokens using constant-time comparison buffers.
