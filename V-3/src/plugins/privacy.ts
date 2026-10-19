import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { PluginCommand, PluginContext } from '../plugin.js';
import { formatMessage, formatError, OWNER_NAME, BOT_NAME } from '../format.js';

function unwrapMessage(m: any): any {
  let actual = m;
  while (
    actual?.ephemeralMessage?.message ||
    actual?.viewOnceMessage?.message ||
    actual?.viewOnceMessageV2?.message ||
    actual?.viewOnceMessageV2Extension?.message ||
    actual?.documentWithCaptionMessage?.message
  ) {
    actual =
      actual.ephemeralMessage?.message ||
      actual.viewOnceMessage?.message ||
      actual.viewOnceMessageV2?.message ||
      actual.viewOnceMessageV2Extension?.message ||
      actual.documentWithCaptionMessage?.message;
  }
  return actual;
}

async function postStatusStory(
  ctx: PluginContext,
  targetMsg: any,
  m: any,
  textArg: string
): Promise<void> {
  const isImage = !!m?.imageMessage;
  const isVideo = !!m?.videoMessage;
  const isAudio = !!m?.audioMessage;

  if (!isImage && !isVideo && !isAudio && !textArg) {
    await ctx.reply(
      formatMessage(
        `📢 *WhatsApp Status Story Publisher*\n\n` +
        `• *Photo/Video*: Reply to any picture or video with *.story [caption]*\n` +
        `• *Text Story*: Type *.story <your text message>*\n\n` +
        `_Example: .story Hello everyone!_`,
        'STATUS PUBLISHER'
      )
    );
    return;
  }

  await ctx.react('⏳');

  // Fetch recipients for statusJidList so contacts can view the story
  const dbRecipients = await ctx.db.getBroadcastRecipients();
  const jidSet = new Set<string>(dbRecipients);
  if (ctx.senderJid && ctx.senderJid.includes('@s.whatsapp.net')) jidSet.add(ctx.senderJid);
  if (ctx.sock.user?.id) {
    const me = ctx.sock.user.id.split(':')[0] + '@s.whatsapp.net';
    jidSet.add(me);
  }
  const ownerJid = (process.env.OWNER_NUMBER || '923192342358').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  jidSet.add(ownerJid);
  const statusJidList = Array.from(jidSet);

  try {
    if (isImage || isVideo || isAudio) {
      const buffer = await downloadMediaMessage(
        targetMsg as any,
        'buffer',
        {},
        {
          logger: undefined as any,
          reuploadRequest: ctx.sock.updateMediaMessage
        }
      );

      if (isImage) {
        await ctx.sock.sendMessage(
          'status@broadcast',
          {
            image: buffer as Buffer,
            caption: textArg || (m.imageMessage as any)?.caption || ''
          },
          { statusJidList }
        );
      } else if (isVideo) {
        await ctx.sock.sendMessage(
          'status@broadcast',
          {
            video: buffer as Buffer,
            caption: textArg || (m.videoMessage as any)?.caption || ''
          },
          { statusJidList }
        );
      } else if (isAudio) {
        await ctx.sock.sendMessage(
          'status@broadcast',
          {
            audio: buffer as Buffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
          },
          {
            statusJidList,
            backgroundColor: '#25D366'
          }
        );
      }
    } else {
      const colors = [
        '#25D366', // Green
        '#795548', // Brown
        '#673AB7', // Purple
        '#E91E63', // Pink
        '#009688', // Teal
        '#3F51B5', // Indigo
        '#FF5722', // Deep Orange
        '#607D8B'  // Blue Grey
      ];
      const backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      await ctx.sock.sendMessage(
        'status@broadcast',
        {
          text: textArg
        },
        {
          statusJidList,
          backgroundColor,
          font: 1
        }
      );
    }

    await ctx.react('✅');
    await ctx.reply(
      formatMessage(
        `✅ *WhatsApp Status Story Published!*\n\n` +
        `• *Type*: ${isImage ? 'Photo Story' : isVideo ? 'Video Story' : isAudio ? 'Voice Note' : 'Text Story'}\n` +
        `• *Audience*: ${statusJidList.length} contact(s) synced`,
        'STATUS PUBLISHED'
      )
    );
  } catch (err: any) {
    console.error('[StoryPlugin] Failed to post status story:', err);
    await ctx.reply(formatError(`Failed to post status: ${err.message}`, 'STATUS ERROR'));
  }
}

