# Voice Note Pipeline & Silent Urgent Detection Specification

## 1. Overview & Objective
Instead of posting transcriptions into the chat or remaining completely deaf to audio contents, incoming WhatsApp voice messages (PTT & audio) will be processed through a **Silent Intelligence Pipeline**:
1. **Silent Background Transcription**: Transcribe incoming audio via Groq Whisper Large v3 behind the scenes.
2. **Database Persistence**: Save the transcript directly into the MariaDB `bot_messages` record (`text_body`).
3. **Zero Chat Noise**: Do NOT output the transcription in the chat. The chat remains completely undisturbed.
4. **Urgent Word Detection on Audio**: Run the transcript through the `urgentKeywords` array and owner mention filters. If an urgent trigger is detected inside the voice note, send an instant priority alert directly to Rutaab's DM.
5. **Instant On-Demand Retrieval**: When a user replies to the voice note with `.transcribe` (or `.stt`), the bot serves the stored transcript instantly without waiting or re-calling Whisper.

---

## 2. Technical Architecture & Flow

```
Incoming Voice Note (PTT / Audio)
       │
       ▼
Universal Media Tap (data/media/voice_*.ogg)
       │
       ▼
Groq Whisper Large v3 (Dedicated Voice API Key)
       │
       ├──► Save Transcript to MariaDB (bot_messages.text_body)
       │    [Chat remains completely SILENT — no reply sent]
       │
       ▼
Check Urgent Keywords & Rutaab Mentions on Audio Transcript:
  ['emergency', 'urgent', 'asap', 'important', 'call owner', 'contact rutaab', ...]
       │
       ├──► [MATCH FOUND?]
       │         │
       │         ├──► YES ──► 🚨 Send Instant Priority Notification to Rutaab's DM:
       │         │            "🚨 PRIORITY VOICE NOTE ALERT
       │         │             👤 From: @sender (Group: XYZ)
       │         │             ⚠️ Keyword Detected: 'emergency'
       │         │             🎙️ Audio Transcript: 'Please call me asap it is an emergency'
       │         │             ⏰ Time: 18:55"
       │         │
       │         └──► NO  ──► Stay completely silent.
       │
       ▼
On-Demand Retrieval (User replies with .transcribe):
  - Fetches cached transcript from MariaDB in < 5ms.
  - Sends formatted transcription to chat.
```

---

## 3. Database Schema Alignment

In `bot_messages`:
* `message_type`: `'audio'` / `'audioMessage'`
* `text_body`: Stores the full transcribed text from Whisper.
* `media_path`: Stores the local audio file path (`voice_<id>.ogg`).
* `has_media`: `1`.

When `.transcribe` is triggered:
```sql
SELECT text_body FROM bot_messages WHERE message_id = ?;
```
If `text_body` already exists, return it immediately (0 API latency, 0 token usage). If missing, call Whisper and update `text_body`.

---

## 4. Priority Alert Format to Rutaab's DM

When an urgent keyword is spoken in a voice message, Rutaab receives:

```text
🚨 *PRIORITY ALERT: URGENT VOICE NOTE DETECTED*

👤 *Sender*: +92 3XX XXXXXXX (Name: John)
📍 *Chat*: Project Alpha [Group]
⚠️ *Urgent Keyword*: "emergency"
⏰ *Timestamp*: 6:55:12 PM

🎙️ *Spoken Audio Transcript*:
"Rutaab please check this immediately, the server is down and we have an emergency."

_Powered by V3-ARCHITECTURE_
```

---

## 5. Benefits

1. **Zero Chat Spam**: Group chats and DMs aren't cluttered with automatic transcription messages.
2. **Total Forensic Audio Search**: Voice notes can now be searched by text in MariaDB and the operations dashboard (`http://127.0.0.1:8788`).
3. **Audio-Level Threat & Urgency Monitoring**: Rutaab never misses an urgent audio message even when working or muted in busy groups.
4. **Groq Token Efficiency**: Pre-transcribes once; instant reply on `.transcribe` with zero extra API calls.
