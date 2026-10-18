import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import type { MessageRepository } from './db.js'

const mediaDir = path.resolve(process.env.MEDIA_DIR ?? './data/media')
const MAX_BODY_SIZE = 64 * 1024

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function authorized(req: http.IncomingMessage) {
  const token = process.env.DASHBOARD_TOKEN ?? ''
  if (!token) return false
  const authHeader = req.headers.authorization
  if (!authHeader) return false
  return safeCompare(authHeader, `Bearer ${token}`)
}

export function startDashboard(repo: MessageRepository) {
  const port = Number(process.env.DASHBOARD_PORT ?? 8788)
  const server = http.createServer(async (req, res) => {
    if (!authorized(req)) { res.writeHead(401, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'unauthorized' })); return }
    try {
      if (req.method === 'GET' && req.url === '/api/status') {
        const files = await fs.readdir(mediaDir).catch(() => [])
        const body = { ok: true, service: 'BOT_404', mediaFiles: files.length, dashboard: 'localhost-only' }
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); return
      }
      if (req.method === 'POST' && req.url === '/api/trusted') {
        const chunks: Buffer[] = []
        let totalBytes = 0
        for await (const chunk of req) {
          const buf = Buffer.from(chunk)
          totalBytes += buf.length
          if (totalBytes > MAX_BODY_SIZE) {
            res.writeHead(413, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'payload_too_large' }))
            return
          }
          chunks.push(buf)
        }
        let body: { jid?: string; type?: 'user' | 'group'; note?: string }
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          res.writeHead(400, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ error: 'invalid_json' }))
          return
        }
        if (!body.jid || !body.type) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'jid and type required' })); return }
        await repo.pool.execute('INSERT INTO trusted_entities (jid, entity_type, note) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE entity_type=VALUES(entity_type), note=VALUES(note)', [body.jid, body.type, body.note ?? null])
        res.writeHead(201, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true })); return
      }
      res.writeHead(404, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'not_found' }))
    } catch (error) { console.error('dashboard request failed', error); res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'internal_error' })) }
  })
  server.listen(port, '127.0.0.1')
  return server
}
