import mysql, { Pool, RowDataPacket } from 'mysql2/promise'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { AnyMessageContent } from '@whiskeysockets/baileys'

export type StoredMessage = {
  messageId: string
  chatJid: string
  senderJid: string
  participantJid?: string
  messageType: string
  textBody?: string
  caption?: string
  quotedMessageId?: string
  rawMessage: unknown
  mediaPath?: string
  mediaMimetype?: string
  mediaFilename?: string
}

type StoredRow = StoredMessage & RowDataPacket

export class MessageRepository {
  readonly pool: Pool
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME ?? 'bot_404',
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4'
    })
  }

  async ping() { await this.pool.query('SELECT 1') }

  async saveMessage(message: StoredMessage) {
    await this.pool.execute(
      `INSERT INTO bot_messages
       (message_id, chat_jid, sender_jid, participant_jid, message_type, text_body, caption,
        quoted_message_id, raw_message, media_path, media_mimetype, media_filename)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE raw_message=VALUES(raw_message), media_path=COALESCE(VALUES(media_path), media_path)`,
      [message.messageId, message.chatJid, message.senderJid, message.participantJid ?? null,
       message.messageType, message.textBody ?? null, message.caption ?? null,
       message.quotedMessageId ?? null, JSON.stringify(message.rawMessage), message.mediaPath ?? null,
       message.mediaMimetype ?? null, message.mediaFilename ?? null]
    )
  }

  async findMessage(messageId: string): Promise<StoredMessage | null> {
    const [rows] = await this.pool.execute<StoredRow[]>(
      `SELECT message_id AS messageId, chat_jid AS chatJid, sender_jid AS senderJid,
       participant_jid AS participantJid, message_type AS messageType, text_body AS textBody,
       caption, quoted_message_id AS quotedMessageId, raw_message AS rawMessage,
       media_path AS mediaPath, media_mimetype AS mediaMimetype, media_filename AS mediaFilename
       FROM bot_messages WHERE message_id = ? LIMIT 1`, [messageId])
    if (!rows[0]) return null
    const row = rows[0]
    return { ...row, rawMessage: typeof row.rawMessage === 'string' ? JSON.parse(row.rawMessage) : row.rawMessage }
  }

  async markRevoked(messageId: string) {
    await this.pool.execute('UPDATE bot_messages SET revoked_at = CURRENT_TIMESTAMP(3) WHERE message_id = ?', [messageId])
  }

  async cleanup(retentionDays: number) {
    await this.pool.execute('DELETE FROM bot_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays])
    await this.pool.execute('DELETE FROM api_usage WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 DAY)')
    await this.pool.execute('DELETE FROM bot_audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)')
  }

  async isTrusted(jid: string) {
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT jid FROM trusted_entities WHERE jid = ? LIMIT 1', [jid])
    return rows.length > 0
  }

  async recordAudit(eventName: string, jid: string | null, details: unknown = {}) {
    await this.pool.execute('INSERT INTO bot_audit_log (event_name, jid, details) VALUES (?, ?, ?)', [eventName, jid, JSON.stringify(details)])
  }

  async allowApiRequest(jid: string, commandName: string, cooldownSeconds: number) {
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT id FROM api_usage WHERE jid = ? AND command_name = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND) LIMIT 1', [jid, commandName, cooldownSeconds])
    if (rows.length) return false
    await this.pool.execute('INSERT INTO api_usage (jid, command_name, request_key) VALUES (?, ?, ?)', [jid, commandName, `${jid}:${commandName}`])
    return true
  }

  async close() { await this.pool.end() }
}

export async function ensureMediaDir(dir: string) { await fs.mkdir(path.resolve(dir), { recursive: true }) }
export async function writeMedia(dir: string, messageId: string, ext: string, data: Buffer) {
  const baseDir = path.resolve(dir)
  const safeExt = ext.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'bin'
  const safeId = messageId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filePath = path.resolve(baseDir, `${safeId}.${safeExt}`)

  // Security: Prevent path traversal out of the designated media directory
  if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
    throw new Error('Path traversal attempt detected in writeMedia')
  }

  await fs.writeFile(filePath, data)
  return filePath
}

export function mediaContent(row: StoredMessage): AnyMessageContent | null {
  if (!row.mediaPath || !row.mediaMimetype) return null
  return { document: { url: row.mediaPath }, mimetype: row.mediaMimetype, fileName: row.mediaFilename ?? 'recovered-file' }
}
