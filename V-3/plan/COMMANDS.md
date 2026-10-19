# BOT_404 (V3) — Command & Intelligence Specification

Owner & Creator: **Rutaab**

---

## 1. Feature Toggles: How Features Turn ON and OFF

All automated features can be turned **ON** and **OFF** instantly via chat commands or the local dashboard:

- `.antidelete on` / `.antidelete off` / `.antidelete status` — Intercepts deleted chat messages and forwards recovered media/text to Rutaab.
- `.antiedit on` / `.antiedit off` / `.antiedit status` — Tracks edited messages and forwards original vs. edited comparisons to Rutaab.
- `.antistatus on` / `.antistatus off` — Intercepts and archives deleted WhatsApp status stories so Rutaab never misses deleted stories.
- `.autostatus on` / `.autostatus off` — Automatically views/reads incoming WhatsApp status stories.
- `.bot on` / `.bot off` — Enables or disables the bot in the current group/chat.
- `.smartmode on` / `.smartmode off` — Toggles autonomous natural language task execution and priority intelligence.

---

## 2. Autonomous Task Execution (No Prefix Needed)

The bot's **Intent Engine** detects tasks written in natural language and executes them automatically:

| User Message (Natural Language) | Autonomous Action Executed |
|---|---|
| *"download this video https://..."* or sending a video link | Automatically detects the link and runs the media downloader (`.dl`). |
| *"make this a sticker"* / *"sticker this"* (reply to image/video) | Automatically converts the media to a WhatsApp sticker (`.s`). |
| *"recover this view once"* / *"save this"* (reply to view-once) | Automatically recovers and sends back the permanent media (`.vv`). |
| *"convert this voice note to text"* / *"what does this audio say?"* | Automatically transcribes the replied audio to text (`.transcribe`). |
| *"say in voice: Hello everyone"* | Automatically synthesizes text into audio voice message (`.tts`). |
| *"take a screenshot of https://..."* | Automatically captures and sends the webpage screenshot (`.screenshot`). |
| *"find info about paracetamol"* | Automatically queries the medicine database (`.med`). |
| *"create an image of a cybernetic tiger"* | Automatically generates an AI image from the prompt (`.image`). |
| *"search for latest AI news"* or *"google Python async"* | Automatically searches the web via SearXNG and returns top 10 results (`.search`). |
| *"play song Starboy"* or *"send audio of Pehle Bhi Main"* | Automatically searches, downloads, and sends the MP3 track (`.play`). |

---

## 3. Important Message, Owner & "Rutaab" Intelligence Filter

The bot evaluates incoming messages in real-time to detect priority requests:

1. **Rutaab & Owner Mention Recognition**:
   - When anyone mentions **"Rutaab"** (e.g. *"Rutaab please check"*, *"where is Rutaab?"*, *"tell Rutaab to reply"*):
     - The bot immediately sends a high-priority alert to Rutaab's direct chat with the sender's name, group, timestamp, and message.
     - The bot can politely reply: *"I have notified Rutaab about your message."*
2. **Urgent & High-Priority Keywords**:
   - Messages containing words like *"urgent"*, *"emergency"*, *"important"*, *"owner please check"* automatically trigger a priority push notification to Rutaab.
3. **Direct Questions & Help Requests**:
   - When someone asks *"how do I download media?"* or *"how to use the bot"*, the bot steps in with a clear, step-by-step interactive guide.
4. **Contextual Politeness**:
   - The bot stays quiet during regular group chatter to prevent spam, only activating when a task, question, or mention of the bot or Rutaab occurs.

---

## 4. WhatsApp Status & Group Status Suite

- `.status [caption]` — Posts the replied photo, video, or text directly to WhatsApp Status (`status@broadcast`) (Rutaab only).
- `.groupstatus [announcement]` — Formats and broadcasts an official status banner/bulletin to the group with all members tagged.
- `.antistatus [on/off]` — Saves contacts' deleted status updates to the database and forwards them to Rutaab.
- `.autostatus [on/off]` — Automatically marks status stories as viewed as soon as contacts post them.

---

## 5. Standard Command Catalog

### 🛡️ Privacy & Security
- `.vv` `[PUBLIC]` — Recovers a quoted view-once photo, video, or voice note and sends back a permanent copy.
- `.antidelete [on/off/status]` `[OWNER ONLY]` — Intercepts deleted messages and forwards original text/media to Rutaab.
- `.antiedit [on/off/status]` `[OWNER ONLY]` — Intercepts edited messages and forwards original vs. edited comparison to Rutaab.
- `.antistatus [on/off]` `[OWNER ONLY]` — Intercepts and preserves deleted WhatsApp status stories.
- `.del` `[PUBLIC]` — Deletes a message sent by the bot when replied to.

