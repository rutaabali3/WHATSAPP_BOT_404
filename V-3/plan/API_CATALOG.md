# ahm7xmakki.com API Catalog & Command Formats (V3)

This document provides a complete reference for all backend APIs powered by `ahm7xmakki.com`, their HTTP endpoints, WhatsApp command syntax, and flexible customization options.

---

## 1. Overview & Argument Flexibility

Commands in **WHATSAPP_BOT_404_V3** support two flexible argument formats:
1. **Positional Arguments (Comma-Separated):**
   ```text
   .command <main_arg>, [option1], [option2], [option3]
   ```
2. **Named Key-Value Arguments:**
   ```text
   .command <main_arg>, option1=val, option2=val, option3=val
   ```
*If an argument contains commas inside the text, the parser preserves them and extracts trailing options cleanly.*

---

## 2. API Endpoints & Command Reference

### 1. SpeechSter — Text to Speech (`/api/tts` & `/api/voices`)

Converts written text into spoken audio in over 400+ voices and multiple languages.

* **HTTP Endpoints:**
  * `POST /api/tts` — Synthesizes audio (`audio/mpeg` or `audio/ogg`).
  * `GET /api/voices?q=<query>` — Lists and searches available voices.
* **Payload:**
  ```json
  {
    "voiceIndex": 313,
    "text": "Hello world",
    "pitch": 0,
    "rate": 0
  }
  ```
* **Command Syntax:**
  * `.tts <text>, [voiceIndex], [pitch], [rate]`
  * `.voices [search_query]`
* **Flexibility & Options:**
  * `voiceIndex`: Voice ID number (e.g. 313 = English Male, 314 = English Female, 345 = Urdu/Hindi).
  * `pitch`: Adjusts vocal tone from `-100` to `100` (default: `0`).
  * `rate`: Adjusts speaking speed from `-100` to `100` (default: `0`).
  * *Auto-Chunking:* If text exceeds 1,950 characters, the bot automatically splits the text at punctuation and stitches the synthesized audio chunks seamlessly.
* **Examples:**
  ```text
  .tts Welcome to BOT_404
  .tts Welcome to BOT_404, 314
  .tts Good morning everyone, voice=313, pitch=10, rate=-5
  .voices urdu
  ```

---

### 2. AllDL — Universal Media Downloader (`/api/alldl` with Multi-Engine Fallback)

Downloads videos, reels, and audio from Instagram, TikTok, YouTube, Facebook, Twitter/X, and Pinterest.

* **Primary HTTP Endpoint:** `POST /api/alldl`
* **Multi-Engine Smart Failover (Handles YouTube Upstream Issues):**
  * **Primary Engine:** `ahm7xmakki.com/api/alldl` (handles Instagram, TikTok, Facebook, Twitter, and standard YouTube).
  * **YouTube Failover Engine (Cobalt Tools):** If `ahm7xmakki.com` experiences YouTube cipher/upstream blocks (e.g. 403 / bot detection), the bot automatically fails over to the open-source **Cobalt API** (`https://api.cobalt.tools`) to retrieve direct MP4 video and MP3 audio streams without user disruption.
  * **Local `yt-dlp` Fallback:** If installed on the host machine, the bot uses `yt-dlp` as a local fail-safe for YouTube and niche platforms.
* **Command Syntax:**
  * `.dl <url>`
  * *Autonomous Zero-Prefix:* Paste link directly or write *"download this: <url>"*.
* **Flexibility & Options:**
  * Supports short URLs, full URLs, and mobile share links.
  * Automatically selects highest available video quality without watermarks.
* **Examples:**
  ```text
  .dl https://www.instagram.com/reel/DA12345/
  .dl https://youtu.be/dQw4w9WgXcQ
  .dl https://www.tiktok.com/@user/video/73918237912
  ```

---

### 3. WebSnap — Webpage Screenshot & Metadata (`/api/websnap`)

Captures clean full-page screenshots of any website or inspects server headers.

* **HTTP Endpoint:** `GET /api/websnap?url=<url>&fullPage=<bool>&viewport=<type>`
* **Command Syntax:**
  * `.screenshot <url> [full/mobile]` (Aliases: `.ss`, `.websnap`)
  * `.snapinfo <url>`
* **Flexibility & Options:**
  * `viewport`: `desktop` (1920x1080) or `mobile` (iPhone 14 viewport).
  * `fullPage`: Captures entire scrolling webpage height (`1` or `true`).
* **Examples:**
  ```text
  .screenshot https://github.com
  .screenshot https://wikipedia.org, mobile
  .snapinfo https://google.com
  ```

---

### 4. TranScribe — Speech-to-Text (`/api/transcribe`)

