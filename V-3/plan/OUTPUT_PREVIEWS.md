# WHATSAPP_BOT_404_V3 — Working Commands & Output Previews

> **Last Audited**: 2026-09-26
> **Status**: Only verified working commands are listed below.
> **Broken Commands**: See [`BROKEN_COMMANDS.md`](./BROKEN_COMMANDS.md) for commands pending API fixes.

---

## 1. Main Menu (`.menu`)

When a user types `.menu`, the bot responds with the dynamic categorized command directory:

```text
🤖 *BOT_404_V3*
────────────────

📋 *COMMAND DIRECTORY*

👤 *Owner*: Rutaab
📊 *RAM*: 98 MB
🕒 *Uptime*: 4h 12m 30s

╭──「 🤖 *AI ASSISTANT* 」
│
│ 📌 Tag *@bot <question>*
│ _Chat with AI assistant (15/day)_
│
╰───────────────────╯

╭──「 🖼️ *MEDIA & AI TOOLS* 」
│
│ 📌 *.sticker* (or *.s*)
│ _Convert image/video to sticker_
│
│ 📌 *.toimg*
│ _Extract image from sticker_
│
│ 📌 *.tomp3*
│ _Convert video/audio to MP3_
│
│ 📌 *.transcribe*
│ _Voice note speech-to-text_
│
│ 📌 *.image <prompt>*
│ _Generate stunning AI images_
│
╰───────────────────╯

╭──「 🎮 *GAMES & FUN* 」
│
│ 📌 *.quiz* / *.answer <A/B/C/D>*
│ 📌 *.tictactoe* / *.ttt <1-9>*
│ 📌 *.rps <rock/paper/scissors>*
│ 📌 *.roll* / *.flip*
│ 📌 *.hack [target]*
│ 📌 *.profile* / *.gamehistory* / *.leaderboard*
│ 📌 *.quote* / *.fact*
│
╰───────────────────╯

╭──「 🔍 *TOOLS* 」
│
│ 📌 *.weather <city>*
│ 📌 *.shorten <url>*
│ 📌 *.calc <math>*
│ 📌 *.lyrics <song>*
│
╰───────────────────╯

╭──「 👥 *GROUP ADMIN* 」 (admin only)
│
│ *.kick* / *.promote* / *.demote* / *.add*
│ *.mute* / *.unmute* / *.link* / *.revoke*
│ *.tagall* / *.hidetag* / *.groupstatus*
│
╰───────────────────╯

╭──「 👑 *OWNER CONTROLS* 」 (owner only)
│
│ *.story* / *.stats* / *.antidelete* / *.antiedit*
│ *.antistatus* / *.autostatus* / *.bot [on/off]*
│
╰───────────────────╯

────────────────
Powered by V3-ARCHITECTURE
```

---

## 2. Interactive AI Guide (`@bot <question>`) 🧠 ✅

**API**: Groq LLM (verified working)

### User Query:
> `@bot how to download the media`

### Bot Response:
```text
🤖 *BOT_404_V3*
────────────────

🧠 *AI ASSISTANT*

To download videos, reels, or audio from social media, use:

📌 *Command:* *.alldl <link>*

Simply paste a link from YouTube, Instagram, TikTok, Facebook, or Twitter
and the bot will auto-detect and download the media for you.

📊 _AI queries remaining today: 14/15_

────────────────
Powered by V3-ARCHITECTURE
```

---

## 3. System & General Commands ✅

### Latency Check (`.ping`):
**Depends on**: MariaDB only (local) — **always works**
```text
🤖 *BOT_404_V3*
────────────────

⚡ *PING*

⚡ *Pong!*

• *DB Latency*: 38ms
• *Process Uptime*: 4h 12m 30s
• *RAM Usage*: 98 MB

────────────────
Powered by V3-ARCHITECTURE
```

### System Status (`.alive`):
**Depends on**: Local telemetry only — **always works**
```text
🤖 *BOT_404_V3*
────────────────

🟢 *SYSTEM STATUS: ONLINE*

• *Architect*: Rutaab
• *Runtime*: Node.js v22.14.0 (ESM)
• *Platform*: win32
• *Memory RSS*: 98 MB / 800 MB cap
• *Heap Used*: 45 MB
• *Uptime*: 4h 12m 30s

────────────────
Powered by V3-ARCHITECTURE
```

