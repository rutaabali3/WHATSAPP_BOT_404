import { WASocket, proto } from '@whiskeysockets/baileys';
import { MessageRepository } from './db.js';
import { ApiClient } from './api.js';
import { OpsManager } from './ops.js';
import { AiGuide } from './ai-guide.js';
import { IntentEngine } from './intent-engine.js';
import { ErrorHandler } from './error-handler.js';

import { formatAlert, formatError } from './format.js';

export interface PluginContext {
  sock: WASocket;
  msg: proto.IWebMessageInfo;
  rawText: string;
  command: string;
  args: string[];
  senderJid: string;
  chatJid: string;
  isGroup: boolean;
  isOwner: boolean;
  isGroupAdmin: boolean;
  isBotAdmin: boolean;
  db: MessageRepository;
  api: ApiClient;
  ops: OpsManager;
  aiGuide: AiGuide;
  intentEngine: IntentEngine;
  quoted?: proto.IWebMessageInfo | null;
  targetJid?: string;
  reply: (text: string, options?: any) => Promise<any>;
  react: (emoji: string) => Promise<any>;
}

export interface PluginCommand {
  name: string;
  aliases?: string[];
  category: 'General' | 'Downloader' | 'Search & Media' | 'Group Management' | 'Admin & Settings' | 'Tools & Utilities' | 'Fun & Quotes';
  description: string;
  usage: string;
  ownerOnly?: boolean;
  privateAdminOnly?: boolean;
  handler: (ctx: PluginContext) => Promise<void>;
}

export class PluginManager {
  private commands = new Map<string, PluginCommand>();
  private aliases = new Map<string, string>();

  public register(cmd: PluginCommand): void {
    const primaryName = cmd.name.toLowerCase();
    this.commands.set(primaryName, cmd);

    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        this.aliases.set(alias.toLowerCase(), primaryName);
      }
    }
  }

  public getCommand(nameOrAlias: string): PluginCommand | undefined {
    const key = nameOrAlias.toLowerCase();
    const resolvedName = this.aliases.get(key) || key;
    return this.commands.get(resolvedName);
  }

  public getAllCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  public findClosestCommands(input: string, maxResults: number = 3): string[] {
    const key = input.toLowerCase().trim();
    if (!key) return [];

    const allKeys = new Set<string>();
    for (const name of this.commands.keys()) allKeys.add(name);
    for (const alias of this.aliases.keys()) allKeys.add(alias);

    const scored: { name: string; primary: string; dist: number }[] = [];

    for (const name of allKeys) {
      const primary = this.aliases.get(name) || name;
      const dist = this.levenshtein(key, name);
      const maxAllowed = key.length <= 3 ? 1 : key.length <= 5 ? 2 : 3;
      if (dist <= maxAllowed && dist > 0) {
        scored.push({ name, primary, dist });
      }
    }

    scored.sort((a, b) => a.dist - b.dist);

    const seen = new Set<string>();
    const results: string[] = [];
    for (const item of scored) {
      if (!seen.has(item.primary)) {
        seen.add(item.primary);
        results.push(item.primary);
        if (results.length >= maxResults) break;
      }
    }

    return results;
  }

  public async execute(ctx: PluginContext): Promise<boolean> {
    const cmd = this.getCommand(ctx.command);
    if (!cmd) return false;

    // 1. Role verification: Owner Only
    if (cmd.ownerOnly && !ctx.isOwner) {
      await ctx.reply(formatError(`Access Denied\n\nThis command (*.${cmd.name}*) is strictly restricted to the bot owner.`, 'PERMISSION DENIED'));
      return true;
    }

    // 2. Role verification: Owner / Private Admin Only
    if (cmd.privateAdminOnly) {
      if (!ctx.isGroup) {
        await ctx.reply(formatAlert(`Group Only\n\n*.${cmd.name}* can only be executed inside a WhatsApp group.`, 'GROUP REQUIRED', '⚠️'));
        return true;
      }
      if (!ctx.isOwner && !ctx.isGroupAdmin) {
        await ctx.reply(formatError(`Admin Access Required\n\nOnly group administrators or the bot owner can execute *.${cmd.name}*.`, 'ADMIN REQUIRED'));
        return true;
      }
    }

    // 3. Execution with Error Normalizer
    try {
      await cmd.handler(ctx);
    } catch (err: any) {
      console.error(`[PluginManager] Error executing command .${cmd.name}:`, err);
      const friendlyMessage = await ErrorHandler.logAndFormat(
        ctx.db,
        err,
        ctx.chatJid,
        `cmd_${cmd.name}`,
        { args: ctx.args, sender: ctx.senderJid }
      );
      await ctx.reply(friendlyMessage);
    }

    return true;
  }
}
