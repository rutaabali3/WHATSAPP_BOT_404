import axios from 'axios';
import { PluginCommand, PluginContext } from '../plugin.js';
import { formatMessage, OWNER_NAME } from '../format.js';

interface ActiveQuiz {
  question: string;
  correctAnswer: string;
  options: string[];
  expiresAt: number;
}

interface TicTacToeGame {
  board: string[];
  playerX: string;
  playerO: string;
  currentTurn: 'X' | 'O';
}

const activeQuizzes = new Map<string, ActiveQuiz>();
const activeTicTacToe = new Map<string, TicTacToeGame>();

const CURATED_QUIZ_BANK = [
  {
    q: "Which planet is known as the Red Planet?",
    correct: "Mars",
    incorrect: ["Venus", "Jupiter", "Mercury"]
  },
  {
    q: "What is the capital of Australia?",
    correct: "Canberra",
    incorrect: ["Sydney", "Melbourne", "Brisbane"]
  },
  {
    q: "Who is the creator and architect of BOT_404?",
    correct: OWNER_NAME,
    incorrect: ["Elon Musk", "Mark Zuckerberg", "Sam Altman"]
  },
  {
    q: "What programming language was used to build Baileys WhatsApp bot engine?",
    correct: "TypeScript / Node.js",
    incorrect: ["Python", "PHP", "C#"]
  },
  {
    q: "What is the speed of light in vacuum?",
    correct: "299,792 km/s",
    incorrect: ["150,000 km/s", "384,400 km/s", "1,000,000 km/s"]
  }
];

function getRankTitle(score: number): string {
  if (score >= 500) return '👑 Grandmaster';
  if (score >= 250) return '💎 Master';
  if (score >= 100) return '⚔️ Veteran';
  if (score >= 50) return '🛡️ Challenger';
  return '🌱 Novice';
}

