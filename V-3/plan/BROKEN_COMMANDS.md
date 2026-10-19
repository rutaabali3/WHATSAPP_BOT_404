# BROKEN / NON-WORKING COMMANDS — Fix Later

> **Audit Date**: 2026-09-26
> **Reason**: These commands rely on APIs that are currently DOWN, returning 404/500, or DNS-unreachable.
> They have been removed from the working `OUTPUT_PREVIEWS.md` until their backends are fixed or replaced.

---

## ⚠️ API Status Summary

| Backend | Status | Impact |
|---|---|---|
| `ahm7xmakki.com/api/*` | **ALL endpoints returning 404/500** | ALL primary API commands broken |
| `api.cobalt.tools` | **400 Bad Request** | Video download fallback broken |
| `saavn.dev` (JioSaavn) | **DNS unresolvable** | Music fallback broken |
| `api.quotable.io` | **DNS unresolvable** | Quote fallback broken |
| All SearXNG instances | **HTML / 429 / DNS fail** | Web search completely broken |

---

## 1. BROKEN: Media Downloaders

### Commands Affected:
- `.alldl <url>` (aliases: `.download`, `.dl`)
- `.yt <url>` (aliases: `.ytmp4`, `.ytdl`)
- `.fb <url>`
- `.ig <url>` (aliases: `.insta`, `.instagram`)
- `.tiktok <url>` (aliases: `.tt`)

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/alldl` → 500 Internal Server Error
- **Primary**: `ahm7xmakki.com/api/ytmp3` → 404 Not Found
- **Fallback**: `api.cobalt.tools/api/json` → 400 Bad Request (API format changed)

### Code Location:
- [`media.ts` L27-L155](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/media.ts#L27-L155)
- [`api.ts` L91-L157](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L91-L157)

### Expected Output (when fixed):
```text
🤖 *BOT_404_V3*
────────────────

📥 *Media Downloaded* ✅

🔗 *Platform:* Instagram Reel 📸
🎬 *Quality:* 1080p HD 🔥
⚡ *Engine:* V3-Downloader

────────────────
Powered by V3-ARCHITECTURE
```

---

## 2. BROKEN: Music Player / Song Search

### Commands Affected:
- `.play <song>` (aliases: `.song`, `.music`)

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/music` → 404 Not Found
- **Fallback 1**: `saavn.dev` → DNS unresolvable (domain gone)
- **Fallback 2**: Cobalt `ytsearch:` → Cobalt API returns 400

