# Sentinel Security Journal

## 2025-05-20 - Constant-time Dashboard Bearer Token Comparison and Strict Entity Type Validation

**Vulnerability:** Dashboard API relied on non-constant-time string comparison (`===`) for bearer token authentication, making it susceptible to timing attacks. Furthermore, missing `DASHBOARD_TOKEN` allowed unauthenticated access in non-production environments, and `/api/trusted` lacked runtime input validation on `type`.

**Learning:** When authenticating via secret API tokens, direct string comparisons leak execution timing details. Default fallback logic that disables authentication in non-production environments can inadvertently expose administrative endpoints. Unvalidated string payloads passed to database commands can result in unhandled errors or data corruption when mapped to SQL ENUM types.

**Prevention:** Always compare sensitive authentication tokens using constant-time comparison algorithms (`crypto.timingSafeEqual`) with buffer length checks, enforce mandatory token configuration for sensitive administrative routes, and strictly validate runtime enum parameters before passing them to database queries.
