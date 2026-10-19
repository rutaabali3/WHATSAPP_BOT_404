<div align="center">

# WHATSAPP BOT MONOREPO

**Local-First, Multi-Generational WhatsApp Automation Framework**

[![Node Version](https://img.shields.io/badge/Node.js-%E2%89%8520.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Protocol](https://img.shields.io/badge/Protocol-Baileys_v6-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Database](https://img.shields.io/badge/Database-MariaDB_10.4+-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## TABLE OF CONTENTS

- [Overview](#overview)
- [Architectural Comparison: V-1 vs V-2](#architectural-comparison-v-1-vs-v-2)
- [System Architecture](#system-architecture)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Version 1 Installation](#version-1-installation)
  - [Version 2 Installation](#version-2-installation)
- [Configuration & Environment Specifications](#configuration--environment-specifications)
- [Interactive Command Matrix](#interactive-command-matrix)
  - [V-1 Command Suite](#v-1-command-suite)
  - [V-2 Command Suite](#v-2-command-suite)
- [Local Operations & Dashboard (V-2)](#local-operations--dashboard-v-2)
- [Security & Data Privacy Directives](#security--data-privacy-directives)
- [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
- [Contributing & License](#contributing--license)

---

## OVERVIEW

This repository houses a local-first monorepo containing three generations (V-1, V-2, and the in-progress V-3) of an automated WhatsApp communication bot built on top of the [Baileys](https://github.com/WhiskeySockets/Baileys) web protocol implementation.

Both bot versions run **100% locally on your machine**, eliminating third-party cloud dependencies, subscription APIs, or hosted middleware. All message processing, database storage, session persistence, and media conversions execute locally.

### KEY HIGHLIGHTS

- **Zero Cloud Lock-in**: Autonomous operation via direct WhatsApp Web socket connections.
- **Privacy Core**: Session storage, auth keys, and database payloads remain exclusively on host hardware.
- **Dual-Generation Engine**: Access both the stable JavaScript production bot (V-1) and the high-throughput TypeScript engine (V-2).
- **Third Generation In Progress**: The modular TypeScript engine ([V-3](V-3/README.md)) is under active development and will see further development in the future — it is not yet designated stable production.
- **Configurable Backend Routing**: Extensible REST API adapter layer mapping commands to custom local or remote backends.

---

## ARCHITECTURAL COMPARISON: V-1 VS V-2

| Feature / Dimension | Version 1 (V-1) | Version 2 (V-2) |
| :--- | :--- | :--- |
| **Development Status** | Stable Production | Stable Production |
| **Primary Language** | JavaScript (ES Modules) | TypeScript (Strict Mode) |
| **Runtime Requirements** | Node.js >= 18 | Node.js >= 20 |
| **Persistence Layer** | File System (JSON / Pino Logs) | MariaDB / MySQL Relational Schema |
| **Anti-Delete Capture** | Not Supported | Always-on local message capture & owner alert |
| **View-Once Recovery** | Not Supported | Quoted media extraction via `.vv` |
| **Operations Dashboard** | Console / Pino Logs | Local HTTP REST API (Port 8787/8788) |
| **Concurrency Engine** | `p-queue` Rate Limiter | Distributed Queue + Database Audit Logs |
| **API Adapter System** | Direct API Integrations | Centralized `src/api.ts` Modular Adapters |

---

## SYSTEM ARCHITECTURE

```
+-----------------------------------------------------------------------+
|                        WHATSAPP NETWORK (WEBSOCKET)                   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                        BAILEYS SOCKET CONNECTION                      |
|          Multi-File Auth State (auth_info / auth_info_baileys)        |
+-----------------------------------------------------------------------+
                                   |
                +------------------+------------------+
                |                                     |
                v                                     v
+-------------------------------+   +----------------------------------+
|      V-1 ENGINE (JAVASCRIPT)  |   |     V-2 ENGINE (TYPESCRIPT)      |
|  - Router & Fuzzy Matching    |   |  - Anti-Delete Event Interceptor |
|  - Rate Limiter (5 req/10s)   |   |  - View-Once Recovery (.vv)      |
|  - Direct Groq / DDGS / yt-dlp|   |  - MariaDB Storage Engine        |
|  - Image Watermark (Sharp)    |   |  - Local REST Dashboard (8788)   |
+-------------------------------+   +----------------------------------+
                |                                     |
                +------------------+------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    CONFIGURABLE LOCAL API BACKEND                     |
|                      (Default: http://127.0.0.1:3000)                 |
+-----------------------------------------------------------------------+
```

---

## QUICK START GUIDE

### PREREQUISITES

1. **Node.js**: Version 18+ for V-1, Version 20+ for V-2.
2. **WhatsApp Account**: A active mobile device ready to link via QR code scan.
3. **MariaDB / MySQL**: Required for V-2 (XAMPP / local MariaDB server listening on port 3306).
4. **yt-dlp & ffmpeg**: Optional binaries for media download capabilities.

---

### VERSION 1 INSTALLATION

<details>
<summary><b>Click to expand V-1 Setup Commands</b></summary>

```bash
# Navigate to V-1 directory
cd V-1

# Install package dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env and supply your Groq API key and local preferences
# nano .env OR code .env

# Launch bot in production mode
npm start

# For development mode with auto-reload (Node >= 18)
npm run dev
```

</details>

---

### VERSION 2 INSTALLATION

<details>
<summary><b>Click to expand V-2 Setup Commands</b></summary>

```bash
# Ensure MariaDB is running (e.g., via XAMPP)
# Import database schema:
# mysql -u root -p < V-2/sql/schema.sql

# Navigate to V-2 directory
cd V-2

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

---

## CONFIGURATION & ENVIRONMENT SPECIFICATIONS

<details>
<summary><b>V-1 Environment Variables Table (.env)</b></summary>

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | `""` | **Required**. API Key for Groq LLaMA 3.3 70B AI processing. |
| `BOT_PREFIX` | `.` | Command prefix for public users. |
| `SELF_PREFIX` | `!!` | Command prefix reserved for bot owner. |
| `API_BASE_URL` | `http://127.0.0.1:3000` | Base URL for self-hosted API backend adapters. |
| `SESSION_DIR` | `./auth_info_baileys` | Directory for storing WhatsApp session state. |
| `SIGNATURE` | `> BOT_404` | Footer appended to outgoing bot messages. |
| `MAX_CONCURRENT` | `5` | Maximum parallel command execution instances. |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`). |
| `DOWNLOAD_MAX_MB` | `50` | Maximum allowed media download size in megabytes. |

</details>

<details>
<summary><b>V-2 Environment Variables Table (.env)</b></summary>

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `127.0.0.1` | MariaDB server host address. |
| `DB_PORT` | `3306` | MariaDB server port. |
| `DB_USER` | `root` | MariaDB database username. |
| `DB_PASSWORD` | `""` | MariaDB database password. |
| `DB_NAME` | `bot_404` | Target MariaDB database schema name. |
| `OWNER_NUMBER` | `""` | Target WhatsApp ID (`1234567890@s.whatsapp.net`) for anti-delete alerts. |
| `API_BASE_URL` | `http://127.0.0.1:3000` | Base URL for API service adapters. |
| `DASHBOARD_TOKEN` | `""` | Bearer token required for localhost ops API in production. |
| `MEDIA_DIR` | `./data/media` | Disk path for retained view-once and anti-delete media files. |

</details>

---

## INTERACTIVE COMMAND MATRIX

### V-1 COMMAND SUITE

<details>
<summary><b>Artificial Intelligence & Vision (Click to Expand)</b></summary>

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.aibot` | `.aibot <prompt>` | Conversational AI using Groq LLaMA 3.3 70B model. |
| `.vision` | Reply to image + `.vision <prompt>` | Multimodal image understanding and analysis. |
| `.img` | `.img <prompt>` | Text-to-image generation supporting bulk generation up to 50 items. |
| `.i2i` | Reply to image + `.i2i <prompt>` | Image-to-image AI style transformation. |

</details>

<details>
<summary><b>Media & Content Downloader (Click to Expand)</b></summary>

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.dl` | `.dl <video_url>` | Downloads MP4 video using local `yt-dlp` binary. |
| `.audio` | `.audio <url>` | Extracts MP3 audio using local `yt-dlp` binary. |
| `.alldl` | `.alldl <url>` | Universal media downloader (YouTube, TikTok, Instagram, FB, Reddit, X). |
| `.tts` | `.tts <text>` | Converts text into audio speech file. |
| `.voices` | `.voices` | Lists all available TTS voice options. |

</details>

<details>
<summary><b>Web Tools & Utilities (Click to Expand)</b></summary>

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.screenshot` | `.screenshot <url>` | Captures website webpage screenshot (PNG or PDF format). |
| `.zip` | `.zip <url>` | Archives website assets into downloadable ZIP container. |
| `.wikipdf` | `.wikipdf <article>` | Compiles Wikipedia article into standard PDF document. |
| `.cert` | `.cert <name> <type>` | Generates custom PDF certificates (8 templates supported). |
| `.search` | `.search <query>` | Fetches web search results from DuckDuckGo search API. |

</details>

<details>
<summary><b>Reader Services & Entertainment (Click to Expand)</b></summary>

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.manga` | `.manga <query>` | Interactive Manga browser, chapter index, and reader. |
| `.novel` | `.novel <query>` | Light novel database browser with English/Urdu translation support. |
| `.unovel` | `.unovel <query>` | Specialized Urdu novels library and catalog reader. |
| `.movie` | `.movie <title>` | Movie and TV series metadata, poster, cast, and IMDB rating. |
| `.med` | `.med <medicine_name>` | Pharmaceutical info lookup (dosage, interactions, market pricing). |
| `.courses` | `.courses <topic>` | Searches available free online education courses and materials. |

</details>

<details>
<summary><b>System & Mail Tools (Click to Expand)</b></summary>

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.menu` | `.menu` | Displays categorized command overview menu. |
| `.ping` | `.ping` | Evaluates bot execution latency and health response. |
| `.mail` | `.mail [create|inbox|read]` | Disposable inbox generator, mail viewer, and cleaner. |
| `.n8n` | `.n8n <query>` | Explores n8n workflow templates filtered by complexity or trigger. |

</details>

---

### V-2 COMMAND SUITE

<details>
<summary><b>Core Commands & Recovery Tools (Click to Expand)</b></summary>

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.help` / `.menu` | `.help` | Displays current V-2 platform options. |
| `.vv` | Reply to view-once media + `.vv` | Intercepts view-once image/video/audio and converts it to a standard file. |
| `.antidelete` | `.antidelete [on|off]` | Status inspector for anti-delete subsystem (permanently enabled). |
| `.tts` | `.tts <text>` | Synthesizes speech using API adapter layer. |
| `.dl` | `.dl <url>` | Invokes AllDL adapter for remote media link processing. |
| `.screenshot` | `.screenshot <url>` | Captures website screenshot via WebSnap API module. |
| `.imgchat` | `.imgchat <prompt>` | Triggers VisionSter adapter image analysis workflow. |
| `.hand` | `.hand <text>` | Converts input text into handwritten manuscript image. |

</details>

---

## LOCAL OPERATIONS & DASHBOARD (V-2)

Version 2 includes a background management service bound strictly to local loopback interface (`127.0.0.1`):

- **Health Endpoint**: `GET http://127.0.0.1:8787/health`
- **Operations Endpoint**: `GET http://127.0.0.1:8788/api/status`
- **Trusted Entity Control**: `POST http://127.0.0.1:8788/api/trusted`

### PRODUCTION DEPLOYMENT WITH PM2

To ensure continuous uptime and process restart supervision in production environments:

```bash
cd V-2
npm run build
pm2 start ecosystem.config.cjs
```

---

## SECURITY & DATA PRIVACY DIRECTIVES

1. **Authentication Credentials**: Never share or push files within `auth_info/` or `auth_info_baileys/`. These contain raw cryptographic keys providing full access to your linked WhatsApp account.
2. **Environment Protection**: Ensure `.env` is listed in your `.gitignore` file before committing changes.
3. **Local Scope Bounding**: Keep health ports (`8787`, `8788`) bound strictly to `127.0.0.1`. Do not expose these ports over public port-forwarding or reverse proxies without strong bearer tokens.
4. **Terms Compliance**: Use this automation framework strictly in accordance with applicable laws, chat participant consent, and WhatsApp Service Terms.

---

## TROUBLESHOOTING & DIAGNOSTICS

<details>
<summary><b>Issue: QR Code Fails to Render or Scan</b></summary>

- Expand terminal window width to prevent ASCII QR wrap-around errors.
- Delete existing session folder (`rm -rf V-1/auth_info_baileys` or `rm -rf V-2/auth_info`) and restart the bot process to generate a fresh QR code.

</details>

<details>
<summary><b>Issue: MariaDB Connection Errors (V-2)</b></summary>

- Verify XAMPP or local MariaDB server status on port 3306.
- Ensure `sql/schema.sql` was executed successfully against database `bot_404`.
- Validate user credentials in `V-2/.env`.

</details>

<details>
<summary><b>Issue: API Backend HTTP 403 / 405 Errors</b></summary>

- Ensure `API_BASE_URL` in `.env` points to a reachable, active backend service.
- Endpoints protected by anti-bot checks or WAFs require verification from your host network.

</details>

---

## CONTRIBUTING & LICENSE

Contributions are welcomed. Please review [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, architecture conventions, and submission checklists.

This project is open-source software licensed under the [MIT License](LICENSE).
