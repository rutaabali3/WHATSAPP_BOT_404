export const BOT_NAME = process.env.BOT_NAME || 'BOT_404_V3';
export const OWNER_NAME = process.env.OWNER_NAME || 'Rutaab';
export const POWERED_BY = process.env.POWERED_BY || 'Powered by V3-ARCHITECTURE';

const DIVIDER = '────────────────';

/**
 * Universal response formatter for WhatsApp Bot 404.
 *
 * Style:
 * 🤖 *BOT_404_V3* • TITLE
 * ────────────────
 *
 * [Message content here]
 *
 * ────────────────
 * Powered by V3-ARCHITECTURE
 */
export function formatMessage(content: string, title?: string): string {
  const headerTitle = title ? ` • ${title}` : '';
  const header = `🤖 *${BOT_NAME}*${headerTitle}\n${DIVIDER}`;
  const footer = `${DIVIDER}\n${POWERED_BY}`;

  return `${header}\n\n${content.trim()}\n\n${footer}`;
}

/**
 * Universal error formatter.
 */
export function formatError(message: string, title = 'ERROR'): string {
  const header = `⚠️ *${BOT_NAME}* • ${title}\n${DIVIDER}`;
  const footer = `${DIVIDER}\n${POWERED_BY}`;

  return `${header}\n\n❌ ${message.trim()}\n\n${footer}`;
}

/**
 * Formats a custom alert or warning.
 */
export function formatAlert(message: string, alertType = 'NOTICE', emoji = '🔔'): string {
  const header = `${emoji} *${BOT_NAME}* • ${alertType}\n${DIVIDER}`;
  const footer = `${DIVIDER}\n${POWERED_BY}`;

  return `${header}\n\n${message.trim()}\n\n${footer}`;
}

/**
 * Converts standard Latin characters into Mathematical Sans-Serif Italic Unicode.
 * e.g. "Powered by BOT" -> "𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺 𝘉𝘖𝘛"
 */
export function toFancyItalic(str: string): string {
  return str
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d608 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d622 + (code - 97));
      return c;
    })
    .join('');
}

/**
 * Universal Welcome Card for community/group join events.
 */
export function formatWelcomeCard(groupName: string, userMentions: string): string {
  const title = (groupName || `${BOT_NAME} COMMUNITY`).trim().toUpperCase();
  const styledFooter = toFancyItalic(`Powered by ${BOT_NAME}`);

  return [
    `┌── ⚡ WELCOME TO ${title} ──┐`,
    `│`,
    `│ 👋 Welcome ${userMentions}!`,
    `│ Welcome to the home of high-speed WhatsApp AI automation.`,
    `│`,
    `│ 🛡️ Community Perks & Alerts:`,
    `│ • ⚡ Uptime & Server Alerts: Real-time notices when servers update or reboot.`,
    `│ • 🛡️ Anti-Ban Shield: WhatsApp safety advice to keep your accounts secure.`,
    `│ • 🚀 New Features & Drops: First access to new AI commands & tools.`,
    `│ • 🎁 Free Giveaways & VIP Perks: Priority bandwidth & community rewards.`,
    `│`,
    `│ ⚠️ CRITICAL NOTICE:`,
    `│ If the chat gets too active, MUTE the notifications — please DO NOT LEAVE!`,
    `│`,
    `└── ◦ ${styledFooter} ◦ ──┘`
  ].join('\n');
}