Transcribes voice notes, uploaded audio files, or YouTube links into written text.

* **HTTP Endpoint:** `POST /api/transcribe`
* **Payload:**
  ```json
  {
    "audio": "<url_or_base64>",
    "youtube": "<url>",
    "language": "auto"
  }
  ```
* **Command Syntax:**
  * Reply to audio with `.transcribe [lang]`
  * `.transcribe <youtube_or_audio_url> [lang]`
* **Flexibility & Options:**
  * `language`: `auto` (auto-detects language), or ISO code like `en`, `ur`, `ar`, `es`, `hi`.
* **Examples:**
  ```text
  .transcribe (replying to voice note)
  .transcribe lang=ur (replying to voice note in Urdu)
  .transcribe https://youtu.be/xyz
  ```

---

### 5. HandSter — Realistic Handwriting Generator (`/api/handwriting`)

Renders typed text into realistic handwritten notebook and assignment pages.

* **HTTP Endpoint:** `POST /api/handwriting` (returns PNG/JPEG image)
* **Payload:**
  ```json
  {
    "text": "Assignment Notes...",
    "font": "casual",
    "color": "blue",
    "size": 36,
    "paper": "ruled",
    "brand": 0,
    "rtl": 0
  }
  ```
* **Command Syntax:**
  * `.hand <text>, [font], [color], [size], [paper]`
  * Named format: `.hand <text>, font=..., color=..., paper=...`
* **Flexibility & Customization Options:**
  * `font`: `casual`, `neat`, `kalam`, `messy`, `cursive`, `urdu` (auto-enables RTL).
  * `color`: `blue`, `darkblue`, `black`, `red`, `gel-blue`.
  * `paper`: `plain`, `ruled`, `notebook`, `squared`.
  * `size`: Font size integer (default: `36`).
  * `brand`: `0` (clean, no watermark) or `1`.
* **Examples:**
  ```text
  .hand Quantum Mechanics Chapter 1
  .hand Physics Assignment, casual, darkblue, 36, ruled
  .hand Linear Algebra Notes, font=kalam, color=black, paper=plain, brand=0
  .hand سبق نمبر ۱ اردو ادب, font=urdu, color=black
  ```

---

### 6. PixelSter & VisionSter — AI Creation & Vision (`/api/image`, `/api/video`, `/api/imgchat`)

* **HTTP Endpoints:**
  * `POST /api/image` — Text-to-Image generation (`prompt`, `aspect_ratio`).
  * `POST /api/video` — Image-to-Video motion animation (`image`, `prompt`).
  * `POST /api/imgchat` — Visual image Q&A (`image`, `prompt`).
* **Command Syntax:**
  * `.image <prompt>, [aspect_ratio]`
  * Reply to photo with `.video <motion prompt>`
  * Reply to photo with `.imgchat <question>`
* **Flexibility & Photo Support:**
  * **Works on ANY photo:** Portraits, selfies, human faces, anime characters, cars, animals, artwork, 9:16 vertical reels, 1:1 squares, or nature landscapes.
  * `aspect_ratio`: `1:1` (square), `16:9` (landscape), `9:16` (vertical story/reel).
* **Examples:**
  ```text
  .image futuristic cyberpunk city neon lights, ratio=16:9
  .video make the person smile and blink naturally (replying to portrait/selfie)
  .video make the anime character draw their sword (replying to anime art)
  .video make the car drift with smoke behind (replying to car photo)
  .video make the water flow and clouds move (replying to nature photo)
  .imgchat what type of bird is this and where is it found? (replying to photo)
  ```

---

### 7. Music & Song Suite (`.play`, `.song`, `.lyrics`, `.spotify`)

Searches, downloads, and streams music tracks directly into WhatsApp with cover art and lyrics.

* **Multi-Source Music Sourcing Pipeline:**
  * **Primary Engine:** Routes query through **`ahm7xmakki.com/api/alldl`** for audio extraction.
  * **Direct Music CDN Failover (JioSaavn):** For music tracks, the bot can directly query high-res music CDNs to fetch studio-quality **320kbps MP3s** with official album art and singer tags, completely bypassing YouTube's bot blocks and network throttling!
  * **Cobalt Audio Failover:** If YouTube links are supplied, Cobalt API extracts lossless audio streams as secondary failover.
* **Command Syntax:**
  * `.play <song name or artist>` (Aliases: `.song`, `.music`)
  * `.lyrics <song name>` — Searches and returns complete song lyrics.
  * `.spotify <track_url>` — Downloads audio directly from Spotify link.