### System Telemetry (`.stats` — Owner Only):
**Depends on**: MariaDB only — **always works**
```text
🤖 *BOT_404_V3*
────────────────

📊 *SYSTEM TELEMETRY*

👑 *Owner*: Rutaab
⏱️ *Uptime*: 4h 12m 30s
⚡ *Platform*: win32
📦 *Node*: v22.14.0

💾 *Memory Metrics*:
• RSS: 98 MB (Cap: 800 MB)
• Heap Used: 45 MB
• Heap Total: 67 MB

🗄️ *Database Records*:
• Total Messages Logged: 1,420
• Total Edits Captured: 28
• Total Media Stored: 143
• DB Disk Footprint: 12 MB

────────────────
Powered by V3-ARCHITECTURE
```

---

## 4. Privacy & Anti-Features (Owner Only) 🔒 ✅

All privacy features use **local DB settings + Baileys event hooks** — no external API needed.

### Anti-Delete Toggle (`.antidelete on`):
```text
🤖 *BOT_404_V3*
────────────────

🛡️ *Anti-Delete* has been set to: *ON*

────────────────
Powered by V3-ARCHITECTURE
```

### Anti-Delete Recovery Alert (sent to owner):
```text
🤖 *BOT_404_V3*
────────────────

🗑️ *ANTI-DELETE RECOVERY*

👤 *Deleted By*: 923129876543
📍 *Chat*: University Friends [Group]
⏰ *Sent Time*: 2:45 PM

💬 *Recovered Text*:
"Don't tell the teacher about the test"

────────────────
Powered by V3-ARCHITECTURE
```

### Anti-Edit Toggle (`.antiedit on`):
```text
🤖 *BOT_404_V3*
────────────────

✏️ *Anti-Edit* has been set to: *ON*

────────────────
Powered by V3-ARCHITECTURE
```

### Anti-Edit Alert (sent to owner):
```text
🤖 *BOT_404_V3*
────────────────

✏️ *ANTI-EDIT ALERT*

👤 *Edited By*: 923001234567
📍 *Chat*: Tech Discussion [Group]
⏰ *Edit Detected*: 3:20 PM

🔴 *ORIGINAL*:
"Meet me at 4 PM"

🟢 *EDITED*:
"Meet me at 8 PM"

────────────────
Powered by V3-ARCHITECTURE
```

### Anti-Status Toggle (`.antistatus on`):
```text
🤖 *BOT_404_V3*
────────────────

📸 *Anti-Status*: *ON*

────────────────
Powered by V3-ARCHITECTURE
```

### Auto-Status Viewer (`.autostatus on`):
```text
🤖 *BOT_404_V3*
────────────────

👀 *Auto-Status Viewer* has been set to: *ON*

────────────────
Powered by V3-ARCHITECTURE
```

### Bot Switch (`.bot on/off`):
```text
🤖 *BOT_404_V3*
────────────────

🤖 *Master Bot Switch* has been set to: *ON*

────────────────
Powered by V3-ARCHITECTURE
```

---

## 5. WhatsApp Status Story Publisher (`.story` — Owner Only) ✅

**Depends on**: Baileys `sendMessage` to `status@broadcast` — **always works**

```text
🤖 *BOT_404_V3*
────────────────

✅ *STATUS PUBLISHED*

✅ *WhatsApp Status Story Published!*

• *Type*: Photo Story
• *Audience*: 42 contact(s) synced

────────────────
Powered by V3-ARCHITECTURE
```

---

## 6. Media Conversion Tools ✅

These tools use **local Baileys download + sharp/FFmpeg** — no external APIs needed.

### Sticker Maker (`.sticker` or `.s` — reply to image/video):
```text
[Sends WebP sticker directly — no text output, just the sticker appears]
```

### Sticker to Image (`.toimg` — reply to sticker):
```text
🤖 *BOT_404_V3*
────────────────

🖼️ *STICKER TO IMAGE*

_Extracted photo from sticker_

────────────────
Powered by V3-ARCHITECTURE
```