### Code Location:
- [`media.ts` L157-L185](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/media.ts#L157-L185)
- [`api.ts` L160-L228](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L160-L228)

### Expected Output (when fixed):
```text
🤖 *BOT_404_V3*
────────────────

🎵 *Music Track Delivered* ✅

🎶 *Title:* Starboy (feat. Daft Punk) 🔥
🎤 *Artist:* The Weeknd
⏱️ *Duration:* 3:50
📦 *Format:* Audio (MP3 • 320kbps) 🎧

────────────────
Powered by V3-ARCHITECTURE
```

---

## 3. BROKEN: Web Search

### Commands Affected:
- `.search <query>` (aliases: `.google`, `.find`)

### Root Cause:
- **ALL SearXNG instances are broken:**
  - `searx.be` → Returns HTML instead of JSON
  - `search.ononoki.org` → DNS resolution failed
  - `searx.tiekoetter.com` → 429 Too Many Requests
  - `priv.au` → 429 Too Many Requests

### Code Location:
- [`tools.ts` L4-L37](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/tools.ts#L4-L37)
- [`api.ts` L57-L88](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L57-L88)

### Expected Output (when fixed):
```text
🤖 *BOT_404_V3*
────────────────

🔍 *Search Results:* "Node.js Baileys Guide"

1️⃣ *WhiskeySockets/Baileys - GitHub* 🌟
   📖 Lightweight full-featured TypeScript/JavaScript WhatsApp Web API library.
   🔗 https://github.com/WhiskeySockets/Baileys

...

────────────────
Powered by V3-ARCHITECTURE
```

---

## 4. BROKEN: Movie Info

### Commands Affected:
- `.movie <title>`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/movie` → 404 Not Found
- No fallback API implemented

### Code Location:
- [`media.ts` L204-L237](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/media.ts#L204-L237)
- [`api.ts` L273-L306](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L273-L306)

### Expected Output (when fixed):
```text
🤖 *BOT_404_V3*
────────────────

🎬 *Movie Details*

🎥 *Title:* Interstellar (2014) 🌌
⭐ *IMDB Rating:* 8.7/10 🍿
🎭 *Genre:* Sci-Fi, Adventure, Drama
👤 *Director:* Christopher Nolan 🎬

────────────────
Powered by V3-ARCHITECTURE
```

---

## 5. BROKEN: Movie Trailer

### Commands Affected:
- `.trailer <title>`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/trailer` → 404 Not Found
- No fallback API implemented

### Code Location:
- [`media.ts` L238-L254](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/media.ts#L238-L254)
- [`api.ts` L309-L329](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L309-L329)

---

## 6. BROKEN: Lyrics (Partially — primary only)

### Commands Affected:
- `.lyrics <song>`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/lyrics` → 404 Not Found
- **Fallback**: `lrclib.net` → ✅ WORKS — but code catches primary error and falls to it

### Status: **PARTIALLY WORKING** (only via LRCLIB fallback)
### Fix Priority: **LOW** — fallback works, lyrics are delivered

### Code Location:
- [`media.ts` L186-L203](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/media.ts#L186-L203)
- [`api.ts` L231-L270](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L231-L270)

---

## 7. BROKEN: Weather (Partially — primary only)

### Commands Affected:
- `.weather <city>`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/weather` → 404 Not Found
- **Fallback**: `wttr.in` → ✅ WORKS

### Status: **PARTIALLY WORKING** (only via wttr.in fallback)
### Fix Priority: **LOW** — fallback works

### Code Location:
- [`tools.ts` L38-L49](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/tools.ts#L38-L49)
- [`api.ts` L332-L348](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L332-L348)

---

## 8. BROKEN: URL Shortener (Partially)

### Commands Affected:
- `.shorten <url>` (aliases: `.tinyurl`)

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/shorten` → 404 Not Found
- **Fallback**: `tinyurl.com` → ✅ WORKS

### Status: **PARTIALLY WORKING** (only via TinyURL fallback)
### Fix Priority: **LOW** — fallback works

### Code Location:
- [`tools.ts` L50-L67](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/tools.ts#L50-L67)
- [`api.ts` L389-L405](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L389-L405)

---

## 9. BROKEN: Quote

### Commands Affected:
- `.quote`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/quote` → 404 Not Found
- **Fallback**: `api.quotable.io` → DNS unresolvable (domain gone)
- Code has hardcoded final fallback string

### Status: **DEGRADED** — only returns hardcoded Peter Drucker quote

### Code Location:
- [`fun.ts` L83-L92](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/fun.ts#L83-L92)
- [`api.ts` L350-L360](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L350-L360)

---

## 10. BROKEN: Fact

### Commands Affected:
- `.fact`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/fact` → 404 Not Found
- **Fallback**: `uselessfacts.jsph.pl` → Uses old URL format (needs `/api/v2/facts/random`)
- Code has hardcoded final fallback string

### Status: **DEGRADED** — fallback URL is wrong, returns hardcoded honey fact
### Fix: Change fallback URL from `uselessfacts.jsph.pl/random.json` to `uselessfacts.jsph.pl/api/v2/facts/random`

### Code Location:
- [`fun.ts` L93-L103](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/fun.ts#L93-L103)
- [`api.ts` L362-L372](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L362-L372)

---

## 11. BROKEN: News

### Commands Affected:
- `.news`

### Root Cause:
- **Primary**: `ahm7xmakki.com/api/news` → 404 Not Found
- **Fallback**: Uses SearXNG search (which is also broken — see #3)

### Status: **FULLY BROKEN** — both primary and fallback dead

### Code Location:
- [`fun.ts` L104-L114](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/plugins/fun.ts#L104-L114)
- [`api.ts` L374-L387](file:///c:/Users/Fahad/.gemini/antigravity/scratch/WHATSAPP_BOT_404/src/api.ts#L374-L387)

---

## 12. NOT IMPLEMENTED — Documented in API_CATALOG but no code

These commands appear in `API_CATALOG.md` or `OUTPUT_PREVIEWS.md` but have **NO implementation** in the codebase:

| Command | Documented In | Status |
|---|---|---|
| `.tts <text>` | API_CATALOG | ❌ No handler in any plugin file |
| `.voices [query]` | API_CATALOG | ❌ No handler |
| `.hand <text>` | API_CATALOG, OUTPUT_PREVIEWS (as `.hand`) | ❌ No handler |
| `.screenshot <url>` | API_CATALOG, OUTPUT_PREVIEWS | ❌ No handler |
| `.mail [create/inbox]` | API_CATALOG, OUTPUT_PREVIEWS | ❌ No handler |
| `.med <name>` | API_CATALOG, OUTPUT_PREVIEWS | ❌ No handler |
| `.wiki <topic>` | OUTPUT_PREVIEWS | ❌ No handler |
| `.vv` (view-once recovery) | OUTPUT_PREVIEWS | ❌ No command handler (view-once is handled passively) |
| `.del` | OUTPUT_PREVIEWS | ❌ No handler |
| `.tovn` | OUTPUT_PREVIEWS | ❌ No handler |
| `.wm <pack> \| <author>` | OUTPUT_PREVIEWS | ❌ No handler |
| `.manga` | API_CATALOG | ❌ No handler |
| `.novel` | API_CATALOG | ❌ No handler |
| `.unovel` | API_CATALOG | ❌ No handler |
| `.video` (image-to-video) | API_CATALOG | ❌ No handler |
| `.imgchat` | API_CATALOG | ❌ No handler |
| `.spotify` | API_CATALOG | ❌ No handler |
| `.cert` | API_CATALOG | ❌ No handler |
| `.n8n` | API_CATALOG | ❌ No handler |
| `.courses` | API_CATALOG | ❌ No handler |
| `.zip` | API_CATALOG | ❌ No handler |
| `.bot on/off` (category menu style) | OUTPUT_PREVIEWS | ✅ Exists but different output format |
| `.smartmode` | OUTPUT_PREVIEWS | ✅ Exists but permanently disabled |
| `.help <category>` | OUTPUT_PREVIEWS | ❌ Not a separate handler — `.menu` serves as combined help |

---

## 🔧 Recommended Fix Priority

### HIGH PRIORITY (Core functionality):
1. **Find new download API** — Replace `ahm7xmakki.com/api/alldl` and Cobalt (all downloaders depend on this)
2. **Find new SearXNG instances or use alternative search API** — `.search` is completely dead
3. **Find new music API** — Replace `ahm7xmakki.com/api/music` + dead JioSaavn

### MEDIUM PRIORITY:
4. **Add OMDB/TMDB API** for `.movie` / `.trailer`
5. **Fix `.fact` fallback URL** — easy fix, just update the endpoint path
6. **Fix `.quote` fallback** — `quotable.io` is dead, find replacement

### LOW PRIORITY (already working via fallback):
7. `.lyrics` — LRCLIB fallback works fine
8. `.weather` — wttr.in fallback works fine
9. `.shorten` — TinyURL fallback works fine
