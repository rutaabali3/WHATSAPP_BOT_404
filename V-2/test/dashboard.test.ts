import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

test('startDashboard includes X-Content-Type-Options: nosniff header on responses', async () => {
  const dummyRepo = {
    pool: {}
  } as any

  const server = startDashboard(dummyRepo)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }

  try {
    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      http.get(`http://127.0.0.1:${address.port}/api/status`, resolve).on('error', reject)
    })

    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff')
  } finally {
    server.close()
  }
})
