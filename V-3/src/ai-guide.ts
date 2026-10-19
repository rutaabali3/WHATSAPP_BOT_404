import axios from 'axios';
import { MessageRepository } from './db.js';

export class AiGuide {

  private static readonly SYSTEM_PROMPT = `
You are the official AI Guide for "WHATSAPP_BOT_404_V3", built by and dedicated to Rutaab.
Your role is to guide users on how to use the bot, its commands, features, and capabilities.

CRITICAL RULES:
1. Always be concise, helpful, and friendly.
2. The bot owner and creator is Rutaab.
3. Complete Feature Catalog (from COMMANDS.md):
   - 🤖 AI Assistant:
     • Tag *@bot <question>*: Ask the AI assistant questions or get guidance (15 questions per user per day).
   - 🎨 AI Image Generation:
     • .image <prompt> (or .imagine): Generate high-resolution AI images from any prompt (e.g. .image cybernetic tiger in neon city).
   - 🎮 Interactive Gaming & Scoring Suite (User ID persistent):
     • .games (or .game): View available games.
     • .quiz / .trivia: Multi-category trivia quiz with scoring.
     • .tictactoe / .ttt: Play Tic-Tac-Toe against the bot or a friend.
     • .rps <rock/paper/scissors>: Rock Paper Scissors challenge.
     • .roll: Roll a 6-sided dice.
     • .flip: Flip a coin (Heads/Tails).
     • .hack <user>: Terminal prank hacking simulation.
     • .profile: View user ID persistent game stats, win rate, and score.
     • .gamehistory: View recent match history.
     • .leaderboard: Global top player rankings.
   - 🛡️ Forensic Protection:
     • Anti-Edit (.antiedit) & Anti-Delete (.antidelete) which alerts Rutaab of deleted or edited messages.
   - 🔍 Search & Tools:
     • SearXNG web search (.search <query>) returning top 10 results.
     • .weather <city>, .shorten <url>, .calc <math>.
   - 🎵 High-fidelity music suite (.play, .song with 320kbps MP3s), .lyrics, .movie, .trailer.
   - 📥 Multi-platform media downloader (.alldl, .yt, .fb, .ig, .tt) with multi-engine fallback.
   - 🎙️ Speech-to-Text with Groq Whisper (.transcribe replying to voice notes).
   - 🖼️ Sticker Generator (.sticker or .s replying to image/video) with custom author branding (Rutaab / BOT_404).
   - 💻 Interactive local web dashboard at http://127.0.0.1:8788.
4. Permission structure:
   - [OWNER ONLY]: .status, .antidelete, .antiedit, .antistatus, .autostatus, .bot
   - [OWNER / PRIVATE ONLY]: Group management (.kick, .promote, .demote, .mute, .unmute, .tagall, etc. Best used by replying to the target's message).
   - [PUBLIC]: All downloaders, games, AI image generation (.image), search, music, stickers, media tools, @bot AI chat, and general utilities.
5. NEVER reveal internal backend infrastructure URLs (like ahm7xmakki.com).
6. Format answers neatly with WhatsApp markdown (bold *text*, italic _text_).
`;

  private groqChatKey: string;
  private groqFallbackKey: string;
  private botName: string;
  private ownerName: string;

  private static readonly GROQ_CHAT_MODELS = [
    'openai/gpt-oss-120b',
    'groq/compound',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b'
  ];

  constructor(
    private db: MessageRepository,
    groqChatKey: string = process.env.GROQ_API_KEY_CHAT || process.env.GROQ_API_KEY || '',
    ownerName: string = process.env.OWNER_NAME || 'Rutaab',
    botName: string = process.env.BOT_NAME || 'BOT_404_V3',
    groqFallbackKey: string = process.env.GROQ_API_KEY_VOICE || ''
  ) {
    this.groqChatKey = groqChatKey;
    this.groqFallbackKey = groqFallbackKey;
    this.ownerName = ownerName;
    this.botName = botName;
  }

  public async answer(jid: string, senderJid: string, userQuery: string): Promise<string> {
    const start = Date.now();
    let replyText = '';
    let tokensUsed = 0;

    const keysToTry = [this.groqChatKey, this.groqFallbackKey].filter(Boolean);

    keyLoop: for (const key of keysToTry) {
      for (const model of AiGuide.GROQ_CHAT_MODELS) {
        try {
          const res = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model,
              messages: [
                { role: 'system', content: AiGuide.SYSTEM_PROMPT },
                { role: 'user', content: userQuery }
              ],
              temperature: 0.5,
              max_tokens: 500
            },
            {
              headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );

          if (res.data?.choices?.[0]?.message?.content) {
            replyText = res.data.choices[0].message.content.trim();
            tokensUsed = res.data.usage?.total_tokens || 0;
            break keyLoop;
          }
        } catch (err: any) {
          console.warn(`[AiGuide] Groq LLM failed (${model} / ...${key.slice(-6)}): ${err.message}. Trying next model/key.`);
        }
      }
    }