### Video/Audio to MP3 (`.tomp3` — reply to video or audio):
```text
[Sends converted MP3 audio file directly]
```

---

## 7. AI Image Generation (`.image <prompt>`) ✅

**API**: Pollinations.ai (verified working — returns valid image data)

```text
🤖 *BOT_404_V3*
────────────────

🎨 *AI IMAGE*

🎨 *AI Image Generated*

💭 *Prompt*: "a cybernetic tiger in a neon cyberpunk city 8k"

────────────────
Powered by V3-ARCHITECTURE
```

---

## 8. Voice Transcription (`.transcribe` — reply to voice note) ✅

**API**: Groq Whisper Large v3 (verified working)

```text
🤖 *BOT_404_V3*
────────────────

🎙️ *VOICE TRANSCRIPTION*

📝 *Audio Transcript*:

"Hey everyone, the meeting has been moved to 3 PM today."

────────────────
Powered by V3-ARCHITECTURE
```

---

## 9. Tools Commands ✅

### Weather (`.weather London`):
**API**: Falls back to wttr.in (verified working)
```text
🤖 *BOT_404_V3*
────────────────

🌤️ *WEATHER FORECAST*

🌤️ *Weather*: London: ⛅ +17°C

────────────────
Powered by V3-ARCHITECTURE
```

### URL Shortener (`.shorten <url>`):
**API**: Falls back to TinyURL (verified working)
```text
🤖 *BOT_404_V3*
────────────────

✂️ *URL SHORTENER*

🔗 *Shortened URL*:
https://tinyurl.com/mbq3m

────────────────
Powered by V3-ARCHITECTURE
```

### Calculator (`.calc 25 * 4 + 10`):
**Depends on**: Local computation only — **always works**
```text
🤖 *BOT_404_V3*
────────────────

🧮 *CALCULATOR*

🧮 *Expression*: `25 * 4 + 10`
📊 *Result*: *110*

────────────────
Powered by V3-ARCHITECTURE
```

### Lyrics (`.lyrics Starboy`):
**API**: Falls back to LRCLIB (verified working)
```text
🤖 *BOT_404_V3*
────────────────

📜 *LYRICS FINDER*

📜 *Starboy* - Starboy

I'm tryna put you in the worst mood, ah
P1 cleaner than your church shoes, ah
Milli point two just to hurt you, ah
...

────────────────
Powered by V3-ARCHITECTURE
```

---

## 10. Group Administration Commands ✅

All group commands use **Baileys native group APIs** — no external APIs needed.

### Tag All (`.tagall Project Update`):
```text
🤖 *BOT_404_V3*
────────────────

📢 *TAG ALL*

📢 *ATTENTION EVERYONE*

💬 *Message*: Project Update

• @923001111111
• @923002222222
• @923003333333
...

────────────────
Powered by V3-ARCHITECTURE
```

### Hide Tag (`.hidetag Server maintenance tonight`):
```text
🤖 *BOT_404_V3*
────────────────

📢 *ANNOUNCEMENT*

Server maintenance tonight

────────────────
Powered by V3-ARCHITECTURE
```

### Kick (`.kick` — reply to message):
```text
🤖 *BOT_404_V3*
────────────────

✅ Member @923001234567 has been removed from the group.

────────────────
Powered by V3-ARCHITECTURE
```

### Promote / Demote:
```text
👑 @923001234567 has been promoted to group administrator.
📉 @923001234567 has been demoted to regular member.
```

### Mute / Unmute:
```text
🔒 *Group Muted* — Only group administrators can send messages now.
🔓 *Group Unmuted* — All members can now send messages.
```

### Group Link / Revoke:
```text
🔗 *Group Invite Link*:
https://chat.whatsapp.com/AbC123XyZ

🔄 *Invite Link Revoked* — New Link: https://chat.whatsapp.com/NeW456
```

### Group Status (`.groupstatus`):
```text
🤖 *BOT_404_V3*
────────────────

📊 *GROUP STATUS*

• *Group Name*: Project Collaborators
• *Group ID*: 123456789@g.us
• *Created*: 5/12/2025
• *Total Members*: 24
• *Administrators*: 3
• *Announce Only*: No
• *Restrict Settings*: No

────────────────
Powered by V3-ARCHITECTURE
```

