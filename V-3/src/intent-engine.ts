import { formatMessage } from './format.js';

export interface ParsedIntent {
  intent: 'download' | 'sticker' | 'play' | 'search' | 'transcribe' | 'guide' | 'image' | null;
  query?: string;
  url?: string;
  confidence: number;
}

export interface PriorityAlert {
  type: 'mention' | 'urgent';
  keyword: string;
  senderJid: string;
  senderName?: string;
  groupJid?: string;
  groupSubject?: string;
  messageText: string;
  timestamp: Date;
}

export class IntentEngine {
  private ownerName: string;
  private urgentKeywords: string[] = [
    'emergency',
    'urgent',
    'asap',
    'important',
    'call owner',
    'contact rutaab',
    'contact owner',
    'help needed'
  ];

  constructor(ownerName: string = process.env.OWNER_NAME || 'Rutaab') {
    this.ownerName = ownerName.toLowerCase();
  }

  // --- Parse Zero-Prefix Natural Intent ---
  public parseIntent(text: string, hasQuotedMedia: boolean = false): ParsedIntent {
    const clean = text.trim();
    const lower = clean.toLowerCase();

    // 0. Question / How-To / Guide intent (e.g. "how to download video", "do you have games to play", "i want generate image")
    const isQuestionWord =
      lower.startsWith('how ') ||
      lower.startsWith('what ') ||
      lower.startsWith('who ') ||
      lower.startsWith('why ') ||
      lower.startsWith('where ') ||
      lower.startsWith('which ') ||
      lower.startsWith('do you ') ||
      lower.startsWith('can you ') ||
      lower.startsWith('can i ') ||
      lower.startsWith('could you ') ||
      lower.startsWith('would you ') ||
      lower.startsWith('is there ') ||
      lower.startsWith('are there ') ||
      lower.startsWith('have you ') ||
      lower.startsWith('tell me ') ||
      lower.startsWith('explain ') ||
      lower.startsWith('i want ') ||
      lower.startsWith('i want to ') ||
      lower.startsWith('i need ') ||
      lower.startsWith('i need to ') ||
      lower.startsWith('show me ') ||
      lower.startsWith('give me ');

    const isGameQuery =
      lower.includes('game') ||
      lower.includes('games') ||
      lower.includes('trivia') ||
      lower.includes('tictactoe') ||
      lower.includes('leaderboard') ||
      lower.includes('play with me');

    const isImageQuery =
      lower.includes('generate image') ||
      lower.includes('create image') ||
      lower.includes('make image') ||
      lower.includes('draw image') ||
      lower === 'image' ||
      lower === 'imagine';

    // Zero-prefix image generation with prompt (e.g. "create an image of a cybernetic tiger", "draw a sunset")
    const imageMatch = clean.match(/^(?:create(?:\s+an)?\s+image(?:\s+of)?|generate(?:\s+an)?\s+image(?:\s+of)?|make(?:\s+an)?\s+image(?:\s+of)?|draw(?:\s+me)?|paint(?:\s+me)?|imagine)\s+(.+)$/i);
    if (imageMatch && imageMatch[1] && imageMatch[1].trim().length > 2) {
      return { intent: 'image', query: imageMatch[1].trim(), confidence: 0.95 };
    }

    if (
      isQuestionWord ||
      isGameQuery ||
      isImageQuery ||
      lower.endsWith('?') ||
      lower === 'help' ||
      lower === 'help me' ||
      lower === 'commands' ||
      lower === 'menu'
    ) {
      // Don't intercept explicit .commands
      if (!clean.startsWith('.')) {
        return { intent: 'guide', query: clean, confidence: 0.95 };
      }
    }

    // 1. Sticker intent
    if (
      lower === 'make sticker' ||
      lower === 'sticker' ||
      lower === 'sticker this' ||
      lower.startsWith('make a sticker') ||
      lower.startsWith('convert to sticker') ||
      lower.includes('turn this into a sticker')
    ) {
      return { intent: 'sticker', confidence: 0.95 };
    }

    // 2. Play / Music intent (excludes games)
    const playMatch = clean.match(/^(?:play|sing|listen to|stream)\s+(.+)$/i);
    if (playMatch && playMatch[1] && !playMatch[1].toLowerCase().startsWith('game')) {
      return { intent: 'play', query: playMatch[1].trim(), confidence: 0.9 };
    }

    // 3. Search intent
    const searchMatch = clean.match(/^(?:search for|search|google|find info on)\s+(.+)$/i);
    if (searchMatch && searchMatch[1]) {
      return { intent: 'search', query: searchMatch[1].trim(), confidence: 0.9 };
    }

    // 4. Download intent
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const urlMatch = clean.match(urlRegex);

    if (
      lower.startsWith('download') ||
      lower.startsWith('save this') ||
      lower.includes('download this') ||
      lower.includes('get video')
    ) {
      if (urlMatch) {
        return { intent: 'download', url: urlMatch[0], confidence: 0.95 };
      }
      if (hasQuotedMedia) {
        return { intent: 'download', confidence: 0.85 };
      }
    }

    // Direct URL sent without command
    if (urlMatch && clean === urlMatch[0]) {
      // If user posts a direct TikTok/Instagram/YouTube/Facebook link
      const u = urlMatch[0].toLowerCase();
      if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('instagram.com') || u.includes('tiktok.com') || u.includes('facebook.com')) {
        return { intent: 'download', url: urlMatch[0], confidence: 0.8 };
      }
    }

    // 5. Transcribe intent
    if (
      lower === 'transcribe' ||
      lower === 'voice to text' ||
      lower === 'what did it say' ||
      lower === 'read voice note'
    ) {
      return { intent: 'transcribe', confidence: 0.9 };
    }

    return { intent: null, confidence: 0 };
  }

  // --- Rutaab Mention & Priority Keyword Filter ---
  public checkPriorityAlert(
    text: string,
    senderJid: string,
    senderName?: string,
    groupJid?: string,
    groupSubject?: string
  ): PriorityAlert | null {
    const lower = text.toLowerCase();

    // Check direct mention of Rutaab
    if (lower.includes(this.ownerName)) {
      return {
        type: 'mention',
        keyword: this.ownerName,
        senderJid,
        senderName,
        groupJid,
        groupSubject,
        messageText: text,
        timestamp: new Date()
      };
    }

    // Check urgent triggers
    for (const kw of this.urgentKeywords) {
      if (lower.includes(kw)) {
        return {
          type: 'urgent',
          keyword: kw,
          senderJid,
          senderName,
          groupJid,
          groupSubject,
          messageText: text,
          timestamp: new Date()
        };
      }
    }

    return null;
  }

  public formatPriorityNotification(alert: PriorityAlert): string {
    const isGroup = !!alert.groupJid;
    const origin = isGroup ? `Group: *${alert.groupSubject || 'Private Group'}*` : 'Direct Message';
    const tag = alert.type === 'mention' ? 'MENTION ALERT' : 'PRIORITY ALERT';

    const body =
      `👤 *From*: ${alert.senderName || alert.senderJid.split('@')[0]}\n` +
      `📍 *Origin*: ${origin}\n` +
      `🎯 *Trigger*: "${alert.keyword}"\n` +
      `⏰ *Time*: ${alert.timestamp.toLocaleTimeString()}\n\n` +
      `💬 *Message Content*:\n"${alert.messageText}"`;

    return formatMessage(body, tag);
  }
}