    // Fallback to offline rule-based knowledge engine
    if (!replyText) {
      replyText = this.localFallbackAnswer(userQuery);
    }

    // Log interaction to DB
    try {
      await this.db.logAiInteraction(
        jid,
        senderJid,
        userQuery,
        replyText,
        Date.now() - start,
        tokensUsed
      );
    } catch (logErr) {
      console.error('[AiGuide] Failed to log AI interaction:', logErr);
    }

    return replyText;
  }

  private localFallbackAnswer(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('owner') || q.includes('who made') || q.includes('creator')) {
      return `👑 *Bot Ownership & Creator*\n\nThis system was architected and built by *${this.ownerName}*.\nAll administrative commands and audit telemetry are restricted to the owner.`;
    }

    if (q.includes('game') || q.includes('quiz') || q.includes('trivia') || q.includes('tictactoe') || q.includes('ttt') || q.includes('rps')) {
      return `🎮 *Interactive Gaming Suite*\n\nYes! We have full persistent gaming features:\n• *.quiz* (or *.trivia*): Interactive trivia challenge.\n• *.tictactoe* (or *.ttt*): Play Tic-Tac-Toe vs bot or friend.\n• *.rps <rock/paper/scissors>*: Rock Paper Scissors challenge.\n• *.roll*: Roll a 6-sided dice.\n• *.flip*: Flip a coin (Heads/Tails).\n• *.profile*: View personal game stats, win rate & rank.\n• *.gamehistory*: View your recent match history.\n• *.leaderboard*: Global player rankings.`;
    }

    if (q.includes('image') || q.includes('imagine') || q.includes('draw') || q.includes('photo') || q.includes('picture')) {
      return `🎨 *AI Image Generator*\n\nGenerate AI images easily using:\n• *.image <prompt>*: Generates high-resolution images from text.\n\n_Example: .image a futuristic cybernetic tiger in neon cyberpunk city_\n_Or say: "create an image of a red sports car"_`;
    }

    if (q.includes('download') || q.includes('youtube') || q.includes('video') || q.includes('insta') || q.includes('tiktok')) {
      return `📥 *Media Download Capabilities*\n\n• *.alldl <url>*: Universal media downloader with multi-engine auto-failover.\n• *.yt <url>*: Download YouTube videos in 720p.\n• *.play <song>*: Instant 320kbps music.\n• *.tiktok <url>*: Clean TikTok videos.\n• *.ig <url>*: Instagram Reels/Posts.`;
    }

    if (q.includes('sticker') || q.includes('s ') || q.includes('make sticker')) {
      return `🖼️ *Sticker Generation*\n\nReply to any image or video with *.sticker* (or *.s*) to convert it into a WebP sticker with custom EXIF author branding (*${this.ownerName}*).`;
    }

    if (q.includes('antidelete') || q.includes('antiedit') || q.includes('delete') || q.includes('edit')) {
      return `🛡️ *Forensic Message Protection*\n\n• *.antidelete [on/off]*: Recovers revoked text and media.\n• *.antiedit [on/off]*: Intercepts edited messages and shows diff against original.\n\n_Note: These tools are strictly *[OWNER ONLY]*._`;
    }

    if (q.includes('search') || q.includes('google') || q.includes('find')) {
      return `🔍 *Multi-Engine Web Search*\n\nUse *.search <query>* to get top 10 search results via rotating SearXNG instances with zero local memory overhead.`;
    }

    if (q.includes('music') || q.includes('song') || q.includes('play song') || q.includes('play music') || q.startsWith('play ')) {
      return `🎵 *Music Suite*\n\n• *.play <song name>*: Streams 320kbps MP3 audio directly.\n• *.lyrics <song title>*: Fetches lyrics.\n• *.movie <title>*: Full movie info & rating.\n• *.trailer <title>*: Official trailer link.`;
    }

    if (q.includes('group') || q.includes('kick') || q.includes('admin') || q.includes('tag')) {
      return `👥 *Group Management Commands*\n\n• *.kick*: Remove member (reply to their message).\n• *.promote* / *.demote*: Change admin role (reply to message).\n• *.mute* / *.unmute*: Toggle group chat privileges.\n• *.tagall* / *.hidetag*: Mention all group members.\n\n_Note: Group commands are restricted to [OWNER / PRIVATE ONLY]._`;
    }

    return `🤖 *${this.botName} Guide*\n\nI am your intelligent assistant. You can:\n• Send *.menu* to view all commands formatted for mobile.\n• Ask me anything about bot features, games, or commands.\n• Try zero-prefix commands like "download this video", "make a sticker", or "do you have games?".`;
  }
}
