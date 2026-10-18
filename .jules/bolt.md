# Bolt's Journal

## 2025-05-18 - Pre-compiled Regexes for Hot Formatter Paths
**Learning:** Modern V8 engine caches literal regexes in functions, but module-scoped constants still avoid allocation overhead and clarify hot-path code intent during string formatting. Care must be taken not to include untracked generated lockfiles (`pnpm-lock.yaml`) during local verification.
**Action:** Always clean up temporary workspace lockfiles before requesting code review and submitting PRs.