export const privacyCommands: PluginCommand[] = [
  {
    name: 'story',
    aliases: ['poststatus', 'statuspost', 'setstatus', 'upstatus'],
    category: 'Admin & Settings',
    description: 'Post replied image/video/audio or text directly to WhatsApp Status Story (status@broadcast)',
    usage: '.story [text/caption] (or reply to media)',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      const targetMsg = ctx.quoted || ctx.msg;
      const m = unwrapMessage(targetMsg.message);
      const textArg = ctx.args.join(' ').trim();
      return await postStatusStory(ctx, targetMsg, m, textArg);
    }
  },
  {
    name: 'stats',
    aliases: ['status', 'telemetry', 'runtime', 'uptime', 'sysinfo'],
    category: 'Admin & Settings',
    description: 'Process telemetry, database statistics, and memory health (or post status story if media/text provided)',
    usage: '.stats (or .status <caption>)',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      const targetMsg = ctx.quoted || ctx.msg;
      const m = unwrapMessage(targetMsg.message);
      const isMedia = !!(m?.imageMessage || m?.videoMessage || m?.audioMessage);
      const textArg = ctx.args.join(' ').trim();

      if (ctx.command === 'status' && (isMedia || textArg)) {
        return await postStatusStory(ctx, targetMsg, m, textArg);
      }

      const t = ctx.ops.getTelemetry();
      const stats = await ctx.db.getStats();

      const body =
        `👑 *Owner*: ${OWNER_NAME}\n` +
        `⏱️ *Uptime*: ${t.uptimeFormatted}\n` +
        `⚡ *Platform*: ${t.platform}\n` +
        `📦 *Node*: ${t.nodeVersion}\n\n` +
        `💾 *Memory Metrics*:\n` +
        `• RSS: ${t.memoryRssMb} MB (Cap: 800 MB)\n` +
        `• Heap Used: ${t.memoryHeapUsedMb} MB\n` +
        `• Heap Total: ${t.memoryHeapTotalMb} MB\n\n` +
        `🗄️ *Database Records*:\n` +
        `• Total Messages Logged: ${stats.totalMessages.toLocaleString()}\n` +
        `• Total Edits Captured: ${stats.totalEdits.toLocaleString()}\n` +
        `• Total Media Stored: ${stats.totalMedia.toLocaleString()}\n` +
        `• DB Disk Footprint: ${stats.databaseSizeMb} MB\n\n` +
        `📢 *To Post a WhatsApp Status Story*:\n` +
        `• Reply to photo/video: *.story [caption]*\n` +
        `• Or post a text story: *.story <your text>*`;

      await ctx.reply(formatMessage(body, 'SYSTEM TELEMETRY'));
    }
  },
  {
    name: 'antidelete',
    category: 'Admin & Settings',
    description: 'Toggle message revocation interception',
    usage: '.antidelete [on/off]',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      let mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = (await ctx.db.getSetting('antidelete')) || 'off';
        mode = current === 'on' ? 'off' : 'on';
      }

      await ctx.db.setSetting('antidelete', mode);
      await ctx.reply(formatMessage(`🛡️ *Anti-Delete* has been set to: *${mode.toUpperCase()}*`, 'ANTI-DELETE'));
    }
  },
  {
    name: 'antiedit',
    category: 'Admin & Settings',
    description: 'Toggle message edit interception and forensic diff alerts',
    usage: '.antiedit [on/off]',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      let mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = (await ctx.db.getSetting('antiedit')) || 'off';
        mode = current === 'on' ? 'off' : 'on';
      }

      await ctx.db.setSetting('antiedit', mode);
      await ctx.reply(formatMessage(`✏️ *Anti-Edit* has been set to: *${mode.toUpperCase()}*`, 'ANTI-EDIT'));
    }
  },
  {
    name: 'antistatus',
    category: 'Admin & Settings',
    description: 'Toggle auto-download of status updates to local disk',
    usage: '.antistatus [on/off]',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      let mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = (await ctx.db.getSetting('antistatus')) || 'off';
        mode = current === 'on' ? 'off' : 'on';
      }

      await ctx.db.setSetting('antistatus', mode);
      await ctx.reply(formatMessage(`📸 *Anti-Status*: *${mode.toUpperCase()}*`, 'ANTI-STATUS'));
    }
  },
  {
    name: 'autostatus',
    category: 'Admin & Settings',
    description: 'Toggle auto-viewing and acknowledging WhatsApp status updates',
    usage: '.autostatus [on/off]',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      let mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = (await ctx.db.getSetting('autostatus')) || 'off';
        mode = current === 'on' ? 'off' : 'on';
      }

      await ctx.db.setSetting('autostatus', mode);
      await ctx.reply(formatMessage(`👀 *Auto-Status Viewer* has been set to: *${mode.toUpperCase()}*`, 'AUTO-STATUS'));
    }
  },
  {
    name: 'smartmode',
    category: 'Admin & Settings',
    description: 'Zero-prefix smart mode status',
    usage: '.smartmode',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      await ctx.db.setSetting('smartmode', 'off');
      await ctx.reply(
        formatMessage(
          `🧠 *Smart Mode (Zero-Prefix)* is permanently disabled.\n\nCommands must begin with a prefix (*.*), or tag *@bot <question>* for AI chat.`,
          'SMART MODE'
        )
      );
    }
  },
  {
    name: 'stop-auto',
    aliases: ['stopauto', 'stopbot'],
    category: 'Admin & Settings',
    description: 'Stop all automated AI responses and intent parsing',
    usage: '.stop-auto',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      await ctx.db.setSetting('smartmode', 'off');
      await ctx.db.setSetting('autostatus', 'off');
      await ctx.reply(
        formatMessage(
          `🛑 *Auto-Responses Stopped*\n\n• *Smart Mode*: OFF\n• *Auto Status*: OFF\n\nBot will only respond to explicit commands (starting with *.*) or *@bot* tags.`,
          'SETTINGS'
        )
      );
    }
  },
  {
    name: 'bot',
    category: 'Admin & Settings',
    description: 'Master bot execution switch',
    usage: '.bot [on/off]',
    ownerOnly: true,
    handler: async (ctx: PluginContext) => {
      let mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = (await ctx.db.getSetting('bot_enabled')) || 'on';
        mode = current === 'on' ? 'off' : 'on';
      }

      await ctx.db.setSetting('bot_enabled', mode);
      await ctx.reply(formatMessage(`🤖 *Master Bot Switch* has been set to: *${mode.toUpperCase()}*`, 'BOT SWITCH'));
    }
  }
];