export const funCommands: PluginCommand[] = [
  {
    name: 'games',
    aliases: ['game'],
    category: 'Fun & Quotes',
    description: 'View the interactive gaming suite directory',
    usage: '.games',
    handler: async (ctx: PluginContext) => {
      const content =
        `🎮 *INTERACTIVE GAMING SUITE*\n\n` +
        `• *.quiz* (or *.trivia*) — Trivia challenge with score rewards\n` +
        `• *.tictactoe* (or *.ttt*) — Play Tic-Tac-Toe vs Bot or friend\n` +
        `• *.rps <rock/paper/scissors>* — Rock Paper Scissors match\n` +
        `• *.roll* — Roll a 6-sided dice\n` +
        `• *.flip* — Flip a coin (Heads/Tails)\n` +
        `• *.hack [target]* — Terminal hacking prank simulation\n` +
        `• *.profile [@user]* — View XP, score, and rank\n` +
        `• *.gamehistory [@user]* — View recent match history\n` +
        `• *.leaderboard* — Global player rankings\n\n` +
        `_Earn XP and climb the leaderboard!_`;

      await ctx.reply(formatMessage(content, 'GAMES'));
    }
  },
  {
    name: 'quote',
    category: 'Fun & Quotes',
    description: 'Fetch an inspirational and philosophical quote',
    usage: '.quote',
    handler: async (ctx: PluginContext) => {
      await ctx.react('💬');
      const quote = await ctx.api.getQuote();
      await ctx.reply(formatMessage(`📜 ${quote}`, 'QUOTE'));
    }
  },
  {
    name: 'fact',
    category: 'Fun & Quotes',
    description: 'Discover an interesting educational fact',
    usage: '.fact',
    handler: async (ctx: PluginContext) => {
      await ctx.react('💡');
      const fact = await ctx.api.getFact();
      await ctx.reply(formatMessage(`💡 ${fact}`, 'FACT'));
    }
  },
  {
    name: 'news',
    category: 'Fun & Quotes',
    description: 'Display top current news headlines',
    usage: '.news',
    handler: async (ctx: PluginContext) => {
      await ctx.react('📰');
      const news = await ctx.api.getNews();
      await ctx.reply(formatMessage(`📰 *Top Headlines*:\n\n${news}`, 'NEWS'));
    }
  },
  {
    name: 'hack',
    category: 'Fun & Quotes',
    description: 'Interactive prank terminal hacking simulation',
    usage: '.hack [target name or @mention]',
    handler: async (ctx: PluginContext) => {
      const target = ctx.args.join(' ').trim() || (ctx.quoted?.key?.participant ? `@${ctx.quoted.key.participant.split('@')[0]}` : 'Target Device');
      await ctx.react('💻');

      const steps = [
        `💻 *[HACK INITIALIZED]* Targeting: *${target}*`,
        `🔍 Probing open ports (SSH:22, HTTP:80, DB:3306)...`,
        `💉 Injecting buffer overflow exploit: \`0x404_V3_ROOT\`...`,
        `🔓 Firewall bypassed. Decrypting WhatsApp chat database...`,
        `📦 Downloading 2.4 GB media & chat archives...`,
        `📱 Injecting persistent RAT backdoor into kernel...`,
        `✅ *HACK COMPLETE!*\n\nTarget *${target}* successfully compromised.\n_All data forwarded to command center._`
      ];

      for (let i = 0; i < steps.length; i++) {
        if (i === steps.length - 1) {
          await ctx.reply(formatMessage(steps[i], 'HACK SIMULATION'));
        } else {
          await ctx.reply(steps[i]);
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }
  },
  {
    name: 'quiz',
    aliases: ['trivia'],
    category: 'Fun & Quotes',
    description: 'Interactive trivia & quiz challenge with multiple-choice options',
    usage: '.quiz (or .answer <letter> to submit)',
    handler: async (ctx: PluginContext) => {
      await ctx.react('🎯');

      let qData = CURATED_QUIZ_BANK[Math.floor(Math.random() * CURATED_QUIZ_BANK.length)];

      try {
        const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 4000 });
        if (res.data?.results?.length > 0) {
          const item = res.data.results[0];
          qData = {
            q: decodeHtml(item.question),
            correct: decodeHtml(item.correct_answer),
            incorrect: item.incorrect_answers.map(decodeHtml)
          };
        }
      } catch {
        // Fallback to local curated question bank
      }

      const allOptions = [...qData.incorrect, qData.correct].sort(() => Math.random() - 0.5);
      const letterOptions = ['A', 'B', 'C', 'D'];
      const correctIndex = allOptions.indexOf(qData.correct);
      const correctLetter = letterOptions[correctIndex];

      activeQuizzes.set(ctx.chatJid, {
        question: qData.q,
        correctAnswer: correctLetter,
        options: allOptions,
        expiresAt: Date.now() + 60000
      });

      let text = `🧠 *TRIVIA QUIZ CHALLENGE*\n\n`;
      text += `❓ *Question*: ${qData.q}\n\n`;
      allOptions.forEach((opt, idx) => {
        text += `*${letterOptions[idx]}*) ${opt}\n`;
      });
      text += `\n⏱️ _You have 60 seconds to answer._\n`;
      text += `👉 Reply with *.answer <letter>* (e.g. *.answer A*)`;

      await ctx.reply(formatMessage(text, 'TRIVIA QUIZ'));
    }
  },
  {
    name: 'answer',
    aliases: ['ans'],
    category: 'Fun & Quotes',
    description: 'Submit your answer to the active quiz and log score to user history',
    usage: '.answer <A/B/C/D>',
    handler: async (ctx: PluginContext) => {
      const active = activeQuizzes.get(ctx.chatJid);
      if (!active || Date.now() > active.expiresAt) {
        await ctx.reply(formatMessage(`⚠️ No active quiz session in this chat. Start one with *.quiz*!`, 'QUIZ'));
        return;
      }

      const userChoice = ctx.args[0]?.toUpperCase().trim();
      if (!['A', 'B', 'C', 'D'].includes(userChoice)) {
        await ctx.reply(formatMessage(`⚠️ Please choose a valid letter: *A*, *B*, *C*, or *D*. (e.g. *.answer A*)`, 'QUIZ'));
        return;
      }

      const senderName = ctx.msg.pushName || undefined;

      if (userChoice === active.correctAnswer) {
        await ctx.react('🎉');
        await ctx.db.recordGameResult(
          ctx.senderJid,
          'quiz',
          'win',
          10,
          undefined,
          senderName,
          { question: active.question }
        );

        const profile = await ctx.db.getUserGameProfile(ctx.senderJid);

        const body =
          `🎉 *CORRECT!*\n\n` +
          `Option *${active.correctAnswer}* was the right answer!\n` +
          `➕ *+10 Points* awarded!\n` +
          `🏆 Total Score: *${profile.score} pts* (${getRankTitle(profile.score)})\n\n` +
          `Great job, @${ctx.senderJid.split('@')[0]}!`;

        await ctx.reply(formatMessage(body, 'QUIZ RESULT'), { mentions: [ctx.senderJid] });
      } else {
        await ctx.react('❌');
        await ctx.db.recordGameResult(
          ctx.senderJid,
          'quiz',
          'loss',
          0,
          undefined,
          senderName,
          { question: active.question }
        );

        const body =
          `❌ *WRONG ANSWER!*\n\n` +
          `You picked *${userChoice}*, but the correct answer was *${active.correctAnswer}*.\n` +
          `Better luck next time!`;

        await ctx.reply(formatMessage(body, 'QUIZ RESULT'));
      }

      activeQuizzes.delete(ctx.chatJid);
    }
  },
  {
    name: 'tictactoe',
    aliases: ['ttt'],
    category: 'Fun & Quotes',
    description: 'Play Tic-Tac-Toe on WhatsApp with user ID score history',
    usage: '.tictactoe [@opponent or move 1-9]',
    handler: async (ctx: PluginContext) => {
      let game = activeTicTacToe.get(ctx.chatJid);
      const arg = ctx.args[0]?.trim();

      // If user provided a move (1-9)
      if (arg && /^[1-9]$/.test(arg)) {
        if (!game) {
          await ctx.reply(formatMessage(`⚠️ No active game. Start a new game with *.tictactoe*!`, 'TIC-TAC-TOE'));
          return;
        }

        const moveIdx = parseInt(arg, 10) - 1;
        const expectedPlayer = game.currentTurn === 'X' ? game.playerX : game.playerO;

        if (ctx.senderJid !== expectedPlayer && expectedPlayer !== 'BOT') {
          await ctx.reply(formatMessage(`⏳ It's not your turn! Waiting for @${expectedPlayer.split('@')[0]}`, 'TIC-TAC-TOE'), {
            mentions: [expectedPlayer]
          });
          return;
        }

        if (game.board[moveIdx] !== ' ') {
          await ctx.reply(formatMessage(`❌ Spot ${arg} is already taken! Pick an empty number.`, 'TIC-TAC-TOE'));
          return;
        }

        game.board[moveIdx] = game.currentTurn;

        // Check winner
        const win = checkWinner(game.board);
        if (win) {
          const winnerJid = expectedPlayer;
          const loserJid = game.currentTurn === 'X' ? game.playerO : game.playerX;

          await ctx.db.recordGameResult(winnerJid, 'tictactoe', 'win', 15, loserJid, ctx.msg.pushName || undefined);
          if (loserJid !== 'BOT') {
            await ctx.db.recordGameResult(loserJid, 'tictactoe', 'loss', 0, winnerJid);
          }

          const profile = await ctx.db.getUserGameProfile(winnerJid);

          const body =
            `🎉 *TIC-TAC-TOE GAME OVER*\n\n` +
            renderBoard(game.board) +
            `\n\n🏆 Winner: *${game.currentTurn}* (@${winnerJid.split('@')[0]})!\n` +
            `➕ *+15 Points* awarded! (Total: ${profile.score} pts)\n\n` +
            `_Type *.profile* to view full match history._`;

          await ctx.reply(formatMessage(body, 'TIC-TAC-TOE WINNER'), { mentions: [winnerJid] });
          activeTicTacToe.delete(ctx.chatJid);
          return;
        }

        // Check draw
        if (!game.board.includes(' ')) {
          await ctx.db.recordGameResult(game.playerX, 'tictactoe', 'draw', 5, game.playerO);
          if (game.playerO !== 'BOT') {
            await ctx.db.recordGameResult(game.playerO, 'tictactoe', 'draw', 5, game.playerX);
          }

          const body =
            `🤝 *TIC-TAC-TOE DRAW!*\n\n` +
            renderBoard(game.board) +
            `\n\nIt's a tie game! *+5 Points* awarded to both players.`;

          await ctx.reply(formatMessage(body, 'TIC-TAC-TOE'));
          activeTicTacToe.delete(ctx.chatJid);
          return;
        }

        // Switch turn
        game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';

        // If playing against BOT
        if (game.playerO === 'BOT' && game.currentTurn === 'O') {
          const emptyIndices = game.board.map((v, i) => (v === ' ' ? i : -1)).filter((i) => i !== -1);
          const botMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          game.board[botMove] = 'O';

          const botWin = checkWinner(game.board);
          if (botWin) {
            await ctx.db.recordGameResult(game.playerX, 'tictactoe', 'loss', 0, 'BOT');

            const body =
              `🤖 *BOT WON!*\n\n` +
              renderBoard(game.board) +
              `\n\nBetter luck next time, @${game.playerX.split('@')[0]}!`;

            await ctx.reply(formatMessage(body, 'TIC-TAC-TOE'), { mentions: [game.playerX] });
            activeTicTacToe.delete(ctx.chatJid);
            return;
          }

          game.currentTurn = 'X';
        }

        const body =
          `🎮 *TIC-TAC-TOE*\n\n` +
          renderBoard(game.board) +
          `\n\n👉 Next Turn: *${game.currentTurn}* (@${(game.currentTurn === 'X' ? game.playerX : game.playerO).split('@')[0]})\n` +
          `Type *.ttt <1-9>* to make your move!`;

        await ctx.reply(formatMessage(body, 'TIC-TAC-TOE'), {
          mentions: [game.currentTurn === 'X' ? game.playerX : game.playerO]
        });
        return;
      }

      // Start new game
      const opponent = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 'BOT';
      activeTicTacToe.set(ctx.chatJid, {
        board: Array(9).fill(' '),
        playerX: ctx.senderJid,
        playerO: opponent,
        currentTurn: 'X'
      });

      const body =
        `🎮 *TIC-TAC-TOE MATCH STARTED*\n\n` +
        `❌ *Player X*: @${ctx.senderJid.split('@')[0]}\n` +
        `⭕ *Player O*: ${opponent === 'BOT' ? '🤖 Bot' : `@${opponent.split('@')[0]}`}\n\n` +
        renderBoard(Array(9).fill(' ')) +
        `\n\n👉 Player X starts! Make a move: *.ttt <1-9>*`;

      await ctx.reply(formatMessage(body, 'TIC-TAC-TOE'), {
        mentions: opponent === 'BOT' ? [ctx.senderJid] : [ctx.senderJid, opponent]
      });
    }
  },
  {
    name: 'rps',
    category: 'Fun & Quotes',
    description: 'Play Rock, Paper, Scissors and log score to user profile',
    usage: '.rps <rock/paper/scissors>',
    handler: async (ctx: PluginContext) => {
      const choice = ctx.args[0]?.toLowerCase().trim();
      const valid = ['rock', 'paper', 'scissors'];

      if (!choice || !valid.includes(choice)) {
        await ctx.reply(formatMessage(`⚠️ *Usage*: *.rps <rock/paper/scissors>*\n\n_Example: .rps rock_`, 'ROCK PAPER SCISSORS'));
        return;
      }

      const botChoice = valid[Math.floor(Math.random() * valid.length)];
      const icons: Record<string, string> = { rock: '🪨 Rock', paper: '📄 Paper', scissors: '✂️ Scissors' };

      let result = '';
      const senderName = ctx.msg.pushName || undefined;

      if (choice === botChoice) {
        await ctx.db.recordGameResult(ctx.senderJid, 'rps', 'draw', 2, 'BOT', senderName);
        result = `🤝 *It's a Tie!* Both picked ${icons[choice]}.\n➕ *+2 Points*`;
      } else if (
        (choice === 'rock' && botChoice === 'scissors') ||
        (choice === 'paper' && botChoice === 'rock') ||
        (choice === 'scissors' && botChoice === 'paper')
      ) {
        await ctx.db.recordGameResult(ctx.senderJid, 'rps', 'win', 5, 'BOT', senderName);
        result = `🎉 *You Won!*\n• You: ${icons[choice]}\n• Bot: ${icons[botChoice]}\n➕ *+5 Points*`;
      } else {
        await ctx.db.recordGameResult(ctx.senderJid, 'rps', 'loss', 0, 'BOT', senderName);
        result = `💀 *Bot Won!*\n• You: ${icons[choice]}\n• Bot: ${icons[botChoice]}`;
      }

      const profile = await ctx.db.getUserGameProfile(ctx.senderJid);

      const body =
        `🎮 *ROCK PAPER SCISSORS*\n\n` +
        `${result}\n\n` +
        `📊 Total Score: *${profile.score} pts* (${getRankTitle(profile.score)})`;

      await ctx.reply(formatMessage(body, 'ROCK PAPER SCISSORS'));
    }
  },
  {
    name: 'roll',
    aliases: ['dice'],
    category: 'Fun & Quotes',
    description: 'Roll a 6-sided dice',
    usage: '.roll',
    handler: async (ctx: PluginContext) => {
      await ctx.react('🎲');
      const num = Math.floor(Math.random() * 6) + 1;
      const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      await ctx.reply(formatMessage(`🎲 *Dice Roll*: ${diceIcons[num - 1]} (${num})`, 'DICE ROLL'));
    }
  },
  {
    name: 'flip',
    aliases: ['coin'],
    category: 'Fun & Quotes',
    description: 'Flip a coin (Heads or Tails)',
    usage: '.flip',
    handler: async (ctx: PluginContext) => {
      await ctx.react('🪙');
      const isHeads = Math.random() < 0.5;
      await ctx.reply(formatMessage(`🪙 *Coin Flip*: *${isHeads ? 'HEADS' : 'TAILS'}*!`, 'COIN FLIP'));
    }
  },
  {
    name: 'profile',
    aliases: ['gamestats', 'rank', 'mygame'],
    category: 'Fun & Quotes',
    description: 'View personal user ID game profile, score, and win rate',
    usage: '.profile [@user or empty for yourself]',
    handler: async (ctx: PluginContext) => {
      const targetJid = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.senderJid;
      await ctx.react('👤');

      const profile = await ctx.db.getUserGameProfile(targetJid);
      const rank = getRankTitle(profile.score);
      const userNum = targetJid.split('@')[0];

      const body =
        `👤 *Player*: @${userNum}\n` +
        `🎖️ *Rank*: ${rank}\n` +
        `⭐ *Total Score*: ${profile.score} XP\n\n` +
        `📊 *Performance Record*:\n` +
        `• Total Games: ${profile.totalGames}\n` +
        `• 🏆 Wins: ${profile.wins}\n` +
        `• 💀 Losses: ${profile.losses}\n` +
        `• 🤝 Draws: ${profile.draws}\n` +
        `• 📈 Win Rate: ${profile.winRate}%\n\n` +
        `💡 _Play .quiz, .ttt, or .rps to level up!_`;

      await ctx.reply(formatMessage(body, 'PLAYER GAME PROFILE'), { mentions: [targetJid] });
    }
  },
  {
    name: 'gamehistory',
    aliases: ['myhistory', 'ghistory'],
    category: 'Fun & Quotes',
    description: 'View your recent game match history based on User ID',
    usage: '.gamehistory [@user or empty for yourself]',
    handler: async (ctx: PluginContext) => {
      const targetJid = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.senderJid;
      await ctx.react('📜');

      const history = await ctx.db.getUserGameHistory(targetJid, 8);
      const userNum = targetJid.split('@')[0];

      if (history.length === 0) {
        await ctx.reply(formatMessage(`📜 No game matches recorded yet for @${userNum}. Start playing with *.quiz*, *.ttt*, or *.rps*!`, 'MATCH HISTORY'), {
          mentions: [targetJid]
        });
        return;
      }

      let body = `👤 *Player*: @${userNum}\n\n`;

      history.forEach((h, idx) => {
        const timeStr = new Date(h.createdAt).toLocaleDateString();
        const icon = h.result === 'win' ? '🏆 WIN' : h.result === 'loss' ? '❌ LOSS' : '🤝 DRAW';
        const points = h.pointsChange > 0 ? `+${h.pointsChange}` : `${h.pointsChange}`;
        const opponent = h.opponentJid ? (h.opponentJid === 'BOT' ? '🤖 Bot' : `@${h.opponentJid.split('@')[0]}`) : 'Solo';

        body += `*${idx + 1}. ${h.gameName.toUpperCase()}* (${icon})\n`;
        body += `   • Vs: ${opponent} | Pts: ${points}\n`;
        body += `   • Date: ${timeStr}\n\n`;
      });

      await ctx.reply(formatMessage(body, 'MATCH HISTORY'), { mentions: [targetJid] });
    }
  },
  {
    name: 'leaderboard',
    aliases: ['topgames', 'top'],
    category: 'Fun & Quotes',
    description: 'View the global gaming leaderboard ranking top players',
    usage: '.leaderboard',
    handler: async (ctx: PluginContext) => {
      await ctx.react('🏆');
      const leaders = await ctx.db.getGameLeaderboard(10);

      if (leaders.length === 0) {
        await ctx.reply(formatMessage(`🏆 No leaderboard rankings yet. Play *.quiz*, *.ttt*, or *.rps* to claim the top spot!`, 'LEADERBOARD'));
        return;
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const mentions: string[] = [];
      let body = `🏆 *TOP 10 PLAYERS*:\n\n`;

      leaders.forEach((p, idx) => {
        const medal = medals[idx] || `${idx + 1}.`;
        const userNum = p.jid.split('@')[0];
        mentions.push(p.jid);
        body += `${medal} @${userNum}\n`;
        body += `   • Score: *${p.score} pts* | Wins: *${p.wins}* (${p.winRate}%)\n\n`;
      });

      await ctx.reply(formatMessage(body, 'GLOBAL LEADERBOARD'), { mentions });
    }
  }
];

function decodeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function renderBoard(board: string[]): string {
  const b = board.map((v, i) => (v === ' ' ? `${i + 1}️⃣` : v === 'X' ? '❌' : '⭕'));
  return (
    `┌───┬───┬───┐\n` +
    `│ ${b[0]} │ ${b[1]} │ ${b[2]} │\n` +
    `├───┼───┼───┤\n` +
    `│ ${b[3]} │ ${b[4]} │ ${b[5]} │\n` +
    `├───┼───┼───┤\n` +
    `│ ${b[6]} │ ${b[7]} │ ${b[8]} │\n` +
    `└───┴───┴───┘`
  );
}

function checkWinner(board: string[]): boolean {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
      return true;
    }
  }
  return false;
}