---

## 11. Interactive Games & Player Profiles ✅

All games use **local logic + MariaDB** for scoring — no external API needed (except OpenTDB for quiz questions which is verified working).

### Trivia Quiz (`.quiz`):
**API**: OpenTDB (verified working) with curated local fallback
```text
🤖 *BOT_404_V3*
────────────────

🧠 *TRIVIA QUIZ*

🧠 *TRIVIA QUIZ CHALLENGE*

❓ *Question*: How many states are in Australia?

*A*) 7
*B*) 8
*C*) 6
*D*) 5

⏱️ _You have 60 seconds to answer._
👉 Reply with *.answer <letter>* (e.g. *.answer A*)

────────────────
Powered by V3-ARCHITECTURE
```

### Quiz Answer (`.answer C`):
```text
🤖 *BOT_404_V3*
────────────────

🎉 *QUIZ RESULT*

🎉 *CORRECT!*

Option *C* was the right answer!
➕ *+10 Points* awarded!
🏆 Total Score: *145 pts* (⚔️ Veteran)

Great job, @923192342358!

────────────────
Powered by V3-ARCHITECTURE
```

### Tic-Tac-Toe (`.tictactoe` or `.ttt`):
```text
🤖 *BOT_404_V3*
────────────────

🎮 *TIC-TAC-TOE MATCH STARTED*

❌ *Player X*: @923192342358
⭕ *Player O*: 🤖 Bot

┌───┬───┬───┐
│ 1️⃣ │ 2️⃣ │ 3️⃣ │
├───┼───┼───┤
│ 4️⃣ │ 5️⃣ │ 6️⃣ │
├───┼───┼───┤
│ 7️⃣ │ 8️⃣ │ 9️⃣ │
└───┴───┴───┘

👉 Player X starts! Make a move: *.ttt <1-9>*

────────────────
Powered by V3-ARCHITECTURE
```

### Rock Paper Scissors (`.rps rock`):
```text
🤖 *BOT_404_V3*
────────────────

🎮 *ROCK PAPER SCISSORS*

🎉 *You Won!*
• You: 🪨 Rock
• Bot: ✂️ Scissors
➕ *+5 Points*

📊 Total Score: *150 pts* (⚔️ Veteran)

────────────────
Powered by V3-ARCHITECTURE
```

### Dice Roll (`.roll`):
```text
🤖 *BOT_404_V3*
────────────────

🎲 *DICE ROLL*

🎲 *Dice Roll*: ⚃ (4)

────────────────
Powered by V3-ARCHITECTURE
```

### Coin Flip (`.flip`):
```text
🤖 *BOT_404_V3*
────────────────

🪙 *COIN FLIP*

🪙 *Coin Flip*: *HEADS*!

────────────────
Powered by V3-ARCHITECTURE
```

### Hack Simulation (`.hack @user`):
```text
💻 *[HACK INITIALIZED]* Targeting: *@923001234567*
🔍 Probing open ports (SSH:22, HTTP:80, DB:3306)...
💉 Injecting buffer overflow exploit: `0x404_V3_ROOT`...
🔓 Firewall bypassed. Decrypting WhatsApp chat database...
📦 Downloading 2.4 GB media & chat archives...
📱 Injecting persistent RAT backdoor into kernel...

🤖 *BOT_404_V3*
────────────────

✅ *HACK COMPLETE!*

Target *@923001234567* successfully compromised.
_All data forwarded to command center._

────────────────
Powered by V3-ARCHITECTURE
```

### Player Profile (`.profile`):
```text
🤖 *BOT_404_V3*
────────────────

🎮 *PLAYER GAME PROFILE*

👤 *Player*: @923192342358
🎖️ *Rank*: ⚔️ Veteran
⭐ *Total Score*: 145 XP

📊 *Performance Record*:
• Total Games: 12
• 🏆 Wins: 9
• 💀 Losses: 2
• 🤝 Draws: 1
• 📈 Win Rate: 75%

💡 _Play .quiz, .ttt, or .rps to level up!_

────────────────
Powered by V3-ARCHITECTURE
```

