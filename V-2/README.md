<div align="center">

# BOT_404 — VERSION 2

**Stable TypeScript Edition — Database-Backed Local-First WhatsApp Engine**

[![Status](https://img.shields.io/badge/Status-STABLE_PRODUCTION-2EA44F?style=for-the-badge)](../../README.md)
[![Node Version](https://img.shields.io/badge/Node.js-%E2%89%A520.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Protocol](https://img.shields.io/badge/Protocol-Baileys_v6-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Database](https://img.shields.io/badge/Database-MariaDB_10.4+-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](../../LICENSE)

</div>

---

## TABLE OF CONTENTS

- [Overview](#overview)
- [Operational Notice](#operational-notice)
- [Command Matrix](#command-matrix)
- [Anti-Delete & View-Once Recovery](#anti-delete--view-once-recovery)
- [Local Dashboard & Operations](#local-dashboard--operations)
- [Quick Start Guide](#quick-start-guide)
- [Audit Commands](#audit-commands)
- [API Adapter Catalog](#api-adapter-catalog)
- [Project Layout](#project-layout)
- [Security & Data Privacy Directives](#security--data-privacy-directives)
- [License](#license)

---

## OVERVIEW

A local Node.js/TypeScript WhatsApp automation bot named **BOT_404**, using Baileys and MariaDB (XAMPP). It implements always-on anti-delete capture, quoted view-once recovery with `.vv`, owner forwarding to `OWNER_NUMBER`, and a catalog-wide configurable API adapter layer.

> **DEVELOPMENT STATUS: STABLE PRODUCTION.** This generation is feature-frozen for production use. Expect only critical bug fixes; all breaking changes and new capabilities land in V-3.

---

## OPERATIONAL NOTICE

Baileys communicates through the WhatsApp Web protocol and is not an official WhatsApp Business API. It must be used only with an account you control, with consent from chat participants, and in accordance with WhatsApp's terms and applicable privacy law.

All remote commands route through the configurable `API_BASE_URL` backend. External endpoints may return HTTP 403/405/400 if anti-bot protection or an endpoint-specific requirement applies; the adapters are implemented and configurable but must be rechecked from your own network before production use.

---

## COMMAND MATRIX

<details>
<summary><b>Click to expand the command catalog</b></summary>

| Command | Behavior |
| :--- | :--- |
| `.help` or `.menu` | Shows the command menu. |
| `.vv` | Reply to a view-once image, video, audio, or document. The bot downloads and returns a normal copy immediately. |
| `.antidelete on` / `.antidelete off` | Owner-only informational command. Anti-delete remains active by design and cannot be switched off in this build. |
| `.tts <text>` | Calls the configured TTS API adapter and returns audio. |
| `.dl <url>` | Calls the configured downloader API adapter and returns the JSON result. |
| `.screenshot <url>` | Calls the configured screenshot API adapter and returns the image. |
| `.voices`, `.snapinfo` | TTS voice listing and WebSnap metadata. |
| `.image`, `.video`, `.imgchat` | PixelSter image/video generation and VisionSter image analysis. |
| `.mail` | TempSter disposable-mail actions. |
| `.med`, `.medinfo` | MedSter search and details. |
| `.manga`, `.novel`, `.unovel`, `.movie` | Manga, novel, Urdu-novel, and CineSter searches/actions. |
| `.wiki`, `.zip`, `.cert`, `.hand` | Wikipedia PDF, website ZIP, certificate, and handwriting adapters. |
| `.quiz`, `.n8n`, `.courses` | Telenor quiz, n8n workflow, and course search adapters. |

</details>

---

## ANTI-DELETE & VIEW-ONCE RECOVERY

Anti-delete is active without a command. The bot stores incoming messages and media locally. When a revoke protocol event is received, it forwards a recovery notice and the stored text or attachment to the configured owner JID `OWNER_NUMBER` (set this in `.env`).

---

## LOCAL DASHBOARD & OPERATIONS

The bot exposes a localhost-only management service bound strictly to `127.0.0.1`:

- **Health Endpoint**: `GET http://127.0.0.1:8787/health`
- **Operations Endpoint**: `GET http://127.0.0.1:8788/api/status`
- **Trusted Entity Control**: `POST http://127.0.0.1:8788/api/trusted` (JSON body: `jid`, `type`, optional `note`)

Set `DASHBOARD_TOKEN` before production use; when `NODE_ENV=production`, requests without the bearer token are rejected. The dashboard is intentionally bound to `127.0.0.1` and should not be port-forwarded publicly.

<details>
<summary><b>Production Deployment with PM2 & Backups (Click to Expand)</b></summary>

```bash
npm run build
pm2 start ecosystem.config.cjs
```

The included `scripts/backup.sh` exports MariaDB and the local media directory into timestamped backup folders. Test restores on a separate copy before treating backups as reliable.

</details>

---

## QUICK START GUIDE

### PREREQUISITES

- **Node.js** ≥ 20
- **XAMPP / MariaDB** listening on port 3306
- Import `sql/schema.sql` via phpMyAdmin or the MariaDB command line

### INSTALLATION

<details>
<summary><b>Click to expand V-2 Setup Commands</b></summary>

```bash
cd V-2

# Ensure MariaDB is running (e.g., via XAMPP), then import the schema:
# mysql -u root -p < sql/schema.sql

# Copy environment configuration
cp .env.example .env

# Install dependencies
npm install

# Build TypeScript source code
npm run build

# Run deterministic unit tests
npm test

# Launch production process
npm start
```

</details>

### PAIRING

On first start, scan the QR code printed in the terminal from the WhatsApp account that will run the bot. Session data is stored in `auth_info/`; do **not** commit or share that directory.

---

## AUDIT COMMANDS

```bash
npm run build
npm run lint
npm test
```

---

## API ADAPTER CATALOG

<details>
<summary><b>Click to expand the adapter families</b></summary>

The project includes adapters for the API families in use: DriveUp, WebSnap, SpeechSter, AllDL, PixelSter, VisionSter, TempSter, MedSter, TranScribe, MangaSter, NovelSter, UNovelSter, CineSter, Wikster, WebZip, CertSter, HandSter, Telenor, n8nSter, and Courses.

A 403/405/400 from an endpoint indicates backend-side anti-bot protection or an endpoint-specific request requirement from the current network; it is recorded rather than hidden. DriveUp and some POST APIs may require provider-specific authentication or multipart payloads and are intentionally not guessed from chat.

</details>

---

## PROJECT LAYOUT

| Module | Responsibility |
| :--- | :--- |
| `src/whatsapp.ts` | Baileys connection and message event handlers |
| `src/db.ts` | MariaDB repository, retention, trusted-entity, usage, and audit layers |
| `src/api.ts` + `src/api-commands.ts` | Centralized API adapter layer, pointed at `API_BASE_URL` |
| `src/commands.ts` | Parsing and authorization |
| `src/ops.ts` | Rate limiting, health, readiness, and structured logging |
| `src/dashboard.ts` | Localhost-only operations API |
| `sql/schema.sql` | Creates the required tables and indexes |
| `ecosystem.config.cjs` + `scripts/backup.sh` | Local production operations (PM2 supervision, backups) |
| `test/commands.test.ts` | Deterministic unit tests |

---

## SECURITY & DATA PRIVACY DIRECTIVES

1. **Authentication Credentials**: Never share or push files within `auth_info/`. These contain raw cryptographic keys providing full access to your linked WhatsApp account.
2. **Environment Protection**: Ensure `.env` is listed in your `.gitignore` file before committing changes.
3. **Local Scope Bounding**: Keep health ports (`8787`, `8788`) bound strictly to `127.0.0.1`. Do not expose these ports over public port-forwarding or reverse proxies without strong bearer tokens.

---

## LICENSE

MIT — see the repository-root [LICENSE](../../LICENSE).