* **Autonomous Intent:**
  * Write *"play song Believer"* or *"send audio of Pehle Bhi Main"* — the bot detects the song and sends the audio automatically!
* **What the Bot Delivers:**
  * Sends a playable MP3 audio track directly into WhatsApp with title, artist name, and duration.
* **Examples:**
  ```text
  .play Starboy The Weeknd
  .song Believer Imagine Dragons
  .lyrics Bohemian Rhapsody
  .spotify https://open.spotify.com/track/...
  ```

---

### 8. Movie & Cinema Suite (`.movie`, `.trailer`)

* **HTTP Endpoints:**
  * `GET /api/msearch?q=<title>` — Movie details, cast, synopsis, IMDB ratings.
* **Command Syntax:**
  * `.movie <title>` — Fetches poster, synopsis, ratings, director, cast, and release year.
  * `.trailer <movie title>` — Fetches and streams the official HD video trailer.
* **Examples:**
  ```text
  .movie Interstellar
  .movie Oppenheimer
  .trailer Inception
  ```

---

### 9. TempSter — Disposable Email Inboxes (`/api/mail`)

Generates temporary email addresses and reads incoming verification OTPs.

* **HTTP Endpoint:** `GET /api/mail?action=<action>&address=<addr>&email_id=<id>`
* **Command Syntax:**
  * `.mail create` — Generates a new temp email address.
  * `.mail inbox <address>` — Lists incoming emails in the inbox.
  * `.mail read <address> <email_id>` — Reads full content of an email.
  * `.mail delete <address>` — Destroys the temporary inbox.
* **Examples:**
  ```text
  .mail create
  .mail inbox user123@tempdomain.com
  .mail read user123@tempdomain.com 4589
  ```

---

### 8. MedSter — Pharmaceutical Medicine Database (`/api/medicine`)

Searches drug usages, active ingredients, dosage indications, and safety information.

* **HTTP Endpoint:**
  * `GET /api/medicine?q=<name>` — Search medicines.
  * `GET /api/medicine?id=<id>` — Detailed medical monograph.
* **Command Syntax:**
  * `.med <medicine_name>`
  * `.medinfo <medicine_id>`
* **Examples:**
  ```text
  .med Panadol
  .med Ibuprofen
  .medinfo 1042
  ```

---

### 9. Literature & Entertainment — Manga, Novels, Movies

* **MangaSter (`/api/manga`):**
  * `.manga search <title>`
  * `.manga chapters <manga_id>`
  * `.manga pages <chapter_id>`
* **NovelSter (`/api/novel`):**
  * `.novel search <title>`
  * `.novel read <chapter_id>`
* **UNovelSter — Urdu Novels (`/api/unovel`):**
  * `.unovel search <title>`
  * `.unovel detail <novel_id>`
  * `.unovel download <novel_id>`
* **CineSter — Movie & Series Database (`/api/msearch`):**
  * `.movie <title>` — Returns IMDB rating, poster, release year, genre, and plot summary.
* **Examples:**
  ```text
  .manga search One Piece
  .novel search Shadow Slave
  .unovel search Peer e Kamil
  .movie Interstellar
  ```

---

### 10. Document & Utility Tools

* **WikSter — Wikipedia to PDF (`/api/wikipdf`):**
  * Command: `.wiki <topic>`
  * Example: `.wiki Artificial Intelligence`
* **WebZip — Website Asset Downloader (`/api/zip`):**
  * Command: `.zip <url>`
  * Example: `.zip https://example.com`
* **CertSter — Certificate Generator (`/api/certificate`):**
  * Command: `.cert <name>, [course], [date], [template_id]`
  * Template inspection: `.cert templates`
* **n8nSter — Automation Templates (`/api/n8n`):**
  * Command: `.n8n categories` or `.n8n templates <category>`
* **Courses Search (`/api/courses`):**
  * Command: `.courses <query>`
  * Example: `.courses full stack web development`

---

## 3. Summary of Supported Syntax Patterns

| Command | Positional Syntax | Named Key-Value Syntax |
|---|---|---|
| `.tts` | `.tts Hello, 313, 0, 0` | `.tts Hello, voice=313, pitch=5, rate=-10` |
| `.hand` | `.hand Notes, kalam, darkblue, 36, ruled` | `.hand Notes, font=kalam, color=darkblue, paper=ruled, brand=0` |
| `.screenshot` | `.screenshot https://google.com, mobile` | `.screenshot https://google.com, viewport=mobile, full=true` |
| `.image` | `.image a cute cat, 1:1` | `.image a cute cat, ratio=16:9` |
| `.transcribe` | `.transcribe https://youtu.be/..., ur` | `.transcribe https://youtu.be/..., lang=ur` |