### Game History (`.gamehistory`):
```text
🤖 *BOT_404_V3*
────────────────

📜 *MATCH HISTORY*

👤 *Player*: @923192342358

*1. QUIZ* (🏆 WIN)
   • Vs: Solo | Pts: +10
   • Date: 9/21/2026

*2. TICTACTOE* (🏆 WIN)
   • Vs: @923001234567 | Pts: +15
   • Date: 9/21/2026

*3. RPS* (🤝 DRAW)
   • Vs: 🤖 Bot | Pts: +2
   • Date: 9/21/2026

────────────────
Powered by V3-ARCHITECTURE
```

### Leaderboard (`.leaderboard`):
```text
🤖 *BOT_404_V3*
────────────────

🏆 *GLOBAL LEADERBOARD*

🏆 *TOP 10 PLAYERS*:

🥇 @923192342358
   • Score: *520 pts* | Wins: *34* (82%)

🥈 @923001112233
   • Score: *310 pts* | Wins: *20* (71%)

🥉 @923129876543
   • Score: *195 pts* | Wins: *14* (66%)

────────────────
Powered by V3-ARCHITECTURE
```

### Games Menu (`.games`):
```text
🤖 *BOT_404_V3*
────────────────

🎮 *GAMES*

🎮 *INTERACTIVE GAMING SUITE*

• *.quiz* (or *.trivia*) — Trivia challenge with score rewards
• *.tictactoe* (or *.ttt*) — Play Tic-Tac-Toe vs Bot or friend
• *.rps <rock/paper/scissors>* — Rock Paper Scissors match
• *.roll* — Roll a 6-sided dice
• *.flip* — Flip a coin (Heads/Tails)
• *.hack [target]* — Terminal hacking prank simulation
• *.profile [@user]* — View XP, score, and rank
• *.gamehistory [@user]* — View recent match history
• *.leaderboard* — Global player rankings

_Earn XP and climb the leaderboard!_

────────────────
Powered by V3-ARCHITECTURE
```

---

## 12. Priority Alert System ✅

**Depends on**: Local IntentEngine keyword matching — **always works**

### When someone mentions "Rutaab" in a group (sent to owner):
```text
🤖 *BOT_404_V3*
────────────────

🚨 *PRIORITY ALERT*

👤 *Sender*: Ali (+923001122334)
📍 *Chat*: Project Collaborators [Group]
⚠️ *Trigger*: "rutaab"
⏰ *Time*: 15:22:10

💬 *Message*:
"Rutaab please check the server files urgently!"

────────────────
Powered by V3-ARCHITECTURE
```

---

## 13. Error & Unknown Command Output ✅

### Unknown command with fuzzy suggestion:
```text
🤖 *BOT_404_V3*
────────────────

❌ *COMMAND NOT FOUND*

❌ *Unknown command*: .pley

💡 *Did you mean?*
• *.play* — _Search and stream high-fidelity 320kbps MP3 music_

📋 *Quick Command Directory*:
• *.menu* — View all available commands
• *.games* — Play interactive games
• *.play <song>* — Stream 320kbps music
• *.alldl <url>* — Universal video downloader
• Tag *@bot <question>* — Chat with AI assistant

_Type *.menu* for the complete list._

────────────────
Powered by V3-ARCHITECTURE
```

### Permission Denied:
```text
🤖 *BOT_404_V3*
────────────────

❌ *PERMISSION DENIED*

Access Denied

This command (*.stats*) is strictly restricted to the bot owner.

────────────────
Powered by V3-ARCHITECTURE
```

---

## 14. Rate Limiting ✅

### When a user sends commands too fast:
```text
⏳ *Rate Limit Exceeded*: Please wait 8s before sending more commands.
```

### Daily AI Limit:
```text
🤖 *BOT_404_V3*
────────────────

⚠️ *DAILY AI LIMIT*

⚠️ *Daily Limit Reached*

You have reached your daily limit of *15* @bot questions.
Your limit will automatically reset at *12:00 AM (midnight)*.

💡 You can still use commands like *.menu*, *.games*, *.search*, or *.play*!

────────────────
Powered by V3-ARCHITECTURE
```
