## 2025-02-23 - Path Traversal Protection in Media Storage
**Vulnerability:** Message ID strings passed to `writeMedia()` could contain directory traversal sequences like `../../`, allowing arbitrary file writes outside the intended media folder.
**Learning:** Even internal message identifiers (e.g. from WhatsApp message keys or upstream APIs) must be sanitized with `path.basename()` and validated against `baseDir` containment checks before saving files to disk.
**Prevention:** Always use `path.basename()` on untrusted path components and verify that `path.resolve(baseDir, file)` starts with `path.resolve(baseDir) + path.sep`.
