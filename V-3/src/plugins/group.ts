import { PluginCommand, PluginContext } from '../plugin.js';
import { formatMessage, formatAlert, formatError, formatWelcomeCard } from '../format.js';

function extractTargetJid(ctx: PluginContext): string | null {
  let rawJid: string | null = null;

  // 1. Primary: Replied message sender
  if (ctx.quoted?.key?.participant) {
    rawJid = ctx.quoted.key.participant;
  } else if (ctx.quoted?.key?.remoteJid && !ctx.quoted.key.remoteJid.endsWith('@g.us')) {
    rawJid = ctx.quoted.key.remoteJid;
  } else {
    // 2. Mentioned JIDs (supporting ephemeral messages)
    const m = ctx.msg.message as any;
    const ctxInfo =
      m?.extendedTextMessage?.contextInfo ||
      m?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
    const mentions = ctxInfo?.mentionedJid;
    if (Array.isArray(mentions) && mentions.length > 0) {
      rawJid = mentions[0];
    } else if (ctx.args[0]) {
      // 3. Raw argument phone number
      const cleanNum = ctx.args[0].replace(/[^0-9]/g, '');
      if (cleanNum.length >= 10) {
        return `${cleanNum}@s.whatsapp.net`;
      }
    }
  }

  if (rawJid) {
    return rawJid.replace(/:[0-9]+@/, '@');
  }

  return null;
}

