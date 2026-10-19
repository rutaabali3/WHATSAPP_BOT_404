import { downloadMediaMessage, proto } from '@whiskeysockets/baileys';
import { PluginCommand, PluginContext } from '../plugin.js';
import { MediaPipeline } from '../media-pipeline.js';
import { formatMessage, formatError, BOT_NAME, OWNER_NAME } from '../format.js';

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

export const mediaCommands: PluginCommand[] = [
  {
    name: 'alldl',
    aliases: ['download', 'dl'],
    category: 'Downloader',
    description: 'Download video or media from any supported platform with auto-failover',
    usage: '.alldl <url>',
    handler: async (ctx: PluginContext) => {
      const url = ctx.args[0];
      if (!url) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.alldl <url>*\n\n_Example: .alldl https://youtube.com/watch?v=..._`, 'DOWNLOADER'));
        return;
      }

      await ctx.react('⏳');
      const media = await ctx.api.downloadMedia(url);

      if (media.downloadUrl) {
        await ctx.sock.sendMessage(ctx.chatJid, {
          video: { url: media.downloadUrl },
          caption: formatMessage(`🎬 *${media.title}*\n\n_Source: ${media.source}_`, 'MEDIA DOWNLOADER')
        });
        await ctx.react('✅');
      } else {
        await ctx.reply(formatError(`Could not retrieve media stream. Check link or try another service.`, 'DOWNLOADER'));
      }
    }
  },
  {
    name: 'yt',
    aliases: ['ytmp4', 'ytdl'],
    category: 'Downloader',
    description: 'Download video from YouTube',
    usage: '.yt <youtube-link>',
    handler: async (ctx: PluginContext) => {
      const url = ctx.args[0];
      if (!url) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.yt <youtube-link>*`, 'YOUTUBE DOWNLOADER'));
        return;
      }

      await ctx.react('⏳');
      const media = await ctx.api.downloadMedia(url, false);
      if (media.downloadUrl) {
        await ctx.sock.sendMessage(ctx.chatJid, {
          video: { url: media.downloadUrl },
          caption: formatMessage(`🎥 *${media.title}*`, 'YOUTUBE')
        });
        await ctx.react('✅');
      } else {
        await ctx.reply(formatError(`Could not retrieve YouTube video stream.`, 'YOUTUBE'));
      }
    }
  },
  {
    name: 'fb',
    category: 'Downloader',
    description: 'Download Facebook video',
    usage: '.fb <facebook-link>',
    handler: async (ctx: PluginContext) => {
      const url = ctx.args[0];
      if (!url) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.fb <facebook-url>*`, 'FACEBOOK DOWNLOADER'));
        return;
      }

      await ctx.react('⏳');
      const media = await ctx.api.downloadMedia(url);
      if (media.downloadUrl) {
        await ctx.sock.sendMessage(ctx.chatJid, {
          video: { url: media.downloadUrl },
          caption: formatMessage(`🎬 *Facebook Video*`, 'FACEBOOK')
        });
        await ctx.react('✅');
      } else {
        await ctx.reply(formatError(`Could not retrieve Facebook video stream.`, 'FACEBOOK'));
      }
    }
  },
  {
    name: 'ig',
    aliases: ['insta', 'instagram'],
    category: 'Downloader',
    description: 'Download Instagram reels or posts',
    usage: '.ig <instagram-link>',
    handler: async (ctx: PluginContext) => {
      const url = ctx.args[0];
      if (!url) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.ig <instagram-link>*`, 'INSTAGRAM DOWNLOADER'));
        return;
      }

      await ctx.react('⏳');
      const media = await ctx.api.downloadMedia(url);
      if (media.downloadUrl) {
        await ctx.sock.sendMessage(ctx.chatJid, {
          video: { url: media.downloadUrl },
          caption: formatMessage(`📸 *Instagram Media*`, 'INSTAGRAM')
        });
        await ctx.react('✅');
      } else {
        await ctx.reply(formatError(`Could not retrieve Instagram media stream.`, 'INSTAGRAM'));
      }
    }
  },
  {
    name: 'tiktok',
    aliases: ['tt'],
    category: 'Downloader',
    description: 'Download TikTok video without watermark',
    usage: '.tiktok <tiktok-link>',
    handler: async (ctx: PluginContext) => {
      const url = ctx.args[0];
      if (!url) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.tiktok <tiktok-link>*`, 'TIKTOK DOWNLOADER'));
        return;
      }

      await ctx.react('⏳');
      const media = await ctx.api.downloadMedia(url);
      if (media.downloadUrl) {
        await ctx.sock.sendMessage(ctx.chatJid, {
          video: { url: media.downloadUrl },
          caption: formatMessage(`🎵 *TikTok Video*`, 'TIKTOK')
        });
        await ctx.react('✅');
      } else {
        await ctx.reply(formatError(`Could not retrieve TikTok video stream.`, 'TIKTOK'));
      }
    }
  },
  {
    name: 'play',
    aliases: ['song', 'music'],
    category: 'Search & Media',
    description: 'Search and stream high-fidelity 320kbps MP3 music',
    usage: '.play <song title or artist>',
    handler: async (ctx: PluginContext) => {
      const query = ctx.args.join(' ').trim();
      if (!query) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.play <song title>*\n\n_Example: .play Starboy The Weeknd_`, 'MUSIC PLAYER'));
        return;
      }

      await ctx.react('🎵');
      const song = await ctx.api.searchSong(query);

      await ctx.sock.sendMessage(ctx.chatJid, {
        audio: { url: song.downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${song.title}.mp3`
      });

      const body =
        `🎶 *Now Playing*: ${song.title}\n` +
        `👤 *Artist*: ${song.artist}\n` +
        (song.duration ? `⏱️ *Duration*: ${song.duration}\n` : '');

      await ctx.reply(formatMessage(body, 'NOW PLAYING'));
    }
  },
  {
    name: 'lyrics',
    category: 'Search & Media',
    description: 'Fetch lyrics for any track',
    usage: '.lyrics <song title>',
    handler: async (ctx: PluginContext) => {
      const query = ctx.args.join(' ').trim();
      if (!query) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.lyrics <song title>*`, 'LYRICS'));
        return;
      }

      await ctx.react('🔍');
      const res = await ctx.api.getLyrics(query);
      const body = `📜 *${res.title}* - ${res.artist}\n\n${res.lyrics}`;
      await ctx.reply(formatMessage(body, 'LYRICS FINDER'));
    }
  },
  {
    name: 'movie',
    category: 'Search & Media',
    description: 'Retrieve movie overview, rating, and cast details',
    usage: '.movie <movie title>',
    handler: async (ctx: PluginContext) => {
      const title = ctx.args.join(' ').trim();
      if (!title) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.movie <movie title>*`, 'MOVIE INFO'));
        return;
      }

      await ctx.react('🎬');
      const movie = await ctx.api.getMovie(title);

      const body =
        `🎬 *${movie.title}* (${movie.year})\n\n` +
        `⭐ *Rating*: ${movie.rating}\n` +
        `🎭 *Genre*: ${movie.genre}\n` +
        `👥 *Cast*: ${movie.actors}\n\n` +
        `📖 *Plot*:\n${movie.plot}`;

      const caption = formatMessage(body, 'CINEMA DATABASE');

      if (movie.poster) {
        await ctx.sock.sendMessage(ctx.chatJid, {
          image: { url: movie.poster },
          caption
        });
      } else {
        await ctx.reply(caption);
      }
    }
  },
  {
    name: 'trailer',
    category: 'Search & Media',
    description: 'Retrieve official movie trailer link',
    usage: '.trailer <movie title>',
    handler: async (ctx: PluginContext) => {
      const title = ctx.args.join(' ').trim();
      if (!title) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.trailer <movie title>*`, 'MOVIE TRAILER'));
        return;
      }

      await ctx.react('🎥');
      const trailer = await ctx.api.getTrailer(title);
      await ctx.reply(formatMessage(`🎥 *${trailer.title}*:\n🔗 ${trailer.videoUrl}`, 'MOVIE TRAILER'));
    }
  },
  {
    name: 'sticker',
    aliases: ['s'],
    category: 'Tools & Utilities',
    description: 'Convert replied or attached image/video into a WebP sticker with custom EXIF',
    usage: '.sticker (reply to image or video)',
    handler: async (ctx: PluginContext) => {
      const targetMsg = ctx.quoted || ctx.msg;
      const m = unwrapMessage(targetMsg.message);
      const isImage = !!(m?.imageMessage);
      const isVideo = !!(m?.videoMessage);

      if (!isImage && !isVideo) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: Reply to an image or short video with *.sticker*`, 'STICKER MAKER'));
        return;
      }

      await ctx.react('🎨');
      const buffer = await downloadMediaMessage(
        targetMsg as any,
        'buffer',
        {},
        {
          logger: undefined as any,
          reuploadRequest: ctx.sock.updateMediaMessage
        }
      );

      const stickerBuffer = await MediaPipeline.createSticker(buffer as Buffer, isVideo, {
        pack: BOT_NAME,
        author: OWNER_NAME
      });

      await ctx.sock.sendMessage(ctx.chatJid, {
        sticker: stickerBuffer
      });
    }
  },
  {
    name: 'toimg',
    category: 'Tools & Utilities',
    description: 'Convert a replied sticker into a regular image',
    usage: '.toimg (reply to sticker)',
    handler: async (ctx: PluginContext) => {
      const targetMsg = ctx.quoted || ctx.msg;
      const m = unwrapMessage(targetMsg.message);
      const isSticker = !!(m?.stickerMessage);

      if (!isSticker) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: Reply to a sticker with *.toimg*`, 'STICKER CONVERTER'));
        return;
      }

      await ctx.react('🖼️');
      const buffer = await downloadMediaMessage(
        targetMsg as any,
        'buffer',
        {},
        {
          logger: undefined as any,
          reuploadRequest: ctx.sock.updateMediaMessage
        }
      );

      await ctx.sock.sendMessage(ctx.chatJid, {
        image: buffer as Buffer,
        caption: formatMessage(`_Extracted photo from sticker_`, 'STICKER TO IMAGE')
      });
    }
  },
  {
    name: 'tomp3',
    category: 'Tools & Utilities',
    description: 'Convert replied video or voice note into high quality MP3',
    usage: '.tomp3 (reply to video or audio)',
    handler: async (ctx: PluginContext) => {
      const targetMsg = ctx.quoted || ctx.msg;
      const m = unwrapMessage(targetMsg.message);
      const isMedia = !!(m?.videoMessage || m?.audioMessage);

      if (!isMedia) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: Reply to an audio or video with *.tomp3*`, 'AUDIO CONVERTER'));
        return;
      }

      await ctx.react('🎧');
      const buffer = await downloadMediaMessage(
        targetMsg as any,
        'buffer',
        {},
        {
          logger: undefined as any,
          reuploadRequest: ctx.sock.updateMediaMessage
        }
      );

      const mp3 = await MediaPipeline.convertToMp3(buffer as Buffer, 320);

      await ctx.sock.sendMessage(ctx.chatJid, {
        audio: mp3,
        mimetype: 'audio/mpeg',
        fileName: 'audio.mp3'
      });
    }
  },
  {
    name: 'transcribe',
    aliases: ['stt'],
    category: 'Tools & Utilities',
    description: 'Transcribe replied voice note to text using Groq Whisper Large v3',
    usage: '.transcribe (reply to voice note)',
    handler: async (ctx: PluginContext) => {
      const targetMsg = ctx.quoted || ctx.msg;
      const m = unwrapMessage(targetMsg.message);
      const audioMsg = m?.audioMessage;

      if (!audioMsg) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: Reply to a voice note or audio file with *.transcribe*`, 'TRANSCRIPTION'));
        return;
      }

      await ctx.react('🎙️');

      let text = '';
      const quotedId = targetMsg.key?.id;
      if (quotedId) {
        const saved = await ctx.db.getMessageById(quotedId);
        if (saved && saved.content && saved.content.trim().length > 0) {
          text = saved.content.trim();
        }
      }

      if (!text) {
        const buffer = await downloadMediaMessage(
          targetMsg as any,
          'buffer',
          {},
          {
            logger: undefined as any,
            reuploadRequest: ctx.sock.updateMediaMessage
          }
        );

        text = await ctx.api.transcribeAudio(buffer as Buffer, audioMsg.mimetype || 'audio/ogg');
        if (quotedId && text) {
          await ctx.db.updateMessageContent(quotedId, text);
        }
      }

      const body = `📝 *Audio Transcript*:\n\n"${text}"`;
      await ctx.reply(formatMessage(body, 'VOICE TRANSCRIPTION'));
    }
  },
  {
    name: 'image',
    aliases: ['imagine', 'aiimg', 'dalle', 'gen'],
    category: 'Search & Media',
    description: 'Generate stunning AI images from a text prompt',
    usage: '.image <prompt>',
    handler: async (ctx: PluginContext) => {
      const prompt = ctx.args.join(' ').trim();
      if (!prompt) {
        await ctx.reply(formatMessage(`🎨 *AI Image Generator*\n\nUsage: *.image <description>*\n\n_Example: .image a cybernetic tiger in a neon cyberpunk city 8k_`, 'IMAGE GENERATOR'));
        return;
      }

      await ctx.react('🎨');
      try {
        const imageBuffer = await ctx.api.generateImage(prompt);
        await ctx.sock.sendMessage(ctx.chatJid, {
          image: imageBuffer,
          caption: formatMessage(`🎨 *AI Image Generated*\n\n💭 *Prompt*: "${prompt}"`, 'AI IMAGE')
        }, { quoted: ctx.msg as any });
      } catch (err: any) {
        await ctx.reply(formatError(`Failed to generate image: ${err.message}`, 'IMAGE GENERATOR'));
      }
    }
  }
];
