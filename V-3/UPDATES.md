# WHATSAPP_BOT_404_V3 Updates & Changelog

**Architect & Owner**: Rutaab (`923192342358@s.whatsapp.net`)  
**Version**: 3.1.0  
**Build Status**: ✅ TypeScript Passed | ✅ 16/16 Unit & Integration Tests Passed  

---

## 1. Silent Voice Note Transcription & Priority Alert Engine
* **Silent Background Transcription**:
  - All incoming voice notes (`audioMessage` with `ptt: true`) are now processed in the background using Groq Whisper (`whisper-large-v3-turbo` / fallback keys).
  - The voice note is transcribed and stored into the MariaDB database (`bot_messages.text_body`) linked to the message ID.
  - **Zero Chat Clutter**: The transcription is **NOT** sent to the chat unless someone explicitly replies with `.transcribe`.
* **Zero-Latency `.transcribe` Command**:
  - When a user replies to an audio message with `.transcribe`, the bot queries MariaDB first. If the transcript is already in the database, it replies in **0ms** without re-calling the Whisper API.
* **Urgent Keyword & Owner Alert Trigger**:
  - The silent transcript is automatically analyzed against the `urgentKeywords` dictionary (`urgent`, `emergency`, `help`, `danger`, `hospital`, `accident`, `asap`, `police`, `fire`, `critical`, etc.) and detects mentions of "Rutaab".
  - If an urgent trigger is detected, the bot sends an instant priority alert message directly to **Rutaab's DM** with the sender's details and the transcribed text.

---

## 2. WhatsApp Status Stories (`.story` / `status@broadcast`)
* **Commands**: `.story <text>` or reply to media with `.story [caption]`
  - **Aliases**: `.poststatus`, `.statuspost`, `.setstatus`, `.upstatus`.
  - **Permission**: Owner Only (`Rutaab`).
* **Supported Media & Formats**:
  - **Photo Story**: Reply to an image with `.story [caption]`.
  - **Video Story**: Reply to a video with `.story [caption]`.
  - **Voice Story**: Reply to an audio note with `.story`.
  - **Text Story**: Send `.story <your message>`. Automatically applies dynamic high-contrast WhatsApp status colors (WhatsApp Green `#25D366`, Deep Indigo `#3F51B5`, Purple `#673AB7`, Coral `#FF5722`, etc.).
* **Audience Syncing**:
  - Automatically queries MariaDB (`getBroadcastRecipients()`) to populate `statusJidList`. Baileys broadcasts only reach contacts included in `statusJidList`.

---

## 3. Image Generation Suite (`.image`) & Natural Language Intent
* **Command**: `.image <prompt>`
  - Generates high-definition (1024x1024) images via Pollinations AI.
  - No external API key required.
* **Natural Language Intent Matching**:
  - Queries like *"i want generate image"*, *"create an image of a cybernetic cat"*, *"draw a futuristic city"*, or *"imagine..."* are recognized by the IntentEngine and routed directly to image generation or guided instructions.

---

## 4. Loopback Protection & Groq 429 Rate-Limit Shield
* **Self-Response Elimination**:
  - The bot tracks outbound message IDs (`botSentMessageIds`) and checks for its signature `Powered by V3-ARCHITECTURE`.
  - Even if Baileys receives echoed `messages.upsert` with `isFromMe = true`, the bot ignores its own messages, completely preventing infinite response loops and 429 rate limit spikes.
* **Smart Chat Debouncer**:
  - Rapid repeated incoming identical messages within 2.5 seconds are debounced to ensure thread stability and avoid duplicate responses.
