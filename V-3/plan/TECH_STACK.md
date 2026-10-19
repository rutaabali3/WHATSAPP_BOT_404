# WHATSAPP_BOT_404_V3 — Tech Stack, Tools & APIs Specification

This document details the complete technology stack, system prerequisites, and external/internal APIs required to run **WHATSAPP_BOT_404_V3**.

---

## 1. Core Runtime & Language Stack

| Technology | Version / Spec | Purpose in V3 |
|---|---|---|
| **Node.js** | 20.x or 22.x LTS | High-performance JavaScript runtime with native `fetch`, `FormData`, and stream processing. |
| **TypeScript** | 5.9+ (`ES2022` / `NodeNext`) | Strict static type checking, modular interfaces, and clean maintainable code. |
| **Baileys** | `@whiskeysockets/baileys` v7.0.0-rc14 | Direct WhatsApp Web Multi-Device socket protocol engine (no third-party cloud bridges). |
| **MariaDB / MySQL** | `mysql2/promise` (Pool) | High-speed relational database for storing messages, edits, revokes, audit logs, and AI chats. |
| **Axios** | 1.11+ | Centralized HTTP client with automatic response unwrapping, timeout guards, and error normalization. |
| **Pino** | 9.9+ | Structured JSON logging with zero overhead on older hardware. |
| **tsx** | 4.19+ | Instant TypeScript execution for development, tests, and CLI execution without manual compilation steps. |

---

## 2. System Tools & Binaries (Host Environment)

### A. MariaDB / MySQL Server (Local XAMPP or Native)
* **Default Port:** `3306`
* **Charset:** `utf8mb4` (required for complete emoji and foreign alphabet support)
* **Tables Managed:**
  * `bot_messages`: All incoming/outgoing messages, media paths, captions, and raw JSON.
  * `bot_edits`: Original vs. edited message diffs for the Anti-Edit engine.
  * `bot_ai_interactions`: History of `@bot` questions and AI overview answers.
  * `bot_settings`: Live toggles (`anti_delete`, `anti_edit`, `prefix`, `retention_days`).
  * `trusted_entities`: Whitelisted contacts and VIP groups.
  * `api_usage`: Distributed per-user and per-chat rate limiting.
  * `bot_audit_log`: System events, command executions, and error captures.
  * `user_game_profiles`: User ID persistent profiles (total games, wins, losses, draws, XP score, rank titles).
  * `user_game_history`: Chronological match logs (User ID, game type, opponent, result, points delta, timestamp).

### B. FFmpeg (Optional but Recommended)
* **Binary:** `ffmpeg` (must be accessible on system PATH)
* **Purpose:**
  * Converting images, short videos (<10s), and GIFs to 512x512 animated WebP WhatsApp stickers with custom EXIF metadata.
  * Converting audio files into Opus-encoded OGG voice notes (`.tovn` / `.toptt`).
  * Extracting MP3 audio streams from video clips (`.tomp3`).
* **Graceful Degradation:** If FFmpeg is not installed, the bot runs normally and informs the user when sticker/audio conversion commands are triggered.

---

## 3. APIs & External Services

### A. Centralized API Backend (`API_BASE_URL`)
* **Default:** Configured in `.env`
* **Features Powered:**
  * **Media Downloader (`/api/alldl`):** Multi-platform video/audio extraction (Instagram, TikTok, YouTube, Facebook, Twitter, Pinterest).
  * **Text-to-Speech (`/api/tts` & `/api/voices`):** Natural speech synthesis across 400+ voices with auto-chunking for long text.
  * **Web Screenshotting (`/api/websnap`):** Full-page webpage captures.
  * **Vision & Image AI (`/api/image`, `/api/video`, `/api/imgchat`):** AI image generation, photo animation, and visual Q&A.
  * **Educational & Document Tools:** Wikipedia PDF generator (`/api/wikipdf`), website asset packer (`/api/zip`), realistic handwriting homework generator (`/api/handwriting`).
  * **Entertainment & Medical:** Manga search (`/api/manga`), web novels (`/api/novel`, `/api/unovel`), movie database (`/api/msearch`), pharmaceutical medicine lookup (`/api/medicine`), free courses (`/api/courses`).

### B. SearXNG Metasearch Engine (`SEARXNG_URL`)
* **Purpose:** Powers the `.search` and `.google` commands (returns top 10 ranked web results).
* **Cost:** **100% Free** — No API key or credit card needed.
* **How it works:** Queries Google, Bing, DuckDuckGo, Wikipedia, and Reddit simultaneously via JSON API (`/search?q=<query>&format=json`).
* **Endpoints:** Can use any public SearXNG instance (e.g., `https://searx.be`) or a self-hosted Docker container.

### C. Groq Cloud AI & Whisper (`GROQ_API_KEY`)
* **Purpose:**
  * **Speech-to-Text (`whisper-large-v3`):** 100% free transcription of voice notes and audio clips across 99+ languages with near-zero latency.
  * **AI Guide & Assistant (`llama-3.3-70b`):** Powers intelligent `@bot <question>` queries, natural intent recognition, and contextual help guides.
* **Cost:** **Free Tier** (available at `console.groq.com`).
* **Fallback:** If no Groq API key is set, the bot automatically switches to its built-in local knowledge engine without failing.

### D. Cobalt API & Music CDN Failover Engine
* **Purpose:** Automatic seamless failover when YouTube upstream blocks or rate-limits occur.
  * **Cobalt Tools (`https://api.cobalt.tools`):** Open-source, zero-ad YouTube cipher bypass returning direct MP4/MP3 media streams.
  * **Direct Music CDN (JioSaavn API):** Sourcing 320kbps MP3 tracks directly with official metadata, avoiding YouTube network throttling completely.
* **Cost:** **100% Free** — 0 MB Local RAM overhead.

---

## 4. Port & Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LOCAL HOST PORTS                       │
├──────────────┬──────────────────────────────────────────────┤
│ Port 3306    │ MariaDB / MySQL Database Connection          │
├──────────────┼──────────────────────────────────────────────┤
│ Port 8787    │ Health & Readiness Check (/health, /ready)   │
├──────────────┼──────────────────────────────────────────────┤
│ Port 8788    │ Localhost Web Operations Dashboard           │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 5. Complete Environment Configuration (`.env.example`)

```env
# =================================================================
# WHATSAPP_BOT_404_V3 CONFIGURATION
# =================================================================

# Database (MariaDB / XAMPP)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bot_404
DB_USER=root
DB_PASSWORD=

# Bot Identity & Owner
OWNER_NUMBER=923192342358
OWNER_NAME=Rutaab
PREFIX=.

# Pairing Code Authentication (Optional)
# Enter your phone number with country code (e.g. 923192342358) to get an 8-character pairing code.
# Leave blank to use terminal QR code scan.
PAIRING_NUMBER=

# Local Media & Data Retention
MEDIA_DIR=./data/media
MESSAGE_RETENTION_DAYS=30

# Backend API Configuration
API_BASE_URL=https://ahm7xmakki.com
API_TIMEOUT_MS=45000
API_VIDEO_TIMEOUT_MS=180000

# SearXNG Web Search (Free Metasearch)
SEARXNG_URL=https://searx.be

# Groq Cloud API (Optional for free Whisper & AI Guide)
# Get a free key at: https://console.groq.com
GROQ_API_KEY=

# Local Operations Dashboard (Material Design 3)
DASHBOARD_PORT=8788
DASHBOARD_TOKEN=
HEALTH_PORT=8787

# Rate Limiting & Safety
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_COMMANDS=30
```
