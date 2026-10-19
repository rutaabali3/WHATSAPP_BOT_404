import { PluginCommand, PluginContext } from '../plugin.js';
import { formatMessage, OWNER_NAME } from '../format.js';

export const generalCommands: PluginCommand[] = [
  {
    name: 'menu',
    aliases: ['help', 'commands', 'list'],
    category: 'General',
    description: 'Display the mobile-optimized command directory',
    usage: '.menu',
    handler: async (ctx: PluginContext) => {
      const isOwner = ctx.isOwner;
      const isGroupAdmin = ctx.isGroupAdmin;

      let menu = `👤 *Owner*: ${OWNER_NAME}\n`;
      menu += `📊 *RAM*: ${ctx.ops.getTelemetry().memoryRssMb} MB\n`;
      menu += `🕒 *Uptime*: ${ctx.ops.getTelemetry().uptimeFormatted}\n\n`;

      menu += `╭──「 🤖 *AI ASSISTANT* 」\n│\n`;
      menu += `│ 📌 Tag *@bot <question>*\n│ _Chat with AI assistant (15/day)_\n│\n`;
      menu += `╰───────────────────╯\n\n`;

      menu += `╭──「 📥 *DOWNLOADERS* 」\n│\n`;
      menu += `│ 📌 *.alldl <url>*\n│ _Universal media downloader_\n│\n`;
      menu += `│ 📌 *.yt <url>*\n│ _YouTube video downloader_\n│\n`;
      menu += `│ 📌 *.fb <url>*\n│ _Facebook video downloader_\n│\n`;
      menu += `│ 📌 *.ig <url>*\n│ _Instagram video / reel_\n│\n`;
      menu += `│ 📌 *.tiktok <url>*\n│ _TikTok video without watermark_\n│\n`;
      menu += `╰───────────────────╯\n\n`;

      menu += `╭──「 🎵 *MUSIC & MOVIES* 」\n│\n`;
      menu += `│ 📌 *.play <song>*\n│ _Stream 320kbps MP3 audio_\n│\n`;
      menu += `│ 📌 *.song <song>*\n│ _High quality music finder_\n│\n`;
      menu += `│ 📌 *.lyrics <title>*\n│ _Search full track lyrics_\n│\n`;
      menu += `│ 📌 *.movie <title>*\n│ _Plot, rating & cast details_\n│\n`;
      menu += `│ 📌 *.trailer <title>*\n│ _Official movie trailer link_\n│\n`;
      menu += `╰───────────────────╯\n\n`;

      menu += `╭──「 🖼️ *MEDIA & AI TOOLS* 」\n│\n`;
      menu += `│ 📌 *.image <prompt>*\n│ _Generate stunning AI images_\n│\n`;
      menu += `│ 📌 *.sticker* (or *.s*)\n│ _Convert image/video to sticker_\n│\n`;
      menu += `│ 📌 *.toimg*\n│ _Extract image from sticker_\n│\n`;
      menu += `│ 📌 *.tomp3*\n│ _Convert video/audio to MP3_\n│\n`;
      menu += `│ 📌 *.transcribe*\n│ _Voice note speech-to-text_\n│\n`;
      menu += `╰───────────────────╯\n\n`;

      menu += `╭──「 🔍 *SEARCH & TOOLS* 」\n│\n`;
      menu += `│ 📌 *.search <query>*\n│ _SearXNG web search (top 10)_\n│\n`;
      menu += `│ 📌 *.weather <city>*\n│ _Live weather forecasts_\n│\n`;
      menu += `│ 📌 *.shorten <url>*\n│ _URL shortener utility_\n│\n`;
      menu += `│ 📌 *.calc <math>*\n│ _Mathematical calculator_\n│\n`;
      menu += `╰───────────────────╯\n\n`;

      menu += `╭──「 🎮 *GAMES & FUN* 」\n│\n`;
      menu += `│ 📌 *.games* (or *.game*)\n│ _View all interactive games_\n│\n`;
      menu += `│ 📌 *.quiz* (or *.trivia*)\n│ _Interactive trivia challenge_\n│\n`;
      menu += `│ 📌 *.answer <A/B/C/D>*\n│ _Submit quiz answer_\n│\n`;
      menu += `│ 📌 *.tictactoe* (or *.ttt*)\n│ _Play Tic-Tac-Toe vs Bot/Friend_\n│\n`;
      menu += `│ 📌 *.rps <rock/paper/scissors>*\n│ _Rock Paper Scissors challenge_\n│\n`;
      menu += `│ 📌 *.profile [@user]*\n│ _View personal game stats & rank_\n│\n`;
      menu += `│ 📌 *.gamehistory [@user]*\n│ _View recent match history_\n│\n`;
      menu += `│ 📌 *.leaderboard*\n│ _Global top player rankings_\n│\n`;
      menu += `│ 📌 *.roll*\n│ _Roll a 6-sided dice_\n│\n`;
      menu += `│ 📌 *.flip*\n│ _Flip a coin (Heads/Tails)_\n│\n`;
      menu += `│ 📌 *.hack [target]*\n│ _Prank terminal hacking simulation_\n│\n`;
      menu += `│ 📌 *.quote*\n│ _Daily motivational quote_\n│\n`;
      menu += `│ 📌 *.fact*\n│ _Curated interesting fact_\n│\n`;
      menu += `│ 📌 *.news*\n│ _Top current headlines_\n│\n`;
      menu += `╰───────────────────╯\n\n`;

      if (ctx.isGroup && (isOwner || isGroupAdmin)) {
        menu += `╭──「 👥 *GROUP ADMIN* 」\n│\n`;
        menu += `│ 📌 *.kick*\n│ _Remove user (reply to msg)_\n│\n`;
        menu += `│ 📌 *.promote*\n│ _Make admin (reply to msg)_\n│\n`;
        menu += `│ 📌 *.demote*\n│ _Remove admin (reply to msg)_\n│\n`;
        menu += `│ 📌 *.add <number>*\n│ _Add phone number to group_\n│\n`;
        menu += `│ 📌 *.mute*\n│ _Silence group to admins only_\n│\n`;
        menu += `│ 📌 *.unmute*\n│ _Open group to all members_\n│\n`;
        menu += `│ 📌 *.link*\n│ _Get group invite link_\n│\n`;
        menu += `│ 📌 *.revoke*\n│ _Revoke group invite link_\n│\n`;
        menu += `│ 📌 *.tagall [msg]*\n│ _Mention all group members_\n│\n`;
        menu += `│ 📌 *.hidetag [msg]*\n│ _Ghost tag announcement_\n│\n`;
        menu += `│ 📌 *.groupstatus*\n│ _Group metadata & statistics_\n│\n`;
        menu += `│ 📌 *.welcome [on/off/test]*\n│ _New member automated greeting card_\n│\n`;
        menu += `╰───────────────────╯\n\n`;
      }

      if (isOwner) {
        menu += `╭──「 👑 *OWNER CONTROLS* 」\n│\n`;
        menu += `│ 📌 *.story [text/caption]*\n│ _Post directly to WhatsApp Status_\n│\n`;
        menu += `│ 📌 *.stats*\n│ _Process telemetry & DB metrics_\n│\n`;
        menu += `│ 📌 *.antidelete [on/off]*\n│ _Intercept deleted messages_\n│\n`;
        menu += `│ 📌 *.antiedit [on/off]*\n│ _Intercept edited messages_\n│\n`;
        menu += `│ 📌 *.antistatus [on/off]*\n│ _Auto-download status updates_\n│\n`;
        menu += `│ 📌 *.autostatus [on/off]*\n│ _Auto-view status stories_\n│\n`;
        menu += `│ 📌 *.bot [on/off]*\n│ _Master bot switch_\n│\n`;
        menu += `╰───────────────────╯\n\n`;
      }

      menu += `💡 _Tag *@bot <question>* to ask AI anything!_`;
      await ctx.reply(formatMessage(menu, 'COMMAND DIRECTORY'));
    }
  },
  {
    name: 'ping',
    category: 'General',
    description: 'Check bot responsiveness and database latency',
    usage: '.ping',
    handler: async (ctx: PluginContext) => {
      const start = Date.now();
      await ctx.db.pool.query('SELECT 1');
      const dbLatency = Date.now() - start;

      const body =
        `⚡ *Pong!*\n\n` +
        `• *DB Latency*: ${dbLatency}ms\n` +
        `• *Process Uptime*: ${ctx.ops.getTelemetry().uptimeFormatted}\n` +
        `• *RAM Usage*: ${ctx.ops.getTelemetry().memoryRssMb} MB`;

      await ctx.reply(formatMessage(body, 'PING'));
    }
  },
  {
    name: 'alive',
    category: 'General',
    description: 'Verify active bot lifecycle status',
    usage: '.alive',
    handler: async (ctx: PluginContext) => {
      const t = ctx.ops.getTelemetry();
      const body =
        `🟢 *SYSTEM STATUS: ONLINE*\n\n` +
        `• *Architect*: ${OWNER_NAME}\n` +
        `• *Runtime*: Node.js ${t.nodeVersion} (ESM)\n` +
        `• *Platform*: ${t.platform}\n` +
        `• *Memory RSS*: ${t.memoryRssMb} MB / 800 MB cap\n` +
        `• *Heap Used*: ${t.memoryHeapUsedMb} MB\n` +
        `• *Uptime*: ${t.uptimeFormatted}`;

      await ctx.reply(formatMessage(body, 'SYSTEM STATUS'));
    }
  }
];
