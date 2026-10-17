## 2025-02-23 - Defense-in-Depth Security Headers in Node HTTP Dashboard
**Vulnerability:** HTTP responses served by custom Node `http.createServer` dashboards missing explicit security headers (`X-Content-Type-Options: nosniff`) could expose clients to MIME-type sniffing vulnerabilities if responses or error payloads are interpreted in browser contexts.
**Learning:** In custom lightweight Node.js HTTP servers (without frameworks like Express/Helmet), response headers must be explicitly configured to enforce modern security standards.
**Prevention:** Always attach `X-Content-Type-Options: nosniff` header to internal/dashboard HTTP server responses.
