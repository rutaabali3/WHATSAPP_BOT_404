# Sentinel Security Journal

## 2026-10-04 - SSRF Protection in User-Facing URL Commands
**Vulnerability:** User-supplied URLs passed to WhatsApp commands (such as downloader, screenshot, and website zip) were validated only by protocol prefix without restricting loopback, cloud metadata, or private network targets.
**Learning:** `isValidHttpUrl` in `V-2/src/api.ts` is the single gateway for validating chat URLs before invoking external APIs.
**Prevention:** Always validate hostnames against private IPv4 blocks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback addresses (127.0.0.0/8, ::1, localhost), link-local cloud metadata (169.254.169.254), and local domain suffixes.