### 📢 Status & Announcements
- `.status [caption]` `[OWNER ONLY]` — Posts replied media or text directly to WhatsApp Status (Rutaab only).
- `.groupstatus [announcement]` `[ADMIN ONLY]` — Posts a highlighted status banner to the group.
- `.autostatus [on/off]` `[OWNER ONLY]` — Automatically views contact statuses.

### 🤖 AI & Guidance
- `@bot <question>` `[PUBLIC]` — Queries the AI assistant for instructions, guides, or general questions.
- `.image <prompt>` `[PUBLIC]` — Generates an AI image from a text description.
- `.video <prompt>` `[PUBLIC]` — Animates replied photo into an AI video.
- `.imgchat <prompt>` `[PUBLIC]` — Analyzes a replied photo and answers questions about it via Vision AI.

### 🎨 Media & FFmpeg Pipeline
- `.s` (or `.sticker`) `[PUBLIC]` — Converts a replied image, short video (<10s), or GIF into a sticker.
- `.wm <pack> | <author>` `[PUBLIC]` — Changes pack name and author metadata on a replied sticker (defaults to Rutaab / BOT_404).
- `.toimg` `[PUBLIC]` — Converts a replied sticker back into a standard JPG photo.
- `.tovn` (or `.toptt`) `[PUBLIC]` — Converts an audio file into a playable WhatsApp voice note.
- `.tomp3` `[PUBLIC]` — Extracts the audio track from a replied video into an MP3.

### 🎙️ Speech & Transcription
- `.tts <text>, [voice_id]` `[PUBLIC]` — Converts typed text into spoken audio across 400+ voices.
- `.voices [query]` `[PUBLIC]` — Lists available TTS voice IDs and languages.
- `.transcribe [url]` `[PUBLIC]` — Transcribes a replied voice note, audio file, or YouTube link to text.

### 🧰 Downloader, Search & Web Tools
- `.search <query>` (or `.google`) `[PUBLIC]` — Searches the web using SearXNG (aggregating Google, Bing, DuckDuckGo) and returns the top 10 results.
- `.dl <url>` `[PUBLIC]` — Downloads videos and audio from Instagram, TikTok, YouTube, Facebook, Twitter/X, and Pinterest.
- `.play <song name>` (or `.song`, `.music`) `[PUBLIC]` — Searches and sends a playable 320kbps MP3 audio track directly to WhatsApp.
- `.lyrics <song name>` `[PUBLIC]` — Searches and displays the complete lyrics of any song.
- `.screenshot <url>` `[PUBLIC]` — Captures a full webpage screenshot from any link.
- `.snapinfo <url>` `[PUBLIC]` — Fetches technical website metadata, server headers, and SEO preview data.
- `.wiki <topic>` `[PUBLIC]` — Searches Wikipedia and returns the full article as a downloadable PDF.
- `.zip <url>` `[PUBLIC]` — Packages a website's downloadable assets into a ZIP archive.
- `.hand <text>, [font], [color]` `[PUBLIC]` — Converts typed text into realistic handwritten notebook pages.
- `.mail [create/inbox/read/delete]` `[PUBLIC]` — Generates temporary email inboxes and reads incoming verification codes.
- `.med <name>` `[PUBLIC]` — Searches medicine database for drug usage, active ingredients, and indications.
- `.medinfo <id>` `[PUBLIC]` — Fetches detailed medical guidelines for a specific medicine record ID.
- `.manga <search/chapters/pages> <query>` `[PUBLIC]` — Searches manga titles, lists chapters, and fetches pages.
- `.novel <search/read> <query>` `[PUBLIC]` — Searches and reads chapters of web novels.
- `.unovel <search/detail> <query>` `[PUBLIC]` — Searches and downloads Urdu novels.
- `.movie <title>` `[PUBLIC]` — Fetches ratings, synopsis, cast, and release details for movies and TV series.
- `.trailer <movie title>` `[PUBLIC]` — Fetches and streams the official HD movie trailer video.
- `.n8n [categories/templates]` `[PUBLIC]` — Searches and returns ready-to-import n8n automation workflow templates.
- `.courses <query>` `[PUBLIC]` — Searches free online courses, tutorials, and certifications.