export const groupCommands: PluginCommand[] = [
  {
    name: 'kick',
    aliases: ['remove', 'ban'],
    category: 'Group Management',
    description: 'Remove a member from the group (reply to message)',
    usage: '.kick (reply to member message)',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const target = extractTargetJid(ctx);
      if (!target) {
        await ctx.reply(formatAlert(`Please reply to the message of the member you wish to remove, or mention them with @user.`, 'REPLY REQUIRED', '⚠️'));
        return;
      }

      await ctx.sock.groupParticipantsUpdate(ctx.chatJid, [target], 'remove');
      await ctx.reply(formatMessage(`✅ Member @${target.split('@')[0]} has been removed from the group.`, 'MEMBER REMOVED'), {
        mentions: [target]
      });
    }
  },
  {
    name: 'promote',
    category: 'Group Management',
    description: 'Promote a member to group administrator (reply to message)',
    usage: '.promote (reply to member message)',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const target = extractTargetJid(ctx);
      if (!target) {
        await ctx.reply(formatAlert(`Please reply to the message of the member you wish to promote to admin.`, 'REPLY REQUIRED', '⚠️'));
        return;
      }

      await ctx.sock.groupParticipantsUpdate(ctx.chatJid, [target], 'promote');
      await ctx.reply(formatMessage(`👑 @${target.split('@')[0]} has been promoted to group administrator.`, 'ADMIN PROMOTED'), {
        mentions: [target]
      });
    }
  },
  {
    name: 'demote',
    category: 'Group Management',
    description: 'Demote an administrator back to regular member (reply to message)',
    usage: '.demote (reply to admin message)',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const target = extractTargetJid(ctx);
      if (!target) {
        await ctx.reply(formatAlert(`Please reply to the message of the administrator you wish to demote.`, 'REPLY REQUIRED', '⚠️'));
        return;
      }

      await ctx.sock.groupParticipantsUpdate(ctx.chatJid, [target], 'demote');
      await ctx.reply(formatMessage(`📉 @${target.split('@')[0]} has been demoted to regular member.`, 'ADMIN DEMOTED'), {
        mentions: [target]
      });
    }
  },
  {
    name: 'add',
    category: 'Group Management',
    description: 'Add a new member to the group by phone number',
    usage: '.add <countrycode+number>',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      if (!ctx.args[0]) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.add <number>*\n\n_Example: .add 923192342358_`, 'ADD MEMBER'));
        return;
      }

      const num = ctx.args[0].replace(/[^0-9]/g, '');
      const jid = `${num}@s.whatsapp.net`;
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.chatJid, [jid], 'add');
        await ctx.reply(formatMessage(`✅ Invitation/addition request sent for ${num}.`, 'ADD MEMBER'));
      } catch (err: any) {
        await ctx.reply(formatError(`Failed to add ${num}: ${err.message}`, 'ADD MEMBER'));
      }
    }
  },
  {
    name: 'mute',
    category: 'Group Management',
    description: 'Restrict group messaging to administrators only',
    usage: '.mute',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      await ctx.sock.groupSettingUpdate(ctx.chatJid, 'announcement');
      await ctx.reply(formatMessage(`🔒 *Group Muted*\n\nOnly group administrators can send messages now.`, 'GROUP SETTING'));
    }
  },
  {
    name: 'unmute',
    category: 'Group Management',
    description: 'Open group messaging to all participants',
    usage: '.unmute',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      await ctx.sock.groupSettingUpdate(ctx.chatJid, 'not_announcement');
      await ctx.reply(formatMessage(`🔓 *Group Unmuted*\n\nAll members can now send messages.`, 'GROUP SETTING'));
    }
  },
  {
    name: 'link',
    category: 'Group Management',
    description: 'Retrieve current group invitation link',
    usage: '.link',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const code = await ctx.sock.groupInviteCode(ctx.chatJid);
      await ctx.reply(formatMessage(`🔗 *Group Invite Link*:\nhttps://chat.whatsapp.com/${code}`, 'INVITE LINK'));
    }
  },
  {
    name: 'revoke',
    category: 'Group Management',
    description: 'Revoke and regenerate the group invite link',
    usage: '.revoke',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const code = await ctx.sock.groupRevokeInvite(ctx.chatJid);
      await ctx.reply(formatMessage(`🔄 *Invite Link Revoked*\n\nNew Link:\nhttps://chat.whatsapp.com/${code}`, 'INVITE LINK'));
    }
  },
  {
    name: 'tagall',
    aliases: ['everyone'],
    category: 'Group Management',
    description: 'Mention every participant in the group',
    usage: '.tagall [optional message]',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const meta = await ctx.sock.groupMetadata(ctx.chatJid);
      const participants = meta.participants.map((p) => p.id);
      const textMsg = ctx.args.join(' ').trim() || 'Attention everyone!';

      let message = `📢 *ATTENTION EVERYONE*\n\n💬 *Message*: ${textMsg}\n\n`;
      for (const p of meta.participants) {
        message += `• @${p.id.split('@')[0]}\n`;
      }

      await ctx.sock.sendMessage(ctx.chatJid, {
        text: formatMessage(message.trim(), 'TAG ALL'),
        mentions: participants
      });
    }
  },
  {
    name: 'hidetag',
    category: 'Group Management',
    description: 'Broadcast an invisible ghost mention to all participants',
    usage: '.hidetag <announcement text>',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const textMsg = ctx.args.join(' ').trim();
      if (!textMsg) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.hidetag <message>*`, 'HIDETAG'));
        return;
      }

      const meta = await ctx.sock.groupMetadata(ctx.chatJid);
      const participants = meta.participants.map((p) => p.id);

      await ctx.sock.sendMessage(ctx.chatJid, {
        text: formatMessage(textMsg, 'ANNOUNCEMENT'),
        mentions: participants
      });
    }
  },
  {
    name: 'groupstatus',
    category: 'Group Management',
    description: 'View group metadata and member breakdown',
    usage: '.groupstatus',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      const meta = await ctx.sock.groupMetadata(ctx.chatJid);
      const admins = meta.participants.filter((p) => p.admin !== null);
      const created = new Date(meta.creation! * 1000).toLocaleDateString();

      const body =
        `• *Group Name*: ${meta.subject}\n` +
        `• *Group ID*: ${meta.id}\n` +
        `• *Created*: ${created}\n` +
        `• *Total Members*: ${meta.participants.length}\n` +
        `• *Administrators*: ${admins.length}\n` +
        `• *Announce Only*: ${meta.announce ? 'Yes' : 'No'}\n` +
        `• *Restrict Settings*: ${meta.restrict ? 'Yes' : 'No'}`;

      await ctx.reply(formatMessage(body, 'GROUP STATUS'));
    }
  },
  {
    name: 'welcome',
    category: 'Group Management',
    description: 'Configure or test automatic greeting card for new members',
    usage: '.welcome [on | off | test | status]',
    privateAdminOnly: true,
    handler: async (ctx: PluginContext) => {
      if (!ctx.isGroup) {
        await ctx.reply(formatAlert('This command can only be used inside groups.', 'GROUP ONLY', '⚠️'));
        return;
      }

      const sub = (ctx.args[0] || '').toLowerCase().trim();

      if (sub === 'on' || sub === 'enable') {
        await ctx.db.setSetting(`welcome_${ctx.chatJid}`, 'on');
        const adminNotice = ctx.isBotAdmin
          ? `✅ *Bot Admin Status*: Bot is an administrator and ready to greet.`
          : `⚠️ *Important*: Bot is currently *not an admin* in this group. Please promote the bot to admin so it can post welcome cards seamlessly!`;

        await ctx.reply(
          formatMessage(
            `🎉 *Welcome Messages Enabled*\n\n` +
            `The automated greeting card is now active for *this group only*.\n\n` +
            `${adminNotice}\n\n` +
            `_Type *.welcome test* to see a live preview._`,
            'WELCOME ACTIVATED'
          )
        );
        return;
      }

      if (sub === 'off' || sub === 'disable') {
        await ctx.db.setSetting(`welcome_${ctx.chatJid}`, 'off');
        await ctx.reply(
          formatMessage(
            `🛑 *Welcome Messages Disabled*\n\n` +
            `Automated greetings are now deactivated for this group.`,
            'WELCOME DEACTIVATED'
          )
        );
        return;
      }

      if (sub === 'test' || sub === 'preview') {
        const meta = await ctx.sock.groupMetadata(ctx.chatJid);
        const callerTag = `@${ctx.senderJid.split('@')[0]}`;
        const card = formatWelcomeCard(meta.subject, callerTag);
        await ctx.sock.sendMessage(ctx.chatJid, {
          text: card,
          mentions: [ctx.senderJid]
        });
        return;
      }

      // Default: Status & Help
      const currentSetting = await ctx.db.getSetting(`welcome_${ctx.chatJid}`, 'off');
      const isEnabled = currentSetting === 'on';
      const meta = await ctx.sock.groupMetadata(ctx.chatJid);

      const statusBody =
        `• *Group*: ${meta.subject}\n` +
        `• *Welcome Status*: ${isEnabled ? '🟢 ACTIVE (Enabled for this group)' : '⚪ DISABLED (Default)'}\n` +
        `• *Bot Admin Status*: ${ctx.isBotAdmin ? '✅ Administrator' : '⚠️ Not Admin (Promote bot for full reliability)'}\n\n` +
        `ℹ️ _Welcome cards are disabled by default for privacy and only active in groups where enabled._\n\n` +
        `⚙️ *Commands*:\n` +
        `• *.welcome on* — Enable greetings in this group\n` +
        `• *.welcome off* — Disable greetings in this group\n` +
        `• *.welcome test* — Preview greeting card`;

      await ctx.reply(formatMessage(statusBody, 'WELCOME STATUS'));
    }
  }
];
