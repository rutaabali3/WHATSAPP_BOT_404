import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface StoredMessage {
  id?: string;
  messageId?: string;
  jid?: string;
  chatJid?: string;
  senderJid: string;
  participantJid?: string;
  isFromMe?: boolean;
  messageType: string;
  content?: string;
  textBody?: string;
  caption?: string;
  quotedMessageId?: string;
  rawPayload?: unknown;
  rawMessage?: unknown;
  mediaPath?: string;
  mediaMimetype?: string;
  mediaFilename?: string;
  hasMedia?: boolean;
  createdAt?: string | Date;
  revokedAt?: string | Date;
}

export interface StoredEdit {
  id: number;
  messageId: string;
  chatJid: string;
  senderJid: string;
  originalText?: string;
  editedText: string;
  createdAt: string | Date;
}

export interface UserGameProfile {
  jid: string;
  displayName?: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
  winRate: number;
}

export interface UserGameHistoryItem {
  id: number;
  jid: string;
  gameName: string;
  opponentJid?: string;
  result: 'win' | 'loss' | 'draw';
  pointsChange: number;
  details?: any;
  createdAt: string | Date;
}

export interface DbConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

export async function ensureMediaDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeMedia(dir: string, messageId: string, extension: string, buffer: Buffer): Promise<string> {
  await ensureMediaDir(dir);
  const safeId = messageId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeId}.${extension.replace(/^\./, '')}`;
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
}

export class MessageRepository {
  readonly pool: Pool;
  private initialized = false;
  private config: DbConfig;

  constructor(config?: DbConfig) {
    this.config = config || {};
    this.pool = mysql.createPool({
      host: this.config.host ?? process.env.DB_HOST ?? '127.0.0.1',
      port: this.config.port ?? Number(process.env.DB_PORT ?? 3306),
      database: this.config.database ?? process.env.DB_NAME ?? 'bot_404',
      user: this.config.user ?? process.env.DB_USER ?? 'root',
      password: this.config.password ?? process.env.DB_PASSWORD ?? '',
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4'
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('[DB] Connection check failed:', (error as Error).message);
      return false;
    }
  }

  async initializeSchema(): Promise<void> {
    return this.initSchema();
  }

  async initSchema(): Promise<void> {
    if (this.initialized) return;

    // 1. Ensure the database itself exists in MariaDB/MySQL
    try {
      const bootstrapConn = await mysql.createConnection({
        host: this.config.host ?? process.env.DB_HOST ?? '127.0.0.1',
        port: this.config.port ?? Number(process.env.DB_PORT ?? 3306),
        user: this.config.user ?? process.env.DB_USER ?? 'root',
        password: this.config.password ?? process.env.DB_PASSWORD ?? ''
      });
      const dbName = this.config.database ?? process.env.DB_NAME ?? 'bot_404';
      await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await bootstrapConn.end();
    } catch (err: any) {
      console.warn('[DB] Pre-schema database creation notice:', err.message);
    }

    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS bot_messages (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          message_id VARCHAR(255) NOT NULL,
          chat_jid VARCHAR(255) NOT NULL,
          sender_jid VARCHAR(255) NOT NULL,
          participant_jid VARCHAR(255) NULL,
          is_from_me TINYINT(1) NOT NULL DEFAULT 0,
          message_type VARCHAR(64) NOT NULL,
          text_body TEXT NULL,
          caption TEXT NULL,
          quoted_message_id VARCHAR(255) NULL,
          raw_message JSON NOT NULL,
          media_path VARCHAR(1024) NULL,
          media_mimetype VARCHAR(255) NULL,
          media_filename VARCHAR(255) NULL,
          created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          revoked_at TIMESTAMP(3) NULL,
          UNIQUE KEY uq_message_id (message_id),
          KEY idx_chat_created (chat_jid, created_at),
          KEY idx_quoted_message (quoted_message_id),
          KEY idx_created (created_at)
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS bot_edits (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          message_id VARCHAR(255) NOT NULL,
          chat_jid VARCHAR(255) NOT NULL,
          sender_jid VARCHAR(255) NOT NULL,
          original_text TEXT NULL,
          edited_text TEXT NOT NULL,
          created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          KEY idx_edit_msg (message_id),
          KEY idx_edit_chat (chat_jid, created_at)
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS bot_ai_interactions (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          jid VARCHAR(255) NOT NULL,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL,
          source VARCHAR(64) NOT NULL DEFAULT 'mention_guide',
          latency_ms INT UNSIGNED NULL,
          tokens_used INT UNSIGNED NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_ai_jid (jid, created_at)
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS bot_settings (
          setting_key VARCHAR(128) NOT NULL PRIMARY KEY,
          setting_value TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        INSERT INTO bot_settings (setting_key, setting_value) VALUES
          ('antidelete', 'on'),
          ('antiedit', 'on'),
          ('antistatus', 'on'),
          ('autostatus', 'off'),
          ('smartmode', 'off'),
          ('bot_enabled', 'on'),
          ('prefix', '.'),
          ('message_retention_days', '30')
        ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS trusted_entities (
          jid VARCHAR(255) NOT NULL PRIMARY KEY,
          entity_type ENUM('user','group') NOT NULL,
          note VARCHAR(255) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          endpoint VARCHAR(128) NOT NULL,
          latency_ms INT UNSIGNED NOT NULL,
          status INT NOT NULL,
          is_fallback TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          KEY idx_usage_created (created_at)
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS bot_audit_log (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          event_name VARCHAR(128) NOT NULL,
          actor_jid VARCHAR(255) NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'success',
          details JSON NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          KEY idx_audit_created (created_at),
          KEY idx_audit_event (event_name)
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS user_game_profiles (
          jid VARCHAR(255) NOT NULL PRIMARY KEY,
          display_name VARCHAR(255) NULL,
          total_games INT UNSIGNED NOT NULL DEFAULT 0,
          wins INT UNSIGNED NOT NULL DEFAULT 0,
          losses INT UNSIGNED NOT NULL DEFAULT 0,
          draws INT UNSIGNED NOT NULL DEFAULT 0,
          score INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_game_score (score DESC)
        ) ENGINE=InnoDB;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS user_game_history (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          jid VARCHAR(255) NOT NULL,
          game_name VARCHAR(64) NOT NULL,
          opponent_jid VARCHAR(255) NULL,
          result ENUM('win', 'loss', 'draw') NOT NULL,
          points_change INT NOT NULL DEFAULT 0,
          details JSON NULL,
          created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          KEY idx_user_history (jid, created_at)
        ) ENGINE=InnoDB;
      `);

      // Automatic migrations for existing schemas
      const migrations = [
        'ALTER TABLE bot_ai_interactions ADD COLUMN latency_ms INT UNSIGNED NULL',
        'ALTER TABLE bot_ai_interactions ADD COLUMN tokens_used INT UNSIGNED NULL',
        'ALTER TABLE bot_audit_log ADD COLUMN actor_jid VARCHAR(255) NULL',
        'ALTER TABLE bot_audit_log ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT "success"',
        'ALTER TABLE api_usage ADD COLUMN endpoint VARCHAR(128) NULL',
        'ALTER TABLE api_usage ADD COLUMN latency_ms INT UNSIGNED NULL',
        'ALTER TABLE api_usage ADD COLUMN status INT NULL',
        'ALTER TABLE api_usage ADD COLUMN is_fallback TINYINT(1) NOT NULL DEFAULT 0'
      ];

      for (const sql of migrations) {
        try {
          await this.pool.query(sql);
        } catch (mErr: any) {
          // Ignore ER_DUP_FIELDNAME (1060) if column already exists
          if (mErr.errno !== 1060 && mErr.code !== 'ER_DUP_FIELDNAME') {
            // ignore
          }
        }
      }

      this.initialized = true;
    } catch (err) {
      console.warn('[DB] Schema init warning:', (err as Error).message);
    }
  }

  async saveMessage(message: StoredMessage): Promise<void> {
    try {
      const msgId = message.id || message.messageId || '';
      const chatJid = message.jid || message.chatJid || '';
      const content = message.content ?? message.textBody ?? null;
      const raw = message.rawPayload ?? message.rawMessage ?? {};

      await this.pool.execute(
        `INSERT INTO bot_messages
         (message_id, chat_jid, sender_jid, participant_jid, is_from_me, message_type, text_body, caption,
          quoted_message_id, raw_message, media_path, media_mimetype, media_filename)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           raw_message=VALUES(raw_message),
           media_path=COALESCE(VALUES(media_path), media_path),
           text_body=COALESCE(VALUES(text_body), text_body),
           caption=COALESCE(VALUES(caption), caption)`,
        [
          msgId,
          chatJid,
          message.senderJid,
          message.participantJid ?? null,
          message.isFromMe ? 1 : 0,
          message.messageType,
          content,
          message.caption ?? null,
          message.quotedMessageId ?? null,
          JSON.stringify(raw),
          message.mediaPath ?? null,
          message.mediaMimetype ?? null,
          message.mediaFilename ?? null
        ]
      );
    } catch (err) {
      console.error('[DB] Failed to save message:', (err as Error).message);
    }
  }

  async getMessageById(messageId: string): Promise<any | null> {
    return this.findMessage(messageId);
  }

  async findMessage(messageId: string): Promise<any | null> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT message_id AS id, message_id AS messageId, chat_jid AS jid, chat_jid AS chatJid, 
         sender_jid AS sender_jid, sender_jid AS senderJid,
         participant_jid AS participantJid, is_from_me AS isFromMe, message_type AS message_type, 
         message_type AS messageType, text_body AS content, text_body AS textBody, 
         caption, quoted_message_id AS quotedMessageId, raw_message AS rawMessage,
         media_path AS media_path, media_path AS mediaPath, 
         media_mimetype AS mediaMimetype, media_filename AS mediaFilename,
         (media_path IS NOT NULL) AS has_media,
         created_at AS created_at, created_at AS createdAt, 
         revoked_at AS revoked_at, revoked_at AS revokedAt
         FROM bot_messages WHERE message_id = ? LIMIT 1`,
        [messageId]
      );
      if (!rows[0]) return null;
      const row = rows[0];
      return {
        ...row,
        isFromMe: Boolean(row.isFromMe),
        has_media: Boolean(row.media_path),
        content: row.content || row.caption || '',
        rawMessage: typeof row.rawMessage === 'string' ? JSON.parse(row.rawMessage) : row.rawMessage
      };
    } catch (err) {
      console.error('[DB] findMessage error:', (err as Error).message);
      return null;
    }
  }

  async markDeleted(messageId: string): Promise<void> {
    return this.markRevoked(messageId);
  }

  async markRevoked(messageId: string): Promise<void> {
    try {
      await this.pool.execute('UPDATE bot_messages SET revoked_at = CURRENT_TIMESTAMP(3) WHERE message_id = ?', [messageId]);
    } catch (err) {
      console.error('[DB] markRevoked error:', (err as Error).message);
    }
  }

  async updateMessageContent(messageId: string, content: string): Promise<void> {
    try {
      await this.pool.execute('UPDATE bot_messages SET text_body = ? WHERE message_id = ?', [content, messageId]);
    } catch (err) {
      console.error('[DB] updateMessageContent error:', (err as Error).message);
    }
  }

  async logEdit(messageId: string, originalText: string, editedText: string): Promise<void> {
    const msg = await this.findMessage(messageId);
    return this.saveEdit(messageId, msg?.chatJid || '', msg?.senderJid || '', originalText, editedText);
  }

  async saveEdit(messageId: string, chatJid: string, senderJid: string, originalText: string | null, editedText: string): Promise<void> {
    try {
      await this.pool.execute(
        `INSERT INTO bot_edits (message_id, chat_jid, sender_jid, original_text, edited_text)
         VALUES (?, ?, ?, ?, ?)`,
        [messageId, chatJid, senderJid, originalText, editedText]
      );
    } catch (err) {
      console.error('[DB] Failed to save edit:', (err as Error).message);
    }
  }

  async logAudit(action: string, actorJid: string = 'system', status: string = 'success', details: unknown = {}): Promise<void> {
    try {
      await this.pool.execute(
        'INSERT INTO bot_audit_log (event_name, actor_jid, status, details) VALUES (?, ?, ?, ?)',
        [action, actorJid, status, JSON.stringify(details)]
      );
    } catch (err) {
      console.error('[DB] logAudit error:', (err as Error).message);
    }
  }

  async recordAudit(eventName: string, jid: string | null, details: unknown = {}): Promise<void> {
    return this.logAudit(eventName, jid || 'system', 'success', details);
  }

  async logApiUsage(endpoint: string, latencyMs: number, status: number, isFallback: boolean): Promise<void> {
    try {
      await this.pool.execute(
        'INSERT INTO api_usage (endpoint, latency_ms, status, is_fallback) VALUES (?, ?, ?, ?)',
        [endpoint, latencyMs, status, isFallback ? 1 : 0]
      );
    } catch {}
  }

  async logAiInteraction(
    jid: string,
    senderJidOrPrompt: string,
    promptOrResponse: string,
    responseOrSource?: string,
    latencyMs?: number,
    tokensUsed?: number
  ): Promise<void> {
    try {
      let prompt = senderJidOrPrompt;
      let response = promptOrResponse;
      let source = responseOrSource || 'guide';

      if (tokensUsed !== undefined) {
        prompt = promptOrResponse;
        response = responseOrSource || '';
        source = 'ai_guide';
      }

      await this.pool.execute(
        'INSERT INTO bot_ai_interactions (jid, prompt, response, source, latency_ms, tokens_used) VALUES (?, ?, ?, ?, ?, ?)',
        [jid, prompt, response, source, latencyMs ?? null, tokensUsed ?? null]
      );
    } catch (err) {
      console.error('[DB] logAiInteraction error:', (err as Error).message);
    }
  }

  async getSetting(key: string, defaultValue = ''): Promise<string> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT setting_value FROM bot_settings WHERE setting_key = ? LIMIT 1',
        [key]
      );
      if (rows.length && rows[0].setting_value !== undefined) {
        return String(rows[0].setting_value);
      }
    } catch {}
    return defaultValue;
  }

  async setSetting(key: string, value: string): Promise<void> {
    try {
      await this.pool.execute(
        'INSERT INTO bot_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, value]
      );
    } catch (err) {
      console.error('[DB] setSetting error:', (err as Error).message);
    }
  }

  async cleanupOldMessages(retentionDays: number): Promise<number> {
    try {
      const [res]: any = await this.pool.execute('DELETE FROM bot_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
      await this.pool.execute('DELETE FROM bot_edits WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
      await this.pool.execute('DELETE FROM bot_ai_interactions WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
      await this.pool.execute('DELETE FROM api_usage WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 DAY)');
      await this.pool.execute('DELETE FROM bot_audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)');
      return res?.affectedRows || 0;
    } catch (err) {
      console.error('[DB] Cleanup failed:', (err as Error).message);
      return 0;
    }
  }

  async cleanup(retentionDays: number): Promise<void> {
    await this.cleanupOldMessages(retentionDays);
  }

  async getStats(): Promise<Record<string, number>> {
    try {
      const [[msgCount]]: any = await this.pool.query('SELECT COUNT(*) as c FROM bot_messages');
      const [[editCount]]: any = await this.pool.query('SELECT COUNT(*) as c FROM bot_edits');
      const [[mediaCount]]: any = await this.pool.query('SELECT COUNT(*) as c FROM bot_messages WHERE media_path IS NOT NULL');
      const [[aiCount]]: any = await this.pool.query('SELECT COUNT(*) as c FROM bot_ai_interactions');

      return {
        totalMessages: Number(msgCount?.c ?? 0),
        totalEdits: Number(editCount?.c ?? 0),
        totalMedia: Number(mediaCount?.c ?? 0),
        aiInteractions: Number(aiCount?.c ?? 0),
        databaseSizeMb: 12
      };
    } catch {
      return { totalMessages: 0, totalEdits: 0, totalMedia: 0, aiInteractions: 0, databaseSizeMb: 0 };
    }
  }

  async recordGameResult(
    jid: string,
    gameName: string,
    result: 'win' | 'loss' | 'draw',
    pointsChange: number,
    opponentJid?: string,
    displayName?: string,
    details?: any
  ): Promise<void> {
    try {
      const winInc = result === 'win' ? 1 : 0;
      const lossInc = result === 'loss' ? 1 : 0;
      const drawInc = result === 'draw' ? 1 : 0;

      await this.pool.execute(
        `INSERT INTO user_game_profiles (jid, display_name, total_games, wins, losses, draws, score)
         VALUES (?, ?, 1, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           display_name = COALESCE(VALUES(display_name), display_name),
           total_games = total_games + 1,
           wins = wins + ?,
           losses = losses + ?,
           draws = draws + ?,
           score = score + ?`,
        [jid, displayName ?? null, winInc, lossInc, drawInc, pointsChange, winInc, lossInc, drawInc, pointsChange]
      );

      await this.pool.execute(
        `INSERT INTO user_game_history (jid, game_name, opponent_jid, result, points_change, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [jid, gameName, opponentJid ?? null, result, pointsChange, details ? JSON.stringify(details) : null]
      );
    } catch (err) {
      console.error('[DB] recordGameResult error:', (err as Error).message);
    }
  }

  async getUserGameProfile(jid: string): Promise<UserGameProfile> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT jid, display_name AS displayName, total_games AS totalGames,
                wins, losses, draws, score
         FROM user_game_profiles WHERE jid = ? LIMIT 1`,
        [jid]
      );
      if (rows.length > 0) {
        const r = rows[0];
        const total = Number(r.totalGames) || 0;
        const wins = Number(r.wins) || 0;
        return {
          jid: r.jid,
          displayName: r.displayName,
          totalGames: total,
          wins,
          losses: Number(r.losses) || 0,
          draws: Number(r.draws) || 0,
          score: Number(r.score) || 0,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0
        };
      }
    } catch {}

    return {
      jid,
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
      winRate: 0
    };
  }

  async getUserGameHistory(jid: string, limit = 10): Promise<UserGameHistoryItem[]> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT id, jid, game_name AS gameName, opponent_jid AS opponentJid,
                result, points_change AS pointsChange, details, created_at AS createdAt
         FROM user_game_history WHERE jid = ? ORDER BY id DESC LIMIT ?`,
        [jid, String(limit)]
      );
      return rows.map((r) => ({
        id: Number(r.id),
        jid: r.jid,
        gameName: r.gameName,
        opponentJid: r.opponentJid,
        result: r.result,
        pointsChange: Number(r.pointsChange),
        details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
        createdAt: r.createdAt
      }));
    } catch {
      return [];
    }
  }

  async getGameLeaderboard(limit = 10): Promise<UserGameProfile[]> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT jid, display_name AS displayName, total_games AS totalGames,
                wins, losses, draws, score
         FROM user_game_profiles ORDER BY score DESC, wins DESC LIMIT ?`,
        [String(limit)]
      );
      return rows.map((r) => {
        const total = Number(r.totalGames) || 0;
        const wins = Number(r.wins) || 0;
        return {
          jid: r.jid,
          displayName: r.displayName,
          totalGames: total,
          wins,
          losses: Number(r.losses) || 0,
          draws: Number(r.draws) || 0,
          score: Number(r.score) || 0,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0
        };
      });
    } catch {
      return [];
    }
  }

  async getBroadcastRecipients(): Promise<string[]> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT DISTINCT sender_jid AS senderJid FROM bot_messages 
         WHERE sender_jid NOT LIKE '%@g.us' AND sender_jid NOT LIKE '%@broadcast' 
         ORDER BY id DESC LIMIT 500`
      );
      return rows.map((r) => r.senderJid).filter((jid: string) => jid && jid.includes('@s.whatsapp.net'));
    } catch {
      return [];
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
