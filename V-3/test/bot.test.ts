import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IntentEngine } from '../src/intent-engine.js';
import { OpsManager } from '../src/ops.js';
import { MediaPipeline } from '../src/media-pipeline.js';
import { PluginManager, PluginContext } from '../src/plugin.js';

describe('WHATSAPP_BOT_404_V3 Test Suite', () => {
  describe('IntentEngine', () => {
    const engine = new IntentEngine('Rutaab');

    it('should detect zero-prefix sticker intent', () => {
      const parsed = engine.parseIntent('make sticker');
      assert.strictEqual(parsed.intent, 'sticker');
    });

    it('should detect zero-prefix play/music intent', () => {
      const parsed = engine.parseIntent('play Starboy');
      assert.strictEqual(parsed.intent, 'play');
      assert.strictEqual(parsed.query, 'Starboy');
    });

    it('should detect zero-prefix search intent', () => {
      const parsed = engine.parseIntent('search for artificial intelligence');
      assert.strictEqual(parsed.intent, 'search');
      assert.strictEqual(parsed.query, 'artificial intelligence');
    });

    it('should detect direct URL download intent', () => {
      const parsed = engine.parseIntent('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      assert.strictEqual(parsed.intent, 'download');
      assert.strictEqual(parsed.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should detect how-to question intent like "how to download video"', () => {
      const parsed = engine.parseIntent('how to download video');
      assert.strictEqual(parsed.intent, 'guide');
      assert.strictEqual(parsed.query, 'how to download video');
    });

    it('should trigger priority alert when Rutaab is mentioned', () => {
      const alert = engine.checkPriorityAlert('Hello Rutaab are you there?', '12345@s.whatsapp.net', 'John');
      assert.ok(alert !== null);
      assert.strictEqual(alert?.type, 'mention');
      assert.strictEqual(alert?.keyword, 'rutaab');
    });

    it('should trigger urgent priority alert on emergency keywords', () => {
      const alert = engine.checkPriorityAlert('This is an emergency please help', '12345@s.whatsapp.net', 'Alice');
      assert.ok(alert !== null);
      assert.strictEqual(alert?.type, 'urgent');
      assert.strictEqual(alert?.keyword, 'emergency');
    });
  });

  describe('OpsManager & Rate Limiter', () => {
    const ops = new OpsManager(9999);

    it('should provide accurate telemetry metrics', () => {
      const t = ops.getTelemetry();
      assert.ok(typeof t.memoryRssMb === 'number');
      assert.ok(typeof t.uptimeSeconds === 'number');
      assert.ok(t.platform.length > 0);
    });

    it('should rate limit requests exceeding window threshold', () => {
      const testJid = 'ratetest@s.whatsapp.net';
      for (let i = 0; i < 5; i++) {
        const res = ops.checkRateLimit(testJid, 5);
        if (i < 4) {
          assert.strictEqual(res.allowed, true);
        } else {
          assert.strictEqual(res.allowed, true);
        }
      }
      const blocked = ops.checkRateLimit(testJid, 5);
      assert.strictEqual(blocked.allowed, false);
      assert.strictEqual(blocked.remaining, 0);
    });
  });

  describe('MediaPipeline EXIF Injector', () => {
    it('should safely add WebP EXIF chunk without corrupting data', () => {
      // Mock minimal RIFF WEBP header (12 bytes)
      const fakeWebp = Buffer.alloc(12);
      fakeWebp.write('RIFF', 0);
      fakeWebp.writeUInt32LE(4, 4);
      fakeWebp.write('WEBP', 8);

      const modified = MediaPipeline.addExifMetadata(fakeWebp, 'BOT_404_V3', 'Rutaab');
      assert.ok(modified.length > fakeWebp.length);
      assert.ok(modified.includes(Buffer.from('Rutaab')));
      assert.ok(modified.includes(Buffer.from('BOT_404_V3')));
    });
  });

  describe('PluginManager & Role Guards', () => {
    const manager = new PluginManager();
    let ownerExecuted = false;

    manager.register({
      name: 'testowner',
      category: 'Admin & Settings',
      description: 'Owner only command',
      usage: '.testowner',
      ownerOnly: true,
      handler: async () => {
        ownerExecuted = true;
      }
    });

    it('should block non-owner from executing ownerOnly command', async () => {
      let replyCalled = false;
      const ctx = {
        command: 'testowner',
        isOwner: false,
        reply: async () => {
          replyCalled = true;
        }
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.strictEqual(replyCalled, true);
      assert.strictEqual(ownerExecuted, false);
    });

    it('should allow owner to execute ownerOnly command', async () => {
      const ctx = {
        command: 'testowner',
        isOwner: true,
        reply: async () => {}
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.strictEqual(ownerExecuted, true);
    });
  });

  describe('Games Suite', () => {
    it('should execute roll dice and return 1-6', async () => {
      const manager = new PluginManager();
      const { funCommands } = await import('../src/plugins/fun.js');
      for (const cmd of funCommands) manager.register(cmd);

      let replyMsg = '';
      const ctx = {
        command: 'roll',
        args: [],
        react: async () => {},
        reply: async (msg: string) => {
          replyMsg = msg;
        }
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.ok(replyMsg.includes('Dice Roll'));
    });

    it('should execute flip coin and return heads or tails', async () => {
      const manager = new PluginManager();
      const { funCommands } = await import('../src/plugins/fun.js');
      for (const cmd of funCommands) manager.register(cmd);

      let replyMsg = '';
      const ctx = {
        command: 'flip',
        args: [],
        react: async () => {},
        reply: async (msg: string) => {
          replyMsg = msg;
        }
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.ok(replyMsg.includes('Coin Flip'));
    });

    it('should display user ID game profile and statistics', async () => {
      const manager = new PluginManager();
      const { funCommands } = await import('../src/plugins/fun.js');
      for (const cmd of funCommands) manager.register(cmd);

      let replyMsg = '';
      const ctx = {
        command: 'profile',
        args: [],
        senderJid: '923192342358@s.whatsapp.net',
        msg: { message: {} },
        react: async () => {},
        db: {
          getUserGameProfile: async (jid: string) => ({
            jid,
            totalGames: 12,
            wins: 9,
            losses: 2,
            draws: 1,
            score: 145,
            winRate: 75
          })
        },
        reply: async (msg: string) => {
          replyMsg = msg;
        }
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.ok(replyMsg.includes('PLAYER GAME PROFILE'));
      assert.ok(replyMsg.includes('923192342358'));
      assert.ok(replyMsg.includes('145 XP'));
    });

    it('should display user ID match history', async () => {
      const manager = new PluginManager();
      const { funCommands } = await import('../src/plugins/fun.js');
      for (const cmd of funCommands) manager.register(cmd);

      let replyMsg = '';
      const ctx = {
        command: 'gamehistory',
        args: [],
        senderJid: '923192342358@s.whatsapp.net',
        msg: { message: {} },
        react: async () => {},
        db: {
          getUserGameHistory: async () => [
            {
              id: 1,
              jid: '923192342358@s.whatsapp.net',
              gameName: 'quiz',
              result: 'win',
              pointsChange: 10,
              createdAt: new Date()
            }
          ]
        },
        reply: async (msg: string) => {
          replyMsg = msg;
        }
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.ok(replyMsg.includes('MATCH HISTORY'));
      assert.ok(replyMsg.includes('QUIZ'));
      assert.ok(replyMsg.includes('+10'));
    });

    it('should execute .games command and return game suite directory', async () => {
      const manager = new PluginManager();
      const { funCommands } = await import('../src/plugins/fun.js');
      for (const cmd of funCommands) manager.register(cmd);

      let replyMsg = '';
      const ctx = {
        command: 'games',
        args: [],
        react: async () => {},
        reply: async (msg: string) => {
          replyMsg = msg;
        }
      } as any;

      const handled = await manager.execute(ctx);
      assert.strictEqual(handled, true);
      assert.ok(replyMsg.includes('INTERACTIVE GAMING SUITE'));
      assert.ok(replyMsg.includes('.quiz'));
      assert.ok(replyMsg.includes('.tictactoe'));
    });
  });

  describe('Universal Formatter (format.ts)', () => {
    it('should format message with header line, divider, content, and footer line', async () => {
      const { formatMessage, formatError, BOT_NAME, POWERED_BY } = await import('../src/format.js');
      const formatted = formatMessage('Hello world test', 'TEST TITLE');

      assert.ok(formatted.startsWith(`🤖 *${BOT_NAME}* • TEST TITLE\n────────────────`));
      assert.ok(formatted.includes('Hello world test'));
      assert.ok(formatted.endsWith(`────────────────\n${POWERED_BY}`));
    });

    it('should format error with error header, divider, and powered by footer', async () => {
      const { formatError, BOT_NAME, POWERED_BY } = await import('../src/format.js');
      const formatted = formatError('Something failed');

      assert.ok(formatted.includes(`⚠️ *${BOT_NAME}* • ERROR\n────────────────`));
      assert.ok(formatted.includes('❌ Something failed'));
      assert.ok(formatted.includes(`${POWERED_BY}`));
    });

    it('should convert standard ASCII text into mathematical sans-serif italic', async () => {
      const { toFancyItalic } = await import('../src/format.js');
      assert.strictEqual(toFancyItalic('Septorch'), '𝘚𝘦𝘱𝘵𝘰𝘳𝘤𝘩');
      assert.strictEqual(toFancyItalic('Powered by'), '𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺');
      assert.strictEqual(toFancyItalic('BOT 404'), '𝘉𝘖𝘛 404');
    });

    it('should construct welcome card matching the exact box layout without hardcoding Septorch', async () => {
      const { formatWelcomeCard, BOT_NAME } = await import('../src/format.js');
      const card = formatWelcomeCard('TEST COMMUNITY HUB', '@923192342358');

      // Header & borders
      assert.ok(card.startsWith('┌── ⚡ WELCOME TO TEST COMMUNITY HUB ──┐'));
      assert.ok(card.includes('│ 👋 Welcome @923192342358!'));
      assert.ok(card.includes('│ Welcome to the home of high-speed WhatsApp AI automation.'));
      assert.ok(card.includes('│ 🛡️ Community Perks & Alerts:'));
      assert.ok(card.includes('│ • ⚡ Uptime & Server Alerts: Real-time notices when servers update or reboot.'));
      assert.ok(card.includes('│ • 🛡️ Anti-Ban Shield: WhatsApp safety advice to keep your accounts secure.'));
      assert.ok(card.includes('│ • 🚀 New Features & Drops: First access to new AI commands & tools.'));
      assert.ok(card.includes('│ • 🎁 Free Giveaways & VIP Perks: Priority bandwidth & community rewards.'));
      assert.ok(card.includes('│ ⚠️ CRITICAL NOTICE:'));
      assert.ok(card.includes('│ If the chat gets too active, MUTE the notifications — please DO NOT LEAVE!'));

      // Dynamic footer with fancy italic Powered by
      assert.ok(card.includes('└── ◦ 𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘣𝘺'));
      // Must NOT contain hardcoded Septorch
      assert.ok(!card.includes('Septorch'));
      assert.ok(!card.includes('𝘚𝘦𝘱𝘵𝘰𝘳𝘤𝘩'));
    });
  });

  describe('Fuzzy Unknown Command Matching (PluginManager.findClosestCommands)', () => {
    it('should suggest .games / .game when user types .gome', async () => {
      const manager = new PluginManager();
      const { funCommands } = await import('../src/plugins/fun.js');
      const { generalCommands } = await import('../src/plugins/general.js');
      for (const cmd of funCommands) manager.register(cmd);
      for (const cmd of generalCommands) manager.register(cmd);

      const suggestions = manager.findClosestCommands('gome');
      assert.ok(suggestions.length > 0);
      assert.ok(suggestions.includes('games'));
    });

    it('should suggest .search when user types .searcj', async () => {
      const manager = new PluginManager();
      const { toolCommands } = await import('../src/plugins/tools.js');
      for (const cmd of toolCommands) manager.register(cmd);

      const suggestions = manager.findClosestCommands('searcj');
      assert.ok(suggestions.includes('search'));
    });

    it('should return empty suggestions for random gibberish', async () => {
      const manager = new PluginManager();
      const { generalCommands } = await import('../src/plugins/general.js');
      for (const cmd of generalCommands) manager.register(cmd);

      const suggestions = manager.findClosestCommands('xyz987qwer');
      assert.strictEqual(suggestions.length, 0);
    });

    it('should confirm .ai command has been removed from generalCommands', async () => {
      const { generalCommands } = await import('../src/plugins/general.js');
      const aiCmd = generalCommands.find(c => c.name === 'ai');
      assert.strictEqual(aiCmd, undefined);
    });
  });

  describe('Group Welcome System & Plugin', () => {
    it('should register .welcome command with privateAdminOnly guard', async () => {
      const { groupCommands } = await import('../src/plugins/group.js');
      const welcomeCmd = groupCommands.find((c) => c.name === 'welcome');
      assert.ok(welcomeCmd);
      assert.strictEqual(welcomeCmd?.privateAdminOnly, true);
      assert.strictEqual(welcomeCmd?.category, 'Group Management');
    });

    it('should handle .welcome test subcommand and send preview', async () => {
      const { groupCommands } = await import('../src/plugins/group.js');
      const welcomeCmd = groupCommands.find((c) => c.name === 'welcome')!;

      let sentMsg = '';
      let sentMentions: string[] = [];

      const ctx: any = {
        isGroup: true,
        chatJid: '123456789@g.us',
        senderJid: '923192342358@s.whatsapp.net',
        isGroupAdmin: true,
        isBotAdmin: true,
        args: ['test'],
        sock: {
          groupMetadata: async () => ({ subject: 'TEST COMMUNITY' }),
          sendMessage: async (jid: string, content: any) => {
            sentMsg = content.text;
            sentMentions = content.mentions;
          }
        },
        reply: async () => {}
      };

      await welcomeCmd.handler(ctx);
      assert.ok(sentMsg.includes('WELCOME TO TEST COMMUNITY'));
      assert.ok(sentMsg.includes('@923192342358'));
      assert.deepStrictEqual(sentMentions, ['923192342358@s.whatsapp.net']);
    });

    it('should toggle welcome setting on and off', async () => {
      const { groupCommands } = await import('../src/plugins/group.js');
      const welcomeCmd = groupCommands.find((c) => c.name === 'welcome')!;

      const settingsStore = new Map<string, string>();
      const mockDb: any = {
        setSetting: async (key: string, val: string) => {
          settingsStore.set(key, val);
        },
        getSetting: async (key: string, def = 'on') => {
          return settingsStore.get(key) || def;
        }
      };

      let replyMsg = '';
      const ctxOn: any = {
        isGroup: true,
        chatJid: 'test_group@g.us',
        senderJid: '923192342358@s.whatsapp.net',
        isGroupAdmin: true,
        isBotAdmin: true,
        args: ['on'],
        db: mockDb,
        reply: async (msg: string) => { replyMsg = msg; }
      };

      await welcomeCmd.handler(ctxOn);
      assert.strictEqual(settingsStore.get('welcome_test_group@g.us'), 'on');
      assert.ok(replyMsg.includes('Welcome Messages Enabled'));

      const ctxOff: any = {
        ...ctxOn,
        args: ['off']
      };
      await welcomeCmd.handler(ctxOff);
      assert.strictEqual(settingsStore.get('welcome_test_group@g.us'), 'off');
      assert.ok(replyMsg.includes('Welcome Messages Disabled'));
    });

    it('should be disabled by default and isolate settings between groups', async () => {
      const { groupCommands } = await import('../src/plugins/group.js');
      const welcomeCmd = groupCommands.find((c) => c.name === 'welcome')!;

      const settingsStore = new Map<string, string>();
      const mockDb: any = {
        setSetting: async (key: string, val: string) => {
          settingsStore.set(key, val);
        },
        getSetting: async (key: string, def = 'off') => {
          return settingsStore.get(key) || def;
        }
      };

      let replyMsg = '';
      const ctxGroupA: any = {
        isGroup: true,
        chatJid: 'group_A@g.us',
        senderJid: '923192342358@s.whatsapp.net',
        isGroupAdmin: true,
        isBotAdmin: true,
        args: [], // status query
        db: mockDb,
        sock: {
          groupMetadata: async () => ({ subject: 'Group A' })
        },
        reply: async (msg: string) => { replyMsg = msg; }
      };

      // 1. Initial status in Group A should be DISABLED by default
      await welcomeCmd.handler(ctxGroupA);
      assert.ok(replyMsg.includes('DISABLED (Default)'));

      // 2. Enable in Group A
      ctxGroupA.args = ['on'];
      await welcomeCmd.handler(ctxGroupA);
      assert.strictEqual(settingsStore.get('welcome_group_A@g.us'), 'on');

      // 3. Query Group B - should STILL be disabled by default
      const ctxGroupB: any = {
        ...ctxGroupA,
        chatJid: 'group_B@g.us',
        args: [],
        sock: {
          groupMetadata: async () => ({ subject: 'Group B' })
        },
        reply: async (msg: string) => { replyMsg = msg; }
      };

      await welcomeCmd.handler(ctxGroupB);
      assert.ok(replyMsg.includes('DISABLED (Default)'));
      assert.strictEqual(await mockDb.getSetting('welcome_group_B@g.us', 'off'), 'off');
    });
  });
});


