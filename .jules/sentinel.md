## 2025-05-10 - Preventing SSRF via URL Validation
**Vulnerability:** External fetch helper functions (`isValidHttpUrl`) accepted loopback, local network, and private RFC 1918 IPv4/IPv6 addresses, exposing internal services to Server-Side Request Forgery (SSRF).
**Learning:** URL validation checking only `http:` / `https:` protocols is insufficient for user-provided URLs when backend services perform HTTP requests or snapshots on those URLs.
**Prevention:** Filter hostnames against loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and `localhost` before making outbound requests.
