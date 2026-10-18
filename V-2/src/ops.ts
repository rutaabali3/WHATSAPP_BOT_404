import http from 'node:http'

const buckets = new Map<string, { started: number; count: number }>()
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
const MAX_COMMANDS = Number(process.env.RATE_LIMIT_MAX_COMMANDS ?? 30)

export function allowCommand(jid: string) {
  const now = Date.now()
  const current = buckets.get(jid)
  if (!current || now - current.started >= WINDOW_MS) {
    buckets.set(jid, { started: now, count: 1 })
    // Periodically clean up expired rate-limit entries to prevent memory leaks in long-running instances
    if (buckets.size > 100) {
      for (const [key, bucket] of buckets.entries()) {
        if (now - bucket.started >= WINDOW_MS) buckets.delete(key)
      }
    }
    return true
  }
  if (current.count >= MAX_COMMANDS) return false
  current.count++
  return true
}

export function logEvent(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }))
}

export function startHealthServer(getStatus: () => Promise<Record<string, unknown>> | Record<string, unknown>) {
  const port = Number(process.env.HEALTH_PORT ?? 8787)
  const server = http.createServer(async (req, res) => {
    if (req.url !== '/health' && req.url !== '/ready') { res.writeHead(404); res.end('not found'); return }
    try {
      const body = JSON.stringify(await getStatus())
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(body)
    } catch { res.writeHead(503); res.end(JSON.stringify({ ok: false })) }
  })
  server.listen(port, '127.0.0.1', () => logEvent('health_server_started', { port }))
  return server
}
