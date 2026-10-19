<div align="center">

# BOT_404 — VERSION 3

**Modular TypeScript Edition — Database-Backed Intelligence Engine**

[![Status](https://img.shields.io/badge/Status-FUTURE_DEVELOPMENT_PLANNED-F9A825?style=for-the-badge)](../../README.md)
[![Node Version](https://img.shields.io/badge/Node.js-%E2%89%A520.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Protocol](https://img.shields.io/badge/Protocol-Baileys_v7_RC-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Database](https://img.shields.io/badge/Database-MariaDB_10.4+-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](../../LICENSE)

</div>

---

## TABLE OF CONTENTS

- [Overview](#overview)
- [Development Status](#development-status)
- [Feature Highlights](#feature-highlights)
- [Command & Intelligence Suite](#command--intelligence-suite)
- [Project Structure](#project-structure)
- [Quick Start Guide](#quick-start-guide)
- [Configuration Reference](#configuration-reference)
- [Security & Data Privacy Directives](#security--data-privacy-directives)
- [License](#license)

---

## OVERVIEW

Version 3 is the newest generation of the BOT_404 monorepo: a modular, TypeScript-first, local-first WhatsApp automation engine built on **Baileys 7 RC** with **MariaDB** persistence. It ships an intent engine for natural-language routing, plugin-style command modules, a media pipeline with FFmpeg, and a Material Design 3 operations dashboard.

---

## DEVELOPMENT STATUS

> **ACTIVE DEVELOPMENT — FUTURE DEVELOPMENT PLANNED.** V-3 is not yet designated stable production. The core engine build passes TypeScript checks and the deterministic unit/integration test suite (16/16 green). However, this generation **will continue to see development in the future**, and breaking changes are expected until a stable tag is cut. For stable daily drivers, use V-1 or V-2.

---

## FEATURE HIGHLIGHTS

| Feature | Description |
| :--- | :--- |
| **Silent Voice Transcription** | All incoming voice notes (`ptt: true`) are transcribed in the background via Groq Whisper (`whisper-large-v3-turbo` with fallback keys) and stored in MariaDB — zero chat clutter. |
| **Zero-Latency `.transcribe`** | Replies to an audio message instantly from the cached database transcript; no repeated Whisper API calls. |
| **Urgency & Owner Alerts** | Transcripts are scanned against an urgent-keyword dictionary (`urgent`, `emergency`, `help`, `hospital`, `accident`, `asap`, `police`, `fire`, `critical`, …) plus owner-name mentions, and trigger a priority alert to the owner's DM. |
| **WhatsApp Status Stories** | `.story` publishes text, photo, video, or voice stories with dynamic high-contrast status colors and MariaDB-populated `statusJidList` audience syncing. |
| **Image Generation + Intent Engine** | `.image <prompt>` renders 1024x1024 images via Pollinations AI (no API key). Natural-language phrases like *"draw a futuristic city"* are routed automatically by the IntentEngine. |
| **Loopback Protection** | Outbound message-ID tracking with signature checking (`Powered by V3-ARCHITECTURE`) eliminates self-response echo loops, combined with a smart 2.5s chat debouncer to avoid duplicate replies. |
| **Pairing Code Auth** | Optional 8-character phone-number pairing code as an alternative to the terminal QR scan. |
| **Local-Only Dashboard** | Material Design 3 operations dashboard and health service, both bound to `127.0.0.1`. |

---

## COMMAND & INTELLIGENCE SUITE

The canonical catalog lives in [`plan/COMMANDS.md`](plan/COMMANDS.md). In addition to prefix commands, V-3 supports **autonomous task execution without any prefix** and an "Important Message / Owner Intelligence" filter that prioritizes messages for the owner.

<details>
<summary><b>Click to expand the suite categories</b></summary>

| Category | Examples |
| :--- | :--- |
| Privacy & Security | Owner-only boundaries and trusted-entity controls |
| Status & Announcements | `.story` (+ aliases `.poststatus`, `.statuspost`, `.setstatus`, `.upstatus`) |
| AI & Guidance | Natural-language intent routing, AI guides |
| Media & FFmpeg Pipeline | Image generation, media transcoding (`.image`) |
| Speech & Transcription | `.transcribe` with silent background capture |
| Downloader, Search & Web Tools | SearXNG metasearch, API adapter downloads |
| Group Administration | Private/owner-controlled group tooling |
| Utilities & System | Health, prefix help, rate-limit aware command dispatch |
| Fun & Games | Per-user ID & history persisted in the database |

</details>

---

## PROJECT STRUCTURE

```
V-3/
├── .env.example                 # Configuration template
├── package.json                 # Project metadata, dependencies, scripts
│
├── src/
│   ├── index.ts                 # Entry point — starts the bot
│   ├── whatsapp.ts              # Baileys connection & message event handlers
│   ├── db.ts                    # MariaDB persistence layer
│   ├── api.ts                   # Configurable API adapter layer
│   ├── commands/                # Prefix command modules
│   ├── plugins/                 # Plugin-style feature modules
│   ├── intent-engine.ts         # Natural-language intent matching
│   ├── media-pipeline.ts        # FFmpeg-powered media processing
│   ├── ops.ts                   # Rate limiting, health, structured logging
│   ├── dashboard.ts             # Localhost-only Material 3 dashboard
│   ├── error-handler.ts         # Centralized error handling
│   └── format.ts                # Message formatting helpers
│
├── sql/                         # MariaDB schema
├── scripts/                     # setup-db.ts and operational scripts
├── test/                        # Deterministic unit & integration tests
├── plan/                        # Architecture & command specification docs
└── dist/                        # Compiled output (never commit)
```

---

## QUICK START GUIDE

### PREREQUISITES

- **Node.js** ≥ 20
- **MariaDB** (XAMPP) listening on port 3306
- Schema setup via `npm run setup-db` or `sql/`

### INSTALLATION

<details>
<summary><b>Click to expand V-3 Setup Commands</b></summary>

```bash
cd V-3

# Install package dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env and supply your Groq / DB / dashboard settings
# nano .env OR code .env

# Initialize the MariaDB schema
npm run setup-db

# Build TypeScript source code
npm run build

# Run deterministic unit tests
npm test

# Launch production process
npm start

# Development mode (tsx watch)
npm run dev
```

</details>

### PAIRING

Either scan the **QR code** printed in the terminal, or set `PAIRING_NUMBER` in `.env` to receive an **8-character pairing code** on the linked phone, then complete linking under WhatsApp → Linked Devices.

---

## CONFIGURATION REFERENCE

<details>
<summary><b>V-3 Environment Variables Table (.env)</b></summary>

| Key | Default | Description |
| :--- | :--- | :--- |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MariaDB server host & port. |
| `DB_NAME` | `bot_404` | Target MariaDB schema. |
| `DB_USER` / `DB_PASSWORD` | `root` / `""` | MariaDB credentials. |
| `OWNER_NUMBER` | `""` | Owner WhatsApp JID receiving priority alerts. |
| `OWNER_NAME` | `""` | Owner friendly name used by the intelligence filter. |
| `PREFIX` | `.` | Public command prefix. |
| `PAIRING_NUMBER` | `""` | Phone number (with country code) for pairing-code auth; blank enables QR scan. |
| `MEDIA_DIR` | `./data/media` | Local retention path for recovered & generated media. |
| `MESSAGE_RETENTION_DAYS` | `30` | Database message retention window. |
| `API_BASE_URL` | `""` | Backend API root for adapter commands. |
| `API_TIMEOUT_MS` / `API_VIDEO_TIMEOUT_MS` | `45000` / `180000` | Adapter request timeouts. |
| `SEARXNG_URL` | `https://searx.be` | SearXNG metasearch endpoint. |
| `GROQ_API_KEY_CHAT` / `GROQ_API_KEY_VOICE` / `GROQ_API_KEY` | `""` | Dedicated Groq keys for chat, Whisper voice, and fallback. |
| `DASHBOARD_PORT` / `HEALTH_PORT` | `8788` / `8787` | Local dashboard & health service ports. |
| `DASHBOARD_TOKEN` | `""` | Bearer token required for the dashboard API. |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_COMMANDS` | `60000` / `30` | Per-user rate limiting window & budget. |

</details>

---

## SECURITY & DATA PRIVACY DIRECTIVES

1. **Authentication Credentials**: Never share or push files within `auth_info/` or any environment file containing tokens. These provide full access to your linked WhatsApp account.
2. **Environment Protection**: Ensure `.env` is listed in your `.gitignore` file before committing changes.
3. **Local Scope Bounding**: Keep the dashboard (`8788`) and health (`8787`) ports bound strictly to `127.0.0.1`; secure them with `DASHBOARD_TOKEN` before any non-local access.
4. **Development Maturity**: V-3 is under active development — review capabilities on your own test account before operational use.

---

## LICENSE

MIT — see the repository-root [LICENSE](../../LICENSE).
