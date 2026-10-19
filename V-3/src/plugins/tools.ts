import { PluginCommand, PluginContext } from '../plugin.js';
import { formatMessage, formatError } from '../format.js';

export const toolCommands: PluginCommand[] = [
  {
    name: 'search',
    aliases: ['google', 'find'],
    category: 'Search & Media',
    description: 'SearXNG metasearch returning top 10 results with 0MB RAM footprint',
    usage: '.search <query>',
    handler: async (ctx: PluginContext) => {
      const query = ctx.args.join(' ').trim();
      if (!query) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.search <query>*\n\n_Example: .search latest quantum computing breakthrough_`, 'WEB SEARCH'));
        return;
      }

      await ctx.react('🔎');
      const results = await ctx.api.searchWeb(query, 10);

      if (results.length === 0) {
        await ctx.reply(formatMessage(`🔍 No results found for "${query}".`, 'WEB SEARCH'));
        return;
      }

      let response = `🔍 *Search Results for*: "${query}"\n\n`;
      results.forEach((r, idx) => {
        response += `*${idx + 1}. ${r.title}*\n`;
        if (r.snippet) {
          response += `_${r.snippet.replace(/\n+/g, ' ').slice(0, 150)}..._\n`;
        }
        response += `🔗 ${r.url}\n\n`;
      });

      await ctx.reply(formatMessage(response.trim(), 'WEB SEARCH'));
    }
  },
  {
    name: 'weather',
    category: 'Tools & Utilities',
    description: 'Fetch current weather conditions and temperature',
    usage: '.weather <city>',
    handler: async (ctx: PluginContext) => {
      const city = ctx.args.join(' ').trim() || 'London';
      await ctx.react('🌤️');
      const report = await ctx.api.getWeather(city);
      await ctx.reply(formatMessage(report, 'WEATHER FORECAST'));
    }
  },
  {
    name: 'shorten',
    aliases: ['tinyurl'],
    category: 'Tools & Utilities',
    description: 'Shorten a long URL into a compact link',
    usage: '.shorten <url>',
    handler: async (ctx: PluginContext) => {
      const url = ctx.args[0];
      if (!url) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.shorten <url>*`, 'URL SHORTENER'));
        return;
      }

      await ctx.react('✂️');
      const short = await ctx.api.shortenUrl(url);
      await ctx.reply(formatMessage(`🔗 *Shortened URL*:\n${short}`, 'URL SHORTENER'));
    }
  },
  {
    name: 'calc',
    aliases: ['math'],
    category: 'Tools & Utilities',
    description: 'Perform safe mathematical calculation',
    usage: '.calc <math expression>',
    handler: async (ctx: PluginContext) => {
      const expr = ctx.args.join(' ').trim();
      if (!expr) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.calc 25 * 4 + 10*`, 'CALCULATOR'));
        return;
      }

      // Safe arithmetic evaluator (only digits, operators, parens, spaces)
      if (!/^[0-9+\-*/().^%\s]+$/.test(expr)) {
        await ctx.reply(formatError(`Invalid mathematical expression. Only standard arithmetic is permitted.`, 'CALCULATOR'));
        return;
      }

      try {
        const sanitized = expr.replace(/\^/g, '**');
        const fn = new Function(`"use strict"; return (${sanitized});`);
        const result = fn();
        await ctx.reply(formatMessage(`🧮 *Expression*: \`${expr}\`\n📊 *Result*: *${result}*`, 'CALCULATOR'));
      } catch {
        await ctx.reply(formatError(`Failed to compute expression. Please check syntax.`, 'CALCULATOR'));
      }
    }
  }
];
