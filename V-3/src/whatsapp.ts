import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'node:fs/promises';
import path from 'node:path';
import qrcode from 'qrcode-terminal';
import { MessageRepository } from './db.js';
import { ApiClient } from './api.js';
import { OpsManager } from './ops.js';
import { AiGuide } from './ai-guide.js';
import { IntentEngine } from './intent-engine.js';
import { PluginManager, PluginContext } from './plugin.js';
import { registerAllPlugins } from './plugins/index.js';
import { formatMessage, formatWelcomeCard, POWERED_BY } from './format.js';

export class WhatsAppGateway {
  private sock: WASocket | null = null;
  private pluginManager: PluginManager;
  private logger = pino({ level: 'silent' });
  private ownerJid: string;
  private authDir: string;
  private mediaDir: string;
  private isConnecting = false;
  private botSentMessageIds = new Set<string>();
  private lastAiResponseTimestamp = new Map<string, number>();
  private userAiQuestionCount = new Map<string, { count: number; resetAt: number }>();
  private pendingWelcomeQueue = new Map<string, { participants: Set<string>; timer: NodeJS.Timeout }>();
  private static readonly AI_DAILY_CAP = 15;

  public async safeSendMessage(chatJid: string, content: any, options: any = {}): Promise<any> {
    if (!this.sock) return null;
    try {
      const res = await this.sock.sendMessage(chatJid, content, options);
      if (res?.key?.id) {
        this.botSentMessageIds.add(res.key.id);
        setTimeout(() => this.botSentMessageIds.delete(res.key.id!), 120000);
      }
      return res;
    } catch (err: any) {
      console.warn(`[WhatsAppGateway] Failed to send message to ${chatJid}:`, err.message);
      return null;
    }
  }