### 👥 Group Administration (Private / Owner Controlled)
- `.tagall [text]` `[OWNER / PRIVATE ONLY]` — Mentions all members in the group with an announcement message.
- `.hidetag [text]` `[OWNER / PRIVATE ONLY]` — Sends a notification mention to all members without visible tags.
- `.kick` `[OWNER / PRIVATE ONLY]` — Reply to a member's message (or tag @user) to remove them from the group.
- `.add <number>` `[OWNER / PRIVATE ONLY]` — Adds a user phone number directly into the group.
- `.promote` `[OWNER / PRIVATE ONLY]` — Reply to a member's message (or tag @user) to grant them admin status.
- `.demote` `[OWNER / PRIVATE ONLY]` — Reply to an admin's message (or tag @user) to revoke their admin status.
- `.mute` `[OWNER / PRIVATE ONLY]` — Locks the group so only admins can send messages.
- `.unmute` `[OWNER / PRIVATE ONLY]` — Unlocks the group so all participants can send messages.
- `.link` `[OWNER / PRIVATE ONLY]` — Fetches the active WhatsApp group invite link.
- `.revoke` `[OWNER / PRIVATE ONLY]` — Resets and generates a new group invite link.
- `.groupstatus [announcement]` `[OWNER / PRIVATE ONLY]` — Posts a highlighted status banner to the group.
- `.groupinfo` `[PUBLIC]` — Displays group stats, creation date, admin list, and member count.

### ⚙️ Utilities & System
- `.help` (or `.menu`) `[PUBLIC]` — Displays the categorized list of all bot commands.
- `.bot [on/off/status]` `[OWNER ONLY]` — Master switch to enable or disable the bot in the chat or globally.
- `.smartmode [on/off/status]` `[OWNER ONLY]` — Toggles autonomous natural language task execution and priority intelligence.
- `.ping` (or `.speed`) `[PUBLIC]` — Checks bot response speed and connection latency.
- `.runtime` (or `.uptime`) `[PUBLIC]` — Shows bot uptime, server RAM usage, and database message counters.
- `.owner` `[PUBLIC]` — Sends the official contact card of Rutaab.

### 🎮 Fun & Games (User ID & History Persistent)
All gaming features track player statistics, scores, and match histories tied to each user's unique WhatsApp phone number (User ID).

- `.quiz` (or `.trivia`) `[PUBLIC]` — Fetches interactive trivia questions with 4 multiple-choice options (A, B, C, D) and a 60-second timer (+10 XP for correct answer).
- `.answer <A/B/C/D>` (or `.ans`) `[PUBLIC]` — Submits an answer to the active trivia quiz and automatically logs points to the player's User ID profile.
- `.tictactoe [@opponent or 1-9]` (or `.ttt`) `[PUBLIC]` — Starts or plays moves in a 3x3 Tic-Tac-Toe grid against another tagged member or the bot (+15 XP for win, +5 XP for draw).
- `.rps <rock/paper/scissors>` `[PUBLIC]` — Plays Rock, Paper, Scissors against the bot (+5 XP win, +2 XP tie).
- `.profile [@user]` (or `.gamestats`, `.mygame`, `.rank`) `[PUBLIC]` — Displays the player's User ID game profile: Total Games, Wins, Losses, Draws, Win Rate %, Total XP Score, and Rank Title.
- `.gamehistory [@user]` (or `.myhistory`, `.ghistory`) `[PUBLIC]` — Lists the player's last 8 match results with timestamps, opponents, outcomes, and point adjustments.
- `.leaderboard` (or `.topgames`, `.top`) `[PUBLIC]` — Displays the global top 10 players ranked by score, wins, and win rate.
- `.roll` (or `.dice`) `[PUBLIC]` — Rolls a random 6-sided dice (`⚀` to `⚅`).
- `.flip` (or `.coin`) `[PUBLIC]` — Flips a coin returning **HEADS** or **TAILS**.
- `.hack [target]` `[PUBLIC]` — Runs an interactive prank terminal hacking simulation with progressive terminal animations.

#### 🎖️ Rank Progression Tiers
- 🌱 **Novice**: 0 – 49 XP
- 🛡️ **Challenger**: 50 – 99 XP
- ⚔️ **Veteran**: 100 – 249 XP
- 💎 **Master**: 250 – 499 XP
- 👑 **Grandmaster**: 500+ XP

