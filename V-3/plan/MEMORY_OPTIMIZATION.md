# WHATSAPP_BOT_404_V3 — Memory Optimization & Hardware Budget (< 800 MB RAM)

This document outlines the memory architecture, performance optimizations, and resource constraints designed to keep **WHATSAPP_BOT_404_V3** running smoothly on older or resource-constrained hardware with a hard ceiling **under 800 MB RAM**.

---

## 1. System Memory Budget & Target Profile

* **Hardware Ceiling:** `< 800 MB` RAM
* **Expected Active Runtime Footprint:** `~150 MB – 250 MB` RAM
* **Safety Margin:** Over `50% – 65%` buffer headroom

```text
┌─────────────────────────────────────────────────────────────┐
│                   SYSTEM MEMORY ALLOCATION                  │
├────────────────────────────────┬────────────────────────────┤
│ Node.js V3 Bot Engine (RSS)    │ ~120 MB – 180 MB           │
│ MariaDB Server (Local XAMPP)   │ ~150 MB – 200 MB           │
│ SearXNG Public API Pool        │ 0 MB (Remote HTTPS)        │
│ Ephemeral FFmpeg Workers       │ 0 MB Idle (Temporary Peak) │
├────────────────────────────────┼────────────────────────────┤
│ TOTAL EXPECTED BASELINE        │ ~270 MB – 380 MB           │
│ HARD MEMORY BUDGET             │ < 800 MB                   │
│ HEADROOM / BUFFER              │ ~420 MB – 530 MB FREE      │
└────────────────────────────────┴────────────────────────────┘
```

---

## 2. Core Memory Optimization Strategies

### A. Direct-to-Disk Media Stream Piping
* **The Problem:** Default Baileys implementations buffer full 30MB–80MB video files directly in Node's memory heap during download, causing rapid heap spikes and garbage collector thrashing.
* **V3 Solution:** Incoming media streams are piped chunk-by-chunk directly from the WhatsApp Web socket stream to `data/media/<id>.<ext>` on disk. Node's memory buffer never exceeds 64 KB per chunk regardless of video size.
* **RAM Saved:** `150 MB – 300 MB` during concurrent media downloads.

### B. Node.js Heap Cap (`--max-old-space-size=512`)
* **V3 Solution:** The Node.js V8 engine is configured with a strict heap ceiling of 512 MB in the startup scripts (`package.json` and PM2 `ecosystem.config.cjs`).
* **Result:** Node.js triggers aggressive generational garbage collection before memory ever approaches the 800 MB host budget.

### C. Zero-RAM SearXNG Integration (Public HTTPS Pool)
* **The Problem:** Hosting SearXNG locally in a Docker container consumes 350 MB–500 MB of local RAM.
* **V3 Solution:** The bot queries verified, free public SearXNG HTTPS instances (`https://searx.be`, `https://search.ononoki.org`, `https://searx.tiekoetter.com`) with an automatic rotation and failover pool.
* **Local RAM Overhead:** **0 MB**.

### D. Bounded LRU Cryptographic Key Store
* **The Problem:** Multi-device WhatsApp sessions maintain in-memory cryptographic pre-keys and identity maps that leak memory over weeks of continuous operation.
* **V3 Solution:** Uses `makeCacheableSignalKeyStore` wrapped with a bounded Least-Recently-Used (LRU) cache of 1,000 entries. Older keys are safely flushed to disk (`auth_info/`), keeping key cache memory capped at `< 25 MB`.

### E. Ephemeral FFmpeg Sub-processes
* **V3 Solution:** FFmpeg is never kept running in the background. It is spawned as an isolated child process only when a user sends a sticker (`.s`) or audio note (`.tovn`) command, and is killed immediately after encoding.
* **Result:** All memory allocated by FFmpeg is immediately returned to Windows as soon as the media message is delivered.

### F. Lean Database Connection Pool
* **V3 Solution:** MariaDB pool is configured with `connectionLimit: 10`, using minimal thread buffers and closing idle connections after timeout.

---

## 3. Automated Memory Hygiene & Retention Scheduler

1. **Scheduled Pruning (Every 6 Hours):**
   * Automatically deletes expired media files from `data/media/` based on `MESSAGE_RETENTION_DAYS` (default: 30 days) to prevent disk and directory indexing bloat.
2. **Rate Limit In-Memory Buckets:**
   * Rate limiting buckets are stored with sliding millisecond timestamps and pruned automatically every 10 minutes to prevent map expansion.
3. **Manual Garbage Collector Trigger:**
   * Under heavy loads, the bot triggers optional V8 `global.gc()` during idle maintenance windows.