  constructor(
    private db: MessageRepository,
    private ops: OpsManager,
    private api: ApiClient,
    private aiGuide: AiGuide,
    private intentEngine: IntentEngine,
    authDir: string = 'auth_info',
    ownerNumber: string = process.env.OWNER_NUMBER || '923192342358'
  ) {
    this.authDir = path.resolve(authDir);
    this.mediaDir = path.resolve('data', 'media');
    this.ownerJid = `${ownerNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    this.pluginManager = new PluginManager();
    registerAllPlugins(this.pluginManager);
  }

  public async start(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    // Clean up existing socket to prevent multiple active sessions / Bad MAC errors
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.ev.removeAllListeners('group-participants.update');
        this.sock.end(undefined);
      } catch {}
      this.sock = null;
    }

    await fs.mkdir(this.authDir, { recursive: true });
    await fs.mkdir(this.mediaDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger: this.logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger)
      },
      generateHighQualityLinkPreview: true,
      browser: ['BOT_404_V3', 'Chrome', '120.0.0']
    });

    this.sock.ev.on('creds.update', saveCreds);

    // Support Pairing Code Authentication if configured in .env
    const pairingNumber = process.env.PAIRING_NUMBER?.replace(/[^0-9]/g, '');
    if (pairingNumber && !state.creds.registered) {
      setTimeout(async () => {
        try {
          if (this.sock && !state.creds.registered) {
            const pairingCode = await this.sock.requestPairingCode(pairingNumber);
            console.log(`\n==================================================`);
            console.log(`🔑 WHATSAPP PAIRING CODE: ${pairingCode}`);
            console.log(`==================================================\n`);
          }
        } catch (err: any) {
          console.warn('[WhatsAppGateway] Pairing code request notice:', err.message);
        }
      }, 3000);
    }

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && (!pairingNumber || state.creds.registered)) {
        console.log('\n[WhatsAppGateway] Scan the QR code below using WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.warn(`[WhatsAppGateway] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        this.isConnecting = false;

        if (shouldReconnect) {
          setTimeout(() => this.start(), 5000);
        }
      } else if (connection === 'open') {
        console.log(`[WhatsAppGateway] Successfully connected to WhatsApp! Bot owner: ${this.ownerJid}`);
        this.isConnecting = false;
      }
    });

    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;

      for (const msg of messages) {
        if (!msg.message || !msg.key || !msg.key.remoteJid || !msg.key.id) continue;
        await this.handleIncomingMessage(msg);
      }
    });

    this.sock.ev.on('group-participants.update', async (update) => {
      await this.handleGroupParticipantsUpdate(update);
    });
  }

  private async handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
    if (!msg.key || !msg.key.remoteJid || !msg.key.id || !msg.message) return;

    const chatJid = msg.key.remoteJid;

    // Handle Status Stories (auto-status view & anti-status media archiving)
    if (chatJid === 'status@broadcast') {
      await this.handleStatusBroadcast(msg);
      return;
    }

    const isGroup = chatJid.endsWith('@g.us');
    const senderJid = msg.key.participant || (isGroup ? '' : chatJid);
    const isFromMe = msg.key.fromMe || false;

    // Resolve owner identity across phone JID and multi-device LIDs
    const botNum = this.sock?.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '') || '';
    const botLid = this.sock?.user?.lid?.split(':')[0]?.replace(/[^0-9]/g, '') || '';
    const senderClean = senderJid.replace(/[^0-9]/g, '');
    const ownerClean = this.ownerJid.replace(/[^0-9]/g, '');

    const isOwner =
      isFromMe ||
      senderJid === this.ownerJid ||
      senderClean === ownerClean ||
      (botNum.length > 0 && senderClean === botNum) ||
      (botLid.length > 0 && senderClean === botLid);

    const msgId = msg.key.id;
    const messageContent = msg.message;

    // 1. Intercept Message Revocation (Anti-Delete)
    const protocolMsg = messageContent.protocolMessage;
    if (protocolMsg && protocolMsg.type === 0 && protocolMsg.key?.id) {
      await this.handleRevocation(chatJid, senderJid, protocolMsg.key.id);
      return;
    }

    // 2. Intercept Message Edit (Anti-Edit)
    if (protocolMsg && protocolMsg.type === 14 && protocolMsg.editedMessage && protocolMsg.key?.id) {
      await this.handleEdit(chatJid, senderJid, protocolMsg.key.id, protocolMsg.editedMessage);
      return;
    }

    // 3. Extract Message Type, Text, and Media Details
    const { messageType, text, hasMedia } = this.extractDetails(messageContent);

    // 0. Drop self-echoes of messages sent programmatically by this bot
    if (msgId && this.botSentMessageIds.has(msgId)) {
      this.botSentMessageIds.delete(msgId);
      return;
    }

    // 0. Drop any message that contains the bot signature to prevent infinite loopback cascades
    if (text && (text.includes(POWERED_BY) || text.includes('Powered by V3-ARCHITECTURE'))) {
      return;
    }

    // 4. Save Media Stream to disk if present
    let mediaPath: string | undefined;
    if (hasMedia) {
      try {
        const buffer = await downloadMediaMessage(
          msg as any,
          'buffer',
          {},
          {
            logger: undefined as any,
            reuploadRequest: this.sock!.updateMediaMessage
          }
        );
        const ext = this.getExtensionForType(messageType);
        const fileName = `${msgId}_${Date.now()}.${ext}`;
        const targetPath = path.join(this.mediaDir, fileName);
        await fs.writeFile(targetPath, buffer as Buffer);
        mediaPath = fileName;
      } catch (err: any) {
        console.warn(`[WhatsAppGateway] Failed to download media for msg ${msgId}:`, err.message);
      }
    }

    // 5. Total MariaDB Logging
    try {
      await this.db.saveMessage({
        id: msgId,
        jid: chatJid,
        senderJid,
        messageType,
        content: text,
        rawPayload: messageContent,
        mediaPath,
        hasMedia
      });
    } catch (dbErr: any) {
      console.error('[WhatsAppGateway] Failed to save message to DB:', dbErr.message);
    }

    // 5b. Silent Background Voice Note Transcription & Urgent Keyword Interception
    if (hasMedia && (messageType === 'audio' || messageType === 'audioMessage') && mediaPath) {
      (async () => {
        try {
          const targetPath = path.join(this.mediaDir, mediaPath!);
          const audioBuf = await fs.readFile(targetPath);
          const mime = (messageContent.audioMessage as any)?.mimetype || 'audio/ogg';
          const transcript = await this.api.transcribeAudio(audioBuf, mime);
          if (transcript && transcript.trim().length > 0) {
            // 1. Save transcript into DB silently (without showing in chat)
            await this.db.updateMessageContent(msgId, transcript.trim());

            // 2. Check for urgent keywords or Rutaab mention in spoken audio
            let groupSubject: string | undefined;
            if (isGroup) {
              try {
                const meta = await this.sock!.groupMetadata(chatJid);
                groupSubject = meta.subject;
              } catch {}
            }

            const alert = this.intentEngine.checkPriorityAlert(
              transcript,
              senderJid,
              msg.pushName || undefined,
              isGroup ? chatJid : undefined,
              groupSubject
            );

            if (alert && !isOwner) {
              const body =
                `👤 *Sender*: ${alert.senderName || alert.senderJid.split('@')[0]}\n` +
                `📍 *Chat*: ${alert.groupSubject ? alert.groupSubject + ' [Group]' : 'Direct Chat'}\n` +
                `⚠️ *Trigger*: "${alert.keyword}"\n` +
                `⏰ *Time*: ${alert.timestamp.toLocaleTimeString()}\n\n` +
                `🎙️ *Spoken Audio Transcript*:\n"${transcript}"`;

              await this.safeSendMessage(this.ownerJid, { text: formatMessage(body, 'URGENT VOICE NOTE ALERT') });
            }
          }
        } catch (e: any) {
          // Silent catch - don't disturb normal flow
        }
      })();
    }

    // In groups, ignore self messages unless it is an explicit command (.cmd)
    if (isFromMe && isGroup && !text.startsWith('.')) return;

    // 6. Master Bot Switch Check
    const botEnabled = (await this.db.getSetting('bot_enabled')) !== 'off';
    if (!botEnabled && !text.startsWith('.bot')) return;

    // 7. Check Priority & Owner Mentions ("Rutaab" / urgent triggers)
    if (text) {
      let groupSubject: string | undefined;
      if (isGroup) {
        try {
          const meta = await this.sock!.groupMetadata(chatJid);
          groupSubject = meta.subject;
        } catch {}
      }

      const priorityAlert = this.intentEngine.checkPriorityAlert(
        text,
        senderJid,
        msg.pushName || undefined,
        isGroup ? chatJid : undefined,
        groupSubject
      );

      if (priorityAlert && !isOwner) {
        const notification = this.intentEngine.formatPriorityNotification(priorityAlert);
        await this.sock!.sendMessage(this.ownerJid, { text: notification });
      }
    }

    // 8. Rate Limiting Check
    const rateCheck = this.ops.checkRateLimit(senderJid || chatJid, 20);
    if (!rateCheck.allowed && !isOwner) {
      await this.sock!.sendMessage(chatJid, {
        text: `⏳ *Rate Limit Exceeded*: Please wait ${rateCheck.resetSec}s before sending more commands.`
      }, { quoted: msg as any });
      return;
    }

    // 9. Command Dispatch (.command)
    const prefix = '.';
    if (text.startsWith(prefix)) {
      const parts = text.slice(prefix.length).trim().split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      let isGroupAdmin = false;
      let isBotAdmin = false;

      if (isGroup) {
        try {
          const meta = await this.sock!.groupMetadata(chatJid);
          const participant = meta.participants.find((p) => p.id === senderJid);
          isGroupAdmin = !!participant?.admin;

          const botNum = this.sock!.user?.id?.split(':')[0];
          const botParticipant = meta.participants.find((p) => p.id.startsWith(botNum || '___'));
          isBotAdmin = !!botParticipant?.admin;
        } catch {}
      }

      const quoted = (msg.message as any)?.extendedTextMessage?.contextInfo?.quotedMessage
        ? ({
            key: {
              remoteJid: chatJid,
              id: (msg.message as any).extendedTextMessage.contextInfo.stanzaId,
              participant: (msg.message as any).extendedTextMessage.contextInfo.participant
            },
            message: (msg.message as any).extendedTextMessage.contextInfo.quotedMessage
          } as proto.IWebMessageInfo)
        : null;

      console.log(`[WhatsAppGateway] ⚡ Executing command: .${command} (Chat: ${chatJid}, fromMe: ${isFromMe})`);

      const ctx: PluginContext = {
        sock: this.sock!,
        msg,
        rawText: text,
        command,
        args,
        senderJid,
        chatJid,
        isGroup,
        isOwner,
        isGroupAdmin,
        isBotAdmin,
        db: this.db,
        api: this.api,
        ops: this.ops,
        aiGuide: this.aiGuide,
        intentEngine: this.intentEngine,
        quoted,
        reply: async (replyText: string, options: any = {}) => {
          try {
            return await this.sock!.sendMessage(chatJid, { text: replyText, ...options }, { quoted: msg as any });
          } catch {
            return await this.sock!.sendMessage(chatJid, { text: replyText, ...options });
          }
        },
        react: async (emoji: string) => {
          try {
            return await this.sock!.sendMessage(chatJid, { react: { text: emoji, key: msg.key as any } });
          } catch {}
        }
      };

      const executed = await this.pluginManager.execute(ctx);
      if (executed) return;

      // Unknown command handling with fuzzy suggestions and quick help menu
      const suggestions = this.pluginManager.findClosestCommands(command);
      let content = `❌ *Unknown command*: .${command}\n\n`;

      if (suggestions.length > 0) {
        content += `💡 *Did you mean?*\n`;
        for (const s of suggestions) {
          const cmd = this.pluginManager.getCommand(s);
          content += `• *.${s}*${cmd?.description ? ` — _${cmd.description}_` : ''}\n`;
        }
        content += `\n`;
      }

      content += `📋 *Quick Command Directory*:\n`;
      content += `• *.menu* — View all available commands\n`;
      content += `• *.games* — Play interactive games\n`;
      content += `• *.play <song>* — Stream 320kbps music\n`;
      content += `• *.alldl <url>* — Universal video downloader\n`;
      content += `• Tag *@bot <question>* — Chat with AI assistant\n\n`;
      content += `_Type *.menu* for the complete list._`;

      await ctx.reply(formatMessage(content, 'COMMAND NOT FOUND'));
      return;
    }

    // 10. @bot Mention & AI LLM Chat Handler
    if (text) {
      const contextInfo =
        (msg.message as any)?.extendedTextMessage?.contextInfo ||
        (msg.message as any)?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
      const mentionedJids: string[] = contextInfo?.mentionedJid || [];

      const botNum = this.sock?.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '') || '';
      const botLid = this.sock?.user?.lid?.split(':')[0]?.replace(/[^0-9]/g, '') || '';

      const isMentionedViaWhatsApp = mentionedJids.some((j) => {
        const clean = j.split(':')[0].replace(/[^0-9]/g, '');
        return (botNum.length > 0 && clean === botNum) || (botLid.length > 0 && clean === botLid);
      });

      const isMentionedViaText = /^\s*@bot\b/i.test(text);

      if (isMentionedViaWhatsApp || isMentionedViaText) {
        // Extract query by removing leading @bot and phone mentions
        const cleanQuery = text
          .replace(/^\s*@bot\b/i, '')
          .replace(/@\d+/g, '')
          .trim();

        if (!cleanQuery) {
          await this.safeSendMessage(
            chatJid,
            {
              text: formatMessage(
                `👋 Hello! I am your AI assistant.\n\n` +
                `Ask me anything by typing:\n` +
                `*@bot <your question>*\n\n` +
                `_Examples_:\n` +
                `• *@bot how do I download youtube videos?*\n` +
                `• *@bot what games can we play?*\n` +
                `• *@bot tell me a fun fact about astronomy*`,
                'AI ASSISTANT'
              )
            },
            { quoted: msg as any }
          );
          return;
        }

        // Anti-flood throttle: 3 seconds per chat
        const lastChatTime = this.lastAiResponseTimestamp.get(chatJid) || 0;
        if (Date.now() - lastChatTime < 3000) {
          return;
        }

        // Daily per-user question cap: 15 questions per user per day (owner is exempt)
        if (!isOwner) {
          const now = Date.now();
          const userCap = this.userAiQuestionCount.get(senderJid);
          const tomorrow = new Date();
          tomorrow.setHours(24, 0, 0, 0);
          const resetAt = tomorrow.getTime();

          if (userCap && now < userCap.resetAt) {
            if (userCap.count >= WhatsAppGateway.AI_DAILY_CAP) {
              await this.safeSendMessage(
                chatJid,
                {
                  text: formatMessage(
                    `⚠️ *Daily Limit Reached*\n\n` +
                    `You have reached your daily limit of *${WhatsAppGateway.AI_DAILY_CAP}* @bot questions.\n` +
                    `Your limit will automatically reset at *12:00 AM (midnight)*.\n\n` +
                    `💡 You can still use commands like *.menu*, *.games*, *.search*, or *.play*!`,
                    'DAILY AI LIMIT'
                  )
                },
                { quoted: msg as any }
              );
              return;
            }
            userCap.count++;
          } else {
            this.userAiQuestionCount.set(senderJid, { count: 1, resetAt });
          }
        }

        this.lastAiResponseTimestamp.set(chatJid, Date.now());

        // React with thinking emoji while generating
        try {
          await this.sock!.sendMessage(chatJid, { react: { text: '🤔', key: msg.key as any } });
        } catch {}

        try {
          const aiResponse = await this.aiGuide.answer(chatJid, senderJid, cleanQuery);
          let responseText = aiResponse.trim();

          if (!isOwner) {
            const userCap = this.userAiQuestionCount.get(senderJid);
            const remaining = Math.max(0, WhatsAppGateway.AI_DAILY_CAP - (userCap?.count || 0));
            responseText += `\n\n📊 _AI queries remaining today: ${remaining}/${WhatsAppGateway.AI_DAILY_CAP}_`;
          }

          await this.safeSendMessage(
            chatJid,
            { text: formatMessage(responseText, 'AI ASSISTANT') },
            { quoted: msg as any }
          );

          try {
            await this.sock!.sendMessage(chatJid, { react: { text: '💡', key: msg.key as any } });
          } catch {}
        } catch (aiErr: any) {
          console.error('[WhatsAppGateway] @bot chat execution failed:', aiErr.message);
          await this.safeSendMessage(
            chatJid,
            { text: formatMessage(`Failed to generate AI response. Please try again shortly.`, 'AI ERROR') },
            { quoted: msg as any }
          );
        }

        return;
      }
    }
  }

  // --- Status Broadcast Stories Handler (autostatus & antistatus) ---
  private async handleStatusBroadcast(msg: proto.IWebMessageInfo): Promise<void> {
    const isAutoStatusOn = (await this.db.getSetting('autostatus')) === 'on';
    if (isAutoStatusOn && msg.key && this.sock) {
      try {
        await this.sock.readMessages([msg.key]);
      } catch {}
    }

    const isAntiStatusOn = (await this.db.getSetting('antistatus')) === 'on';
    if (isAntiStatusOn && msg.message) {
      try {
        const { messageType, text, hasMedia } = this.extractDetails(msg.message);
        if (hasMedia) {
          const buffer = await downloadMediaMessage(
            msg as any,
            'buffer',
            {},
            {
              logger: undefined as any,
              reuploadRequest: this.sock!.updateMediaMessage
            }
          );
          const statusDir = path.join(this.mediaDir, 'status');
          await fs.mkdir(statusDir, { recursive: true });
          const ext = this.getExtensionForType(messageType);
          const senderId = (msg.key?.participant || msg.key?.remoteJid || 'status').split('@')[0];
          const fileName = `status_${senderId}_${Date.now()}.${ext}`;
          await fs.writeFile(path.join(statusDir, fileName), buffer as Buffer);
        }
      } catch (err: any) {
        console.warn('[WhatsAppGateway] Notice: Could not save status media:', err.message);
      }
    }
  }

  // --- Anti-Delete Interception Handler ---
  private async handleRevocation(chatJid: string, senderJid: string, revokedMsgId: string): Promise<void> {
    const isAntiDeleteOn = (await this.db.getSetting('antidelete')) === 'on';
    if (!isAntiDeleteOn) return;

    const original = await this.db.getMessageById(revokedMsgId);
    if (!original) return;

    await this.db.markDeleted(revokedMsgId);

    const timeStr = new Date(original.created_at).toLocaleTimeString();
    const sender = (original.sender_jid || senderJid || '').split('@')[0] || 'Unknown';
    const alertHeader =
      `👤 *Deleted By*: ${sender}\n` +
      `📍 *Chat*: ${chatJid.replace('@g.us', ' [Group]').replace('@s.whatsapp.net', '')}\n` +
      `⏰ *Sent Time*: ${timeStr}\n\n`;

    if (original.has_media && original.media_path) {
      const mediaFile = path.join(this.mediaDir, original.media_path);
      try {
        const buffer = await fs.readFile(mediaFile);
        if (original.message_type === 'image') {
          await this.sock!.sendMessage(this.ownerJid, {
            image: buffer,
            caption: formatMessage(`${alertHeader}💬 *Caption*: ${original.content || '[None]'}`, 'ANTI-DELETE RECOVERY')
          });
        } else if (original.message_type === 'video') {
          await this.sock!.sendMessage(this.ownerJid, {
            video: buffer,
            caption: formatMessage(`${alertHeader}💬 *Caption*: ${original.content || '[None]'}`, 'ANTI-DELETE RECOVERY')
          });
        } else if (original.message_type === 'audio') {
          await this.sock!.sendMessage(this.ownerJid, {
            text: formatMessage(alertHeader + `🎙️ *Recovered Audio Message*:`, 'ANTI-DELETE RECOVERY')
          });
          await this.sock!.sendMessage(this.ownerJid, {
            audio: buffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
          });
        }
      } catch (err: any) {
        await this.sock!.sendMessage(this.ownerJid, {
          text: formatMessage(`${alertHeader}⚠️ Failed to forward media: ${err.message}`, 'ANTI-DELETE ERROR')
        });
      }
    } else {
      await this.sock!.sendMessage(this.ownerJid, {
        text: formatMessage(`${alertHeader}💬 *Recovered Text*:\n"${original.content}"`, 'ANTI-DELETE RECOVERY')
      });
    }
  }

  // --- Anti-Edit Interception Handler ---
  private async handleEdit(chatJid: string, senderJid: string, editedMsgId: string, editedMessage: proto.IMessage): Promise<void> {
    const isAntiEditOn = (await this.db.getSetting('antiedit')) === 'on';
    if (!isAntiEditOn) return;

    const original = await this.db.getMessageById(editedMsgId);
    if (!original) return;

    const { text: newContent } = this.extractDetails(editedMessage);
    if (!newContent) return;

    await this.db.logEdit(editedMsgId, original.content || '', newContent);

    const sender = (original.sender_jid || senderJid || '').split('@')[0] || 'Unknown';
    const alertMessage =
      `👤 *Edited By*: ${sender}\n` +
      `📍 *Chat*: ${chatJid.replace('@g.us', ' [Group]').replace('@s.whatsapp.net', '')}\n` +
      `⏰ *Edit Detected*: ${new Date().toLocaleTimeString()}\n\n` +
      `🔴 *ORIGINAL*:\n"${original.content}"\n\n` +
      `🟢 *EDITED*:\n"${newContent}"`;

    await this.sock!.sendMessage(this.ownerJid, { text: formatMessage(alertMessage, 'ANTI-EDIT ALERT') });
  }

  private unwrapMessage(m: proto.IMessage | null | undefined): proto.IMessage | null | undefined {
    let actual = m;
    while (
      actual && (
        actual.ephemeralMessage?.message ||
        actual.viewOnceMessage?.message ||
        actual.viewOnceMessageV2?.message ||
        actual.viewOnceMessageV2Extension?.message ||
        actual.documentWithCaptionMessage?.message
      )
    ) {
      actual = (
        actual.ephemeralMessage?.message ||
        actual.viewOnceMessage?.message ||
        actual.viewOnceMessageV2?.message ||
        actual.viewOnceMessageV2Extension?.message ||
        actual.documentWithCaptionMessage?.message
      ) as proto.IMessage;
    }
    return actual;
  }

  private extractDetails(m: proto.IMessage): { messageType: string; text: string; hasMedia: boolean } {
    const unwrapped = this.unwrapMessage(m) || m;
    let messageType = 'text';
    let text = '';
    let hasMedia = false;

    if (unwrapped.conversation) {
      text = unwrapped.conversation;
      messageType = 'text';
    } else if (unwrapped.extendedTextMessage?.text) {
      text = unwrapped.extendedTextMessage.text;
      messageType = 'text';
    } else if (unwrapped.imageMessage) {
      messageType = 'image';
      text = unwrapped.imageMessage.caption || '';
      hasMedia = true;
    } else if (unwrapped.videoMessage) {
      messageType = 'video';
      text = unwrapped.videoMessage.caption || '';
      hasMedia = true;
    } else if (unwrapped.audioMessage) {
      messageType = 'audio';
      hasMedia = true;
    } else if (unwrapped.stickerMessage) {
      messageType = 'sticker';
      hasMedia = true;
    } else if (unwrapped.documentMessage) {
      messageType = 'document';
      text = unwrapped.documentMessage.fileName || '';
      hasMedia = true;
    }

    return { messageType, text: text.trim(), hasMedia };
  }

  private getExtensionForType(type: string): string {
    switch (type) {
      case 'image': return 'jpg';
      case 'video': return 'mp4';
      case 'audio': return 'ogg';
      case 'sticker': return 'webp';
      case 'document': return 'bin';
      default: return 'bin';
    }
  }

  // --- Group Participants Join Handler (Automated Welcome Card) ---
  private async handleGroupParticipantsUpdate(update: any): Promise<void> {
    if (update?.action !== 'add') return;

    // 1. Check Master Bot Switch
    const botEnabled = (await this.db.getSetting('bot_enabled')) !== 'off';
    if (!botEnabled) return;

    // 2. Check if welcome greetings are enabled for this specific group (DISABLED by default)
    const welcomeSetting = await this.db.getSetting(`welcome_${update.id}`, 'off');
    if (welcomeSetting !== 'on') return;

    // 3. Normalize participant JIDs (Baileys v7 can pass string[] or GroupParticipant[])
    const rawParticipants: any[] = Array.isArray(update.participants) ? update.participants : [];
    const participantJids: string[] = rawParticipants
      .map((p) => (typeof p === 'string' ? p : p?.id))
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    // 4. Filter out the bot's own JID/LID so it does not welcome itself
    const botNum = this.sock?.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '');
    const botLid = this.sock?.user?.lid?.split(':')[0]?.replace(/[^0-9]/g, '');

    const joiningMembers = participantJids.filter((jid) => {
      const clean = jid.replace(/[^0-9]/g, '');
      return clean !== botNum && clean !== botLid;
    });

    if (joiningMembers.length === 0) return;

    // 4. Debounce & batch queue: bundle users joining in close succession into a single greeting
    const chatJid = update.id;
    let entry = this.pendingWelcomeQueue.get(chatJid);
    if (!entry) {
      entry = {
        participants: new Set<string>(),
        timer: setTimeout(() => this.flushWelcomeBatch(chatJid), 2500)
      };
      this.pendingWelcomeQueue.set(chatJid, entry);
    } else {
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => this.flushWelcomeBatch(chatJid), 2500);
    }

    for (const jid of joiningMembers) {
      entry.participants.add(jid);
    }
  }

  private async flushWelcomeBatch(chatJid: string): Promise<void> {
    const entry = this.pendingWelcomeQueue.get(chatJid);
    if (!entry || entry.participants.size === 0) return;
    this.pendingWelcomeQueue.delete(chatJid);

    const participantList = Array.from(entry.participants);

    try {
      if (!this.sock) return;

      // 1. Fetch group metadata
      const meta = await this.sock.groupMetadata(chatJid);
      if (!meta) return;

      // 2. Check if the bot is an administrator in this group (Requirement: bot must be admin)
      const botNum = this.sock.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '');
      const botLid = this.sock.user?.lid?.split(':')[0]?.replace(/[^0-9]/g, '');
      const botParticipant = meta.participants.find((p) => {
        const clean = p.id.replace(/[^0-9]/g, '');
        return (botNum && clean === botNum) || (botLid && clean === botLid) || p.id.startsWith(botNum || '___');
      });
      const isBotAdmin = !!botParticipant?.admin;

      if (!isBotAdmin) {
        return;
      }

      // 3. Format mentions and welcome card
      const userMentions = participantList.map((jid) => `@${jid.split('@')[0]}`).join(', ');
      const welcomeCard = formatWelcomeCard(meta.subject, userMentions);

      // 4. Send the welcome card with interactive clickable mentions
      await this.safeSendMessage(chatJid, {
        text: welcomeCard,
        mentions: participantList
      });
    } catch (err: any) {
      console.warn(`[WhatsAppGateway] Failed to dispatch welcome message to ${chatJid}:`, err.message);
    }
  }
}
