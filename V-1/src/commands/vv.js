import { downloadMediaMessage, jidNormalizedUser } from '@whiskeysockets/baileys';
import { OWNER_JID } from '../config.js';
import { reactTo, sendSignedText } from '../helpers.js';
import logger from '../logger.js';

export async function vvCommand({ sock, jid, message, sender }) {
  if (!OWNER_JID || !sender) return;
  const owner = jidNormalizedUser(OWNER_JID);
  const user = jidNormalizedUser(sender);

  if (!user || user !== owner) return;

  const contextInfo = message.message?.extendedTextMessage?.contextInfo;
  if (!contextInfo?.quotedMessage || !contextInfo?.stanzaId) {
    await reactTo(sock, jid, message.key, '❌');
    await sendSignedText(sock, jid, 'Reply to a view-once message with .vv', { quoted: message });
    return;
  }

  await reactTo(sock, jid, message.key, '⏳');

  try {
    const wmsg = {
      key: {
        remoteJid: contextInfo.participant ? jid : (contextInfo.remoteJid || jid),
        fromMe: false,
        id: contextInfo.stanzaId
      },
      message: contextInfo.quotedMessage
    };
    if (contextInfo.participant) {
      wmsg.key.participant = contextInfo.participant;
    }

    const buffer = await downloadMediaMessage(
      wmsg,
      'buffer',
      {},
      { logger, reuploadRequest: sock.updateMediaMessage }
    );

    const inner = contextInfo.quotedMessage?.viewOnceMessage?.message ||
                  contextInfo.quotedMessage?.viewOnceMessageV2?.message ||
                  contextInfo.quotedMessage?.viewOnceMessageV2Extension?.message ||
                  contextInfo.quotedMessage;

    const isVideo = !!(inner?.videoMessage);
    const caption = inner?.imageMessage?.caption ||
                    inner?.videoMessage?.caption || '';

    await sock.sendMessage(OWNER_JID, {
      [isVideo ? 'video' : 'image']: buffer,
      caption: `👁 *View Once*\nFrom: ${contextInfo.participant || jid}\n${caption}`
    });

    await reactTo(sock, jid, message.key, '✅');
  } catch (err) {
    logger.error({ err }, 'VV command failed');
    await reactTo(sock, jid, message.key, '❌');
    await sendSignedText(sock, jid, '❌ Could not decode that view-once message. The media may have expired.', { quoted: message });
  }
}
