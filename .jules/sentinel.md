## 2025-05-20 - Non-constant time dashboard authentication bypass when DASHBOARD_TOKEN is unset
**Vulnerability:** Dashboard API authentication bypassed security checks when process.env.DASHBOARD_TOKEN was unset, allowing unauthorized access in non-production environments. Furthermore, standard string equality was used for bearer token comparisons, exposing authentication to timing side-channel attacks.
**Learning:** Defaulting to permissive fallback logic in non-production environments creates risky backdoors.
**Prevention:** Always default to deny when authentication credentials are missing or unset. Use `crypto.timingSafeEqual` with strict buffer length checks for secret comparisons to prevent timing side-channel leaks.
